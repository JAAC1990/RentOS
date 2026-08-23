import { Router } from "express";
import { EstadoContrato } from "@prisma/client";
import prisma from "../lib/prisma.js";

const router = Router();

const usuarioSelect = {
  id: true,
  nombre: true,
  email: true,
  activo: true,
};

// GET /api/entregas
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

// GET /api/entregas/:id
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

// POST /api/entregas
router.post("/", async (req, res) => {
  try {
    const {
      contratoId,
      usuarioId,
      kilometraje,
      nivelCombustible,
      tieneDefectos,
      descripcionDefectos,
      defectosDetalle, // Array de puntos de daño interactivos [{ descripcion, ubicacion, tipoDano, severidad, coordX, coordY }]
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

    // Buscar usuario responsable
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

    const entrega = await prisma.$transaction(async (tx) => {
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

      // Registrar puntos de daño del mapa interactivo
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
        // Fallback para descripción simple
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

      // Registrar fotos y evidencias de inspección
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

      // Finalizar el contrato
      await tx.contrato.update({
        where: { id: contratoIdNum },
        data: {
          kilometrajeFinal: kmNum,
          estado: EstadoContrato.FINALIZADO,
        },
      });

      // Liberar vehículo a DISPONIBLE con el nuevo odómetro
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