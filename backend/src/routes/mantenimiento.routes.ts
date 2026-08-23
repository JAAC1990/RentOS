import { Router } from "express";
import { EstadoMantenimiento, EstadoVehiculo } from "@prisma/client";
import prisma from "../lib/prisma.js";

const router = Router();

// ======================================================
// GET /api/mantenimientos
// Listar todos los mantenimientos
// ======================================================
router.get("/", async (req, res) => {
  try {
    const rentCarId = req.query.rentCarId ? Number(req.query.rentCarId) : 1;

    const mantenimientos = await prisma.mantenimiento.findMany({
      where: { rentCarId },
      orderBy: { fechaServicio: "desc" },
      include: {
        vehiculo: {
          select: {
            id: true,
            marca: true,
            modelo: true,
            anio: true,
            placa: true,
            kilometraje: true,
            estado: true,
          },
        },
      },
    });

    res.json(mantenimientos);
  } catch (error) {
    console.error("Error al obtener mantenimientos:", error);
    res.status(500).json({
      error: "No fue posible obtener los mantenimientos.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// GET /api/mantenimientos/:id
// Detalle de un mantenimiento
// ======================================================
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "ID no válido." });
    }

    const mantenimiento = await prisma.mantenimiento.findUnique({
      where: { id },
      include: { vehiculo: true },
    });

    if (!mantenimiento) {
      return res.status(404).json({ error: "Mantenimiento no encontrado." });
    }

    res.json(mantenimiento);
  } catch (error) {
    console.error("Error al obtener mantenimiento:", error);
    res.status(500).json({
      error: "No fue posible obtener el mantenimiento.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// POST /api/mantenimientos
// Registrar nuevo servicio de mantenimiento
// ======================================================
router.post("/", async (req, res) => {
  try {
    const {
      rentCarId,
      vehiculoId,
      tipoServicio,
      descripcion,
      costo,
      kilometrajeServicio,
      proximoKilometraje,
      fechaServicio,
      taller,
      estado,
    } = req.body;

    if (!vehiculoId || !tipoServicio) {
      return res.status(400).json({
        error: "Vehículo y Tipo de Servicio son obligatorios.",
      });
    }

    const vehiculoIdNum = Number(vehiculoId);
    const costoNum = costo !== undefined ? Number(costo) : 0;

    const vehiculo = await prisma.vehiculo.findUnique({
      where: { id: vehiculoIdNum },
    });

    if (!vehiculo) {
      return res.status(404).json({ error: "El vehículo seleccionado no existe." });
    }

    const kmServicio =
      kilometrajeServicio !== undefined
        ? Number(kilometrajeServicio)
        : vehiculo.kilometraje;

    const estadoFinal: EstadoMantenimiento =
      estado && estado in EstadoMantenimiento
        ? (estado as EstadoMantenimiento)
        : EstadoMantenimiento.COMPLETADO;

    const mantenimiento = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.mantenimiento.create({
        data: {
          rentCarId: rentCarId ? Number(rentCarId) : 1,
          vehiculoId: vehiculoIdNum,
          tipoServicio: String(tipoServicio).trim(),
          descripcion: descripcion ? String(descripcion).trim() : null,
          costo: costoNum,
          kilometrajeServicio: kmServicio,
          proximoKilometraje: proximoKilometraje ? Number(proximoKilometraje) : null,
          fechaServicio: fechaServicio ? new Date(fechaServicio) : new Date(),
          taller: taller ? String(taller).trim() : null,
          estado: estadoFinal,
        },
        include: { vehiculo: true },
      });

      // Automatización de estado de la flota:
      if (estadoFinal === EstadoMantenimiento.EN_PROCESO) {
        await tx.vehiculo.update({
          where: { id: vehiculoIdNum },
          data: { estado: EstadoVehiculo.MANTENIMIENTO },
        });
      } else if (estadoFinal === EstadoMantenimiento.COMPLETADO) {
        // Si el vehículo estaba en mantenimiento y se completa, vuelve a DISPONIBLE
        if (vehiculo.estado === EstadoVehiculo.MANTENIMIENTO) {
          await tx.vehiculo.update({
            where: { id: vehiculoIdNum },
            data: { estado: EstadoVehiculo.DISPONIBLE },
          });
        }
      }

      return nuevo;
    });

    res.status(201).json(mantenimiento);
  } catch (error) {
    console.error("Error al crear mantenimiento:", error);
    res.status(500).json({
      error: "No fue posible registrar el mantenimiento.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// PUT /api/mantenimientos/:id
// Actualizar servicio
// ======================================================
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existente = await prisma.mantenimiento.findUnique({
      where: { id },
      include: { vehiculo: true },
    });

    if (!existente) {
      return res.status(404).json({ error: "Mantenimiento no encontrado." });
    }

    const {
      tipoServicio,
      descripcion,
      costo,
      kilometrajeServicio,
      proximoKilometraje,
      fechaServicio,
      taller,
      estado,
    } = req.body;

    const nuevoEstado = estado ? (estado as EstadoMantenimiento) : existente.estado;

    const actualizado = await prisma.$transaction(async (tx) => {
      const dataToUpdate: Record<string, unknown> = {};

      if (tipoServicio) dataToUpdate.tipoServicio = String(tipoServicio).trim();
      if (descripcion !== undefined) dataToUpdate.descripcion = descripcion ? String(descripcion).trim() : null;
      if (costo !== undefined) dataToUpdate.costo = Number(costo);
      if (kilometrajeServicio !== undefined) dataToUpdate.kilometrajeServicio = Number(kilometrajeServicio);
      if (proximoKilometraje !== undefined) dataToUpdate.proximoKilometraje = proximoKilometraje ? Number(proximoKilometraje) : null;
      if (fechaServicio) dataToUpdate.fechaServicio = new Date(fechaServicio);
      if (taller !== undefined) dataToUpdate.taller = taller ? String(taller).trim() : null;
      if (estado) dataToUpdate.estado = nuevoEstado;

      const m = await tx.mantenimiento.update({
        where: { id },
        data: dataToUpdate,
        include: { vehiculo: true },
      });

      if (nuevoEstado === EstadoMantenimiento.COMPLETADO && existente.vehiculo.estado === EstadoVehiculo.MANTENIMIENTO) {
        await tx.vehiculo.update({
          where: { id: existente.vehiculoId },
          data: { estado: EstadoVehiculo.DISPONIBLE },
        });
      } else if (nuevoEstado === EstadoMantenimiento.EN_PROCESO) {
        await tx.vehiculo.update({
          where: { id: existente.vehiculoId },
          data: { estado: EstadoVehiculo.MANTENIMIENTO },
        });
      }

      return m;
    });

    res.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar mantenimiento:", error);
    res.status(500).json({
      error: "No fue posible actualizar el mantenimiento.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// DELETE /api/mantenimientos/:id
// Eliminar servicio
// ======================================================
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.mantenimiento.delete({ where: { id } });

    res.json({ mensaje: "Registro de mantenimiento eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar mantenimiento:", error);
    res.status(500).json({
      error: "No fue posible eliminar el mantenimiento.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
