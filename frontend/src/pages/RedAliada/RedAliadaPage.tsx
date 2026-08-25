/**
 * ============================================================================
 * RentOS - Red de Aliados y Transferencias Inter-Empresariales (RedAliadaPage)
 * ============================================================================
 * Colaboración B2B entre empresas de renta de autos:
 * - Búsqueda de vehículos disponibles en otras ciudades (Punta Cana, Santiago, Sto. Dgo.).
 * - Generación de solicitudes de préstamo o cesión de flota con tarifa pactada.
 * - Directorio de contactos de agencias aliadas.
 */

import { useEffect, useMemo, useState } from "react";
import { API_URLS } from "../../services/api";
import { formatearFecha } from "../../utils/dateUtils";

type RentCarAliado = {
  id: number;
  nombre: string;
  ciudad: string;
  telefono: string | null;
  email: string | null;
  _count?: {
    vehiculos: number;
    contratos: number;
  };
};

type VehiculoRed = {
  id: number;
  rentCarId: number;
  marca: string;
  modelo: string;
  anio: number;
  color: string | null;
  placa: string;
  kilometraje: number;
  estado: string;
  tarifaDiaria: string | number;
  rentCar: RentCarAliado;
};

type TransferenciaFlota = {
  id: number;
  vehiculoId: number;
  origenRentCarId: number;
  destinoRentCarId: number;
  fechaSolicitud: string;
  fechaDevolucion: string | null;
  tarifaPactada: string | number;
  estado: "PENDIENTE" | "APROBADA" | "EN_TRANSITO" | "COMPLETADA" | "RECHAZADA";
  notas: string | null;
  vehiculo: {
    marca: string;
    modelo: string;
    placa: string;
    rentCar?: RentCarAliado;
  };
};

export default function RedAliadaPage() {
  const [flotaRed, setFlotaRed] = useState<VehiculoRed[]>([]);
  const [aliados, setAliados] = useState<RentCarAliado[]>([]);
  const [transferencias, setTransferencias] = useState<TransferenciaFlota[]>([]);

  const [cargando, setCargando] = useState(true);
  const [solicitando, setSolicitando] = useState(false);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<VehiculoRed | null>(null);

  const [tarifaPactada, setTarifaPactada] = useState("50.00");
  const [notas, setNotas] = useState("");

  const [filtroCiudad, setFiltroCiudad] = useState("TODAS");
  const [filtroMarca, setFiltroMarca] = useState("TODAS");
  const [busqueda, setBusqueda] = useState("");

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_RED = API_URLS.red;

  const cargarDatosRed = async () => {
    try {
      setCargando(true);
      setError("");

      const [resFlota, resAliados, resTransf] = await Promise.all([
        fetch(`${API_RED}/flota`),
        fetch(`${API_RED}/rentcars`),
        fetch(`${API_RED}/transferencias`),
      ]);

      if (!resFlota.ok || !resAliados.ok) {
        throw new Error("No fue posible conectar con la red de Rent Cars.");
      }

      const [datosFlota, datosAliados, datosTransf] = await Promise.all([
        resFlota.json(),
        resAliados.json(),
        resTransf.ok ? resTransf.json() : [],
      ]);

      setFlotaRed(datosFlota);
      setAliados(datosAliados);
      setTransferencias(datosTransf);
    } catch (err) {
      console.error(err);
      setError("No fue posible sincronizar los datos de la red de Rent Cars.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosRed();
  }, []);

  // Marcas únicas disponibles en la red
  const marcasDisponibles = useMemo(() => {
    const setMarcas = new Set(flotaRed.map((v) => v.marca));
    return Array.from(setMarcas);
  }, [flotaRed]);

  // Ciudades únicas
  const ciudadesDisponibles = useMemo(() => {
    const setCiudades = new Set(aliados.map((a) => a.ciudad));
    return Array.from(setCiudades);
  }, [aliados]);

  // Filtrado de flota
  const flotaFiltrada = useMemo(() => {
    return flotaRed.filter((v) => {
      const cumpleCiudad =
        filtroCiudad === "TODAS" || v.rentCar?.ciudad === filtroCiudad;
      const cumpleMarca =
        filtroMarca === "TODAS" || v.marca === filtroMarca;

      const texto = `${v.marca} ${v.modelo} ${v.placa} ${v.rentCar?.nombre || ""}`.toLowerCase();
      const cumpleBusqueda = texto.includes(busqueda.toLowerCase());

      return cumpleCiudad && cumpleMarca && cumpleBusqueda;
    });
  }, [flotaRed, filtroCiudad, filtroMarca, busqueda]);

  const abrirModalTransferencia = (vehiculo: VehiculoRed) => {
    setVehiculoSeleccionado(vehiculo);
    setTarifaPactada(String(Number(vehiculo.tarifaDiaria) * 0.8)); // Tarifa inter-empresa sugerida al 80%
    setNotas("");
  };

  const enviarSolicitudTransferencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiculoSeleccionado) return;

    try {
      setSolicitando(true);
      setError("");
      setMensaje("");

      const datos = {
        vehiculoId: vehiculoSeleccionado.id,
        origenRentCarId: vehiculoSeleccionado.rentCarId,
        destinoRentCarId: 1, // Empresa activa actual
        tarifaPactada: Number(tarifaPactada),
        notas: notas.trim() || undefined,
      };

      const res = await fetch(`${API_RED}/transferencias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (!res.ok) throw new Error("No fue posible enviar la solicitud de transferencia.");

      setMensaje(
        `🤝 Solicitud enviada a "${vehiculoSeleccionado.rentCar.nombre}" para el vehículo ${vehiculoSeleccionado.marca} ${vehiculoSeleccionado.modelo}.`
      );
      setVehiculoSeleccionado(null);
      await cargarDatosRed();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al procesar transferencia.");
    } finally {
      setSolicitando(false);
    }
  };

  const cambiarEstadoTransferencia = async (id: number, nuevoEstado: string) => {
    try {
      setError("");
      const res = await fetch(`${API_RED}/transferencias/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) throw new Error("No fue posible actualizar el estado de la transferencia.");

      setMensaje(`🔄 Estado de la transferencia actualizado a ${nuevoEstado}.`);
      await cargarDatosRed();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al actualizar estado.");
    }
  };

  return (
    <div className="red-aliada-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Red de Rent Cars & Búsqueda Cruzada de Flota</h1>
          <p>
            Localiza vehículos disponibles en empresas aliadas cuando tu inventario esté agotado y
            gestiona préstamos inter-sucursal.
          </p>
        </div>

        <button className="secondary-button" onClick={cargarDatosRed} disabled={cargando}>
          🔄 Sincronizar Red
        </button>
      </div>

      {/* Tarjetas de Estadísticas de la Red */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <span className="stat-label">Empresas Aliadas</span>
            <strong className="stat-value">{aliados.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon available">🚗</div>
          <div className="stat-info">
            <span className="stat-label">Vehículos en Red</span>
            <strong className="stat-value">{flotaRed.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rented">🤝</div>
          <div className="stat-info">
            <span className="stat-label">Transferencias Activas</span>
            <strong className="stat-value">
              {transferencias.filter((t) => t.estado === "APROBADA" || t.estado === "EN_TRANSITO").length}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon maintenance">📍</div>
          <div className="stat-info">
            <span className="stat-label">Ciudades Cobertura</span>
            <strong className="stat-value">{ciudadesDisponibles.length}</strong>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Barra de Filtros de la Red */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por marca, modelo, placa o Rent Car aliado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-ciudad" style={{ fontSize: "12px", fontWeight: 600 }}>
            Ciudad:
          </label>
          <select
            id="filtro-ciudad"
            className="filter-select"
            value={filtroCiudad}
            onChange={(e) => setFiltroCiudad(e.target.value)}
          >
            <option value="TODAS">Todas las ciudades</option>
            {ciudadesDisponibles.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <label htmlFor="filtro-marca" style={{ fontSize: "12px", fontWeight: 600, marginLeft: "8px" }}>
            Marca:
          </label>
          <select
            id="filtro-marca"
            className="filter-select"
            value={filtroMarca}
            onChange={(e) => setFiltroMarca(e.target.value)}
          >
            <option value="TODAS">Todas las marcas</option>
            {marcasDisponibles.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Marketplace de Flota Inter-Empresarial */}
      <div className="content-panel" style={{ marginBottom: "24px" }}>
        <div className="panel-header">
          <h2>
            Flota Compartida en Vivo{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "13px" }}>
              ({flotaFiltrada.length} unidades disponibles en la red)
            </span>
          </h2>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Conectando con la red de Rent Cars...</strong>
          </div>
        ) : flotaFiltrada.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚗</div>
            <strong>No hay vehículos que coincidan con la búsqueda</strong>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Ubicación / Rent Car Aliado</th>
                  <th>Placa / Año</th>
                  <th>Tarifa Pública</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {flotaFiltrada.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <strong>
                        {v.marca} {v.modelo}
                      </strong>
                      <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                        Color: {v.color || "N/D"} • {v.kilometraje?.toLocaleString()} km
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{v.rentCar?.nombre}</strong>
                      </div>
                      <small style={{ color: "var(--text-secondary)" }}>
                        📍 {v.rentCar?.ciudad} • Tel: {v.rentCar?.telefono}
                      </small>
                    </td>
                    <td>
                      <code>{v.placa}</code> ({v.anio})
                    </td>
                    <td>
                      <strong style={{ fontSize: "14px", color: "var(--primary)" }}>
                        ${Number(v.tarifaDiaria).toFixed(2)}/día
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          v.estado === "DISPONIBLE"
                            ? "badge-disponible"
                            : v.estado === "ALQUILADO"
                            ? "badge-alquilado"
                            : "badge-mantenimiento"
                        }`}
                      >
                        {v.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {v.rentCarId !== 1 ? (
                        <button
                          type="button"
                          className="btn-action-edit"
                          style={{
                            background: "var(--primary-soft)",
                            color: "var(--primary)",
                            borderColor: "#bfdbfe",
                          }}
                          onClick={() => abrirModalTransferencia(v)}
                        >
                          🤝 Solicitar Préstamo
                        </button>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-light)" }}>
                          (Tu Flota)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Solicitudes de Transferencia Inter-Empresarial */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>📋 Solicitudes de Transferencia & Préstamos de Flota</h2>
        </div>

        {transferencias.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🤝</div>
            <strong>No hay solicitudes de transferencia activas</strong>
            <span>
              Cuando necesites vehículos de un Rent Car aliado o prestes unidades, aparecerán aquí.
            </span>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vehículo</th>
                  <th>Fecha Solicitud</th>
                  <th>Tarifa Inter-Empresa</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Gestión</th>
                </tr>
              </thead>
              <tbody>
                {transferencias.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>#TR-{t.id}</strong>
                    </td>
                    <td>
                      <strong>
                        {t.vehiculo?.marca} {t.vehiculo?.modelo}
                      </strong>
                      <div>
                        <code>{t.vehiculo?.placa}</code>
                      </div>
                    </td>
                    <td>{formatearFecha(t.fechaSolicitud)}</td>
                    <td>
                      <strong>${Number(t.tarifaPactada).toFixed(2)}/día</strong>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          t.estado === "APROBADA" || t.estado === "COMPLETADA"
                            ? "badge-disponible"
                            : t.estado === "PENDIENTE" || t.estado === "EN_TRANSITO"
                            ? "badge-mantenimiento"
                            : "badge-inactivo"
                        }`}
                      >
                        {t.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                        {t.estado === "PENDIENTE" && (
                          <button
                            type="button"
                            className="btn-action-edit"
                            style={{ background: "var(--success-soft)", color: "var(--success)" }}
                            onClick={() => cambiarEstadoTransferencia(t.id, "APROBADA")}
                          >
                            ✓ Aprobar
                          </button>
                        )}
                        {t.estado === "APROBADA" && (
                          <button
                            type="button"
                            className="btn-action-edit"
                            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
                            onClick={() => cambiarEstadoTransferencia(t.id, "EN_TRANSITO")}
                          >
                            🚚 En Tránsito
                          </button>
                        )}
                        {t.estado === "EN_TRANSITO" && (
                          <button
                            type="button"
                            className="btn-action-edit"
                            style={{ background: "var(--success-soft)", color: "var(--success)" }}
                            onClick={() => cambiarEstadoTransferencia(t.id, "COMPLETADA")}
                          >
                            🏁 Recibido
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Solicitud de Transferencia */}
      {vehiculoSeleccionado && (
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
              maxWidth: "520px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>
                🤝 Solicitar Préstamo de Flota
              </h2>
              <button
                className="secondary-button"
                style={{ padding: "4px 8px" }}
                onClick={() => setVehiculoSeleccionado(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "12px", background: "var(--primary-soft)", borderRadius: "8px", marginBottom: "16px" }}>
              <strong style={{ fontSize: "14px" }}>
                {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo} ({vehiculoSeleccionado.anio})
              </strong>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                Propietario: <b>{vehiculoSeleccionado.rentCar?.nombre}</b> ({vehiculoSeleccionado.rentCar?.ciudad})
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Tarifa pública sugerida: ${Number(vehiculoSeleccionado.tarifaDiaria)}/día
              </div>
            </div>

            <form onSubmit={enviarSolicitudTransferencia}>
              <div className="form-field" style={{ marginBottom: "14px" }}>
                <label htmlFor="tarifaPactadaInput">Tarifa Inter-Empresa Acordada ($/día) *</label>
                <input
                  id="tarifaPactadaInput"
                  type="number"
                  min="1"
                  step="0.5"
                  value={tarifaPactada}
                  onChange={(e) => setTarifaPactada(e.target.value)}
                  required
                />
              </div>

              <div className="form-field" style={{ marginBottom: "20px" }}>
                <label htmlFor="notasInput">Notas o Período Estimado</label>
                <textarea
                  id="notasInput"
                  rows={3}
                  placeholder="Ej. Requerido para cliente VIP por 5 días en Santo Domingo."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setVehiculoSeleccionado(null)}
                  disabled={solicitando}
                >
                  Cancelar
                </button>
                <button type="submit" className="primary-button" disabled={solicitando}>
                  {solicitando ? "Enviando..." : "Confirmar Solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
