import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// Asegurar la existencia de al menos 3 empresas aliadas en la red
async function inicializarRedAliada() {
  const conteo = await prisma.rentCar.count();
  if (conteo < 3) {
    const rentCarPuntaCana = await prisma.rentCar.create({
      data: {
        nombre: "RentOS Punta Cana & Bávaro",
        rnc: "132-44556-2",
        telefono: "809-555-8822",
        email: "puntacana@rentos.do",
        direccion: "Blvd. Turístico del Este Km 14, Punta Cana",
        ciudad: "Punta Cana",
        moneda: "USD",
      },
    });

    const rentCarSantiago = await prisma.rentCar.create({
      data: {
        nombre: "RentOS Cibao - Santiago",
        rnc: "132-77889-3",
        telefono: "809-555-3344",
        email: "santiago@rentos.do",
        direccion: "Autopista Duarte Km 4, Santiago",
        ciudad: "Santiago",
        moneda: "USD",
      },
    });

    // Agregar vehículos en las empresas aliadas
    await prisma.vehiculo.createMany({
      data: [
        {
          rentCarId: rentCarPuntaCana.id,
          marca: "Ford",
          modelo: "Explorer 4x4",
          anio: 2024,
          color: "Negro",
          placa: "G-998822",
          vin: "1FM5K8F84RGA99882",
          kilometraje: 14200,
          estado: "DISPONIBLE",
          tarifaDiaria: 85.0,
        },
        {
          rentCarId: rentCarPuntaCana.id,
          marca: "Jeep",
          modelo: "Wrangler Unlimited",
          anio: 2023,
          color: "Rojo",
          placa: "G-771144",
          vin: "1C4HJXDG4PW771144",
          kilometraje: 21500,
          estado: "DISPONIBLE",
          tarifaDiaria: 95.0,
        },
        {
          rentCarId: rentCarSantiago.id,
          marca: "Toyota",
          modelo: "Hilux Revo 4WD",
          anio: 2024,
          color: "Blanco",
          placa: "L-445588",
          vin: "MROFR22G4P0445588",
          kilometraje: 11000,
          estado: "DISPONIBLE",
          tarifaDiaria: 75.0,
        },
        {
          rentCarId: rentCarSantiago.id,
          marca: "Hyundai",
          modelo: "Tucson GL",
          anio: 2023,
          color: "Gris",
          placa: "G-332211",
          vin: "KM8J33A49PU332211",
          kilometraje: 18000,
          estado: "DISPONIBLE",
          tarifaDiaria: 45.0,
        },
      ],
      skipDuplicates: true,
    });
  }
}

// ======================================================
// GET /api/red/flota
// Búsqueda cruzada de vehículos en toda la red SaaS
// ======================================================
router.get("/flota", async (req, res) => {
  try {
    await inicializarRedAliada();

    const { ciudad, marca, estado } = req.query;

    const where: Record<string, unknown> = {};

    if (marca) {
      where.marca = { contains: String(marca), mode: "insensitive" };
    }

    if (estado) {
      where.estado = String(estado);
    }

    if (ciudad) {
      where.rentCar = {
        ciudad: { contains: String(ciudad), mode: "insensitive" },
      };
    }

    const vehiculos = await prisma.vehiculo.findMany({
      where,
      include: {
        rentCar: {
          select: {
            id: true,
            nombre: true,
            ciudad: true,
            telefono: true,
            email: true,
          },
        },
      },
      orderBy: [{ rentCarId: "asc" }, { id: "asc" }],
    });

    res.json(vehiculos);
  } catch (error) {
    console.error("Error en búsqueda cruzada de flota:", error);
    res.status(500).json({
      error: "No fue posible realizar la búsqueda en la red de flota.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// GET /api/red/rentcars
// Listado de empresas aliadas
// ======================================================
router.get("/rentcars", async (_req, res) => {
  try {
    await inicializarRedAliada();

    const rentcars = await prisma.rentCar.findMany({
      include: {
        _count: {
          select: {
            vehiculos: true,
            contratos: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    res.json(rentcars);
  } catch (error) {
    console.error("Error al obtener aliados de red:", error);
    res.status(500).json({
      error: "No fue posible obtener los Rent Cars aliados.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// GET /api/red/transferencias
// Listado de solicitudes de transferencia de vehículos
// ======================================================
router.get("/transferencias", async (_req, res) => {
  try {
    const transferencias = await prisma.transferenciaFlota.findMany({
      include: {
        vehiculo: {
          include: {
            rentCar: true,
          },
        },
      },
      orderBy: { fechaSolicitud: "desc" },
    });

    res.json(transferencias);
  } catch (error) {
    console.error("Error al obtener transferencias:", error);
    res.status(500).json({
      error: "No fue posible obtener las transferencias de flota.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// POST /api/red/transferencias
// Solicitar préstamo / transferencia de vehículo a aliado
// ======================================================
router.post("/transferencias", async (req, res) => {
  try {
    const { vehiculoId, origenRentCarId, destinoRentCarId, tarifaPactada, notas } = req.body;

    if (!vehiculoId || !origenRentCarId || !destinoRentCarId || !tarifaPactada) {
      return res.status(400).json({
        error: "vehiculoId, origenRentCarId, destinoRentCarId y tarifaPactada son requeridos.",
      });
    }

    const nuevaTransferencia = await prisma.transferenciaFlota.create({
      data: {
        vehiculoId: Number(vehiculoId),
        origenRentCarId: Number(origenRentCarId),
        destinoRentCarId: Number(destinoRentCarId),
        tarifaPactada: Number(tarifaPactada),
        estado: "PENDIENTE",
        notas: notas ? String(notas).trim() : null,
      },
      include: {
        vehiculo: true,
      },
    });

    res.status(201).json(nuevaTransferencia);
  } catch (error) {
    console.error("Error al solicitar transferencia de flota:", error);
    res.status(500).json({
      error: "No fue posible registrar la solicitud de transferencia.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ======================================================
// PUT /api/red/transferencias/:id/estado
// Cambiar estado de transferencia (APROBADA, EN_TRANSITO, COMPLETADA)
// ======================================================
router.put("/transferencias/:id/estado", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ error: "El nuevo estado es requerido." });
    }

    const transferencia = await prisma.transferenciaFlota.update({
      where: { id },
      data: { estado: String(estado) },
      include: { vehiculo: true },
    });

    res.json(transferencia);
  } catch (error) {
    console.error("Error al actualizar estado de transferencia:", error);
    res.status(500).json({
      error: "No fue posible actualizar el estado de la transferencia.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
