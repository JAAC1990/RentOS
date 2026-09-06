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

          {error && (
            <div className="alert-box error" style={{ marginBottom: "16px", lineHeight: "1.5" }}>
              <div>{error}</div>
              {(error.includes("bloquead") || error.includes("recuperación") || error.includes("intento")) && (
                <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed rgba(239, 68, 68, 0.4)" }}>
                  <Link
                    to="/recuperar-password"
                    style={{ color: "#b91c1c", fontWeight: 700, fontSize: "12px", textDecoration: "underline" }}
                  >
                    🔑 ¿Olvidaste tu contraseña? Restablécela de forma segura aquí →
                  </Link>
                </div>
              )}
            </div>
          )}

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
              <label htmlFor="loginPass">Contraseña *</label>

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

              <Link
                to="/recuperar-password"
                style={{
                  color: "var(--primary)",
                  textDecoration: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
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
    </div>
  );
}
