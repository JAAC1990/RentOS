import { Router } from "express";
import {
  EstadoContrato,
  EstadoPago,
  TipoPago,
} from "@prisma/client";
import prisma from "../lib/prisma.js";

const router = Router();

const usuarioSelect = {
  id: true,
  nombre: true,
  email: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
};

const tiposPagoPermitidos = Object.values(TipoPago);
const estadosPagoPermitidos = Object.values(EstadoPago);

// GET /api/pagos
router.get("/", async (_req, res) => {
  try {
    const pagos = await prisma.pago.findMany({
      orderBy: {
        fecha: "desc",
      },
      include: {
        contrato: {
          include: {
            cliente: true,
            vehiculo: true,
          },
        },
        usuario: {
          select: usuarioSelect,
        },
      },
    });

    res.json(pagos);
  } catch (error) {
    console.error("Error al obtener pagos:", error);

    res.status(500).json({
      error: "No fue posible obtener los pagos.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// GET /api/pagos/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "El ID del pago no es válido.",
      });
    }

    const pago = await prisma.pago.findUnique({
      where: {
        id,
      },
      include: {
        contrato: {
          include: {
            cliente: true,
            vehiculo: true,
          },
        },
        usuario: {
          select: usuarioSelect,
        },
      },
    });

    if (!pago) {
      return res.status(404).json({
        error: "Pago no encontrado.",
      });
    }

    res.json(pago);
  } catch (error) {
    console.error("Error al obtener pago:", error);

    res.status(500).json({
      error: "No fue posible obtener el pago.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/pagos
router.post("/", async (req, res) => {
  try {
    const {
      contratoId,
      usuarioId,
      monto,
      tipo,
      referencia,
      estado,
    } = req.body;

    // Validación de campos obligatorios.
    if (
      contratoId === undefined ||
      usuarioId === undefined ||
      monto === undefined ||
      tipo === undefined ||
      tipo === null ||
      String(tipo).trim() === ""
    ) {
      return res.status(400).json({
        error: "Contrato, usuario, monto y tipo son obligatorios.",
      });
    }

    const contratoIdNumero = Number(contratoId);
    const usuarioIdNumero = Number(usuarioId);
    const montoNumero = Number(monto);

    // Validación del contratoId.
    if (!Number.isInteger(contratoIdNumero) || contratoIdNumero <= 0) {
      return res.status(400).json({
        error: "El contratoId no es válido.",
      });
    }

    // Validación del usuarioId.
    if (!Number.isInteger(usuarioIdNumero) || usuarioIdNumero <= 0) {
      return res.status(400).json({
        error: "El usuarioId no es válido.",
      });
    }

    // Validación del monto.
    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      return res.status(400).json({
        error: "El monto debe ser mayor que cero.",
      });
    }

    // Validación del tipo de pago.
    const tipoFinal = String(tipo).trim().toUpperCase();

    if (!tiposPagoPermitidos.includes(tipoFinal as TipoPago)) {
      return res.status(400).json({
        error: "El tipo de pago no es válido.",
        tiposPermitidos: tiposPagoPermitidos,
      });
    }

    // Si no se proporciona estado, el pago queda PAGADO.
    const estadoFinal = estado
      ? String(estado).trim().toUpperCase()
      : EstadoPago.PAGADO;

    if (!estadosPagoPermitidos.includes(estadoFinal as EstadoPago)) {
      return res.status(400).json({
        error: "El estado del pago no es válido.",
        estadosPermitidos: estadosPagoPermitidos,
      });
    }

    // Buscar el contrato.
    const contrato = await prisma.contrato.findUnique({
      where: {
        id: contratoIdNumero,
      },
      include: {
        cliente: true,
        vehiculo: true,
      },
    });

    if (!contrato) {
      return res.status(404).json({
        error: "Contrato no encontrado.",
      });
    }

    // No permitimos pagos asociados a contratos cancelados.
    if (contrato.estado === EstadoContrato.CANCELADO) {
      return res.status(400).json({
        error: "No se pueden registrar pagos para un contrato cancelado.",
      });
    }

    // Buscar el usuario.
    const usuario = await prisma.usuario.findUnique({
      where: {
        id: usuarioIdNumero,
      },
    });

    if (!usuario) {
      return res.status(404).json({
        error: "Usuario no encontrado.",
      });
    }

    // El usuario que registra un pago debe estar activo.
    if (!usuario.activo) {
      return res.status(400).json({
        error: "El usuario no está activo.",
      });
    }

    // Normalización de la referencia.
    const referenciaFinal =
      referencia !== undefined &&
      referencia !== null &&
      String(referencia).trim() !== ""
        ? String(referencia).trim()
        : null;

    // Crear el pago.
    const pago = await prisma.pago.create({
      data: {
        contratoId: contratoIdNumero,
        usuarioId: usuarioIdNumero,
        monto: montoNumero,
        tipo: tipoFinal as TipoPago,
        referencia: referenciaFinal,
        estado: estadoFinal as EstadoPago,
      },
      include: {
        contrato: {
          include: {
            cliente: true,
            vehiculo: true,
          },
        },
        usuario: {
          select: usuarioSelect,
        },
      },
    });

    res.status(201).json(pago);
  } catch (error) {
    console.error("Error al crear pago:", error);

    res.status(500).json({
      error: "No fue posible crear el pago.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;