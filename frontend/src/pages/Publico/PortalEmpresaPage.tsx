/**
 * ============================================================================
 * RentOS - Portal Web Público Independiente para Rent a Cars (PortalEmpresaPage)
 * ============================================================================
 * Página web exclusiva, interactiva y con marca blanca (White-Label) para cada empresa:
 * - Acceso por URL personalizada: /portal/:slug o /empresa/:slug
 * - Catálogo interactivo de flota con buscador inteligente y filtros por categoría.
 * - Cotizador en vivo con selector de fechas (DD/MM/AAAA) y extras opcionales.
 * - Conversión de divisas en tiempo real (USD ⇄ DOP) según la tasa oficial del BCRD.
 * - Reserva instantánea por WhatsApp directo o confirmación online en el sistema.
 */

import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { API_URLS } from "../../services/api";
import { useTasaCambio } from "../../context/TasaCambioContext";
import FechaInput from "../../components/FechaInput";
import PhoneInput, { validarTelefono } from "../../components/PhoneInput";

type Vehiculo = {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  placa: string;
  categoria?: string;
  tarifaDiaria: number;
  moneda: string;
  estado: string;
  imagenUrl?: string;
  transmision?: string;
  combustible?: string;
  capacidadPasajeros?: number;
  capacidadMaletas?: number;
  aireAcondicionado?: boolean;
};

type EmpresaPortal = {
  id: number;
  nombre: string;
  slug: string;
  rnc?: string;
  telefono?: string;
  whatsapp?: string;
  email?: string;
  direccion?: string;
  ciudad: string;
  logoUrl?: string;
  eslogan?: string;
  colorPrimario: string;
  moneda: string;
  limiteKilometrajeDiario: number;
  cargoKmExtra: number;
  depositoEstandar: number;
  vehiculos: Vehiculo[];
};

export default function PortalEmpresaPage() {
  const { slug } = useParams<{ slug: string }>();
  const { tasaCambio } = useTasaCambio();

  const [empresa, setEmpresa] = useState<EmpresaPortal | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Filtros interactivos de búsqueda
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("TODOS");
  const [transmisionSeleccionada, setTransmisionSeleccionada] = useState("TODOS");
  const [monedaVisual, setMonedaVisual] = useState<"USD" | "DOP">("USD");

  // Fechas de cotización
  const hoyStr = new Date().toISOString().split("T")[0];
  const dentroDeTresDias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [fechaInicio, setFechaInicio] = useState(hoyStr);
  const [fechaFin, setFechaFin] = useState(dentroDeTresDias);

  // Modal de Cotización y Reserva
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null);
  const [incluirSeguroFull, setIncluirSeguroFull] = useState(true);
  const [incluirSillaBebe, setIncluirSillaBebe] = useState(false);
  const [incluirConductorExtra, setIncluirConductorExtra] = useState(false);
  const [incluirGps, setIncluirGps] = useState(false);
  const [entregaAeropuerto, setEntregaAeropuerto] = useState(false);

  // Datos del cliente para reserva
  const [nombreCliente, setNombreCliente] = useState("");
  const [apellidoCliente, setApellidoCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [lugarEntrega, setLugarEntrega] = useState("Oficina Principal");
  const [comentarios, setComentarios] = useState("");

  const [procesandoReserva, setProcesandoReserva] = useState(false);
  const [reservaConfirmada, setReservaConfirmada] = useState<any | null>(null);
  const [errorModal, setErrorModal] = useState("");

  // Cargar información de la empresa por su slug o ID
  useEffect(() => {
    const cargarPortal = async () => {
      if (!slug) return;
      try {
        setCargando(true);
        setError("");
        const res = await fetch(`${API_URLS.rentcars}/portal/${slug}`);
        if (!res.ok) {
          throw new Error("No se encontró el portal de la empresa solicitada.");
        }
        const data: EmpresaPortal = await res.json();
        setEmpresa(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar portal.");
      } finally {
        setCargando(false);
      }
    };

    cargarPortal();
  }, [slug]);

  // Cálculo de días de renta
  const diasRenta = useMemo(() => {
    if (!fechaInicio || !fechaFin) return 1;
    const inicio = new Date(fechaInicio).getTime();
    const fin = new Date(fechaFin).getTime();
    const diff = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [fechaInicio, fechaFin]);

  // Lista de categorías disponibles en la flota
  const categoriasDisponibles = useMemo(() => {
    if (!empresa?.vehiculos) return ["TODOS"];
    const cats = new Set<string>();
    empresa.vehiculos.forEach((v) => {
      const cat = (v.categoria || "Sedán").trim();
      cats.add(cat);
    });
    return ["TODOS", ...Array.from(cats)];
  }, [empresa]);

  // Vehículos filtrados
  const vehiculosFiltrados = useMemo(() => {
    if (!empresa?.vehiculos) return [];
    return empresa.vehiculos.filter((v) => {
      const matchBusqueda =
        v.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.anio.toString().includes(busqueda);

      const matchCat =
        categoriaSeleccionada === "TODOS" ||
        (v.categoria || "Sedán").toLowerCase() === categoriaSeleccionada.toLowerCase();

      const matchTrans =
        transmisionSeleccionada === "TODOS" ||
        (v.transmision || "Automático").toLowerCase() === transmisionSeleccionada.toLowerCase();

      return matchBusqueda && matchCat && matchTrans;
    });
  }, [empresa, busqueda, categoriaSeleccionada, transmisionSeleccionada]);

  // Calcular precio total de cotización en USD y DOP
  const calcularTotalesCotizacion = (tarifaDiariaUSD: number) => {
    let costoBaseUSD = tarifaDiariaUSD * diasRenta;
    let extrasUSD = 0;

    if (incluirSeguroFull) extrasUSD += 20 * diasRenta;
    if (incluirSillaBebe) extrasUSD += 10 * diasRenta;
    if (incluirConductorExtra) extrasUSD += 15 * diasRenta;
    if (incluirGps) extrasUSD += 8 * diasRenta;
    if (entregaAeropuerto) extrasUSD += 30; // Cargo fijo

    const totalUSD = costoBaseUSD + extrasUSD;
    const totalDOP = totalUSD * (tasaCambio || 60.0);

    return {
      costoBaseUSD,
      extrasUSD,
      totalUSD,
      totalDOP,
    };
  };

  // Convertir tarifa unitaria
  const formatearMonto = (montoUSD: number) => {
    if (monedaVisual === "DOP") {
      const enDOP = montoUSD * (tasaCambio || 60.0);
      return `RD$ ${enDOP.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$ ${montoUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
  };

  // Generar y Abrir WhatsApp Directo
  const handleReservarWhatsApp = () => {
    if (!empresa || !vehiculoSeleccionado) return;

    if (!nombreCliente.trim() || !telefonoCliente.trim()) {
      setErrorModal("Por favor ingresa al menos tu nombre y teléfono de contacto.");
      return;
    }

    const { totalUSD, totalDOP } = calcularTotalesCotizacion(vehiculoSeleccionado.tarifaDiaria);
    const numeroWhatsApp = (empresa.whatsapp || empresa.telefono || "8095550000").replace(/[^0-9]/g, "");

    const extrasLista: string[] = [];
    if (incluirSeguroFull) extrasLista.push("🛡️ Seguro Full Cover");
    if (incluirSillaBebe) extrasLista.push("👶 Silla de Bebé");
    if (incluirConductorExtra) extrasLista.push("👤 Conductor Adicional");
    if (incluirGps) extrasLista.push("🗺️ GPS Asistido");
    if (entregaAeropuerto) extrasLista.push("✈️ Entrega en Aeropuerto");

    const textoMensaje = `🚗 *SOLICITUD DE RESERVA - ${empresa.nombre.toUpperCase()}*
---------------------------------------
👤 *Cliente:* ${nombreCliente.trim()} ${apellidoCliente.trim()}
📞 *Teléfono:* ${telefonoCliente.trim()}
${emailCliente ? `📧 *Email:* ${emailCliente.trim()}\n` : ""}📍 *Lugar de Retiro:* ${lugarEntrega}
🚘 *Vehículo:* ${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo} (${vehiculoSeleccionado.anio})
🔢 *Placa:* ${vehiculoSeleccionado.placa}
📅 *Fecha de Retiro:* ${fechaInicio}
📅 *Fecha de Devolución:* ${fechaFin} (${diasRenta} día${diasRenta > 1 ? "s" : ""})
${extrasLista.length > 0 ? `✨ *Extras Solicitados:*\n   • ${extrasLista.join("\n   • ")}\n` : ""}
💵 *Total Estimado:* $${totalUSD.toFixed(2)} USD
🇩🇴 *Equivalente en Pesos:* RD$ ${totalDOP.toLocaleString("es-DO", { minimumFractionDigits: 2 })} DOP
🏦 *Tasa Oficial BCRD:* RD$ ${tasaCambio.toFixed(2)}
---------------------------------------
${comentarios ? `📝 *Notas:* ${comentarios}\n---------------------------------------\n` : ""}¡Hola! He cotizado este vehículo en su portal oficial y deseo confirmar la disponibilidad.`;

    const urlWhatsApp = `https://wa.me/${numeroWhatsApp.startsWith("1") ? numeroWhatsApp : `1${numeroWhatsApp}`}?text=${encodeURIComponent(textoMensaje)}`;
    window.open(urlWhatsApp, "_blank");
  };

  // Confirmar reserva en el sistema
  const handleConfirmarReservaOnline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa || !vehiculoSeleccionado) return;

    if (!nombreCliente.trim() || !apellidoCliente.trim() || !telefonoCliente.trim()) {
      setErrorModal("Por favor completa tu nombre, apellido y teléfono.");
      return;
    }

    const valTel = validarTelefono(telefonoCliente);
    if (!valTel.valido) {
      setErrorModal(valTel.mensajeError || "El teléfono ingresado no es válido.");
      return;
    }

    try {
      setProcesandoReserva(true);
      setErrorModal("");

      // 1. Crear o buscar cliente
      const resClientes = await fetch(API_URLS.clientes);
      const listaClientes = await resClientes.json();
      const clienteExistente = Array.isArray(listaClientes)
        ? listaClientes.find((c: { telefono: string }) => c.telefono.replace(/[^0-9]/g, "") === telefonoCliente.replace(/[^0-9]/g, ""))
        : null;

      let clienteId = clienteExistente?.id;

      if (!clienteId) {
        const resNuevoCliente = await fetch(API_URLS.clientes, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nombreCliente.trim(),
            apellido: apellidoCliente.trim(),
            telefono: telefonoCliente.trim(),
            email: emailCliente.trim() || null,
            rentCarId: empresa.id,
            estado: "ACTIVO",
          }),
        });

        if (!resNuevoCliente.ok) {
          throw new Error("No fue posible registrar tus datos.");
        }
        const nuevoCliente = await resNuevoCliente.json();
        clienteId = nuevoCliente.id;
      }

      // 2. Crear contrato en estado BORRADOR
      const { totalUSD } = calcularTotalesCotizacion(vehiculoSeleccionado.tarifaDiaria);
      const resContrato = await fetch(API_URLS.contratos, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentCarId: empresa.id,
          clienteId,
          vehiculoId: vehiculoSeleccionado.id,
          fechaInicio,
          fechaFin,
          precioTotal: totalUSD,
          moneda: "USD",
          deposito: empresa.depositoEstandar || 200,
          monedaDeposito: "USD",
          observaciones: `Reserva Web Portal / Entrega: ${lugarEntrega}. ${comentarios}`,
        }),
      });

      if (!resContrato.ok) {
        const dataErr = await resContrato.json();
        throw new Error(dataErr.error || "No se pudo registrar la reserva.");
      }

      const contratoCreado = await resContrato.json();
      setReservaConfirmada(contratoCreado);
    } catch (err) {
      setErrorModal(err instanceof Error ? err.message : "Error al procesar reserva.");
    } finally {
      setProcesandoReserva(false);
    }
  };

  if (cargando) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px", animation: "spin 1.5s linear infinite" }}>🚗</div>
          <h3 style={{ color: "#334155", margin: 0 }}>Cargando portal de reservas...</h3>
        </div>
      </div>
    );
  }

  if (error || !empresa) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "20px", fontFamily: "Inter, sans-serif" }}>
        <div style={{ maxWidth: "500px", width: "100%", background: "white", borderRadius: "16px", padding: "36px", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
          <h2 style={{ color: "#1e293b", margin: "0 0 8px 0" }}>Portal No Encontrado</h2>
          <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", margin: "0 0 24px 0" }}>
            {error || "El enlace ingresado no corresponde a ninguna empresa de renta de vehículos activa en RentOS."}
          </p>
          <Link to="/login" style={{ display: "inline-block", background: "#0284c7", color: "white", padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: 700, fontSize: "14px" }}>
            Ir a RentOS Principal
          </Link>
        </div>
      </div>
    );
  }

  const colorMarca = empresa.colorPrimario || "#0284c7";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "Inter, system-ui, sans-serif", color: "#1e293b", overflowX: "hidden" }}>
      {/* Barra de Anuncios y Tasa BCRD */}
      <div style={{ background: "#0f172a", color: "#e2e8f0", padding: "8px 16px", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span>📍</span>
          <span>{empresa.ciudad}, República Dominicana</span>
          {empresa.telefono && <span>• Tel: <b>{empresa.telefono}</b></span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "4px", fontWeight: 600, color: "#38bdf8" }}>
            🏦 Tasa BCRD: RD$ {tasaCambio.toFixed(2)}
          </span>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.15)", borderRadius: "6px", padding: "2px" }}>
            <button
              type="button"
              onClick={() => setMonedaVisual("USD")}
              style={{
                background: monedaVisual === "USD" ? colorMarca : "transparent",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "2px 8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              USD $
            </button>
            <button
              type="button"
              onClick={() => setMonedaVisual("DOP")}
              style={{
                background: monedaVisual === "DOP" ? colorMarca : "transparent",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "2px 8px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              DOP RD$
            </button>
          </div>
        </div>
      </div>

      {/* Header Principal con Identidad de Marca */}
      <header style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "16px 24px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {empresa.logoUrl ? (
              <img src={empresa.logoUrl} alt={empresa.nombre} style={{ height: "46px", maxWidth: "160px", objectFit: "contain", borderRadius: "8px" }} />
            ) : (
              <div style={{ width: "46px", height: "46px", background: colorMarca, color: "white", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: 900 }}>
                {empresa.nombre.charAt(0)}
              </div>
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{empresa.nombre}</h1>
              <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                {empresa.eslogan || "Alquiler de vehículos confiable y seguro en República Dominicana"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {empresa.whatsapp && (
              <a
                href={`https://wa.me/${empresa.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`¡Hola ${empresa.nombre}! Deseo información sobre vehículos disponibles para renta.`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#22c55e",
                  color: "white",
                  padding: "8px 16px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "13px",
                  boxShadow: "0 4px 6px -1px rgba(34, 197, 94, 0.2)",
                }}
              >
                <span>💬</span>
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner & Buscador de Fechas */}
      <div style={{ background: `linear-gradient(135deg, ${colorMarca} 0%, #0f172a 100%)`, color: "white", padding: "40px 20px 60px 20px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
          <span style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700, marginBottom: "12px", backdropFilter: "blur(4px)" }}>
            ✨ Flota Certificada e Inspeccionada
          </span>
          <h2 style={{ fontSize: "28px", fontWeight: 800, margin: "0 0 10px 0" }}>
            Encuentra tu Vehículo Ideal al Mejor Precio
          </h2>
          <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.85)", margin: "0 0 32px 0" }}>
            Kilometraje libre, asistencia 24/7 y entrega garantizada en {empresa.ciudad} y aeropuertos.
          </p>

          {/* Tarjeta de Búsqueda y Selector de Fechas */}
          <div style={{ background: "white", borderRadius: "16px", padding: "20px", color: "#1e293b", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", textAlign: "left" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                📅 FECHA DE RETIRO
              </label>
              <FechaInput value={fechaInicio} onChange={(val) => setFechaInicio(val)} required />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                📅 FECHA DE DEVOLUCIÓN
              </label>
              <FechaInput value={fechaFin} onChange={(val) => setFechaFin(val)} required />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>
                🔍 BUSCAR POR MODELO
              </label>
              <input
                type="text"
                placeholder="Ej. Sonata, RAV4, CR-V..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <div style={{ background: "#f1f5f9", padding: "8px 12px", borderRadius: "8px", textAlign: "center", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
                ⏳ Período: <span style={{ color: colorMarca }}>{diasRenta} día{diasRenta > 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal: Filtros y Catálogo de Vehículos */}
      <main style={{ maxWidth: "1200px", margin: "-20px auto 60px auto", padding: "0 20px" }}>
        {/* Barra de Filtros de Categorías */}
        <div style={{ background: "white", padding: "12px 16px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", overflowX: "auto", maxWidth: "100%", paddingBottom: "4px" }}>
            {categoriasDisponibles.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaSeleccionada(cat)}
                style={{
                  background: categoriaSeleccionada === cat ? colorMarca : "#f1f5f9",
                  color: categoriaSeleccionada === cat ? "white" : "#475569",
                  border: "none",
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}>Transmisión:</span>
            <select
              value={transmisionSeleccionada}
              onChange={(e) => setTransmisionSeleccionada(e.target.value)}
              style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "12px", background: "white" }}
            >
              <option value="TODOS">Todas</option>
              <option value="Automático">Automático</option>
              <option value="Mecánico">Mecánico</option>
            </select>
          </div>
        </div>

        {/* Rejilla de Vehículos */}
        {vehiculosFiltrados.length === 0 ? (
          <div style={{ background: "white", borderRadius: "16px", padding: "48px 20px", textAlign: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🚘</div>
            <h3 style={{ margin: "0 0 6px 0", color: "#334155" }}>No se encontraron vehículos disponibles</h3>
            <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 16px 0" }}>
              Intenta cambiar los filtros de categoría o el término de búsqueda.
            </p>
            <button
              type="button"
              onClick={() => {
                setBusqueda("");
                setCategoriaSeleccionada("TODOS");
                setTransmisionSeleccionada("TODOS");
              }}
              style={{ background: colorMarca, color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
            {vehiculosFiltrados.map((v) => {
              const { totalUSD, totalDOP } = calcularTotalesCotizacion(v.tarifaDiaria);
              const disponible = v.estado === "DISPONIBLE";

              return (
                <div
                  key={v.id}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 20px -5px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.05)";
                  }}
                >
                  {/* Foto del Auto */}
                  <div style={{ height: "200px", background: "#f1f5f9", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {v.imagenUrl ? (
                      <img src={v.imagenUrl} alt={`${v.marca} ${v.modelo}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ textAlign: "center", color: "#94a3b8" }}>
                        <div style={{ fontSize: "48px" }}>🚗</div>
                        <div style={{ fontSize: "11px", fontWeight: 600 }}>Foto Oficial</div>
                      </div>
                    )}
                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        background: disponible ? "#10b981" : "#f59e0b",
                        color: "white",
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: "20px",
                      }}
                    >
                      {disponible ? "DISPONIBLE" : "EN RESERVA"}
                    </span>
                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: "rgba(15, 23, 42, 0.75)",
                        color: "white",
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      {v.categoria || "Sedán"}
                    </span>
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    <div style={{ marginBottom: "12px" }}>
                      <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
                        {v.marca} {v.modelo}
                      </h3>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Año {v.anio} • {v.color}</span>
                    </div>

                    {/* Especificaciones Clave */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", background: "#f8fafc", padding: "10px", borderRadius: "10px", fontSize: "11px", color: "#475569", marginBottom: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>👥</span> <span>{v.capacidadPasajeros || 5} Pts</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>🕹️</span> <span>{v.transmision || "Auto"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>❄️</span> <span>{v.aireAcondicionado !== false ? "A/C" : "No"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>🧳</span> <span>{v.capacidadMaletas || 3} Maletas</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>⛽</span> <span>{v.combustible || "Gasolina"}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>🛡️</span> <span>Seguro</span>
                      </div>
                    </div>

                    {/* Precios y Botón de Cotización */}
                    <div style={{ marginTop: "auto", borderTop: "1px solid #f1f5f9", paddingTop: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>Tarifa Diaria:</div>
                        <div style={{ fontSize: "18px", fontWeight: 900, color: colorMarca }}>
                          {formatearMonto(v.tarifaDiaria)} <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748b" }}>/día</span>
                        </div>
                        {diasRenta > 1 && (
                          <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>
                            Total ({diasRenta}d): {monedaVisual === "DOP" ? `RD$ ${totalDOP.toLocaleString("es-DO", { minimumFractionDigits: 2 })}` : `$${totalUSD.toFixed(2)} USD`}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setVehiculoSeleccionado(v);
                          setReservaConfirmada(null);
                          setErrorModal("");
                        }}
                        style={{
                          background: colorMarca,
                          color: "white",
                          border: "none",
                          borderRadius: "10px",
                          padding: "10px 16px",
                          fontWeight: 700,
                          fontSize: "13px",
                          cursor: "pointer",
                          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        }}
                      >
                        Cotizar / Reservar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Interactivo de Cotización y Reserva */}
      {vehiculoSeleccionado && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", borderRadius: "20px", maxWidth: "680px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", position: "relative" }}>
            {/* Botón de Cerrar */}
            <button
              type="button"
              onClick={() => setVehiculoSeleccionado(null)}
              style={{ position: "absolute", top: "18px", right: "18px", background: "#f1f5f9", border: "none", borderRadius: "50%", width: "32px", height: "32px", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>

            {reservaConfirmada ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "54px", marginBottom: "12px" }}>🎉</div>
                <h2 style={{ color: "#10b981", margin: "0 0 8px 0", fontSize: "22px" }}>¡Solicitud de Reserva Registrada!</h2>
                <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", margin: "0 0 20px 0" }}>
                  Hemos registrado tu solicitud para <b>{vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}</b>.
                  Un representante de <b>{empresa.nombre}</b> se comunicará a tu teléfono <b>{telefonoCliente}</b> para coordinar la entrega.
                </p>

                <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "12px", textAlign: "left", fontSize: "13px", marginBottom: "24px" }}>
                  <div><b>Voucher #:</b> #{reservaConfirmada.id}</div>
                  <div><b>Vehículo:</b> {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo} ({vehiculoSeleccionado.placa})</div>
                  <div><b>Fechas:</b> {fechaInicio} al {fechaFin} ({diasRenta} días)</div>
                  <div><b>Monto Total:</b> ${reservaConfirmada.precioTotal} USD (≈ RD$ {(reservaConfirmada.precioTotal * tasaCambio).toLocaleString("es-DO", { minimumFractionDigits: 2 })} DOP)</div>
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={handleReservarWhatsApp}
                    style={{ background: "#22c55e", color: "white", border: "none", padding: "12px 20px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
                  >
                    💬 Enviar Copia por WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setVehiculoSeleccionado(null)}
                    style={{ background: "#e2e8f0", color: "#1e293b", border: "none", padding: "12px 20px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <div style={{ width: "40px", height: "40px", background: colorMarca, color: "white", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                    🚗
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800 }}>Cotización: {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}</h2>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>Tarifa diaria: ${vehiculoSeleccionado.tarifaDiaria} USD / día</span>
                  </div>
                </div>

                {errorModal && <div style={{ background: "#fee2e2", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>{errorModal}</div>}

                {/* Fechas de Alquiler */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px", background: "#f8fafc", padding: "12px", borderRadius: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>📅 RECOGIDA</label>
                    <FechaInput value={fechaInicio} onChange={(val) => setFechaInicio(val)} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>📅 DEVOLUCIÓN</label>
                    <FechaInput value={fechaFin} onChange={(val) => setFechaFin(val)} />
                  </div>
                </div>

                {/* Selección de Extras Opcionales */}
                <h4 style={{ fontSize: "13px", margin: "0 0 10px 0", color: "#0f172a" }}>Opciones Adicionales de Cobertura y Servicio:</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "10px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", border: incluirSeguroFull ? `1px solid ${colorMarca}` : "1px solid #e2e8f0" }}>
                    <input type="checkbox" checked={incluirSeguroFull} onChange={(e) => setIncluirSeguroFull(e.target.checked)} />
                    <span>🛡️ <b>Seguro Full Cover</b> (+$20/d)</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "10px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", border: incluirSillaBebe ? `1px solid ${colorMarca}` : "1px solid #e2e8f0" }}>
                    <input type="checkbox" checked={incluirSillaBebe} onChange={(e) => setIncluirSillaBebe(e.target.checked)} />
                    <span>👶 <b>Silla de Bebé</b> (+$10/d)</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "10px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", border: incluirConductorExtra ? `1px solid ${colorMarca}` : "1px solid #e2e8f0" }}>
                    <input type="checkbox" checked={incluirConductorExtra} onChange={(e) => setIncluirConductorExtra(e.target.checked)} />
                    <span>👤 <b>Conductor Extra</b> (+$15/d)</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "10px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", border: incluirGps ? `1px solid ${colorMarca}` : "1px solid #e2e8f0" }}>
                    <input type="checkbox" checked={incluirGps} onChange={(e) => setIncluirGps(e.target.checked)} />
                    <span>🗺️ <b>GPS Asistido</b> (+$8/d)</span>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f8fafc", padding: "10px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", border: entregaAeropuerto ? `1px solid ${colorMarca}` : "1px solid #e2e8f0", gridColumn: "1 / -1" }}>
                    <input type="checkbox" checked={entregaAeropuerto} onChange={(e) => setEntregaAeropuerto(e.target.checked)} />
                    <span>✈️ <b>Entrega y Devolución en Aeropuerto (AILA / PUJ / STI)</b> (+$30 tarifa fija)</span>
                  </label>
                </div>

                {/* Resumen de Costo con Tasa BCRD */}
                {(() => {
                  const { totalUSD, totalDOP } = calcularTotalesCotizacion(vehiculoSeleccionado.tarifaDiaria);
                  return (
                    <div style={{ background: "#0f172a", color: "white", padding: "16px 20px", borderRadius: "12px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>Total por {diasRenta} día{diasRenta > 1 ? "s" : ""}:</div>
                        <div style={{ fontSize: "24px", fontWeight: 900, color: "#38bdf8" }}>${totalUSD.toFixed(2)} USD</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>Tasa Oficial BCRD: RD$ {tasaCambio.toFixed(2)}</div>
                        <div style={{ fontSize: "18px", fontWeight: 800, color: "#4ade80" }}>
                          RD$ {totalDOP.toLocaleString("es-DO", { minimumFractionDigits: 2 })} DOP
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Formulario de Contacto del Arrendatario */}
                <form onSubmit={handleConfirmarReservaOnline}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>Nombre *</label>
                      <input type="text" placeholder="Ej. Juan" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} required style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>Apellido *</label>
                      <input type="text" placeholder="Ej. Pérez" value={apellidoCliente} onChange={(e) => setApellidoCliente(e.target.value)} required style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>Teléfono / WhatsApp *</label>
                      <PhoneInput value={telefonoCliente} onChange={(val) => setTelefonoCliente(val)} required />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>Correo Electrónico (Opcional)</label>
                      <input type="email" placeholder="juan@correo.com" value={emailCliente} onChange={(e) => setEmailCliente(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }} />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>Lugar de Entrega</label>
                      <select value={lugarEntrega} onChange={(e) => setLugarEntrega(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }}>
                        <option value="Oficina Principal">Oficina Principal ({empresa.ciudad})</option>
                        <option value="Aeropuerto Las Américas (SDQ)">Aeropuerto Las Américas (SDQ)</option>
                        <option value="Aeropuerto Punta Cana (PUJ)">Aeropuerto Punta Cana (PUJ)</option>
                        <option value="Aeropuerto Santiago Cibao (STI)">Aeropuerto Santiago Cibao (STI)</option>
                        <option value="Hotel / Domicilio Particular">Hotel / Domicilio Particular</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748b", marginBottom: "4px" }}>Comentarios / Solicitudes Especiales</label>
                      <input type="text" placeholder="Ej. Llego en vuelo DL 1234 a las 3 PM" value={comentarios} onChange={(e) => setComentarios(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px", boxSizing: "border-box" }} />
                    </div>
                  </div>

                  {/* Botones de Acción */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={handleReservarWhatsApp}
                      style={{
                        background: "#22c55e",
                        color: "white",
                        border: "none",
                        padding: "12px",
                        borderRadius: "10px",
                        fontWeight: 800,
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      <span>💬</span> <span>Reservar por WhatsApp</span>
                    </button>

                    <button
                      type="submit"
                      disabled={procesandoReserva}
                      style={{
                        background: colorMarca,
                        color: "white",
                        border: "none",
                        padding: "12px",
                        borderRadius: "10px",
                        fontWeight: 800,
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      {procesandoReserva ? "Guardando..." : "Confirmar Online"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Oficial */}
      <footer style={{ background: "#0f172a", color: "#94a3b8", padding: "40px 20px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "32px" }}>
          <div>
            <h3 style={{ color: "white", margin: "0 0 10px 0" }}>{empresa.nombre}</h3>
            <p style={{ fontSize: "13px", lineHeight: "1.6", margin: "0 0 14px 0" }}>
              {empresa.direccion || `Servicio de alquiler de vehículos en ${empresa.ciudad}, República Dominicana.`}
            </p>
            {empresa.rnc && <div style={{ fontSize: "12px" }}>RNC: {empresa.rnc}</div>}
          </div>

          <div>
            <h4 style={{ color: "white", margin: "0 0 10px 0" }}>Atención al Cliente</h4>
            <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
              {empresa.telefono && <div>📞 {empresa.telefono}</div>}
              {empresa.whatsapp && <div>💬 WhatsApp: {empresa.whatsapp}</div>}
              {empresa.email && <div>📧 {empresa.email}</div>}
              <div>📍 {empresa.ciudad}, Rep. Dom.</div>
            </div>
          </div>

          <div>
            <h4 style={{ color: "white", margin: "0 0 10px 0" }}>Garantías & Políticas</h4>
            <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
              <div>• Depósito estándar: ${empresa.depositoEstandar || 200} USD</div>
              <div>• Límite diario: {empresa.limiteKilometrajeDiario || 200} km / día</div>
              <div>• Asistencia 24/7 en carretera</div>
              <div style={{ marginTop: "8px", color: "#38bdf8" }}>
                🏦 Tasa oficial del Banco Central (BCRD): RD$ {tasaCambio.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "1200px", margin: "32px auto 0 auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "16px", textAlign: "center", fontSize: "11px" }}>
          © {new Date().getFullYear()} {empresa.nombre}. Impulsado por la plataforma tecnológica RentOS.
        </div>
      </footer>
    </div>
  );
}
