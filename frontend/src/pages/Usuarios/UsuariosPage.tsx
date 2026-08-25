/**
 * ============================================================================
 * RentOS - Gestión de Equipo, Empleados y Permisos (UsuariosPage)
 * ============================================================================
 * Administración de cuentas de acceso a la plataforma:
 * - Creación de operadores de recepción, mecánicos y administradores de sucursal.
 * - Restablecimiento de contraseñas y desactivación inmediata de usuarios salientes.
 * - Pestaña de SuperAdmin para autorizar solicitudes pendientes de nuevos RentCars.
 */

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URLS } from "../../services/api";

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: "SUPERADMIN" | "ADMIN_RENTCAR" | "EMPLEADO";
  activo: boolean;
  createdAt: string;
};

type SolicitudRentCar = {
  id: number;
  nombre: string;
  contactoNombre: string | null;
  email: string | null;
  telefono: string | null;
  ciudad: string;
  estadoRegistro: string;
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
  const { usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudRentCar[]>([]);
  const [formulario, setFormulario] = useState<FormularioUsuario>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("TODOS");

  const [error, setError] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_USERS = API_URLS.users;
  const API_SOLICITUDES = API_URLS.solicitudes || "http://localhost:3000/api/solicitudes";

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [resUsers, resSol] = await Promise.all([
        fetch(API_USERS),
        fetch(API_SOLICITUDES).catch(() => null),
      ]);

      if (!resUsers.ok) throw new Error("No fue posible cargar la lista de usuarios.");
      const datosUsers: Usuario[] = await resUsers.json();
      setUsuarios(datosUsers);

      if (resSol && resSol.ok) {
        const datosSol: SolicitudRentCar[] = await resSol.json();
        setSolicitudes(datosSol);
      }
    } catch (err) {
      console.error(err);
      setError("No fue posible conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const solicitudesPendientes = useMemo(() => {
    return solicitudes.filter((s) => s.estadoRegistro === "PENDIENTE" || (!s.activo && s.estadoRegistro !== "RECHAZADO"));
  }, [solicitudes]);

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

  const guardarUsuario = async () => {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensaje("");

      const url = editandoId === null ? API_USERS : `${API_USERS}/${editandoId}`;
      const metodo = editandoId === null ? "POST" : "PUT";

      const res = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulario),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No fue posible guardar el usuario.");
      }

      setMensaje(editandoId === null ? "✅ Usuario creado exitosamente." : "✅ Usuario actualizado.");
      limpiarFormulario();
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setErrorFormulario(err instanceof Error ? err.message : "Error al procesar usuario.");
    } finally {
      setGuardando(false);
    }
  };

  const editarUsuario = (u: Usuario) => {
    setEditandoId(u.id);
    setFormulario({
      nombre: u.nombre,
      email: u.email,
      password: "",
      rol: u.rol,
      activo: u.activo,
    });
    setMostrarFormulario(true);
  };

  const toggleEstado = async (u: Usuario) => {
    try {
      setError("");
      setMensaje("");

      const res = await fetch(`${API_USERS}/${u.id}/toggle-estado`, {
        method: "PATCH",
      });

      if (!res.ok) throw new Error("No fue posible cambiar el estado del usuario.");

      setMensaje(`Cuenta de ${u.nombre} ${u.activo ? "desactivada" : "activada"} con éxito.`);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al cambiar estado.");
    }
  };

  const autorizarRentCar = async (sol: SolicitudRentCar) => {
    try {
      setError("");
      setMensaje("");

      const res = await fetch(`${API_SOLICITUDES}/${sol.id}/aprobar`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al autorizar empresa.");

      setMensaje(`🎉 ${data.mensaje}`);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al autorizar empresa.");
    }
  };

  const rechazarRentCar = async (sol: SolicitudRentCar) => {
    const confirmar = window.confirm(`¿Rechazar solicitud de ${sol.nombre}?`);
    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      const res = await fetch(`${API_SOLICITUDES}/${sol.id}/rechazar`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al rechazar empresa.");

      setMensaje(data.mensaje);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al rechazar empresa.");
    }
  };

  return (
    <div className="usuarios-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Equipo, Usuarios & Autorización de Rent Cars</h1>
          <p>Control de roles (SuperAdmin, Admin RentCar, Empleado) y autorización de nuevas empresas.</p>
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
          <div className="stat-icon available">🛡️</div>
          <div className="stat-info">
            <span className="stat-label">Administradores</span>
            <strong className="stat-value">{stats.administradores}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rented">👤</div>
          <div className="stat-info">
            <span className="stat-label">Empleados</span>
            <strong className="stat-value">{stats.empleados}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon maintenance">⏳</div>
          <div className="stat-info">
            <span className="stat-label">Solicitudes Pendientes</span>
            <strong className="stat-value">{solicitudesPendientes.length}</strong>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* BANNER DE SOLICITUDES DE RENT CARS PENDIENTES DE AUTORIZACIÓN (PARA SUPERADMIN) */}
      {solicitudesPendientes.length > 0 && (
        <section
          style={{
            backgroundColor: "var(--surface)",
            border: "2px solid #f59e0b",
            borderRadius: "14px",
            padding: "20px 24px",
            marginBottom: "24px",
            boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.15)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "16px", color: "#d97706", display: "flex", alignItems: "center", gap: "8px" }}>
                🚨 Solicitudes de Nuevos Rent a Cars Pendientes de tu Autorización ({solicitudesPendientes.length})
              </h2>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Estos negocios completaron el registro web y están esperando tu aprobación para activar su cuenta y entrar al sistema.
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {solicitudesPendientes.map((sol) => (
              <div
                key={sol.id}
                style={{
                  padding: "14px 18px",
                  background: "var(--primary-soft)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ fontSize: "15px" }}>{sol.nombre}</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginLeft: "8px" }}>
                    📍 {sol.ciudad}
                  </span>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    👤 Dueño: <b>{sol.contactoNombre || "No especificado"}</b> • 📞 {sol.telefono} • 📧 {sol.email}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="primary-button"
                    style={{ backgroundColor: "var(--success)", padding: "8px 14px", fontSize: "13px" }}
                    onClick={() => autorizarRentCar(sol)}
                  >
                    ✅ Autorizar y Activar Cuenta
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    style={{ color: "var(--danger)", borderColor: "#fca5a5", padding: "8px 12px", fontSize: "13px" }}
                    onClick={() => rechazarRentCar(sol)}
                  >
                    ❌ Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Formulario de Usuario */}
      {mostrarFormulario && (
        <section className="content-panel" style={{ marginBottom: "24px" }}>
          <div className="panel-header">
            <h2>{editandoId === null ? "Crear Nuevo Usuario" : "Editar Usuario"}</h2>
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
            style={{ padding: "20px" }}
          >
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="userNombre">Nombre y Apellido *</label>
                <input
                  id="userNombre"
                  type="text"
                  placeholder="Ej. Roberto Gómez"
                  value={formulario.nombre}
                  onChange={(e) => setFormulario((prev) => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="userEmail">Correo Electrónico *</label>
                <input
                  id="userEmail"
                  type="email"
                  placeholder="roberto@rentos.do"
                  value={formulario.email}
                  onChange={(e) => setFormulario((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="form-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label htmlFor="userPass" style={{ margin: 0 }}>
                    {editandoId === null ? "Contraseña *" : "Nueva Contraseña (Opcional)"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--primary)",
                      fontSize: "11px",
                      cursor: "pointer",
                      padding: 0,
                      fontWeight: 600,
                    }}
                  >
                    {mostrarPassword ? "🙈 Ocultar" : "👁️ Ver"}
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    id="userPass"
                    type={mostrarPassword ? "text" : "password"}
                    placeholder={editandoId === null ? "Mínimo 6 caracteres" : "Dejar en blanco para no cambiar"}
                    value={formulario.password}
                    onChange={(e) => setFormulario((prev) => ({ ...prev, password: e.target.value }))}
                    style={{ paddingRight: "36px" }}
                    required={editandoId === null}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {mostrarPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="userRol">Rol de Permisos *</label>
                <select
                  id="userRol"
                  value={formulario.rol}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, rol: e.target.value as FormularioUsuario["rol"] }))
                  }
                  required
                >
                  <option value="EMPLEADO">👤 Empleado / Asesor de Mostrador</option>
                  <option value="ADMIN_RENTCAR">🏢 Administrador de Rent a Car</option>
                  {usuarioActual?.rol === "SUPERADMIN" && (
                    <option value="SUPERADMIN">👑 SuperAdministrador (SaaS Global)</option>
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button type="button" className="secondary-button" onClick={limpiarFormulario} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className="primary-button" disabled={guardando}>
                {guardando ? "Guardando..." : editandoId === null ? "Crear Usuario" : "Guardar Cambios"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tabla de Usuarios */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>
            Listado de Usuarios Registrados{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "13px" }}>
              ({usuariosFiltrados.length} usuarios)
            </span>
          </h2>

          <div style={{ display: "flex", gap: "10px" }}>
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                fontSize: "12px",
                background: "var(--surface)",
                color: "var(--text)",
              }}
            >
              <option value="TODOS">Todos los roles</option>
              <option value="SUPERADMIN">SuperAdmins</option>
              <option value="ADMIN_RENTCAR">Administradores</option>
              <option value="EMPLEADO">Empleados</option>
            </select>

            <div style={{ width: "220px" }}>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  fontSize: "12px",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando usuarios...</strong>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <strong>No se encontraron usuarios</strong>
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
                  <th>Fecha de Creación</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.nombre}</strong>
                    </td>
                    <td>
                      <code>{u.email}</code>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          u.rol === "SUPERADMIN"
                            ? "badge-alquilado"
                            : u.rol === "ADMIN_RENTCAR"
                            ? "badge-disponible"
                            : "badge-mantenimiento"
                        }`}
                      >
                        {u.rol === "SUPERADMIN"
                          ? "👑 SuperAdmin"
                          : u.rol === "ADMIN_RENTCAR"
                          ? "🏢 Admin RentCar"
                          : "👤 Empleado"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.activo ? "badge-disponible" : "badge-inactivo"}`}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <small style={{ color: "var(--text-secondary)" }}>
                        {new Date(u.createdAt).toLocaleDateString("es-DO")}
                      </small>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                        <button
                          type="button"
                          className="btn-action-edit"
                          onClick={() => editarUsuario(u)}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          className="btn-action-delete"
                          style={{ color: u.activo ? "var(--danger)" : "var(--success)" }}
                          title={u.activo ? "Desactivar cuenta" : "Activar cuenta"}
                          onClick={() => toggleEstado(u)}
                        >
                          {u.activo ? "🚫 Desactivar" : "✓ Activar"}
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
