import { useEffect, useMemo, useState } from "react";
import { API_URLS } from "../../services/api";

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
  estado: "DISPONIBLE" | "ALQUILADO" | "MANTENIMIENTO" | "INACTIVO";
  tarifaDiaria: string | number;
};

type FormularioVehiculo = {
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  placa: string;
  vin: string;
  kilometraje: string;
  estado: string;
  tarifaDiaria: string;
};

const formularioInicial: FormularioVehiculo = {
  marca: "",
  modelo: "",
  anio: new Date().getFullYear().toString(),
  color: "",
  placa: "",
  vin: "",
  kilometraje: "0",
  estado: "DISPONIBLE",
  tarifaDiaria: "",
};

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [formulario, setFormulario] = useState<FormularioVehiculo>(formularioInicial);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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

      const respuesta = await fetch(API_URL);

      if (!respuesta.ok) {
        throw new Error("No fue posible cargar los vehículos.");
      }

      const datos = await respuesta.json();
      setVehiculos(datos);
    } catch (err) {
      console.error(err);
      setError(
        "No se pudieron cargar los vehículos. Verifique que el servidor backend esté en ejecución."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVehiculos();
  }, []);

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
    return vehiculos.filter((v) => {
      const cumpleFiltroEstado =
        filtroEstado === "TODOS" || v.estado === filtroEstado;

      const texto = `${v.marca} ${v.modelo} ${v.placa} ${v.vin || ""} ${v.color || ""} ${v.anio}`.toLowerCase();
      const cumpleBusqueda = texto.includes(busqueda.toLowerCase());

      return cumpleFiltroEstado && cumpleBusqueda;
    });
  }, [vehiculos, busqueda, filtroEstado]);

  const actualizarCampo = (campo: keyof FormularioVehiculo, valor: string) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
    setErrorFormulario("");
    setMensaje("");
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
    if (!formulario.anio.trim()) {
      setErrorFormulario("El año es obligatorio.");
      return false;
    }

    const anio = Number(formulario.anio);
    if (!Number.isInteger(anio) || anio < 1900 || anio > new Date().getFullYear() + 2) {
      setErrorFormulario("El año no es válido.");
      return false;
    }

    if (!formulario.placa.trim()) {
      setErrorFormulario("La placa es obligatoria.");
      return false;
    }

    const kilometraje = Number(formulario.kilometraje);
    if (!Number.isFinite(kilometraje) || kilometraje < 0) {
      setErrorFormulario("El kilometraje debe ser mayor o igual a 0.");
      return false;
    }

    if (!formulario.tarifaDiaria.trim()) {
      setErrorFormulario("La tarifa diaria es obligatoria.");
      return false;
    }

    const tarifa = Number(formulario.tarifaDiaria);
    if (!Number.isFinite(tarifa) || tarifa <= 0) {
      setErrorFormulario("La tarifa diaria debe ser mayor a 0.");
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

      const datos = {
        marca: formulario.marca.trim(),
        modelo: formulario.modelo.trim(),
        anio: Number(formulario.anio),
        color: formulario.color.trim() || undefined,
        placa: formulario.placa.trim().toUpperCase(),
        vin: formulario.vin.trim().toUpperCase() || undefined,
        kilometraje: Number(formulario.kilometraje),
        estado: formulario.estado,
        tarifaDiaria: Number(formulario.tarifaDiaria),
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
          ? "✅ Vehículo registrado exitosamente."
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
      anio: String(vehiculo.anio ?? ""),
      color: vehiculo.color ?? "",
      placa: vehiculo.placa ?? "",
      vin: vehiculo.vin ?? "",
      kilometraje: String(vehiculo.kilometraje ?? 0),
      estado: vehiculo.estado ?? "DISPONIBLE",
      tarifaDiaria: String(vehiculo.tarifaDiaria ?? ""),
    });
    setMostrarFormulario(true);
    setErrorFormulario("");
    setMensaje("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarVehiculo = async (id: number) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea eliminar este vehículo de su flota?"
    );
    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      const respuesta = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          resultado?.message ||
            resultado?.error ||
            "No fue posible eliminar el vehículo."
        );
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

  const exportarCSV = () => {
    if (vehiculos.length === 0) return;

    const encabezados = ["ID", "Marca", "Modelo", "Anio", "Color", "Placa", "VIN", "Kilometraje", "Estado", "Tarifa Diaria"];
    const filas = vehiculos.map((v) => [
      v.id,
      `"${v.marca}"`,
      `"${v.modelo}"`,
      v.anio,
      `"${v.color || ""}"`,
      `"${v.placa}"`,
      `"${v.vin || ""}"`,
      v.kilometraje,
      v.estado,
      v.tarifaDiaria,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [encabezados.join(","), ...filas.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RentOS_Vehiculos_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="vehiculos-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Gestión de Vehículos</h1>
          <p>Administra la flota, tarifas, estados y disponibilidad de tus vehículos.</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary-button" onClick={exportarCSV}>
            📥 Exportar CSV
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
          <div className="stat-icon available">✅</div>
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
            <span className="stat-label">Mantenimiento</span>
            <strong className="stat-value">{stats.mantenimiento}</strong>
          </div>
        </div>
      </div>

      {/* Alertas Globales */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Formulario de Creación / Edición */}
      {mostrarFormulario && (
        <section className="content-panel" id="formulario-vehiculo">
          <div className="panel-header">
            <h2>{editandoId === null ? "Registrar Nuevo Vehículo" : "Editar Vehículo"}</h2>
            <button className="secondary-button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          </div>

          {errorFormulario && <div className="alert-box error" style={{ margin: "20px 24px 0" }}>{errorFormulario}</div>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              guardarVehiculo();
            }}
          >
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="marca">Marca *</label>
                <input
                  id="marca"
                  type="text"
                  placeholder="Ej. Toyota, Kia, Hyundai"
                  value={formulario.marca}
                  onChange={(e) => actualizarCampo("marca", e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="modelo">Modelo *</label>
                <input
                  id="modelo"
                  type="text"
                  placeholder="Ej. Corolla, Sportage, Tucson"
                  value={formulario.modelo}
                  onChange={(e) => actualizarCampo("modelo", e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="anio">Año *</label>
                <input
                  id="anio"
                  type="number"
                  min="1990"
                  max={new Date().getFullYear() + 2}
                  value={formulario.anio}
                  onChange={(e) => actualizarCampo("anio", e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="color">Color</label>
                <input
                  id="color"
                  type="text"
                  placeholder="Ej. Blanco, Negro, Gris"
                  value={formulario.color}
                  onChange={(e) => actualizarCampo("color", e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="placa">Placa (Matrícula) *</label>
                <input
                  id="placa"
                  type="text"
                  placeholder="Ej. A123456"
                  value={formulario.placa}
                  onChange={(e) => actualizarCampo("placa", e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="vin">VIN / Chasis</label>
                <input
                  id="vin"
                  type="text"
                  placeholder="Número de chasis (17 caracteres)"
                  value={formulario.vin}
                  onChange={(e) => actualizarCampo("vin", e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="kilometraje">Kilometraje Actual (km) *</label>
                <input
                  id="kilometraje"
                  type="number"
                  min="0"
                  value={formulario.kilometraje}
                  onChange={(e) => actualizarCampo("kilometraje", e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="estado">Estado *</label>
                <select
                  id="estado"
                  value={formulario.estado}
                  onChange={(e) => actualizarCampo("estado", e.target.value)}
                  required
                >
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="ALQUILADO">Alquilado</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="tarifaDiaria">Tarifa Diaria (USD / DOP) *</label>
                <input
                  id="tarifaDiaria"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Ej. 50.00"
                  value={formulario.tarifaDiaria}
                  onChange={(e) => actualizarCampo("tarifaDiaria", e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button" disabled={guardando}>
                  {guardando
                    ? "Guardando..."
                    : editandoId === null
                    ? "Guardar Vehículo"
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

      {/* Barra de Búsqueda y Filtros */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por marca, modelo, placa o VIN..."
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

      {/* Tabla de Vehículos */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>
            Listado de Flota{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "13px" }}>
              ({vehiculosFiltrados.length} de {vehiculos.length} vehículos)
            </span>
          </h2>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando flota de vehículos...</strong>
          </div>
        ) : vehiculosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚗</div>
            <strong>No se encontraron vehículos</strong>
            <span>
              {vehiculos.length === 0
                ? "Aún no has registrado ningún vehículo en tu flota. Haz clic en '+ Nuevo Vehículo' para comenzar."
                : "No hay vehículos que coincidan con los criterios de búsqueda o filtros seleccionados."}
            </span>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Año</th>
                  <th>Placa / VIN</th>
                  <th>Color</th>
                  <th>Kilometraje</th>
                  <th>Estado</th>
                  <th>Tarifa / Día</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehiculosFiltrados.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <strong>{v.marca} {v.modelo}</strong>
                    </td>
                    <td>{v.anio}</td>
                    <td>
                      <div><code>{v.placa}</code></div>
                      {v.vin && <small style={{ color: "var(--text-secondary)", fontSize: "10px" }}>{v.vin}</small>}
                    </td>
                    <td>{v.color || "-"}</td>
                    <td>{Number(v.kilometraje).toLocaleString()} km</td>
                    <td>
                      <span className={`badge badge-${v.estado.toLowerCase()}`}>
                        {v.estado}
                      </span>
                    </td>
                    <td>
                      <strong>${Number(v.tarifaDiaria).toFixed(2)}</strong>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn-action-edit"
                          onClick={() => editarVehiculo(v)}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => eliminarVehiculo(v.id)}
                        >
                          🗑️ Eliminar
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