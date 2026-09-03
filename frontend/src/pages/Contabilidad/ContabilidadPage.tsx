/**
 * ============================================================================
 * RentOS - Módulo Integral de Contabilidad, Finanzas & Análisis de Clientes
 * ============================================================================
 * Proporciona el control financiero global de la empresa:
 * 1. Estado de Resultados (P&L): Ingresos, Gastos Totales, Ganancia Neta y Margen.
 * 2. Análisis Financiero por Cliente: Cuánto gastó, en qué gastó (contratos,
 *    días, extras, delivery, seguros) y emisión de Estados de Cuenta oficiales.
 * 3. Rentabilidad por Unidad de Flota (ROI por Vehículo).
 * 4. Registro y control de Gastos Operativos y Administrativos.
 * 5. Filtros por período de tiempo (presets rápidos y personalizado en DD/MM/AAAA).
 * 6. Conmutador universal USD (US$) ⇄ DOP (RD$) con tasa en tiempo real.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URLS } from "../../services/api";
import { formatearFecha } from "../../utils/dateUtils";
import FechaInput from "../../components/FechaInput";
import MonedaInput, { TASA_CAMBIO_DEFAULT } from "../../components/MonedaInput";
import EstadoCuentaClienteImprimible from "../../components/EstadoCuentaClienteImprimible";

type CategoriaGasto =
  | "MANTENIMIENTO_TALLER"
  | "COMBUSTIBLE_LAVADO"
  | "SEGUROS_MARBETES"
  | "NOMINA_PERSONAL"
  | "ALQUILER_LOCAL_SERVICIOS"
  | "REPUESTOS_ACCESORIOS"
  | "PUBLICIDAD_MARKETING"
  | "IMPUESTOS_LEGALES"
  | "OTROS_GASTOS";

type Gasto = {
  id: number;
  rentCarId: number;
  vehiculoId?: number | null;
  categoria: CategoriaGasto;
  descripcion: string;
  monto: number | string;
  moneda: string;
  fecha: string;
  comprobante?: string | null;
  proveedor?: string | null;
  metodoPago: string;
  vehiculo?: {
    id: number;
    marca: string;
    modelo: string;
    placa: string;
  } | null;
};

type DesgloseCliente = {
  contratoId: number;
  vehiculo: string;
  fechaInicio: string;
  fechaFin: string;
  diasRenta: number;
  tarifaDiaria: number;
  costoRentaBase: number;
  tipoSeguro: string;
  cobrosExtra: number;
  deliveryMonto: number;
  depositoGarantia: number;
  totalContrato: number;
  totalPagado: number;
  saldoPendiente: number;
  estado: string;
  observaciones?: string | null;
};

type AnalisisCliente = {
  cliente: {
    id: number;
    nombre: string;
    apellido: string;
    telefono: string;
    email?: string | null;
    direccion?: string | null;
    rncOCedula?: string | null;
  };
  totalFacturado: number;
  totalPagado: number;
  balancePendiente: number;
  cantidadContratos: number;
  desgloseEnQueGasto: DesgloseCliente[];
};

type RentabilidadVehiculo = {
  vehiculo: {
    id: number;
    marca: string;
    modelo: string;
    anio: number;
    placa: string;
    color?: string | null;
    tarifaDiaria: number;
    estado: string;
    fotoUrl?: string | null;
  };
  ingresosGenerados: number;
  diasAlquilado: number;
  costoMantenimiento: number;
  gastosDirectos: number;
  costoTotal: number;
  beneficioNeto: number;
  rentabilidadPorcentaje: number;
  contratosCount: number;
};

type ResumenContabilidad = {
  resumenEstadoResultados: {
    totalIngresosCobrados: number;
    totalFacturadoContratos: number;
    totalGastosGenerales: number;
    utilidadNeta: number;
    margenUtilidad: number;
    desgloseIngresos: {
      rentasBase: number;
      cobrosExtra: number;
      delivery: number;
      depositosRetenidos: number;
    };
    desgloseGastos: Record<string, number>;
  };
  analisisClientes: AnalisisCliente[];
  rentabilidadVehiculos: RentabilidadVehiculo[];
  gastosRegistrados: Gasto[];
  totalContratos: number;
  totalPagos: number;
  totalMantenimientos: number;
};

const nombresCategoriasGasto: Record<CategoriaGasto, { nombre: string; icono: string }> = {
  MANTENIMIENTO_TALLER: { nombre: "Mantenimiento & Taller", icono: "🛠️" },
  COMBUSTIBLE_LAVADO: { nombre: "Combustible & Lavado", icono: "⛽" },
  SEGUROS_MARBETES: { nombre: "Seguros, Pólizas & Marbetes", icono: "🛡️" },
  NOMINA_PERSONAL: { nombre: "Nómina & Sueldos Personal", icono: "👥" },
  ALQUILER_LOCAL_SERVICIOS: { nombre: "Alquiler Local & Servicios (Luz/Internet)", icono: "🏢" },
  REPUESTOS_ACCESORIOS: { nombre: "Repuestos, Gomas & Accesorios", icono: "⚙️" },
  PUBLICIDAD_MARKETING: { nombre: "Publicidad & Marketing", icono: "📢" },
  IMPUESTOS_LEGALES: { nombre: "Impuestos, DGII & Asesoría Legal", icono: "⚖️" },
  OTROS_GASTOS: { nombre: "Otros Gastos Operativos", icono: "📦" },
};

export default function ContabilidadPage() {
  const { tenantActivoId } = useAuth();

  // Estados de datos
  const [datosContables, setDatosContables] = useState<ResumenContabilidad | null>(null);
  const [vehiculosLista, setVehiculosLista] = useState<any[]>([]);
  const [rentCarInfo, setRentCarInfo] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Configuración de Moneda y Tasa de Cambio
  const [moneda, setMoneda] = useState<"USD" | "DOP">("USD");
  const [tasaCambio, setTasaCambio] = useState<number>(TASA_CAMBIO_DEFAULT);

  // Control de Pestañas
  const [tabActiva, setTabActiva] = useState<"PL" | "CLIENTES" | "FLOTA" | "GASTOS">("PL");

  // Filtros de Rango Temporal
  const [presetPeriodo, setPresetPeriodo] = useState<string>("ESTE_MES");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");

  // Búsqueda y Selección de Cliente
  const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState<number | "TODOS">("TODOS");
  const [busquedaCliente, setBusquedaCliente] = useState<string>("");
  const [clienteEstadoCuentaImprimir, setClienteEstadoCuentaImprimir] = useState<AnalisisCliente | null>(null);

  // Modal de Nuevo Gasto
  const [mostrarModalGasto, setMostrarModalGasto] = useState(false);
  const [guardandoGasto, setGuardandoGasto] = useState(false);
  const [monedaGasto, setMonedaGasto] = useState<"USD" | "DOP">("USD");
  const [formGasto, setFormGasto] = useState({
    categoria: "COMBUSTIBLE_LAVADO" as CategoriaGasto,
    descripcion: "",
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
    comprobante: "",
    proveedor: "",
    metodoPago: "EFECTIVO",
    vehiculoId: "",
  });

  // Filtros de gastos
  const [filtroCategoriaGasto, setFiltroCategoriaGasto] = useState("TODAS");

  // Helper para establecer presets de fecha
  const aplicarPresetPeriodo = (preset: string) => {
    setPresetPeriodo(preset);
    const hoy = new Date();
    const formatoISO = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "HOY") {
      setFechaInicio(formatoISO(hoy));
      setFechaFin(formatoISO(hoy));
    } else if (preset === "ESTA_SEMANA") {
      const primerDia = new Date(hoy);
      primerDia.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1));
      setFechaInicio(formatoISO(primerDia));
      setFechaFin(formatoISO(hoy));
    } else if (preset === "ESTE_MES") {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      setFechaInicio(formatoISO(primerDia));
      setFechaFin(formatoISO(hoy));
    } else if (preset === "MES_ANTERIOR") {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      setFechaInicio(formatoISO(primerDia));
      setFechaFin(formatoISO(ultimoDia));
    } else if (preset === "ESTE_TRIMESTRE") {
      const mesInicio = Math.floor(hoy.getMonth() / 3) * 3;
      const primerDia = new Date(hoy.getFullYear(), mesInicio, 1);
      setFechaInicio(formatoISO(primerDia));
      setFechaFin(formatoISO(hoy));
    } else if (preset === "ESTE_ANIO") {
      const primerDia = new Date(hoy.getFullYear(), 0, 1);
      setFechaInicio(formatoISO(primerDia));
      setFechaFin(formatoISO(hoy));
    } else if (preset === "TODO") {
      setFechaInicio("");
      setFechaFin("");
    }
  };

  // Inicializar con preset "ESTE_MES"
  useEffect(() => {
    aplicarPresetPeriodo("ESTE_MES");
  }, []);

  // Carga de datos contables desde el backend
  const cargarReporteContable = async () => {
    try {
      setCargando(true);
      setError("");

      const targetTenant = tenantActivoId || 1;
      const params = new URLSearchParams();
      params.append("rentCarId", String(targetTenant));

      if (fechaInicio) params.append("fechaInicio", fechaInicio);
      if (fechaFin) params.append("fechaFin", fechaFin);

      const [resContable, resVehiculos, resRentCar] = await Promise.all([
        fetch(`${API_URLS.contabilidad}/resumen?${params.toString()}`),
        fetch(`${API_URLS.vehiculos}?rentCarId=${targetTenant}`),
        fetch(`${API_URLS.rentcars}/${targetTenant}`),
      ]);

      if (!resContable.ok) {
        throw new Error("No fue posible cargar las métricas de contabilidad.");
      }

      const [datosJson, vehiculosJson, rentCarJson] = await Promise.all([
        resContable.json(),
        resVehiculos.ok ? resVehiculos.json() : [],
        resRentCar.ok ? resRentCar.json() : null,
      ]);

      setDatosContables(datosJson);
      setVehiculosLista(vehiculosJson.filter((v: any) => !v.rentCarId || v.rentCarId === targetTenant));
      setRentCarInfo(rentCarJson);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al conectar con contabilidad.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReporteContable();
  }, [tenantActivoId, fechaInicio, fechaFin]);

  // Conversor de montos formateados
  const formatearMonto = (montoUSD: number) => {
    if (moneda === "USD") {
      return `$ ${Number(montoUSD || 0).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USD`;
    }
    return `RD$ ${(Number(montoUSD || 0) * tasaCambio).toLocaleString("es-DO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} DOP`;
  };

  // Formulario de creación de gastos
  const guardarNuevoGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formGasto.descripcion.trim()) {
      setError("Ingresa una descripción clara del gasto.");
      return;
    }

    const montoNum = parseFloat(formGasto.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError("Ingresa un monto válido mayor a 0.");
      return;
    }

    try {
      setGuardandoGasto(true);
      setError("");

      // Si fue ingresado en DOP, estandarizamos a USD para base de datos
      let montoFinalUSD = montoNum;
      if (monedaGasto === "DOP") {
        montoFinalUSD = Number((montoNum / tasaCambio).toFixed(2));
      }

      const res = await fetch(API_URLS.gastos, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentCarId: tenantActivoId || 1,
          vehiculoId: formGasto.vehiculoId ? Number(formGasto.vehiculoId) : null,
          categoria: formGasto.categoria,
          descripcion: formGasto.descripcion.trim(),
          monto: montoFinalUSD,
          moneda: monedaGasto,
          fecha: formGasto.fecha,
          comprobante: formGasto.comprobante.trim() || undefined,
          proveedor: formGasto.proveedor.trim() || undefined,
          metodoPago: formGasto.metodoPago,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Error al registrar el gasto.");
      }

      setMensaje("✅ Gasto operativo registrado exitosamente.");
      setMostrarModalGasto(false);
      setFormGasto({
        categoria: "COMBUSTIBLE_LAVADO",
        descripcion: "",
        monto: "",
        fecha: new Date().toISOString().split("T")[0],
        comprobante: "",
        proveedor: "",
        metodoPago: "EFECTIVO",
        vehiculoId: "",
      });

      await cargarReporteContable();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al guardar gasto.");
    } finally {
      setGuardandoGasto(false);
    }
  };

  // Eliminar un gasto
  const eliminarGasto = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas anular y eliminar este registro de gasto?")) {
      return;
    }
    try {
      const res = await fetch(`${API_URLS.gastos}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No fue posible eliminar el gasto.");
      setMensaje("✅ Gasto eliminado.");
      await cargarReporteContable();
    } catch (err) {
      console.error(err);
      setError("Error al eliminar gasto.");
    }
  };

  // Clientes filtrados por búsqueda
  const clientesFiltrados = useMemo(() => {
    if (!datosContables) return [];
    let lista = datosContables.analisisClientes;

    if (busquedaCliente.trim()) {
      const term = busquedaCliente.toLowerCase();
      lista = lista.filter(
        (c) =>
          c.cliente.nombre.toLowerCase().includes(term) ||
          c.cliente.apellido.toLowerCase().includes(term) ||
          c.cliente.telefono.includes(term) ||
          (c.cliente.email && c.cliente.email.toLowerCase().includes(term))
      );
    }

    if (clienteSeleccionadoId !== "TODOS") {
      lista = lista.filter((c) => c.cliente.id === Number(clienteSeleccionadoId));
    }

    return lista;
  }, [datosContables, busquedaCliente, clienteSeleccionadoId]);

  // Cliente único actualmente activo en la vista de detalle
  const clienteActivoDetalle = useMemo(() => {
    if (!datosContables || clienteSeleccionadoId === "TODOS") {
      return clientesFiltrados.length > 0 ? clientesFiltrados[0] : null;
    }
    return datosContables.analisisClientes.find((c) => c.cliente.id === Number(clienteSeleccionadoId)) || null;
  }, [datosContables, clienteSeleccionadoId, clientesFiltrados]);

  // Exportar a CSV Contable
  const exportarCSVContable = () => {
    if (!datosContables) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "REPORTE CONTABLE - ESTADO DE RESULTADOS & FINANZAS RENTOS\r\n";
    csvContent += `Periodo: ${fechaInicio || "Inicio"} al ${fechaFin || "Hoy"}\r\n`;
    csvContent += `Moneda: ${moneda} (Tasa: ${tasaCambio})\r\n\r\n`;

    csvContent += "RESUMEN EJECUTIVO\r\n";
    csvContent += `Total Ingresos Cobrados,${datosContables.resumenEstadoResultados.totalIngresosCobrados}\r\n`;
    csvContent += `Total Gastos Operativos,${datosContables.resumenEstadoResultados.totalGastosGenerales}\r\n`;
    csvContent += `Utilidad Neta,${datosContables.resumenEstadoResultados.utilidadNeta}\r\n`;
    csvContent += `Margen Rentabilidad (%),${datosContables.resumenEstadoResultados.margenUtilidad}%\r\n\r\n`;

    csvContent += "ANALISIS DE GASTOS POR CLIENTE\r\n";
    csvContent += "ID Cliente,Cliente,Telefono,Total Facturado (Gastado),Total Pagado,Saldo Pendiente,Contratos\r\n";
    datosContables.analisisClientes.forEach((c) => {
      csvContent += `${c.cliente.id},"${c.cliente.nombre} ${c.cliente.apellido}","${c.cliente.telefono}",${c.totalFacturado},${c.totalPagado},${c.balancePendiente},${c.cantidadContratos}\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rentos_contabilidad_${fechaInicio || "historico"}_${fechaFin || "actual"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pl = datosContables?.resumenEstadoResultados;

  return (
    <div className="contabilidad-container" style={{ padding: "0 4px 40px" }}>
      {/* 1. ENCABEZADO Y BARRA DE CONTROL */}
      <div className="page-heading" style={{ marginBottom: "16px" }}>
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📊</span> Contabilidad, Finanzas & Estado de Resultados
          </h1>
          <p>
            Análisis financiero en tiempo real: ingresos, costos de taller, gastos operativos, beneficio neto y estado de cuenta de consumos por cliente.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Switch de Moneda Universal */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--surface)",
              padding: "4px 8px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
              MONEDA:
            </span>
            <div style={{ display: "flex", gap: "2px" }}>
              <button
                type="button"
                style={{
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: moneda === "USD" ? "var(--primary)" : "transparent",
                  color: moneda === "USD" ? "#ffffff" : "var(--text)",
                  cursor: "pointer",
                }}
                onClick={() => setMoneda("USD")}
              >
                💵 US$
              </button>
              <button
                type="button"
                style={{
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: moneda === "DOP" ? "var(--primary)" : "transparent",
                  color: moneda === "DOP" ? "#ffffff" : "var(--text)",
                  cursor: "pointer",
                }}
                onClick={() => setMoneda("DOP")}
              >
                🇩🇴 RD$
              </button>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "6px", marginLeft: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Tasa:</span>
              <input
                type="number"
                value={tasaCambio}
                onChange={(e) => setTasaCambio(Math.max(1, parseFloat(e.target.value) || 60))}
                style={{ width: "52px", padding: "2px 4px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--border)" }}
                title="Tasa de cambio USD a DOP"
              />
            </div>
          </div>

          <button
            className="secondary-button"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            onClick={exportarCSVContable}
            disabled={cargando || !datosContables}
          >
            📥 Exportar CSV
          </button>

          <button
            className="primary-button"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            onClick={() => setMostrarModalGasto(true)}
          >
            + Registrar Gasto
          </button>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* 2. BARRA DE FILTROS DE TIEMPO (PERÍODOS) */}
      <div
        className="content-panel"
        style={{
          padding: "12px 18px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Presets Rápidos */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
            📅 Período:
          </span>
          {[
            { id: "HOY", label: "Hoy" },
            { id: "ESTA_SEMANA", label: "Esta Semana" },
            { id: "ESTE_MES", label: "Este Mes" },
            { id: "MES_ANTERIOR", label: "Mes Anterior" },
            { id: "ESTE_TRIMESTRE", label: "Trimestre" },
            { id: "ESTE_ANIO", label: "Este Año" },
            { id: "TODO", label: "Todo el Historial" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => aplicarPresetPeriodo(p.id)}
              style={{
                border: "1px solid var(--border)",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: presetPeriodo === p.id ? "var(--primary)" : "var(--background)",
                color: presetPeriodo === p.id ? "#ffffff" : "var(--text)",
                cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Selector de Rango Personalizado con FechaInput */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Desde:</span>
            <FechaInput
              value={fechaInicio}
              onChange={(iso) => {
                setFechaInicio(iso);
                setPresetPeriodo("PERSONALIZADO");
              }}
              style={{ width: "135px" }}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Hasta:</span>
            <FechaInput
              value={fechaFin}
              onChange={(iso) => {
                setFechaFin(iso);
                setPresetPeriodo("PERSONALIZADO");
              }}
              style={{ width: "135px" }}
            />
          </div>
        </div>
      </div>

      {/* 3. BARRA DE PESTAÑAS PRINCIPALES */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid var(--border)",
          marginBottom: "20px",
          gap: "4px",
        }}
      >
        <button
          type="button"
          onClick={() => setTabActiva("PL")}
          style={{
            padding: "10px 18px",
            border: "none",
            borderBottom: tabActiva === "PL" ? "3px solid var(--primary)" : "3px solid transparent",
            backgroundColor: tabActiva === "PL" ? "var(--primary-soft)" : "transparent",
            color: tabActiva === "PL" ? "var(--primary)" : "var(--text)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            borderRadius: "6px 6px 0 0",
          }}
        >
          📈 Estado de Resultados (P&L)
        </button>

        <button
          type="button"
          onClick={() => setTabActiva("CLIENTES")}
          style={{
            padding: "10px 18px",
            border: "none",
            borderBottom: tabActiva === "CLIENTES" ? "3px solid var(--primary)" : "3px solid transparent",
            backgroundColor: tabActiva === "CLIENTES" ? "var(--primary-soft)" : "transparent",
            color: tabActiva === "CLIENTES" ? "var(--primary)" : "var(--text)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            borderRadius: "6px 6px 0 0",
          }}
        >
          👤 Análisis Financiero por Cliente
        </button>

        <button
          type="button"
          onClick={() => setTabActiva("FLOTA")}
          style={{
            padding: "10px 18px",
            border: "none",
            borderBottom: tabActiva === "FLOTA" ? "3px solid var(--primary)" : "3px solid transparent",
            backgroundColor: tabActiva === "FLOTA" ? "var(--primary-soft)" : "transparent",
            color: tabActiva === "FLOTA" ? "var(--primary)" : "var(--text)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            borderRadius: "6px 6px 0 0",
          }}
        >
          🚗 Rentabilidad por Vehículo (ROI)
        </button>

        <button
          type="button"
          onClick={() => setTabActiva("GASTOS")}
          style={{
            padding: "10px 18px",
            border: "none",
            borderBottom: tabActiva === "GASTOS" ? "3px solid var(--primary)" : "3px solid transparent",
            backgroundColor: tabActiva === "GASTOS" ? "var(--primary-soft)" : "transparent",
            color: tabActiva === "GASTOS" ? "var(--primary)" : "var(--text)",
            fontWeight: 700,
            fontSize: "13px",
            cursor: "pointer",
            borderRadius: "6px 6px 0 0",
          }}
        >
          🧾 Gastos & Egresos Operativos ({datosContables?.gastosRegistrados.length || 0})
        </button>
      </div>

      {cargando ? (
        <div className="empty-state" style={{ padding: "40px" }}>
          <div className="empty-state-icon">⏳</div>
          <strong>Consolidando información contable y balances...</strong>
        </div>
      ) : !datosContables ? (
        <div className="empty-state">
          <strong>No fue posible cargar el estado financiero.</strong>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* PESTAÑA 1: ESTADO DE RESULTADOS (P&L) */}
          {/* ========================================================================= */}
          {tabActiva === "PL" && (
            <div>
              {/* Tarjetas KPI de Estado de Resultados */}
              <div
                className="dashboard-metrics"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  marginBottom: "24px",
                }}
              >
                <div className="metric-card">
                  <div className="metric-title">Ingresos Totales (Cobrados)</div>
                  <div className="metric-value" style={{ color: "var(--success)" }}>
                    {formatearMonto(pl?.totalIngresosCobrados || 0)}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Facturado en Contratos: {formatearMonto(pl?.totalFacturadoContratos || 0)}
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-title">Gastos Totales (Costos & Taller)</div>
                  <div className="metric-value" style={{ color: "var(--danger)" }}>
                    {formatearMonto(pl?.totalGastosGenerales || 0)}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    {datosContables.totalMantenimientos} servicios de taller + {datosContables.gastosRegistrados.length} egresos
                  </div>
                </div>

                <div className="metric-card" style={{ borderLeft: (pl?.utilidadNeta || 0) >= 0 ? "4px solid #16a34a" : "4px solid #dc2626" }}>
                  <div className="metric-title">Ganancia Neta (Utilidad Real)</div>
                  <div
                    className="metric-value"
                    style={{ color: (pl?.utilidadNeta || 0) >= 0 ? "var(--success)" : "var(--danger)" }}
                  >
                    {formatearMonto(pl?.utilidadNeta || 0)}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Ingresos cobrados menos gastos totales
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-title">Margen de Rentabilidad</div>
                  <div
                    className="metric-value"
                    style={{ color: (pl?.margenUtilidad || 0) >= 0 ? "var(--primary)" : "var(--danger)" }}
                  >
                    {pl?.margenUtilidad || 0}%
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Rendimiento operativo neto
                  </div>
                </div>
              </div>

              {/* Desgloses Comparativos de Ingresos vs Gastos */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                  gap: "20px",
                }}
              >
                {/* Desglose de Fuentes de Ingresos */}
                <div className="content-panel">
                  <div className="panel-header">
                    <h2>💵 Desglose de Ingresos por Concepto</h2>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                      <span>🚗 Rentas Base de Vehículos</span>
                      <strong>{formatearMonto(pl?.desgloseIngresos.rentasBase || 0)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                      <span>✈️ Cargos de Delivery & Aeropuerto</span>
                      <strong>{formatearMonto(pl?.desgloseIngresos.delivery || 0)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                      <span>📦 Cobros Extras / Accesorios / GPS</span>
                      <strong>{formatearMonto(pl?.desgloseIngresos.cobrosExtra || 0)}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                      <span>🛡️ Depósitos en Garantía Retenidos</span>
                      <strong>{formatearMonto(pl?.desgloseIngresos.depositosRetenidos || 0)}</strong>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        background: "var(--primary-soft)",
                        borderRadius: "8px",
                        fontWeight: 800,
                        color: "var(--primary)",
                      }}
                    >
                      <span>TOTAL INGRESOS RECAUDADOS</span>
                      <span>{formatearMonto(pl?.totalIngresosCobrados || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Desglose de Egresos por Categoría Contable */}
                <div className="content-panel">
                  <div className="panel-header">
                    <h2>📉 Desglose de Gastos & Costos Operativos</h2>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {Object.entries(nombresCategoriasGasto).map(([key, item]) => {
                      const montoCat = pl?.desgloseGastos[key] || 0;
                      return (
                        <div
                          key={key}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "6px 0",
                            borderBottom: "1px solid var(--border)",
                            fontSize: "12px",
                          }}
                        >
                          <span>
                            {item.icono} {item.nombre}
                          </span>
                          <strong style={{ color: montoCat > 0 ? "var(--danger)" : "var(--text-secondary)" }}>
                            {formatearMonto(montoCat)}
                          </strong>
                        </div>
                      );
                    })}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        background: "rgba(220, 38, 38, 0.1)",
                        borderRadius: "8px",
                        fontWeight: 800,
                        color: "var(--danger)",
                      }}
                    >
                      <span>TOTAL GASTOS & COSTOS</span>
                      <span>{formatearMonto(pl?.totalGastosGenerales || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 2: ANÁLISIS FINANCIERO POR CLIENTE ("¿Cuánto gastó y en qué?") */}
          {/* ========================================================================= */}
          {tabActiva === "CLIENTES" && (
            <div>
              {/* Barra de Búsqueda y Selección de Cliente */}
              <div
                className="filter-bar"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1.5fr auto",
                  gap: "12px",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <input
                  type="text"
                  placeholder="🔍 Buscar cliente por nombre, teléfono o email..."
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                />

                <select
                  value={clienteSeleccionadoId}
                  onChange={(e) =>
                    setClienteSeleccionadoId(
                      e.target.value === "TODOS" ? "TODOS" : Number(e.target.value)
                    )
                  }
                >
                  <option value="TODOS">-- Todos los clientes con consumos --</option>
                  {datosContables.analisisClientes.map((c) => (
                    <option key={c.cliente.id} value={c.cliente.id}>
                      {c.cliente.nombre} {c.cliente.apellido} • Tel: {c.cliente.telefono} ({c.cantidadContratos} contratos - Gastó: ${c.totalFacturado.toFixed(2)})
                    </option>
                  ))}
                </select>

                {clienteActivoDetalle && (
                  <button
                    type="button"
                    className="primary-button"
                    style={{ whiteSpace: "nowrap", padding: "8px 16px" }}
                    onClick={() =>
                      setClienteEstadoCuentaImprimir({
                        ...clienteActivoDetalle,
                        rentCar: rentCarInfo || { nombre: "RentOS Dominicana" },
                        moneda,
                        tasaCambio,
                        periodoTexto: `${fechaInicio || "Inicio"} al ${fechaFin || "Hoy"}`,
                      } as any)
                    }
                  >
                    📄 Imprimir Estado de Cuenta
                  </button>
                )}
              </div>

              {/* Ficha Resumen del Cliente Seleccionado */}
              {clienteActivoDetalle ? (
                <div>
                  {/* Tarjetas de Balance del Cliente */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "16px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                        Total Facturado (Gastos Cliente)
                      </span>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", marginTop: "4px" }}>
                        {formatearMonto(clienteActivoDetalle.totalFacturado)}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                        Total Pagado / Abonado
                      </span>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--success)", marginTop: "4px" }}>
                        {formatearMonto(clienteActivoDetalle.totalPagado)}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                        Saldo Pendiente por Cobrar
                      </span>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: 800,
                          color: clienteActivoDetalle.balancePendiente > 0 ? "var(--danger)" : "var(--success)",
                          marginTop: "4px",
                        }}
                      >
                        {formatearMonto(clienteActivoDetalle.balancePendiente)}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "10px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                        Alquileres Realizados
                      </span>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--primary)", marginTop: "4px" }}>
                        {clienteActivoDetalle.cantidadContratos} contratos
                      </div>
                    </div>
                  </div>

                  {/* Tabla Desglose "En qué gastó el cliente" */}
                  <div className="content-panel">
                    <div className="panel-header">
                      <h2>
                        📋 Desglose de Gastos & Consumos: {clienteActivoDetalle.cliente.nombre} {clienteActivoDetalle.cliente.apellido}
                      </h2>
                    </div>

                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Contrato</th>
                            <th>Vehículo Alquilado</th>
                            <th>Período & Días</th>
                            <th>Tarifa / Día</th>
                            <th>Renta Base</th>
                            <th>Extras / Delivery</th>
                            <th>Total Facturado</th>
                            <th>Total Pagado</th>
                            <th>Saldo Pendiente</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clienteActivoDetalle.desgloseEnQueGasto.map((item) => (
                            <tr key={item.contratoId}>
                              <td>
                                <span className="badge badge-mantenimiento">#{item.contratoId}</span>
                              </td>
                              <td>
                                <strong>{item.vehiculo}</strong>
                                <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                                  Seguro: {item.tipoSeguro}
                                </div>
                              </td>
                              <td>
                                <div>{formatearFecha(item.fechaInicio)} al {formatearFecha(item.fechaFin)}</div>
                                <span style={{ fontSize: "11px", color: "var(--primary)", fontWeight: 700 }}>
                                  {item.diasRenta} {item.diasRenta === 1 ? "día" : "días"}
                                </span>
                              </td>
                              <td>{formatearMonto(item.tarifaDiaria)}</td>
                              <td>{formatearMonto(item.costoRentaBase)}</td>
                              <td>{formatearMonto(item.cobrosExtra + item.deliveryMonto)}</td>
                              <td>
                                <strong style={{ color: "var(--text)" }}>
                                  {formatearMonto(item.totalContrato)}
                                </strong>
                              </td>
                              <td>
                                <strong style={{ color: "var(--success)" }}>
                                  {formatearMonto(item.totalPagado)}
                                </strong>
                              </td>
                              <td>
                                <strong
                                  style={{
                                    color: item.saldoPendiente > 0 ? "var(--danger)" : "var(--success)",
                                  }}
                                >
                                  {formatearMonto(item.saldoPendiente)}
                                </strong>
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    item.estado === "ACTIVO"
                                      ? "badge-alquilado"
                                      : item.estado === "FINALIZADO"
                                      ? "badge-disponible"
                                      : "badge-mantenimiento"
                                  }`}
                                >
                                  {item.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <strong>No hay clientes con consumos registrados en este período.</strong>
                </div>
              )}

              {/* Lista Completa de Clientes con Resumen Rápido */}
              <div className="content-panel" style={{ marginTop: "24px" }}>
                <div className="panel-header">
                  <h2>Resumen de Clientes ({clientesFiltrados.length})</h2>
                </div>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Teléfono</th>
                        <th>Alquileres</th>
                        <th>Total Gastado (Facturado)</th>
                        <th>Total Pagado</th>
                        <th>Saldo Pendiente</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesFiltrados.map((cli) => (
                        <tr key={cli.cliente.id}>
                          <td>
                            <strong>{cli.cliente.nombre} {cli.cliente.apellido}</strong>
                            {cli.cliente.email && (
                              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                {cli.cliente.email}
                              </div>
                            )}
                          </td>
                          <td>{cli.cliente.telefono}</td>
                          <td>
                            <span className="badge badge-disponible">{cli.cantidadContratos} contratos</span>
                          </td>
                          <td>
                            <strong>{formatearMonto(cli.totalFacturado)}</strong>
                          </td>
                          <td>
                            <span style={{ color: "var(--success)", fontWeight: 700 }}>
                              {formatearMonto(cli.totalPagado)}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: cli.balancePendiente > 0 ? "var(--danger)" : "var(--success)" }}>
                              {formatearMonto(cli.balancePendiente)}
                            </strong>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="secondary-button"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                              onClick={() => setClienteSeleccionadoId(cli.cliente.id)}
                            >
                              Ver Desglose ➜
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 3: RENTABILIDAD POR VEHÍCULO (ROI DE FLOTA) */}
          {/* ========================================================================= */}
          {tabActiva === "FLOTA" && (
            <div className="content-panel">
              <div className="panel-header">
                <h2>🚗 Rentabilidad & Retorno de Inversión por Unidad de Flota</h2>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vehículo</th>
                      <th>Placa / Año</th>
                      <th>Días Rentado</th>
                      <th>Ingresos Generados</th>
                      <th>Costos de Taller</th>
                      <th>Gastos Directos</th>
                      <th>Beneficio Neto</th>
                      <th>Rentabilidad (ROI)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosContables.rentabilidadVehiculos.map((rv) => (
                      <tr key={rv.vehiculo.id}>
                        <td>
                          <strong>{rv.vehiculo.marca} {rv.vehiculo.modelo}</strong>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            Tarifa base: {formatearMonto(rv.vehiculo.tarifaDiaria)}/día
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-mantenimiento">{rv.vehiculo.placa}</span>
                          <span style={{ fontSize: "11px", marginLeft: "6px" }}>{rv.vehiculo.anio}</span>
                        </td>
                        <td>
                          <strong>{rv.diasAlquilado} días</strong>
                          <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                            {rv.contratosCount} alquileres
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: "var(--success)" }}>
                            {formatearMonto(rv.ingresosGenerados)}
                          </strong>
                        </td>
                        <td>
                          <span style={{ color: rv.costoMantenimiento > 0 ? "var(--danger)" : "var(--text-secondary)" }}>
                            {formatearMonto(rv.costoMantenimiento)}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: rv.gastosDirectos > 0 ? "var(--danger)" : "var(--text-secondary)" }}>
                            {formatearMonto(rv.gastosDirectos)}
                          </span>
                        </td>
                        <td>
                          <strong
                            style={{
                              color: rv.beneficioNeto >= 0 ? "var(--success)" : "var(--danger)",
                              fontSize: "13px",
                            }}
                          >
                            {formatearMonto(rv.beneficioNeto)}
                          </strong>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              rv.beneficioNeto > 0 ? "badge-disponible" : "badge-inactivo"
                            }`}
                            style={{ fontWeight: 800 }}
                          >
                            {rv.rentabilidadPorcentaje}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 4: GASTOS & EGRESOS OPERATIVOS */}
          {/* ========================================================================= */}
          {tabActiva === "GASTOS" && (
            <div className="content-panel">
              <div className="panel-header" style={{ flexWrap: "wrap", gap: "10px" }}>
                <h2>🧾 Registro de Gastos & Compras Operativas</h2>
                <div style={{ display: "flex", gap: "10px" }}>
                  <select
                    value={filtroCategoriaGasto}
                    onChange={(e) => setFiltroCategoriaGasto(e.target.value)}
                    style={{ padding: "6px 10px", fontSize: "12px" }}
                  >
                    <option value="TODAS">-- Todas las categorías --</option>
                    {Object.entries(nombresCategoriasGasto).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.icono} {item.nombre}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setMostrarModalGasto(true)}
                  >
                    + Nuevo Gasto
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Categoría</th>
                      <th>Descripción</th>
                      <th>Proveedor / Taller</th>
                      <th>Comprobante / NCF</th>
                      <th>Vehículo Asignado</th>
                      <th>Monto</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosContables.gastosRegistrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>
                          No hay gastos operativos registrados en este período.
                        </td>
                      </tr>
                    ) : (
                      datosContables.gastosRegistrados
                        .filter(
                          (g) =>
                            filtroCategoriaGasto === "TODAS" ||
                            g.categoria === filtroCategoriaGasto
                        )
                        .map((g) => (
                          <tr key={g.id}>
                            <td>{formatearFecha(g.fecha)}</td>
                            <td>
                              <span className="badge badge-mantenimiento">
                                {nombresCategoriasGasto[g.categoria]?.icono || "📦"}{" "}
                                {nombresCategoriasGasto[g.categoria]?.nombre || g.categoria}
                              </span>
                            </td>
                            <td>
                              <strong>{g.descripcion}</strong>
                            </td>
                            <td>{g.proveedor || "-"}</td>
                            <td>
                              {g.comprobante ? <code>{g.comprobante}</code> : "-"}
                            </td>
                            <td>
                              {g.vehiculo ? (
                                <span>{g.vehiculo.marca} {g.vehiculo.modelo} ({g.vehiculo.placa})</span>
                              ) : (
                                <span style={{ color: "var(--text-secondary)" }}>General</span>
                              )}
                            </td>
                            <td>
                              <strong style={{ color: "var(--danger)" }}>
                                {formatearMonto(Number(g.monto))}
                              </strong>
                            </td>
                            <td>
                              <button
                                type="button"
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  color: "var(--danger)",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                }}
                                onClick={() => eliminarGasto(g.id)}
                                title="Eliminar gasto"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL PARA REGISTRAR NUEVO GASTO OPERATIVO */}
      {/* ========================================================================= */}
      {mostrarModalGasto && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "12px",
              maxWidth: "560px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>
                🧾 Registrar Gasto Operativo o Administrativo
              </h2>
              <button
                className="secondary-button"
                style={{ padding: "4px 8px" }}
                onClick={() => setMostrarModalGasto(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={guardarNuevoGasto}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div className="form-field" style={{ gridColumn: "span 2" }}>
                  <label htmlFor="catGasto">Categoría Contable *</label>
                  <select
                    id="catGasto"
                    value={formGasto.categoria}
                    onChange={(e) =>
                      setFormGasto({ ...formGasto, categoria: e.target.value as CategoriaGasto })
                    }
                    required
                  >
                    {Object.entries(nombresCategoriasGasto).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.icono} {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field" style={{ gridColumn: "span 2" }}>
                  <label htmlFor="descGasto">Descripción del Gasto *</label>
                  <input
                    id="descGasto"
                    type="text"
                    placeholder="Ej. Compra de 4 neumáticos nuevos para Kia Seltos"
                    value={formGasto.descripcion}
                    onChange={(e) => setFormGasto({ ...formGasto, descripcion: e.target.value })}
                    required
                  />
                </div>

                {/* Monto con MonedaInput */}
                <div style={{ gridColumn: "span 2" }}>
                  <MonedaInput
                    id="montoGasto"
                    label="Monto del Gasto"
                    value={formGasto.monto}
                    onChange={(val) => setFormGasto({ ...formGasto, monto: val })}
                    moneda={monedaGasto}
                    onMonedaChange={setMonedaGasto}
                    tasaCambio={tasaCambio}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="fechaGasto">Fecha de Realización *</label>
                  <FechaInput
                    id="fechaGasto"
                    value={formGasto.fecha}
                    onChange={(iso) => setFormGasto({ ...formGasto, fecha: iso })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="metodoGasto">Método de Pago</label>
                  <select
                    id="metodoGasto"
                    value={formGasto.metodoPago}
                    onChange={(e) => setFormGasto({ ...formGasto, metodoPago: e.target.value })}
                  >
                    <option value="EFECTIVO">💵 Efectivo</option>
                    <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                    <option value="TARJETA">💳 Tarjeta Corporativa</option>
                    <option value="OTRO">📦 Otro</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="compGasto">Comprobante / NCF / Factura #</label>
                  <input
                    id="compGasto"
                    type="text"
                    placeholder="Ej. B0100000492"
                    value={formGasto.comprobante}
                    onChange={(e) => setFormGasto({ ...formGasto, comprobante: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="provGasto">Proveedor / Taller / Suplidor</label>
                  <input
                    id="provGasto"
                    type="text"
                    placeholder="Ej. Centro Gomas Dominicana"
                    value={formGasto.proveedor}
                    onChange={(e) => setFormGasto({ ...formGasto, proveedor: e.target.value })}
                  />
                </div>

                <div className="form-field" style={{ gridColumn: "span 2" }}>
                  <label htmlFor="vehGasto">Vehículo Asociado (Opcional - para calcular ROI)</label>
                  <select
                    id="vehGasto"
                    value={formGasto.vehiculoId}
                    onChange={(e) => setFormGasto({ ...formGasto, vehiculoId: e.target.value })}
                  >
                    <option value="">-- Gasto General de la Empresa (Sin auto específico) --</option>
                    {vehiculosLista.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.marca} {v.modelo} ({v.placa})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setMostrarModalGasto(false)}
                  disabled={guardandoGasto}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={guardandoGasto}>
                  {guardandoGasto ? "Guardando..." : "💾 Guardar Gasto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE ESTADO DE CUENTA IMPRIMIBLE DEL CLIENTE */}
      {/* ========================================================================= */}
      {clienteEstadoCuentaImprimir && (
        <EstadoCuentaClienteImprimible
          datos={clienteEstadoCuentaImprimir as any}
          onCerrar={() => setClienteEstadoCuentaImprimir(null)}
        />
      )}
    </div>
  );
}
