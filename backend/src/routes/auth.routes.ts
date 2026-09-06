/**
 * ============================================================================
 * RentOS - Rutas de Autenticación, Usuarios y Control de Sesión (JWT)
 * ============================================================================
 * Maneja:
 * - Inicio de sesión con Bloqueo Progresivo estricto (3 fallos -> 5m, 15m, 30m, 1h, 6h, 24h).
 * - Recuperación segura de contraseñas mediante tokens SHA-256 de 15 minutos (un solo uso).
 * - Despacho de recuperación de SuperAdmin al canal autorizado 'rentosrd@gmail.com'.
 * - Invalidación atómica de sesiones previas tras restablecer contraseña.
 * - Desbloqueo administrativo manual por parte de SuperAdmin.
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RolUsuario } from "@prisma/client";
import prisma from "../lib/prisma.js";
import {
  calcularTiempoBloqueo,
  obtenerTiempoRestante,
  registrarAuditoria,
  crearTokenRecuperacion,
  verificarTokenRecuperacion,
  ejecutarRestablecimientoPassword,
  desbloquearCuentaAdmin,
  CORREO_RECUPERACION_SUPERADMIN,
  MINUTOS_VIGENCIA_TOKEN,
} from "../services/security.service.js";
import { despacharEnlaceRecuperacion } from "../services/email.service.js";
import { enviarAlerta } from "../services/alert.service.js";

const router = Router();

// Clave secreta para firmar tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || "rentos_super_secret_jwt_key_2026";

/**
 * Función auxiliar para asegurar la existencia de los usuarios base de demostración.
 * NOTA DE SEGURIDAD: Se utiliza `update: {}` para NUNCA sobreescribir contraseñas
 * modificadas por los administradores o restablecidas en producción.
 */
async function asegurarUsuariosIniciales() {
  const hash = await bcrypt.hash("admin123", 10);

  // 1. SuperAdmin Global Único y Oficial
  await prisma.usuario.upsert({
    where: { email: CORREO_RECUPERACION_SUPERADMIN },
    update: { rol: RolUsuario.SUPERADMIN, activo: true },
    create: {
      nombre: "SuperAdministrador Global",
      email: CORREO_RECUPERACION_SUPERADMIN,
      password: hash,
      rol: RolUsuario.SUPERADMIN,
      rentCarId: null,
      activo: true,
    },
  });

  // 2. Administrador RentCar Santo Domingo (Tenant Principal #1)
  await prisma.usuario.upsert({
    where: { email: "admin@rentos.local" },
    update: {},
    create: {
      nombre: "Administrador Santo Domingo",
      email: "admin@rentos.local",
      password: hash,
      rol: RolUsuario.ADMIN_RENTCAR,
      rentCarId: 1,
      activo: true,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "admin@rentcar.com" },
    update: {},
    create: {
      nombre: "Administrador RentCar",
      email: "admin@rentcar.com",
      password: hash,
      rol: RolUsuario.ADMIN_RENTCAR,
      rentCarId: 1,
      activo: true,
    },
  });

  // 3. Administrador RentCar Punta Cana (Tenant Secundario #2)
  const rentCarPuntaCana = await prisma.rentCar.findFirst({ where: { id: 2 } });
  if (rentCarPuntaCana) {
    await prisma.usuario.upsert({
      where: { email: "puntacana@rentos.do" },
      update: {},
      create: {
        nombre: "Administrador Punta Cana",
        email: "puntacana@rentos.do",
        password: hash,
        rol: RolUsuario.ADMIN_RENTCAR,
        rentCarId: 2,
        activo: true,
      },
    });
  }

  // 4. Empleado / Asesor de Mostrador
  await prisma.usuario.upsert({
    where: { email: "juan@rentos.do" },
    update: {},
    create: {
      nombre: "Juan Pérez (Asesor)",
      email: "juan@rentos.do",
      password: hash,
      rol: RolUsuario.EMPLEADO,
      rentCarId: 1,
      activo: true,
    },
  });
}

// ----------------------------------------------------------------------------
// GET /api/auth/identificar-empresa
// ----------------------------------------------------------------------------
// Detección dinámica y pública de empresa/logo para el formulario de login
router.get("/identificar-empresa", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return res.json({
        tipo: "DEFAULT",
        nombreEmpresa: "RentOS",
        logoUrl: null,
        eslogan: "Rent Operating System • Acceso Seguro",
        colorPrimario: "#0284c7",
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: {
        rentCar: {
          select: {
            id: true,
            nombre: true,
            logoUrl: true,
            eslogan: true,
            colorPrimario: true,
            ciudad: true,
          },
        },
      },
    });

    if (!usuario) {
      return res.json({
        tipo: "DESCONOCIDO",
        nombreEmpresa: "RentOS",
        logoUrl: null,
        eslogan: "Rent Operating System • Acceso Seguro",
        colorPrimario: "#0284c7",
      });
    }

    if (usuario.rol === RolUsuario.SUPERADMIN || !usuario.rentCar) {
      return res.json({
        tipo: "SUPERADMIN",
        nombreEmpresa: "RentOS Global",
        logoUrl: null,
        eslogan: "Consola de Administración Central Multi-Tenant",
        colorPrimario: "#0284c7",
        rol: usuario.rol,
      });
    }

    return res.json({
      tipo: "EMPRESA",
      nombreEmpresa: usuario.rentCar.nombre,
      logoUrl: usuario.rentCar.logoUrl,
      eslogan: usuario.rentCar.eslogan || `Portal Operativo • ${usuario.rentCar.ciudad || "República Dominicana"}`,
      colorPrimario: usuario.rentCar.colorPrimario || "#0284c7",
      rol: usuario.rol,
    });
  } catch (error) {
    console.error("Error al identificar empresa para login:", error);
    return res.json({
      tipo: "DEFAULT",
      nombreEmpresa: "RentOS",
      logoUrl: null,
      eslogan: "Rent Operating System • Acceso Seguro",
      colorPrimario: "#0284c7",
    });
  }
});

// ----------------------------------------------------------------------------
// POST /api/auth/login
// ----------------------------------------------------------------------------
// Inicio de sesión protegido con Bloqueo Progresivo en Backend
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos." });
    }

    await asegurarUsuariosIniciales();

    const emailTrim = String(email).trim().toLowerCase();
    const usuario = await prisma.usuario.findUnique({
      where: { email: emailTrim },
      include: { rentCar: true },
    });

    if (!usuario) {
      // Registro en auditoría y mensaje genérico para evitar enumeración
      await registrarAuditoria("LOGIN_FALLIDO_DESCONOCIDO", emailTrim, {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        detalles: "Intento de inicio de sesión con correo no registrado.",
      });
      return res.status(401).json({ error: "Credenciales inválidas o usuario no registrado." });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: "Esta cuenta de usuario ha sido desactivada." });
    }

    // 1. Verificación de Bloqueo Temporal Activo
    const tiempoBloqueo = obtenerTiempoRestante(usuario.bloqueadoHasta);
    if (tiempoBloqueo.activo) {
      await registrarAuditoria("INTENTO_EN_BLOQUEO", usuario.email, {
        usuarioId: usuario.id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        detalles: `Intento de acceso mientras la cuenta está bloqueada. Nivel: ${usuario.bloqueosConsecutivos}. Restante: ${tiempoBloqueo.texto}.`,
      });

      return res.status(423).json({
        error: `🛑 Tu cuenta está temporalmente bloqueada por seguridad. Intenta nuevamente en ${tiempoBloqueo.texto} o utiliza '¿Olvidaste tu contraseña?'.`,
        bloqueado: true,
        tiempoRestanteTexto: tiempoBloqueo.texto,
        segundosRestantes: tiempoBloqueo.segundos,
        bloqueosConsecutivos: usuario.bloqueosConsecutivos,
        requiereRecuperacion: usuario.requiereRecuperacion,
      });
    }

    // 2. Verificación de Exigencia de Restablecimiento (7mo bloqueo o superior)
    if (usuario.requiereRecuperacion) {
      await registrarAuditoria("ACCESO_DENEGADO_REQUIERE_RECUPERACION", usuario.email, {
        usuarioId: usuario.id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        detalles: `Acceso denegado: cuenta alcanzó 7 o más bloqueos (${usuario.bloqueosConsecutivos}). Requiere recuperación de contraseña.`,
      });

      return res.status(423).json({
        error: "🛑 Esta cuenta ha alcanzado el límite máximo de bloqueos de seguridad. Debes restablecer tu contraseña mediante '¿Olvidaste tu contraseña?' o solicitar el desbloqueo al SuperAdministrador.",
        bloqueado: true,
        requiereRecuperacion: true,
        bloqueosConsecutivos: usuario.bloqueosConsecutivos,
      });
    }

    // 3. Comparación de contraseña con bcrypt
    let passwordValida = false;
    if (usuario.password.startsWith("$2a$") || usuario.password.startsWith("$2b$")) {
      passwordValida = await bcrypt.compare(String(password), usuario.password);
    } else {
      passwordValida = usuario.password === String(password);
      if (passwordValida) {
        const nuevoHash = await bcrypt.hash(String(password), 10);
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { password: nuevoHash },
        });
      }
    }

    // 4. Manejo de Contraseña Incorrecta -> Aplicación de Bloqueo Progresivo
    if (!passwordValida) {
      const nuevosFallidos = usuario.intentosFallidos + 1;

      if (nuevosFallidos >= 3) {
        // Se alcanza el umbral de 3 fallos consecutivos: disparar siguiente nivel de bloqueo
        const nuevoNivelBloqueo = usuario.bloqueosConsecutivos + 1;
        const configBloqueo = calcularTiempoBloqueo(nuevoNivelBloqueo);
        const nuevoBloqueadoHasta = new Date(Date.now() + configBloqueo.minutos * 60 * 1000);

        await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            intentosFallidos: 0,
            bloqueosConsecutivos: nuevoNivelBloqueo,
            bloqueadoHasta: nuevoBloqueadoHasta,
            requiereRecuperacion: configBloqueo.requiereRecuperacion,
          },
        });

        await registrarAuditoria("BLOQUEO_PROGRESIVO_ACTIVADO", usuario.email, {
          usuarioId: usuario.id,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          detalles: `Bloqueo activado: Nivel ${nuevoNivelBloqueo} (${configBloqueo.descripcion}). Bloqueado hasta ${nuevoBloqueadoHasta.toISOString()}.`,
        });

        await enviarAlerta(
          "ALERTA",
          "Cuenta Bloqueada por Intentos Fallidos",
          `La cuenta de ${usuario.nombre} (${usuario.email}, Rol: ${usuario.rol}) ha sido bloqueada por ${configBloqueo.minutos >= 60 ? configBloqueo.minutos / 60 + " hora(s)" : configBloqueo.minutos + " minutos"}. Nivel consecutivo: ${nuevoNivelBloqueo}.`
        );

        const tiempoTexto = configBloqueo.minutos >= 60 ? `${configBloqueo.minutos / 60} hora(s)` : `${configBloqueo.minutos} minutos`;

        return res.status(423).json({
          error: `🛑 Has alcanzado 3 intentos fallidos consecutivos. Tu cuenta ha sido bloqueada por ${tiempoTexto}.`,
          bloqueado: true,
          tiempoRestanteTexto: tiempoTexto,
          segundosRestantes: configBloqueo.minutos * 60,
          bloqueosConsecutivos: nuevoNivelBloqueo,
          requiereRecuperacion: configBloqueo.requiereRecuperacion,
        });
      } else {
        // Registrar intento fallido individual antes del umbral de 3
        await prisma.usuario.update({
          where: { id: usuario.id },
          data: {
            intentosFallidos: nuevosFallidos,
          },
        });

        await registrarAuditoria("LOGIN_FALLIDO", usuario.email, {
          usuarioId: usuario.id,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          detalles: `Intento fallido ${nuevosFallidos} de 3 en el ciclo actual.`,
        });

        const intentosRestantes = 3 - nuevosFallidos;
        return res.status(401).json({
          error: `Credenciales inválidas. Te quedan ${intentosRestantes} intento(s) antes de que la cuenta sea bloqueada temporalmente por seguridad.`,
          intentosRestantes,
          intentosFallidos: nuevosFallidos,
        });
      }
    }

    // 5. Inicio de Sesión Exitoso -> REINICIAR CONTADORES DE INTENTOS Y BLOQUEOS
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentosFallidos: 0,
        bloqueosConsecutivos: 0,
        bloqueadoHasta: null,
        requiereRecuperacion: false,
      },
    });

    await registrarAuditoria("LOGIN_EXITOSO", usuario.email, {
      usuarioId: usuario.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      detalles: "Inicio de sesión correcto. Contadores de seguridad reiniciados.",
    });

    // 6. Generación de Token JWT con versión de sesión
    const payload = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      rentCarId: usuario.rentCarId,
      tokenVersion: usuario.tokenVersion,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      mensaje: "Inicio de sesión exitoso.",
      token,
      usuario: {
        ...payload,
        rentCarNombre: usuario.rentCar?.nombre || (usuario.rol === "SUPERADMIN" ? "RentOS SaaS Global" : "RentOS Principal"),
        rentCarSlug: usuario.rentCar?.slug || (usuario.rentCarId ? "rentcar-santo-domingo" : null),
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      error: "No fue posible procesar el inicio de sesión.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// GET /api/auth/perfil
// ----------------------------------------------------------------------------
// Valida el token Bearer y asegura que las sesiones anteriores hayan sido invalidadas tras cambio de clave
router.get("/perfil", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token de autorización requerido." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; tokenVersion?: number };

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        rentCarId: true,
        tokenVersion: true,
        bloqueadoHasta: true,
        bloqueosConsecutivos: true,
        requiereRecuperacion: true,
        rentCar: {
          select: {
            id: true,
            nombre: true,
            slug: true,
            ciudad: true,
          },
        },
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Si la contraseña fue cambiada, las sesiones previas quedan invalidadas
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== usuario.tokenVersion) {
      return res.status(401).json({
        error: "Tu sesión ha sido invalidada debido a un cambio o restablecimiento reciente de contraseña. Por favor inicia sesión nuevamente.",
        sesionInvalida: true,
      });
    }

    res.json({
      ...usuario,
      rentCarSlug: usuario.rentCar?.slug || (usuario.rentCarId ? "rentcar-santo-domingo" : null),
    });
  } catch {
    res.status(401).json({ error: "Token inválido o expirado." });
  }
});

// ----------------------------------------------------------------------------
// POST /api/auth/recuperar-password
// ----------------------------------------------------------------------------
// Solicita el enlace de recuperación de contraseña de 15 minutos
router.post("/recuperar-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Por favor proporciona un correo electrónico válido." });
    }

    await asegurarUsuariosIniciales();

    const emailTrim = email.trim().toLowerCase();

    // 1. Identificar el usuario destino
    let usuarioTarget = null;
    let emailDestinoFinal = emailTrim;

    // Si el correo solicitado es el canal autorizado de SuperAdmin o una cuenta SuperAdmin
    const esPeticionSuperadmin =
      emailTrim === CORREO_RECUPERACION_SUPERADMIN ||
      emailTrim === "admin@rentos.com" ||
      emailTrim === "superadmin@rentos.do";

    if (esPeticionSuperadmin) {
      usuarioTarget = await prisma.usuario.findFirst({
        where: {
          rol: RolUsuario.SUPERADMIN,
        },
        orderBy: { id: "asc" },
      });
      // Para SuperAdmin, la entrega se realiza estrictamente al correo autorizado
      emailDestinoFinal = CORREO_RECUPERACION_SUPERADMIN;
    } else {
      usuarioTarget = await prisma.usuario.findUnique({
        where: { email: emailTrim },
      });

      if (usuarioTarget && usuarioTarget.rol === RolUsuario.SUPERADMIN) {
        emailDestinoFinal = CORREO_RECUPERACION_SUPERADMIN;
      }
    }

    // 2. Si el usuario existe y está activo, emitir token de 15 minutos
    if (usuarioTarget && usuarioTarget.activo) {
      const { rawToken } = await crearTokenRecuperacion(usuarioTarget.id, req.ip);

      // Determinar URL base de la aplicación para el enlace
      const origen = req.headers.origin || req.headers.referer || "http://localhost:5173";
      const urlBase = String(origen).replace(/\/$/, "");
      const enlaceRecuperacion = `${urlBase}/restablecer-password?token=${rawToken}`;

      await despacharEnlaceRecuperacion({
        emailDestino: emailDestinoFinal,
        nombreUsuario: usuarioTarget.nombre,
        rolUsuario: usuarioTarget.rol,
        enlaceRecuperacion,
        minutosVigencia: MINUTOS_VIGENCIA_TOKEN,
      });

      await registrarAuditoria("SOLICITUD_RECUPERACION", usuarioTarget.email, {
        usuarioId: usuarioTarget.id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        detalles: `Enlace de recuperación de 15 minutos emitido hacia ${emailDestinoFinal}. Rol: ${usuarioTarget.rol}.`,
      });
    } else {
      // Registrar intento con correo no registrado para control de seguridad
      await registrarAuditoria("SOLICITUD_RECUPERACION_DESCONOCIDO", emailTrim, {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        detalles: "Solicitud de recuperación para correo inexistente o inactivo.",
      });
    }

    // 3. Respuesta genérica de seguridad (No revelar la existencia de la cuenta)
    res.json({
      mensaje: `Si el correo ingresado corresponde a una cuenta administrativa autorizada, se ha generado y enviado un enlace seguro de recuperación. Por seguridad, este enlace tiene una vigencia máxima de ${MINUTOS_VIGENCIA_TOKEN} minutos y es de un solo uso.`,
      vigenciaMinutos: MINUTOS_VIGENCIA_TOKEN,
    });
  } catch (error) {
    console.error("Error al solicitar recuperación de contraseña:", error);
    res.status(500).json({
      error: "No fue posible procesar la solicitud de recuperación.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// GET /api/auth/validar-token-recuperacion
// ----------------------------------------------------------------------------
// Comprueba si el token proporcionado en la URL es válido, no ha expirado (15 min) y no ha sido usado
router.get("/validar-token-recuperacion", async (req, res) => {
  try {
    const token = String(req.query.token || "");

    if (!token) {
      return res.status(400).json({ valido: false, motivo: "Token no proporcionado." });
    }

    const resultado = await verificarTokenRecuperacion(token);

    if (!resultado.valido || !resultado.usuario) {
      return res.json({
        valido: false,
        motivo: resultado.motivo || "El enlace de recuperación no es válido o ha expirado.",
      });
    }

    const minutosRestantes = Math.ceil(
      (resultado.registro!.expiraEn.getTime() - Date.now()) / (60 * 1000)
    );

    res.json({
      valido: true,
      email: resultado.usuario.email,
      nombre: resultado.usuario.nombre,
      rol: resultado.usuario.rol,
      minutosRestantes,
    });
  } catch (error) {
    console.error("Error validando token de recuperación:", error);
    res.status(500).json({ valido: false, motivo: "Error al validar enlace de recuperación." });
  }
});

// ----------------------------------------------------------------------------
// POST /api/auth/restablecer-password
// ----------------------------------------------------------------------------
// Consume el token criptográfico, establece la nueva clave e invalida sesiones anteriores
router.post("/restablecer-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token y nueva contraseña son obligatorios." });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener un mínimo de 6 caracteres." });
    }

    const resultado = await ejecutarRestablecimientoPassword(
      String(token),
      String(password),
      req.ip,
      req.headers["user-agent"]
    );

    res.json({
      exito: true,
      mensaje: "✅ Contraseña restablecida exitosamente. Todas las sesiones activas anteriores han sido cerradas por seguridad. Ya puedes iniciar sesión con tu nueva contraseña.",
    });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "No fue posible restablecer la contraseña.",
    });
  }
});

// ----------------------------------------------------------------------------
// POST /api/auth/desbloquear-usuario/:id
// ----------------------------------------------------------------------------
// Mecanismo seguro de desbloqueo manual ejecutado exclusivamente por el SuperAdmin
router.post("/desbloquear-usuario/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token de autorización requerido." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    const targetUserId = Number(req.params.id);
    if (!targetUserId || isNaN(targetUserId)) {
      return res.status(400).json({ error: "ID de usuario inválido." });
    }

    const resultado = await desbloquearCuentaAdmin(targetUserId, decoded.id, req.ip);

    res.json(resultado);
  } catch (error) {
    console.error("Error al desbloquear usuario:", error);
    res.status(403).json({
      error: error instanceof Error ? error.message : "No fue posible desbloquear el usuario.",
    });
  }
});

// ----------------------------------------------------------------------------
// GET /api/auth/auditoria-seguridad
// ----------------------------------------------------------------------------
// Consulta de incidentes, intentos fallidos y bloqueos (Solo SuperAdmin)
router.get("/auditoria-seguridad", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token de autorización requerido." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    const superadmin = await prisma.usuario.findUnique({
      where: { id: decoded.id },
    });

    if (!superadmin || superadmin.rol !== "SUPERADMIN") {
      return res.status(403).json({ error: "Acceso exclusivo para SuperAdministrador." });
    }

    const registros = await prisma.auditoriaSeguridad.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            rol: true,
          },
        },
      },
    });

    res.json(registros);
  } catch (error) {
    console.error("Error al consultar auditoría de seguridad:", error);
    res.status(500).json({ error: "No fue posible obtener la auditoría de seguridad." });
  }
});

// ----------------------------------------------------------------------------
// POST /api/auth/impersonar/:id
// ----------------------------------------------------------------------------
// Permite al SuperAdmin asumir temporalmente el rol y cuenta de cualquier usuario (Admin o Empleado)
router.post("/impersonar/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token de autorización requerido." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const superadminId = decoded.impersonadoPor?.id || decoded.id;
    const superadmin = await prisma.usuario.findUnique({
      where: { id: superadminId },
    });

    if (!superadmin || superadmin.rol !== "SUPERADMIN") {
      return res.status(403).json({ error: "Solo el SuperAdministrador tiene permisos para impersonar usuarios." });
    }

    const targetUserId = Number(req.params.id);
    if (!targetUserId || isNaN(targetUserId)) {
      return res.status(400).json({ error: "ID de usuario objetivo inválido." });
    }

    const targetUsuario = await prisma.usuario.findUnique({
      where: { id: targetUserId },
      include: { rentCar: true },
    });

    if (!targetUsuario) {
      return res.status(404).json({ error: "El usuario objetivo no fue encontrado." });
    }

    // Registrar evento de seguridad
    await registrarAuditoria("IMPERSONACION_INICIADA", targetUsuario.email, {
      usuarioId: targetUsuario.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      detalles: `SuperAdmin ${superadmin.email} ha asumido el control de la cuenta de ${targetUsuario.nombre} (${targetUsuario.email}, Rol: ${targetUsuario.rol}, Empresa: ${targetUsuario.rentCarId || "Global"}).`,
    });

    const payload = {
      id: targetUsuario.id,
      nombre: targetUsuario.nombre,
      email: targetUsuario.email,
      rol: targetUsuario.rol,
      rentCarId: targetUsuario.rentCarId,
      tokenVersion: targetUsuario.tokenVersion,
      impersonadoPor: {
        id: superadmin.id,
        nombre: superadmin.nombre,
        email: superadmin.email,
      },
    };

    const impersonationToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

    res.json({
      mensaje: `Sesión cambiada a ${targetUsuario.nombre} (${targetUsuario.rol})`,
      token: impersonationToken,
      usuario: {
        ...payload,
        rentCarNombre: targetUsuario.rentCar?.nombre || (targetUsuario.rol === "SUPERADMIN" ? "RentOS SaaS Global" : "RentOS Principal"),
      },
    });
  } catch (error) {
    console.error("Error al impersonar usuario:", error);
    res.status(500).json({ error: "No fue posible acceder como este usuario." });
  }
});

// ----------------------------------------------------------------------------
// POST /api/auth/revertir-impersonacion
// ----------------------------------------------------------------------------
// Restaura la sesión original de SuperAdmin (rentosrd@gmail.com)
router.post("/revertir-impersonacion", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token de autorización requerido." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const superadminId = decoded.impersonadoPor?.id;
    let superadmin = null;

    if (superadminId) {
      superadmin = await prisma.usuario.findUnique({
        where: { id: superadminId },
        include: { rentCar: true },
      });
    } else {
      superadmin = await prisma.usuario.findUnique({
        where: { email: CORREO_RECUPERACION_SUPERADMIN },
        include: { rentCar: true },
      });
    }

    if (!superadmin || superadmin.rol !== "SUPERADMIN") {
      return res.status(403).json({ error: "No se encontró la cuenta SuperAdministrador a restaurar." });
    }

    await registrarAuditoria("IMPERSONACION_REVERTIDA", superadmin.email, {
      usuarioId: superadmin.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      detalles: `SuperAdmin ${superadmin.email} ha retornado a su sesión de control total SaaS.`,
    });

    const payload = {
      id: superadmin.id,
      nombre: superadmin.nombre,
      email: superadmin.email,
      rol: superadmin.rol,
      rentCarId: superadmin.rentCarId,
      tokenVersion: superadmin.tokenVersion,
    };

    const superadminToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      mensaje: "Has regresado exitosamente a tu cuenta de SuperAdministrador.",
      token: superadminToken,
      usuario: {
        ...payload,
        rentCarNombre: "RentOS SaaS Global",
      },
    });
  } catch (error) {
    console.error("Error al revertir impersonación:", error);
    res.status(500).json({ error: "No fue posible restaurar la sesión de SuperAdmin." });
  }
});

export default router;
