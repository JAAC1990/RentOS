import { useEffect, useMemo, useState } from "react";
import { API_URLS } from "../../services/api";

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: "SUPERADMIN" | "ADMIN_RENTCAR" | "EMPLEADO";
  activo: boolean;
  createdAt: string;
};

type FormularioUsuario = {
  nombre: string;
  email: string;
  password: string;
  rol: "SUPERADMIN" | "ADMIN_RENTCAR" | "EMPLEADO";
  activo: boolean;
};

const formularioInicial: FormularioUsuario = {
  nombre: "",
  email: "",
  password: "",
  rol: "EMPLEADO",
  activo: true,
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [formulario, setFormulario] = useState<FormularioUsuario>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("TODOS");

  const [error, setError] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_USERS = API_URLS.users;

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setError("");
      const res = await fetch(API_USERS);
      if (!res.ok) throw new Error("No fue posible cargar la lista de usuarios.");
      const datos: Usuario[] = await res.json();
      setUsuarios(datos);
    } catch (err) {
      console.error(err);
      setError("No fue posible conectar con el servidor de usuarios.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Estadísticas en tiempo real
  const stats = useMemo(() => {
    const total = usuarios.length;
    const administradores = usuarios.filter((u) => u.rol === "ADMIN_RENTCAR" || u.rol === "SUPERADMIN").length;
    const empleados = usuarios.filter((u) => u.rol === "EMPLEADO").length;
    const inactivos = usuarios.filter((u) => !u.activo).length;

    return { total, administradores, empleados, inactivos };
  }, [usuarios]);

  // Filtrado y búsqueda
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const cumpleRol = filtroRol === "TODOS" || u.rol === filtroRol;
      const texto = `${u.nombre} ${u.email} ${u.rol}`.toLowerCase();
      const cumpleBusqueda = texto.includes(busqueda.toLowerCase());

      return cumpleRol && cumpleBusqueda;
    });
  }, [usuarios, busqueda, filtroRol]);

  const validarFormulario = () => {
    setErrorFormulario("");

    if (!formulario.nombre.trim()) {
      setErrorFormulario("El nombre del usuario es obligatorio.");
      return false;
    }
    if (!formulario.email.trim() || !formulario.email.includes("@")) {
      setErrorFormulario("El correo electrónico es inválido.");
      return false;
    }
    if (editandoId === null && (!formulario.password || formulario.password.length < 6)) {
      setErrorFormulario("La contraseña debe contener al menos 6 caracteres.");
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

  const iniciarEdicion = (u: Usuario) => {
    setEditandoId(u.id);
    setFormulario({
      nombre: u.nombre,
      email: u.email,
      password: "",
      rol: u.rol,
      activo: u.activo,
    });
    setErrorFormulario("");
    setMostrarFormulario(true);
  };

  const guardarUsuario = async () => {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensaje("");

      const datos = {
        nombre: formulario.nombre.trim(),
        email: formulario.email.trim().toLowerCase(),
        password: formulario.password ? formulario.password : undefined,
        rol: formulario.rol,
        activo: formulario.activo,
      };

      const url = editandoId === null ? API_USERS : `${API_USERS}/${editandoId}`;
      const metodo = editandoId === null ? "POST" : "PUT";

      const respuesta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          resultado?.error || resultado?.message || "No fue posible guardar el usuario."
        );
      }

      setMensaje(
        editandoId === null
          ? "✅ Usuario registrado con éxito."
          : "✅ Datos y permisos del usuario actualizados."
      );

      limpiarFormulario();
      await cargarUsuarios();
    } catch (err) {
      console.error(err);
      setErrorFormulario(
        err instanceof Error ? err.message : "Error al guardar el usuario."
      );
    } finally {
      setGuardando(false);
    }
  };

  const alternarEstado = async (u: Usuario) => {
    try {
      setError("");
      setMensaje("");

      const res = await fetch(`${API_USERS}/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !u.activo }),
      });

      if (!res.ok) throw new Error("Error al cambiar estado.");

      setMensaje(`Cuenta de ${u.nombre} ${!u.activo ? 'activada' : 'desactivada'}.`);
      await cargarUsuarios();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al cambiar estado.");
    }
  };

  const eliminarUsuario = async (id: number) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea eliminar este usuario del sistema?"
    );
    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      const res = await fetch(`${API_USERS}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No fue posible eliminar el usuario.");

      setMensaje("🗑️ Usuario eliminado correctamente.");
      await cargarUsuarios();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al eliminar.");
    }
  };

  const getIniciales = (nombre: string) => {
    return nombre
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="usuarios-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Equipo y Control de Accesos</h1>
          <p>Administra los usuarios de tu Rent Car, contraseñas y permisos por roles (RBAC).</p>
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
          {mostrarFormulario && editandoId === null ? "Cerrar Formulario" : "+ Nuevo Usuario"}
        </button>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-label">Total Usuarios</span>
            <strong className="stat-value">{stats.total}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rented">👑</div>
          <div className="stat-info">
            <span className="stat-label">Administradores</span>
            <strong className="stat-value" style={{ color: "var(--primary)" }}>
              {stats.administradores}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon available">👔</div>
          <div className="stat-info">
            <span className="stat-label">Empleados / Asesores</span>
            <strong className="stat-value">{stats.empleados}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon maintenance">🚫</div>
          <div className="stat-info">
            <span className="stat-label">Inactivos</span>
            <strong className="stat-value">{stats.inactivos}</strong>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Formulario de Usuario */}
      {mostrarFormulario && (
        <section className="content-panel" id="formulario-usuario">
          <div className="panel-header">
            <h2>{editandoId === null ? "Crear Nuevo Usuario de Sistema" : "Modificar Usuario y Permisos"}</h2>
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
              guardarUsuario();
            }}
          >
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="nombreUsuario">Nombre Completo *</label>
                <input
                  id="nombreUsuario"
                  type="text"
                  placeholder="Ej. Carlos Mendoza"
                  value={formulario.nombre}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, nombre: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="emailUsuario">Correo Electrónico (Login) *</label>
                <input
                  id="emailUsuario"
                  type="email"
                  placeholder="ejemplo@rentos.do"
                  value={formulario.email}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="passwordUsuario">
                  {editandoId === null ? "Contraseña *" : "Nueva Contraseña (dejar vacío para no cambiar)"}
                </label>
                <input
                  id="passwordUsuario"
                  type="password"
                  placeholder={editandoId === null ? "Mínimo 6 caracteres" : "••••••••"}
                  value={formulario.password}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, password: e.target.value }))
                  }
                  required={editandoId === null}
                />
              </div>

              <div className="form-field">
                <label htmlFor="rolUsuario">Rol y Permisos *</label>
                <select
                  id="rolUsuario"
                  value={formulario.rol}
                  onChange={(e) =>
                    setFormulario((prev) => ({
                      ...prev,
                      rol: e.target.value as FormularioUsuario["rol"],
                    }))
                  }
                  required
                >
                  <option value="EMPLEADO">👔 Empleado / Operador (Contratos, Entregas y Cobros)</option>
                  <option value="ADMIN_RENTCAR">👑 Administrador Rent Car (Acceso Completo)</option>
                  <option value="SUPERADMIN">🛡️ SuperAdmin Global</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="activoUsuario">Estado de la Cuenta *</label>
                <select
                  id="activoUsuario"
                  value={formulario.activo ? "true" : "false"}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, activo: e.target.value === "true" }))
                  }
                  required
                >
                  <option value="true">Activo (Permite acceso al sistema)</option>
                  <option value="false">Inactivo (Acceso bloqueado)</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button" disabled={guardando}>
                  {guardando
                    ? "Guardando..."
                    : editandoId === null
                    ? "Registrar Usuario"
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
            placeholder="Buscar por nombre, email o rol..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-rol" style={{ fontSize: "12px", fontWeight: 600 }}>
            Rol:
          </label>
          <select
            id="filtro-rol"
            className="filter-select"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <option value="TODOS">Todos los roles</option>
            <option value="ADMIN_RENTCAR">Administradores</option>
            <option value="EMPLEADO">Empleados</option>
            <option value="SUPERADMIN">SuperAdmins</option>
          </select>

          {(busqueda || filtroRol !== "TODOS") && (
            <button
              className="secondary-button"
              style={{ padding: "8px 12px", fontSize: "12px" }}
              onClick={() => {
                setBusqueda("");
                setFiltroRol("TODOS");
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>
            Listado de Usuarios{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "13px" }}>
              ({usuariosFiltrados.length} de {usuarios.length} miembros)
            </span>
          </h2>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando equipo de trabajo...</strong>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <strong>No se encontraron usuarios</strong>
            <span>Haz clic en '+ Nuevo Usuario' para registrar a tu equipo.</span>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo Electrónico</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Fecha de Registro</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="client-info-cell">
                        <div className="client-avatar">
                          {getIniciales(u.nombre)}
                        </div>
                        <div>
                          <strong>{u.nombre}</strong>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className={`badge ${
                          u.rol === "ADMIN_RENTCAR" || u.rol === "SUPERADMIN"
                            ? "badge-alquilado"
                            : "badge-disponible"
                        }`}
                      >
                        {u.rol === "ADMIN_RENTCAR"
                          ? "👑 Admin RentCar"
                          : u.rol === "SUPERADMIN"
                          ? "🛡️ SuperAdmin"
                          : "👔 Empleado"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          u.activo ? "badge-disponible" : "badge-inactivo"
                        }`}
                      >
                        {u.activo ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString("es-DO")}</td>
                    <td style={{ textAlign: "right" }}>
                      <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn-action-edit"
                          onClick={() => iniciarEdicion(u)}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          className="btn-action-edit"
                          style={{
                            background: u.activo ? "var(--warning-soft)" : "var(--success-soft)",
                            color: u.activo ? "var(--warning)" : "var(--success)",
                          }}
                          onClick={() => alternarEstado(u)}
                        >
                          {u.activo ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          type="button"
                          className="btn-action-delete"
                          onClick={() => eliminarUsuario(u.id)}
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
