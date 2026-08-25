/**
 * ============================================================================
 * RentOS - Rutas de Health Check & Diagnóstico del Servidor
 * ============================================================================
 * Endpoint ligero para balanceadores de carga, monitores de disponibilidad y
 * pruebas rápidas de conectividad hacia el backend.
 */

import { Router } from "express";

const router = Router();

// ----------------------------------------------------------------------------
// GET /api/health
// ----------------------------------------------------------------------------
// Retorna estado 200 OK con confirmación de operatividad del servicio
router.get("/", (_req, res) => {
  res.json({
    sistema: "RentOS",
    estado: "activo",
    timestamp: new Date().toISOString(),
    mensaje: "La API de RentOS está funcionando correctamente",
  });
});

export default router;
