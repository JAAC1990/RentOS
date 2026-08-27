/**
 * ============================================================================
 * RentOS - Rutas de Gestión de Gastos Operativos (Egresos)
 * ============================================================================
 * Maneja el registro, consulta y categorización de los gastos operativos y
 * administrativos del Rent a Car: combustible, nómina, repuestos, seguros,
 * alquileres y servicios generales para el módulo de contabilidad.
 */

import { Router } from "express";
import { CategoriaGasto, TipoPago } from "@prisma/client";
import prisma from "../lib/prisma.js";

const router = Router();

// ----------------------------------------------------------------------------
// GET /api/gastos
// ----------------------------------------------------------------------------
// Obtiene el listado de gastos con filtros opcionales de fecha, categoría y vehículo
router.get("/", async (req, res) => {
  try {
    const { rentCarId, categoria, vehiculoId, fechaInicio, fechaFin } = req.query;

    const where: any = {};

    if (rentCarId) {
      where.rentCarId = Number(rentCarId);
    }

    if (categoria && categoria !== "TODAS") {
      where.categoria = categoria as CategoriaGasto;
    }

    if (vehiculoId && vehiculoId !== "TODOS") {
      where.vehiculoId = Number(vehiculoId);
    }

    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) {
        where.fecha.gte = new Date(fechaInicio as string);
      }
      if (fechaFin) {
        const fin = new Date(fechaFin as string);
        fin.setHours(23, 59, 59, 999);
        where.fecha.lte = fin;
      }
    }

    const gastos = await prisma.gasto.findMany({
      where,
      orderBy: { fecha: "desc" },
      include: {
        vehiculo: {
          select: {
            id: true,
            marca: true,
            modelo: true,
            placa: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    res.json(gastos);
  } catch (error) {
    console.error("Error al obtener gastos:", error);
    res.status(500).json({ error: "No fue posible obtener el listado de gastos." });
  }
});

// ----------------------------------------------------------------------------
// POST /api/gastos
// ----------------------------------------------------------------------------
// Registra un nuevo gasto operativo o administrativo
router.post("/", async (req, res) => {
  try {
    const {
      rentCarId,
      vehiculoId,
      categoria,
      descripcion,
      monto,
      moneda,
      fecha,
      comprobante,
      proveedor,
      metodoPago,
      usuarioId,
    } = req.body;

    if (!descripcion || !descripcion.trim()) {
      return res.status(400).json({ error: "La descripción del gasto es obligatoria." });
    }

    const montoNum = Number(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).json({ error: "El monto del gasto debe ser un número mayor a cero." });
    }

    const gastoCreado = await prisma.gasto.create({
      data: {
        rentCarId: rentCarId ? Number(rentCarId) : 1,
        vehiculoId: vehiculoId ? Number(vehiculoId) : null,
        categoria: categoria || CategoriaGasto.OTROS_GASTOS,
        descripcion: descripcion.trim(),
        monto: montoNum,
        moneda: moneda || "USD",
        fecha: fecha ? new Date(fecha) : new Date(),
        comprobante: comprobante?.trim() || null,
        proveedor: proveedor?.trim() || null,
        metodoPago: metodoPago || TipoPago.EFECTIVO,
        usuarioId: usuarioId ? Number(usuarioId) : null,
      },
      include: {
        vehiculo: true,
        usuario: true,
      },
    });

    res.status(201).json(gastoCreado);
  } catch (error) {
    console.error("Error al crear gasto:", error);
    res.status(500).json({ error: "No fue posible registrar el gasto." });
  }
});

// ----------------------------------------------------------------------------
// DELETE /api/gastos/:id
// ----------------------------------------------------------------------------
// Elimina un registro de gasto
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.gasto.delete({
      where: { id: Number(id) },
    });
    res.json({ mensaje: "Gasto eliminado exitosamente." });
  } catch (error) {
    console.error("Error al eliminar gasto:", error);
    res.status(500).json({ error: "No fue posible eliminar el gasto." });
  }
});

export default router;
