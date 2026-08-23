import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "rentos_super_secret_jwt_key_2026";

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

    // Verificar contraseña (soporta hash bcrypt o migración transparente)
    let passwordValida = false;
    if (usuario.password.startsWith("$2a$") || usuario.password.startsWith("$2b$")) {
      passwordValida = await bcrypt.compare(String(password), usuario.password);
    } else {
      passwordValida = usuario.password === String(password);
      // Si era texto plano, migrar automáticamente a hash seguro
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
      rentCarId: usuario.rentCarId || 1,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      mensaje: "Inicio de sesión exitoso.",
      token,
      usuario: {
        ...payload,
        rentCarNombre: usuario.rentCar?.nombre || "RentOS Principal",
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
// Obtener perfil del usuario con JWT
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
