import { Router } from "express";
import { EstadoContrato } from "@prisma/client";
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
            cliente: true,
            vehiculo: true,
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
      return res.status(400).json({
        error: "El ID de la entrega no es valido.",
      });
    }

    const entrega = await prisma.entrega.findUnique({
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
        evidencias: true,
        defectos: true,
      },
    });

    if (!entrega) {
      return res.status(404).json({
        error: "Entrega no encontrada.",
      });
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
      observaciones,
    } = req.body;

    if (
      contratoId === undefined ||
      usuarioId === undefined ||
      kilometraje === undefined
    ) {
      return res.status(400).json({
        error: "Contrato, usuario y kilometraje son obligatorios.",
      });
    }

    const contratoIdNumero = Number(contratoId);
    const usuarioIdNumero = Number(usuarioId);
    const kilometrajeNumero = Number(kilometraje);

    if (!Number.isInteger(contratoIdNumero)) {
      return res.status(400).json({
        error: "El contratoId no es valido.",
      });
    }

    if (!Number.isInteger(usuarioIdNumero)) {
      return res.status(400).json({
        error: "El usuarioId no es valido.",
      });
    }

    if (
      !Number.isInteger(kilometrajeNumero) ||
      kilometrajeNumero < 0
    ) {
      return res.status(400).json({
        error: "El kilometraje no es valido.",
      });
    }

    const contrato = await prisma.contrato.findUnique({
      where: {
        id: contratoIdNumero,
      },
      include: {
        cliente: true,
        vehiculo: true,
        entrega: true,
      },
    });

    if (!contrato) {
      return res.status(404).json({
        error: "Contrato no encontrado.",
      });
    }

    if (contrato.entrega) {
      return res.status(400).json({
        error: "Este contrato ya tiene una entrega registrada.",
      });
    }

    if (kilometrajeNumero < contrato.kilometrajeInicial) {
      return res.status(400).json({
        error:
          "El kilometraje de la entrega no puede ser menor que el kilometraje inicial del contrato.",
        kilometrajeInicial: contrato.kilometrajeInicial,
      });
    }

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

    if (!usuario.activo) {
      return res.status(400).json({
        error: "El usuario no esta activo.",
      });
    }

    const entrega = await prisma.$transaction(async (tx) => {
      const nuevaEntrega = await tx.entrega.create({
        data: {
          contratoId: contratoIdNumero,
          usuarioId: usuarioIdNumero,
          kilometraje: kilometrajeNumero,
          nivelCombustible:
            nivelCombustible !== undefined &&
            nivelCombustible !== null
              ? String(nivelCombustible).trim()
              : null,
          tieneDefectos:
            tieneDefectos !== undefined
              ? Boolean(tieneDefectos)
              : false,
          observaciones:
            observaciones !== undefined &&
            observaciones !== null &&
            String(observaciones).trim() !== ""
              ? String(observaciones).trim()
              : null,
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
          evidencias: true,
          defectos: true,
        },
      });

      // Al registrar la devolución, el contrato queda finalizado.
      await tx.contrato.update({
        where: {
          id: contratoIdNumero,
        },
        data: {
          kilometrajeFinal: kilometrajeNumero,
          estado: EstadoContrato.FINALIZADO,
        },
      });

      // El vehículo queda disponible nuevamente y conserva
      // el kilometraje registrado en la devolución.
      await tx.vehiculo.update({
        where: {
          id: contrato.vehiculoId,
        },
        data: {
          kilometraje: kilometrajeNumero,
          estado: "DISPONIBLE",
        },
      });

      // Volvemos a consultar la entrega después de actualizar
      // contrato y vehículo para devolver información actualizada.
      return await tx.entrega.findUniqueOrThrow({
        where: {
          id: nuevaEntrega.id,
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
          evidencias: true,
          defectos: true,
        },
      });
    });

    res.status(201).json(entrega);
  } catch (error) {
    console.error("Error al crear entrega:", error);

    res.status(500).json({
      error: "No fue posible crear la entrega.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;