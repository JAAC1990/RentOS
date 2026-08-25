/**
 * ============================================================================
 * RentOS - Rutas de Evaluación de Riesgo y Score Crediticio de Arrendatarios
 * ============================================================================
 * Proporciona un motor de scoring para evaluar a clientes antes de entregar
 * un vehículo: análisis de historial de alquileres finalizados, detección de
 * clientes bloqueados (morosidad/daños) y cálculo de nivel de riesgo (BAJO, MEDIO, ALTO).
 */

import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// ----------------------------------------------------------------------------
// GET /api/credito
// ----------------------------------------------------------------------------
// Retorna el historial de todas las evaluaciones crediticias realizadas
router.get("/", async (_req, res) => {
  try {
    const consultas = await prisma.consultaCredito.findMany({
      orderBy: { fechaHora: "desc" },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
            estado: true,
          },
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    res.json(consultas);
  } catch (error) {
    console.error("Error al obtener consultas de crédito:", error);
    res.status(500).json({
      error: "No fue posible obtener las consultas de crédito.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// GET /api/credito/cliente/:clienteId
// ----------------------------------------------------------------------------
// Obtiene el historial de consultas de riesgo de un cliente en específico
router.get("/cliente/:clienteId", async (req, res) => {
  try {
    const clienteId = Number(req.params.clienteId);

    const consultas = await prisma.consultaCredito.findMany({
      where: { clienteId },
      orderBy: { fechaHora: "desc" },
      include: {
        usuario: {
          select: { id: true, nombre: true },
        },
      },
    });

    res.json(consultas);
  } catch (error) {
    console.error("Error al obtener historial de crédito del cliente:", error);
    res.status(500).json({
      error: "No fue posible obtener el historial de crédito.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// POST /api/credito/evaluar
// ----------------------------------------------------------------------------
// Ejecuta el algoritmo de scoring y emite recomendación de fianza o alquiler
router.post("/evaluar", async (req, res) => {
  try {
    const { clienteId, usuarioId } = req.body;

    if (!clienteId) {
      return res.status(400).json({ error: "El clienteId es obligatorio." });
    }

    const clienteIdNum = Number(clienteId);

    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteIdNum },
      include: {
        contratos: {
          include: { pagos: true },
        },
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado." });
    }

    let targetUserId = usuarioId ? Number(usuarioId) : null;
    if (!targetUserId) {
      const u = await prisma.usuario.findFirst({ where: { activo: true } });
      targetUserId = u ? u.id : 1;
    }

    // Algoritmo de Scoring Crediticio para Rent a Car (Base: 720 puntos)
    let score = 720;
    let factores = [];

    // Factor 1: Si el cliente está en lista de restricción
    if (cliente.estado === "BLOQUEADO") {
      score = 420;
      factores.push("Cliente reportado en lista de restricción / morosidad.");
    }

    // Factor 2: Bonificación por contratos finalizados con éxito
    const contratosFinalizados = cliente.contratos.filter((c) => c.estado === "FINALIZADO").length;
    if (contratosFinalizados > 0) {
      score += Math.min(60, contratosFinalizados * 15);
      factores.push(`${contratosFinalizados} alquileres finalizados con éxito en la plataforma.`);
    }

    // Factor 3: Variabilidad determinística según perfil
    const factorAleatorio = Math.floor((Math.sin(clienteIdNum * 997) + 1) * 40) - 20;
    score += factorAleatorio;

    // Normalizar rango oficial de score (300 a 850)
    score = Math.max(320, Math.min(850, score));

    // Determinar resultado y recomendación operativa
    let resultado = "APROBADO (Excelente perfil)";
    let recomendacion = "Renta autorizada con tarifa estándar y depósito regular.";
    let nivelRiesgo = "BAJO";

    if (score >= 700) {
      resultado = `APROBADO (Score: ${score})`;
      nivelRiesgo = "BAJO";
      recomendacion = "Cliente con excelente historial. Puede rentar vehículos de cualquier categoría.";
    } else if (score >= 580) {
      resultado = `CONDICIONADO (Score: ${score})`;
      nivelRiesgo = "MEDIO";
      recomendacion = "Renta aprobada sujeta a depósito de garantía adicional o tarjeta de crédito bancaria.";
    } else {
      resultado = `RECHAZADO (Score: ${score})`;
      nivelRiesgo = "ALTO";
      recomendacion = "Alto riesgo de incumplimiento o daños. Se sugiere no autorizar el alquiler o exigir fianza total.";
    }

    const observacionDetalle = `Nivel de Riesgo: ${nivelRiesgo}. ${recomendacion} ${factores.join(" ")}`;

    const consulta = await prisma.consultaCredito.create({
      data: {
        clienteId: clienteIdNum,
        usuarioId: targetUserId,
        referencia: `BURÓ-RD-${Date.now().toString().slice(-6)}`,
        resultado,
        observacion: observacionDetalle,
      },
      include: {
        cliente: true,
      },
    });

    res.status(201).json({
      consultaId: consulta.id,
      cliente: `${cliente.nombre} ${cliente.apellido}`,
      score,
      nivelRiesgo,
      resultado,
      recomendacion,
      referencia: consulta.referencia,
      fechaHora: consulta.fechaHora,
    });
  } catch (error) {
    console.error("Error al evaluar crédito:", error);
    res.status(500).json({
      error: "No fue posible realizar la consulta de crédito.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
