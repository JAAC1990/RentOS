import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

/**
 * GET /api/rentcars
 * Lista todas las empresas (Rent Cars) registradas.
 */
router.get("/", async (_req, res) => {
  try {
    const rentcars = await prisma.rentCar.findMany({
      include: {
        _count: {
          select: {
            vehiculos: true,
            clientes: true,
            contratos: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    res.json(rentcars);
  } catch (error) {
    console.error("Error al obtener Rent Cars:", error);
    res.status(500).json({
      error: "No fue posible obtener los Rent Cars.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /api/rentcars/:id
 * Obtiene el detalle de un Rent Car por su ID.
 */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "El ID del Rent Car no es válido." });
    }

    const rentcar = await prisma.rentCar.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vehiculos: true,
            clientes: true,
            contratos: true,
          },
        },
      },
    });

    if (!rentcar) {
      return res.status(404).json({ error: "Rent Car no encontrado." });
    }

    res.json(rentcar);
  } catch (error) {
    console.error("Error al obtener Rent Car:", error);
    res.status(500).json({
      error: "No fue posible obtener el Rent Car.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/rentcars
 * Registra un nuevo Rent Car (Tenant).
 */
router.post("/", async (req, res) => {
  try {
    const { nombre, rnc, telefono, email, direccion, ciudad, logoUrl } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: "El nombre del Rent Car es obligatorio." });
    }

    const nuevoRentCar = await prisma.rentCar.create({
      data: {
        nombre: nombre.trim(),
        rnc: rnc ? rnc.trim() : null,
        telefono: telefono ? telefono.trim() : null,
        email: email ? email.trim() : null,
        direccion: direccion ? direccion.trim() : null,
        ciudad: ciudad ? ciudad.trim() : "Santo Domingo",
        logoUrl: logoUrl ? logoUrl.trim() : null,
      },
    });

    res.status(201).json(nuevoRentCar);
  } catch (error) {
    console.error("Error al crear Rent Car:", error);
    res.status(500).json({
      error: "No fue posible crear el Rent Car.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * PUT /api/rentcars/:id
 * Actualiza la información y personalización de un Rent Car.
 */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "El ID del Rent Car no es válido." });
    }

    const { nombre, rnc, telefono, email, direccion, ciudad, logoUrl, activo } = req.body;

    const rentcar = await prisma.rentCar.update({
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre: nombre.trim() }),
        ...(rnc !== undefined && { rnc: rnc ? rnc.trim() : null }),
        ...(telefono !== undefined && { telefono: telefono ? telefono.trim() : null }),
        ...(email !== undefined && { email: email ? email.trim() : null }),
        ...(direccion !== undefined && { direccion: direccion ? direccion.trim() : null }),
        ...(ciudad !== undefined && { ciudad: ciudad ? ciudad.trim() : "Santo Domingo" }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl ? logoUrl.trim() : null }),
        ...(activo !== undefined && { activo: Boolean(activo) }),
      },
    });

    res.json(rentcar);
  } catch (error) {
    console.error("Error al actualizar Rent Car:", error);
    res.status(500).json({
      error: "No fue posible actualizar el Rent Car.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
