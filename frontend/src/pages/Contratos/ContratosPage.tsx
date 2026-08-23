import { useEffect, useMemo, useState } from "react";
import { API_URLS } from "../../services/api";

type Cliente = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  estado: string;
};

type Vehiculo = {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  color: string | null;
  tarifaDiaria: string | number;
  kilometraje: number;
  estado: string;
};

type Contrato = {
  id: number;
  clienteId: number;
  vehiculoId: number;
  fechaInicio: string;
  fechaFin: string;
  tarifaDiaria: string | number;
  deposito: string | number;
  kilometrajeInicial: number;
  kilometrajeFinal: number | null;
  estado: "BORRADOR" | "ACTIVO" | "FINALIZADO" | "CANCELADO";
  observaciones: string | null;
  cliente: Cliente;
  vehiculo: Vehiculo;
  createdAt: string;
};

type FormularioContrato = {
  clienteId: string;
  vehiculoId: string;
  fechaInicio: string;
  fechaFin: string;
  tarifaDiaria: string;
  deposito: string;
  kilometrajeInicial: string;
  estado: "BORRADOR" | "ACTIVO" | "FINALIZADO" | "CANCELADO";
  observaciones: string;
};

const hoy = new Date().toISOString().split("T")[0];
const manana = new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0];

const formularioInicial: FormularioContrato = {
  clienteId: "",
  vehiculoId: "",
  fechaInicio: hoy,
  fechaFin: manana,
  tarifaDiaria: "",
  deposito: "200",
  kilometrajeInicial: "0",
  estado: "ACTIVO",
  observaciones: "",
};

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);

  const [formulario, setFormulario] = useState<FormularioContrato>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const [error, setError] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_CONTRATOS = API_URLS.contratos;

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [resContratos, resClientes, resVehiculos] = await Promise.all([
        fetch(API_CONTRATOS),
        fetch(API_URLS.clientes),
        fetch(API_URLS.vehiculos),
      ]);

      if (!resContratos.ok || !resClientes.ok || !resVehiculos.ok) {
        throw new Error("No fue posible cargar la información de contratos.");
      }

      const [datosContratos, datosClientes, datosVehiculos] = await Promise.all([
        resContratos.json(),
        resClientes.json(),
        resVehiculos.json(),
      ]);

      setContratos(datosContratos);
      setClientes(datosClientes);
      setVehiculos(datosVehiculos);
    } catch (err) {
      console.error(err);
      setError("No fue posible conectar con el servidor para cargar contratos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Estadísticas en tiempo real
  const stats = useMemo(() => {
    const total = contratos.length;
    const activos = contratos.filter((c) => c.estado === "ACTIVO").length;
    const finalizados = contratos.filter((c) => c.estado === "FINALIZADO").length;
    const borradores = contratos.filter((c) => c.estado === "BORRADOR").length;
    return { total, activos, finalizados, borradores };
  }, [contratos]);

  // Filtrado y búsqueda instantánea
  const contratosFiltrados = useMemo(() => {
    return contratos.filter((c) => {
      const cumpleFiltroEstado =
        filtroEstado === "TODOS" || c.estado === filtroEstado;

      const texto = `${c.id} ${c.cliente?.nombre || ""} ${c.cliente?.apellido || ""} ${c.vehiculo?.marca || ""} ${c.vehiculo?.modelo || ""} ${c.vehiculo?.placa || ""}`.toLowerCase();
      const cumpleBusqueda = texto.includes(busqueda.toLowerCase());

      return cumpleFiltroEstado && cumpleBusqueda;
    });
  }, [contratos, busqueda, filtroEstado]);

  // Cálculo automático de días y total estimado
  const diasCalculados = useMemo(() => {
    if (!formulario.fechaInicio || !formulario.fechaFin) return 1;
    const inicio = new Date(formulario.fechaInicio).getTime();
    const fin = new Date(formulario.fechaFin).getTime();
    if (fin <= inicio) return 1;
    const diff = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [formulario.fechaInicio, formulario.fechaFin]);

  const totalEstimado = useMemo(() => {
    const tarifa = Number(formulario.tarifaDiaria) || 0;
    return (diasCalculados * tarifa).toFixed(2);
  }, [diasCalculados, formulario.tarifaDiaria]);

  const handleSeleccionarVehiculo = (vehiculoIdStr: string) => {
    const v = vehiculos.find((item) => item.id === Number(vehiculoIdStr));
    setFormulario((actual) => ({
      ...actual,
      vehiculoId: vehiculoIdStr,
      tarifaDiaria: v ? String(v.tarifaDiaria) : actual.tarifaDiaria,
      kilometrajeInicial: v ? String(v.kilometraje) : actual.kilometrajeInicial,
    }));
  };

  const validarFormulario = () => {
    setErrorFormulario("");

    if (!formulario.clienteId) {
      setErrorFormulario("Debe seleccionar un cliente.");
      return false;
    }
    if (!formulario.vehiculoId) {
      setErrorFormulario("Debe seleccionar un vehículo.");
      return false;
    }
    if (!formulario.fechaInicio) {
      setErrorFormulario("La fecha de inicio es requerida.");
      return false;
    }
    if (!formulario.fechaFin) {
      setErrorFormulario("La fecha de entrega/fin es requerida.");
      return false;
    }
    if (new Date(formulario.fechaFin) <= new Date(formulario.fechaInicio)) {
      setErrorFormulario("La fecha de fin debe ser posterior a la fecha de inicio.");
      return false;
    }
    if (!formulario.tarifaDiaria || Number(formulario.tarifaDiaria) <= 0) {
      setErrorFormulario("La tarifa diaria debe ser mayor a 0.");
      return false;
    }
    if (Number(formulario.deposito) < 0) {
      setErrorFormulario("El depósito no puede ser negativo.");
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

  const guardarContrato = async () => {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensaje("");

      const datos = {
        clienteId: Number(formulario.clienteId),
        vehiculoId: Number(formulario.vehiculoId),
        fechaInicio: new Date(formulario.fechaInicio).toISOString(),
        fechaFin: new Date(formulario.fechaFin).toISOString(),
        tarifaDiaria: Number(formulario.tarifaDiaria),
        deposito: Number(formulario.deposito),
        kilometrajeInicial: Number(formulario.kilometrajeInicial),
        estado: formulario.estado,
        observaciones: formulario.observaciones.trim() || undefined,
      };

      const url = editandoId === null ? API_CONTRATOS : `${API_CONTRATOS}/${editandoId}`;
      const metodo = editandoId === null ? "POST" : "PUT";

      const respuesta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          resultado?.error || resultado?.message || "No fue posible guardar el contrato."
        );
      }

      setMensaje(
        editandoId === null
          ? "✅ Contrato de renta formalizado con éxito."
          : "✅ Contrato actualizado correctamente."
      );

      limpiarFormulario();
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setErrorFormulario(
        err instanceof Error ? err.message : "Error al guardar el contrato."
      );
    } finally {
      setGuardando(false);
    }
  };

  const finalizarRenta = async (contrato: Contrato) => {
    const kmFinal = window.prompt(
      `Kilometraje actual al recibir el vehículo (${contrato.vehiculo.marca} ${contrato.vehiculo.modelo}):`,
      String(contrato.vehiculo.kilometraje + 50)
    );

    if (kmFinal === null) return;

    try {
      setError("");
      setMensaje("");

      const respuesta = await fetch(`${API_CONTRATOS}/${contrato.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "FINALIZADO",
          kilometrajeFinal: Number(kmFinal),
        }),
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => null);
        throw new Error(errorData?.error || "Error al finalizar renta.");
      }

      setMensaje(`🏁 Contrato #${contrato.id} finalizado y vehículo liberado a DISPONIBLE.`);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No fue posible finalizar el contrato.");
    }
  };

  const eliminarContrato = async (id: number) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea anular/eliminar este contrato? El vehículo volverá a estar disponible."
    );
    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      const respuesta = await fetch(`${API_CONTRATOS}/${id}`, {
        method: "DELETE",
      });

      if (!respuesta.ok) {
        throw new Error("No fue posible eliminar el contrato.");
      }

      setMensaje("🗑️ Contrato eliminado y vehículo liberado.");
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al eliminar contrato.");
    }
  };

  const vehiculosDisponibles = useMemo(() => {
    return vehiculos.filter(
      (v) => v.estado === "DISPONIBLE" || (editandoId !== null && String(v.id) === formulario.vehiculoId)
    );
  }, [vehiculos, editandoId, formulario.vehiculoId]);

  return (
    <div className="contratos-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Contratos y Reservas</h1>
          <p>Genera y administra los alquileres, cálculos de tarifas y devoluciones.</p>
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
          {mostrarFormulario && editandoId === null ? "Cerrar Formulario" : "+ Nuevo Contrato"}
        </button>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <span className="stat-label">Total Contratos</span>
            <strong className="stat-value">{stats.total}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rented">🔑</div>
          <div className="stat-info">
            <span className="stat-label">Rentas Activas</span>
            <strong className="stat-value">{stats.activos}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon available">🏁</div>
          <div className="stat-info">
            <span className="stat-label">Finalizados</span>
            <strong className="stat-value">{stats.finalizados}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon maintenance">📝</div>
          <div className="stat-info">
            <span className="stat-label">Borradores / Reservas</span>
            <strong className="stat-value">{stats.borradores}</strong>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Formulario de Contrato */}
      {mostrarFormulario && (
        <section className="content-panel" id="formulario-contrato">
          <div className="panel-header">
            <h2>{editandoId === null ? "Generar Nuevo Contrato de Renta" : "Modificar Contrato"}</h2>
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
              guardarContrato();
            }}
          >
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="clienteId">Cliente *</label>
                <select
                  id="clienteId"
                  value={formulario.clienteId}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, clienteId: e.target.value }))
                  }
                  required
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {clientes
                    .filter((c) => c.estado !== "BLOQUEADO")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellido} ({c.telefono})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="vehiculoId">Vehículo a Rentar *</label>
                <select
                  id="vehiculoId"
                  value={formulario.vehiculoId}
                  onChange={(e) => handleSeleccionarVehiculo(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Vehículo --</option>
                  {vehiculosDisponibles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} {v.anio} • Placa: {v.placa} (${Number(v.tarifaDiaria)}/día)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="estadoContrato">Estado del Contrato *</label>
                <select
                  id="estadoContrato"
                  value={formulario.estado}
                  onChange={(e) =>
                    setFormulario((prev) => ({
                      ...prev,
                      estado: e.target.value as "BORRADOR" | "ACTIVO" | "FINALIZADO" | "CANCELADO",
                    }))
                  }
                  required
                >
                  <option value="ACTIVO">Activo (Vehículo en posesión del cliente)</option>
                  <option value="BORRADOR">Borrador / Reserva preliminar</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="fechaInicio">Fecha de Inicio *</label>
                <input
                  id="fechaInicio"
                  type="date"
                  value={formulario.fechaInicio}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, fechaInicio: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="fechaFin">Fecha de Devolución Estimada *</label>
                <input
                  id="fechaFin"
                  type="date"
                  value={formulario.fechaFin}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, fechaFin: e.target.value }))
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
                  placeholder="Tarifa por día"
                  value={formulario.tarifaDiaria}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, tarifaDiaria: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="deposito">Depósito de Garantía *</label>
                <input
                  id="deposito"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Monto de depósito"
                  value={formulario.deposito}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, deposito: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="kilometrajeInicial">Kilometraje de Salida (km)</label>
                <input
                  id="kilometrajeInicial"
                  type="number"
                  min="0"
                  value={formulario.kilometrajeInicial}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, kilometrajeInicial: e.target.value }))
                  }
                  required
                />
              </div>

              {/* Resumen Calculado de la Renta */}
              <div
                style={{
                  gridColumn: "span 3",
                  background: "var(--primary-soft)",
                  padding: "16px 20px",
                  borderRadius: "10px",
                  border: "1px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <strong style={{ color: "var(--primary)", fontSize: "14px" }}>
                    Resumen Estimado: {diasCalculados} {diasCalculados === 1 ? "día" : "días"} de renta
                  </strong>
                  <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "2px" }}>
                    Tarifa diaria: ${Number(formulario.tarifaDiaria || 0).toFixed(2)} • Depósito: ${Number(formulario.deposito || 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>
                    Total Alquiler Estimado:
                  </span>
                  <strong style={{ fontSize: "22px", color: "var(--primary)" }}>
                    ${totalEstimado}
                  </strong>
                </div>
              </div>

              <div className="form-field" style={{ gridColumn: "span 3" }}>
                <label htmlFor="observaciones">Observaciones / Condiciones Especiales</label>
                <input
                  id="observaciones"
                  type="text"
                  placeholder="Ej. Combustible lleno al 100%, incluye silla para bebé, etc."
                  value={formulario.observaciones}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, observaciones: e.target.value }))
                  }
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button" disabled={guardando}>
                  {guardando
                    ? "Procesando..."
                    : editandoId === null
                    ? "Emitir Contrato"
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
            placeholder="Buscar por #ID, cliente, vehículo o placa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-estado-contrato" style={{ fontSize: "12px", fontWeight: 600 }}>
            Estado:
          </label>
          <select
            id="filtro-estado-contrato"
            className="filter-select"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Rentas Activas</option>
            <option value="FINALIZADO">Finalizados</option>
            <option value="BORRADOR">Borradores</option>
            <option value="CANCELADO">Cancelados</option>
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

      {/* Tabla de Contratos */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>
            Historial de Contratos{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "13px" }}>
              ({contratosFiltrados.length} de {contratos.length} contratos)
            </span>
          </h2>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando contratos...</strong>
          </div>
        ) : contratosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <strong>No se encontraron contratos</strong>
            <span>
              {contratos.length === 0
                ? "Aún no tienes contratos registrados. Haz clic en '+ Nuevo Contrato' para rentar tu primer vehículo."
                : "No hay contratos que coincidan con la búsqueda o filtro seleccionado."}
            </span>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contrato</th>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Período de Renta</th>
                  <th>Tarifa / Depósito</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contratosFiltrados.map((c) => {
                  const dias = Math.max(
                    1,
                    Math.ceil(
                      (new Date(c.fechaFin).getTime() - new Date(c.fechaInicio).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  );
                  const total = (dias * Number(c.tarifaDiaria)).toFixed(2);

                  return (
                    <tr key={c.id}>
                      <td>
                        <strong>#{c.id}</strong>
                      </td>
                      <td>
                        <strong>{c.cliente?.nombre} {c.cliente?.apellido}</strong>
                        <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                          {c.cliente?.telefono}
                        </div>
                      </td>
                      <td>
                        <strong>{c.vehiculo?.marca} {c.vehiculo?.modelo}</strong>
                        <div>
                          <code>{c.vehiculo?.placa}</code>
                        </div>
                      </td>
                      <td>
                        <div>
                          {new Date(c.fechaInicio).toLocaleDateString("es-DO")} ➔{" "}
                          {new Date(c.fechaFin).toLocaleDateString("es-DO")}
                        </div>
                        <small style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                          ({dias} {dias === 1 ? "día" : "días"})
                        </small>
                      </td>
                      <td>
                        <div>
                          <strong>${total}</strong>{" "}
                          <small style={{ color: "var(--text-secondary)" }}>
                            (${Number(c.tarifaDiaria)}/d)
                          </small>
                        </div>
                        <small style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                          Depósito: ${Number(c.deposito)}
                        </small>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            c.estado === "ACTIVO"
                              ? "badge-alquilado"
                              : c.estado === "FINALIZADO"
                              ? "badge-disponible"
                              : "badge-mantenimiento"
                          }`}
                        >
                          {c.estado}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                          {c.estado === "ACTIVO" && (
                            <button
                              type="button"
                              className="btn-action-edit"
                              style={{ background: "var(--success-soft)", borderColor: "#bbf7d0", color: "var(--success)" }}
                              onClick={() => finalizarRenta(c)}
                            >
                              🏁 Finalizar
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => eliminarContrato(c.id)}
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
    </div>
  );
}