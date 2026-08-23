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
    const tamanoKb = (backup.tamaño / 1024).toFixed(2);

    await enviarAlerta(
      "INFO",
      "💾 Copia de Seguridad Generada (Backup)",
      `Se ha creado y verificado con éxito el respaldo de la base de datos de RentOS.\n\n📁 <b>Archivo:</b> <code>${backup.archivo}</code>\n📦 <b>Tamaño:</b> ${tamanoKb} KB\n🟢 <b>Estado:</b> Respaldo verificado e íntegro.`
    );

    res.status(201).json({
      mensaje: "Backup creado correctamente.",
      ...backup,
    });
  } catch (error) {
    console.error("Error al crear backup:", error);

    await enviarAlerta(
      "ERROR",
      "❌ Fallo en Copia de Seguridad (Backup)",
      `Ocurrió un error al intentar generar el respaldo:\n\n⚠️ <b>Error:</b> ${error instanceof Error ? error.message : String(error)}`
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
      "🔄 Base de Datos Restaurada",
      `Se ha restaurado exitosamente la base de datos con el archivo de respaldo:\n\n📁 <b>Archivo:</b> <code>${archivo}</code>\n⚠️ <b>Atención:</b> La información ha sido sobreescrita con la versión del backup.`
    );

    res.json({
      mensaje: "Backup restaurado correctamente.",
      archivo,
    });
  } catch (error) {
    console.error("Error al restaurar backup:", error);

    await enviarAlerta(
      "ERROR",
      "❌ Fallo al Restaurar Base de Datos",
      `No fue posible restaurar la base de datos:\n\n⚠️ <b>Detalle:</b> ${error instanceof Error ? error.message : String(error)}`
    );

    res.status(500).json({
      error: "No fue posible restaurar el backup.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
