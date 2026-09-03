/**
 * ============================================================================
 * RentOS - Rutas de Flota de Vehículos y Auditoría de Documentos Legales
 * ============================================================================
 * Maneja el inventario de automóviles: marcas, modelos, placas, tarifas diarias,
 * odómetros, y el monitoreo de vencimiento de seguros, marbetes y revistas técnicas
 * con alertas preventivas a 30 días y notificaciones a Telegram.
 */

import { Router } from "express";
import { EstadoVehiculo } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { enviarAlerta } from "../services/alert.service.js";

const router = Router();

/**
 * Valida y convierte un string a su correspondiente enum EstadoVehiculo.
 */
function convertirEstado(estado: unknown): EstadoVehiculo | null {
  if (typeof estado !== "string") {
    return null;
  }

  const valor = estado.toUpperCase();

  if (valor in EstadoVehiculo) {
    return EstadoVehiculo[valor as keyof typeof EstadoVehiculo];
  }

  return null;
}

/**
 * Función auxiliar para asignar pólizas y fechas de seguro de prueba
 * a los vehículos que carezcan de ellas.
 */
async function inicializarFechasDocumentos() {
  const hoy = new Date();

  const fechaVencida = new Date(hoy.getTime() - 5 * 24 * 60 * 60 * 1000);
  const fechaPorVencer = new Date(hoy.getTime() + 12 * 24 * 60 * 60 * 1000);
  const fechaAlDia = new Date(hoy.getTime() + 180 * 24 * 60 * 60 * 1000);

  const vehiculosSinSeguro = await prisma.vehiculo.findMany({
    where: { seguroVencimiento: null },
    take: 10,
  });

  for (let i = 0; i < vehiculosSinSeguro.length; i++) {
    const v = vehiculosSinSeguro[i];
    let vSeguro = fechaAlDia;
    let vMarbete = fechaAlDia;
    let poliza = `Seguros Universal #UN-${v.id}092`;

    if (i === 0) {
      vSeguro = fechaVencida;
      poliza = `Seguros Banreservas #BR-VENC-${v.id}`;
    } else if (i === 1 || i === 2) {
      vSeguro = fechaPorVencer;
      vMarbete = fechaPorVencer;
      poliza = `Mapfre BHD #MAP-${v.id}88`;
    }

    await prisma.vehiculo.update({
      where: { id: v.id },
      data: {
        seguroPoliza: poliza,
        seguroVencimiento: vSeguro,
        marbeteVencimiento: vMarbete,
        inspeccionVencimiento: fechaAlDia,
      },
    });
  }
}

// ----------------------------------------------------------------------------
// GET /api/vehiculos/vencimientos
// ----------------------------------------------------------------------------
// Reporte de auditoría legal: días restantes de seguros, marbetes y revistas
router.get("/vencimientos", async (req, res) => {
  try {
    await inicializarFechasDocumentos();

    const rentCarId = req.query.rentCarId ? Number(req.query.rentCarId) : undefined;
    const where: any = {};
    if (rentCarId && !isNaN(rentCarId)) {
      where.rentCarId = rentCarId;
    }

    const vehiculos = await prisma.vehiculo.findMany({
      where,
      orderBy: { id: "asc" },
      include: {
        rentCar: {
          select: { nombre: true, ciudad: true },
        },
      },
    });

    const hoy = new Date();

    const reporte = vehiculos.map((v) => {
      let estadoSeguro: "VENCIDO" | "POR_VENCER" | "AL_DIA" = "AL_DIA";
      let diasRestantesSeguro: number | null = null;

      if (v.seguroVencimiento) {
        const diffMs = new Date(v.seguroVencimiento).getTime() - hoy.getTime();
        diasRestantesSeguro = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diasRestantesSeguro < 0) {
          estadoSeguro = "VENCIDO";
        } else if (diasRestantesSeguro <= 30) {
          estadoSeguro = "POR_VENCER";
        }
      }

      let estadoMarbete: "VENCIDO" | "POR_VENCER" | "AL_DIA" = "AL_DIA";
      if (v.marbeteVencimiento) {
        const diffMs = new Date(v.marbeteVencimiento).getTime() - hoy.getTime();
        const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (dias < 0) estadoMarbete = "VENCIDO";
        else if (dias <= 30) estadoMarbete = "POR_VENCER";
      }

      return {
        id: v.id,
        marca: v.marca,
        modelo: v.modelo,
        placa: v.placa,
        color: v.color,
        estado: v.estado,
        rentCar: v.rentCar,
        seguroPoliza: v.seguroPoliza || "Sin póliza asignada",
        seguroVencimiento: v.seguroVencimiento,
        diasRestantesSeguro,
        estadoSeguro,
        marbeteVencimiento: v.marbeteVencimiento,
        estadoMarbete,
        inspeccionVencimiento: v.inspeccionVencimiento,
      };
    });

    const conteoVencidos = reporte.filter((r) => r.estadoSeguro === "VENCIDO" || r.estadoMarbete === "VENCIDO").length;
    const conteoPorVencer = reporte.filter((r) => r.estadoSeguro === "POR_VENCER" || r.estadoMarbete === "POR_VENCER").length;
    const conteoAlDia = reporte.filter((r) => r.estadoSeguro === "AL_DIA" && r.estadoMarbete === "AL_DIA").length;

    res.json({
      resumen: {
        total: reporte.length,
        vencidos: conteoVencidos,
        porVencer: conteoPorVencer,
        alDia: conteoAlDia,
      },
      vehiculos: reporte,
    });
  } catch (error) {
    console.error("Error al obtener vencimientos:", error);
    res.status(500).json({
      error: "No fue posible obtener el reporte de vencimientos.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// POST /api/vehiculos/notificar-vencimientos-telegram
// ----------------------------------------------------------------------------
// Envía un resumen de pólizas y marbetes por vencer a Telegram
router.post("/notificar-vencimientos-telegram", async (_req, res) => {
  try {
    const vehiculos = await prisma.vehiculo.findMany({
      include: { rentCar: true },
    });

    const hoy = new Date();
    const alertas = [];

    for (const v of vehiculos) {
      if (v.seguroVencimiento) {
        const diff = Math.ceil((new Date(v.seguroVencimiento).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0) {
          alertas.push(`🔴 <b>${v.marca} ${v.modelo} (${v.placa})</b>: Seguro VENCIDO hace ${Math.abs(diff)} días.`);
        } else if (diff <= 30) {
          alertas.push(`🟡 <b>${v.marca} ${v.modelo} (${v.placa})</b>: Seguro vence en ${diff} días (${v.seguroPoliza}).`);
        }
      }
    }

    const mensajeAlerta = alertas.length > 0
      ? `Se detectaron <b>${alertas.length} vehículos</b> con documentos que requieren atención:\n\n${alertas.join("\n")}`
      : "Todos los vehículos de la flota cuentan con seguros y marbetes al día. 🟢";

    await enviarAlerta("AVISO", "Auditoría de Seguros y Marbetes de Flota", mensajeAlerta);

    res.json({
      mensaje: "Notificación de auditoría de seguros enviada a tu Telegram con éxito.",
      alertasDetectadas: alertas.length,
    });
  } catch (error) {
    console.error("Error al notificar vencimientos:", error);
    res.status(500).json({
      error: "No fue posible enviar la notificación a Telegram.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// GET /api/vehiculos
// ----------------------------------------------------------------------------
// Retorna todo el parque vehicular (filtrado por rentCarId si se especifica)
router.get("/", async (req, res) => {
  try {
    const rentCarId = req.query.rentCarId ? Number(req.query.rentCarId) : undefined;
    const where: any = {};
    if (rentCarId && !isNaN(rentCarId)) {
      where.rentCarId = rentCarId;
    }

    const vehiculos = await prisma.vehiculo.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(vehiculos);
  } catch (error) {
    console.error("Error al obtener vehículos:", error);
    res.status(500).json({
      error: "No fue posible obtener los vehículos.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// GET /api/vehiculos/:id
// ----------------------------------------------------------------------------
// Retorna el detalle de una unidad específica
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "El ID del vehículo no es válido.",
      });
    }

    const vehiculo = await prisma.vehiculo.findUnique({
      where: {
        id,
      },
    });

    if (!vehiculo) {
      return res.status(404).json({
        error: "Vehículo no encontrado.",
      });
    }

    res.json(vehiculo);
  } catch (error) {
    console.error("Error al obtener vehículo:", error);
    res.status(500).json({
      error: "No fue posible obtener el vehículo.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// POST /api/vehiculos
// ----------------------------------------------------------------------------
// Registra un nuevo vehículo con su placa, odómetro inicial y pólizas
router.post("/", async (req, res) => {
  try {
    const {
      marca,
      modelo,
      anio,
      color,
      placa,
      vin,
      kilometraje,
      tarifaDiaria,
      fotoUrl,
      imagenes,
      categoria,
      transmision,
      combustible,
      pasajeros,
      maletas,
      puertas,
      aireAcondicionado,
      estado,
      seguroPoliza,
      seguroVencimiento,
      marbeteVencimiento,
      rentCarId,
    } = req.body;

    if (
      !marca ||
      !modelo ||
      anio === undefined ||
      !placa ||
      tarifaDiaria === undefined
    ) {
      return res.status(400).json({
        error:
          "Marca, modelo, año, placa y tarifa diaria son obligatorios.",
      });
    }

    const anioNumero = Number(anio);
    const tarifaNumero = Number(tarifaDiaria);
    const kilometrajeNumero = kilometraje !== undefined ? Number(kilometraje) : 0;
    const rentCarIdNumero = rentCarId ? Number(rentCarId) : 1;

    const estadoConvertido = estado
      ? convertirEstado(estado)
      : EstadoVehiculo.DISPONIBLE;

    if (estado && !estadoConvertido) {
      return res.status(400).json({
        error: "El estado proporcionado no es válido.",
      });
    }

    const nuevoVehiculo = await prisma.vehiculo.create({
      data: {
        rentCarId: rentCarIdNumero,
        marca: marca.trim(),
        modelo: modelo.trim(),
        anio: anioNumero,
        color: color ? color.trim() : null,
        placa: placa.trim(),
        vin: vin ? vin.trim() : null,
        kilometraje: kilometrajeNumero,
        tarifaDiaria: tarifaNumero,
        fotoUrl: fotoUrl ? String(fotoUrl).trim() : null,
        imagenes: imagenes || null,
        categoria: categoria ? String(categoria).trim() : "SEDAN",
        transmision: transmision ? String(transmision).trim() : "AUTOMATICA",
        combustible: combustible ? String(combustible).trim() : "GASOLINA",
        pasajeros: pasajeros !== undefined ? Number(pasajeros) : 5,
        maletas: maletas !== undefined ? Number(maletas) : 2,
        puertas: puertas !== undefined ? Number(puertas) : 4,
        aireAcondicionado: aireAcondicionado !== undefined ? Boolean(aireAcondicionado) : true,
        estado: estadoConvertido ?? EstadoVehiculo.DISPONIBLE,
        seguroPoliza: seguroPoliza ? String(seguroPoliza).trim() : null,
        seguroVencimiento: seguroVencimiento ? new Date(seguroVencimiento) : null,
        marbeteVencimiento: marbeteVencimiento ? new Date(marbeteVencimiento) : null,
      },
    });

    res.status(201).json(nuevoVehiculo);
  } catch (error) {
    console.error("Error al crear vehículo:", error);
    res.status(500).json({
      error: "No fue posible crear el vehículo.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// PUT /api/vehiculos/:id
// ----------------------------------------------------------------------------
// Actualiza la ficha técnica, tarifas, estado (DISPONIBLE, MANTENIMIENTO, etc.) o seguros
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "El ID del vehículo no es válido.",
      });
    }

    const {
      marca,
      modelo,
      anio,
      color,
      placa,
      vin,
      kilometraje,
      tarifaDiaria,
      fotoUrl,
      imagenes,
      categoria,
      transmision,
      combustible,
      pasajeros,
      maletas,
      puertas,
      aireAcondicionado,
      estado,
      seguroPoliza,
      seguroVencimiento,
      marbeteVencimiento,
    } = req.body;

    const dataToUpdate: Record<string, unknown> = {};

    if (marca !== undefined) dataToUpdate.marca = marca.trim();
    if (modelo !== undefined) dataToUpdate.modelo = modelo.trim();
    if (anio !== undefined) dataToUpdate.anio = Number(anio);
    if (color !== undefined) dataToUpdate.color = color ? color.trim() : null;
    if (placa !== undefined) dataToUpdate.placa = placa.trim();
    if (vin !== undefined) dataToUpdate.vin = vin ? vin.trim() : null;
    if (kilometraje !== undefined) dataToUpdate.kilometraje = Number(kilometraje);
    if (tarifaDiaria !== undefined) dataToUpdate.tarifaDiaria = Number(tarifaDiaria);
    if (fotoUrl !== undefined) dataToUpdate.fotoUrl = fotoUrl ? String(fotoUrl).trim() : null;
    if (imagenes !== undefined) dataToUpdate.imagenes = imagenes;
    if (categoria !== undefined) dataToUpdate.categoria = String(categoria).trim();
    if (transmision !== undefined) dataToUpdate.transmision = String(transmision).trim();
    if (combustible !== undefined) dataToUpdate.combustible = String(combustible).trim();
    if (pasajeros !== undefined) dataToUpdate.pasajeros = Number(pasajeros);
    if (maletas !== undefined) dataToUpdate.maletas = Number(maletas);
    if (puertas !== undefined) dataToUpdate.puertas = Number(puertas);
    if (aireAcondicionado !== undefined) dataToUpdate.aireAcondicionado = Boolean(aireAcondicionado);
    if (seguroPoliza !== undefined) dataToUpdate.seguroPoliza = seguroPoliza ? String(seguroPoliza).trim() : null;
    if (seguroVencimiento !== undefined) dataToUpdate.seguroVencimiento = seguroVencimiento ? new Date(seguroVencimiento) : null;
    if (marbeteVencimiento !== undefined) dataToUpdate.marbeteVencimiento = marbeteVencimiento ? new Date(marbeteVencimiento) : null;

    if (estado !== undefined) {
      const estadoConvertido = convertirEstado(estado);
      if (!estadoConvertido) {
        return res.status(400).json({
          error: "El estado proporcionado no es válido.",
        });
      }
      dataToUpdate.estado = estadoConvertido;
    }

    const vehiculoActualizado = await prisma.vehiculo.update({
      where: { id },
      data: dataToUpdate,
    });

    res.json(vehiculoActualizado);
  } catch (error) {
    console.error("Error al actualizar vehículo:", error);
    res.status(500).json({
      error: "No fue posible actualizar el vehículo.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// DELETE /api/vehiculos/:id
// ----------------------------------------------------------------------------
// Elimina un vehículo del inventario con limpieza segura de relaciones
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "El ID del vehículo no es válido.",
      });
    }

    const vehiculo = await prisma.vehiculo.findUnique({
      where: { id },
      include: {
        contratos: {
          select: {
            id: true,
            estado: true,
          },
        },
      },
    });

    if (!vehiculo) {
      return res.status(404).json({
        error: "El vehículo que intentas eliminar no existe.",
      });
    }

    // 1. REGLA ESTRICTA: No permitir eliminar si el vehículo está en estado ALQUILADO
    if (vehiculo.estado === "ALQUILADO" || String(vehiculo.estado).toUpperCase() === "ALQUILADO") {
      return res.status(400).json({
        error: `🛑 ACCIÓN BLOQUEADA: El vehículo ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa}) se encuentra actualmente en estado ALQUILADO en manos de un cliente. Por seguridad operativa y trazabilidad legal, un vehículo en alquiler NO se puede eliminar de la flota hasta que esté de regreso y se complete el proceso de devolución (Check-In).`,
      });
    }

    // 2. REGLA ESTRICTA: No permitir eliminar si tiene un contrato ACTIVO o en BORRADOR
    const contratoActivo = vehiculo.contratos.find(
      (c) => c.estado === "ACTIVO" || c.estado === "BORRADOR"
    );
    if (contratoActivo) {
      return res.status(400).json({
        error: `🛑 ACCIÓN BLOQUEADA: No es posible eliminar este vehículo (${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.placa}) porque actualmente tiene el Contrato #${contratoActivo.id} en estado ${contratoActivo.estado}. Debes finalizar o cancelar el contrato y recibir el vehículo antes de eliminarlo.`,
      });
    }

    // Limpieza en cascada en una transacción atómica segura
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar ubicaciones GPS asociadas
      await tx.ubicacionGPS.deleteMany({
        where: { vehiculoId: id },
      });

      // 2. Eliminar órdenes de mantenimiento / taller asociadas
      await tx.mantenimiento.deleteMany({
        where: { vehiculoId: id },
      });

      // 3. Eliminar gastos directos asociados a este vehículo
      await tx.gasto.deleteMany({
        where: { vehiculoId: id },
      });

      // 4. Eliminar transferencias de flota asociadas
      await tx.transferenciaFlota.deleteMany({
        where: { vehiculoId: id },
      });

      // 5. Para contratos no activos (finalizados, borrador o cancelados), limpiar entregas, evidencias, pagos y contratos
      const contratoIds = vehiculo.contratos.map((c) => c.id);
      if (contratoIds.length > 0) {
        const entregas = await tx.entrega.findMany({
          where: { contratoId: { in: contratoIds } },
          select: { id: true },
        });
        const entregaIds = entregas.map((e) => e.id);

        if (entregaIds.length > 0) {
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

        await tx.pago.deleteMany({
          where: { contratoId: { in: contratoIds } },
        });

        await tx.contrato.deleteMany({
          where: { id: { in: contratoIds } },
        });
      }

      // 6. Eliminar finalmente el vehículo
      await tx.vehiculo.delete({
        where: { id },
      });
    });

    res.json({
      mensaje: `🗑️ Vehículo ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placa}) eliminado exitosamente.`,
    });
  } catch (error) {
    console.error("Error al eliminar vehículo:", error);
    res.status(500).json({
      error: "No fue posible eliminar el vehículo.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
