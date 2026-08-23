import { useEffect, useMemo, useState } from "react";
import { API_URLS } from "../../services/api";

type Defecto = {
  id: number;
  descripcion: string;
  severidad: string | null;
};

type Entrega = {
  id: number;
  contratoId: number;
  fechaHora: string;
  kilometraje: number;
  nivelCombustible: string | null;
  tieneDefectos: boolean;
  observaciones: string | null;
  defectos?: Defecto[];
  contrato?: {
    id: number;
    kilometrajeInicial: number;
    cliente: {
      nombre: string;
      apellido: string;
      telefono: string;
    };
    vehiculo: {
      marca: string;
      modelo: string;
      placa: string;
      color: string | null;
    };
  };
};

type ContratoActivo = {
  id: number;
  kilometrajeInicial: number;
  cliente: {
    nombre: string;
    apellido: string;
  };
  vehiculo: {
    marca: string;
    modelo: string;
    placa: string;
    kilometraje: number;
  };
};

type FormularioEntrega = {
  contratoId: string;
  kilometraje: string;
  nivelCombustible: string;
  tieneDefectos: boolean;
  descripcionDefectos: string;
  observaciones: string;
};

const formularioInicial: FormularioEntrega = {
  contratoId: "",
  kilometraje: "",
  nivelCombustible: "100% (Lleno)",
  tieneDefectos: false,
  descripcionDefectos: "",
  observaciones: "",
};

export default function EntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [contratosActivos, setContratosActivos] = useState<ContratoActivo[]>([]);

  const [formulario, setFormulario] = useState<FormularioEntrega>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroDefectos, setFiltroDefectos] = useState("TODOS");

  const [error, setError] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_ENTREGAS = API_URLS.entregas;

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [resEntregas, resContratos] = await Promise.all([
        fetch(API_ENTREGAS),
        fetch(API_URLS.contratos),
      ]);

      if (!resEntregas.ok || !resContratos.ok) {
        throw new Error("No fue posible cargar la información de entregas.");
      }

      const [datosEntregas, datosContratos] = await Promise.all([
        resEntregas.json(),
        resContratos.json(),
      ]);

      setEntregas(datosEntregas);

      // Filtrar contratos que están actualmente ACTIVOS (pendientes de devolución)
      const activos = datosContratos.filter((c: { estado: string }) => c.estado === "ACTIVO");
      setContratosActivos(activos);
    } catch (err) {
      console.error(err);
      setError("No fue posible conectar con el servidor para cargar las entregas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Métricas en tiempo real
  const stats = useMemo(() => {
    const total = entregas.length;
    const conDefectos = entregas.filter((e) => e.tieneDefectos).length;
    const enBuenEstado = total - conDefectos;
    const devolucionesPendientes = contratosActivos.length;

    return { total, conDefectos, enBuenEstado, devolucionesPendientes };
  }, [entregas, contratosActivos]);

  // Filtrado y búsqueda
  const entregasFiltradas = useMemo(() => {
    return entregas.filter((e) => {
      const cumpleDefecto =
        filtroDefectos === "TODOS" ||
        (filtroDefectos === "DEFECTO" && e.tieneDefectos) ||
        (filtroDefectos === "PERFECTO" && !e.tieneDefectos);

      const texto = `${e.id} ${e.contratoId} ${e.contrato?.cliente?.nombre || ""} ${e.contrato?.cliente?.apellido || ""} ${e.contrato?.vehiculo?.marca || ""} ${e.contrato?.vehiculo?.placa || ""}`.toLowerCase();
      const cumpleBusqueda = texto.includes(busqueda.toLowerCase());

      return cumpleDefecto && cumpleBusqueda;
    });
  }, [entregas, busqueda, filtroDefectos]);

  const handleSeleccionarContrato = (contratoIdStr: string) => {
    const c = contratosActivos.find((item) => item.id === Number(contratoIdStr));
    const kmSugerido = c ? String(c.vehiculo.kilometraje + 50) : "";

    setFormulario((actual) => ({
      ...actual,
      contratoId: contratoIdStr,
      kilometraje: kmSugerido || actual.kilometraje,
    }));
  };

  const validarFormulario = () => {
    setErrorFormulario("");

    if (!formulario.contratoId) {
      setErrorFormulario("Debe seleccionar un contrato activo.");
      return false;
    }
    if (!formulario.kilometraje || Number(formulario.kilometraje) <= 0) {
      setErrorFormulario("El kilometraje de devolución debe ser mayor a 0.");
      return false;
    }
    if (formulario.tieneDefectos && !formulario.descripcionDefectos.trim()) {
      setErrorFormulario("Por favor describa el defecto o detalle encontrado en el vehículo.");
      return false;
    }

    return true;
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setErrorFormulario("");
    setMostrarFormulario(false);
  };

  const registrarEntrega = async () => {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensaje("");

      const datos = {
        contratoId: Number(formulario.contratoId),
        kilometraje: Number(formulario.kilometraje),
        nivelCombustible: formulario.nivelCombustible,
        tieneDefectos: formulario.tieneDefectos,
        descripcionDefectos: formulario.tieneDefectos ? formulario.descripcionDefectos.trim() : undefined,
        observaciones: formulario.observaciones.trim() || undefined,
      };

      const respuesta = await fetch(API_ENTREGAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          resultado?.error || resultado?.message || "No fue posible registrar la entrega."
        );
      }

      setMensaje("✅ Devolución e inspección registrada exitosamente. El vehículo ha sido liberado a DISPONIBLE.");
      limpiarFormulario();
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setErrorFormulario(
        err instanceof Error ? err.message : "Error al registrar la entrega."
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="entregas-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Inspección y Devoluciones de Flota</h1>
          <p>Control de check-in / check-out, verificación de kilometraje, combustible y registro de defectos.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            if (mostrarFormulario) {
              setMostrarFormulario(false);
            } else {
              limpiarFormulario();
              setMostrarFormulario(true);
            }
          }}
        >
          {mostrarFormulario ? "Cerrar Formulario" : "+ Recibir Vehículo / Devolución"}
        </button>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon rented">🔑</div>
          <div className="stat-info">
            <span className="stat-label">Pendientes de Devolución</span>
            <strong className="stat-value" style={{ color: "var(--primary)" }}>
              {stats.devolucionesPendientes}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon available">✅</div>
          <div className="stat-info">
            <span className="stat-label">En Perfecto Estado</span>
            <strong className="stat-value">{stats.enBuenEstado}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon maintenance">⚠️</div>
          <div className="stat-info">
            <span className="stat-label">Con Defectos / Daños</span>
            <strong className="stat-value" style={{ color: "var(--warning)" }}>
              {stats.conDefectos}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-label">Total Inspecciones</span>
            <strong className="stat-value">{stats.total}</strong>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Formulario de Devolución */}
      {mostrarFormulario && (
        <section className="content-panel" id="formulario-entrega">
          <div className="panel-header">
            <h2>Inspección de Devolución de Vehículo</h2>
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
              registrarEntrega();
            }}
          >
            <div className="form-grid">
              <div className="form-field" style={{ gridColumn: "span 2" }}>
                <label htmlFor="contratoId">Contrato de Alquiler Activo *</label>
                <select
                  id="contratoId"
                  value={formulario.contratoId}
                  onChange={(e) => handleSeleccionarContrato(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Contrato Activo --</option>
                  {contratosActivos.map((c) => (
                    <option key={c.id} value={c.id}>
                      Contrato #{c.id} • {c.cliente.nombre} {c.cliente.apellido} — {c.vehiculo.marca} {c.vehiculo.modelo} ({c.vehiculo.placa})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="kilometraje">Kilometraje al Recibir (km) *</label>
                <input
                  id="kilometraje"
                  type="number"
                  min="1"
                  placeholder="Ej. 15450"
                  value={formulario.kilometraje}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, kilometraje: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="nivelCombustible">Nivel de Combustible *</label>
                <select
                  id="nivelCombustible"
                  value={formulario.nivelCombustible}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, nivelCombustible: e.target.value }))
                  }
                  required
                >
                  <option value="100% (Lleno)">⛽ 100% (Tanque Lleno)</option>
                  <option value="75% (3/4)">⛽ 75% (3/4 Tanque)</option>
                  <option value="50% (1/2)">⛽ 50% (1/2 Tanque)</option>
                  <option value="25% (1/4)">⛽ 25% (1/4 Tanque)</option>
                  <option value="Reserva (Vacío)">⚠️ Reserva / Vacío</option>
                </select>
              </div>

              <div className="form-field" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", marginTop: "24px" }}>
                <input
                  id="tieneDefectos"
                  type="checkbox"
                  style={{ width: "18px", height: "18px" }}
                  checked={formulario.tieneDefectos}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, tieneDefectos: e.target.checked }))
                  }
                />
                <label htmlFor="tieneDefectos" style={{ cursor: "pointer", fontWeight: 700, color: formulario.tieneDefectos ? "var(--danger)" : "inherit" }}>
                  ¿El vehículo presenta rayones, golpes o defectos nuevos?
                </label>
              </div>

              {formulario.tieneDefectos && (
                <div className="form-field" style={{ gridColumn: "span 3" }}>
                  <label htmlFor="descripcionDefectos" style={{ color: "var(--danger)" }}>
                    Descripción del Daño / Defecto Detectado *
                  </label>
                  <input
                    id="descripcionDefectos"
                    type="text"
                    placeholder="Ej. Rayón en la puerta trasera derecha, falta antena, etc."
                    value={formulario.descripcionDefectos}
                    onChange={(e) =>
                      setFormulario((prev) => ({ ...prev, descripcionDefectos: e.target.value }))
                    }
                    required
                  />
                </div>
              )}

              <div className="form-field" style={{ gridColumn: "span 3" }}>
                <label htmlFor="observaciones">Observaciones de Inspección</label>
                <input
                  id="observaciones"
                  type="text"
                  placeholder="Ej. Llaves recibidas, interior limpio, sin objetos olvidados."
                  value={formulario.observaciones}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, observaciones: e.target.value }))
                  }
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button" disabled={guardando}>
                  {guardando ? "Registrando Devolución..." : "Completar Inspección y Liberar Vehículo"}
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
            placeholder="Buscar por #ID, contrato, cliente o placa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-defectos" style={{ fontSize: "12px", fontWeight: 600 }}>
            Estado Inspección:
          </label>
          <select
            id="filtro-defectos"
            className="filter-select"
            value={filtroDefectos}
            onChange={(e) => setFiltroDefectos(e.target.value)}
          >
            <option value="TODOS">Todos los registros</option>
            <option value="PERFECTO">Sin defectos (Perfecto)</option>
            <option value="DEFECTO">Con defectos reportados</option>
          </select>

          {(busqueda || filtroDefectos !== "TODOS") && (
            <button
              className="secondary-button"
              style={{ padding: "8px 12px", fontSize: "12px" }}
              onClick={() => {
                setBusqueda("");
                setFiltroDefectos("TODOS");
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Entregas */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>
            Historial de Devoluciones e Inspecciones{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "13px" }}>
              ({entregasFiltradas.length} de {entregas.length} inspecciones)
            </span>
          </h2>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando inspecciones...</strong>
          </div>
        ) : entregasFiltradas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔑</div>
            <strong>No hay inspecciones registradas</strong>
            <span>
              {entregas.length === 0
                ? "Cuando los clientes devuelvan los vehículos rentados, registra aquí el estado para liberar el auto."
                : "No hay inspecciones que coincidan con la búsqueda o filtro."}
            </span>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Inspección</th>
                  <th>Fecha y Hora</th>
                  <th>Contrato / Cliente</th>
                  <th>Vehículo</th>
                  <th>Kilometraje Final</th>
                  <th>Combustible</th>
                  <th>Condición / Defectos</th>
                </tr>
              </thead>
              <tbody>
                {entregasFiltradas.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>#{e.id}</strong>
                    </td>
                    <td>
                      {new Date(e.fechaHora).toLocaleDateString("es-DO")}{" "}
                      <small style={{ color: "var(--text-secondary)" }}>
                        {new Date(e.fechaHora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </small>
                    </td>
                    <td>
                      <div>
                        <strong>Contrato #{e.contratoId}</strong>
                      </div>
                      <small style={{ color: "var(--text-secondary)" }}>
                        {e.contrato?.cliente ? `${e.contrato.cliente.nombre} ${e.contrato.cliente.apellido}` : "-"}
                      </small>
                    </td>
                    <td>
                      {e.contrato?.vehiculo ? (
                        <div>
                          <span>{e.contrato.vehiculo.marca} {e.contrato.vehiculo.modelo}</span>
                          <div><code>{e.contrato.vehiculo.placa}</code></div>
                        </div>
                      ) : "-"}
                    </td>
                    <td>
                      <strong>{Number(e.kilometraje).toLocaleString()} km</strong>
                    </td>
                    <td>
                      <span>{e.nivelCombustible || "100%"}</span>
                    </td>
                    <td>
                      {e.tieneDefectos ? (
                        <div>
                          <span className="badge badge-mantenimiento">
                            ⚠️ Con Defectos
                          </span>
                          {e.defectos && e.defectos.length > 0 && (
                            <div style={{ fontSize: "11px", color: "var(--danger)", marginTop: "4px" }}>
                              {e.defectos.map((d) => d.descripcion).join(", ")}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="badge badge-disponible">
                          ✅ Perfecto Estado
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
    </div>
  );
}