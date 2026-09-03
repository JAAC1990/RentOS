/**
 * ============================================================================
 * RentOS - Mantenimiento Preventivo y Taller Mecánico (MantenimientoPage)
 * ============================================================================
 * Monitoreo del estado mecánico y costos de mantenimiento:
 * - Registro de órdenes de servicio (cambio de aceite, frenos, amortiguación).
 * - Cálculo automático del próximo servicio por odómetro (+5,000 km) y tiempo (+90 días).
 * - Semáforo de alertas (AL DÍA 🟢, PRÓXIMO 🟡, VENCIDO 🔴).
 * - Integración de auditoría mecánica con notificaciones hacia Telegram.
 */

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URLS } from "../../services/api";
import { formatearFecha } from "../../utils/dateUtils";
import FechaInput from "../../components/FechaInput";
import MonedaInput, { TASA_CAMBIO_DEFAULT } from "../../components/MonedaInput";

type Vehiculo = {
  id: number;
  rentCarId?: number;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  kilometraje: number;
  estado: string;
};

type Mantenimiento = {
  id: number;
  rentCarId: number;
  vehiculoId: number;
  tipoServicio: string;
  descripcion: string | null;
  costo: string | number;
  kilometrajeServicio: number;
  proximoKilometraje: number | null;
  proximaFechaServicio: string | null;
  fechaServicio: string;
  taller: string | null;
  estado: "PROGRAMADO" | "EN_PROCESO" | "COMPLETADO" | "CANCELADO";
  vehiculo?: Vehiculo;
};

type AlertaMantenimiento = {
  vehiculoId: number;
  marca: string;
  modelo: string;
  placa: string;
  kilometrajeActual: number;
  proximoKm: number;
  kmRestantes: number;
  proximaFecha: string;
  diasRestantes: number;
  estadoAlerta: "VENCIDO" | "PROXIMO" | "AL_DIA";
  ultimoServicio: string;
};

type ResumenAlertas = {
  total: number;
  vencidos: number;
  proximos: number;
  alDia: number;
};

const hoy = new Date().toISOString().split("T")[0];

export default function MantenimientoPage() {
  const { tenantActivoId } = useAuth();
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [alertas, setAlertas] = useState<AlertaMantenimiento[]>([]);
  const [resumenAlertas, setResumenAlertas] = useState<ResumenAlertas | null>(null);

  const [vehiculoId, setVehiculoId] = useState("");
  const [tipoServicio, setTipoServicio] = useState("Cambio de Aceite y Filtro");
  const [otroTipoServicio, setOtroTipoServicio] = useState("");
  const [costo, setCosto] = useState("65.00");
  const [monedaCosto, setMonedaCosto] = useState<"USD" | "DOP">("USD");
  const [tasaCambio] = useState<number>(TASA_CAMBIO_DEFAULT);
  const [kilometrajeServicio, setKilometrajeServicio] = useState("");
  const [proximoKilometraje, setProximoKilometraje] = useState("");
  const [proximaFechaServicio, setProximaFechaServicio] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [fechaServicio, setFechaServicio] = useState(hoy);
  const [taller, setTaller] = useState("Taller Central RentOS");
  const [estado, setEstado] = useState<Mantenimiento["estado"]>("COMPLETADO");
  const [descripcion, setDescripcion] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarModalAlertas, setMostrarModalAlertas] = useState(false);
  const [notificandoTelegram, setNotificandoTelegram] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_URL = API_URLS.mantenimientos;

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const targetTenant = tenantActivoId || 1;
      const [resMantenimientos, resVehiculos, resAlertas] = await Promise.all([
        fetch(`${API_URL}?rentCarId=${targetTenant}`),
        fetch(`${API_URLS.vehiculos}?rentCarId=${targetTenant}`),
        fetch(`${API_URL}/alertas?rentCarId=${targetTenant}`),
      ]);

      if (!resMantenimientos.ok || !resVehiculos.ok) {
        throw new Error("No fue posible obtener los registros de mantenimiento.");
      }

      const [datosMantenimientos, datosVehiculos] = await Promise.all([
        resMantenimientos.json(),
        resVehiculos.json(),
      ]);

      setMantenimientos(datosMantenimientos);
      setVehiculos(datosVehiculos.filter((v: Vehiculo) => !v.rentCarId || v.rentCarId === targetTenant));

      if (resAlertas.ok) {
        const datosAlertas = await resAlertas.json();
        setAlertas(datosAlertas.alertas || []);
        setResumenAlertas(datosAlertas.resumen || null);
      }
    } catch (err) {
      console.error(err);
      setError("Error al cargar la información de taller y mantenimiento.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantActivoId]);

  // Al seleccionar vehículo, sugerir odómetro actual y próximo (+5000 km)
  const handleSeleccionarVehiculo = (vId: string) => {
    setVehiculoId(vId);
    const v = vehiculos.find((x) => x.id === Number(vId));
    if (v) {
      setKilometrajeServicio(String(v.kilometraje));
      setProximoKilometraje(String(v.kilometraje + 5000));
    }
  };

  const mantenimientosFiltrados = useMemo(() => {
    return mantenimientos.filter((m) => {
      const cumpleFiltroEstado =
        filtroEstado === "TODOS" || m.estado === filtroEstado;

      const texto = `${m.tipoServicio} ${m.taller || ""} ${m.vehiculo?.marca || ""} ${m.vehiculo?.modelo || ""} ${m.vehiculo?.placa || ""}`.toLowerCase();
      const cumpleBusqueda = texto.includes(busqueda.toLowerCase());

      return cumpleFiltroEstado && cumpleBusqueda;
    });
  }, [mantenimientos, busqueda, filtroEstado]);

  const registrarMantenimiento = async (e: React.FormEvent) => {
    e.preventDefault();

    const tipoFinal =
      tipoServicio === "OTRO" ? otroTipoServicio.trim() : tipoServicio.trim();

    if (!vehiculoId || !tipoFinal) {
      setError(
        tipoServicio === "OTRO"
          ? "Debes especificar el tipo de mantenimiento personalizado."
          : "Debes seleccionar un vehículo y tipo de servicio."
      );
      return;
    }

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      let costoFinalUSD = Number(costo);
      if (monedaCosto === "DOP") {
        costoFinalUSD = Number((costoFinalUSD / tasaCambio).toFixed(2));
      }

      const datos = {
        rentCarId: tenantActivoId || 1,
        vehiculoId: Number(vehiculoId),
        tipoServicio: tipoFinal,
        descripcion: descripcion.trim() || undefined,
        costo: costoFinalUSD,
        kilometrajeServicio: Number(kilometrajeServicio),
        proximoKilometraje: Number(proximoKilometraje),
        proximaFechaServicio,
        fechaServicio,
        taller: taller.trim() || undefined,
        estado,
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Error al registrar servicio.");
      }

      setMensaje("✅ Servicio de mantenimiento registrado con éxito.");
      setVehiculoId("");
      setDescripcion("");
      setOtroTipoServicio("");
      setMostrarFormulario(false);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al procesar registro.");
    } finally {
      setGuardando(false);
    }
  };

  const enviarAlertaTelegram = async () => {
    try {
      setNotificandoTelegram(true);
      setError("");
      setMensaje("");

      const res = await fetch(`${API_URL}/notificar-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentCarId: tenantActivoId || 1 }),
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

  return (
    <div className="mantenimiento-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Mantenimiento Preventivo & Taller</h1>
          <p>
            Control de cambios de aceite, frenos, repuestos y alertas por kilometraje o fecha de expiración.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="secondary-button"
            style={{
              borderColor: resumenAlertas && (resumenAlertas.vencidos > 0 || resumenAlertas.proximos > 0) ? "#fde68a" : "var(--border)",
              color: resumenAlertas && resumenAlertas.vencidos > 0 ? "var(--danger)" : "inherit",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={() => setMostrarModalAlertas(true)}
          >
            🚨 Alertas de Cambio de Aceite
            {resumenAlertas && resumenAlertas.vencidos > 0 && (
              <span className="badge badge-inactivo" style={{ marginLeft: "4px" }}>
                {resumenAlertas.vencidos} Vencido
              </span>
            )}
          </button>

          <button
            className="primary-button"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            {mostrarFormulario ? "Cerrar Formulario" : "+ Registrar Mantenimiento"}
          </button>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Formulario de Mantenimiento */}
      {mostrarFormulario && (
        <section className="content-panel" style={{ marginBottom: "24px" }}>
          <div className="panel-header">
            <h2>Registrar Nuevo Servicio Técnico</h2>
            <button className="secondary-button" onClick={() => setMostrarFormulario(false)}>
              Cancelar
            </button>
          </div>

          <form onSubmit={registrarMantenimiento} style={{ padding: "20px" }}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="mantVehiculo">Vehículo *</label>
                <select
                  id="mantVehiculo"
                  value={vehiculoId}
                  onChange={(e) => handleSeleccionarVehiculo(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Vehículo --</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} ({v.placa}) — Odómetro: {v.kilometraje} km
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="mantTipo">Tipo de Servicio *</label>
                <select
                  id="mantTipo"
                  value={tipoServicio}
                  onChange={(e) => setTipoServicio(e.target.value)}
                  required
                >
                  <option value="Cambio de Aceite y Filtro">🛢️ Cambio de Aceite y Filtro</option>
                  <option value="Frenos y Pastillas">🛑 Pastillas y Líquido de Frenos</option>
                  <option value="Neumáticos y Alineación">🛞 Neumáticos, Balanceo y Alineación</option>
                  <option value="Suspensión y Amortiguadores">🔩 Suspensión y Amortiguadores</option>
                  <option value="Batería y Sistema Eléctrico">⚡ Batería y Sistema Eléctrico</option>
                  <option value="Inspección General">🔍 Inspección General Preventiva</option>
                  <option value="OTRO">📦 Otros (Especificar tipo de servicio personalizado)</option>
                </select>
              </div>

              {/* Campo desplegable dinámico si se selecciona 'Otros' */}
              {tipoServicio === "OTRO" && (
                <div className="form-field" style={{ gridColumn: "span 2" }}>
                  <label htmlFor="otroTipoServicio">Especifique el Tipo de Mantenimiento *</label>
                  <input
                    id="otroTipoServicio"
                    type="text"
                    placeholder="Ej. Reparación de Cremallera de Dirección, Cambio de Radiador, Pintura..."
                    value={otroTipoServicio}
                    onChange={(e) => setOtroTipoServicio(e.target.value)}
                    required
                  />
                </div>
              )}

              <MonedaInput
                id="mantCosto"
                label="Costo del Servicio"
                value={costo}
                onChange={(val) => setCosto(val)}
                moneda={monedaCosto}
                onMonedaChange={setMonedaCosto}
                tasaCambio={tasaCambio}
                required
              />

              <div className="form-field">
                <label htmlFor="mantFecha">Fecha de Realización (DD/MM/AAAA) *</label>
                <FechaInput
                  id="mantFecha"
                  value={fechaServicio}
                  onChange={(iso) => setFechaServicio(iso)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="mantKm">Odómetro al Realizar Servicio (km) *</label>
                <input
                  id="mantKm"
                  type="number"
                  value={kilometrajeServicio}
                  onChange={(e) => setKilometrajeServicio(e.target.value)}
                  required
                />
              </div>

              {/* SECCIÓN PRÓXIMO SERVICIO (ALERTAS) */}
              <div className="form-field">
                <label htmlFor="mantProximoKm">Próximo Servicio en Odómetro (km) *</label>
                <input
                  id="mantProximoKm"
                  type="number"
                  placeholder="Ej. +5,000 km"
                  value={proximoKilometraje}
                  onChange={(e) => setProximoKilometraje(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="mantProximaFecha">Fecha Límite Próximo Servicio (DD/MM/AAAA) *</label>
                <FechaInput
                  id="mantProximaFecha"
                  value={proximaFechaServicio}
                  onChange={(iso) => setProximaFechaServicio(iso)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="mantTaller">Taller Mecánico</label>
                <input
                  id="mantTaller"
                  type="text"
                  placeholder="Ej. Taller Mecánico Santo Domingo"
                  value={taller}
                  onChange={(e) => setTaller(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="mantEstado">Estado del Mantenimiento *</label>
                <select
                  id="mantEstado"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as Mantenimiento["estado"])}
                  required
                >
                  <option value="COMPLETADO">✓ Completado (Listo para rentar)</option>
                  <option value="EN_PROCESO">⏳ En Proceso (Pasa auto a TALLER)</option>
                  <option value="PROGRAMADO">📅 Cita Programada</option>
                </select>
              </div>

              <div className="form-field" style={{ gridColumn: "span 2" }}>
                <label htmlFor="mantDesc">Detalles / Repuestos Utilizados</label>
                <textarea
                  id="mantDesc"
                  rows={2}
                  placeholder="Ej. Aceite sintético 5W-30 Full, filtro de aire cambiado y rotación de llantas."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setMostrarFormulario(false)}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button type="submit" className="primary-button" disabled={guardando}>
                {guardando ? "Guardando..." : "Registrar Servicio"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Historial de Mantenimientos */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>
            Historial de Mantenimientos & Taller{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "13px" }}>
              ({mantenimientosFiltrados.length} registros)
            </span>
          </h2>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                fontSize: "12px",
                background: "var(--surface)",
                color: "var(--text)",
              }}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="COMPLETADO">Completados</option>
              <option value="EN_PROCESO">En Taller</option>
              <option value="PROGRAMADO">Programados</option>
            </select>

            <div style={{ width: "220px" }}>
              <input
                type="text"
                placeholder="Buscar por auto, placa o taller..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando mantenimientos...</strong>
          </div>
        ) : mantenimientosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛠️</div>
            <strong>No hay mantenimientos registrados</strong>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Vehículo</th>
                  <th>Tipo de Servicio</th>
                  <th>Taller</th>
                  <th>Odómetro Servicio</th>
                  <th>Próximo Servicio</th>
                  <th>Costo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {mantenimientosFiltrados.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{formatearFecha(m.fechaServicio)}</strong>
                    </td>
                    <td>
                      <strong>{m.vehiculo?.marca} {m.vehiculo?.modelo}</strong>
                      <div><code>{m.vehiculo?.placa}</code></div>
                    </td>
                    <td>
                      <strong>{m.tipoServicio}</strong>
                      {m.descripcion && (
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          {m.descripcion}
                        </div>
                      )}
                    </td>
                    <td>{m.taller || "Taller Interno"}</td>
                    <td>{m.kilometrajeServicio?.toLocaleString()} km</td>
                    <td>
                      <strong style={{ color: "var(--primary)" }}>
                        {m.proximoKilometraje ? `${m.proximoKilometraje.toLocaleString()} km` : "-"}
                      </strong>
                      {m.proximaFechaServicio && (
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                          Antes de: {formatearFecha(m.proximaFechaServicio)}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong>${Number(m.costo).toFixed(2)}</strong>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          m.estado === "COMPLETADO"
                            ? "badge-disponible"
                            : m.estado === "EN_PROCESO"
                            ? "badge-mantenimiento"
                            : "badge-inactivo"
                        }`}
                      >
                        {m.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Alertas Preventivas de Mantenimiento */}
      {mostrarModalAlertas && (
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
              maxWidth: "750px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h2 style={{ margin: "0 0 2px 0", fontSize: "18px" }}>
                  🚨 Monitor Preventivo de Cambio de Aceite & Taller
                </h2>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Predicción de servicio por odómetro acumulado y fecha límite de mantenimiento.
                </span>
              </div>
              <button
                className="secondary-button"
                style={{ padding: "4px 8px" }}
                onClick={() => setMostrarModalAlertas(false)}
              >
                ✕
              </button>
            </div>

            {/* Resumen Semáforo */}
            {resumenAlertas && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                <div style={{ padding: "12px", background: "var(--danger-soft)", borderRadius: "8px", border: "1px solid #fecaca" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--danger)" }}>🔴 SOBREGIRADOS</span>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "var(--danger)", marginTop: "2px" }}>
                    {resumenAlertas.vencidos} autos
                  </div>
                </div>

                <div style={{ padding: "12px", background: "var(--warning-soft)", borderRadius: "8px", border: "1px solid #fde68a" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--warning)" }}>🟡 PRÓXIMOS (&lt;800 km)</span>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "var(--warning)", marginTop: "2px" }}>
                    {resumenAlertas.proximos} autos
                  </div>
                </div>

                <div style={{ padding: "12px", background: "var(--success-soft)", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--success)" }}>🟢 AL DÍA</span>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "var(--success)", marginTop: "2px" }}>
                    {resumenAlertas.alDia} autos
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de Alertas */}
            <div className="table-container" style={{ marginBottom: "20px" }}>
              <table className="data-table" style={{ fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th>Vehículo</th>
                    <th>Odómetro Actual</th>
                    <th>Próximo Servicio</th>
                    <th>Faltante</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {alertas.map((a) => (
                    <tr key={a.vehiculoId}>
                      <td>
                        <strong>{a.marca} {a.modelo}</strong> (<code>{a.placa}</code>)
                      </td>
                      <td>{a.kilometrajeActual?.toLocaleString()} km</td>
                      <td>{a.proximoKm?.toLocaleString()} km</td>
                      <td>
                        {a.kmRestantes <= 0 ? (
                          <strong style={{ color: "var(--danger)" }}>
                            Pasado por {Math.abs(a.kmRestantes)} km
                          </strong>
                        ) : (
                          <span>{a.kmRestantes} km restantes</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            a.estadoAlerta === "AL_DIA"
                              ? "badge-disponible"
                              : a.estadoAlerta === "PROXIMO"
                              ? "badge-mantenimiento"
                              : "badge-inactivo"
                          }`}
                        >
                          {a.estadoAlerta === "AL_DIA"
                            ? "🟢 Al día"
                            : a.estadoAlerta === "PROXIMO"
                            ? "🟡 Próximo"
                            : "🔴 Vencido"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                className="secondary-button"
                style={{ borderColor: "#38bdf8", color: "#0284c7" }}
                onClick={enviarAlertaTelegram}
                disabled={notificandoTelegram}
              >
                {notificandoTelegram ? "⏳ Enviando..." : "📲 Enviar Alertas de Taller a Telegram"}
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() => setMostrarModalAlertas(false)}
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
