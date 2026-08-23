import { Router } from "express";
import bcrypt from "bcryptjs";
import { RolUsuario } from "@prisma/client";
import prisma from "../lib/prisma.js";

const router = Router();

// ======================================================
// GET /api/users
// Listar todos los usuarios de la empresa
// ======================================================
router.get("/", async (req, res) => {
  try {
    const rentCarId = req.query.rentCarId ? Number(req.query.rentCarId) : 1;

    const usuarios = await prisma.usuario.findMany({
      where: {
        OR: [{ rentCarId }, { rentCarId: null }],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(usuarios);
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    res.status(500).json({
      error: "No fue posible obtener los usuarios.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// POST /api/users
// Crear nuevo usuario / empleado con contraseña encriptada
// ======================================================
router.post("/", async (req, res) => {
  try {
    const { nombre, email, password, rol, rentCarId, activo } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: "Nombre, email y contraseña son obligatorios.",
      });
    }

    const emailTrim = String(email).trim().toLowerCase();

    const existente = await prisma.usuario.findUnique({
      where: { email: emailTrim },
    });

    if (existente) {
      return res.status(409).json({
        error: "Ya existe un usuario registrado con ese correo electrónico.",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const rolFinal: RolUsuario =
      rol && rol in RolUsuario ? (rol as RolUsuario) : RolUsuario.EMPLEADO;

    const usuario = await prisma.usuario.create({
      data: {
        rentCarId: rentCarId ? Number(rentCarId) : 1,
        nombre: String(nombre).trim(),
        email: emailTrim,
        password: hashedPassword,
        rol: rolFinal,
        activo: activo !== undefined ? Boolean(activo) : true,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
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

// ======================================================
// PUT /api/users/:id
// Actualizar datos de usuario, rol o restablecer contraseña
// ======================================================
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nombre, email, password, rol, activo } = req.body;

    const existente = await prisma.usuario.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const dataToUpdate: Record<string, unknown> = {};

    if (nombre) dataToUpdate.nombre = String(nombre).trim();
    if (email) dataToUpdate.email = String(email).trim().toLowerCase();
    if (rol && rol in RolUsuario) dataToUpdate.rol = rol as RolUsuario;
    if (activo !== undefined) dataToUpdate.activo = Boolean(activo);

    if (password && String(password).trim() !== "") {
      dataToUpdate.password = await bcrypt.hash(String(password), 10);
    }

    const actualizado = await prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        updatedAt: true,
      },
    });

    res.json(actualizado);
  } catch (error) {
    console.error("Error actualizando usuario:", error);
    res.status(500).json({
      error: "No fue posible actualizar el usuario.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// DELETE /api/users/:id
// Eliminar o desactivar usuario
// ======================================================
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.usuario.delete({ where: { id } });

    res.json({ mensaje: "Usuario eliminado correctamente." });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    res.status(500).json({
      error: "No fue posible eliminar el usuario.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
