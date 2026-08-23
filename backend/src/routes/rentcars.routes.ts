import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /api/rentcars
router.get("/", async (_req, res) => {
  try {
    const rentcars = await prisma.rentCar.findMany({
      include: {
        _count: {
          select: {
            vehiculos: true,
            clientes: true,
            contratos: true,
            usuarios: true,
            mantenimientos: true,
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

// GET /api/rentcars/:id
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
            usuarios: true,
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

// POST /api/rentcars
router.post("/", async (req, res) => {
  try {
    const {
      nombre,
      rnc,
      telefono,
      email,
      direccion,
      ciudad,
      logoUrl,
      moneda,
      terminosContrato,
      limiteKilometrajeDiario,
      cargoKmExtra,
      depositoEstandar,
    } = req.body;

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
        moneda: moneda ? String(moneda).trim() : "USD",
        terminosContrato: terminosContrato ? String(terminosContrato).trim() : null,
        limiteKilometrajeDiario: limiteKilometrajeDiario ? Number(limiteKilometrajeDiario) : 200,
        cargoKmExtra: cargoKmExtra !== undefined ? Number(cargoKmExtra) : 0.25,
        depositoEstandar: depositoEstandar !== undefined ? Number(depositoEstandar) : 200.0,
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

// PUT /api/rentcars/:id
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "El ID del Rent Car no es válido." });
    }

    const {
      nombre,
      rnc,
      telefono,
      email,
      direccion,
      ciudad,
      logoUrl,
      moneda,
      terminosContrato,
      limiteKilometrajeDiario,
      cargoKmExtra,
      depositoEstandar,
      activo,
    } = req.body;

    const dataToUpdate: Record<string, unknown> = {};

    if (nombre !== undefined) dataToUpdate.nombre = nombre.trim();
    if (rnc !== undefined) dataToUpdate.rnc = rnc ? rnc.trim() : null;
    if (telefono !== undefined) dataToUpdate.telefono = telefono ? telefono.trim() : null;
    if (email !== undefined) dataToUpdate.email = email ? email.trim() : null;
    if (direccion !== undefined) dataToUpdate.direccion = direccion ? direccion.trim() : null;
    if (ciudad !== undefined) dataToUpdate.ciudad = ciudad ? ciudad.trim() : "Santo Domingo";
    if (logoUrl !== undefined) dataToUpdate.logoUrl = logoUrl ? logoUrl.trim() : null;
    if (moneda !== undefined) dataToUpdate.moneda = String(moneda).trim();
    if (terminosContrato !== undefined) dataToUpdate.terminosContrato = terminosContrato ? String(terminosContrato).trim() : null;
    if (limiteKilometrajeDiario !== undefined) dataToUpdate.limiteKilometrajeDiario = Number(limiteKilometrajeDiario);
    if (cargoKmExtra !== undefined) dataToUpdate.cargoKmExtra = Number(cargoKmExtra);
    if (depositoEstandar !== undefined) dataToUpdate.depositoEstandar = Number(depositoEstandar);
    if (activo !== undefined) dataToUpdate.activo = Boolean(activo);

    const rentcar = await prisma.rentCar.update({
      where: { id },
      data: dataToUpdate,
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
