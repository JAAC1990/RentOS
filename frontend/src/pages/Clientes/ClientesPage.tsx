/**
 * ============================================================================
 * RentOS - Directorio de Clientes y Buró de Crédito (ClientesPage)
 * ============================================================================
 * Gestión de la base de datos de arrendatarios:
 * - Registro con validación de teléfono internacional (PhoneInput) y correo.
 * - Módulo de Verificación Crediticia (Scoring de Riesgo y Buró de Renta).
 * - Control de listas negras y bloqueo preventivo de usuarios morosos o con historial de siniestros.
 */

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import PhoneInput, { validarTelefono } from "../../components/PhoneInput";
import FechaInput from "../../components/FechaInput";
import { API_URLS } from "../../services/api";

type Cliente = {
  id: number;
  rentCarId?: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string | null;
  direccion: string | null;
  fechaNacimiento: string | null;
  estado: "ACTIVO" | "INACTIVO" | "BLOQUEADO";
  createdAt: string;
};

type FormularioCliente = {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  direccion: string;
  fechaNacimiento: string;
  estado: "ACTIVO" | "INACTIVO" | "BLOQUEADO";
};

type EvaluacionCredito = {
  consultaId: number;
  cliente: string;
  score: number;
  nivelRiesgo: "BAJO" | "MEDIO" | "ALTO";
  resultado: string;
  recomendacion: string;
  referencia: string;
  fechaHora: string;
};

const formularioInicial: FormularioCliente = {
  nombre: "",
  apellido: "",
  telefono: "",
  email: "",
  direccion: "",
  fechaNacimiento: "",
  estado: "ACTIVO",
};

export default function ClientesPage() {
  const { tenantActivoId } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formulario, setFormulario] = useState<FormularioCliente>(formularioInicial);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [clienteScoring, setClienteScoring] = useState<Cliente | null>(null);
  const [evaluacionActual, setEvaluacionActual] = useState<EvaluacionCredito | null>(null);
  const [evaluando, setEvaluando] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const [error, setError] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_URL = API_URLS.clientes;

  const cargarClientes = async () => {
    try {
      setCargando(true);
      setError("");

      const targetTenant = tenantActivoId || 1;
      const respuesta = await fetch(`${API_URL}?rentCarId=${targetTenant}`);
      if (!respuesta.ok) {
        throw new Error("No fue posible obtener los clientes.");
      }

      const datos: Cliente[] = await respuesta.json();
      setClientes(datos.filter((c: Cliente) => !c.rentCarId || c.rentCarId === targetTenant));
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No fue posible conectar con el servidor para cargar clientes."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, [tenantActivoId]);

  // Estadísticas en tiempo real
  const stats = useMemo(() => {
    const total = clientes.length;
    const activos = clientes.filter((c) => c.estado === "ACTIVO").length;
    const inactivos = clientes.filter((c) => c.estado === "INACTIVO").length;
    const bloqueados = clientes.filter((c) => c.estado === "BLOQUEADO").length;

    return { total, activos, inactivos, bloqueados };
  }, [clientes]);

  // Filtrado y búsqueda
  const clientesFiltrados = useMemo(() => {
    return clientes.filter((cliente) => {
      const cumpleFiltroEstado =
        filtroEstado === "TODOS" || cliente.estado === filtroEstado;

      const textoBusqueda = `${cliente.nombre} ${cliente.apellido} ${cliente.telefono} ${cliente.email || ""} ${cliente.direccion || ""}`.toLowerCase();
      const cumpleBusqueda = textoBusqueda.includes(busqueda.toLowerCase());

      return cumpleFiltroEstado && cumpleBusqueda;
    });
  }, [clientes, busqueda, filtroEstado]);

  const validarFormulario = () => {
    setErrorFormulario("");

    if (!formulario.nombre.trim()) {
      setErrorFormulario("El nombre del cliente es obligatorio.");
      return false;
    }
    if (!formulario.apellido.trim()) {
      setErrorFormulario("El apellido del cliente es obligatorio.");
      return false;
    }
    if (!formulario.telefono.trim()) {
      setErrorFormulario("El teléfono de contacto es obligatorio.");
      return false;
    }
    const valTel = validarTelefono(formulario.telefono);
    if (!valTel.valido) {
      setErrorFormulario(valTel.mensajeError || "El teléfono ingresado no es válido.");
      return false;
    }
    if (formulario.email.trim() && !formulario.email.includes("@")) {
      setErrorFormulario("El formato del correo electrónico no es válido.");
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

  const guardarCliente = async () => {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensaje("");

      const datos = {
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        telefono: formulario.telefono.trim(),
        email: formulario.email.trim() || undefined,
        direccion: formulario.direccion.trim() || undefined,
        fechaNacimiento: formulario.fechaNacimiento || undefined,
        estado: formulario.estado,
        rentCarId: tenantActivoId || 1,
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
            "No fue posible guardar el cliente."
        );
      }

      setMensaje(
        editandoId === null
          ? "✅ Cliente registrado exitosamente."
          : "✅ Información del cliente actualizada correctamente."
      );

      limpiarFormulario();
      await cargarClientes();
    } catch (err) {
      console.error(err);
      setErrorFormulario(
        err instanceof Error ? err.message : "Error al guardar el cliente."
      );
    } finally {
      setGuardando(false);
    }
  };

  const editarCliente = (cliente: Cliente) => {
    setEditandoId(cliente.id);
    setFormulario({
      nombre: cliente.nombre ?? "",
      apellido: cliente.apellido ?? "",
      telefono: cliente.telefono ?? "",
      email: cliente.email ?? "",
      direccion: cliente.direccion ?? "",
      fechaNacimiento: cliente.fechaNacimiento
        ? cliente.fechaNacimiento.split("T")[0]
        : "",
      estado: cliente.estado ?? "ACTIVO",
    });
    setErrorFormulario("");
    setMostrarFormulario(true);
  };

  const eliminarCliente = async (id: number) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea eliminar este cliente?"
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
            "No fue posible eliminar el cliente."
        );
      }

      setMensaje(resultado?.mensaje || "🗑️ Cliente eliminado correctamente.");
      if (editandoId === id) limpiarFormulario();
      await cargarClientes();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No fue posible eliminar el cliente."
      );
    }
  };

  const consultarScoring = async (cliente: Cliente) => {
    setClienteScoring(cliente);
    setEvaluacionActual(null);
    setEvaluando(true);

    try {
      const res = await fetch(`${API_URLS.credito}/evaluar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clienteId: cliente.id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al evaluar score.");

      setEvaluacionActual(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al evaluar buró crediticio.");
    } finally {
      setEvaluando(false);
    }
  };

  const alternarBloqueo = async (cliente: Cliente) => {
    const nuevoEstado = cliente.estado === "BLOQUEADO" ? "ACTIVO" : "BLOQUEADO";
    try {
      const res = await fetch(`${API_URL}/${cliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res.ok) throw new Error("Error al actualizar estado.");

      setMensaje(
        nuevoEstado === "BLOQUEADO"
          ? `🚫 ${cliente.nombre} ha sido ingresado a la lista de restricción / morosidad.`
          : `✅ Restricción levantada para ${cliente.nombre}.`
      );

      setClienteScoring(null);
      await cargarClientes();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al modificar estado.");
    }
  };

  const exportarCSV = () => {
    if (clientes.length === 0) return;

    const encabezados = ["ID", "Nombre", "Apellido", "Telefono", "Email", "Direccion", "Estado"];
    const filas = clientes.map((c) => [
      c.id,
      `"${c.nombre}"`,
      `"${c.apellido}"`,
      `"${c.telefono}"`,
      `"${c.email || ""}"`,
      `"${c.direccion || ""}"`,
      c.estado,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [encabezados.join(","), ...filas.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RentOS_Clientes_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getIniciales = (nombre: string, apellido: string) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="clientes-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Gestión de Clientes</h1>
          <p>Administra tu cartera de clientes, historial de rentas y expedientes.</p>
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
            {mostrarFormulario && editandoId === null ? "Cerrar Formulario" : "+ Nuevo Cliente"}
          </button>
        </div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-label">Total Clientes</span>
            <strong className="stat-value">{stats.total}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon available">✓</div>
          <div className="stat-info">
            <span className="stat-label">Activos</span>
            <strong className="stat-value">{stats.activos}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rented">⏸</div>
          <div className="stat-info">
            <span className="stat-label">Inactivos</span>
            <strong className="stat-value">{stats.inactivos}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon maintenance">🚫</div>
          <div className="stat-info">
            <span className="stat-label">Bloqueados / Morosos</span>
            <strong className="stat-value">{stats.bloqueados}</strong>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Formulario de Cliente */}
      {mostrarFormulario && (
        <section className="content-panel" id="formulario-cliente">
          <div className="panel-header">
            <h2>{editandoId === null ? "Registrar Nuevo Cliente" : "Editar Información del Cliente"}</h2>
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
              guardarCliente();
            }}
          >
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  id="nombre"
                  type="text"
                  placeholder="Ej. Carlos"
                  value={formulario.nombre}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="apellido">Apellido *</label>
                <input
                  id="apellido"
                  type="text"
                  placeholder="Ej. García"
                  value={formulario.apellido}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, apellido: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="telefono">Teléfono / WhatsApp *</label>
                <PhoneInput
                  id="telefono"
                  value={formulario.telefono}
                  onChange={(val) => setFormulario((prev) => ({ ...prev, telefono: val }))}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  id="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={formulario.email}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="fechaNacimiento">Fecha de Nacimiento (DD/MM/AAAA)</label>
                <FechaInput
                  id="fechaNacimiento"
                  value={formulario.fechaNacimiento}
                  onChange={(iso) =>
                    setFormulario((prev) => ({
                      ...prev,
                      fechaNacimiento: iso,
                    }))
                  }
                  placeholder="DD/MM/AAAA"
                />
              </div>

              <div className="form-field">
                <label htmlFor="estado">Estado del Cliente *</label>
                <select
                  id="estado"
                  value={formulario.estado}
                  onChange={(e) =>
                    setFormulario((prev) => ({
                      ...prev,
                      estado: e.target.value as FormularioCliente["estado"],
                    }))
                  }
                  required
                >
                  <option value="ACTIVO">Activo (Apto para rentar)</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="BLOQUEADO">Bloqueado / Lista de Morosidad</option>
                </select>
              </div>

              <div className="form-field" style={{ gridColumn: "span 3" }}>
                <label htmlFor="direccion">Dirección Residencial</label>
                <input
                  id="direccion"
                  type="text"
                  placeholder="Ej. Calle Principal #12, Santo Domingo, D.N."
                  value={formulario.direccion}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, direccion: e.target.value }))
                  }
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button" disabled={guardando}>
                  {guardando
                    ? "Guardando..."
                    : editandoId === null
                    ? "Registrar Cliente"
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
            placeholder="Buscar por nombre, apellido, teléfono o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-estado-cliente" style={{ fontSize: "12px", fontWeight: 600 }}>
            Estado:
          </label>
          <select
            id="filtro-estado-cliente"
            className="filter-select"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
            <option value="BLOQUEADO">Bloqueados</option>
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

      {/* Tabla de Clientes */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>
            Listado de Clientes{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "13px" }}>
              ({clientesFiltrados.length} de {clientes.length} clientes)
            </span>
          </h2>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando clientes...</strong>
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <strong>No se encontraron clientes</strong>
            <span>
              {clientes.length === 0
                ? "Aún no tienes clientes registrados. Haz clic en '+ Nuevo Cliente' para agregar el primero."
                : "No hay clientes que coincidan con la búsqueda o filtro seleccionado."}
            </span>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Dirección</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <div className="client-info-cell">
                        <div className="client-avatar">
                          {getIniciales(cliente.nombre, cliente.apellido)}
                        </div>
                        <div>
                          <strong>{cliente.nombre} {cliente.apellido}</strong>
                          <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                            ID #{cliente.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{cliente.telefono}</strong>
                      </div>
                      <small style={{ color: "var(--text-secondary)" }}>
                        {cliente.email || <span style={{ color: "var(--text-light)" }}>Sin email</span>}
                      </small>
                    </td>
                    <td>
                      {cliente.direccion ? (
                        <span>{cliente.direccion}</span>
                      ) : (
                        <span style={{ color: "var(--text-light)" }}>No registrada</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          cliente.estado === "ACTIVO"
                            ? "badge-disponible"
                            : cliente.estado === "INACTIVO"
                            ? "badge-mantenimiento"
                            : "badge-inactivo"
                        }`}
                      >
                        {cliente.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn-action-edit"
                          style={{ background: "#e0f2fe", color: "#0369a1", borderColor: "#bae6fd" }}
                          title="Consultar Score Crediticio y Buró"
                          onClick={() => consultarScoring(cliente)}
                        >
                          🔍 Buró Score
                        </button>
                        <button
                          type="button"
                          className="btn-action-edit"
                          onClick={() => editarCliente(cliente)}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => eliminarCliente(cliente.id)}
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

      {/* Modal de Scoring Crediticio & Buró de Riesgo */}
      {clienteScoring && (
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
              maxWidth: "540px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>
                🛡️ Buró de Riesgo & Scoring Crediticio
              </h2>
              <button
                className="secondary-button"
                style={{ padding: "4px 8px" }}
                onClick={() => setClienteScoring(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "16px", padding: "12px", background: "var(--primary-soft)", borderRadius: "8px" }}>
              <strong style={{ fontSize: "14px" }}>
                {clienteScoring.nombre} {clienteScoring.apellido}
              </strong>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Tel: {clienteScoring.telefono} • Estado: <b>{clienteScoring.estado}</b>
              </div>
            </div>

            {evaluando ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>⏳</div>
                <strong>Consultando centrales de riesgo y scoring de RentOS...</strong>
              </div>
            ) : evaluacionActual ? (
              <div>
                {/* Medidor de Score */}
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    borderRadius: "10px",
                    background:
                      evaluacionActual.nivelRiesgo === "BAJO"
                        ? "var(--success-soft)"
                        : evaluacionActual.nivelRiesgo === "MEDIO"
                        ? "var(--warning-soft)"
                        : "var(--danger-soft)",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" }}>
                    Score Crediticio Estimado (300 - 850)
                  </div>
                  <div
                    style={{
                      fontSize: "44px",
                      fontWeight: "900",
                      color:
                        evaluacionActual.nivelRiesgo === "BAJO"
                          ? "var(--success)"
                          : evaluacionActual.nivelRiesgo === "MEDIO"
                          ? "var(--warning)"
                          : "var(--danger)",
                    }}
                  >
                    {evaluacionActual.score}
                  </div>
                  <span
                    className={`badge ${
                      evaluacionActual.nivelRiesgo === "BAJO"
                        ? "badge-disponible"
                        : evaluacionActual.nivelRiesgo === "MEDIO"
                        ? "badge-mantenimiento"
                        : "badge-inactivo"
                    }`}
                  >
                    Nivel de Riesgo: {evaluacionActual.nivelRiesgo}
                  </span>
                </div>

                <div style={{ fontSize: "13px", lineHeight: "1.6", marginBottom: "20px" }}>
                  <div style={{ fontWeight: "bold", marginBottom: "4px" }}>📋 Recomendación del Sistema:</div>
                  <p style={{ margin: "0 0 10px 0", color: "var(--text-secondary)" }}>
                    {evaluacionActual.recomendacion}
                  </p>
                  <small style={{ color: "var(--text-light)" }}>
                    Referencia de auditoría: <code>{evaluacionActual.referencia}</code>
                  </small>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "20px" }}>
                  <button
                    type="button"
                    className="secondary-button"
                    style={{
                      color: clienteScoring.estado === "BLOQUEADO" ? "var(--success)" : "var(--danger)",
                      borderColor: clienteScoring.estado === "BLOQUEADO" ? "var(--success)" : "var(--danger)",
                    }}
                    onClick={() => alternarBloqueo(clienteScoring)}
                  >
                    {clienteScoring.estado === "BLOQUEADO" ? "🔓 Desbloquear Cliente" : "🚫 Bloquear en Lista Negra"}
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setClienteScoring(null)}
                  >
                    Entendido
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
