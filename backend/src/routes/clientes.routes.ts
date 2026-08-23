import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// ======================================================
// GET /api/clientes
// Obtener todos los clientes (filtrados opcionalmente por rentCarId)
// ======================================================
router.get("/", async (req, res) => {
  try {
    const rentCarId = req.query.rentCarId ? Number(req.query.rentCarId) : 1;

    const clientes = await prisma.cliente.findMany({
      where: {
        rentCarId,
      },
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
// Obtener un cliente específico con su expediente completo
// ======================================================
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "El ID del cliente no es válido." });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        documentos: true,
        contratos: {
          include: {
            vehiculo: true,
            pagos: true,
          },
        },
        consultasCredito: {
          orderBy: { fechaHora: "desc" },
        },
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado." });
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
// Registrar un nuevo cliente
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
      rentCarId,
      estado,
    } = req.body;

    if (!nombre || !apellido || !telefono) {
      return res.status(400).json({
        error: "Nombre, apellido y teléfono son obligatorios.",
      });
    }

    const cliente = await prisma.cliente.create({
      data: {
        rentCarId: rentCarId ? Number(rentCarId) : 1,
        nombre: String(nombre).trim(),
        apellido: String(apellido).trim(),
        telefono: String(telefono).trim(),
        email: email ? String(email).trim() : null,
        direccion: direccion ? String(direccion).trim() : null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        estado: estado || "ACTIVO",
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
// Actualizar información del cliente
// ======================================================
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "El ID del cliente no es válido." });
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
      where: { id },
      data: {
        ...(nombre !== undefined && { nombre: String(nombre).trim() }),
        ...(apellido !== undefined && { apellido: String(apellido).trim() }),
        ...(telefono !== undefined && { telefono: String(telefono).trim() }),
        ...(email !== undefined && { email: email ? String(email).trim() : null }),
        ...(direccion !== undefined && { direccion: direccion ? String(direccion).trim() : null }),
        ...(fechaNacimiento !== undefined && {
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        }),
        ...(estado !== undefined && { estado }),
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
// Eliminar o desactivar un cliente
// ======================================================
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "El ID del cliente no es válido." });
    }

    // Comprobar si tiene contratos activos
    const contratos = await prisma.contrato.count({
      where: { clienteId: id },
    });

    if (contratos > 0) {
      // Si tiene historial de contratos, se desactiva para no romper historial
      const cliente = await prisma.cliente.update({
        where: { id },
        data: { estado: "INACTIVO" },
      });
      return res.json({
        mensaje: "El cliente tiene contratos asociados; se marcó como INACTIVO para proteger el historial.",
        cliente,
      });
    }

    // Si no tiene contratos, se puede eliminar completamente
    await prisma.documentoCliente.deleteMany({ where: { clienteId: id } });
    await prisma.usuarioCliente.deleteMany({ where: { clienteId: id } });
    await prisma.consultaCredito.deleteMany({ where: { clienteId: id } });
    await prisma.cliente.delete({ where: { id } });

    res.json({ mensaje: "Cliente eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    res.status(500).json({
      error: "No fue posible eliminar el cliente.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;