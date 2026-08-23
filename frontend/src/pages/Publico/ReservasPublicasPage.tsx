import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import PhoneInput from "../../components/PhoneInput";
import { API_URLS } from "../../services/api";

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
  const [busqueda, setBusqueda] = useState("");

  // Vehículo seleccionado
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
      const texto = `${v.marca} ${v.modelo}`.toLowerCase();
      const cumpleBusqueda = texto.includes(busqueda.toLowerCase());
      return cumpleMarca && cumpleBusqueda;
    });
  }, [vehiculos, filtroMarca, busqueda]);

  // Cálculo de precios con extras
  const calcularTotal = (tarifaDiaria: number) => {
    let costoPorDia = tarifaDiaria;
    if (incluirSeguro) costoPorDia += 20;
    if (incluirSillaBebe) costoPorDia += 10;
    if (incluirConductorExtra) costoPorDia += 15;
    return (costoPorDia * dias).toFixed(2);
  };

  const procesarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiculoSeleccionado) return;

    if (!nombre.trim() || !apellido.trim() || !telefono.trim()) {
      setError("Por favor completa tu nombre, apellido y teléfono.");
      return;
    }

    try {
      setEnviando(true);
      setError("");

      // 1. Crear o buscar cliente
      const resCliente = await fetch(API_URLS.clientes, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          telefono: telefono.trim(),
          email: email.trim() || undefined,
          rentCarId: Number(tenantId),
          estado: "ACTIVO",
        }),
      });

      let clienteId = 1;
      if (resCliente.ok) {
        const nuevoCliente = await resCliente.json();
        clienteId = nuevoCliente.id;
      } else {
        const resClientesList = await fetch(API_URLS.clientes);
        if (resClientesList.ok) {
          const list = await resClientesList.json();
          const match = list.find((c: { telefono: string }) => c.telefono === telefono.trim());
          if (match) clienteId = match.id;
        }
      }

      // 2. Crear contrato en estado BORRADOR / RESERVA
      const tarifaTotalDia =
        Number(vehiculoSeleccionado.tarifaDiaria) +
        (incluirSeguro ? 20 : 0) +
        (incluirSillaBebe ? 10 : 0) +
        (incluirConductorExtra ? 15 : 0);

      const notasExtras = [
        incluirSeguro ? "Seguro Cero Deducible" : "",
        incluirSillaBebe ? "Silla para Bebé" : "",
        incluirConductorExtra ? "Conductor Adicional" : "",
      ]
        .filter(Boolean)
        .join(", ");

      const resContrato = await fetch(API_URLS.contratos, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteId,
          vehiculoId: vehiculoSeleccionado.id,
          fechaInicio: new Date(fechaInicio).toISOString(),
          fechaFin: new Date(fechaFin).toISOString(),
          tarifaDiaria: tarifaTotalDia,
          deposito: 200,
          kilometrajeInicial: vehiculoSeleccionado.kilometraje,
          estado: "BORRADOR",
          observaciones: `Reserva Web Online. Extras: ${notasExtras || "Ninguno"}`,
        }),
      });

      if (!resContrato.ok) {
        throw new Error("No fue posible registrar la solicitud de reserva.");
      }

      const contratoCreado = await resContrato.json();

      setReservaConfirmada({
        contratoId: contratoCreado.id,
        cliente: `${nombre} ${apellido}`,
        vehiculo: `${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo} (${vehiculoSeleccionado.anio})`,
        total: calcularTotal(Number(vehiculoSeleccionado.tarifaDiaria)),
        dias,
      });

      setVehiculoSeleccionado(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al procesar reserva.");
    } finally {
      setEnviando(false);
    }
  };

  const getUrlWhatsApp = (reserva: { contratoId: number; cliente: string; vehiculo: string; total: string; dias: number }) => {
    const telefonoRentCar = rentCarInfo?.telefono ? rentCarInfo.telefono.replace(/[^0-9]/g, "") : "18095550199";
    const texto = `Hola *${rentCarInfo?.nombre || "RentOS"}*, mi nombre es *${reserva.cliente}*. Acabo de solicitar la Reserva *#${reserva.contratoId}* en su catálogo web:\n\n🚗 *Vehículo:* ${reserva.vehiculo}\n📅 *Duración:* ${reserva.dias} días (${fechaInicio} al ${fechaFin})\n💰 *Total Estimado:* $${reserva.total} USD\n\n¿Me confirman disponibilidad para completar la entrega? ¡Muchas gracias!`;
    return `https://wa.me/${telefonoRentCar}?text=${encodeURIComponent(texto)}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--background)",
        color: "var(--text)",
        fontFamily: "Inter, sans-serif",
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
              style={{ maxHeight: "40px", maxWidth: "120px", objectFit: "contain" }}
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div
              style={{
                width: "38px",
                height: "38px",
                background: colorMarca,
                color: "white",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900",
                fontSize: "18px",
              }}
            >
              {rentCarInfo ? rentCarInfo.nombre.charAt(0).toUpperCase() : "R"}
            </div>
          )}
          <div>
            <strong style={{ fontSize: "16px", display: "block" }}>
              {rentCarInfo?.nombre || "RentOS Principal"}
            </strong>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              {rentCarInfo?.eslogan || `Catálogo Oficial de Alquiler • ${rentCarInfo?.ciudad || "Santo Domingo"}`}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
            📞 Asistencia 24/7: <b>{rentCarInfo?.telefono || "(809) 555-0199"}</b>
          </span>
          <a
            href={`https://wa.me/${(rentCarInfo?.whatsapp || rentCarInfo?.telefono || "18095550199").replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            style={{
              backgroundColor: "#22c55e",
              color: "#ffffff",
              padding: "8px 14px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            💬 WhatsApp
          </a>
        </div>
      </nav>

      {/* Hero Banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${colorMarca} 0%, #0f172a 100%)`,
          color: "#ffffff",
          padding: "48px 24px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "32px", margin: "0 0 10px 0", fontWeight: 800 }}>
          {rentCarInfo ? rentCarInfo.nombre : "Encuentra tu Vehículo Ideal"}
        </h1>
        <p style={{ fontSize: "16px", color: "#e2e8f0", maxWidth: "600px", margin: "0 auto 28px auto" }}>
          {rentCarInfo?.eslogan || `Flota moderna en ${rentCarInfo?.ciudad || "República Dominicana"}, tarifas transparentes, seguro incluido y confirmación instantánea.`}
        </p>

        {/* Buscador de Fechas */}
        <div
          style={{
            maxWidth: "780px",
            margin: "0 auto",
            backgroundColor: "var(--surface)",
            padding: "18px 24px",
            borderRadius: "14px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "14px",
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
              🚗 MARCA / TIPO
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
        </div>
      </div>

      {/* Contenedor de Flota */}
      <div style={{ maxWidth: "1100px", margin: "36px auto", padding: "0 20px" }}>
        {error && <div className="alert-box error" style={{ marginBottom: "20px" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "20px", margin: 0 }}>
            Vehículos Disponibles ({dias} {dias === 1 ? "día" : "días"} de renta)
          </h2>
          <div style={{ width: "260px" }}>
            <input
              type="text"
              placeholder="Buscar por modelo..."
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {vehiculosFiltrados.map((v) => {
              const totalEst = (Number(v.tarifaDiaria) * dias).toFixed(2);
              return (
                <div
                  key={v.id}
                  style={{
                    backgroundColor: "var(--surface)",
                    borderRadius: "14px",
                    border: "1px solid var(--border)",
                    padding: "20px",
                    boxShadow: "var(--shadow)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <h3 style={{ margin: "0 0 4px 0", fontSize: "18px" }}>
                          {v.marca} {v.modelo}
                        </h3>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                          Año {v.anio} • Color {v.color || "Estándar"}
                        </span>
                      </div>
                      <span className="badge badge-disponible">Disponible</span>
                    </div>

                    <div
                      style={{
                        margin: "14px 0",
                        padding: "10px 14px",
                        background: "var(--primary-soft)",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
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
                          ${totalEst}
                        </strong>
                      </div>
                    </div>

                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.6", marginBottom: "16px" }}>
                      ✓ Kilometraje ilimitado en ciudad<br />
                      ✓ Asistencia en carretera 24h<br />
                      ✓ Limpieza y desinfección certificada
                    </div>
                  </div>

                  <button
                    type="button"
                    className="primary-button"
                    style={{ width: "100%", padding: "12px" }}
                    onClick={() => setVehiculoSeleccionado(v)}
                  >
                    ⚡ Reservar Este Auto
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Configuración y Solicitud de Reserva */}
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
              <span>📅 Del <b>{fechaInicio}</b> al <b>{fechaFin}</b></span>
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

            {/* Formulario de Datos del Conductor */}
            <form onSubmit={procesarReserva}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                <div className="form-field">
                  <label htmlFor="resNombre">Nombre *</label>
                  <input
                    id="resNombre"
                    type="text"
                    placeholder="Carlos"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="resApellido">Apellido *</label>
                  <input
                    id="resApellido"
                    type="text"
                    placeholder="García"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div className="form-field">
                  <label htmlFor="resTelefono">WhatsApp / Teléfono *</label>
                  <PhoneInput
                    id="resTelefono"
                    value={telefono}
                    onChange={(val) => setTelefono(val)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="resEmail">Correo Electrónico</label>
                  <input
                    id="resEmail"
                    type="email"
                    placeholder="carlos@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Total Final */}
              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  paddingTop: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <span style={{ fontSize: "14px" }}>Total Estimado de la Renta:</span>
                <strong style={{ fontSize: "22px", color: "var(--primary)" }}>
                  ${calcularTotal(Number(vehiculoSeleccionado.tarifaDiaria))} USD
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
                <button type="submit" className="primary-button" disabled={enviando}>
                  {enviando ? "Confirmando..." : "Confirmar Solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Éxito / Confirmación con Botón WhatsApp */}
      {reservaConfirmada && (
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
              maxWidth: "500px",
              width: "100%",
              padding: "32px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
              textAlign: "center",
              color: "var(--text)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>🎉</div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "20px", color: "var(--success)" }}>
              ¡Solicitud de Reserva Recibida!
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 20px 0" }}>
              Hemos registrado tu solicitud con el <b>No. #{reservaConfirmada.contratoId}</b>. El equipo de{" "}
              <b>{rentCarInfo?.nombre || "RentOS"}</b> se comunicará contigo para formalizar la entrega.
            </p>

            <div
              style={{
                background: "var(--primary-soft)",
                padding: "16px",
                borderRadius: "10px",
                textAlign: "left",
                fontSize: "13px",
                lineHeight: "1.8",
                marginBottom: "24px",
              }}
            >
              <div>👤 <b>Cliente:</b> {reservaConfirmada.cliente}</div>
              <div>🚗 <b>Vehículo:</b> {reservaConfirmada.vehiculo}</div>
              <div>📅 <b>Duración:</b> {reservaConfirmada.dias} días</div>
              <div>💰 <b>Total Estimado:</b> ${reservaConfirmada.total} USD</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <a
                href={getUrlWhatsApp(reservaConfirmada)}
                target="_blank"
                rel="noreferrer"
                style={{
                  backgroundColor: "#22c55e",
                  color: "#ffffff",
                  padding: "12px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                💬 Enviar Confirmación por WhatsApp al Rent Car
              </a>

              <button
                type="button"
                className="secondary-button"
                onClick={() => setReservaConfirmada(null)}
              >
                Cerrar y Volver al Catálogo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
