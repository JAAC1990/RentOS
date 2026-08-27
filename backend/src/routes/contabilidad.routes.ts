/**
 * ============================================================================
 * RentOS - Rutas de Contabilidad, Finanzas y Estado de Resultados
 * ============================================================================
 * Procesa y consolida métricas contables en tiempo real:
 * - Estado de Resultados (P&L: Ingresos vs Gastos = Utilidad Neta y Margen).
 * - Análisis Financiero por Cliente: Cuánto gastó, en qué gastó (desglose por
 *   contrato, auto, días, extras, delivery) y balance adeudado / pagado.
 * - Análisis de Rendimiento por Unidad de Flota (ROI por Vehículo).
 * - Desglose de egresos por categorías contables oficiales.
 */

import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// Helper para calcular la diferencia de días entre dos fechas
function calcularDias(inicio: Date, fin: Date): number {
  const diffMs = Math.max(0, fin.getTime() - inicio.getTime());
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

// ----------------------------------------------------------------------------
// GET /api/contabilidad/resumen
// ----------------------------------------------------------------------------
// Retorna el informe financiero integral filtrado por rango de fechas
router.get("/resumen", async (req, res) => {
  try {
    const { rentCarId, fechaInicio, fechaFin, clienteId, vehiculoId } = req.query;

    const targetRentCarId = rentCarId ? Number(rentCarId) : 1;

    // Filtros de fecha para consultas
    const filtroFechaContrato: any = { rentCarId: targetRentCarId };
    const filtroFechaPago: any = { contrato: { rentCarId: targetRentCarId } };
    const filtroFechaMantenimiento: any = { rentCarId: targetRentCarId };
    const filtroFechaGasto: any = { rentCarId: targetRentCarId };

    if (fechaInicio || fechaFin) {
      const gte = fechaInicio ? new Date(fechaInicio as string) : undefined;
      let lte = undefined;
      if (fechaFin) {
        lte = new Date(fechaFin as string);
        lte.setHours(23, 59, 59, 999);
      }

      filtroFechaContrato.fechaInicio = {};
      if (gte) filtroFechaContrato.fechaInicio.gte = gte;
      if (lte) filtroFechaContrato.fechaInicio.lte = lte;

      filtroFechaPago.fecha = {};
      if (gte) filtroFechaPago.fecha.gte = gte;
      if (lte) filtroFechaPago.fecha.lte = lte;

      filtroFechaMantenimiento.fechaServicio = {};
      if (gte) filtroFechaMantenimiento.fechaServicio.gte = gte;
      if (lte) filtroFechaMantenimiento.fechaServicio.lte = lte;

      filtroFechaGasto.fecha = {};
      if (gte) filtroFechaGasto.fecha.gte = gte;
      if (lte) filtroFechaGasto.fecha.lte = lte;
    }

    if (clienteId && clienteId !== "TODOS") {
      filtroFechaContrato.clienteId = Number(clienteId);
      filtroFechaPago.contrato = {
        ...filtroFechaPago.contrato,
        clienteId: Number(clienteId),
      };
    }

    if (vehiculoId && vehiculoId !== "TODOS") {
      filtroFechaContrato.vehiculoId = Number(vehiculoId);
      filtroFechaMantenimiento.vehiculoId = Number(vehiculoId);
      filtroFechaGasto.vehiculoId = Number(vehiculoId);
    }

    // Ejecutar consultas en paralelo
    const [contratos, pagos, mantenimientos, gastos, clientes, vehiculos] =
      await Promise.all([
        prisma.contrato.findMany({
          where: filtroFechaContrato,
          include: {
            cliente: true,
            vehiculo: true,
            pagos: true,
          },
          orderBy: { fechaInicio: "desc" },
        }),
        prisma.pago.findMany({
          where: {
            ...filtroFechaPago,
            estado: "PAGADO",
          },
          include: {
            contrato: {
              include: {
                cliente: true,
                vehiculo: true,
              },
            },
          },
          orderBy: { fecha: "desc" },
        }),
        prisma.mantenimiento.findMany({
          where: filtroFechaMantenimiento,
          include: {
            vehiculo: true,
          },
          orderBy: { fechaServicio: "desc" },
        }),
        prisma.gasto.findMany({
          where: filtroFechaGasto,
          include: {
            vehiculo: true,
          },
          orderBy: { fecha: "desc" },
        }),
        prisma.cliente.findMany({
          where: { rentCarId: targetRentCarId },
          orderBy: { nombre: "asc" },
        }),
        prisma.vehiculo.findMany({
          where: { rentCarId: targetRentCarId },
          orderBy: { marca: "asc" },
        }),
      ]);

    // 1. CÁLCULO DE INGRESOS
    const totalIngresosCobrados = pagos.reduce(
      (sum, p) => sum + Number(p.monto),
      0
    );

    let totalRentasBase = 0;
    let totalCobrosExtra = 0;
    let totalDelivery = 0;
    let totalDepositos = 0;
    let totalFacturadoContratos = 0;

    contratos.forEach((c) => {
      const dias = calcularDias(new Date(c.fechaInicio), new Date(c.fechaFin));
      const rentaBase = dias * Number(c.tarifaDiaria);
      const extras = Number(c.cobrosExtra || 0);
      const deliv = Number(c.deliveryMonto || 0);
      const dep = Number(c.deposito || 0);
      const totalContrato = rentaBase + extras + deliv;

      totalRentasBase += rentaBase;
      totalCobrosExtra += extras;
      totalDelivery += deliv;
      totalDepositos += dep;
      totalFacturadoContratos += totalContrato;
    });

    // 2. CÁLCULO DE GASTOS Y EGRESOS
    const totalCostoMantenimiento = mantenimientos.reduce(
      (sum, m) => sum + Number(m.costo),
      0
    );

    const desgloseGastosCategorias: Record<string, number> = {
      MANTENIMIENTO_TALLER: totalCostoMantenimiento,
      COMBUSTIBLE_LAVADO: 0,
      SEGUROS_MARBETES: 0,
      NOMINA_PERSONAL: 0,
      ALQUILER_LOCAL_SERVICIOS: 0,
      REPUESTOS_ACCESORIOS: 0,
      PUBLICIDAD_MARKETING: 0,
      IMPUESTOS_LEGALES: 0,
      OTROS_GASTOS: 0,
    };

    gastos.forEach((g) => {
      const cat = g.categoria || "OTROS_GASTOS";
      const monto = Number(g.monto);
      if (desgloseGastosCategorias[cat] !== undefined) {
        desgloseGastosCategorias[cat] += monto;
      } else {
        desgloseGastosCategorias.OTROS_GASTOS += monto;
      }
    });

    const totalGastosRegistrados = gastos.reduce(
      (sum, g) => sum + Number(g.monto),
      0
    );
    const totalGastosGenerales =
      totalCostoMantenimiento + totalGastosRegistrados;

    // 3. UTILIDAD Y MARGEN OPERATIVO
    const utilidadNeta = totalIngresosCobrados - totalGastosGenerales;
    const margenUtilidad =
      totalIngresosCobrados > 0
        ? Number(((utilidadNeta / totalIngresosCobrados) * 100).toFixed(2))
        : 0;

    // 4. ANÁLISIS FINANCIERO POR CLIENTE ("cuánto gastó el cliente y en qué")
    const mapaClientes = new Map<number, any>();

    clientes.forEach((cli) => {
      mapaClientes.set(cli.id, {
        cliente: {
          id: cli.id,
          nombre: cli.nombre,
          apellido: cli.apellido,
          telefono: cli.telefono,
          email: cli.email,
          direccion: cli.direccion,
        },
        totalFacturado: 0,
        totalPagado: 0,
        balancePendiente: 0,
        cantidadContratos: 0,
        desgloseEnQueGasto: [],
      });
    });

    contratos.forEach((c) => {
      let regCliente = mapaClientes.get(c.clienteId);
      if (!regCliente) {
        regCliente = {
          cliente: c.cliente,
          totalFacturado: 0,
          totalPagado: 0,
          balancePendiente: 0,
          cantidadContratos: 0,
          desgloseEnQueGasto: [],
        };
        mapaClientes.set(c.clienteId, regCliente);
      }

      const dias = calcularDias(new Date(c.fechaInicio), new Date(c.fechaFin));
      const rentaBase = dias * Number(c.tarifaDiaria);
      const extras = Number(c.cobrosExtra || 0);
      const deliv = Number(c.deliveryMonto || 0);
      const dep = Number(c.deposito || 0);
      const totalContrato = rentaBase + extras + deliv;

      const pagadoEnContrato = c.pagos
        .filter((p) => p.estado === "PAGADO")
        .reduce((sum, p) => sum + Number(p.monto), 0);

      regCliente.totalFacturado += totalContrato;
      regCliente.totalPagado += pagadoEnContrato;
      regCliente.cantidadContratos += 1;

      regCliente.desgloseEnQueGasto.push({
        contratoId: c.id,
        vehiculo: c.vehiculo
          ? `${c.vehiculo.marca} ${c.vehiculo.modelo} (${c.vehiculo.placa})`
          : "Vehículo N/D",
        fechaInicio: c.fechaInicio,
        fechaFin: c.fechaFin,
        diasRenta: dias,
        tarifaDiaria: Number(c.tarifaDiaria),
        costoRentaBase: rentaBase,
        tipoSeguro: c.tipoSeguro || "FULL",
        cobrosExtra: extras,
        deliveryMonto: deliv,
        depositoGarantia: dep,
        totalContrato,
        totalPagado: pagadoEnContrato,
        saldoPendiente: Math.max(0, totalContrato - pagadoEnContrato),
        estado: c.estado,
        observaciones: c.observaciones,
      });
    });

    const analisisClientes = Array.from(mapaClientes.values())
      .map((item) => ({
        ...item,
        balancePendiente: Math.max(0, item.totalFacturado - item.totalPagado),
      }))
      .filter((item) => item.cantidadContratos > 0 || item.totalPagado > 0)
      .sort((a, b) => b.totalFacturado - a.totalFacturado);

    // 5. RENTABILIDAD POR VEHÍCULO (ROI DE FLOTA)
    const mapaVehiculos = new Map<number, any>();

    vehiculos.forEach((veh) => {
      mapaVehiculos.set(veh.id, {
        vehiculo: {
          id: veh.id,
          marca: veh.marca,
          modelo: veh.modelo,
          anio: veh.anio,
          placa: veh.placa,
          color: veh.color,
          tarifaDiaria: Number(veh.tarifaDiaria),
          estado: veh.estado,
          fotoUrl: veh.fotoUrl,
        },
        ingresosGenerados: 0,
        diasAlquilado: 0,
        costoMantenimiento: 0,
        gastosDirectos: 0,
        costoTotal: 0,
        beneficioNeto: 0,
        rentabilidadPorcentaje: 0,
        contratosCount: 0,
      });
    });

    contratos.forEach((c) => {
      const regVeh = mapaVehiculos.get(c.vehiculoId);
      if (regVeh) {
        const dias = calcularDias(new Date(c.fechaInicio), new Date(c.fechaFin));
        const renta = dias * Number(c.tarifaDiaria) + Number(c.cobrosExtra || 0) + Number(c.deliveryMonto || 0);
        regVeh.ingresosGenerados += renta;
        regVeh.diasAlquilado += dias;
        regVeh.contratosCount += 1;
      }
    });

    mantenimientos.forEach((m) => {
      const regVeh = mapaVehiculos.get(m.vehiculoId);
      if (regVeh) {
        regVeh.costoMantenimiento += Number(m.costo);
      }
    });

    gastos.forEach((g) => {
      if (g.vehiculoId) {
        const regVeh = mapaVehiculos.get(g.vehiculoId);
        if (regVeh) {
          regVeh.gastosDirectos += Number(g.monto);
        }
      }
    });

    const rentabilidadVehiculos = Array.from(mapaVehiculos.values())
      .map((item) => {
        const costoTotal = item.costoMantenimiento + item.gastosDirectos;
        const beneficioNeto = item.ingresosGenerados - costoTotal;
        const rentabilidadPorcentaje =
          costoTotal > 0
            ? Number(((beneficioNeto / costoTotal) * 100).toFixed(1))
            : item.ingresosGenerados > 0
            ? 100
            : 0;

        return {
          ...item,
          costoTotal,
          beneficioNeto,
          rentabilidadPorcentaje,
        };
      })
      .sort((a, b) => b.beneficioNeto - a.beneficioNeto);

    // Respuesta consolidada
    res.json({
      resumenEstadoResultados: {
        totalIngresosCobrados,
        totalFacturadoContratos,
        totalGastosGenerales,
        utilidadNeta,
        margenUtilidad,
        desgloseIngresos: {
          rentasBase: totalRentasBase,
          cobrosExtra: totalCobrosExtra,
          delivery: totalDelivery,
          depositosRetenidos: totalDepositos,
        },
        desgloseGastos: desgloseGastosCategorias,
      },
      analisisClientes,
      rentabilidadVehiculos,
      gastosRegistrados: gastos,
      totalContratos: contratos.length,
      totalPagos: pagos.length,
      totalMantenimientos: mantenimientos.length,
    });
  } catch (error) {
    console.error("Error al generar resumen contable:", error);
    res.status(500).json({ error: "No fue posible generar el informe contable." });
  }
});

export default router;
