import { Router } from "express";
import bcrypt from "bcryptjs";
import { RolUsuario } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { enviarAlerta } from "../services/alert.service.js";

const router = Router();

// ======================================================
// POST /api/solicitudes/registro
// Solicitud pública de registro de nuevo Rent a Car
// ======================================================
router.post("/registro", async (req, res) => {
  try {
    const {
      nombreNegocio,
      rnc,
      ciudad,
      nombreContacto,
      email,
      telefono,
      password,
      direccion,
    } = req.body;

    if (!nombreNegocio || !nombreContacto || !email || !telefono || !password) {
      return res.status(400).json({
        error: "Nombre del negocio, contacto, email, teléfono y contraseña son obligatorios.",
      });
    }

    const emailTrim = String(email).trim().toLowerCase();

    // Validar si el email ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: emailTrim },
    });

    if (usuarioExistente) {
      return res.status(400).json({
        error: "Ya existe un usuario registrado con este correo electrónico.",
      });
    }

    const hashPassword = await bcrypt.hash(String(password), 10);

    const resultado = await prisma.$transaction(async (tx) => {
      // 1. Crear RentCar en estado PENDIENTE y desactivado
      const nuevoRentCar = await tx.rentCar.create({
        data: {
          nombre: nombreNegocio.trim(),
          rnc: rnc ? rnc.trim() : null,
          ciudad: ciudad ? ciudad.trim() : "Santo Domingo",
          contactoNombre: nombreContacto.trim(),
          email: emailTrim,
          telefono: telefono.trim(),
          direccion: direccion ? direccion.trim() : null,
          estadoRegistro: "PENDIENTE",
          activo: false, // Desactivado hasta que el SuperAdmin lo autorice
        },
      });

      // 2. Crear cuenta de Administrador del RentCar desactivada
      const nuevoUsuario = await tx.usuario.create({
        data: {
          nombre: nombreContacto.trim(),
          email: emailTrim,
          password: hashPassword,
          rol: RolUsuario.ADMIN_RENTCAR,
          rentCarId: nuevoRentCar.id,
          activo: false, // Requiere aprobación del SuperAdmin
        },
      });

      return { nuevoRentCar, nuevoUsuario };
    });

    // 3. Notificar inmediatamente al Telegram del SuperAdmin
    const mensajeTelegram = [
      `🏢 <b>Empresa:</b> ${resultado.nuevoRentCar.nombre}`,
      `👤 <b>Contacto:</b> ${resultado.nuevoRentCar.contactoNombre}`,
      `📞 <b>Teléfono:</b> ${resultado.nuevoRentCar.telefono}`,
      `📧 <b>Email:</b> ${resultado.nuevoRentCar.email}`,
      `📍 <b>Ciudad:</b> ${resultado.nuevoRentCar.ciudad}`,
      "",
      `<i>Entra al panel de SuperAdmin para Autorizar o Rechazar la cuenta.</i>`,
    ].join("\n");

    await enviarAlerta("ALERTA", "Nueva Solicitud de Registro de Rent Car", mensajeTelegram);

    res.status(201).json({
      mensaje: "Solicitud de registro enviada con éxito. El SuperAdministrador revisará y autorizará tu cuenta.",
      rentCarId: resultado.nuevoRentCar.id,
    });
  } catch (error) {
    console.error("Error al procesar solicitud de registro:", error);
    res.status(500).json({
      error: "No fue posible procesar la solicitud de registro.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// GET /api/solicitudes
// Listar todas las solicitudes (Para SuperAdmin)
// ======================================================
router.get("/", async (_req, res) => {
  try {
    const solicitudes = await prisma.rentCar.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rol: true,
            activo: true,
          },
        },
        _count: {
          select: { vehiculos: true },
        },
      },
    });

    res.json(solicitudes);
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).json({
      error: "No fue posible obtener las solicitudes.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// POST /api/solicitudes/:id/aprobar
// Autorizar y Activar una empresa de Rent a Car
// ======================================================
router.post("/:id/aprobar", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "ID no válido." });
    }

    const rentCar = await prisma.rentCar.findUnique({ where: { id } });
    if (!rentCar) {
      return res.status(404).json({ error: "Empresa no encontrada." });
    }

    await prisma.$transaction([
      // Activar RentCar
      prisma.rentCar.update({
        where: { id },
        data: {
          estadoRegistro: "APROBADO",
          activo: true,
        },
      }),
      // Activar usuarios asociados
      prisma.usuario.updateMany({
        where: { rentCarId: id },
        data: { activo: true },
      }),
    ]);

    await enviarAlerta(
      "INFO",
      "Cuenta de Rent Car Aprobada",
      `La empresa <b>${rentCar.nombre}</b> (ID #${rentCar.id}) ha sido autorizada y activada con éxito en RentOS.`
    );

    res.json({
      mensaje: `La empresa ${rentCar.nombre} ha sido autorizada y su cuenta de administrador está activa.`,
    });
  } catch (error) {
    console.error("Error al aprobar solicitud:", error);
    res.status(500).json({
      error: "No fue posible autorizar la solicitud.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// POST /api/solicitudes/:id/rechazar
// Rechazar solicitud de Rent a Car
// ======================================================
router.post("/:id/rechazar", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "ID no válido." });
    }

    const rentCar = await prisma.rentCar.findUnique({ where: { id } });
    if (!rentCar) {
      return res.status(404).json({ error: "Empresa no encontrada." });
    }

    await prisma.$transaction([
      prisma.rentCar.update({
        where: { id },
        data: {
          estadoRegistro: "RECHAZADO",
          activo: false,
        },
      }),
      prisma.usuario.updateMany({
        where: { rentCarId: id },
        data: { activo: false },
      }),
    ]);

    res.json({
      mensaje: `La solicitud de ${rentCar.nombre} ha sido rechazada.`,
    });
  } catch (error) {
    console.error("Error al rechazar solicitud:", error);
    res.status(500).json({
      error: "No fue posible rechazar la solicitud.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
