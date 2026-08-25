/**
 * ============================================================================
 * RentOS - Rutas de Recepción, Inspección 360° y Check-in de Flota
 * ============================================================================
 * Maneja el protocolo de retorno de vehículos: registro de odómetro final,
 * marcador de combustible, mapeo interactivo de puntos de daño (DefectoVehiculo),
 * almacenamiento de fotos de evidencia (Evidencia) y liberación a DISPONIBLE.
 */

import { Router } from "express";
import { EstadoContrato } from "@prisma/client";
import prisma from "../lib/prisma.js";

const router = Router();

// Campos seleccionados para los usuarios responsables de la inspección
const usuarioSelect = {
  id: true,
  nombre: true,
  email: true,
  activo: true,
};

// ----------------------------------------------------------------------------
// GET /api/entregas
// ----------------------------------------------------------------------------
// Obtiene el historial de todas las inspecciones realizadas con clientes y vehículos
router.get("/", async (_req, res) => {
  try {
    const entregas = await prisma.entrega.findMany({
      orderBy: {
        fechaHora: "desc",
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
                color: true,
              },
            },
          },
        },
        usuario: {
          select: usuarioSelect,
        },
        evidencias: true,
        defectos: true,
      },
    });

    res.json(entregas);
  } catch (error) {
    console.error("Error al obtener entregas:", error);
    res.status(500).json({
      error: "No fue posible obtener las entregas.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// GET /api/entregas/:id
// ----------------------------------------------------------------------------
// Obtiene el reporte individual de una inspección con fotos y mapa de daños
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "El ID de la entrega no es válido." });
    }

    const entrega = await prisma.entrega.findUnique({
      where: { id },
      include: {
        contrato: {
          include: {
            cliente: true,
            vehiculo: true,
          },
        },
        usuario: { select: usuarioSelect },
        evidencias: true,
        defectos: true,
      },
    });

    if (!entrega) {
      return res.status(404).json({ error: "Entrega no encontrada." });
    }

    res.json(entrega);
  } catch (error) {
    console.error("Error al obtener entrega:", error);
    res.status(500).json({
      error: "No fue posible obtener la entrega.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// POST /api/entregas
// ----------------------------------------------------------------------------
// Procesa el Check-in: registra daños 360°, fotos, finaliza contrato y libera auto
router.post("/", async (req, res) => {
  try {
    const {
      contratoId,
      usuarioId,
      kilometraje,
      nivelCombustible,
      tieneDefectos,
      descripcionDefectos,
      defectosDetalle, // Puntos de daño del mapa interactivo: [{ descripcion, ubicacion, tipoDano, severidad, coordX, coordY }]
      observaciones,
    } = req.body;

    if (contratoId === undefined || kilometraje === undefined) {
      return res.status(400).json({
        error: "El contrato y el kilometraje de retorno son obligatorios.",
      });
    }

    const contratoIdNum = Number(contratoId);
    const kmNum = Number(kilometraje);

    const contrato = await prisma.contrato.findUnique({
      where: { id: contratoIdNum },
      include: { vehiculo: true },
    });

    if (!contrato) {
      return res.status(404).json({ error: "El contrato seleccionado no existe." });
    }

    // Determinar o asignar el usuario inspector
    let targetUserId = usuarioId ? Number(usuarioId) : null;
    if (!targetUserId) {
      let u = await prisma.usuario.findFirst({ where: { activo: true } });
      if (!u) {
        u = await prisma.usuario.create({
          data: {
            nombre: "Inspector de Flota",
            email: "inspeccion@rentos.do",
            password: "password_inspeccion",
            activo: true,
          },
        });
      }
      targetUserId = u.id;
    }

    // Transacción atómica de Check-in
    const entrega = await prisma.$transaction(async (tx) => {
      // 1. Crear el registro maestro de la entrega
      const nuevaEntrega = await tx.entrega.create({
        data: {
          contratoId: contratoIdNum,
          usuarioId: targetUserId,
          kilometraje: kmNum,
          nivelCombustible: nivelCombustible ? String(nivelCombustible).trim() : "100%",
          tieneDefectos: Boolean(tieneDefectos || (Array.isArray(defectosDetalle) && defectosDetalle.length > 0)),
          observaciones: observaciones ? String(observaciones).trim() : null,
        },
      });

      // 2. Guardar los pines de daño del mapa 360°
      if (Array.isArray(defectosDetalle) && defectosDetalle.length > 0) {
        for (const def of defectosDetalle) {
          await tx.defectoVehiculo.create({
            data: {
              entregaId: nuevaEntrega.id,
              descripcion: def.descripcion || "Daño registrado en inspección",
              ubicacion: def.ubicacion || "Carrocería",
              tipoDano: def.tipoDano || "RAYON",
              severidad: def.severidad || "LEVE",
              coordX: def.coordX !== undefined ? Number(def.coordX) : null,
              coordY: def.coordY !== undefined ? Number(def.coordY) : null,
            },
          });
        }
      } else if (tieneDefectos && descripcionDefectos) {
        await tx.defectoVehiculo.create({
          data: {
            entregaId: nuevaEntrega.id,
            descripcion: String(descripcionDefectos).trim(),
            ubicacion: "Carrocería General",
            tipoDano: "RAYON",
            severidad: "LEVE",
          },
        });
      }

      // 3. Guardar las fotografías de evidencia en base64 / URL
      if (Array.isArray(req.body.fotosEvidencias) && req.body.fotosEvidencias.length > 0) {
        for (const foto of req.body.fotosEvidencias) {
          if (foto.archivoUrl) {
            await tx.evidencia.create({
              data: {
                entregaId: nuevaEntrega.id,
                tipo: "FOTO_VEHICULO_DEVOLUCION",
                archivoUrl: foto.archivoUrl,
                nombreArchivo: foto.nombreArchivo || "inspeccion_devolucion.jpg",
                descripcion: foto.descripcion || "Foto de inspección en check-in",
              },
            });
          }
        }
      }

      // 4. Actualizar contrato a FINALIZADO
      await tx.contrato.update({
        where: { id: contratoIdNum },
        data: {
          kilometrajeFinal: kmNum,
          estado: EstadoContrato.FINALIZADO,
        },
      });

      // 5. Liberar el vehículo a DISPONIBLE con su nuevo odómetro actualizado
      await tx.vehiculo.update({
        where: { id: contrato.vehiculoId },
        data: {
          kilometraje: kmNum,
          estado: "DISPONIBLE",
        },
      });

      return await tx.entrega.findUniqueOrThrow({
        where: { id: nuevaEntrega.id },
        include: {
          contrato: {
            include: {
              cliente: true,
              vehiculo: true,
            },
          },
          usuario: { select: usuarioSelect },
          defectos: true,
          evidencias: true,
        },
      });
    });

    res.status(201).json(entrega);
  } catch (error) {
    console.error("Error al registrar entrega:", error);
    res.status(500).json({
      error: "No fue posible registrar la entrega.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;