/**
 * ============================================================================
 * RentOS - Rutas de Contratos de Alquiler, Formalización Legal y Validación QR
 * ============================================================================
 * Maneja la formalización de contratos de arrendamiento, verificación de
 * disponibilidad, transición atómica de estados del vehículo (DISPONIBLE -> ALQUILADO),
 * firma digital táctil, checklist de inventario, medidor de combustible,
 * validación pública de autenticidad por Código QR y cálculo de tarifas en RD$/USD.
 */

import { Router } from "express";
import crypto from "crypto";
import { EstadoContrato, EstadoVehiculo } from "@prisma/client";
import prisma from "../lib/prisma.js";

const router = Router();

/**
 * Genera un código alfanumérico seguro para el código QR de verificación de autenticidad.
 */
function generarCodigoVerificacion(contratoId?: number): string {
  const aleatorio = crypto.randomBytes(3).toString("hex").toUpperCase();
  const sufijo = contratoId ? `-${contratoId}` : "";
  return `CON-${aleatorio}${sufijo}`;
}

// ----------------------------------------------------------------------------
// GET /api/contratos/verificar/:codigo
// ----------------------------------------------------------------------------
// Endpoint público para escanear el Código QR y verificar la legitimidad del contrato
router.get("/verificar/:codigo", async (req, res) => {
  try {
    const { codigo } = req.params;

    if (!codigo) {
      return res.status(400).json({ error: "Código de verificación requerido." });
    }

    // Buscar contrato por código de verificación o por ID numérico
    const esNumero = /^\d+$/.test(codigo);
    const contrato = await prisma.contrato.findFirst({
      where: esNumero
        ? { OR: [{ codigoVerificacion: codigo }, { id: Number(codigo) }] }
        : { codigoVerificacion: codigo },
      include: {
        rentCar: {
          select: {
            id: true,
            nombre: true,
            rnc: true,
            telefono: true,
            email: true,
            direccion: true,
            ciudad: true,
            logoUrl: true,
            colorPrimario: true,
            whatsapp: true,
            moneda: true,
          },
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
            direccion: true,
            estado: true,
          },
        },
        vehiculo: {
          select: {
            id: true,
            marca: true,
            modelo: true,
            anio: true,
            placa: true,
            color: true,
            vin: true,
            tarifaDiaria: true,
            kilometraje: true,
            estado: true,
          },
        },
        entrega: {
          include: {
            defectos: true,
          },
        },
      },
    });

    if (!contrato) {
      return res.status(404).json({
        valido: false,
        mensaje: "⚠️ El código de contrato consultado no existe o ha sido revocado en la plataforma RentOS.",
      });
    }

    // Generar hash criptográfico de integridad SHA-256
    const hashIntegridad = crypto
      .createHash("sha256")
      .update(`${contrato.id}-${contrato.clienteId}-${contrato.vehiculoId}-${contrato.fechaInicio.toISOString()}-${contrato.createdAt.toISOString()}`)
      .digest("hex")
      .substring(0, 16)
      .toUpperCase();

    const diasRenta = Math.max(
      1,
      Math.ceil((new Date(contrato.fechaFin).getTime() - new Date(contrato.fechaInicio).getTime()) / (1000 * 60 * 60 * 24))
    );

    res.json({
      valido: true,
      selloAutenticidad: "VERIFICADO_OFICIAL_RENTOS",
      codigoVerificacion: contrato.codigoVerificacion || `CON-${contrato.id}`,
      hashIntegridad,
      contratoId: contrato.id,
      estado: contrato.estado,
      fechaEmision: contrato.createdAt,
      vigencia: {
        inicio: contrato.fechaInicio,
        fin: contrato.fechaFin,
        dias: diasRenta,
      },
      empresa: contrato.rentCar,
      cliente: {
        nombreCompleto: `${contrato.cliente.nombre} ${contrato.cliente.apellido}`,
        telefono: contrato.cliente.telefono,
        email: contrato.cliente.email,
        estado: contrato.cliente.estado,
      },
      vehiculo: {
        descripcion: `${contrato.vehiculo.marca} ${contrato.vehiculo.modelo} (${contrato.vehiculo.anio})`,
        placa: contrato.vehiculo.placa,
        color: contrato.vehiculo.color,
        vin: contrato.vehiculo.vin,
      },
      seguro: contrato.tipoSeguro || "FULL",
      kilometrajeInicial: contrato.kilometrajeInicial,
      kilometrajeFinal: contrato.kilometrajeFinal,
      tieneFirmaDigital: Boolean(contrato.firmaCliente),
      inspeccionRealizada: Boolean(contrato.entrega),
    });
  } catch (error) {
    console.error("Error al verificar contrato por QR:", error);
    res.status(500).json({
      valido: false,
      error: "No fue posible realizar la verificación del contrato.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// GET /api/contratos
// ----------------------------------------------------------------------------
// Retorna todos los contratos registrados de una empresa con datos de cliente, auto y empresa
router.get("/", async (req, res) => {
  try {
    const rentCarId = req.query.rentCarId ? Number(req.query.rentCarId) : 1;

    const contratos = await prisma.contrato.findMany({
      where: {
        rentCarId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        rentCar: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
            direccion: true,
          },
        },
        vehiculo: {
          select: {
            id: true,
            marca: true,
            modelo: true,
            anio: true,
            placa: true,
            color: true,
            vin: true,
            tarifaDiaria: true,
            kilometraje: true,
            estado: true,
          },
        },
        pagos: true,
        entrega: {
          include: {
            defectos: true,
            evidencias: true,
          },
        },
      },
    });

    res.json(contratos);
  } catch (error) {
    console.error("Error al obtener contratos:", error);
    res.status(500).json({
      error: "No fue posible obtener los contratos.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// GET /api/contratos/:id
// ----------------------------------------------------------------------------
// Obtiene el expediente completo del contrato (pagos, inspección 360, daños y evidencias)
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "El ID del contrato no es válido." });
    }

    const contrato = await prisma.contrato.findUnique({
      where: { id },
      include: {
        rentCar: true,
        cliente: true,
        vehiculo: true,
        entrega: {
          include: {
            evidencias: true,
            defectos: true,
          },
        },
        pagos: true,
      },
    });

    if (!contrato) {
      return res.status(404).json({ error: "Contrato no encontrado." });
    }

    res.json(contrato);
  } catch (error) {
    console.error("Error al obtener contrato:", error);
    res.status(500).json({
      error: "No fue posible obtener el contrato.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// POST /api/contratos
// ----------------------------------------------------------------------------
// Crea un contrato de arrendamiento con código QR, seguro, checklist y bloqueo atómico
router.post("/", async (req, res) => {
  try {
    const {
      rentCarId,
      clienteId,
      vehiculoId,
      fechaInicio,
      fechaFin,
      tarifaDiaria,
      deposito,
      kilometrajeInicial,
      tipoSeguro,
      precioHora,
      cobrosExtra,
      deliveryMonto,
      nivelCombustibleSalida,
      inventarioChecklist,
      firmaCliente,
      firmaArrendador,
      refFamiliarNombre,
      refFamiliarTel,
      estado,
      observaciones,
    } = req.body;

    if (
      clienteId === undefined ||
      vehiculoId === undefined ||
      !fechaInicio ||
      !fechaFin ||
      tarifaDiaria === undefined ||
      deposito === undefined
    ) {
      return res.status(400).json({
        error: "Cliente, vehículo, fecha de inicio, fecha de fin, tarifa diaria y depósito son obligatorios.",
      });
    }

    const clienteIdNum = Number(clienteId);
    const vehiculoIdNum = Number(vehiculoId);
    const tarifaNum = Number(tarifaDiaria);
    const depositoNum = Number(deposito);

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      return res.status(400).json({ error: "Las fechas especificadas no son válidas." });
    }

    if (fin <= inicio) {
      return res.status(400).json({ error: "La fecha de fin debe ser posterior a la fecha de inicio." });
    }

    // Validar existencia y estado del cliente
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteIdNum } });
    if (!cliente) {
      return res.status(404).json({ error: "El cliente seleccionado no existe." });
    }

    if (cliente.estado === "BLOQUEADO") {
      return res.status(400).json({
        error: "El cliente se encuentra BLOQUEADO. No se pueden generar contratos a clientes bloqueados.",
      });
    }

    // Validar disponibilidad del vehículo
    const vehiculo = await prisma.vehiculo.findUnique({ where: { id: vehiculoIdNum } });
    if (!vehiculo) {
      return res.status(404).json({ error: "El vehículo seleccionado no existe." });
    }

    const estadoContratoFinal: EstadoContrato =
      estado && estado in EstadoContrato
        ? (estado as EstadoContrato)
        : EstadoContrato.ACTIVO;

    // Si el contrato se inicia ACTIVO, el vehículo debe estar DISPONIBLE
    if (estadoContratoFinal === EstadoContrato.ACTIVO && vehiculo.estado !== EstadoVehiculo.DISPONIBLE) {
      return res.status(400).json({
        error: `El vehículo (${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.placa}) no está disponible (Estado actual: ${vehiculo.estado}).`,
      });
    }

    const kmInicial =
      kilometrajeInicial !== undefined
        ? Number(kilometrajeInicial)
        : vehiculo.kilometraje;

    const codigoGenerado = generarCodigoVerificacion();

    // Transacción atómica: Crear contrato y actualizar vehículo
    const contrato = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.contrato.create({
        data: {
          rentCarId: rentCarId ? Number(rentCarId) : 1,
          clienteId: clienteIdNum,
          vehiculoId: vehiculoIdNum,
          fechaInicio: inicio,
          fechaFin: fin,
          tarifaDiaria: tarifaNum,
          deposito: depositoNum,
          kilometrajeInicial: kmInicial,
          codigoVerificacion: codigoGenerado,
          tipoSeguro: tipoSeguro ? String(tipoSeguro) : "FULL",
          precioHora: precioHora !== undefined && precioHora !== "" ? Number(precioHora) : null,
          cobrosExtra: cobrosExtra !== undefined ? Number(cobrosExtra) : 0,
          deliveryMonto: deliveryMonto !== undefined ? Number(deliveryMonto) : 0,
          nivelCombustibleSalida: nivelCombustibleSalida ? String(nivelCombustibleSalida) : "100%",
          inventarioChecklist: inventarioChecklist || null,
          firmaCliente: firmaCliente ? String(firmaCliente) : null,
          firmaArrendador: firmaArrendador ? String(firmaArrendador) : null,
          refFamiliarNombre: refFamiliarNombre ? String(refFamiliarNombre).trim() : null,
          refFamiliarTel: refFamiliarTel ? String(refFamiliarTel).trim() : null,
          estado: estadoContratoFinal,
          observaciones: observaciones ? String(observaciones).trim() : null,
        },
        include: {
          rentCar: true,
          cliente: true,
          vehiculo: true,
        },
      });

      // Si el contrato es ACTIVO, cambiar estado del vehículo a ALQUILADO
      if (estadoContratoFinal === EstadoContrato.ACTIVO) {
        await tx.vehiculo.update({
          where: { id: vehiculoIdNum },
          data: { estado: EstadoVehiculo.ALQUILADO },
        });
      }

      return nuevo;
    });

    res.status(201).json(contrato);
  } catch (error) {
    console.error("Error al crear contrato:", error);
    res.status(500).json({
      error: "No fue posible registrar el contrato.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// PUT /api/contratos/:id
// ----------------------------------------------------------------------------
// Actualiza datos del contrato, firmas, checklist o finaliza la renta liberando el vehículo
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "El ID del contrato no es válido." });
    }

    const existente = await prisma.contrato.findUnique({
      where: { id },
      include: { vehiculo: true },
    });

    if (!existente) {
      return res.status(404).json({ error: "Contrato no encontrado." });
    }

    const {
      fechaInicio,
      fechaFin,
      tarifaDiaria,
      deposito,
      kilometrajeFinal,
      tipoSeguro,
      precioHora,
      cobrosExtra,
      deliveryMonto,
      nivelCombustibleSalida,
      inventarioChecklist,
      firmaCliente,
      firmaArrendador,
      refFamiliarNombre,
      refFamiliarTel,
      estado,
      observaciones,
    } = req.body;

    const nuevoEstado = estado ? (estado as EstadoContrato) : existente.estado;

    const contratoActualizado = await prisma.$transaction(async (tx) => {
      const dataToUpdate: Record<string, unknown> = {};

      if (fechaInicio) dataToUpdate.fechaInicio = new Date(fechaInicio);
      if (fechaFin) dataToUpdate.fechaFin = new Date(fechaFin);
      if (tarifaDiaria !== undefined) dataToUpdate.tarifaDiaria = Number(tarifaDiaria);
      if (deposito !== undefined) dataToUpdate.deposito = Number(deposito);
      if (kilometrajeFinal !== undefined) dataToUpdate.kilometrajeFinal = Number(kilometrajeFinal);
      if (tipoSeguro !== undefined) dataToUpdate.tipoSeguro = String(tipoSeguro);
      if (precioHora !== undefined) dataToUpdate.precioHora = precioHora !== "" ? Number(precioHora) : null;
      if (cobrosExtra !== undefined) dataToUpdate.cobrosExtra = Number(cobrosExtra);
      if (deliveryMonto !== undefined) dataToUpdate.deliveryMonto = Number(deliveryMonto);
      if (nivelCombustibleSalida !== undefined) dataToUpdate.nivelCombustibleSalida = String(nivelCombustibleSalida);
      if (inventarioChecklist !== undefined) dataToUpdate.inventarioChecklist = inventarioChecklist;
      if (firmaCliente !== undefined) dataToUpdate.firmaCliente = firmaCliente ? String(firmaCliente) : null;
      if (firmaArrendador !== undefined) dataToUpdate.firmaArrendador = firmaArrendador ? String(firmaArrendador) : null;
      if (refFamiliarNombre !== undefined) dataToUpdate.refFamiliarNombre = refFamiliarNombre ? String(refFamiliarNombre).trim() : null;
      if (refFamiliarTel !== undefined) dataToUpdate.refFamiliarTel = refFamiliarTel ? String(refFamiliarTel).trim() : null;
      if (estado) dataToUpdate.estado = nuevoEstado;
      if (observaciones !== undefined) dataToUpdate.observaciones = observaciones ? String(observaciones).trim() : null;

      // Asegurar código de verificación si no existiera
      if (!existente.codigoVerificacion) {
        dataToUpdate.codigoVerificacion = generarCodigoVerificacion(existente.id);
      }

      const contrato = await tx.contrato.update({
        where: { id },
        data: dataToUpdate,
        include: {
          rentCar: true,
          cliente: true,
          vehiculo: true,
          pagos: true,
        },
      });

      // Reglas de negocio para el vehículo según el estado del contrato:
      if (nuevoEstado === EstadoContrato.FINALIZADO || nuevoEstado === EstadoContrato.CANCELADO) {
        // Liberar el vehículo a DISPONIBLE y actualizar kilometraje
        const kmActualizado =
          kilometrajeFinal && Number(kilometrajeFinal) > existente.vehiculo.kilometraje
            ? Number(kilometrajeFinal)
            : existente.vehiculo.kilometraje;

        await tx.vehiculo.update({
          where: { id: existente.vehiculoId },
          data: {
            estado: EstadoVehiculo.DISPONIBLE,
            kilometraje: kmActualizado,
          },
        });
      } else if (nuevoEstado === EstadoContrato.ACTIVO) {
        await tx.vehiculo.update({
          where: { id: existente.vehiculoId },
          data: { estado: EstadoVehiculo.ALQUILADO },
        });
      }

      return contrato;
    });

    res.json(contratoActualizado);
  } catch (error) {
    console.error("Error al actualizar contrato:", error);
    res.status(500).json({
      error: "No fue posible actualizar el contrato.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

// ----------------------------------------------------------------------------
// DELETE /api/contratos/:id
// ----------------------------------------------------------------------------
// Elimina el contrato en cascada y restituye el vehículo a estado DISPONIBLE
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existente = await prisma.contrato.findUnique({ where: { id } });
    if (!existente) {
      return res.status(404).json({ error: "Contrato no encontrado." });
    }

    await prisma.$transaction(async (tx) => {
      // Liberar vehículo a disponible
      await tx.vehiculo.update({
        where: { id: existente.vehiculoId },
        data: { estado: EstadoVehiculo.DISPONIBLE },
      });

      await tx.pago.deleteMany({ where: { contratoId: id } });
      await tx.entrega.deleteMany({ where: { contratoId: id } });
      await tx.contrato.delete({ where: { id } });
    });

    res.json({ mensaje: "Contrato eliminado correctamente y vehículo liberado a DISPONIBLE." });
  } catch (error) {
    console.error("Error al eliminar contrato:", error);
    res.status(500).json({
      error: "No fue posible eliminar el contrato.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;