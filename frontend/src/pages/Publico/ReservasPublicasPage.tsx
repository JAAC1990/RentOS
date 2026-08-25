/**
 * ============================================================================
 * RentOS - Portal Público de Reservas para Clientes y Turistas (ReservasPublicasPage)
 * ============================================================================
 * Catálogo público interactivo en línea:
 * - Explorador visual de flota con fotos en alta resolución e insignias técnicas (Pasajeros, Maletas, Transmisión, Combustible, A/C).
 * - Modal Interactivo de Ficha Técnica y Galería de Fotos al hacer clic en cualquier vehículo.
 * - Cotizador instantáneo por rango de fechas de renta.
 * - Formulario de reserva directa con servicios opcionales (Seguro Full Cover, Silla para bebé, Conductor extra).
 * - Confirmación inmediata con despacho a WhatsApp del Rent a Car.
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import PhoneInput from "../../components/PhoneInput";
import { API_URLS } from "../../services/api";
import { formatearFecha } from "../../utils/dateUtils";

type Vehiculo = {
  id: number;
  rentCarId: number;
  marca: string;
  modelo: string;
  anio: number;
  color: string | null;
  placa: string;
  kilometraje: number;
  tarifaDiaria: string | number;
  fotoUrl?: string | null;
  imagenes?: string[] | null;
  categoria?: string | null;
  transmision?: string | null;
  combustible?: string | null;
  pasajeros?: number | null;
  maletas?: number | null;
  puertas?: number | null;
  aireAcondicionado?: boolean | null;
  estado: string;
};

type RentCarInfo = {
  id: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
  ciudad: string;
  direccion: string | null;
  logoUrl?: string | null;
  eslogan?: string | null;
  colorPrimario?: string | null;
  whatsapp?: string | null;
  moneda: string;
  terminosContrato: string | null;
};

const hoy = new Date().toISOString().split("T")[0];
const enTresDias = new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0];

/**
 * Retorna una imagen de vehículo representativa y atractiva según marca y modelo
 * en caso de que el Rent a Car aún no haya subido una foto personalizada.
 */
function obtenerFotoVehiculo(v: Vehiculo): string {
  if (v.fotoUrl && v.fotoUrl.trim() !== "") {
    return v.fotoUrl;
  }

  const mm = `${v.marca} ${v.modelo}`.toLowerCase();

  if (mm.includes("corolla")) {
    return "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80";
  } else if (mm.includes("sportage") || mm.includes("tucson") || mm.includes("suv") || mm.includes("seltos")) {
    return "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80";
  } else if (mm.includes("explorer") || mm.includes("jeep") || mm.includes("wrangler") || mm.includes("4x4")) {
    return "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80";
  } else if (mm.includes("accord") || mm.includes("civic") || mm.includes("rio") || mm.includes("sedan")) {
    return "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80";
  }

  return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80";
}

export default function ReservasPublicasPage() {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tenantId = searchParams.get("rentcar") || searchParams.get("id") || "1";

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [rentCarInfo, setRentCarInfo] = useState<RentCarInfo | null>(null);
  const [cargando, setCargando] = useState(true);

  // Filtros de fecha y cotización
  const [fechaInicio, setFechaInicio] = useState(hoy);
  const [fechaFin, setFechaFin] = useState(enTresDias);
  const [filtroMarca, setFiltroMarca] = useState("TODAS");
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");
  const [busqueda, setBusqueda] = useState("");

  // Modal de Detalle & Fotos del Vehículo (Al hacer clic en el auto)
  const [vehiculoDetalle, setVehiculoDetalle] = useState<Vehiculo | null>(null);

  // Modal de Formulario de Reserva
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null);

  // Extras seleccionados
  const [incluirSeguro, setIncluirSeguro] = useState(true); // $20/día
  const [incluirSillaBebe, setIncluirSillaBebe] = useState(false); // $10/día
  const [incluirConductorExtra, setIncluirConductorExtra] = useState(false); // $15/día

  // Datos del Cliente
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  // Estado del proceso
  const [enviando, setEnviando] = useState(false);
  const [reservaConfirmada, setReservaConfirmada] = useState<{
    contratoId: number;
    cliente: string;
    vehiculo: string;
    total: string;
    dias: number;
  } | null>(null);
  const [error, setError] = useState("");

  const colorMarca = rentCarInfo?.colorPrimario || "var(--primary)";

  const cargarCatalogo = async () => {
    try {
      setCargando(true);
      setError("");

      const [resVehiculos, resRentCar] = await Promise.all([
        fetch(API_URLS.vehiculos),
        fetch(`${API_URLS.rentcars}/${tenantId}`),
      ]);

      if (resRentCar.ok) {
        const datosRentCar: RentCarInfo = await resRentCar.json();
        setRentCarInfo(datosRentCar);
      }

      if (resVehiculos.ok) {
        const datosVehiculos: Vehiculo[] = await resVehiculos.json();
        // Filtrar vehículos disponibles de este Rent Car
        const disponibles = datosVehiculos.filter(
          (v) => v.rentCarId === Number(tenantId) && (v.estado === "DISPONIBLE" || v.estado === "RESERVADO")
        );
        setVehiculos(disponibles.length > 0 ? disponibles : datosVehiculos.filter((v) => v.estado === "DISPONIBLE"));
      }
    } catch (err) {
      console.error(err);
      setError("No fue posible cargar el catálogo de vehículos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCatalogo();
  }, [tenantId]);

  // Cálculo de días
  const dias = useMemo(() => {
    if (!fechaInicio || !fechaFin) return 1;
    const inicio = new Date(fechaInicio).getTime();
    const fin = new Date(fechaFin).getTime();
    if (fin <= inicio) return 1;
    const diff = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [fechaInicio, fechaFin]);

  // Marcas disponibles
  const marcas = useMemo(() => {
    return Array.from(new Set(vehiculos.map((v) => v.marca)));
  }, [vehiculos]);

  // Flota filtrada
  const vehiculosFiltrados = useMemo(() => {
    return vehiculos.filter((v) => {
      const cumpleMarca = filtroMarca === "TODAS" || v.marca === filtroMarca;
      const cumpleCat = filtroCategoria === "TODAS" || (v.categoria || "SEDAN") === filtroCategoria;
      const texto = `${v.marca} ${v.modelo} ${v.anio} ${v.color || ""}`.toLowerCase();
      const cumpleBusqueda = texto.includes(busqueda.toLowerCase());
      return cumpleMarca && cumpleCat && cumpleBusqueda;
    });
  }, [vehiculos, filtroMarca, filtroCategoria, busqueda]);

  // Cálculo de precios con extras
  const calcularTotal = (tarifaDiaria: number) => {
    let base = tarifaDiaria * dias;
    if (incluirSeguro) base += 20 * dias;
    if (incluirSillaBebe) base += 10 * dias;
    if (incluirConductorExtra) base += 15 * dias;
    return base.toFixed(2);
  };

  const handleConfirmarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiculoSeleccionado) return;

    if (!nombre.trim() || !apellido.trim() || !telefono.trim()) {
      setError("Por favor completa tu nombre, apellido y teléfono para confirmar la reserva.");
      return;
    }

    try {
      setEnviando(true);
      setError("");

      // 1. Crear o buscar cliente por teléfono
      const resClientes = await fetch(API_URLS.clientes);
      const listaClientes = await resClientes.json();
      const clienteExistente = Array.isArray(listaClientes)
        ? listaClientes.find((c: { telefono: string }) => c.telefono.replace(/[^0-9]/g, "") === telefono.replace(/[^0-9]/g, ""))
        : null;

      let clienteId = clienteExistente?.id;

      if (!clienteId) {
        const resNuevoCliente = await fetch(API_URLS.clientes, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            telefono: telefono.trim(),
            email: email.trim() || null,
            rentCarId: Number(tenantId),
            estado: "ACTIVO",
          }),
        });

        if (!resNuevoCliente.ok) {
          throw new Error("No fue posible registrar tus datos de cliente.");
        }

        const nuevoCliente = await resNuevoCliente.json();
        clienteId = nuevoCliente.id;
      }

      // 2. Crear contrato en estado BORRADOR / RESERVADO
      const totalEstimado = calcularTotal(Number(vehiculoSeleccionado.tarifaDiaria));
      const extrasDesc = [
        incluirSeguro ? "Seguro Full Cover (+$20/d)" : "",
        incluirSillaBebe ? "Silla de Bebé (+$10/d)" : "",
        incluirConductorExtra ? "Conductor Extra (+$15/d)" : "",
      ].filter(Boolean).join(", ");

      const resContrato = await fetch(API_URLS.contratos, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentCarId: Number(tenantId),
          clienteId,
          vehiculoId: vehiculoSeleccionado.id,
          fechaInicio: new Date(fechaInicio).toISOString(),
          fechaFin: new Date(fechaFin).toISOString(),
          tarifaDiaria: Number(vehiculoSeleccionado.tarifaDiaria),
          deposito: 200,
          kilometrajeInicial: vehiculoSeleccionado.kilometraje,
          tipoSeguro: incluirSeguro ? "FULL_COVER" : "FULL",
          estado: "BORRADOR",
          observaciones: `Reserva web pública por ${dias} día(s). Extras: ${extrasDesc || "Ninguno"}. Total estimado: $${totalEstimado} USD.`,
        }),
      });

      if (!resContrato.ok) {
        const errData = await resContrato.json().catch(() => null);
        throw new Error(errData?.error || "No fue posible procesar la reserva.");
      }

      const nuevoContrato = await resContrato.json();

      setReservaConfirmada({
        contratoId: nuevoContrato.id,
        cliente: `${nombre} ${apellido}`,
        vehiculo: `${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo} (${vehiculoSeleccionado.anio})`,
        total: totalEstimado,
        dias,
      });

      setVehiculoSeleccionado(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al procesar la reserva.");
    } finally {
      setEnviando(false);
    }
  };

  const getUrlWhatsApp = (reserva: { contratoId: number; cliente: string; vehiculo: string; total: string; dias: number }) => {
    const telefonoRentCar = rentCarInfo?.whatsapp || rentCarInfo?.telefono ? (rentCarInfo.whatsapp || rentCarInfo.telefono || "").replace(/[^0-9]/g, "") : "18095550199";
    const texto = `Hola *${rentCarInfo?.nombre || "RentOS"}*, mi nombre es *${reserva.cliente}*. Acabo de solicitar la Reserva *#${reserva.contratoId}* en su catálogo web:\n\n🚗 *Vehículo:* ${reserva.vehiculo}\n📅 *Duración:* ${reserva.dias} días (${formatearFecha(fechaInicio)} al ${formatearFecha(fechaFin)})\n💰 *Total Estimado:* $${reserva.total} ${rentCarInfo?.moneda || "USD"}\n\n¿Me confirman disponibilidad para completar la entrega? ¡Muchas gracias!`;
    return `https://wa.me/${telefonoRentCar}?text=${encodeURIComponent(texto)}`;
  };

  const getUrlWhatsAppConsulta = (v: Vehiculo) => {
    const telefonoRentCar = rentCarInfo?.whatsapp || rentCarInfo?.telefono ? (rentCarInfo.whatsapp || rentCarInfo.telefono || "").replace(/[^0-9]/g, "") : "18095550199";
    const totalEst = (Number(v.tarifaDiaria) * dias).toFixed(2);
    const texto = `Hola *${rentCarInfo?.nombre || "RentOS"}*, me interesa alquilar el *${v.marca} ${v.modelo} (${v.anio})* por *${dias} día(s)* (del ${formatearFecha(fechaInicio)} al ${formatearFecha(fechaFin)}).\n\nTarifa estimada: *$${totalEst} ${rentCarInfo?.moneda || "USD"}*.\n¿Tienen disponibilidad en esas fechas?`;
    return `https://wa.me/${telefonoRentCar}?text=${encodeURIComponent(texto)}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        color: "var(--text)",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Barra de Navegación Pública */}
      <nav
        style={{
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {rentCarInfo?.logoUrl ? (
            <img
              src={rentCarInfo.logoUrl}
              alt="Logo"
              style={{ maxHeight: "45px", maxWidth: "130px", objectFit: "contain" }}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div
              style={{
                width: "42px",
                height: "42px",
                background: colorMarca,
                color: "white",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900",
                fontSize: "20px",
              }}
            >
              {rentCarInfo ? rentCarInfo.nombre.charAt(0).toUpperCase() : "R"}
            </div>
          )}
          <div>
            <strong style={{ fontSize: "17px", display: "block" }}>
              {rentCarInfo?.nombre || "RentOS Principal"}
            </strong>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              {rentCarInfo?.eslogan || `Catálogo Oficial de Alquiler • ${rentCarInfo?.ciudad || "Santo Domingo"}`}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            📞 Asistencia: <b>{rentCarInfo?.telefono || "(809) 555-0199"}</b>
          </span>
          <a
            href={`https://wa.me/${(rentCarInfo?.whatsapp || rentCarInfo?.telefono || "18095550199").replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            style={{
              backgroundColor: "#22c55e",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)",
            }}
          >
            💬 WhatsApp
          </a>
        </div>
      </nav>

      {/* Hero Banner y Selector de Fechas */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colorMarca} 0%, #0f172a 100%)`,
          color: "#ffffff",
          padding: "40px 24px 48px 24px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "30px", margin: "0 0 8px 0", fontWeight: 800 }}>
          {rentCarInfo ? rentCarInfo.nombre : "Encuentra tu Vehículo Ideal"}
        </h1>
        <p style={{ fontSize: "15px", color: "#e2e8f0", maxWidth: "600px", margin: "0 auto 24px auto" }}>
          {rentCarInfo?.eslogan || `Flota moderna en ${rentCarInfo?.ciudad || "República Dominicana"}, tarifas transparentes, seguro incluido y confirmación instantánea.`}
        </p>

        {/* Buscador de Fechas */}
        <div
          style={{
            maxWidth: "860px",
            margin: "0 auto",
            backgroundColor: "var(--surface)",
            padding: "18px 24px",
            borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1.2fr",
            gap: "12px",
            textAlign: "left",
            color: "var(--text)",
          }}
        >
          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              📅 RETIRO
            </label>
            <input
              type="date"
              value={fechaInicio}
              min={hoy}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              🏁 DEVOLUCIÓN
            </label>
            <input
              type="date"
              value={fechaFin}
              min={fechaInicio}
              onChange={(e) => setFechaFin(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              🚗 MARCA
            </label>
            <select
              value={filtroMarca}
              onChange={(e) => setFiltroMarca(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                boxSizing: "border-box",
              }}
            >
              <option value="TODAS">Todas las marcas</option>
              {marcas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
              🚙 TIPO / CATEGORÍA
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                boxSizing: "border-box",
              }}
            >
              <option value="TODAS">Todas las categorías</option>
              <option value="SEDAN">Sedán / Ejecutivo</option>
              <option value="SUV">SUV / Jeepeta</option>
              <option value="COMPACTO">Compacto / Urbano</option>
              <option value="CAMIONETA">Camioneta / 4x4</option>
              <option value="VAN">Van / Pasajeros</option>
              <option value="LUJO">Lujo / Premium</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contenedor de Flota */}
      <div style={{ maxWidth: "1160px", margin: "36px auto", padding: "0 20px" }}>
        {error && <div className="alert-box error" style={{ marginBottom: "20px" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "22px", margin: 0, fontWeight: 800 }}>
              Vehículos Disponibles ({dias} {dias === 1 ? "día" : "días"} de renta)
            </h2>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              👉 <b>Haz clic en cualquier vehículo</b> para ver su galería de fotos y ficha técnica detallada.
            </span>
          </div>
          <div style={{ width: "260px" }}>
            <input
              type="text"
              placeholder="Buscar por modelo o color..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {cargando ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <div style={{ fontSize: "36px" }}>⏳</div>
            <strong>Cargando unidades disponibles...</strong>
          </div>
        ) : vehiculosFiltrados.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", background: "var(--surface)", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>🚗</div>
            <strong>No hay vehículos disponibles con estos filtros</strong>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
              Intenta cambiar la fecha o seleccionar otra categoría.
            </p>
          </div>
        ) : (
          /* Malla de Tarjetas de Vehículos con Imágenes Clicables */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "24px",
            }}
          >
            {vehiculosFiltrados.map((v) => {
              const totalEst = (Number(v.tarifaDiaria) * dias).toFixed(2);
              const foto = obtenerFotoVehiculo(v);

              return (
                <div
                  key={v.id}
                  style={{
                    backgroundColor: "var(--surface)",
                    borderRadius: "16px",
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    cursor: "pointer",
                  }}
                  onClick={() => setVehiculoDetalle(v)}
                >
                  {/* Imagen del Vehículo (Clicable) */}
                  <div style={{ position: "relative", height: "190px", backgroundColor: "#f1f5f9", overflow: "hidden" }}>
                    <img
                      src={foto}
                      alt={`${v.marca} ${v.modelo}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transition: "transform 0.3s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        backgroundColor: "rgba(15, 23, 42, 0.75)",
                        backdropFilter: "blur(4px)",
                        color: "white",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {v.categoria || "SEDAN"}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        backgroundColor: "#10b981",
                        color: "#0f172a",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 800,
                      }}
                    >
                      ✓ Disponible
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        right: "8px",
                        backgroundColor: "rgba(0,0,0,0.65)",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                      }}
                    >
                      👁️ Clic para ver fotos
                    </div>
                  </div>

                  {/* Datos del Auto */}
                  <div style={{ padding: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div>
                        <h3 style={{ margin: "0 0 2px 0", fontSize: "18px", fontWeight: 800 }}>
                          {v.marca} {v.modelo}
                        </h3>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          Año {v.anio} • Color {v.color || "Blanco"}
                        </span>
                      </div>
                    </div>

                    {/* Insignias de Especificaciones Rápidas */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        margin: "10px 0 14px 0",
                        fontSize: "11px",
                      }}
                    >
                      <span style={{ backgroundColor: "var(--primary-soft)", color: "var(--primary)", padding: "3px 8px", borderRadius: "6px", fontWeight: 600 }}>
                        👥 {v.pasajeros || 5} Asientos
                      </span>
                      <span style={{ backgroundColor: "var(--primary-soft)", color: "var(--primary)", padding: "3px 8px", borderRadius: "6px", fontWeight: 600 }}>
                        🧳 {v.maletas || 2} Maletas
                      </span>
                      <span style={{ backgroundColor: "var(--primary-soft)", color: "var(--primary)", padding: "3px 8px", borderRadius: "6px", fontWeight: 600 }}>
                        ⚙️ {v.transmision || "Automática"}
                      </span>
                      <span style={{ backgroundColor: "var(--primary-soft)", color: "var(--primary)", padding: "3px 8px", borderRadius: "6px", fontWeight: 600 }}>
                        ❄️ A/C
                      </span>
                    </div>

                    {/* Tarifa y Total Estimado */}
                    <div
                      style={{
                        padding: "10px 14px",
                        background: "var(--primary-soft)",
                        borderRadius: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "14px",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>Tarifa diaria:</span>
                        <strong style={{ fontSize: "16px", color: "var(--primary)" }}>
                          ${Number(v.tarifaDiaria).toFixed(2)}/día
                        </strong>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>Total ({dias}d):</span>
                        <strong style={{ fontSize: "18px", color: "var(--primary)" }}>
                          ${totalEst} {rentCarInfo?.moneda || "USD"}
                        </strong>
                      </div>
                    </div>

                    {/* Botonera de Acción */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <button
                        type="button"
                        className="secondary-button"
                        style={{ padding: "9px 6px", fontSize: "12px", fontWeight: 700 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setVehiculoDetalle(v);
                        }}
                      >
                        👁️ Ver Ficha & Fotos
                      </button>

                      <button
                        type="button"
                        className="primary-button"
                        style={{ padding: "9px 6px", fontSize: "12px", fontWeight: 700 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setVehiculoSeleccionado(v);
                        }}
                      >
                        ⚡ Reservar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* MODAL 1: FICHA TÉCNICA DETALLADA & GALERÍA DE FOTOS (AL DAR CLIC) */}
      {/* ================================================================= */}
      {vehiculoDetalle && (
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
          onClick={() => setVehiculoDetalle(null)}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "20px",
              maxWidth: "680px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Imagen Principal en Gran Formato */}
            <div style={{ position: "relative", height: "260px", backgroundColor: "#0f172a" }}>
              <img
                src={obtenerFotoVehiculo(vehiculoDetalle)}
                alt={`${vehiculoDetalle.marca} ${vehiculoDetalle.modelo}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                type="button"
                onClick={() => setVehiculoDetalle(null)}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  backgroundColor: "rgba(15, 23, 42, 0.75)",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
              <div
                style={{
                  position: "absolute",
                  bottom: "14px",
                  left: "16px",
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  backdropFilter: "blur(4px)",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  color: "white",
                }}
              >
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>{vehiculoDetalle.categoria || "SEDAN"}</span>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>
                  {vehiculoDetalle.marca} {vehiculoDetalle.modelo} ({vehiculoDetalle.anio})
                </h2>
              </div>
            </div>

            {/* Contenido de la Ficha Técnica */}
            <div style={{ padding: "24px" }}>
              {/* Tarifa y Duración */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "var(--primary-soft)",
                  padding: "12px 18px",
                  borderRadius: "12px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Período ({dias} {dias === 1 ? "día" : "días"}):</span>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>
                    {formatearFecha(fechaInicio)} ➔ {formatearFecha(fechaFin)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Tarifa Total Estimada:</span>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--primary)" }}>
                    ${(Number(vehiculoDetalle.tarifaDiaria) * dias).toFixed(2)} {rentCarInfo?.moneda || "USD"}
                  </div>
                </div>
              </div>

              {/* Malla de Especificaciones Físicas y Mecánicas */}
              <h3 style={{ fontSize: "15px", margin: "0 0 12px 0", fontWeight: 800 }}>
                📋 Especificaciones del Vehículo
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "20px", display: "block" }}>👥</span>
                  <strong style={{ fontSize: "12px", display: "block" }}>{vehiculoDetalle.pasajeros || 5} Pasajeros</strong>
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Capacidad</span>
                </div>

                <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "20px", display: "block" }}>🧳</span>
                  <strong style={{ fontSize: "12px", display: "block" }}>{vehiculoDetalle.maletas || 2} Maletas</strong>
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Maletero</span>
                </div>

                <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "20px", display: "block" }}>⚙️</span>
                  <strong style={{ fontSize: "12px", display: "block" }}>{vehiculoDetalle.transmision || "Automática"}</strong>
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Transmisión</span>
                </div>

                <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "20px", display: "block" }}>⛽</span>
                  <strong style={{ fontSize: "12px", display: "block" }}>{vehiculoDetalle.combustible || "Gasolina"}</strong>
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Combustible</span>
                </div>

                <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "20px", display: "block" }}>❄️</span>
                  <strong style={{ fontSize: "12px", display: "block" }}>A/C Climatizador</strong>
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Aire Acondicionado</span>
                </div>

                <div style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "20px", display: "block" }}>🚪</span>
                  <strong style={{ fontSize: "12px", display: "block" }}>{vehiculoDetalle.puertas || 4} Puertas</strong>
                  <span style={{ fontSize: "10px", color: "var(--text-secondary)" }}>Carrocería</span>
                </div>
              </div>

              {/* Beneficios Incluidos */}
              <h3 style={{ fontSize: "15px", margin: "0 0 10px 0", fontWeight: 800 }}>
                ✨ Comodidades & Seguridad Incluidas
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "24px" }}>
                <div>✓ Conectividad Bluetooth & Pantalla</div>
                <div>✓ Frenos ABS y Bolsas de Aire (Airbags)</div>
                <div>✓ Cámara de Reversa para Parqueo</div>
                <div>✓ Asistencia en Carretera 24/7 en RD</div>
                <div>✓ Limpieza y Desinfección Certificada</div>
                <div>✓ Cancelación Gratuita hasta 24h antes</div>
              </div>

              {/* Botonera de Acción del Modal de Detalle */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "18px" }}>
                <a
                  href={getUrlWhatsAppConsulta(vehiculoDetalle)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    backgroundColor: "#22c55e",
                    color: "white",
                    textDecoration: "none",
                    padding: "10px 18px",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  💬 Consultar por WhatsApp
                </a>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setVehiculoDetalle(null)}
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    style={{ padding: "10px 22px", fontSize: "14px", fontWeight: 800 }}
                    onClick={() => {
                      const sel = vehiculoDetalle;
                      setVehiculoDetalle(null);
                      setVehiculoSeleccionado(sel);
                    }}
                  >
                    ⚡ Reservar Este Auto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: FORMULARIO DE RESERVA DIRECTA */}
      {/* ================================================================= */}
      {vehiculoSeleccionado && (
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
              maxWidth: "560px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>
                Solicitud de Reserva • {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}
              </h2>
              <button
                className="secondary-button"
                style={{ padding: "4px 8px" }}
                onClick={() => setVehiculoSeleccionado(null)}
              >
                ✕
              </button>
            </div>

            {/* Resumen de Fechas */}
            <div
              style={{
                padding: "12px",
                background: "var(--primary-soft)",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "13px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>📅 Del <b>{formatearFecha(fechaInicio)}</b> al <b>{formatearFecha(fechaFin)}</b></span>
              <strong>{dias} {dias === 1 ? "día" : "días"}</strong>
            </div>

            {/* Extras y Coberturas */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                🛡️ Servicios Opcionales & Seguros
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={incluirSeguro}
                    onChange={(e) => setIncluirSeguro(e.target.checked)}
                  />
                  <span>Protección Total Cero Deducible (+$20/día)</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={incluirSillaBebe}
                    onChange={(e) => setIncluirSillaBebe(e.target.checked)}
                  />
                  <span>Silla de Seguridad para Bebé (+$10/día)</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={incluirConductorExtra}
                    onChange={(e) => setIncluirConductorExtra(e.target.checked)}
                  />
                  <span>Conductor Adicional Autorizado (+$15/día)</span>
                </label>
              </div>
            </div>

            {/* Formulario Datos del Cliente */}
            <form onSubmit={handleConfirmarReserva}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div className="form-field">
                  <label htmlFor="nombreReserva">Nombre *</label>
                  <input
                    id="nombreReserva"
                    type="text"
                    placeholder="Ej. Juan"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="apellidoReserva">Apellido *</label>
                  <input
                    id="apellidoReserva"
                    type="text"
                    placeholder="Ej. Pérez"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-field" style={{ marginBottom: "12px" }}>
                <label htmlFor="telefonoReserva">Teléfono / WhatsApp *</label>
                <PhoneInput
                  id="telefonoReserva"
                  value={telefono}
                  onChange={(val) => setTelefono(val)}
                  required
                />
              </div>

              <div className="form-field" style={{ marginBottom: "16px" }}>
                <label htmlFor="emailReserva">Correo Electrónico (Opcional)</label>
                <input
                  id="emailReserva"
                  type="email"
                  placeholder="juan.perez@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Total Final */}
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  paddingTop: "14px",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>Total a Pagar al Retirar:</span>
                  <small style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    Depósito reembolsable de $200 USD requerido
                  </small>
                </div>
                <strong style={{ fontSize: "24px", color: "var(--primary)" }}>
                  ${calcularTotal(Number(vehiculoSeleccionado.tarifaDiaria))} {rentCarInfo?.moneda || "USD"}
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setVehiculoSeleccionado(null)}
                  disabled={enviando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={enviando}
                  style={{ minWidth: "180px" }}
                >
                  {enviando ? "Confirmando..." : "✓ Confirmar Reserva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: CONFIRMACIÓN EXITOSA CON BOTÓN DE WHATSAPP */}
      {/* ================================================================= */}
      {reservaConfirmada && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.8)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "16px",
              maxWidth: "480px",
              width: "100%",
              padding: "32px 28px",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              color: "var(--text)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
            <h2 style={{ fontSize: "22px", margin: "0 0 8px 0", color: "var(--success)" }}>
              ¡Solicitud de Reserva Registrada!
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 20px 0" }}>
              Número de Folio: <b>#CT-{String(reservaConfirmada.contratoId).padStart(5, "0")}</b>
            </p>

            <div
              style={{
                backgroundColor: "var(--primary-soft)",
                padding: "16px",
                borderRadius: "10px",
                marginBottom: "24px",
                textAlign: "left",
                fontSize: "13px",
              }}
            >
              <div style={{ marginBottom: "6px" }}>👤 Cliente: <b>{reservaConfirmada.cliente}</b></div>
              <div style={{ marginBottom: "6px" }}>🚗 Vehículo: <b>{reservaConfirmada.vehiculo}</b></div>
              <div style={{ marginBottom: "6px" }}>📅 Duración: <b>{reservaConfirmada.dias} días</b></div>
              <div>💰 Total Estimado: <b>${reservaConfirmada.total} {rentCarInfo?.moneda || "USD"}</b></div>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
              Para asegurar tu vehículo de inmediato, pulsa el botón de abajo y envíanos un mensaje directo por WhatsApp:
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a
                href={getUrlWhatsApp(reservaConfirmada)}
                target="_blank"
                rel="noreferrer"
                className="primary-button"
                style={{
                  backgroundColor: "#22c55e",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                💬 Enviar Reserva por WhatsApp
              </a>

              <button
                type="button"
                className="secondary-button"
                onClick={() => setReservaConfirmada(null)}
              >
                Volver al Catálogo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
