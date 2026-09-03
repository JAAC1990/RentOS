/**
 * ============================================================================
 * RentOS - Gestión de Flota de Vehículos y Auditoría Legal (VehiculosPage)
 * ============================================================================
 * Permite la administración integral del parque vehicular:
 * - Alta, edición y baja de vehículos con fotografía, ficha técnica (pasajeros, maletas,
 *   transmisión, combustible, A/C) y validación estricta de placa (máx 7 caracteres) y año (máx 4 dígitos).
 * - Selector interactivo de moneda (US$ / RD$) con switch convertidor en tiempo real según tasa de cambio.
 * - Exportación completa a CSV de toda la flota mediante Blob UTF-8 seguro.
 * - Mensaje de búsqueda sin resultados espaciado y legible.
 * - Monitoreo de estados (DISPONIBLE, ALQUILADO, MANTENIMIENTO, INACTIVO).
 * - Modal interactivo de Ficha Técnica y Fotos en alta resolución.
 * - Pestaña de Auditoría Legal con vencimientos de seguros y marbetes.
 * - Disparo manual de alertas preventivas vía Telegram.
 */

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URLS } from "../../services/api";
import { formatearFecha } from "../../utils/dateUtils";
import FechaInput from "../../components/FechaInput";

type Vehiculo = {
  id: number;
  rentCarId: number;
  marca: string;
  modelo: string;
  anio: number;
  color: string | null;
  placa: string;
  vin: string | null;
  kilometraje: number;
  fotoUrl?: string | null;
  categoria?: string | null;
  transmision?: string | null;
  combustible?: string | null;
  pasajeros?: number | null;
  maletas?: number | null;
  puertas?: number | null;
  aireAcondicionado?: boolean | null;
  estado: "DISPONIBLE" | "ALQUILADO" | "MANTENIMIENTO" | "INACTIVO";
  tarifaDiaria: string | number;
  seguroPoliza?: string | null;
  seguroVencimiento?: string | null;
  marbeteVencimiento?: string | null;
};

type FormularioVehiculo = {
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  placa: string;
  vin: string;
  kilometraje: string;
  tarifaDiaria: string;
  monedaTarifa: "USD" | "DOP";
  fotoUrl: string;
  categoria: string;
  transmision: string;
  combustible: string;
  pasajeros: string;
  maletas: string;
  puertas: string;
  aireAcondicionado: boolean;
  estado: string;
  seguroPoliza: string;
  seguroVencimiento: string;
  marbeteVencimiento: string;
};

type ReporteVencimiento = {
  id: number;
  marca: string;
  modelo: string;
  placa: string;
  color: string | null;
  seguroPoliza: string;
  seguroVencimiento: string | null;
  diasRestantesSeguro: number | null;
  estadoSeguro: "VENCIDO" | "POR_VENCER" | "AL_DIA";
  marbeteVencimiento: string | null;
  estadoMarbete: "VENCIDO" | "POR_VENCER" | "AL_DIA";
};

type ResumenVencimientos = {
  total: number;
  vencidos: number;
  porVencer: number;
  alDia: number;
};

// Tasa de cambio de referencia (1 USD = 60.00 DOP)
const TASA_DOLAR_PESO_DEFAULT = 60.00;

const formularioInicial: FormularioVehiculo = {
  marca: "",
  modelo: "",
  anio: new Date().getFullYear().toString(),
  color: "",
  placa: "",
  vin: "",
  kilometraje: "0",
  tarifaDiaria: "",
  monedaTarifa: "USD",
  fotoUrl: "",
  categoria: "SEDAN",
  transmision: "AUTOMATICA",
  combustible: "GASOLINA",
  pasajeros: "5",
  maletas: "2",
  puertas: "4",
  aireAcondicionado: true,
  estado: "DISPONIBLE",
  seguroPoliza: "Seguros Universal #UN-2026",
  seguroVencimiento: "",
  marbeteVencimiento: "",
};

function obtenerFotoDefault(v: Vehiculo): string {
  if (v.fotoUrl && v.fotoUrl.trim() !== "") {
    return v.fotoUrl;
  }
  const mm = `${v.marca} ${v.modelo}`.toLowerCase();
  if (mm.includes("corolla")) {
    return "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80";
  } else if (mm.includes("sportage") || mm.includes("tucson") || mm.includes("suv") || mm.includes("seltos")) {
    return "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80";
  }
  return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80";
}

export default function VehiculosPage() {
  const { tenantActivoId } = useAuth();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [formulario, setFormulario] = useState<FormularioVehiculo>(formularioInicial);

  // Control de tasa de cambio y visualización
  const [tasaCambio, setTasaCambio] = useState<number>(TASA_DOLAR_PESO_DEFAULT);
  const [monedaVisualizacion, setMonedaVisualizacion] = useState<"USD" | "DOP">("USD");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Modal para ver fotos y ficha técnica al dar clic
  const [vehiculoVerDetalle, setVehiculoVerDetalle] = useState<Vehiculo | null>(null);

  // Monitor de Vencimientos Legales
  const [mostrarMonitorVencimientos, setMostrarMonitorVencimientos] = useState(false);
  const [reporteVencimientos, setReporteVencimientos] = useState<ReporteVencimiento[]>([]);
  const [resumenVencimientos, setResumenVencimientos] = useState<ResumenVencimientos | null>(null);
  const [notificandoTelegram, setNotificandoTelegram] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const [error, setError] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_URL = API_URLS.vehiculos;

  const cargarVehiculos = async () => {
    try {
      setCargando(true);
      setError("");

      const targetTenant = tenantActivoId || 1;
      const [resVehiculos, resVencimientos] = await Promise.all([
        fetch(`${API_URL}?rentCarId=${targetTenant}`),
        fetch(`${API_URL}/vencimientos?rentCarId=${targetTenant}`),
      ]);

      if (!resVehiculos.ok) {
        throw new Error("No fue posible obtener los vehículos.");
      }

      const datosVehiculos: Vehiculo[] = await resVehiculos.json();
      setVehiculos(datosVehiculos.filter((v: Vehiculo) => !v.rentCarId || v.rentCarId === targetTenant));

      if (resVencimientos.ok) {
        const datosVenc = await resVencimientos.json();
        setReporteVencimientos(datosVenc.vehiculos || []);
        setResumenVencimientos(datosVenc.resumen || null);
      }
    } catch (err) {
      console.error(err);
      setError("No fue posible conectar con el servidor para cargar los vehículos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVehiculos();
  }, [tenantActivoId]);

  // Estadísticas calculadas en tiempo real
  const stats = useMemo(() => {
    const total = vehiculos.length;
    const disponibles = vehiculos.filter((v) => v.estado === "DISPONIBLE").length;
    const alquilados = vehiculos.filter((v) => v.estado === "ALQUILADO").length;
    const mantenimiento = vehiculos.filter((v) => v.estado === "MANTENIMIENTO").length;

    return { total, disponibles, alquilados, mantenimiento };
  }, [vehiculos]);

  // Filtrado y búsqueda
  const vehiculosFiltrados = useMemo(() => {
    return vehiculos.filter((vehiculo) => {
      const cumpleFiltroEstado =
        filtroEstado === "TODOS" || vehiculo.estado === filtroEstado;

      const textoBusqueda = `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.placa} ${vehiculo.vin ?? ""} ${vehiculo.color ?? ""}`.toLowerCase();
      const cumpleBusqueda = textoBusqueda.includes(busqueda.toLowerCase());

      return cumpleFiltroEstado && cumpleBusqueda;
    });
  }, [vehiculos, busqueda, filtroEstado]);

  // Manejador del Switch de Moneda en Formulario (USD <-> DOP)
  const alternarMonedaFormulario = (nuevaMoneda: "USD" | "DOP") => {
    if (nuevaMoneda === formulario.monedaTarifa) return;

    const valorActual = parseFloat(formulario.tarifaDiaria);
    if (!isNaN(valorActual) && valorActual > 0) {
      if (nuevaMoneda === "DOP") {
        // De USD a DOP: Multiplicar por tasa
        const convertido = (valorActual * tasaCambio).toFixed(2);
        setFormulario((prev) => ({ ...prev, monedaTarifa: "DOP", tarifaDiaria: convertido }));
      } else {
        // De DOP a USD: Dividir entre tasa
        const convertido = (valorActual / tasaCambio).toFixed(2);
        setFormulario((prev) => ({ ...prev, monedaTarifa: "USD", tarifaDiaria: convertido }));
      }
    } else {
      setFormulario((prev) => ({ ...prev, monedaTarifa: nuevaMoneda }));
    }
  };

  const handleSubirFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorFormulario("Selecciona un archivo de imagen válido (PNG, JPG, WEBP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setFormulario((prev) => ({
            ...prev,
            fotoUrl: canvas.toDataURL("image/jpeg", 0.85),
          }));
        } else {
          setFormulario((prev) => ({ ...prev, fotoUrl: src }));
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const validarFormulario = () => {
    setErrorFormulario("");

    if (!formulario.marca.trim()) {
      setErrorFormulario("La marca es obligatoria.");
      return false;
    }
    if (!formulario.modelo.trim()) {
      setErrorFormulario("El modelo es obligatorio.");
      return false;
    }

    // Validación estricta de Placa: Máximo 8 caracteres (permite guion, ej. A-123456 o A123456)
    const placaLimpia = formulario.placa.trim().toUpperCase();
    if (!placaLimpia) {
      setErrorFormulario("La placa es obligatoria.");
      return false;
    }
    if (placaLimpia.length > 8) {
      setErrorFormulario("La placa no puede tener más de 8 caracteres (ej. A-123456 o A123456).");
      return false;
    }

    // Validación estricta de Año: Exactamente 4 dígitos
    const anioDigits = formulario.anio.replace(/\D/g, "");
    if (!anioDigits || anioDigits.length !== 4) {
      setErrorFormulario("El año debe tener exactamente 4 números (ej. 2024).");
      return false;
    }
    const anioNum = Number(anioDigits);
    if (anioNum < 1990 || anioNum > new Date().getFullYear() + 2) {
      setErrorFormulario(`El año debe estar entre 1990 y ${new Date().getFullYear() + 2}.`);
      return false;
    }

    const tarifa = Number(formulario.tarifaDiaria);
    if (!tarifa || tarifa <= 0) {
      setErrorFormulario("La tarifa diaria debe ser mayor a 0.");
      return false;
    }

    const km = Number(formulario.kilometraje);
    if (isNaN(km) || km < 0) {
      setErrorFormulario("El kilometraje no puede ser negativo.");
      return false;
    }

    return true;
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setEditandoId(null);
    setErrorFormulario("");
    setMostrarFormulario(false);
  };

  const guardarVehiculo = async () => {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensaje("");

      // Si la tarifa fue ingresada en DOP, la estandarizamos o guardamos según corresponda
      let tarifaFinalUSD = Number(formulario.tarifaDiaria);
      if (formulario.monedaTarifa === "DOP") {
        tarifaFinalUSD = Number((tarifaFinalUSD / tasaCambio).toFixed(2));
      }

      const datos = {
        marca: formulario.marca.trim(),
        modelo: formulario.modelo.trim(),
        anio: Number(formulario.anio.slice(0, 4)),
        color: formulario.color.trim() || undefined,
        placa: formulario.placa.trim().toUpperCase().slice(0, 8),
        vin: formulario.vin.trim() || undefined,
        kilometraje: Number(formulario.kilometraje),
        tarifaDiaria: tarifaFinalUSD,
        fotoUrl: formulario.fotoUrl.trim() || undefined,
        categoria: formulario.categoria,
        transmision: formulario.transmision,
        combustible: formulario.combustible,
        pasajeros: Number(formulario.pasajeros || 5),
        maletas: Number(formulario.maletas || 2),
        puertas: Number(formulario.puertas || 4),
        aireAcondicionado: formulario.aireAcondicionado,
        estado: formulario.estado,
        seguroPoliza: formulario.seguroPoliza.trim() || undefined,
        seguroVencimiento: formulario.seguroVencimiento || undefined,
        marbeteVencimiento: formulario.marbeteVencimiento || undefined,
        rentCarId: tenantActivoId || 1,
      };

      const url = editandoId === null ? API_URL : `${API_URL}/${editandoId}`;
      const metodo = editandoId === null ? "POST" : "PUT";

      const respuesta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          resultado?.message ||
            resultado?.error ||
            "No fue posible guardar el vehículo."
        );
      }

      setMensaje(
        editandoId === null
          ? "✅ Vehículo registrado exitosamente con fotos y ficha técnica."
          : "✅ Vehículo actualizado correctamente."
      );

      limpiarFormulario();
      await cargarVehiculos();
    } catch (err) {
      console.error(err);
      setErrorFormulario(
        err instanceof Error ? err.message : "Error al guardar vehículo."
      );
    } finally {
      setGuardando(false);
    }
  };

  const editarVehiculo = (vehiculo: Vehiculo) => {
    setEditandoId(vehiculo.id);
    setFormulario({
      marca: vehiculo.marca ?? "",
      modelo: vehiculo.modelo ?? "",
      anio: String(vehiculo.anio ?? "").slice(0, 4),
      color: vehiculo.color ?? "",
      placa: (vehiculo.placa ?? "").slice(0, 8),
      vin: vehiculo.vin ?? "",
      kilometraje: String(vehiculo.kilometraje ?? 0),
      tarifaDiaria: String(vehiculo.tarifaDiaria ?? ""),
      monedaTarifa: "USD",
      fotoUrl: vehiculo.fotoUrl ?? "",
      categoria: vehiculo.categoria ?? "SEDAN",
      transmision: vehiculo.transmision ?? "AUTOMATICA",
      combustible: vehiculo.combustible ?? "GASOLINA",
      pasajeros: String(vehiculo.pasajeros ?? 5),
      maletas: String(vehiculo.maletas ?? 2),
      puertas: String(vehiculo.puertas ?? 4),
      aireAcondicionado: vehiculo.aireAcondicionado ?? true,
      estado: vehiculo.estado ?? "DISPONIBLE",
      seguroPoliza: vehiculo.seguroPoliza ?? "Seguros Universal #UN-2026",
      seguroVencimiento: vehiculo.seguroVencimiento
        ? vehiculo.seguroVencimiento.split("T")[0]
        : "",
      marbeteVencimiento: vehiculo.marbeteVencimiento
        ? vehiculo.marbeteVencimiento.split("T")[0]
        : "",
    });
    setErrorFormulario("");
    setMostrarFormulario(true);
  };

  const eliminarVehiculo = async (id: number) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea eliminar este vehículo? Esta acción no se puede deshacer."
    );
    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      const respuesta = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!respuesta.ok) {
        throw new Error("No fue posible eliminar el vehículo.");
      }

      setMensaje("🗑️ Vehículo eliminado correctamente.");
      if (editandoId === id) limpiarFormulario();
      await cargarVehiculos();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No fue posible eliminar el vehículo."
      );
    }
  };

  const enviarAlertaTelegram = async () => {
    try {
      setNotificandoTelegram(true);
      setError("");
      setMensaje("");

      const res = await fetch(`${API_URL}/notificar-vencimientos-telegram`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar alerta a Telegram.");

      setMensaje("📲 " + data.mensaje);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al notificar Telegram.");
    } finally {
      setNotificandoTelegram(false);
    }
  };

  // Exportar TODOS los vehículos a CSV de forma segura mediante Blob UTF-8
  const exportarCSV = () => {
    if (vehiculos.length === 0) {
      alert("No hay vehículos registrados para exportar.");
      return;
    }

    const encabezados = [
      "ID",
      "Marca",
      "Modelo",
      "Anio",
      "Color",
      "Placa",
      "VIN",
      "Kilometraje",
      "Estado",
      "Tarifa Diaria (USD)",
      "Tarifa Diaria (DOP)",
      "Categoria",
      "Transmision",
      "Combustible",
      "Pasajeros",
      "Maletas",
      "Seguro Poliza",
      "Vencimiento Seguro",
      "Vencimiento Marbete",
    ];

    const filas = vehiculos.map((v) => {
      const tarifaUSD = Number(v.tarifaDiaria) || 0;
      const tarifaDOP = (tarifaUSD * tasaCambio).toFixed(2);

      return [
        v.id,
        `"${(v.marca || "").replace(/"/g, '""')}"`,
        `"${(v.modelo || "").replace(/"/g, '""')}"`,
        v.anio,
        `"${(v.color || "").replace(/"/g, '""')}"`,
        `"${(v.placa || "").replace(/"/g, '""')}"`,
        `"${(v.vin || "").replace(/"/g, '""')}"`,
        v.kilometraje,
        v.estado,
        tarifaUSD.toFixed(2),
        tarifaDOP,
        `"${v.categoria || "SEDAN"}"`,
        `"${v.transmision || "AUTOMATICA"}"`,
        `"${v.combustible || "GASOLINA"}"`,
        v.pasajeros || 5,
        v.maletas || 2,
        `"${(v.seguroPoliza || "").replace(/"/g, '""')}"`,
        formatearFecha(v.seguroVencimiento),
        formatearFecha(v.marbeteVencimiento),
      ].join(",");
    });

    const csvContent = [encabezados.join(","), ...filas].join("\r\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `RentOS_Flota_Completa_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Formato visual de precios según la moneda activa
  const formatearPrecio = (tarifaUSD: number | string) => {
    const valor = Number(tarifaUSD) || 0;
    if (monedaVisualizacion === "DOP") {
      const enPesos = valor * tasaCambio;
      return `RD$ ${enPesos.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${valor.toFixed(2)} USD`;
  };

  return (
    <div className="vehiculos-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Gestión de Flota & Vehículos</h1>
          <p>Administra la flota, fotografías, fichas técnicas, conversión de moneda, pólizas y vencimientos legales.</p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Selector Global de Moneda (USD / DOP) */}
          <div
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "4px 8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
            }}
          >
            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Ver Precios en:</span>
            <div style={{ display: "flex", backgroundColor: "var(--background)", borderRadius: "6px", padding: "2px" }}>
              <button
                type="button"
                style={{
                  border: "none",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  backgroundColor: monedaVisualizacion === "USD" ? "var(--primary)" : "transparent",
                  color: monedaVisualizacion === "USD" ? "#ffffff" : "var(--text)",
                  cursor: "pointer",
                }}
                onClick={() => setMonedaVisualizacion("USD")}
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
                  backgroundColor: monedaVisualizacion === "DOP" ? "var(--primary)" : "transparent",
                  color: monedaVisualizacion === "DOP" ? "#ffffff" : "var(--text)",
                  cursor: "pointer",
                }}
                onClick={() => setMonedaVisualizacion("DOP")}
              >
                🇩🇴 RD$
              </button>
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginLeft: "4px", display: "inline-flex", alignItems: "center", gap: "3px" }}>
              Tasa: 1$ =
              <input
                type="number"
                min="1"
                step="0.5"
                value={tasaCambio}
                onChange={(e) => setTasaCambio(parseFloat(e.target.value) || TASA_DOLAR_PESO_DEFAULT)}
                style={{
                  width: "55px",
                  padding: "2px 4px",
                  fontSize: "11px",
                  borderRadius: "4px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  textAlign: "center",
                }}
                title="Tasa de cambio USD a DOP (editable)"
              />
              RD$
            </span>
          </div>

          <button
            className="secondary-button"
            style={{
              borderColor: resumenVencimientos && resumenVencimientos.vencidos > 0 ? "#fca5a5" : "var(--border)",
              color: resumenVencimientos && resumenVencimientos.vencidos > 0 ? "var(--danger)" : "inherit",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={() => setMostrarMonitorVencimientos(true)}
          >
            🛡️ Monitor Seguros & Marbetes
            {resumenVencimientos && resumenVencimientos.vencidos > 0 && (
              <span className="badge badge-inactivo" style={{ marginLeft: "4px" }}>
                {resumenVencimientos.vencidos} Vencido
              </span>
            )}
          </button>

          <button
            className="secondary-button"
            onClick={exportarCSV}
            title={`Exportar toda la flota (${vehiculos.length} vehículos) a CSV`}
          >
            📥 Exportar CSV ({vehiculos.length})
          </button>

          <button
            className="primary-button"
            onClick={() => {
              if (mostrarFormulario && editandoId === null) {
                setMostrarFormulario(false);
              } else {
                limpiarFormulario();
                setMostrarFormulario(true);
              }
            }}
          >
            {mostrarFormulario && editandoId === null ? "Cerrar Formulario" : "+ Nuevo Vehículo"}
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚗</div>
          <div className="stat-info">
            <span className="stat-label">Total Flota</span>
            <strong className="stat-value">{stats.total}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon available">✓</div>
          <div className="stat-info">
            <span className="stat-label">Disponibles</span>
            <strong className="stat-value">{stats.disponibles}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rented">🔑</div>
          <div className="stat-info">
            <span className="stat-label">Alquilados</span>
            <strong className="stat-value">{stats.alquilados}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon maintenance">🛠️</div>
          <div className="stat-info">
            <span className="stat-label">En Taller / Mantenimiento</span>
            <strong className="stat-value">{stats.mantenimiento}</strong>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Formulario de Vehículo con Foto y Ficha Técnica */}
      {mostrarFormulario && (
        <section className="content-panel" id="formulario-vehiculo">
          <div className="panel-header">
            <h2>{editandoId === null ? "Registrar Nuevo Vehículo con Ficha Técnica" : "Editar Vehículo"}</h2>
            <button className="secondary-button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          </div>

          {errorFormulario && (
            <div className="alert-box error" style={{ margin: "20px 24px 0" }}>
              {errorFormulario}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              guardarVehiculo();
            }}
          >
            <div className="form-grid">
              {/* Foto del Auto */}
              <div className="form-field" style={{ gridColumn: "span 3", backgroundColor: "var(--primary-soft)", padding: "16px", borderRadius: "10px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  📸 Fotografía Principal del Vehículo (Visible para el Cliente)
                </label>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "120px", height: "80px", backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {formulario.fotoUrl ? (
                      <img src={formulario.fotoUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "24px" }}>🚗</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <input
                        type="file"
                        id="fotoFileInput"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleSubirFoto}
                      />
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => document.getElementById("fotoFileInput")?.click()}
                      >
                        📁 Subir Imagen desde Dispositivo
                      </button>
                      {formulario.fotoUrl && (
                        <button
                          type="button"
                          className="secondary-button"
                          style={{ color: "var(--danger)" }}
                          onClick={() => setFormulario((prev) => ({ ...prev, fotoUrl: "" }))}
                        >
                          ✕ Quitar Foto
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="O pega una URL web directa de la foto (https://...)"
                      value={formulario.fotoUrl}
                      onChange={(e) => setFormulario((prev) => ({ ...prev, fotoUrl: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Datos Básicos */}
              <div className="form-field">
                <label htmlFor="marca">Marca *</label>
                <input
                  id="marca"
                  type="text"
                  placeholder="Ej. Toyota"
                  value={formulario.marca}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, marca: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="modelo">Modelo *</label>
                <input
                  id="modelo"
                  type="text"
                  placeholder="Ej. Corolla LE"
                  value={formulario.modelo}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, modelo: e.target.value }))
                  }
                  required
                />
              </div>

              {/* AÑO: Máximo 4 dígitos */}
              <div className="form-field">
                <label htmlFor="anio">Año * (Máximo 4 números)</label>
                <input
                  id="anio"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="2024"
                  value={formulario.anio}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setFormulario((prev) => ({ ...prev, anio: digits }));
                  }}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="color">Color</label>
                <input
                  id="color"
                  type="text"
                  placeholder="Ej. Blanco perlado"
                  value={formulario.color}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, color: e.target.value }))
                  }
                />
              </div>

              {/* PLACA: Máximo 8 caracteres (con guion, ej. A-123456 o A123456) */}
              <div className="form-field">
                <label htmlFor="placa">Placa / Matrícula * (Máx. 8 caracteres, ej. A-123456)</label>
                <input
                  id="placa"
                  type="text"
                  maxLength={8}
                  placeholder="Ej. A-123456"
                  value={formulario.placa}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().slice(0, 8);
                    setFormulario((prev) => ({ ...prev, placa: val }));
                  }}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="vin">No. de Chasis / VIN</label>
                <input
                  id="vin"
                  type="text"
                  placeholder="17 dígitos"
                  value={formulario.vin}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, vin: e.target.value }))
                  }
                />
              </div>

              {/* Ficha Técnica */}
              <div className="form-field">
                <label htmlFor="categoria">Categoría</label>
                <select
                  id="categoria"
                  value={formulario.categoria}
                  onChange={(e) => setFormulario((prev) => ({ ...prev, categoria: e.target.value }))}
                >
                  <option value="SEDAN">Sedán / Ejecutivo</option>
                  <option value="SUV">SUV / Jeepeta</option>
                  <option value="COMPACTO">Compacto / Urbano</option>
                  <option value="CAMIONETA">Camioneta / 4x4</option>
                  <option value="VAN">Van / Pasajeros</option>
                  <option value="LUJO">Lujo / Premium</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="transmision">Transmisión</label>
                <select
                  id="transmision"
                  value={formulario.transmision}
                  onChange={(e) => setFormulario((prev) => ({ ...prev, transmision: e.target.value }))}
                >
                  <option value="AUTOMATICA">Automática</option>
                  <option value="MANUAL">Manual / Mecánica</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="combustible">Combustible</label>
                <select
                  id="combustible"
                  value={formulario.combustible}
                  onChange={(e) => setFormulario((prev) => ({ ...prev, combustible: e.target.value }))}
                >
                  <option value="GASOLINA">Gasolina</option>
                  <option value="DIESEL">Diésel</option>
                  <option value="HIBRIDO">Híbrido</option>
                  <option value="ELECTRICO">Eléctrico</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="pasajeros">Pasajeros</label>
                <input
                  id="pasajeros"
                  type="number"
                  min="1"
                  max="20"
                  value={formulario.pasajeros}
                  onChange={(e) => setFormulario((prev) => ({ ...prev, pasajeros: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label htmlFor="maletas">Capacidad Maletas</label>
                <input
                  id="maletas"
                  type="number"
                  min="0"
                  max="15"
                  value={formulario.maletas}
                  onChange={(e) => setFormulario((prev) => ({ ...prev, maletas: e.target.value }))}
                />
              </div>

              <div className="form-field">
                <label htmlFor="aireAcondicionado">Aire Acondicionado</label>
                <select
                  id="aireAcondicionado"
                  value={formulario.aireAcondicionado ? "true" : "false"}
                  onChange={(e) => setFormulario((prev) => ({ ...prev, aireAcondicionado: e.target.value === "true" }))}
                >
                  <option value="true">Sí (Con Climatizador A/C)</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="kilometraje">Odómetro Inicial (km) *</label>
                <input
                  id="kilometraje"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formulario.kilometraje}
                  onChange={(e) =>
                    setFormulario((prev) => ({
                      ...prev,
                      kilometraje: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              {/* TARIFA DIARIA CON SWITCH CONVERTIDOR USD <-> DOP */}
              <div className="form-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label htmlFor="tarifaDiaria" style={{ margin: 0 }}>
                    Tarifa Diaria * ({formulario.monedaTarifa === "USD" ? "Dólares US$" : "Pesos RD$"})
                  </label>
                  {/* Botones Switch USD/DOP */}
                  <div style={{ display: "flex", backgroundColor: "var(--background)", borderRadius: "6px", padding: "2px", border: "1px solid var(--border)" }}>
                    <button
                      type="button"
                      style={{
                        border: "none",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                        backgroundColor: formulario.monedaTarifa === "USD" ? "var(--primary)" : "transparent",
                        color: formulario.monedaTarifa === "USD" ? "#ffffff" : "var(--text)",
                        cursor: "pointer",
                      }}
                      onClick={() => alternarMonedaFormulario("USD")}
                    >
                      💵 US$
                    </button>
                    <button
                      type="button"
                      style={{
                        border: "none",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 700,
                        backgroundColor: formulario.monedaTarifa === "DOP" ? "var(--primary)" : "transparent",
                        color: formulario.monedaTarifa === "DOP" ? "#ffffff" : "var(--text)",
                        cursor: "pointer",
                      }}
                      onClick={() => alternarMonedaFormulario("DOP")}
                    >
                      🇩🇴 RD$
                    </button>
                  </div>
                </div>

                <input
                  id="tarifaDiaria"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder={formulario.monedaTarifa === "USD" ? "45.00" : "2700.00"}
                  value={formulario.tarifaDiaria}
                  onChange={(e) =>
                    setFormulario((prev) => ({
                      ...prev,
                      tarifaDiaria: e.target.value,
                    }))
                  }
                  required
                />

                {/* Equivalencia en tiempo real según tasa */}
                {parseFloat(formulario.tarifaDiaria) > 0 && (
                  <div style={{ fontSize: "11px", color: "var(--primary)", marginTop: "4px", fontWeight: 600 }}>
                    {formulario.monedaTarifa === "USD" ? (
                      <span>
                        ≈ RD$ {(parseFloat(formulario.tarifaDiaria) * tasaCambio).toLocaleString("es-DO", { minimumFractionDigits: 2 })} DOP (Tasa: {tasaCambio})
                      </span>
                    ) : (
                      <span>
                        ≈ $ {(parseFloat(formulario.tarifaDiaria) / tasaCambio).toFixed(2)} USD (Tasa: {tasaCambio})
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="estado">Estado Operativo *</label>
                <select
                  id="estado"
                  value={formulario.estado}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, estado: e.target.value }))
                  }
                  required
                >
                  <option value="DISPONIBLE">Disponible (Listo para rentar)</option>
                  <option value="ALQUILADO">Alquilado</option>
                  <option value="MANTENIMIENTO">En Mantenimiento / Taller</option>
                  <option value="INACTIVO">Inactivo / Fuera de servicio</option>
                </select>
              </div>

              {/* Documentos Legales */}
              <div className="form-field">
                <label htmlFor="seguroPoliza">Póliza de Seguro</label>
                <input
                  id="seguroPoliza"
                  type="text"
                  placeholder="Ej. Seguros Universal #UN-889922"
                  value={formulario.seguroPoliza}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, seguroPoliza: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="seguroVencimiento">Vencimiento del Seguro (DD/MM/AAAA)</label>
                <FechaInput
                  id="seguroVencimiento"
                  value={formulario.seguroVencimiento}
                  onChange={(iso) =>
                    setFormulario((prev) => ({ ...prev, seguroVencimiento: iso }))
                  }
                  placeholder="DD/MM/AAAA"
                />
              </div>

              <div className="form-field">
                <label htmlFor="marbeteVencimiento">Vencimiento de Marbete (DD/MM/AAAA)</label>
                <FechaInput
                  id="marbeteVencimiento"
                  value={formulario.marbeteVencimiento}
                  onChange={(iso) =>
                    setFormulario((prev) => ({ ...prev, marbeteVencimiento: iso }))
                  }
                  placeholder="DD/MM/AAAA"
                />
              </div>

              <div className="form-actions" style={{ gridColumn: "span 3" }}>
                <button type="submit" className="primary-button" disabled={guardando}>
                  {guardando
                    ? "Guardando..."
                    : editandoId === null
                    ? "Registrar Vehículo"
                    : "Guardar Cambios"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={limpiarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por marca, modelo, placa, chasis o color..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-estado" style={{ fontSize: "12px", fontWeight: 600 }}>
            Estado:
          </label>
          <select
            id="filtro-estado"
            className="filter-select"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="DISPONIBLE">Disponibles</option>
            <option value="ALQUILADO">Alquilados</option>
            <option value="MANTENIMIENTO">En Mantenimiento</option>
            <option value="INACTIVO">Inactivos</option>
          </select>

          {(busqueda || filtroEstado !== "TODOS") && (
            <button
              className="secondary-button"
              style={{ padding: "8px 12px", fontSize: "12px" }}
              onClick={() => {
                setBusqueda("");
                setFiltroEstado("TODOS");
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Vehículos con Miniaturas y Ficha Clicable */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>
            Inventario de Flota{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "13px" }}>
              ({vehiculosFiltrados.length} de {vehiculos.length} vehículos)
            </span>
          </h2>
        </div>

        {cargando ? (
          <div className="empty-state" style={{ padding: "50px 20px", textAlign: "center" }}>
            <div className="empty-state-icon" style={{ fontSize: "36px", marginBottom: "10px" }}>⏳</div>
            <strong style={{ fontSize: "16px", color: "var(--text)" }}>Cargando vehículos...</strong>
          </div>
        ) : vehiculosFiltrados.length === 0 ? (
          /* MENSAJE DE BÚSQUEDA SIN RESULTADOS CON FORMATO Y ESPACIADO IMPECABLE */
          <div className="empty-state" style={{ padding: "50px 20px", textAlign: "center" }}>
            <div className="empty-state-icon" style={{ fontSize: "40px", marginBottom: "12px" }}>🚗</div>
            <strong style={{ display: "block", fontSize: "17px", fontWeight: 800, marginBottom: "8px", color: "var(--text)" }}>
              No se encontraron vehículos
            </strong>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "14px", maxWidth: "500px", marginInline: "auto" }}>
              {vehiculos.length === 0
                ? "Aún no tienes vehículos registrados. Haz clic en '+ Nuevo Vehículo' para agregar el primero a tu flota."
                : "No hay vehículos que coincidan con los términos de búsqueda o filtros seleccionados."}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehículo & Foto</th>
                  <th>Placa / Chasis</th>
                  <th>Ficha Técnica</th>
                  <th>Odómetro</th>
                  <th>Tarifa Diaria ({monedaVisualizacion === "USD" ? "US$" : "RD$"})</th>
                  <th>Seguro / Póliza</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehiculosFiltrados.map((vehiculo) => {
                  const rep = reporteVencimientos.find((r) => r.id === vehiculo.id);
                  const foto = obtenerFotoDefault(vehiculo);

                  return (
                    <tr
                      key={vehiculo.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setVehiculoVerDetalle(vehiculo)}
                    >
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <img
                            src={foto}
                            alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                            style={{ width: "54px", height: "38px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border)" }}
                          />
                          <div>
                            <strong style={{ display: "block" }}>
                              {vehiculo.marca} {vehiculo.modelo}
                            </strong>
                            <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                              Año {vehiculo.anio} • {vehiculo.color ?? "Sin color"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <code style={{ fontWeight: 700 }}>{vehiculo.placa}</code>
                        </div>
                        <small style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                          {vehiculo.vin ? `VIN: ${vehiculo.vin}` : "Sin VIN"}
                        </small>
                      </td>
                      <td>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          👥 {vehiculo.pasajeros || 5} • ⚙️ {vehiculo.transmision || "Auto"}
                        </div>
                        <small style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
                          {vehiculo.categoria || "SEDAN"} • {vehiculo.combustible || "Gasolina"}
                        </small>
                      </td>
                      <td>
                        <strong>{vehiculo.kilometraje.toLocaleString()} km</strong>
                      </td>
                      <td>
                        <strong style={{ fontSize: "14px", color: "var(--primary)" }}>
                          {formatearPrecio(vehiculo.tarifaDiaria)}
                        </strong>
                        <small style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px" }}>
                          / día
                        </small>
                      </td>
                      <td>
                        {rep ? (
                          <div>
                            <span
                              className={`badge ${
                                rep.estadoSeguro === "AL_DIA"
                                  ? "badge-disponible"
                                  : rep.estadoSeguro === "POR_VENCER"
                                  ? "badge-mantenimiento"
                                  : "badge-inactivo"
                              }`}
                            >
                              {rep.estadoSeguro === "AL_DIA"
                                ? "🟢 Al día"
                                : rep.estadoSeguro === "POR_VENCER"
                                ? `🟡 Vence en ${rep.diasRestantesSeguro}d`
                                : "🔴 Seguro Vencido"}
                            </span>
                            <div style={{ fontSize: "10px", color: "var(--text-secondary)", marginTop: "2px" }}>
                              {rep.seguroPoliza}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--text-light)" }}>-</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            vehiculo.estado === "DISPONIBLE"
                              ? "badge-disponible"
                              : vehiculo.estado === "ALQUILADO"
                              ? "badge-alquilado"
                              : vehiculo.estado === "MANTENIMIENTO"
                              ? "badge-mantenimiento"
                              : "badge-inactivo"
                          }`}
                        >
                          {vehiculo.estado}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="btn-action-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              editarVehiculo(vehiculo);
                            }}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarVehiculo(vehiculo.id);
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Ficha Técnica & Foto en Gran Formato (Al dar clic en cualquier auto) */}
      {vehiculoVerDetalle && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setVehiculoVerDetalle(null)}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "20px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: "relative", height: "240px", backgroundColor: "#0f172a" }}>
              <img
                src={obtenerFotoDefault(vehiculoVerDetalle)}
                alt={`${vehiculoVerDetalle.marca} ${vehiculoVerDetalle.modelo}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                type="button"
                onClick={() => setVehiculoVerDetalle(null)}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  backgroundColor: "rgba(15, 23, 42, 0.75)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "34px",
                  height: "34px",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                ✕
              </button>
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "14px",
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  color: "white",
                }}
              >
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>
                  {vehiculoVerDetalle.marca} {vehiculoVerDetalle.modelo} ({vehiculoVerDetalle.anio})
                </h3>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                  Placa: {vehiculoVerDetalle.placa} • Color: {vehiculoVerDetalle.color || "Blanco"}
                </span>
              </div>
            </div>

            <div style={{ padding: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" }}>
                <div style={{ backgroundColor: "var(--primary-soft)", padding: "8px", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "18px", display: "block" }}>👥</span>
                  <strong style={{ fontSize: "11px" }}>{vehiculoVerDetalle.pasajeros || 5} Pasajeros</strong>
                </div>
                <div style={{ backgroundColor: "var(--primary-soft)", padding: "8px", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "18px", display: "block" }}>🧳</span>
                  <strong style={{ fontSize: "11px" }}>{vehiculoVerDetalle.maletas || 2} Maletas</strong>
                </div>
                <div style={{ backgroundColor: "var(--primary-soft)", padding: "8px", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "18px", display: "block" }}>⚙️</span>
                  <strong style={{ fontSize: "11px" }}>{vehiculoVerDetalle.transmision || "Automática"}</strong>
                </div>
                <div style={{ backgroundColor: "var(--primary-soft)", padding: "8px", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "18px", display: "block" }}>⛽</span>
                  <strong style={{ fontSize: "11px" }}>{vehiculoVerDetalle.combustible || "Gasolina"}</strong>
                </div>
                <div style={{ backgroundColor: "var(--primary-soft)", padding: "8px", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "18px", display: "block" }}>❄️</span>
                  <strong style={{ fontSize: "11px" }}>A/C Climatizador</strong>
                </div>
                <div style={{ backgroundColor: "var(--primary-soft)", padding: "8px", borderRadius: "8px", textAlign: "center" }}>
                  <span style={{ fontSize: "18px", display: "block" }}>💰</span>
                  <strong style={{ fontSize: "11px" }}>{formatearPrecio(vehiculoVerDetalle.tarifaDiaria)}/día</strong>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setVehiculoVerDetalle(null)}
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    const sel = vehiculoVerDetalle;
                    setVehiculoVerDetalle(null);
                    editarVehiculo(sel);
                  }}
                >
                  ✏️ Modificar Ficha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Monitor de Vencimientos Legales */}
      {mostrarMonitorVencimientos && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
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
              borderRadius: "14px",
              maxWidth: "850px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "24px" }}>🛡️</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px" }}>
                    Auditoría de Seguros, Marbetes & Documentos Legales
                  </h2>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Control de pólizas y alertas preventivas a 30 días
                  </span>
                </div>
              </div>
              <button
                className="secondary-button"
                style={{ padding: "6px 10px" }}
                onClick={() => setMostrarMonitorVencimientos(false)}
              >
                ✕
              </button>
            </div>

            {/* Resumen de Estado */}
            {resumenVencimientos && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Total Auditados</div>
                  <strong style={{ fontSize: "18px" }}>{resumenVencimientos.total}</strong>
                </div>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px", borderRadius: "8px", textAlign: "center", color: "var(--success)" }}>
                  <div style={{ fontSize: "11px" }}>Al Día</div>
                  <strong style={{ fontSize: "18px" }}>{resumenVencimientos.alDia}</strong>
                </div>
                <div style={{ background: "#fefce8", border: "1px solid #fef08a", padding: "12px", borderRadius: "8px", textAlign: "center", color: "var(--warning)" }}>
                  <div style={{ fontSize: "11px" }}>Por Vencer (≤30d)</div>
                  <strong style={{ fontSize: "18px" }}>{resumenVencimientos.porVencer}</strong>
                </div>
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "12px", borderRadius: "8px", textAlign: "center", color: "var(--danger)" }}>
                  <div style={{ fontSize: "11px" }}>Vencidos</div>
                  <strong style={{ fontSize: "18px" }}>{resumenVencimientos.vencidos}</strong>
                </div>
              </div>
            )}

            {/* Botón de Disparo a Telegram */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", backgroundColor: "var(--primary-soft)", padding: "12px 16px", borderRadius: "8px" }}>
              <div style={{ fontSize: "13px" }}>
                📲 <b>Canal de Alertas Telegram:</b> Envía un informe detallado con pólizas por vencer.
              </div>
              <button
                type="button"
                className="primary-button"
                style={{ padding: "8px 14px", fontSize: "12px" }}
                onClick={enviarAlertaTelegram}
                disabled={notificandoTelegram}
              >
                {notificandoTelegram ? "Enviando..." : "📢 Notificar a Telegram"}
              </button>
            </div>

            {/* Lista de Vehículos y Fechas */}
            <div className="table-container">
              <table className="data-table" style={{ fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th>Vehículo / Placa</th>
                    <th>Póliza Registrada</th>
                    <th>Vencimiento Seguro</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteVencimientos.map((rep) => (
                    <tr key={rep.id}>
                      <td>
                        <strong>{rep.marca} {rep.modelo}</strong>
                        <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                          Placa: {rep.placa}
                        </div>
                      </td>
                      <td>{rep.seguroPoliza}</td>
                      <td>
                        {rep.seguroVencimiento
                          ? formatearFecha(rep.seguroVencimiento)
                          : "No registrada"}
                        {rep.diasRestantesSeguro !== null && (
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            {rep.diasRestantesSeguro < 0
                              ? `Expiró hace ${Math.abs(rep.diasRestantesSeguro)} días`
                              : `Quedan ${rep.diasRestantesSeguro} días`}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            rep.estadoSeguro === "AL_DIA"
                              ? "badge-disponible"
                              : rep.estadoSeguro === "POR_VENCER"
                              ? "badge-mantenimiento"
                              : "badge-inactivo"
                          }`}
                        >
                          {rep.estadoSeguro === "AL_DIA"
                            ? "🟢 Al Día"
                            : rep.estadoSeguro === "POR_VENCER"
                            ? "🟡 Por Vencer"
                            : "🔴 Vencido"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setMostrarMonitorVencimientos(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}