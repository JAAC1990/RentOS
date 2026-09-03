/**
 * ============================================================================
 * RentOS - Rutas de Tasa de Cambio Oficial del Banco Central (BCRD)
 * ============================================================================
 * Endpoints públicos y administrativos para la gestión de conversión de divisas:
 * - GET /api/tasa-cambio: Devuelve la tasa oficial dinámica USD ⇄ DOP del día.
 * - POST /api/tasa-cambio/fijar: Permite a un administrador fijar una tasa manual.
 * - POST /api/tasa-cambio/restaurar: Restaura la sincronización automática con el BCRD.
 */

import { Router } from "express";
import {
  obtenerTasaCambioDinamica,
  fijarTasaManual,
  restaurarModoDinamico,
} from "../services/tasaCambio.service.js";

const router = Router();

/**
 * GET /api/tasa-cambio
 * Retorna la tasa oficial del día según el Banco Central de la República Dominicana
 */
router.get("/", async (req, res) => {
  try {
    const forzar = req.query.forzar === "true";
    const infoTasa = await obtenerTasaCambioDinamica(forzar);
    res.json(infoTasa);
  } catch (error) {
    console.error("Error al obtener tasa de cambio:", error);
    res.status(500).json({ error: "Error al consultar la tasa de cambio oficial." });
  }
});

/**
 * POST /api/tasa-cambio/fijar
 * Permite establecer una tasa de cambio fija
 */
router.post("/fijar", (req, res) => {
  try {
    const { tasa, motivo } = req.body;
    const tasaNum = parseFloat(tasa);

    if (isNaN(tasaNum) || tasaNum <= 0) {
      return res.status(400).json({ error: "La tasa ingresada debe ser un número válido mayor a 0." });
    }

    const nuevaTasa = fijarTasaManual(tasaNum, motivo);
    res.json({
      mensaje: `Tasa de cambio fijada manualmente a RD$ ${tasaNum.toFixed(2)}`,
      tasa: nuevaTasa,
    });
  } catch (error) {
    console.error("Error al fijar tasa manual:", error);
    res.status(500).json({ error: "Error al actualizar la tasa de cambio." });
  }
});

/**
 * POST /api/tasa-cambio/restaurar
 * Restaura la sincronización dinámica con el Banco Central de la República Dominicana
 */
router.post("/restaurar", async (_req, res) => {
  try {
    const tasaRestaurada = await restaurarModoDinamico();
    res.json({
      mensaje: "Sincronización dinámica con el Banco Central (BCRD) restaurada exitosamente.",
      tasa: tasaRestaurada,
    });
  } catch (error) {
    console.error("Error al restaurar tasa dinámica:", error);
    res.status(500).json({ error: "Error al sincronizar con el Banco Central." });
  }
});

export default router;
