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
  estado: string;
  tarifaDiaria: string;
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
  seguroPoliza: "Seguros Universal #UN-2026",
  seguroVencimiento: "",
  marbeteVencimiento: "",
};

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [formulario, setFormulario] = useState<FormularioVehiculo>(formularioInicial);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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

      const [resVehiculos, resVencimientos] = await Promise.all([
        fetch(API_URL),
        fetch(`${API_URL}/vencimientos`),
      ]);

      if (!resVehiculos.ok) {
        throw new Error("No fue posible obtener los vehículos.");
      }

      const datosVehiculos: Vehiculo[] = await resVehiculos.json();
      setVehiculos(datosVehiculos);

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
    return vehiculos.filter((vehiculo) => {
      const cumpleFiltroEstado =
        filtroEstado === "TODOS" || vehiculo.estado === filtroEstado;

      const textoBusqueda = `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.placa} ${vehiculo.vin ?? ""} ${vehiculo.color ?? ""}`.toLowerCase();
      const cumpleBusqueda = textoBusqueda.includes(busqueda.toLowerCase());

      return cumpleFiltroEstado && cumpleBusqueda;
    });
  }, [vehiculos, busqueda, filtroEstado]);

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
    if (!formulario.placa.trim()) {
      setErrorFormulario("La placa es obligatoria.");
      return false;
    }

    const anio = Number(formulario.anio);
    if (!anio || anio < 1990 || anio > new Date().getFullYear() + 2) {
      setErrorFormulario("El año debe ser un valor válido.");
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

      const datos = {
        marca: formulario.marca.trim(),
        modelo: formulario.modelo.trim(),
        anio: Number(formulario.anio),
        color: formulario.color.trim() || undefined,
        placa: formulario.placa.trim(),
        vin: formulario.vin.trim() || undefined,
        kilometraje: Number(formulario.kilometraje),
        tarifaDiaria: Number(formulario.tarifaDiaria),
        estado: formulario.estado,
        seguroPoliza: formulario.seguroPoliza.trim() || undefined,
        seguroVencimiento: formulario.seguroVencimiento || undefined,
        marbeteVencimiento: formulario.marbeteVencimiento || undefined,
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

  const exportarCSV = () => {
    if (vehiculos.length === 0) return;

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
      "Tarifa Diaria",
      "Seguro Poliza",
      "Vencimiento Seguro",
    ];
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
      `"${v.seguroPoliza || ""}"`,
      v.seguroVencimiento ? new Date(v.seguroVencimiento).toLocaleDateString("es-DO") : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [encabezados.join(","), ...filas.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `RentOS_Vehiculos_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="vehiculos-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Gestión de Flota & Vehículos</h1>
          <p>Administra la flota, tarifas, estados, pólizas de seguros y vencimientos legales.</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
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

      {/* Formulario de Vehículo */}
      {mostrarFormulario && (
        <section className="content-panel" id="formulario-vehiculo">
          <div className="panel-header">
            <h2>{editandoId === null ? "Registrar Nuevo Vehículo" : "Editar Vehículo"}</h2>
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

              <div className="form-field">
                <label htmlFor="anio">Año *</label>
                <input
                  id="anio"
                  type="number"
                  placeholder="2024"
                  min="1990"
                  max={new Date().getFullYear() + 2}
                  value={formulario.anio}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, anio: e.target.value }))
                  }
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

              <div className="form-field">
                <label htmlFor="placa">Placa / Matrícula *</label>
                <input
                  id="placa"
                  type="text"
                  placeholder="Ej. A123456"
                  value={formulario.placa}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, placa: e.target.value }))
                  }
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

              <div className="form-field">
                <label htmlFor="tarifaDiaria">Tarifa Diaria (USD / DOP) *</label>
                <input
                  id="tarifaDiaria"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={formulario.tarifaDiaria}
                  onChange={(e) =>
                    setFormulario((prev) => ({
                      ...prev,
                      tarifaDiaria: e.target.value,
                    }))
                  }
                  required
                />
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

              {/* SECCIÓN DOCUMENTOS LEGALES */}
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
                <label htmlFor="seguroVencimiento">Vencimiento del Seguro</label>
                <input
                  id="seguroVencimiento"
                  type="date"
                  value={formulario.seguroVencimiento}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, seguroVencimiento: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="marbeteVencimiento">Vencimiento de Marbete</label>
                <input
                  id="marbeteVencimiento"
                  type="date"
                  value={formulario.marbeteVencimiento}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, marbeteVencimiento: e.target.value }))
                  }
                />
              </div>

              <div className="form-actions">
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

      {/* Tabla de Vehículos */}
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
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando vehículos...</strong>
          </div>
        ) : vehiculosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚗</div>
            <strong>No se encontraron vehículos</strong>
            <span>
              {vehiculos.length === 0
                ? "Aún no tienes vehículos registrados. Haz clic en '+ Nuevo Vehículo' para agregar el primero."
                : "No hay vehículos que coincidan con la búsqueda o filtro seleccionado."}
            </span>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Placa / Chasis</th>
                  <th>Odómetro</th>
                  <th>Tarifa Diaria</th>
                  <th>Seguro / Póliza</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehiculosFiltrados.map((vehiculo) => {
                  const rep = reporteVencimientos.find((r) => r.id === vehiculo.id);

                  return (
                    <tr key={vehiculo.id}>
                      <td>
                        <div className="vehicle-info-cell">
                          <div>
                            <strong>
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
                          <code>{vehiculo.placa}</code>
                        </div>
                        <small style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                          {vehiculo.vin ? `VIN: ${vehiculo.vin}` : "Sin VIN"}
                        </small>
                      </td>
                      <td>
                        <strong>{vehiculo.kilometraje.toLocaleString()} km</strong>
                      </td>
                      <td>
                        <strong>${Number(vehiculo.tarifaDiaria).toFixed(2)}</strong>
                        <small style={{ color: "var(--text-secondary)" }}> / día</small>
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
                            onClick={() => editarVehiculo(vehiculo)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => eliminarVehiculo(vehiculo.id)}
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
                  🛡️ Monitor de Seguros & Vencimientos de Flota
                </h2>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Auditoría legal de pólizas de seguro, marbetes e inspecciones técnicas.
                </span>
              </div>
              <button
                className="secondary-button"
                style={{ padding: "4px 8px" }}
                onClick={() => setMostrarMonitorVencimientos(false)}
              >
                ✕
              </button>
            </div>

            {/* Tarjetas de Semáforo */}
            {resumenVencimientos && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                <div style={{ padding: "12px", background: "var(--danger-soft)", borderRadius: "8px", border: "1px solid #fecaca" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--danger)" }}>🔴 SEGUROS VENCIDOS</span>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "var(--danger)", marginTop: "2px" }}>
                    {resumenVencimientos.vencidos} autos
                  </div>
                </div>

                <div style={{ padding: "12px", background: "var(--warning-soft)", borderRadius: "8px", border: "1px solid #fde68a" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--warning)" }}>🟡 POR VENCER (&lt;30d)</span>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "var(--warning)", marginTop: "2px" }}>
                    {resumenVencimientos.porVencer} autos
                  </div>
                </div>

                <div style={{ padding: "12px", background: "var(--success-soft)", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--success)" }}>🟢 PÓLIZAS AL DÍA</span>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: "var(--success)", marginTop: "2px" }}>
                    {resumenVencimientos.alDia} autos
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de Vencimientos */}
            <div className="table-container" style={{ marginBottom: "20px" }}>
              <table className="data-table" style={{ fontSize: "12px" }}>
                <thead>
                  <tr>
                    <th>Vehículo</th>
                    <th>Póliza de Seguro</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteVencimientos.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.marca} {r.modelo}</strong> (<code>{r.placa}</code>)
                      </td>
                      <td>{r.seguroPoliza}</td>
                      <td>
                        {r.seguroVencimiento
                          ? new Date(r.seguroVencimiento).toLocaleDateString("es-DO")
                          : "Sin fecha"}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            r.estadoSeguro === "AL_DIA"
                              ? "badge-disponible"
                              : r.estadoSeguro === "POR_VENCER"
                              ? "badge-mantenimiento"
                              : "badge-inactivo"
                          }`}
                        >
                          {r.estadoSeguro === "AL_DIA"
                            ? "🟢 Vigente"
                            : r.estadoSeguro === "POR_VENCER"
                            ? `🟡 Vence en ${r.diasRestantesSeguro}d`
                            : "🔴 Vencido"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Botones del Modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                className="secondary-button"
                style={{ borderColor: "#38bdf8", color: "#0284c7" }}
                onClick={enviarAlertaTelegram}
                disabled={notificandoTelegram}
              >
                {notificandoTelegram ? "⏳ Enviando..." : "📲 Enviar Auditoría a Telegram"}
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() => setMostrarMonitorVencimientos(false)}
              >
                Cerrar Monitor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}