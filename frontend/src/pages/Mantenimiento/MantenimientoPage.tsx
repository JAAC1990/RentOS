import { useEffect, useMemo, useState } from "react";
import { API_URLS } from "../../services/api";

type Vehiculo = {
  id: number;
  marca: string;
  modelo: string;
  placa: string;
  kilometraje: number;
  estado: string;
};

type Mantenimiento = {
  id: number;
  vehiculoId: number;
  tipoServicio: string;
  descripcion: string | null;
  costo: string | number;
  kilometrajeServicio: number;
  proximoKilometraje: number | null;
  fechaServicio: string;
  taller: string | null;
  estado: "PROGRAMADO" | "EN_PROCESO" | "COMPLETADO" | "CANCELADO";
  vehiculo?: Vehiculo;
};

type FormularioMantenimiento = {
  vehiculoId: string;
  tipoServicio: string;
  descripcion: string;
  costo: string;
  kilometrajeServicio: string;
  proximoKilometraje: string;
  fechaServicio: string;
  taller: string;
  estado: "PROGRAMADO" | "EN_PROCESO" | "COMPLETADO" | "CANCELADO";
};

const hoy = new Date().toISOString().split("T")[0];

const formularioInicial: FormularioMantenimiento = {
  vehiculoId: "",
  tipoServicio: "Cambio de Aceite y Filtro",
  descripcion: "",
  costo: "65.00",
  kilometrajeServicio: "",
  proximoKilometraje: "",
  fechaServicio: hoy,
  taller: "Taller Central",
  estado: "COMPLETADO",
};

export default function MantenimientoPage() {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);

  const [formulario, setFormulario] = useState<FormularioMantenimiento>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const [error, setError] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_MANTENIMIENTOS = API_URLS.mantenimientos;

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [resMantenimientos, resVehiculos] = await Promise.all([
        fetch(API_MANTENIMIENTOS),
        fetch(API_URLS.vehiculos),
      ]);

      if (!resMantenimientos.ok || !resVehiculos.ok) {
        throw new Error("No fue posible cargar la información de mantenimientos.");
      }

      const [datosMantenimientos, datosVehiculos] = await Promise.all([
        resMantenimientos.json(),
        resVehiculos.json(),
      ]);

      setMantenimientos(datosMantenimientos);
      setVehiculos(datosVehiculos);
    } catch (err) {
      console.error(err);
      setError("No fue posible conectar con el servidor para cargar los mantenimientos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Estadísticas calculadas en tiempo real
  const stats = useMemo(() => {
    const total = mantenimientos.length;
    const enProceso = mantenimientos.filter((m) => m.estado === "EN_PROCESO").length;
    const completados = mantenimientos.filter((m) => m.estado === "COMPLETADO").length;
    const programados = mantenimientos.filter((m) => m.estado === "PROGRAMADO").length;

    const gastoTotal = mantenimientos
      .filter((m) => m.estado === "COMPLETADO")
      .reduce((sum, m) => sum + Number(m.costo), 0);

    return {
      total,
      enProceso,
      completados,
      programados,
      gastoTotal: gastoTotal.toFixed(2),
    };
  }, [mantenimientos]);

  // Filtrado y búsqueda
  const mantenimientosFiltrados = useMemo(() => {
    return mantenimientos.filter((m) => {
      const cumpleEstado =
        filtroEstado === "TODOS" || m.estado === filtroEstado;

      const texto = `${m.id} ${m.tipoServicio} ${m.taller || ""} ${m.vehiculo?.marca || ""} ${m.vehiculo?.modelo || ""} ${m.vehiculo?.placa || ""}`.toLowerCase();
      const cumpleBusqueda = texto.includes(busqueda.toLowerCase());

      return cumpleEstado && cumpleBusqueda;
    });
  }, [mantenimientos, busqueda, filtroEstado]);

  const handleSeleccionarVehiculo = (vehiculoIdStr: string) => {
    const v = vehiculos.find((item) => item.id === Number(vehiculoIdStr));
    const kmActual = v ? v.kilometraje : 0;

    setFormulario((actual) => ({
      ...actual,
      vehiculoId: vehiculoIdStr,
      kilometrajeServicio: String(kmActual),
      proximoKilometraje: String(kmActual + 5000),
    }));
  };

  const validarFormulario = () => {
    setErrorFormulario("");

    if (!formulario.vehiculoId) {
      setErrorFormulario("Debe seleccionar un vehículo.");
      return false;
    }
    if (!formulario.tipoServicio.trim()) {
      setErrorFormulario("El tipo de servicio es obligatorio.");
      return false;
    }
    if (!formulario.kilometrajeServicio || Number(formulario.kilometrajeServicio) < 0) {
      setErrorFormulario("El kilometraje del servicio no es válido.");
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

  const guardarMantenimiento = async () => {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensaje("");

      const datos = {
        vehiculoId: Number(formulario.vehiculoId),
        tipoServicio: formulario.tipoServicio.trim(),
        descripcion: formulario.descripcion.trim() || undefined,
        costo: Number(formulario.costo) || 0,
        kilometrajeServicio: Number(formulario.kilometrajeServicio),
        proximoKilometraje: formulario.proximoKilometraje ? Number(formulario.proximoKilometraje) : undefined,
        fechaServicio: new Date(formulario.fechaServicio).toISOString(),
        taller: formulario.taller.trim() || undefined,
        estado: formulario.estado,
      };

      const url = editandoId === null ? API_MANTENIMIENTOS : `${API_MANTENIMIENTOS}/${editandoId}`;
      const metodo = editandoId === null ? "POST" : "PUT";

      const respuesta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          resultado?.error || resultado?.message || "No fue posible registrar el mantenimiento."
        );
      }

      setMensaje(
        editandoId === null
          ? "✅ Servicio de mantenimiento registrado con éxito."
          : "✅ Mantenimiento actualizado correctamente."
      );

      limpiarFormulario();
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setErrorFormulario(
        err instanceof Error ? err.message : "Error al guardar el mantenimiento."
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminarMantenimiento = async (id: number) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea eliminar este registro de mantenimiento?"
    );
    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      const respuesta = await fetch(`${API_MANTENIMIENTOS}/${id}`, {
        method: "DELETE",
      });

      if (!respuesta.ok) {
        throw new Error("No fue posible eliminar el registro.");
      }

      setMensaje("🗑️ Registro de mantenimiento eliminado.");
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    }
  };

  return (
    <div className="mantenimiento-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Mantenimiento y Taller de Flota</h1>
          <p>Control de servicios preventivos, cambios de aceite, reparaciones y gastos de taller.</p>
        </div>

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
          {mostrarFormulario && editandoId === null ? "Cerrar Formulario" : "+ Registrar Servicio"}
        </button>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon maintenance">🛠️</div>
          <div className="stat-info">
            <span className="stat-label">En Taller / Proceso</span>
            <strong className="stat-value" style={{ color: "var(--warning)" }}>
              {stats.enProceso}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon available">✅</div>
          <div className="stat-info">
            <span className="stat-label">Servicios Completados</span>
            <strong className="stat-value">{stats.completados}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-label">Inversión en Mantenimiento</span>
            <strong className="stat-value">${stats.gastoTotal}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rented">📅</div>
          <div className="stat-info">
            <span className="stat-label">Programados</span>
            <strong className="stat-value">{stats.programados}</strong>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Formulario de Mantenimiento */}
      {mostrarFormulario && (
        <section className="content-panel" id="formulario-mantenimiento">
          <div className="panel-header">
            <h2>{editandoId === null ? "Registrar Servicio Mecánico" : "Modificar Registro de Taller"}</h2>
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
              guardarMantenimiento();
            }}
          >
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="vehiculoId">Vehículo a Intervenir *</label>
                <select
                  id="vehiculoId"
                  value={formulario.vehiculoId}
                  onChange={(e) => handleSeleccionarVehiculo(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Vehículo --</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} • {v.placa} ({v.kilometraje} km) - [{v.estado}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="tipoServicio">Tipo de Servicio *</label>
                <select
                  id="tipoServicio"
                  value={formulario.tipoServicio}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, tipoServicio: e.target.value }))
                  }
                  required
                >
                  <option value="Cambio de Aceite y Filtro">🛢️ Cambio de Aceite y Filtro</option>
                  <option value="Frenos y Pastillas">🛑 Frenos y Pastillas</option>
                  <option value="Alineación y Balanceo">⚖️ Alineación y Balanceo</option>
                  <option value="Neumáticos / Gomas">🛞 Neumáticos / Gomas</option>
                  <option value="Batería y Sistema Eléctrico">🔋 Batería y Eléctrico</option>
                  <option value="Inspección General">🔍 Inspección General</option>
                  <option value="Reparación Mecánica">🔧 Reparación Mecánica</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="estadoMantenimiento">Estado del Servicio *</label>
                <select
                  id="estadoMantenimiento"
                  value={formulario.estado}
                  onChange={(e) =>
                    setFormulario((prev) => ({
                      ...prev,
                      estado: e.target.value as FormularioMantenimiento["estado"],
                    }))
                  }
                  required
                >
                  <option value="COMPLETADO">Completado (Vehículo listo y disponible)</option>
                  <option value="EN_PROCESO">En Proceso (Vehículo bloqueado en taller)</option>
                  <option value="PROGRAMADO">Programado (Cita futura)</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="kilometrajeServicio">Kilometraje del Servicio (km) *</label>
                <input
                  id="kilometrajeServicio"
                  type="number"
                  min="0"
                  value={formulario.kilometrajeServicio}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, kilometrajeServicio: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="proximoKilometraje">Próximo Servicio Sugerido (km)</label>
                <input
                  id="proximoKilometraje"
                  type="number"
                  placeholder="Ej. +5000 km"
                  value={formulario.proximoKilometraje}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, proximoKilometraje: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="costo">Costo Total del Servicio (USD / DOP) *</label>
                <input
                  id="costo"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formulario.costo}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, costo: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="taller">Taller / Mecánico Responsable</label>
                <input
                  id="taller"
                  type="text"
                  placeholder="Ej. Santo Domingo Motors o Taller Interno"
                  value={formulario.taller}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, taller: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="fechaServicio">Fecha del Servicio *</label>
                <input
                  id="fechaServicio"
                  type="date"
                  value={formulario.fechaServicio}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, fechaServicio: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="descripcion">Detalle de Trabajos / Repuestos</label>
                <input
                  id="descripcion"
                  type="text"
                  placeholder="Ej. Aceite sintético 5W-30 + filtro OEM"
                  value={formulario.descripcion}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, descripcion: e.target.value }))
                  }
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button" disabled={guardando}>
                  {guardando ? "Guardando Registro..." : "Guardar Servicio"}
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
            placeholder="Buscar por vehículo, tipo de servicio o taller..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-estado-mant" style={{ fontSize: "12px", fontWeight: 600 }}>
            Estado:
          </label>
          <select
            id="filtro-estado-mant"
            className="filter-select"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="TODOS">Todos los servicios</option>
            <option value="COMPLETADO">Completados</option>
            <option value="EN_PROCESO">En Taller / Proceso</option>
            <option value="PROGRAMADO">Programados</option>
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

      {/* Tabla de Historial */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>
            Historial de Mantenimiento de Flota{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "13px" }}>
              ({mantenimientosFiltrados.length} de {mantenimientos.length} servicios)
            </span>
          </h2>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando historial de mantenimiento...</strong>
          </div>
        ) : mantenimientosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛠️</div>
            <strong>No hay servicios registrados</strong>
            <span>
              {mantenimientos.length === 0
                ? "Registra los cambios de aceite y reparaciones para llevar el control de costos y salud de tu flota."
                : "No hay registros que coincidan con la búsqueda o filtro."}
            </span>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Tipo de Servicio</th>
                  <th>Kilometraje</th>
                  <th>Próximo Servicio</th>
                  <th>Taller</th>
                  <th>Costo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mantenimientosFiltrados.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.vehiculo?.marca} {m.vehiculo?.modelo}</strong>
                      <div><code>{m.vehiculo?.placa}</code></div>
                    </td>
                    <td>
                      <strong>{m.tipoServicio}</strong>
                      {m.descripcion && (
                        <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                          {m.descripcion}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>{Number(m.kilometrajeServicio).toLocaleString()} km</div>
                      <small style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
                        {new Date(m.fechaServicio).toLocaleDateString("es-DO")}
                      </small>
                    </td>
                    <td>
                      {m.proximoKilometraje ? (
                        <span style={{ fontWeight: 600, color: "var(--primary)" }}>
                          {Number(m.proximoKilometraje).toLocaleString()} km
                        </span>
                      ) : "-"}
                    </td>
                    <td>{m.taller || <span style={{ color: "var(--text-light)" }}>-</span>}</td>
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
                            : "badge-alquilado"
                        }`}
                      >
                        {m.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => eliminarMantenimiento(m.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
