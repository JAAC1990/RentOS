import { Router } from "express";
import {
  crearBackup,
  listarBackups,
  restaurarBackup,
} from "../lib/backup.js";
import { enviarAlerta } from "../services/alert.service.js";

const router = Router();

// GET /api/backups
router.get("/", async (_req, res) => {
  try {
    const backups = await listarBackups();

    res.json(backups);
  } catch (error) {
    console.error("Error al listar backups:", error);

    res.status(500).json({
      error: "No fue posible obtener los backups.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/backups
router.post("/", async (_req, res) => {
  try {
    const backup = await crearBackup();

    await enviarAlerta(
      "INFO",
      "Backup creado",
      `Se creó correctamente el backup ${backup.archivo}.`,
    );

    res.status(201).json({
      mensaje: "Backup creado correctamente.",
      ...backup,
    });
  } catch (error) {
    console.error("Error al crear backup:", error);

    await enviarAlerta(
      "ERROR",
      "Backup fallido",
      error instanceof Error ? error.message : String(error),
    );

    res.status(500).json({
      error: "No fue posible crear el backup.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/backups/restore
router.post("/restore", async (req, res) => {
  try {
    const { archivo } = req.body;

    if (!archivo || typeof archivo !== "string") {
      return res.status(400).json({
        error: "El nombre del backup es obligatorio.",
      });
    }

    await restaurarBackup(archivo);

    await enviarAlerta(
      "ALERTA",
      "Base de datos restaurada",
      `Se restauró el backup ${archivo}.`,
    );

    res.json({
      mensaje: "Backup restaurado correctamente.",
      archivo,
    });
  } catch (error) {
    console.error("Error al restaurar backup:", error);

    await enviarAlerta(
      "ERROR",
      "Restauración fallida",
      error instanceof Error ? error.message : String(error),
    );

    res.status(500).json({
      error: "No fue posible restaurar el backup.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
