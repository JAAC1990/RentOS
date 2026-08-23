import { Router } from "express";
import { EstadoMantenimiento, EstadoVehiculo } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { enviarAlerta } from "../services/alert.service.js";

const router = Router();

// ======================================================
// GET /api/mantenimientos/alertas
// Obtener alertas de vehículos con mantenimiento por vencer
// ======================================================
router.get("/alertas", async (req, res) => {
  try {
    const rentCarId = req.query.rentCarId ? Number(req.query.rentCarId) : 1;

    const vehiculos = await prisma.vehiculo.findMany({
      where: { rentCarId },
      include: {
        mantenimientos: {
          orderBy: { fechaServicio: "desc" },
          take: 1,
        },
      },
    });

    const hoy = new Date();
    const alertas = [];

    for (const v of vehiculos) {
      let proximoKm = v.proximoMantenimientoKm;
      let proximaFecha = v.proximoMantenimientoFecha;

      // Si no tiene configurado, sugerir basado en su odómetro
      if (!proximoKm) {
        proximoKm = v.kilometraje + 4500;
      }

      if (!proximaFecha) {
        proximaFecha = new Date(hoy.getTime() + 45 * 24 * 60 * 60 * 1000);
      }

      const kmRestantes = proximoKm - v.kilometraje;
      const diasRestantes = Math.ceil((new Date(proximaFecha).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

      let estadoAlerta: "VENCIDO" | "PROXIMO" | "AL_DIA" = "AL_DIA";

      if (kmRestantes <= 0 || diasRestantes <= 0) {
        estadoAlerta = "VENCIDO";
      } else if (kmRestantes <= 800 || diasRestantes <= 15) {
        estadoAlerta = "PROXIMO";
      }

      alertas.push({
        vehiculoId: v.id,
        marca: v.marca,
        modelo: v.modelo,
        placa: v.placa,
        kilometrajeActual: v.kilometraje,
        proximoKm,
        kmRestantes,
        proximaFecha,
        diasRestantes,
        estadoAlerta,
        ultimoServicio: v.mantenimientos[0] ? v.mantenimientos[0].tipoServicio : "Ninguno registrado",
      });
    }

    const conteoVencidos = alertas.filter((a) => a.estadoAlerta === "VENCIDO").length;
    const conteoProximos = alertas.filter((a) => a.estadoAlerta === "PROXIMO").length;
    const conteoAlDia = alertas.filter((a) => a.estadoAlerta === "AL_DIA").length;

    res.json({
      resumen: {
        total: alertas.length,
        vencidos: conteoVencidos,
        proximos: conteoProximos,
        alDia: conteoAlDia,
      },
      alertas,
    });
  } catch (error) {
    console.error("Error al obtener alertas de mantenimiento:", error);
    res.status(500).json({
      error: "No fue posible obtener las alertas de mantenimiento.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// POST /api/mantenimientos/notificar-telegram
// Enviar resumen de alertas de cambio de aceite y taller a Telegram
// ======================================================
router.post("/notificar-telegram", async (req, res) => {
  try {
    const rentCarId = req.body.rentCarId ? Number(req.body.rentCarId) : 1;

    const vehiculos = await prisma.vehiculo.findMany({
      where: { rentCarId },
      include: { rentCar: true },
    });

    const hoy = new Date();
    const lineasAlerta = [];

    for (const v of vehiculos) {
      const proximoKm = v.proximoMantenimientoKm || (v.kilometraje + 4500);
      const kmFaltantes = proximoKm - v.kilometraje;

      if (kmFaltantes <= 0) {
        lineasAlerta.push(`🔴 <b>${v.marca} ${v.modelo} (${v.placa})</b>: Cambio de aceite SOBREGIRADO por ${Math.abs(kmFaltantes)} km.`);
      } else if (kmFaltantes <= 800) {
        lineasAlerta.push(`🟡 <b>${v.marca} ${v.modelo} (${v.placa})</b>: Próximo servicio en ${kmFaltantes} km (Odómetro: ${v.kilometraje} km).`);
      }
    }

    const mensajeAlerta = lineasAlerta.length > 0
      ? `Se detectaron <b>${lineasAlerta.length} vehículos</b> que requieren servicio mecánico:\n\n${lineasAlerta.join("\n")}`
      : "Todos los vehículos de la flota tienen su mantenimiento y cambio de aceite al día. 🟢";

    await enviarAlerta("AVISO", "Auditoría de Mantenimiento Preventivo", mensajeAlerta);

    res.json({
      mensaje: "Notificación de mantenimiento preventivo enviada a Telegram.",
      alertasDetectadas: lineasAlerta.length,
    });
  } catch (error) {
    console.error("Error al notificar mantenimiento por Telegram:", error);
    res.status(500).json({
      error: "No fue posible enviar la alerta a Telegram.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// GET /api/mantenimientos
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
// POST /api/mantenimientos
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
      proximaFechaServicio,
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
    const rentCarIdNum = rentCarId ? Number(rentCarId) : 1;

    const vehiculo = await prisma.vehiculo.findUnique({
      where: { id: vehiculoIdNum },
    });

    if (!vehiculo) {
      return res.status(404).json({ error: "Vehículo no encontrado." });
    }

    const kmServicio = kilometrajeServicio !== undefined && kilometrajeServicio !== ""
      ? Number(kilometrajeServicio)
      : vehiculo.kilometraje;

    // Calcular próximo servicio automático si no se especifica (+5,000 km y +90 días)
    const proximoKmCalculado = proximoKilometraje ? Number(proximoKilometraje) : (kmServicio + 5000);
    const proximaFechaCalculada = proximaFechaServicio
      ? new Date(proximaFechaServicio)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const estadoFinal = (estado && Object.values(EstadoMantenimiento).includes(estado))
      ? (estado as EstadoMantenimiento)
      : EstadoMantenimiento.COMPLETADO;

    const nuevoMantenimiento = await prisma.$transaction(async (tx) => {
      const registro = await tx.mantenimiento.create({
        data: {
          rentCarId: rentCarIdNum,
          vehiculoId: vehiculoIdNum,
          tipoServicio: tipoServicio.trim(),
          descripcion: descripcion ? descripcion.trim() : null,
          costo: costoNum,
          kilometrajeServicio: kmServicio,
          proximoKilometraje: proximoKmCalculado,
          proximaFechaServicio: proximaFechaCalculada,
          fechaServicio: fechaServicio ? new Date(fechaServicio) : new Date(),
          taller: taller ? taller.trim() : null,
          estado: estadoFinal,
        },
        include: { vehiculo: true },
      });

      // Actualizar vehículo con el odómetro y fecha del próximo servicio
      const dataVehiculo: Record<string, unknown> = {
        kilometraje: Math.max(vehiculo.kilometraje, kmServicio),
        proximoMantenimientoKm: proximoKmCalculado,
        proximoMantenimientoFecha: proximaFechaCalculada,
      };

      if (estadoFinal === EstadoMantenimiento.EN_PROCESO) {
        dataVehiculo.estado = EstadoVehiculo.MANTENIMIENTO;
      } else if (estadoFinal === EstadoMantenimiento.COMPLETADO && vehiculo.estado === EstadoVehiculo.MANTENIMIENTO) {
        dataVehiculo.estado = EstadoVehiculo.DISPONIBLE;
      }

      await tx.vehiculo.update({
        where: { id: vehiculoIdNum },
        data: dataVehiculo,
      });

      return registro;
    });

    res.status(201).json(nuevoMantenimiento);
  } catch (error) {
    console.error("Error al registrar mantenimiento:", error);
    res.status(500).json({
      error: "No fue posible registrar el mantenimiento.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// PUT /api/mantenimientos/:id
// ======================================================
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { tipoServicio, descripcion, costo, kilometrajeServicio, proximoKilometraje, fechaServicio, taller, estado } = req.body;

    const dataToUpdate: Record<string, unknown> = {};
    if (tipoServicio !== undefined) dataToUpdate.tipoServicio = tipoServicio.trim();
    if (descripcion !== undefined) dataToUpdate.descripcion = descripcion ? descripcion.trim() : null;
    if (costo !== undefined) dataToUpdate.costo = Number(costo);
    if (kilometrajeServicio !== undefined) dataToUpdate.kilometrajeServicio = Number(kilometrajeServicio);
    if (proximoKilometraje !== undefined) dataToUpdate.proximoKilometraje = Number(proximoKilometraje);
    if (fechaServicio !== undefined) dataToUpdate.fechaServicio = new Date(fechaServicio);
    if (taller !== undefined) dataToUpdate.taller = taller ? taller.trim() : null;
    if (estado !== undefined) dataToUpdate.estado = estado as EstadoMantenimiento;

    const mantenimiento = await prisma.mantenimiento.update({
      where: { id },
      data: dataToUpdate,
      include: { vehiculo: true },
    });

    res.json(mantenimiento);
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
// ======================================================
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.mantenimiento.delete({ where: { id } });
    res.json({ mensaje: "Mantenimiento eliminado con éxito." });
  } catch (error) {
    console.error("Error al eliminar mantenimiento:", error);
    res.status(500).json({
      error: "No fue posible eliminar el mantenimiento.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
