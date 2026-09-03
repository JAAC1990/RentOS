/**
 * ============================================================================
 * RentOS - Rutas de Configuración de Empresa y Marca Blanca (White-Label)
 * ============================================================================
 * Maneja la parametrización de cada empresa RentCar: logotipo oficial, color primario,
 * eslogan, políticas de renta, tarifas de kilometraje extra, WhatsApp y eliminación
 * segura en cascada (excluyendo la matriz principal ID #1).
 */

import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// ----------------------------------------------------------------------------
// GET /api/rentcars
// ----------------------------------------------------------------------------
// Obtiene todas las empresas registradas con el conteo de flota, clientes y contratos
router.get("/", async (_req, res) => {
  try {
    const rentcars = await prisma.rentCar.findMany({
      include: {
        _count: {
          select: {
            vehiculos: true,
            clientes: true,
            contratos: true,
            usuarios: true,
            mantenimientos: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    res.json(rentcars);
  } catch (error) {
    console.error("Error al obtener Rent Cars:", error);
    res.status(500).json({
      error: "No fue posible obtener los Rent Cars.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// GET /api/rentcars/portal/:slug
// ----------------------------------------------------------------------------
// Endpoint público para cargar el sitio web independiente de una empresa Rent a Car
router.get("/portal/:slug", async (req, res) => {
  try {
    const slugParam = req.params.slug.trim().toLowerCase();

    // Intentar buscar por slug único o por ID numérico si aplica
    let rentcar = await prisma.rentCar.findUnique({
      where: { slug: slugParam },
      include: {
        vehiculos: {
          where: {
            estado: { in: ["DISPONIBLE", "ALQUILADO"] },
          },
          orderBy: { tarifaDiaria: "asc" },
        },
      },
    });

    if (!rentcar && !isNaN(Number(slugParam))) {
      rentcar = await prisma.rentCar.findUnique({
        where: { id: Number(slugParam) },
        include: {
          vehiculos: {
            where: {
              estado: { in: ["DISPONIBLE", "ALQUILADO"] },
            },
            orderBy: { tarifaDiaria: "asc" },
          },
        },
      });
    }

    if (!rentcar) {
      return res.status(404).json({ error: "Empresa Rent a Car no encontrada o portal inactivo." });
    }

    res.json({
      id: rentcar.id,
      nombre: rentcar.nombre,
      slug: rentcar.slug,
      rnc: rentcar.rnc,
      telefono: rentcar.telefono,
      whatsapp: rentcar.whatsapp || rentcar.telefono,
      email: rentcar.email,
      direccion: rentcar.direccion,
      ciudad: rentcar.ciudad,
      logoUrl: rentcar.logoUrl,
      eslogan: rentcar.eslogan,
      colorPrimario: rentcar.colorPrimario || "#0284c7",
      moneda: rentcar.moneda || "USD",
      limiteKilometrajeDiario: rentcar.limiteKilometrajeDiario || 200,
      cargoKmExtra: rentcar.cargoKmExtra || 0.25,
      depositoEstandar: rentcar.depositoEstandar || 200.0,
      vehiculos: rentcar.vehiculos,
    });
  } catch (error) {
    console.error("Error al cargar portal público de Rent a Car:", error);
    res.status(500).json({ error: "Error al cargar la información del portal web." });
  }
});

// ----------------------------------------------------------------------------
// GET /api/rentcars/:id
// ----------------------------------------------------------------------------
// Obtiene el perfil y la configuración de marca de un RentCar específico
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "El ID del Rent Car no es válido." });
    }

    const rentcar = await prisma.rentCar.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vehiculos: true,
            clientes: true,
            contratos: true,
            usuarios: true,
          },
        },
      },
    });

    if (!rentcar) {
      return res.status(404).json({ error: "Rent Car no encontrado." });
    }

    res.json(rentcar);
  } catch (error) {
    console.error("Error al obtener Rent Car:", error);
    res.status(500).json({
      error: "No fue posible obtener el Rent Car.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// POST /api/rentcars
// ----------------------------------------------------------------------------
// Crea un nuevo registro de empresa con sus parámetros iniciales
router.post("/", async (req, res) => {
  try {
    const {
      nombre,
      rnc,
      telefono,
      email,
      direccion,
      ciudad,
      logoUrl,
      moneda,
      terminosContrato,
      limiteKilometrajeDiario,
      cargoKmExtra,
      depositoEstandar,
    } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: "El nombre del Rent Car es obligatorio." });
    }

    const nuevoRentCar = await prisma.rentCar.create({
      data: {
        nombre: nombre.trim(),
        rnc: rnc ? rnc.trim() : null,
        telefono: telefono ? telefono.trim() : null,
        email: email ? email.trim() : null,
        direccion: direccion ? direccion.trim() : null,
        ciudad: ciudad ? ciudad.trim() : "Santo Domingo",
        logoUrl: logoUrl ? logoUrl.trim() : null,
        moneda: moneda ? String(moneda).trim() : "USD",
        terminosContrato: terminosContrato ? String(terminosContrato).trim() : null,
        limiteKilometrajeDiario: limiteKilometrajeDiario ? Number(limiteKilometrajeDiario) : 200,
        cargoKmExtra: cargoKmExtra !== undefined ? Number(cargoKmExtra) : 0.25,
        depositoEstandar: depositoEstandar !== undefined ? Number(depositoEstandar) : 200.0,
      },
    });

    res.status(201).json(nuevoRentCar);
  } catch (error) {
    console.error("Error al crear Rent Car:", error);
    res.status(500).json({
      error: "No fue posible crear el Rent Car.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// PUT /api/rentcars/:id
// ----------------------------------------------------------------------------
// Actualiza la marca blanca, logotipo, color primario, eslogan y políticas del RentCar
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "El ID del Rent Car no es válido." });
    }

    const {
      nombre,
      rnc,
      telefono,
      email,
      direccion,
      ciudad,
      logoUrl,
      eslogan,
      colorPrimario,
      whatsapp,
      moneda,
      terminosContrato,
      limiteKilometrajeDiario,
      cargoKmExtra,
      depositoEstandar,
      activo,
    } = req.body;

    const dataToUpdate: Record<string, unknown> = {};

    if (nombre !== undefined) dataToUpdate.nombre = nombre.trim();
    if (req.body.slug !== undefined) {
      dataToUpdate.slug = req.body.slug
        ? String(req.body.slug)
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9-]+/g, "")
        : null;
    }
    if (rnc !== undefined) dataToUpdate.rnc = rnc ? rnc.trim() : null;
    if (telefono !== undefined) dataToUpdate.telefono = telefono ? telefono.trim() : null;
    if (email !== undefined) dataToUpdate.email = email ? email.trim() : null;
    if (direccion !== undefined) dataToUpdate.direccion = direccion ? direccion.trim() : null;
    if (ciudad !== undefined) dataToUpdate.ciudad = ciudad ? ciudad.trim() : "Santo Domingo";
    if (logoUrl !== undefined) dataToUpdate.logoUrl = logoUrl ? logoUrl.trim() : null;
    if (eslogan !== undefined) dataToUpdate.eslogan = eslogan ? String(eslogan).trim() : null;
    if (colorPrimario !== undefined) dataToUpdate.colorPrimario = colorPrimario ? String(colorPrimario).trim() : "#0284c7";
    if (whatsapp !== undefined) dataToUpdate.whatsapp = whatsapp ? String(whatsapp).trim() : null;
    if (moneda !== undefined) dataToUpdate.moneda = String(moneda).trim();
    if (terminosContrato !== undefined) dataToUpdate.terminosContrato = terminosContrato ? String(terminosContrato).trim() : null;
    if (req.body.tipoPlantillaContrato !== undefined) dataToUpdate.tipoPlantillaContrato = String(req.body.tipoPlantillaContrato).trim();
    if (req.body.clausulasPersonalizadas !== undefined) dataToUpdate.clausulasPersonalizadas = req.body.clausulasPersonalizadas ? String(req.body.clausulasPersonalizadas).trim() : null;
    if (limiteKilometrajeDiario !== undefined) dataToUpdate.limiteKilometrajeDiario = Number(limiteKilometrajeDiario);
    if (cargoKmExtra !== undefined) dataToUpdate.cargoKmExtra = Number(cargoKmExtra);
    if (depositoEstandar !== undefined) dataToUpdate.depositoEstandar = Number(depositoEstandar);
    if (req.body.telegramChatId !== undefined) dataToUpdate.telegramChatId = req.body.telegramChatId ? String(req.body.telegramChatId).trim() : null;
    if (activo !== undefined) dataToUpdate.activo = Boolean(activo);

    const rentcar = await prisma.rentCar.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json(rentcar);
  } catch (error) {
    console.error("Error al actualizar Rent Car:", error);
    res.status(500).json({
      error: "No fue posible actualizar el Rent Car.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// DELETE /api/rentcars/:id
// ----------------------------------------------------------------------------
// Elimina en cascada una empresa, sus vehículos, contratos, pagos y usuarios (Protegiendo ID #1)
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "El ID del Rent Car no es válido." });
    }

    if (id === 1) {
      return res.status(400).json({
        error: "No es posible eliminar la empresa matriz principal de RentOS (ID #1).",
      });
    }

    const rentcar = await prisma.rentCar.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            vehiculos: true,
            contratos: true,
            usuarios: true,
          },
        },
      },
    });

    if (!rentcar) {
      return res.status(404).json({ error: "Rent Car no encontrado." });
    }

    // Eliminación atómica en cascada dentro de una transacción
    await prisma.$transaction(async (tx) => {
      // 1. Obtener contratos del RentCar
      const contratos = await tx.contrato.findMany({
        where: { rentCarId: id },
        select: { id: true },
      });
      const contratoIds = contratos.map((c) => c.id);

      // 2. Obtener entregas asociadas a esos contratos
      if (contratoIds.length > 0) {
        const entregas = await tx.entrega.findMany({
          where: { contratoId: { in: contratoIds } },
          select: { id: true },
        });
        const entregaIds = entregas.map((e) => e.id);

        if (entregaIds.length > 0) {
          // Eliminar defectos y fotos
          await tx.defectoVehiculo.deleteMany({
            where: { entregaId: { in: entregaIds } },
          });
          await tx.evidencia.deleteMany({
            where: { entregaId: { in: entregaIds } },
          });
          await tx.entrega.deleteMany({
            where: { id: { in: entregaIds } },
          });
        }

        // Eliminar pagos asociados
        await tx.pago.deleteMany({
          where: { contratoId: { in: contratoIds } },
        });

        // Eliminar contratos
        await tx.contrato.deleteMany({
          where: { rentCarId: id },
        });
      }

      // 3. Obtener vehículos del RentCar
      const vehiculos = await tx.vehiculo.findMany({
        where: { rentCarId: id },
        select: { id: true },
      });
      const vehiculoIds = vehiculos.map((v) => v.id);

      if (vehiculoIds.length > 0) {
        await tx.mantenimiento.deleteMany({
          where: { vehiculoId: { in: vehiculoIds } },
        });
        await tx.ubicacionGPS.deleteMany({
          where: { vehiculoId: { in: vehiculoIds } },
        });
        await tx.transferenciaFlota.deleteMany({
          where: {
            OR: [
              { vehiculoId: { in: vehiculoIds } },
              { rentCarOrigenId: id },
              { rentCarDestinoId: id },
            ],
          },
        });
        await tx.vehiculo.deleteMany({
          where: { rentCarId: id },
        });
      }

      // 4. Eliminar mantenimientos directos
      await tx.mantenimiento.deleteMany({
        where: { rentCarId: id },
      });

      // 5. Eliminar usuarios del RentCar
      await tx.usuario.deleteMany({
        where: { rentCarId: id },
      });

      // 6. Eliminar el RentCar
      await tx.rentCar.delete({
        where: { id },
      });
    });

    res.json({
      mensaje: `La empresa "${rentcar.nombre}" (ID #${rentcar.id}) ha sido eliminada exitosamente junto con sus registros asociados.`,
    });
  } catch (error) {
    console.error("Error al eliminar Rent Car:", error);
    res.status(500).json({
      error: "No fue posible eliminar el Rent Car.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
