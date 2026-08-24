import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import prisma from "../lib/prisma.js";
import {
  crearBackup,
  listarBackups,
  restaurarBackup,
} from "../lib/backup.js";
import { enviarAlerta } from "../services/alert.service.js";

const router = Router();
const backupDirectory = path.resolve(process.env.BACKUP_DIR || "./backups");

// GET /api/backups - Listar backups globales
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

// POST /api/backups - Generar nuevo backup global (.sql)
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

// GET /api/backups/download/:archivo - Descargar archivo de backup .sql
router.get("/download/:archivo", async (req, res) => {
  try {
    const { archivo } = req.params;
    if (!archivo || archivo.includes("..") || archivo.includes("/") || archivo.includes("\\")) {
      return res.status(400).json({ error: "Nombre de archivo no válido." });
    }

    const rutaArchivo = path.join(backupDirectory, archivo);
    await fs.access(rutaArchivo);

    res.download(rutaArchivo, archivo);
  } catch (error) {
    console.error("Error al descargar backup:", error);
    res.status(404).json({ error: "Archivo de respaldo no encontrado." });
  }
});

// POST /api/backups/upload - Subir archivo .sql de respaldo externo
router.post("/upload", async (req, res) => {
  try {
    const { nombreArchivo, contenidoSql } = req.body;

    if (!contenidoSql) {
      return res.status(400).json({ error: "El contenido del archivo SQL es obligatorio." });
    }

    await fs.mkdir(backupDirectory, { recursive: true });

    const nombreLimpio = (nombreArchivo || `rentos_backup_upload_${Date.now()}.sql`)
      .replace(/[^a-zA-Z0-9_.-]/g, "_");

    const finalName = nombreLimpio.startsWith("rentos_backup_")
      ? nombreLimpio
      : `rentos_backup_${nombreLimpio}`;

    const rutaArchivo = path.join(backupDirectory, finalName.endsWith(".sql") ? finalName : `${finalName}.sql`);

    await fs.writeFile(rutaArchivo, contenidoSql, "utf-8");
    const estadisticas = await fs.stat(rutaArchivo);

    res.status(201).json({
      mensaje: "Archivo de respaldo cargado exitosamente en el servidor.",
      archivo: path.basename(rutaArchivo),
      tamaño: estadisticas.size,
    });
  } catch (error) {
    console.error("Error al subir backup:", error);
    res.status(500).json({
      error: "No fue posible almacenar el archivo de respaldo.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/backups/restore - Restaurar backup global del servidor (.sql)
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
      mensaje: "Backup global restaurado correctamente.",
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

// ============================================================================
// BACKUP & RESTAURACIÓN AISLADA POR EMPRESA / TENANT (JSON SNAPSHOT)
// ============================================================================

// GET /api/backups/tenant/:id/export - Exportar paquete completo de una empresa
router.get("/tenant/:id/export", async (req, res) => {
  try {
    const tenantId = Number(req.params.id);

    if (!Number.isInteger(tenantId)) {
      return res.status(400).json({ error: "El ID de la empresa no es válido." });
    }

    const rentCar = await prisma.rentCar.findUnique({
      where: { id: tenantId },
    });

    if (!rentCar) {
      return res.status(404).json({ error: "Empresa Rent a Car no encontrada." });
    }

    const [vehiculos, clientes, contratos, mantenimientos, usuarios] = await Promise.all([
      prisma.vehiculo.findMany({ where: { rentCarId: tenantId } }),
      prisma.cliente.findMany({ where: { rentCarId: tenantId } }),
      prisma.contrato.findMany({
        where: { rentCarId: tenantId },
        include: {
          entrega: {
            include: {
              defectos: true,
              evidencias: true,
            },
          },
          pagos: true,
        },
      }),
      prisma.mantenimiento.findMany({ where: { rentCarId: tenantId } }),
      prisma.usuario.findMany({
        where: { rentCarId: tenantId },
        select: { id: true, nombre: true, email: true, rol: true, activo: true },
      }),
    ]);

    const paqueteBackup = {
      tipo: "RENTOS_TENANT_BACKUP",
      version: "1.0",
      fechaExportacion: new Date().toISOString(),
      empresa: rentCar,
      datos: {
        vehiculos,
        clientes,
        contratos,
        mantenimientos,
        usuarios,
      },
      metricas: {
        totalVehiculos: vehiculos.length,
        totalClientes: clientes.length,
        totalContratos: contratos.length,
        totalMantenimientos: mantenimientos.length,
      },
    };

    res.json(paqueteBackup);
  } catch (error) {
    console.error("Error al exportar datos de empresa:", error);
    res.status(500).json({
      error: "No fue posible generar el paquete de respaldo de la empresa.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// POST /api/backups/tenant/:id/restore - Restaurar paquete de una empresa
router.post("/tenant/:id/restore", async (req, res) => {
  try {
    const tenantId = Number(req.params.id);
    const { paquete } = req.body;

    if (!Number.isInteger(tenantId)) {
      return res.status(400).json({ error: "El ID de la empresa no es válido." });
    }

    if (!paquete || !paquete.datos) {
      return res.status(400).json({ error: "El paquete de respaldo es inválido o está incompleto." });
    }

    const rentCar = await prisma.rentCar.findUnique({
      where: { id: tenantId },
    });

    if (!rentCar) {
      return res.status(404).json({ error: "La empresa destino no existe en la base de datos." });
    }

    const { vehiculos = [], clientes = [], contratos = [], mantenimientos = [] } = paquete.datos;

    // Restauración limpia en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      let vehiculosRestaurados = 0;
      let clientesRestaurados = 0;
      let contratosRestaurados = 0;
      let mantenimientosRestaurados = 0;

      // 1. Restaurar o sincronizar clientes
      const mapaClientes = new Map<number, number>();
      for (const cli of clientes) {
        let clienteExistente = await tx.cliente.findFirst({
          where: { rentCarId: tenantId, telefono: cli.telefono },
        });

        if (!clienteExistente) {
          clienteExistente = await tx.cliente.create({
            data: {
              rentCarId: tenantId,
              nombre: cli.nombre,
              apellido: cli.apellido,
              telefono: cli.telefono,
              email: cli.email,
              direccion: cli.direccion,
              estado: cli.estado || "ACTIVO",
            },
          });
          clientesRestaurados++;
        }
        mapaClientes.set(cli.id, clienteExistente.id);
      }

      // 2. Restaurar o sincronizar vehículos
      const mapaVehiculos = new Map<number, number>();
      for (const veh of vehiculos) {
        let vehiculoExistente = await tx.vehiculo.findFirst({
          where: { placa: veh.placa },
        });

        if (!vehiculoExistente) {
          vehiculoExistente = await tx.vehiculo.create({
            data: {
              rentCarId: tenantId,
              marca: veh.marca,
              modelo: veh.modelo,
              anio: Number(veh.anio) || 2024,
              color: veh.color,
              placa: veh.placa,
              vin: veh.vin || null,
              kilometraje: Number(veh.kilometraje) || 0,
              tarifaDiaria: Number(veh.tarifaDiaria) || 50,
              estado: veh.estado || "DISPONIBLE",
              seguroPoliza: veh.seguroPoliza || null,
            },
          });
          vehiculosRestaurados++;
        }
        mapaVehiculos.set(veh.id, vehiculoExistente.id);
      }

      // 3. Restaurar contratos
      for (const con of contratos) {
        const clienteIdDestino = mapaClientes.get(con.clienteId) || con.clienteId;
        const vehiculoIdDestino = mapaVehiculos.get(con.vehiculoId) || con.vehiculoId;

        // Verificar que existan cliente y vehículo
        const cExiste = await tx.cliente.findUnique({ where: { id: clienteIdDestino } });
        const vExiste = await tx.vehiculo.findUnique({ where: { id: vehiculoIdDestino } });

        if (cExiste && vExiste) {
          const contratoCreado = await tx.contrato.create({
            data: {
              rentCarId: tenantId,
              clienteId: clienteIdDestino,
              vehiculoId: vehiculoIdDestino,
              fechaInicio: new Date(con.fechaInicio),
              fechaFin: new Date(con.fechaFin),
              tarifaDiaria: Number(con.tarifaDiaria),
              deposito: Number(con.deposito || 200),
              kilometrajeInicial: Number(con.kilometrajeInicial || 0),
              kilometrajeFinal: con.kilometrajeFinal ? Number(con.kilometrajeFinal) : null,
              estado: con.estado || "ACTIVO",
              observaciones: con.observaciones ? `[RESTAURADO] ${con.observaciones}` : "[RESTAURADO DE BACKUP]",
            },
          });
          contratosRestaurados++;

          // Restaurar pagos asociados si existen
          if (Array.isArray(con.pagos) && con.pagos.length > 0) {
            for (const p of con.pagos) {
              await tx.pago.create({
                data: {
                  contratoId: contratoCreado.id,
                  monto: Number(p.monto),
                  fecha: new Date(p.fecha || Date.now()),
                  tipo: p.tipo || "EFECTIVO",
                  referencia: p.referencia || null,
                  estado: p.estado || "PAGADO",
                  usuarioId: con.usuarioId || 1,
                },
              });
            }
          }
        }
      }

      // 4. Restaurar mantenimientos
      for (const m of mantenimientos) {
        const vehiculoIdDestino = mapaVehiculos.get(m.vehiculoId);
        if (vehiculoIdDestino) {
          await tx.mantenimiento.create({
            data: {
              rentCarId: tenantId,
              vehiculoId: vehiculoIdDestino,
              tipoServicio: m.tipoServicio,
              descripcion: m.descripcion,
              costo: Number(m.costo || 0),
              kilometrajeServicio: Number(m.kilometrajeServicio || 0),
              taller: m.taller,
              estado: m.estado || "COMPLETADO",
            },
          });
          mantenimientosRestaurados++;
        }
      }

      return {
        vehiculosRestaurados,
        clientesRestaurados,
        contratosRestaurados,
        mantenimientosRestaurados,
      };
    });

    await enviarAlerta(
      "ALERTA",
      `🔄 Respaldo Restaurado para ${rentCar.nombre}`,
      `El SuperAdministrador ha restaurado con éxito los datos de la empresa:\n\n🏢 <b>Empresa:</b> ${rentCar.nombre} (ID #${tenantId})\n🚗 <b>Vehículos:</b> ${resultado.vehiculosRestaurados}\n👤 <b>Clientes:</b> ${resultado.clientesRestaurados}\n📄 <b>Contratos:</b> ${resultado.contratosRestaurados}`
    );

    res.json({
      mensaje: `Datos de ${rentCar.nombre} restaurados con éxito.`,
      resultado,
    });
  } catch (error) {
    console.error("Error al restaurar paquete de empresa:", error);
    res.status(500).json({
      error: "No fue posible restaurar los datos de la empresa.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
