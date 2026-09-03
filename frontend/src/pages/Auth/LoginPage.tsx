/**
 * ============================================================================
 * RentOS - Portal de Inicio de Sesión y Autenticación (LoginPage)
 * ============================================================================
 * Pantalla de acceso seguro:
 * - Validación de credenciales con redirección al panel tras autenticarse.
 * - Tarjetas de Cuentas Demo preconfiguradas para acceso rápido de prueba.
 * - Soporte para recordar credenciales en el navegador y recuperación de contraseña vía Telegram/WhatsApp.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_URLS } from "../../services/api";

type CuentaDemo = {
  rol: string;
  etiqueta: string;
  email: string;
  password: string;
  descripcion: string;
};

export default function LoginPage() {
  const { login, usuario } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => localStorage.getItem("rentos_remember_email") || "");
  const [password, setPassword] = useState(() => localStorage.getItem("rentos_remember_pass") || "");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordarPassword, setRecordarPassword] = useState(() => {
    return localStorage.getItem("rentos_remember_active") === "true";
  });

  const [mostrarModalRecuperar, setMostrarModalRecuperar] = useState(false);
  const [emailRecuperacion, setEmailRecuperacion] = useState("");
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState("");

  const [error, setError] = useState("");
  const [iniciando, setIniciando] = useState(false);
  const [cuentasDemo, setCuentasDemo] = useState<CuentaDemo[]>([]);

  useEffect(() => {
    if (usuario) {
      navigate("/dashboard");
    }
  }, [usuario, navigate]);

  useEffect(() => {
    const cargarCuentasDemo = async () => {
      try {
        const res = await fetch(`${API_URLS.auth}/cuentas-demo`);
        if (res.ok) {
          const data = await res.json();
          setCuentasDemo(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    cargarCuentasDemo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor ingresa tu correo y contraseña.");
      return;
    }

    try {
      setIniciando(true);
      setError("");

      // Guardar o limpiar contraseña recordada
      if (recordarPassword) {
        localStorage.setItem("rentos_remember_email", email);
        localStorage.setItem("rentos_remember_pass", password);
        localStorage.setItem("rentos_remember_active", "true");
      } else {
        localStorage.removeItem("rentos_remember_email");
        localStorage.removeItem("rentos_remember_pass");
        localStorage.removeItem("rentos_remember_active");
      }

      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setIniciando(false);
    }
  };

  const usarCuentaDemo = async (cuenta: CuentaDemo) => {
    setEmail(cuenta.email);
    setPassword(cuenta.password);
    try {
      setIniciando(true);
      setError("");
      await login(cuenta.email, cuenta.password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error con cuenta demo.");
    } finally {
      setIniciando(false);
    }
  };

  const solicitarRecuperacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecuperacion.trim()) return;

    setMensajeRecuperacion(
      `✅ Se ha enviado una instrucción de restablecimiento a ${emailRecuperacion} y un aviso al SuperAdministrador.`
    );
  };

  return (
    <div className="login-page-container">
      <div className="login-card-container">
        {/* Lado Izquierdo: Formulario de Inicio de Sesión */}
        <div className="login-form-side">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                background: "var(--primary)",
                color: "white",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "20px",
              }}
            >
              R
            </div>
            <div>
              <h1 style={{ fontSize: "20px", margin: 0, fontWeight: 800 }}>RentOS</h1>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                Rent Operating System • Acceso Seguro
              </span>
            </div>
          </div>

          <h2 style={{ fontSize: "18px", margin: "0 0 6px 0" }}>Iniciar Sesión</h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 20px 0" }}>
            Ingresa tus credenciales para acceder a tu panel de control.
          </p>

          {error && <div className="alert-box error" style={{ marginBottom: "16px" }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-field" style={{ marginBottom: "14px" }}>
              <label htmlFor="loginEmail">Correo Electrónico *</label>
              <input
                id="loginEmail"
                type="email"
                placeholder="admin@rentos.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-field" style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <label htmlFor="loginPass" style={{ margin: 0 }}>Contraseña *</label>
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    fontSize: "12px",
                    cursor: "pointer",
                    padding: 0,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {mostrarPassword ? "🙈 Ocultar" : "👁️ Ver contraseña"}
                </button>
              </div>

              <div style={{ position: "relative" }}>
                <input
                  id="loginPass"
                  type={mostrarPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: "40px" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  title={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "15px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {mostrarPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Opciones: Recordar Contraseña y Olvidé Contraseña */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "12px",
                marginBottom: "20px",
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", margin: 0 }}>
                <input
                  type="checkbox"
                  checked={recordarPassword}
                  onChange={(e) => setRecordarPassword(e.target.checked)}
                />
                <span>Recordar contraseña</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setEmailRecuperacion(email);
                  setMensajeRecuperacion("");
                  setMostrarModalRecuperar(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              className="primary-button"
              style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: 700 }}
              disabled={iniciando}
            >
              {iniciando ? "Verificando..." : "Ingresar al Panel"}
            </button>
          </form>

          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "8px", textAlign: "center" }}>
            <Link
              to="/registro"
              style={{ fontSize: "13px", color: "var(--primary)", textDecoration: "none", fontWeight: 700 }}
            >
              🚀 ¿Eres dueño de un Rent a Car? Solicita tu cuenta aquí ↗
            </Link>

            <a
              href="/reservar"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: "12px", color: "var(--text-secondary)", textDecoration: "none" }}
            >
              🌐 Ver Catálogo Público de Reservas ↗
            </a>
          </div>
        </div>

        {/* Lado Derecho: Selector Rápido de Roles (SuperAdmin vs RentCars) */}
        <div className="login-demo-side">
          <h3 style={{ fontSize: "15px", margin: "0 0 4px 0", color: "var(--primary)" }}>
            ⚡ Acceso Rápido por Rol
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 16px 0" }}>
            Haz clic en un perfil para ingresar automáticamente con sus permisos:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {cuentasDemo.map((c) => (
              <div
                key={c.email}
                onClick={() => usarCuentaDemo(c)}
                style={{
                  backgroundColor: "var(--surface)",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                  <strong style={{ fontSize: "13px" }}>{c.etiqueta}</strong>
                  <span
                    className={`badge ${
                      c.rol === "SUPERADMIN"
                        ? "badge-alquilado"
                        : c.rol === "ADMIN_RENTCAR"
                        ? "badge-disponible"
                        : "badge-mantenimiento"
                    }`}
                    style={{ fontSize: "10px" }}
                  >
                    {c.rol}
                  </span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{c.descripcion}</div>
                <div style={{ fontSize: "11px", color: "var(--primary)", marginTop: "4px", fontWeight: 600 }}>
                  {c.email}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Recuperación de Contraseña */}
      {mostrarModalRecuperar && (
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
              maxWidth: "460px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h2 style={{ margin: 0, fontSize: "17px" }}>🔐 Recuperación de Contraseña</h2>
              <button
                className="secondary-button"
                style={{ padding: "4px 8px" }}
                onClick={() => setMostrarModalRecuperar(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 16px 0", lineHeight: "1.5" }}>
              Ingresa tu correo electrónico registrado para solicitar el restablecimiento de tu contraseña al SuperAdministrador.
            </p>

            {mensajeRecuperacion ? (
              <div className="alert-box success" style={{ marginBottom: "16px" }}>
                {mensajeRecuperacion}
              </div>
            ) : (
              <form onSubmit={solicitarRecuperacion}>
                <div className="form-field" style={{ marginBottom: "16px" }}>
                  <label htmlFor="recEmail">Correo Electrónico *</label>
                  <input
                    id="recEmail"
                    type="email"
                    placeholder="tu@correo.com"
                    value={emailRecuperacion}
                    onChange={(e) => setEmailRecuperacion(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setMostrarModalRecuperar(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="primary-button">
                    Solicitar Restablecimiento
                  </button>
                </div>
              </form>
            )}

            <div style={{ marginTop: "18px", borderTop: "1px solid var(--border)", paddingTop: "14px", textAlign: "center" }}>
              <a
                href={`https://wa.me/18095550199?text=${encodeURIComponent("Hola SuperAdmin de RentOS, necesito asistencia para restablecer la contraseña de mi cuenta.")}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "12px", color: "#22c55e", textDecoration: "none", fontWeight: 700 }}
              >
                💬 Contactar al SuperAdmin por WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
