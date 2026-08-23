import { Router } from "express";
import { EstadoContrato, EstadoVehiculo } from "@prisma/client";
import prisma from "../lib/prisma.js";

const router = Router();

// ======================================================
// GET /api/contratos
// Obtener todos los contratos (filtrados por rentCarId)
// ======================================================
router.get("/", async (req, res) => {
  try {
    const rentCarId = req.query.rentCarId ? Number(req.query.rentCarId) : 1;

    const contratos = await prisma.contrato.findMany({
      where: {
        rentCarId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
          },
        },
        vehiculo: {
          select: {
            id: true,
            marca: true,
            modelo: true,
            anio: true,
            placa: true,
            color: true,
            tarifaDiaria: true,
            kilometraje: true,
            estado: true,
          },
        },
        pagos: true,
        entrega: true,
      },
    });

    res.json(contratos);
  } catch (error) {
    console.error("Error al obtener contratos:", error);
    res.status(500).json({
      error: "No fue posible obtener los contratos.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// GET /api/contratos/:id
// Obtener un contrato específico
// ======================================================
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "El ID del contrato no es válido." });
    }

    const contrato = await prisma.contrato.findUnique({
      where: { id },
      include: {
        cliente: true,
        vehiculo: true,
        entrega: {
          include: {
            evidencias: true,
            defectos: true,
          },
        },
        pagos: true,
      },
    });

    if (!contrato) {
      return res.status(404).json({ error: "Contrato no encontrado." });
    }

    res.json(contrato);
  } catch (error) {
    console.error("Error al obtener contrato:", error);
    res.status(500).json({
      error: "No fue posible obtener el contrato.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// POST /api/contratos
// Crear y formalizar un nuevo contrato de alquiler
// ======================================================
router.post("/", async (req, res) => {
  try {
    const {
      rentCarId,
      clienteId,
      vehiculoId,
      fechaInicio,
      fechaFin,
      tarifaDiaria,
      deposito,
      kilometrajeInicial,
      estado,
      observaciones,
    } = req.body;

    if (
      clienteId === undefined ||
      vehiculoId === undefined ||
      !fechaInicio ||
      !fechaFin ||
      tarifaDiaria === undefined ||
      deposito === undefined
    ) {
      return res.status(400).json({
        error: "Cliente, vehículo, fecha de inicio, fecha de fin, tarifa diaria y depósito son obligatorios.",
      });
    }

    const clienteIdNum = Number(clienteId);
    const vehiculoIdNum = Number(vehiculoId);
    const tarifaNum = Number(tarifaDiaria);
    const depositoNum = Number(deposito);

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      return res.status(400).json({ error: "Las fechas especificadas no son válidas." });
    }

    if (fin <= inicio) {
      return res.status(400).json({ error: "La fecha de fin debe ser posterior a la fecha de inicio." });
    }

    const cliente = await prisma.cliente.findUnique({ where: { id: clienteIdNum } });
    if (!cliente) {
      return res.status(404).json({ error: "El cliente seleccionado no existe." });
    }

    if (cliente.estado === "BLOQUEADO") {
      return res.status(400).json({
        error: "El cliente se encuentra BLOQUEADO. No se pueden generar contratos a clientes bloqueados.",
      });
    }

    const vehiculo = await prisma.vehiculo.findUnique({ where: { id: vehiculoIdNum } });
    if (!vehiculo) {
      return res.status(404).json({ error: "El vehículo seleccionado no existe." });
    }

    const estadoContratoFinal: EstadoContrato =
      estado && estado in EstadoContrato
        ? (estado as EstadoContrato)
        : EstadoContrato.ACTIVO;

    // Si el contrato se inicia ACTIVO, el vehículo debe estar DISPONIBLE
    if (estadoContratoFinal === EstadoContrato.ACTIVO && vehiculo.estado !== EstadoVehiculo.DISPONIBLE) {
      return res.status(400).json({
        error: `El vehículo (${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.placa}) no está disponible (Estado actual: ${vehiculo.estado}).`,
      });
    }

    const kmInicial =
      kilometrajeInicial !== undefined
        ? Number(kilometrajeInicial)
        : vehiculo.kilometraje;

    const contrato = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.contrato.create({
        data: {
          rentCarId: rentCarId ? Number(rentCarId) : 1,
          clienteId: clienteIdNum,
          vehiculoId: vehiculoIdNum,
          fechaInicio: inicio,
          fechaFin: fin,
          tarifaDiaria: tarifaNum,
          deposito: depositoNum,
          kilometrajeInicial: kmInicial,
          estado: estadoContratoFinal,
          observaciones: observaciones ? String(observaciones).trim() : null,
        },
        include: {
          cliente: true,
          vehiculo: true,
        },
      });

      // Si el contrato es ACTIVO, actualizar vehículo a ALQUILADO
      if (estadoContratoFinal === EstadoContrato.ACTIVO) {
        await tx.vehiculo.update({
          where: { id: vehiculoIdNum },
          data: { estado: EstadoVehiculo.ALQUILADO },
        });
      }

      return nuevo;
    });

    res.status(201).json(contrato);
  } catch (error) {
    console.error("Error al crear contrato:", error);
    res.status(500).json({
      error: "No fue posible registrar el contrato.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// PUT /api/contratos/:id
// Actualizar contrato o finalizar renta
// ======================================================
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "El ID del contrato no es válido." });
    }

    const existente = await prisma.contrato.findUnique({
      where: { id },
      include: { vehiculo: true },
    });

    if (!existente) {
      return res.status(404).json({ error: "Contrato no encontrado." });
    }

    const {
      fechaInicio,
      fechaFin,
      tarifaDiaria,
      deposito,
      kilometrajeFinal,
      estado,
      observaciones,
    } = req.body;

    const nuevoEstado = estado ? (estado as EstadoContrato) : existente.estado;

    const contratoActualizado = await prisma.$transaction(async (tx) => {
      const dataToUpdate: Record<string, unknown> = {};

      if (fechaInicio) dataToUpdate.fechaInicio = new Date(fechaInicio);
      if (fechaFin) dataToUpdate.fechaFin = new Date(fechaFin);
      if (tarifaDiaria !== undefined) dataToUpdate.tarifaDiaria = Number(tarifaDiaria);
      if (deposito !== undefined) dataToUpdate.deposito = Number(deposito);
      if (kilometrajeFinal !== undefined) dataToUpdate.kilometrajeFinal = Number(kilometrajeFinal);
      if (estado) dataToUpdate.estado = nuevoEstado;
      if (observaciones !== undefined) dataToUpdate.observaciones = observaciones ? String(observaciones).trim() : null;

      const contrato = await tx.contrato.update({
        where: { id },
        data: dataToUpdate,
        include: {
          cliente: true,
          vehiculo: true,
          pagos: true,
        },
      });

      // Reglas de negocio para el vehículo según el estado del contrato:
      if (nuevoEstado === EstadoContrato.FINALIZADO || nuevoEstado === EstadoContrato.CANCELADO) {
        // Liberar el vehículo a DISPONIBLE y actualizar kilometraje si se proveyó
        const kmActualizado =
          kilometrajeFinal && Number(kilometrajeFinal) > existente.vehiculo.kilometraje
            ? Number(kilometrajeFinal)
            : existente.vehiculo.kilometraje;

        await tx.vehiculo.update({
          where: { id: existente.vehiculoId },
          data: {
            estado: EstadoVehiculo.DISPONIBLE,
            kilometraje: kmActualizado,
          },
        });
      } else if (nuevoEstado === EstadoContrato.ACTIVO) {
        await tx.vehiculo.update({
          where: { id: existente.vehiculoId },
          data: { estado: EstadoVehiculo.ALQUILADO },
        });
      }

      return contrato;
    });

    res.json(contratoActualizado);
  } catch (error) {
    console.error("Error al actualizar contrato:", error);
    res.status(500).json({
      error: "No fue posible actualizar el contrato.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// DELETE /api/contratos/:id
// Cancelar o eliminar contrato
// ======================================================
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existente = await prisma.contrato.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ error: "Contrato no encontrado." });
    }

    await prisma.$transaction(async (tx) => {
      // Liberar vehículo
      await tx.vehiculo.update({
        where: { id: existente.vehiculoId },
        data: { estado: EstadoVehiculo.DISPONIBLE },
      });

      await tx.pago.deleteMany({ where: { contratoId: id } });
      await tx.entrega.deleteMany({ where: { contratoId: id } });
      await tx.contrato.delete({ where: { id } });
    });

    res.json({ mensaje: "Contrato eliminado correctamente y vehículo liberado a DISPONIBLE." });
  } catch (error) {
    console.error("Error al eliminar contrato:", error);
    res.status(500).json({
      error: "No fue posible eliminar el contrato.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;