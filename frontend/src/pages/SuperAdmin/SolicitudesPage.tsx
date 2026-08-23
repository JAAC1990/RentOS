import { useEffect, useMemo, useState } from "react";
import { API_URLS } from "../../services/api";

type SolicitudRentCar = {
  id: number;
  nombre: string;
  rnc: string | null;
  contactoNombre: string | null;
  email: string | null;
  telefono: string | null;
  ciudad: string;
  direccion: string | null;
  estadoRegistro: "PENDIENTE" | "APROBADO" | "RECHAZADO" | "ACTIVO";
  activo: boolean;
  createdAt: string;
  _count?: {
    vehiculos: number;
  };
};

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudRentCar[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_SOLICITUDES = API_URLS.solicitudes || "http://localhost:3000/api/solicitudes";

  const cargarSolicitudes = async () => {
    try {
      setCargando(true);
      setError("");

      const res = await fetch(API_SOLICITUDES);
      if (!res.ok) throw new Error("No fue posible cargar las solicitudes.");

      const data: SolicitudRentCar[] = await res.json();
      setSolicitudes(data);
    } catch (err) {
      console.error(err);
      setError("Error al conectar con el servidor para obtener solicitudes.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const stats = useMemo(() => {
    const total = solicitudes.length;
    const pendientes = solicitudes.filter(
      (s) => s.estadoRegistro === "PENDIENTE" || (!s.activo && s.estadoRegistro !== "RECHAZADO")
    ).length;
    const aprobadas = solicitudes.filter((s) => s.activo || s.estadoRegistro === "APROBADO").length;
    const rechazadas = solicitudes.filter((s) => s.estadoRegistro === "RECHAZADO").length;

    return { total, pendientes, aprobadas, rechazadas };
  }, [solicitudes]);

  const solicitudesFiltradas = useMemo(() => {
    return solicitudes.filter((s) => {
      let estado = s.activo ? "APROBADO" : s.estadoRegistro;
      if (estado === "ACTIVO") estado = "APROBADO";

      const cumpleEstado = filtroEstado === "TODOS" || estado === filtroEstado;
      const texto = `${s.nombre} ${s.contactoNombre || ""} ${s.email || ""} ${s.telefono || ""} ${s.ciudad}`.toLowerCase();
      const cumpleBusqueda = texto.includes(busqueda.toLowerCase());

      return cumpleEstado && cumpleBusqueda;
    });
  }, [solicitudes, busqueda, filtroEstado]);

  const autorizarCuenta = async (s: SolicitudRentCar) => {
    try {
      setProcesandoId(s.id);
      setError("");
      setMensaje("");

      const res = await fetch(`${API_SOLICITUDES}/${s.id}/aprobar`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No fue posible autorizar la cuenta.");

      setMensaje(`🎉 ${data.mensaje}`);
      await cargarSolicitudes();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al autorizar cuenta.");
    } finally {
      setProcesandoId(null);
    }
  };

  const rechazarCuenta = async (s: SolicitudRentCar) => {
    const confirmar = window.confirm(`¿Rechazar solicitud de ${s.nombre}?`);
    if (!confirmar) return;

    try {
      setProcesandoId(s.id);
      setError("");
      setMensaje("");

      const res = await fetch(`${API_SOLICITUDES}/${s.id}/rechazar`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al rechazar solicitud.");

      setMensaje(`❌ ${data.mensaje}`);
      await cargarSolicitudes();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al procesar rechazo.");
    } finally {
      setProcesandoId(null);
    }
  };

  const eliminarEmpresa = async (s: SolicitudRentCar) => {
    if (s.id === 1) {
      alert("No es posible eliminar la empresa matriz principal de RentOS (ID #1).");
      return;
    }

    const confirmar = window.confirm(
      `⚠️ ¿ESTÁS SEGURO DE ELIMINAR PERMANENTEMENTE LA EMPRESA?\n\nEmpresa: "${s.nombre}" (ID #${s.id})\n\nEsta acción eliminará de forma irreversible:\n- La empresa y su configuración\n- Todos sus vehículos registrados\n- Todos sus contratos y entregas\n- Los usuarios y accesos de sus empleados\n\n¿Deseas continuar?`
    );
    if (!confirmar) return;

    try {
      setProcesandoId(s.id);
      setError("");
      setMensaje("");

      const res = await fetch(`${API_URLS.rentcars}/${s.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar empresa.");

      setMensaje(`🗑️ ${data.mensaje}`);
      await cargarSolicitudes();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al eliminar empresa.");
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="solicitudes-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>👑 Gestión & Autorización de Empresas (Rent a Cars)</h1>
          <p>
            Revisa, autoriza, rechaza o elimina las empresas de Rent a Car registradas en RentOS.
          </p>
        </div>

        <button className="secondary-button" onClick={cargarSolicitudes} disabled={cargando}>
          {cargando ? "⏳ Actualizando..." : "🔄 Refrescar Solicitudes"}
        </button>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <span className="stat-label">Total Empresas</span>
            <strong className="stat-value">{stats.total}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon maintenance">⏳</div>
          <div className="stat-info">
            <span className="stat-label">Pendientes de Aprobación</span>
            <strong className="stat-value" style={{ color: "#d97706" }}>
              {stats.pendientes}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon available">✓</div>
          <div className="stat-info">
            <span className="stat-label">Cuentas Autorizadas</span>
            <strong className="stat-value">{stats.aprobadas}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rented">🚫</div>
          <div className="stat-info">
            <span className="stat-label">Rechazadas</span>
            <strong className="stat-value">{stats.rechazadas}</strong>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Barra de Filtros y Búsqueda */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre de empresa, dueño, teléfono, ciudad o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-solicitudes" style={{ fontSize: "12px", fontWeight: 600 }}>
            Estado:
          </label>
          <select
            id="filtro-solicitudes"
            className="filter-select"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="TODOS">Todas las empresas</option>
            <option value="PENDIENTE">⏳ Pendientes de Autorización</option>
            <option value="APROBADO">🟢 Aprobadas / Activas</option>
            <option value="RECHAZADO">🔴 Rechazadas</option>
          </select>
        </div>
      </div>

      {/* Tabla de Solicitudes */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>
            Registro de Empresas Rent a Car{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "13px" }}>
              ({solicitudesFiltradas.length} empresas)
            </span>
          </h2>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando solicitudes...</strong>
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <strong>No hay solicitudes en esta categoría</strong>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empresa / Tenant</th>
                  <th>Contacto / Dueño</th>
                  <th>Teléfono / WhatsApp</th>
                  <th>Correo de Acceso</th>
                  <th>Ciudad</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudesFiltradas.map((s) => {
                  const estaPendiente = s.estadoRegistro === "PENDIENTE" || (!s.activo && s.estadoRegistro !== "RECHAZADO");
                  const telLimpio = s.telefono ? s.telefono.replace(/[^0-9]/g, "") : "";

                  return (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.nombre}</strong>
                        {s.rnc && (
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            RNC: {s.rnc}
                          </div>
                        )}
                        <small style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                          ID Tenant #{s.id}
                        </small>
                      </td>
                      <td>
                        <strong>{s.contactoNombre || "Administrador"}</strong>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <code>{s.telefono || "Sin teléfono"}</code>
                          {telLimpio && (
                            <a
                              href={`https://wa.me/${telLimpio}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chatear por WhatsApp"
                              style={{ textDecoration: "none", fontSize: "14px" }}
                            >
                              💬
                            </a>
                          )}
                        </div>
                      </td>
                      <td>
                        <code>{s.email || "Sin correo"}</code>
                      </td>
                      <td>
                        <span className="badge" style={{ background: "var(--primary-soft)", color: "var(--primary)" }}>
                          📍 {s.ciudad}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            s.activo || s.estadoRegistro === "APROBADO" || s.estadoRegistro === "ACTIVO"
                              ? "badge-disponible"
                              : estaPendiente
                              ? "badge-mantenimiento"
                              : "badge-inactivo"
                          }`}
                        >
                          {s.activo || s.estadoRegistro === "APROBADO" || s.estadoRegistro === "ACTIVO"
                            ? "✓ Aprobada / Activa"
                            : estaPendiente
                            ? "⏳ Pendiente"
                            : "🔴 Rechazada"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="actions-cell" style={{ justifyContent: "flex-end", gap: "6px" }}>
                          {estaPendiente ? (
                            <>
                              <button
                                type="button"
                                className="primary-button"
                                style={{ backgroundColor: "var(--success)", padding: "6px 12px", fontSize: "12px" }}
                                onClick={() => autorizarCuenta(s)}
                                disabled={procesandoId === s.id}
                              >
                                {procesandoId === s.id ? "⏳..." : "✅ Autorizar"}
                              </button>
                              <button
                                type="button"
                                className="secondary-button"
                                style={{ color: "var(--danger)", borderColor: "#fca5a5", padding: "6px 10px", fontSize: "12px" }}
                                onClick={() => rechazarCuenta(s)}
                                disabled={procesandoId === s.id}
                                title="Rechazar solicitud"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: 600 }}>
                              ✓ Activa
                            </span>
                          )}

                          {/* Botón Eliminar Empresa Permanente (Excepto Matriz ID #1) */}
                          {s.id !== 1 && (
                            <button
                              type="button"
                              className="btn-action-delete"
                              onClick={() => eliminarEmpresa(s)}
                              disabled={procesandoId === s.id}
                              title="Eliminar permanentemente esta empresa y todos sus datos"
                              style={{ marginLeft: "4px" }}
                            >
                              🗑️ Eliminar
                            </button>
                          )}
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
    </div>
  );
}
