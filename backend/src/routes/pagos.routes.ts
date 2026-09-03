/**
 * ============================================================================
 * RentOS - Rutas de Pagos, Facturación con NCF y Arqueo Financiero
 * ============================================================================
 * Maneja el registro de cobros por contrato, métodos de pago (Efectivo, Tarjeta,
 * Transferencia, PayPal), comprobantes fiscales NCF y cierre de caja.
 */

import { Router } from "express";
import { EstadoPago, TipoPago } from "@prisma/client";
import prisma from "../lib/prisma.js";

const router = Router();

// Listas de validación de enums admitidos por la base de datos
const tiposPagoPermitidos = Object.values(TipoPago);
const estadosPagoPermitidos = Object.values(EstadoPago);

// ----------------------------------------------------------------------------
// GET /api/pagos
// ----------------------------------------------------------------------------
// Retorna todos los cobros registrados con datos de contrato, cliente y vehículo (filtrado por rentCarId)
router.get("/", async (req, res) => {
  try {
    const rentCarId = req.query.rentCarId ? Number(req.query.rentCarId) : undefined;
    const where: any = {};
    if (rentCarId && !isNaN(rentCarId)) {
      where.contrato = { rentCarId };
    }

    const pagos = await prisma.pago.findMany({
      where,
      orderBy: {
        fecha: "desc",
      },
      include: {
        contrato: {
          include: {
            cliente: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                telefono: true,
              },
            },
            vehiculo: {
              select: {
                id: true,
                marca: true,
                modelo: true,
                placa: true,
              },
            },
          },
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

// ----------------------------------------------------------------------------
// GET /api/pagos/:id
// ----------------------------------------------------------------------------
// Obtiene el detalle de un pago específico para impresión o envío de recibo
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "El ID del pago no es válido." });
    }

    const pago = await prisma.pago.findUnique({
      where: { id },
      include: {
        contrato: {
          include: {
            cliente: true,
            vehiculo: true,
          },
        },
      },
    });

    if (!pago) {
      return res.status(404).json({ error: "Pago no encontrado." });
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

// ----------------------------------------------------------------------------
// POST /api/pagos
// ----------------------------------------------------------------------------
// Registra un cobro asociado a un contrato con método de pago y NCF / comprobante
router.post("/", async (req, res) => {
  try {
    const {
      contratoId,
      monto,
      tipo,
      referencia,
      estado,
      usuarioId,
    } = req.body;

    if (contratoId === undefined || monto === undefined || !tipo) {
      return res.status(400).json({
        error: "Contrato, monto y tipo de pago son obligatorios.",
      });
    }

    const contratoIdNumero = Number(contratoId);
    const montoNumero = Number(monto);

    if (!Number.isInteger(contratoIdNumero) || contratoIdNumero <= 0) {
      return res.status(400).json({ error: "El ID del contrato no es válido." });
    }

    if (!Number.isFinite(montoNumero) || montoNumero <= 0) {
      return res.status(400).json({ error: "El monto debe ser mayor a cero." });
    }

    const tipoFinal = String(tipo).trim().toUpperCase();
    if (!tiposPagoPermitidos.includes(tipoFinal as TipoPago)) {
      return res.status(400).json({
        error: "El tipo de pago no es válido.",
        tiposPermitidos: tiposPagoPermitidos,
      });
    }

    const estadoFinal = estado
      ? String(estado).trim().toUpperCase()
      : EstadoPago.PAGADO;

    const contrato = await prisma.contrato.findUnique({
      where: { id: contratoIdNumero },
    });

    if (!contrato) {
      return res.status(404).json({ error: "El contrato especificado no existe." });
    }

    // Obtener o asignar usuario responsable del cobro
    let targetUserId = usuarioId ? Number(usuarioId) : null;
    if (!targetUserId) {
      let primerUsuario = await prisma.usuario.findFirst({ where: { activo: true } });
      if (!primerUsuario) {
        primerUsuario = await prisma.usuario.create({
          data: {
            nombre: "Administrador RentOS",
            email: "admin@rentos.do",
            password: "password_hash_inicial",
            rol: "ADMIN_RENTCAR",
            activo: true,
          },
        });
      }
      targetUserId = primerUsuario.id;
    }

    const pago = await prisma.pago.create({
      data: {
        contratoId: contratoIdNumero,
        usuarioId: targetUserId,
        monto: montoNumero,
        tipo: tipoFinal as TipoPago,
        referencia: referencia ? String(referencia).trim() : null,
        estado: estadoFinal as EstadoPago,
      },
      include: {
        contrato: {
          include: {
            cliente: true,
            vehiculo: true,
          },
        },
      },
    });

    res.status(201).json(pago);
  } catch (error) {
    console.error("Error al registrar pago:", error);
    res.status(500).json({
      error: "No fue posible registrar el pago.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// PUT /api/pagos/:id
// ----------------------------------------------------------------------------
// Actualiza la referencia (NCF), monto o estado de un pago (ej. marcar REEMBOLSADO / ANULADO)
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado, referencia, tipo, monto } = req.body;

    const pago = await prisma.pago.update({
      where: { id },
      data: {
        ...(estado && { estado: String(estado).toUpperCase() as EstadoPago }),
        ...(referencia !== undefined && { referencia: referencia ? String(referencia).trim() : null }),
        ...(tipo && { tipo: String(tipo).toUpperCase() as TipoPago }),
        ...(monto !== undefined && { monto: Number(monto) }),
      },
      include: {
        contrato: {
          include: {
            cliente: true,
            vehiculo: true,
          },
        },
      },
    });

    res.json(pago);
  } catch (error) {
    console.error("Error al actualizar pago:", error);
    res.status(500).json({
      error: "No fue posible actualizar el pago.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// DELETE /api/pagos/:id
// ----------------------------------------------------------------------------
// Elimina un cobro registrado
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.pago.delete({ where: { id } });

    res.json({ mensaje: "Registro de pago eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar pago:", error);
    res.status(500).json({
      error: "No fue posible eliminar el pago.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;