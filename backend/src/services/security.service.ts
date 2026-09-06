/**
 * ============================================================================
 * RentOS - Servicio de Seguridad, Bloqueo Progresivo y Recuperación de Cuentas
 * ============================================================================
 * Implementa:
 * 1. Política estricta de Bloqueo Progresivo (3 fallos -> 5m, 15m, 30m, 1h, 6h, 24h, 7mo+ con recuperación).
 * 2. Generación de tokens de recuperación de 15 minutos de un solo uso (hash SHA-256, nunca en texto plano).
 * 3. Enrutamiento del correo de recuperación de SuperAdmin a 'rentosrd@gmail.com'.
 * 4. Invalidación atómica de sesiones activas anteriores mediante incremento de tokenVersion.
 * 5. Registro integral en AuditoriaSeguridad.
 */

import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { enviarAlerta } from "./alert.service.js";

// Correo autorizado por requerimiento estricto para la recuperación del SuperAdmin
export const CORREO_RECUPERACION_SUPERADMIN = "rentosrd@gmail.com";

// Duración estricta de validez del enlace de recuperación (15 minutos)
export const MINUTOS_VIGENCIA_TOKEN = 15;

export interface InfoBloqueo {
  bloqueado: boolean;
  minutosBloqueo: number;
  bloqueadoHasta: Date | null;
  requiereRecuperacion: boolean;
  tiempoRestanteTexto: string;
  tiempoRestanteSegundos: number;
}

/**
 * Calcula el tiempo de bloqueo en minutos según el nivel de bloqueo consecutivo.
 * Política estricta:
 * - 1er bloqueo (tras 3 fallos consecutivos) -> 5 minutos
 * - 2do bloqueo consecutivo -> 15 minutos
 * - 3er bloqueo consecutivo -> 30 minutos
 * - 4to bloqueo consecutivo -> 1 hora (60 minutos)
 * - 5to bloqueo consecutivo -> 6 horas (360 minutos)
 * - 6to bloqueo consecutivo -> 24 horas (1440 minutos)
 * - 7mo bloqueo o superior -> 24 horas y requiere recuperación o intervención admin
 */
export function calcularTiempoBloqueo(bloqueosConsecutivos: number): {
  minutos: number;
  requiereRecuperacion: boolean;
  descripcion: string;
} {
  switch (bloqueosConsecutivos) {
    case 1:
      return { minutos: 5, requiereRecuperacion: false, descripcion: "5 minutos (1er bloqueo consecutivo)" };
    case 2:
      return { minutos: 15, requiereRecuperacion: false, descripcion: "15 minutos (2do bloqueo consecutivo)" };
    case 3:
      return { minutos: 30, requiereRecuperacion: false, descripcion: "30 minutos (3er bloqueo consecutivo)" };
    case 4:
      return { minutos: 60, requiereRecuperacion: false, descripcion: "1 hora (4to bloqueo consecutivo)" };
    case 5:
      return { minutos: 360, requiereRecuperacion: false, descripcion: "6 horas (5to bloqueo consecutivo)" };
    case 6:
      return { minutos: 1440, requiereRecuperacion: false, descripcion: "24 horas (6to bloqueo consecutivo)" };
    default:
      return {
        minutos: 1440,
        requiereRecuperacion: true,
        descripcion: "24 horas y requiere recuperación de contraseña o intervención administrativa (7mo o posterior)",
      };
  }
}

/**
 * Calcula los minutos y segundos restantes de un bloqueo para mostrar al usuario.
 */
export function obtenerTiempoRestante(bloqueadoHasta: Date | null): {
  activo: boolean;
  segundos: number;
  texto: string;
} {
  if (!bloqueadoHasta) {
    return { activo: false, segundos: 0, texto: "" };
  }

  const diffMs = bloqueadoHasta.getTime() - Date.now();
  if (diffMs <= 0) {
    return { activo: false, segundos: 0, texto: "" };
  }

  const segundosTotales = Math.ceil(diffMs / 1000);
  const horas = Math.floor(segundosTotales / 3600);
  const minutos = Math.floor((segundosTotales % 3600) / 60);
  const segundos = segundosTotales % 60;

  let texto = "";
  if (horas > 0) {
    texto = `${horas}h ${minutos}m ${segundos}s`;
  } else if (minutos > 0) {
    texto = `${minutos}m ${segundos}s`;
  } else {
    texto = `${segundos}s`;
  }

  return { activo: true, segundos: segundosTotales, texto };
}

/**
 * Registra un evento en la tabla AuditoriaSeguridad.
 */
export async function registrarAuditoria(
  evento: string,
  email: string,
  opciones?: {
    usuarioId?: number | null;
    ip?: string;
    userAgent?: string;
    detalles?: string;
  }
) {
  try {
    await prisma.auditoriaSeguridad.create({
      data: {
        evento,
        email: email.toLowerCase().trim(),
        usuarioId: opciones?.usuarioId || null,
        ip: opciones?.ip || null,
        userAgent: opciones?.userAgent ? opciones.userAgent.slice(0, 500) : null,
        detalles: opciones?.detalles || null,
      },
    });
  } catch (err) {
    console.error("Error al registrar auditoría de seguridad:", err);
  }
}

/**
 * Genera un token criptográfico seguro de un solo uso para recuperación de contraseña.
 * El token plano se envía al usuario; en la base de datos se almacena ÚNICAMENTE el hash SHA-256.
 */
export async function crearTokenRecuperacion(
  usuarioId: number,
  ip?: string
): Promise<{ rawToken: string; expiraEn: Date }> {
  // Generar 32 bytes de entropía criptográfica (64 caracteres hexadecimales)
  const rawToken = crypto.randomBytes(32).toString("hex");

  // Almacenar con hash SHA-256 (nunca en texto plano)
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Vigencia máxima de 15 minutos exactos
  const expiraEn = new Date(Date.now() + MINUTOS_VIGENCIA_TOKEN * 60 * 1000);

  // Invalidar cualquier token anterior no utilizado de este usuario
  await prisma.tokenRecuperacion.updateMany({
    where: {
      usuarioId,
      usado: false,
    },
    data: {
      usado: true,
    },
  });

  // Guardar nuevo token de un solo uso
  await prisma.tokenRecuperacion.create({
    data: {
      usuarioId,
      tokenHash,
      expiraEn,
      usado: false,
      ip: ip || null,
    },
  });

  return { rawToken, expiraEn };
}

/**
 * Valida si un token recibido está vigente, no ha sido usado y no ha superado los 15 minutos.
 */
export async function verificarTokenRecuperacion(rawToken: string) {
  if (!rawToken || typeof rawToken !== "string" || rawToken.trim().length === 0) {
    return { valido: false, motivo: "Token no proporcionado." };
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken.trim()).digest("hex");

  const registro = await prisma.tokenRecuperacion.findUnique({
    where: { tokenHash },
    include: {
      usuario: {
        select: {
          id: true,
          email: true,
          nombre: true,
          rol: true,
          activo: true,
        },
      },
    },
  });

  if (!registro) {
    return { valido: false, motivo: "El enlace de recuperación es inválido o no existe." };
  }

  if (registro.usado) {
    return {
      valido: false,
      motivo: "Este enlace de recuperación ya ha sido utilizado. Los enlaces son de un solo uso por seguridad.",
    };
  }

  if (registro.expiraEn.getTime() <= Date.now()) {
    return {
      valido: false,
      motivo: "El enlace de recuperación ha expirado (vigencia máxima de 15 minutos). Por favor solicita uno nuevo.",
    };
  }

  if (!registro.usuario.activo) {
    return { valido: false, motivo: "La cuenta de usuario se encuentra desactivada." };
  }

  return {
    valido: true,
    registro,
    usuario: registro.usuario,
  };
}

/**
 * Restablece la contraseña utilizando el token criptográfico, invalida el token de inmediato,
 * reinicia los bloqueos de seguridad e incrementa tokenVersion para invalidar todas las sesiones previas.
 */
export async function ejecutarRestablecimientoPassword(
  rawToken: string,
  nuevaPasswordPlana: string,
  ip?: string,
  userAgent?: string
) {
  const verificacion = await verificarTokenRecuperacion(rawToken);
  if (!verificacion.valido || !verificacion.registro || !verificacion.usuario) {
    throw new Error(verificacion.motivo || "Enlace de recuperación inválido.");
  }

  const { registro, usuario } = verificacion;

  if (nuevaPasswordPlana.length < 6) {
    throw new Error("La nueva contraseña debe contener al menos 6 caracteres.");
  }

  const nuevoHash = await bcrypt.hash(nuevaPasswordPlana, 10);

  await prisma.$transaction(async (tx) => {
    // 1. Invalidar inmediatamente el token utilizado
    await tx.tokenRecuperacion.update({
      where: { id: registro.id },
      data: {
        usado: true,
        usadoEn: new Date(),
      },
    });

    // 2. Invalidar todos los demás tokens pendientes del usuario
    await tx.tokenRecuperacion.updateMany({
      where: {
        usuarioId: usuario.id,
        usado: false,
      },
      data: {
        usado: true,
      },
    });

    // 3. Actualizar contraseña, limpiar bloqueos e incrementar tokenVersion para invalidar sesiones previas
    await tx.usuario.update({
      where: { id: usuario.id },
      data: {
        password: nuevoHash,
        intentosFallidos: 0,
        bloqueosConsecutivos: 0,
        bloqueadoHasta: null,
        requiereRecuperacion: false,
        passwordChangedAt: new Date(),
        tokenVersion: { increment: 1 }, // Invalida cualquier JWT previo
      },
    });

    // 4. Registrar en auditoría de seguridad
    await tx.auditoriaSeguridad.create({
      data: {
        evento: "PASSWORD_RESTABLECIDO",
        email: usuario.email,
        usuarioId: usuario.id,
        ip: ip || null,
        userAgent: userAgent ? userAgent.slice(0, 500) : null,
        detalles: "Contraseña restablecida con éxito mediante token de 15 minutos. Sesiones anteriores invalidadas.",
      },
    });
  });

  // Notificar por canal de seguridad
  await enviarAlerta(
    "SEGURIDAD",
    "Contraseña Restablecida Exitosamente",
    `El usuario ${usuario.nombre} (${usuario.email}, Rol: ${usuario.rol}) ha restablecido su contraseña de acceso mediante enlace de verificación. Todas las sesiones activas han sido cerradas.`
  );

  return {
    exito: true,
    email: usuario.email,
    mensaje: "Contraseña actualizada exitosamente. Todas las sesiones anteriores han sido cerradas.",
  };
}

/**
 * Permite a un SuperAdmin desbloquear manualmente una cuenta de administrador bloqueada.
 */
export async function desbloquearCuentaAdmin(
  targetUserId: number,
  superadminId: number,
  ip?: string
) {
  const superadmin = await prisma.usuario.findUnique({
    where: { id: superadminId },
  });

  if (!superadmin || superadmin.rol !== "SUPERADMIN") {
    throw new Error("No tienes permisos suficientes para realizar esta acción.");
  }

  const target = await prisma.usuario.findUnique({
    where: { id: targetUserId },
  });

  if (!target) {
    throw new Error("Usuario no encontrado.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: targetUserId },
      data: {
        intentosFallidos: 0,
        bloqueosConsecutivos: 0,
        bloqueadoHasta: null,
        requiereRecuperacion: false,
      },
    });

    await tx.auditoriaSeguridad.create({
      data: {
        evento: "DESBLOQUEO_MANUAL",
        email: target.email,
        usuarioId: target.id,
        ip: ip || null,
        detalles: `Cuenta desbloqueada manualmente por SuperAdministrador ${superadmin.nombre} (${superadmin.email}).`,
      },
    });
  });

  await enviarAlerta(
    "AVISO",
    "Cuenta Desbloqueada Manualmente",
    `El SuperAdmin ${superadmin.nombre} ha desbloqueado manualmente la cuenta del usuario ${target.nombre} (${target.email}).`
  );

  return {
    exito: true,
    mensaje: `La cuenta de ${target.nombre} ha sido desbloqueada exitosamente.`,
  };
}
