import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RolUsuario } from "@prisma/client";
import prisma from "../lib/prisma.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "rentos_super_secret_jwt_key_2026";

// Asegurar usuarios iniciales para pruebas de roles
async function asegurarUsuariosIniciales() {
  const hash = await bcrypt.hash("admin123", 10);

  // 1. SuperAdmin Global (Acceso a todas las empresas)
  await prisma.usuario.upsert({
    where: { email: "superadmin@rentos.do" },
    update: {},
    create: {
      nombre: "SuperAdministrador Global",
      email: "superadmin@rentos.do",
      password: hash,
      rol: RolUsuario.SUPERADMIN,
      rentCarId: null,
      activo: true,
    },
  });

  // 2. Administrador RentCar Santo Domingo (Tenant #1)
  await prisma.usuario.upsert({
    where: { email: "admin@rentos.local" },
    update: { password: hash, rol: RolUsuario.ADMIN_RENTCAR, rentCarId: 1 },
    create: {
      nombre: "Administrador Santo Domingo",
      email: "admin@rentos.local",
      password: hash,
      rol: RolUsuario.ADMIN_RENTCAR,
      rentCarId: 1,
      activo: true,
    },
  });

  // 3. Administrador RentCar Punta Cana (Tenant #2)
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

  // 4. Empleado Mostrador
  await prisma.usuario.upsert({
    where: { email: "juan@rentos.do" },
    update: { password: hash },
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

// ======================================================
// GET /api/auth/cuentas-demo
// Cuentas de prueba para el panel de login
// ======================================================
router.get("/cuentas-demo", async (_req, res) => {
  try {
    await asegurarUsuariosIniciales();

    res.json([
      {
        rol: "SUPERADMIN",
        etiqueta: "👑 SuperAdministrador (SaaS Global)",
        email: "superadmin@rentos.do",
        password: "admin123",
        descripcion: "Control de todas las empresas, métricas globales y configuración SaaS",
      },
      {
        rol: "ADMIN_RENTCAR",
        etiqueta: "🏢 Administrador (Santo Domingo)",
        email: "admin@rentos.local",
        password: "admin123",
        descripcion: "Gestión completa de flota, contratos y tarifas de Santo Domingo",
      },
      {
        rol: "ADMIN_RENTCAR",
        etiqueta: "🏖️ Administrador (Punta Cana)",
        email: "puntacana@rentos.do",
        password: "admin123",
        descripcion: "Gestión de sucursal turística Punta Cana & Bávaro",
      },
      {
        rol: "EMPLEADO",
        etiqueta: "👤 Empleado / Asesor",
        email: "juan@rentos.do",
        password: "admin123",
        descripcion: "Creación de contratos y entregas en mostrador",
      },
    ]);
  } catch (error) {
    console.error("Error al obtener cuentas demo:", error);
    res.status(500).json({ error: "No fue posible obtener cuentas demo." });
  }
});

// ======================================================
// POST /api/auth/login
// Iniciar sesión y generar JWT
// ======================================================
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
      return res.status(401).json({ error: "Credenciales inválidas o usuario no registrado." });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: "Esta cuenta de usuario ha sido desactivada." });
    }

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

    if (!passwordValida) {
      return res.status(401).json({ error: "Credenciales inválidas. Contraseña incorrecta." });
    }

    const payload = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      rentCarId: usuario.rentCarId,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      mensaje: "Inicio de sesión exitoso.",
      token,
      usuario: {
        ...payload,
        rentCarNombre: usuario.rentCar?.nombre || (usuario.rol === "SUPERADMIN" ? "RentOS SaaS Global" : "RentOS Principal"),
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

// ======================================================
// GET /api/auth/perfil
// ======================================================
router.get("/perfil", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token de autorización requerido." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        rentCarId: true,
        rentCar: {
          select: {
            id: true,
            nombre: true,
            ciudad: true,
          },
        },
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.json(usuario);
  } catch {
    res.status(401).json({ error: "Token inválido o expirado." });
  }
});

export default router;
