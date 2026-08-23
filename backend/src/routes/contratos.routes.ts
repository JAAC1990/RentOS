import { Router } from "express";
import { EstadoContrato, EstadoVehiculo } from "@prisma/client";
import prisma from "../lib/prisma.js";

const router = Router();

// GET /api/contratos
router.get("/", async (_req, res) => {
  try {
    const contratos = await prisma.contrato.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        cliente: true,
        vehiculo: true,
        entrega: true,
        pagos: true,
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

// GET /api/contratos/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "El ID del contrato no es valido.",
      });
    }

    const contrato = await prisma.contrato.findUnique({
      where: {
        id,
      },
      include: {
        cliente: true,
        vehiculo: true,
        entrega: true,
        pagos: true,
      },
    });

    if (!contrato) {
      return res.status(404).json({
        error: "Contrato no encontrado.",
      });
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

// POST /api/contratos
router.post("/", async (req, res) => {
  try {
    const {
      clienteId,
      vehiculoId,
      fechaInicio,
      fechaFin,
      tarifaDiaria,
      deposito,
      kilometrajeInicial,
      observaciones,
    } = req.body;

    if (
      clienteId === undefined ||
      vehiculoId === undefined ||
      !fechaInicio ||
      !fechaFin ||
      tarifaDiaria === undefined ||
      deposito === undefined ||
      kilometrajeInicial === undefined
    ) {
      return res.status(400).json({
        error:
          "Cliente, vehiculo, fecha de inicio, fecha de fin, tarifa diaria, deposito y kilometraje inicial son obligatorios.",
      });
    }

    const clienteIdNumero = Number(clienteId);
    const vehiculoIdNumero = Number(vehiculoId);
    const tarifaNumero = Number(tarifaDiaria);
    const depositoNumero = Number(deposito);
    const kilometrajeNumero = Number(kilometrajeInicial);

    if (!Number.isInteger(clienteIdNumero)) {
      return res.status(400).json({
        error: "El clienteId no es valido.",
      });
    }

    if (!Number.isInteger(vehiculoIdNumero)) {
      return res.status(400).json({
        error: "El vehiculoId no es valido.",
      });
    }

    if (!Number.isFinite(tarifaNumero) || tarifaNumero < 0) {
      return res.status(400).json({
        error: "La tarifa diaria no es valida.",
      });
    }

    if (!Number.isFinite(depositoNumero) || depositoNumero < 0) {
      return res.status(400).json({
        error: "El deposito no es valido.",
      });
    }

    if (!Number.isInteger(kilometrajeNumero) || kilometrajeNumero < 0) {
      return res.status(400).json({
        error: "El kilometraje inicial no es valido.",
      });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (Number.isNaN(inicio.getTime())) {
      return res.status(400).json({
        error: "La fecha de inicio no es valida.",
      });
    }

    if (Number.isNaN(fin.getTime())) {
      return res.status(400).json({
        error: "La fecha de fin no es valida.",
      });
    }

    if (fin <= inicio) {
      return res.status(400).json({
        error: "La fecha de fin debe ser posterior a la fecha de inicio.",
      });
    }

    const cliente = await prisma.cliente.findUnique({
      where: {
        id: clienteIdNumero,
      },
    });

    if (!cliente) {
      return res.status(404).json({
        error: "Cliente no encontrado.",
      });
    }

    const vehiculo = await prisma.vehiculo.findUnique({
      where: {
        id: vehiculoIdNumero,
      },
    });

    if (!vehiculo) {
      return res.status(404).json({
        error: "Vehiculo no encontrado.",
      });
    }

    if (vehiculo.estado !== EstadoVehiculo.DISPONIBLE) {
      return res.status(400).json({
        error: "El vehiculo no esta disponible para alquiler.",
        estadoActual: vehiculo.estado,
      });
    }

    if (kilometrajeNumero < vehiculo.kilometraje) {
      return res.status(400).json({
        error:
          "El kilometraje inicial no puede ser menor que el kilometraje actual del vehiculo.",
        kilometrajeActual: vehiculo.kilometraje,
      });
    }

    const contrato = await prisma.$transaction(async (tx) => {
      const nuevoContrato = await tx.contrato.create({
        data: {
          clienteId: clienteIdNumero,
          vehiculoId: vehiculoIdNumero,
          fechaInicio: inicio,
          fechaFin: fin,
          tarifaDiaria: tarifaNumero,
          deposito: depositoNumero,
          kilometrajeInicial: kilometrajeNumero,
          estado: EstadoContrato.BORRADOR,
          observaciones: observaciones
            ? String(observaciones).trim()
            : undefined,
        },
        include: {
          cliente: true,
          vehiculo: true,
        },
      });

      await tx.vehiculo.update({
        where: {
          id: vehiculoIdNumero,
        },
        data: {
          estado: EstadoVehiculo.ALQUILADO,
        },
      });

      return nuevoContrato;
    });

    res.status(201).json(contrato);
  } catch (error) {
    console.error("Error al crear contrato:", error);

    res.status(500).json({
      error: "No fue posible crear el contrato.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// PUT /api/contratos/:id
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "El ID del contrato no es valido.",
      });
    }

    const existente = await prisma.contrato.findUnique({
      where: {
        id,
      },
    });

    if (!existente) {
      return res.status(404).json({
        error: "Contrato no encontrado.",
      });
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

    const data: {
      fechaInicio?: Date;
      fechaFin?: Date;
      tarifaDiaria?: number;
      deposito?: number;
      kilometrajeFinal?: number | null;
      estado?: EstadoContrato;
      observaciones?: string | null;
    } = {};

    let nuevaFechaInicio = existente.fechaInicio;
    let nuevaFechaFin = existente.fechaFin;

    if (fechaInicio !== undefined) {
      const fecha = new Date(fechaInicio);

      if (Number.isNaN(fecha.getTime())) {
        return res.status(400).json({
          error: "La fecha de inicio no es valida.",
        });
      }

      nuevaFechaInicio = fecha;
      data.fechaInicio = fecha;
    }

    if (fechaFin !== undefined) {
      const fecha = new Date(fechaFin);

      if (Number.isNaN(fecha.getTime())) {
        return res.status(400).json({
          error: "La fecha de fin no es valida.",
        });
      }

      nuevaFechaFin = fecha;
      data.fechaFin = fecha;
    }

    if (nuevaFechaFin <= nuevaFechaInicio) {
      return res.status(400).json({
        error: "La fecha de fin debe ser posterior a la fecha de inicio.",
      });
    }

    if (tarifaDiaria !== undefined) {
      const valor = Number(tarifaDiaria);

      if (!Number.isFinite(valor) || valor < 0) {
        return res.status(400).json({
          error: "La tarifa diaria no es valida.",
        });
      }

      data.tarifaDiaria = valor;
    }

    if (deposito !== undefined) {
      const valor = Number(deposito);

      if (!Number.isFinite(valor) || valor < 0) {
        return res.status(400).json({
          error: "El deposito no es valido.",
        });
      }

      data.deposito = valor;
    }

    if (kilometrajeFinal !== undefined) {
      if (kilometrajeFinal === null) {
        data.kilometrajeFinal = null;
      } else {
        const valor = Number(kilometrajeFinal);

        if (!Number.isInteger(valor) || valor < 0) {
          return res.status(400).json({
            error: "El kilometraje final no es valido.",
          });
        }

        if (valor < existente.kilometrajeInicial) {
          return res.status(400).json({
            error:
              "El kilometraje final no puede ser menor que el kilometraje inicial.",
          });
        }

        data.kilometrajeFinal = valor;
      }
    }

    if (estado !== undefined) {
      const estadoTexto = String(estado).toUpperCase();

      if (
        !Object.values(EstadoContrato).includes(
          estadoTexto as EstadoContrato,
        )
      ) {
        return res.status(400).json({
          error: "El estado del contrato no es valido.",
          estadosPermitidos: Object.values(EstadoContrato),
        });
      }

      data.estado = estadoTexto as EstadoContrato;
    }

    if (observaciones !== undefined) {
      data.observaciones = observaciones
        ? String(observaciones).trim()
        : null;
    }

    const contrato = await prisma.contrato.update({
      where: {
        id,
      },
      data,
      include: {
        cliente: true,
        vehiculo: true,
        entrega: true,
        pagos: true,
      },
    });

    res.json(contrato);
  } catch (error) {
    console.error("Error al actualizar contrato:", error);

    res.status(500).json({
      error: "No fue posible actualizar el contrato.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// PATCH /api/contratos/:id/estado
router.patch("/:id/estado", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "El ID del contrato no es valido.",
      });
    }

    if (!estado) {
      return res.status(400).json({
        error: "El estado es obligatorio.",
      });
    }

    const estadoTexto = String(estado).toUpperCase();

    if (
      !Object.values(EstadoContrato).includes(
        estadoTexto as EstadoContrato,
      )
    ) {
      return res.status(400).json({
        error: "El estado del contrato no es valido.",
        estadosPermitidos: Object.values(EstadoContrato),
      });
    }

    const existente = await prisma.contrato.findUnique({
      where: {
        id,
      },
    });

    if (!existente) {
      return res.status(404).json({
        error: "Contrato no encontrado.",
      });
    }

    const contrato = await prisma.contrato.update({
      where: {
        id,
      },
      data: {
        estado: estadoTexto as EstadoContrato,
      },
      include: {
        cliente: true,
        vehiculo: true,
      },
    });

    res.json(contrato);
  } catch (error) {
    console.error("Error al cambiar estado del contrato:", error);

    res.status(500).json({
      error: "No fue posible cambiar el estado del contrato.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;