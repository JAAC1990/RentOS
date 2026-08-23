import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(usuarios);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);

    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: "Nombre, email y password son obligatorios.",
      });
    }

    const existente = await prisma.usuario.findUnique({
      where: {
        email: String(email).trim(),
      },
    });

    if (existente) {
      return res.status(409).json({
        error: "Ya existe un usuario con ese email.",
      });
    }

    const usuario = await prisma.usuario.create({
      data: {
        nombre: String(nombre).trim(),
        email: String(email).trim(),
        password: String(password),
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(usuario);
  } catch (error) {
    console.error("Error creando usuario:", error);

    res.status(500).json({
      error: "No fue posible crear el usuario.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
