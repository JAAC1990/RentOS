/**
 * ============================================================================
 * RentOS - Rutas de Red de Aliados y Transferencia Inter-Empresarial de Flota
 * ============================================================================
 * Permite la colaboración B2B entre diferentes empresas de Rent a Car:
 * búsqueda cruzada de vehículos en otras ciudades, solicitud de préstamo de autos
 * con tarifa pactada y trazabilidad de transferencias de flota.
 */

import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

/**
 * Garantiza que existan al menos 3 empresas aliadas en la base de datos
 * (Santo Domingo, Punta Cana y Santiago) para permitir pruebas de transferencias inter-ciudad.
 */
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

    // Agregar inventario vehicular a las sucursales aliadas
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

// ----------------------------------------------------------------------------
// GET /api/red/flota
// ----------------------------------------------------------------------------
// Búsqueda global de vehículos disponibles en toda la red SaaS con filtros de ciudad y marca
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

// ----------------------------------------------------------------------------
// GET /api/red/rentcars
// ----------------------------------------------------------------------------
// Retorna la lista de todas las empresas aliadas y el total de autos y contratos que poseen
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

// ----------------------------------------------------------------------------
// GET /api/red/transferencias
// ----------------------------------------------------------------------------
// Retorna las solicitudes de transferencia y préstamo de vehículos entre empresas
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

// ----------------------------------------------------------------------------
// POST /api/red/transferencias
// ----------------------------------------------------------------------------
// Registra una nueva solicitud de préstamo de flota entre un RentCar origen y destino
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

// ----------------------------------------------------------------------------
// PUT /api/red/transferencias/:id/estado
// ----------------------------------------------------------------------------
// Actualiza el estado de la transferencia (APROBADA, EN_TRANSITO, COMPLETADA, RECHAZADA)
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
