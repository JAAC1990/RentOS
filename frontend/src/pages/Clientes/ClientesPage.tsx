import { useEffect, useMemo, useState } from "react";
import { API_URLS } from "../../services/api";

type Documento = {
  id: number;
  tipo: string;
  numero: string | null;
  nombreArchivo: string;
};

type Contrato = {
  id: number;
  estado: string;
  vehiculo: {
    marca: string;
    modelo: string;
    placa: string;
  };
};

type Cliente = {
  id: number;
  rentCarId: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string | null;
  direccion: string | null;
  fechaNacimiento: string | null;
  estado: "ACTIVO" | "INACTIVO" | "BLOQUEADO";
  documentos?: Documento[];
  contratos?: Contrato[];
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
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [formulario, setFormulario] = useState<FormularioCliente>(formularioInicial);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

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

      const respuesta = await fetch(API_URL);

      if (!respuesta.ok) {
        throw new Error("No fue posible cargar los clientes.");
      }

      const datos = await respuesta.json();
      setClientes(datos);
    } catch (err) {
      console.error(err);
      setError(
        "No se pudieron cargar los clientes. Verifique la conexión con el servidor de RentOS."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  // Estadísticas calculadas en tiempo real
  const stats = useMemo(() => {
    const total = clientes.length;
    const activos = clientes.filter((c) => c.estado === "ACTIVO").length;
    const inactivos = clientes.filter((c) => c.estado === "INACTIVO").length;
    const bloqueados = clientes.filter((c) => c.estado === "BLOQUEADO").length;
    return { total, activos, inactivos, bloqueados };
  }, [clientes]);

  // Filtrado y búsqueda instantánea
  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      const cumpleFiltroEstado =
        filtroEstado === "TODOS" || c.estado === filtroEstado;

      const texto = `${c.nombre} ${c.apellido} ${c.telefono} ${c.email || ""} ${c.direccion || ""}`.toLowerCase();
      const cumpleBusqueda = texto.includes(busqueda.toLowerCase());

      return cumpleFiltroEstado && cumpleBusqueda;
    });
  }, [clientes, busqueda, filtroEstado]);

  const actualizarCampo = (campo: keyof FormularioCliente, valor: string) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
    setErrorFormulario("");
    setMensaje("");
  };

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
      setErrorFormulario("El número de teléfono es obligatorio.");
      return false;
    }

    if (formulario.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formulario.email.trim())) {
        setErrorFormulario("El correo electrónico no tiene un formato válido.");
        return false;
      }
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
    setMostrarFormulario(true);
    setErrorFormulario("");
    setMensaje("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarCliente = async (id: number) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea eliminar/desactivar este cliente?"
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
          <div className="stat-icon available">✅</div>
          <div className="stat-info">
            <span className="stat-label">Clientes Activos</span>
            <strong className="stat-value">{stats.activos}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏸️</div>
          <div className="stat-info">
            <span className="stat-label">Inactivos</span>
            <strong className="stat-value">{stats.inactivos}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon maintenance">⚠️</div>
          <div className="stat-info">
            <span className="stat-label">Bloqueados</span>
            <strong className="stat-value">{stats.bloqueados}</strong>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Formulario de Creación / Edición */}
      {mostrarFormulario && (
        <section className="content-panel" id="formulario-cliente">
          <div className="panel-header">
            <h2>{editandoId === null ? "Registrar Nuevo Cliente" : "Editar Datos del Cliente"}</h2>
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
                  placeholder="Ej. Juan, María, Carlos"
                  value={formulario.nombre}
                  onChange={(e) => actualizarCampo("nombre", e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="apellido">Apellido *</label>
                <input
                  id="apellido"
                  type="text"
                  placeholder="Ej. Pérez, Gómez, Rodríguez"
                  value={formulario.apellido}
                  onChange={(e) => actualizarCampo("apellido", e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="telefono">Teléfono (WhatsApp) *</label>
                <input
                  id="telefono"
                  type="tel"
                  placeholder="Ej. 809-555-0123"
                  value={formulario.telefono}
                  onChange={(e) => actualizarCampo("telefono", e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  id="email"
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  value={formulario.email}
                  onChange={(e) => actualizarCampo("email", e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="direccion">Dirección / Ciudad</label>
                <input
                  id="direccion"
                  type="text"
                  placeholder="Ej. Piantini, Santo Domingo"
                  value={formulario.direccion}
                  onChange={(e) => actualizarCampo("direccion", e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="fechaNacimiento">Fecha de Nacimiento</label>
                <input
                  id="fechaNacimiento"
                  type="date"
                  value={formulario.fechaNacimiento}
                  onChange={(e) => actualizarCampo("fechaNacimiento", e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="estado">Estado del Cliente *</label>
                <select
                  id="estado"
                  value={formulario.estado}
                  onChange={(e) =>
                    actualizarCampo("estado", e.target.value as "ACTIVO" | "INACTIVO" | "BLOQUEADO")
                  }
                  required
                >
                  <option value="ACTIVO">Activo (Apto para alquiler)</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="BLOQUEADO">Bloqueado (No alquilar)</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button" disabled={guardando}>
                  {guardando
                    ? "Guardando..."
                    : editandoId === null
                    ? "Guardar Cliente"
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
            placeholder="Buscar por nombre, teléfono o email..."
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
            Cartera de Clientes{" "}
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
                ? "Aún no tienes clientes registrados. Haz clic en '+ Nuevo Cliente' para registrar al primero."
                : "No hay clientes que coincidan con la búsqueda o filtro seleccionado."}
            </span>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Dirección</th>
                  <th>Contratos</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            background: "var(--primary-soft)",
                            color: "var(--primary)",
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 700,
                            fontSize: "12px",
                            flexShrink: 0,
                          }}
                        >
                          {c.nombre[0]?.toUpperCase()}
                          {c.apellido[0]?.toUpperCase()}
                        </div>
                        <div>
                          <strong>{c.nombre} {c.apellido}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code>{c.telefono}</code>
                    </td>
                    <td>{c.email || <span style={{ color: "var(--text-light)" }}>-</span>}</td>
                    <td>{c.direccion || <span style={{ color: "var(--text-light)" }}>-</span>}</td>
                    <td>
                      <span
                        style={{
                          background: "#f1f5f9",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        📋 {c.contratos?.length || 0} rentas
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          c.estado === "ACTIVO"
                            ? "badge-disponible"
                            : c.estado === "BLOQUEADO"
                            ? "badge-mantenimiento"
                            : "badge-inactivo"
                        }`}
                      >
                        {c.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn-action-edit"
                          onClick={() => editarCliente(c)}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => eliminarCliente(c.id)}
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
