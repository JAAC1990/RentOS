import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// ======================================================
// GET /api/clientes
// Obtener todos los clientes
// ======================================================
router.get("/", async (_req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        documentos: true,
        contratos: {
          include: {
            vehiculo: true,
          },
        },
      },
    });

    res.json(clientes);
  } catch (error) {
    console.error("Error al obtener clientes:", error);

    res.status(500).json({
      error: "No fue posible obtener los clientes.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// GET /api/clientes/:id
// Obtener un cliente específico
// ======================================================
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "El ID del cliente no es válido.",
      });
    }

    const cliente = await prisma.cliente.findUnique({
      where: {
        id,
      },
      include: {
        documentos: true,

        contratos: {
          include: {
            vehiculo: true,
            pagos: true,

            entrega: {
              include: {
                evidencias: true,
              },
            },
          },
        },

        consultasCredito: {
          orderBy: {
            fechaHora: "desc",
          },
        },
      },
    });

    if (!cliente) {
      return res.status(404).json({
        error: "Cliente no encontrado.",
      });
    }

    res.json(cliente);
  } catch (error) {
    console.error("Error al obtener cliente:", error);

    res.status(500).json({
      error: "No fue posible obtener el cliente.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// POST /api/clientes
// Crear un cliente
// ======================================================
router.post("/", async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      telefono,
      email,
      direccion,
      fechaNacimiento,
    } = req.body;

    if (!nombre || !apellido || !telefono) {
      return res.status(400).json({
        error: "Nombre, apellido y teléfono son obligatorios.",
      });
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre: String(nombre).trim(),
        apellido: String(apellido).trim(),
        telefono: String(telefono).trim(),

        email: email
          ? String(email).trim()
          : undefined,

        direccion: direccion
          ? String(direccion).trim()
          : undefined,

        fechaNacimiento: fechaNacimiento
          ? new Date(fechaNacimiento)
          : undefined,
      },
    });

    res.status(201).json(cliente);
  } catch (error) {
    console.error("Error al crear cliente:", error);

    res.status(500).json({
      error: "No fue posible crear el cliente.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// PUT /api/clientes/:id
// Actualizar un cliente
// ======================================================
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "El ID del cliente no es válido.",
      });
    }

    const clienteExistente = await prisma.cliente.findUnique({
      where: {
        id,
      },
    });

    if (!clienteExistente) {
      return res.status(404).json({
        error: "Cliente no encontrado.",
      });
    }

    const {
      nombre,
      apellido,
      telefono,
      email,
      direccion,
      fechaNacimiento,
      estado,
    } = req.body;

    const cliente = await prisma.cliente.update({
      where: {
        id,
      },

      data: {
        nombre:
          nombre !== undefined
            ? String(nombre).trim()
            : undefined,

        apellido:
          apellido !== undefined
            ? String(apellido).trim()
            : undefined,

        telefono:
          telefono !== undefined
            ? String(telefono).trim()
            : undefined,

        email:
          email !== undefined
            ? String(email).trim()
            : undefined,

        direccion:
          direccion !== undefined
            ? String(direccion).trim()
            : undefined,

        fechaNacimiento:
          fechaNacimiento !== undefined
            ? fechaNacimiento
              ? new Date(fechaNacimiento)
              : null
            : undefined,

        estado:
          estado !== undefined
            ? estado
            : undefined,
      },
    });

    res.json(cliente);
  } catch (error) {
    console.error("Error al actualizar cliente:", error);

    res.status(500).json({
      error: "No fue posible actualizar el cliente.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// DELETE /api/clientes/:id
// Desactivar un cliente
// ======================================================
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "El ID del cliente no es válido.",
      });
    }

    const clienteExistente = await prisma.cliente.findUnique({
      where: {
        id,
      },
    });

    if (!clienteExistente) {
      return res.status(404).json({
        error: "Cliente no encontrado.",
      });
    }

    const cliente = await prisma.cliente.update({
      where: {
        id,
      },

      data: {
        estado: "INACTIVO",
      },
    });

    res.json({
      mensaje: "Cliente marcado como inactivo.",
      cliente,
    });
  } catch (error) {
    console.error("Error al desactivar cliente:", error);

    res.status(500).json({
      error: "No fue posible desactivar el cliente.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;