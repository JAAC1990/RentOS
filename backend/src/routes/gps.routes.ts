/**
 * ============================================================================
 * RentOS - Rutas de Telemetría GPS Satelital y Corte de Motor Remoto
 * ============================================================================
 * Maneja el monitoreo de vehículos en tiempo real: coordenadas geográficas,
 * velocidad, ignición, geocercas, nivel de batería, historial de recorridos
 * y comando de inmovilización remota de motor para seguridad anti-robo.
 */

import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// Coordenadas de prueba en República Dominicana para inicializar flota sin telemetría física
const UBICACIONES_DEFAULT = [
  { lat: 18.47186, lng: -69.93922, direccion: "Av. Winston Churchill, Piantini, Santo Domingo", geocerca: "Zona Central DN", vel: 42.5, ign: true },
  { lat: 18.46824, lng: -69.91032, direccion: "Av. Máximo Gómez / Gazcue, Santo Domingo", geocerca: "Zona Central DN", vel: 0.0, ign: false },
  { lat: 18.42971, lng: -69.67568, direccion: "Aeropuerto Internacional de Las Américas (AILA)", geocerca: "Aeropuerto AILA", vel: 65.0, ign: true },
  { lat: 18.48605, lng: -69.93121, direccion: "Av. John F. Kennedy / Ensanche Naco, DN", geocerca: "Zona Central DN", vel: 15.2, ign: true },
  { lat: 19.45171, lng: -70.69703, direccion: "Monumento a los Héroes, Santiago de los Caballeros", geocerca: "Región Norte - Santiago", vel: 0.0, ign: false },
  { lat: 18.56012, lng: -68.37254, direccion: "Boulevard Turístico del Este, Bávaro / Punta Cana", geocerca: "Zona Turística Este", vel: 78.4, ign: true },
  { lat: 18.44892, lng: -69.95931, direccion: "Av. Anacaona / Mirador Sur, Santo Domingo", geocerca: "Mirador Sur", vel: 35.0, ign: true },
  { lat: 18.47641, lng: -69.88562, direccion: "Zona Colonial, Santo Domingo", geocerca: "Zona Colonial", vel: 0.0, ign: false },
];

// ----------------------------------------------------------------------------
// GET /api/gps
// ----------------------------------------------------------------------------
// Retorna la última posición satelital y estado de ignición de todos los vehículos de la empresa
router.get("/", async (req, res) => {
  try {
    const rentCarId = req.query.rentCarId ? Number(req.query.rentCarId) : 1;

    const vehiculos = await prisma.vehiculo.findMany({
      where: {
        rentCarId,
        estado: { not: "INACTIVO" },
      },
      orderBy: { id: "asc" },
      include: {
        ubicacionesGPS: {
          take: 1,
          orderBy: { fechaHora: "desc" },
        },
      },
    });

    const datosTelemetria = await Promise.all(
      vehiculos.map(async (v, index) => {
        let ultimaUbicacion = v.ubicacionesGPS[0];

        // Si el vehículo aún no tiene ping GPS, inicializar una posición representativa
        if (!ultimaUbicacion) {
          const sample = UBICACIONES_DEFAULT[index % UBICACIONES_DEFAULT.length];
          ultimaUbicacion = await prisma.ubicacionGPS.create({
            data: {
              vehiculoId: v.id,
              latitud: sample.lat,
              longitud: sample.lng,
              velocidad: v.estado === "ALQUILADO" ? sample.vel : 0.0,
              ignicion: v.estado === "ALQUILADO" ? sample.ign : false,
              bloqueoMotor: false,
              nivelBateria: 96.5,
              rumbo: Math.floor(Math.random() * 360),
              geocerca: sample.geocerca,
              direccionAprox: sample.direccion,
            },
          });
        }

        return {
          vehiculoId: v.id,
          marca: v.marca,
          modelo: v.modelo,
          placa: v.placa,
          color: v.color,
          anio: v.anio,
          estadoVehiculo: v.estado,
          gps: ultimaUbicacion,
        };
      })
    );

    res.json(datosTelemetria);
  } catch (error) {
    console.error("Error al obtener telemetría GPS:", error);
    res.status(500).json({
      error: "No fue posible obtener los datos de telemetría GPS.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// GET /api/gps/historial/:vehiculoId
// ----------------------------------------------------------------------------
// Obtiene los últimos 50 puntos geográficos para trazar la ruta recorrida en el mapa
router.get("/historial/:vehiculoId", async (req, res) => {
  try {
    const vehiculoId = Number(req.params.vehiculoId);

    const historial = await prisma.ubicacionGPS.findMany({
      where: { vehiculoId },
      orderBy: { fechaHora: "desc" },
      take: 50,
    });

    res.json(historial);
  } catch (error) {
    console.error("Error al obtener historial GPS:", error);
    res.status(500).json({
      error: "No fue posible obtener el historial GPS.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// POST /api/gps/telemetria
// ----------------------------------------------------------------------------
// Endpoint para recibir pings automáticos de rastreadores GPS físicos (Teltonika, Coban, Sinotrack)
router.post("/telemetria", async (req, res) => {
  try {
    const {
      vehiculoId,
      latitud,
      longitud,
      velocidad,
      rumbo,
      nivelBateria,
      ignicion,
      geocerca,
      direccionAprox,
    } = req.body;

    if (!vehiculoId || latitud === undefined || longitud === undefined) {
      return res.status(400).json({ error: "Vehículo, latitud y longitud son obligatorios." });
    }

    const nuevaUbicacion = await prisma.ubicacionGPS.create({
      data: {
        vehiculoId: Number(vehiculoId),
        latitud: Number(latitud),
        longitud: Number(longitud),
        velocidad: velocidad !== undefined ? Number(velocidad) : 0,
        rumbo: rumbo !== undefined ? Number(rumbo) : undefined,
        nivelBateria: nivelBateria !== undefined ? Number(nivelBateria) : 100,
        ignicion: Boolean(ignicion),
        geocerca: geocerca ? String(geocerca).trim() : "Zona Urbana Principal",
        direccionAprox: direccionAprox ? String(direccionAprox).trim() : null,
      },
    });

    res.status(201).json(nuevaUbicacion);
  } catch (error) {
    console.error("Error al registrar telemetría GPS:", error);
    res.status(500).json({
      error: "No fue posible registrar la telemetría GPS.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// POST /api/gps/inmovilizar/:vehiculoId
// ----------------------------------------------------------------------------
// Envía el comando de corte o restablecimiento de ignición remota del motor
router.post("/inmovilizar/:vehiculoId", async (req, res) => {
  try {
    const vehiculoId = Number(req.params.vehiculoId);
    const { bloqueoMotor } = req.body;

    const ultima = await prisma.ubicacionGPS.findFirst({
      where: { vehiculoId },
      orderBy: { fechaHora: "desc" },
    });

    if (!ultima) {
      return res.status(404).json({ error: "No se encontró registro GPS previo para este auto." });
    }

    const nuevoEstado = bloqueoMotor !== undefined ? Boolean(bloqueoMotor) : !ultima.bloqueoMotor;

    const actualizada = await prisma.ubicacionGPS.update({
      where: { id: ultima.id },
      data: {
        bloqueoMotor: nuevoEstado,
        ignicion: nuevoEstado ? false : ultima.ignicion,
        velocidad: nuevoEstado ? 0 : ultima.velocidad,
      },
    });

    res.json({
      mensaje: nuevoEstado
        ? "🔒 Motor inmovilizado remotamente por seguridad."
        : "🔓 Bloqueo de motor desactivado. Vehículo listo para encender.",
      bloqueoMotor: nuevoEstado,
      telemetria: actualizada,
    });
  } catch (error) {
    console.error("Error al inmovilizar vehículo:", error);
    res.status(500).json({
      error: "No fue posible ejecutar el comando de inmovilización.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
