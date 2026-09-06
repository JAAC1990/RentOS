/**
 * ============================================================================
 * RentOS - Portal de Inicio de Sesión y Autenticación (LoginPage)
 * ============================================================================
 * Pantalla de acceso limpio y seguro:
 * - Validación de credenciales con redirección automática al panel de control.
 * - Soporte para recordar credenciales en el navegador.
 * - Acceso directo a recuperación de contraseña (enlace seguro de 15 min).
 * - Protección contra intentos fallidos y alertas visuales de bloqueo progresivo.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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

  useEffect(() => {
    if (usuario) {
      navigate("/dashboard");
    }
  }, [usuario, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor ingresa tu correo y contraseña.");
      return;
    }

    try {
      setIniciando(true);
      setError("");

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

  return (
    <div
      className="login-page-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        className="login-card-container"
        style={{
          maxWidth: "440px",
          width: "100%",
          margin: "0 auto",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.12)",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <div style={{ padding: "40px 32px" }}>
          {/* Logo y Nombre del Sistema */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "26px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                background: "var(--primary)",
                color: "white",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "22px",
                boxShadow: "0 4px 10px rgba(37, 99, 235, 0.3)",
              }}
            >
              R
            </div>
            <div>
              <h1 style={{ fontSize: "22px", margin: 0, fontWeight: 800, letterSpacing: "-0.5px" }}>
                RentOS
              </h1>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>
                Rent Operating System • Acceso Seguro
              </span>
            </div>
          </div>

          <h2 style={{ fontSize: "18px", margin: "0 0 6px 0", fontWeight: 700 }}>
            Iniciar Sesión
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 24px 0", lineHeight: "1.4" }}>
            Ingresa tus credenciales para acceder a tu panel de control.
          </p>

          {/* Mensajes de Error y Alertas de Bloqueo Progresivo */}
          {error && (
            <div className="alert-box error" style={{ marginBottom: "20px", lineHeight: "1.5" }}>
              <div>{error}</div>
              {(error.includes("bloquead") || error.includes("recuperación") || error.includes("intento")) && (
                <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed rgba(239, 68, 68, 0.4)" }}>
                  <Link
                    to="/recuperar-password"
                    style={{ color: "#b91c1c", fontWeight: 700, fontSize: "12px", textDecoration: "underline" }}
                  >
                    🔑 ¿Olvidaste tu contraseña? Restablécela aquí de forma segura →
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field" style={{ marginBottom: "16px" }}>
              <label htmlFor="loginEmail">Correo Electrónico *</label>
              <input
                id="loginEmail"
                type="email"
                placeholder="rentosrd@gmail.com o tu correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-field" style={{ marginBottom: "16px" }}>
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
                marginBottom: "24px",
              }}
            >
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", margin: 0 }}>
                <input
                  type="checkbox"
                  checked={recordarPassword}
                  onChange={(e) => setRecordarPassword(e.target.checked)}
                />
                <span>Recordar credenciales</span>
              </label>

              <Link
                to="/recuperar-password"
                style={{
                  color: "var(--primary)",
                  textDecoration: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              className="primary-button"
              style={{ width: "100%", padding: "13px", fontSize: "14px", fontWeight: 700, borderRadius: "8px" }}
              disabled={iniciando}
            >
              {iniciando ? "Verificando acceso..." : "Ingresar al Panel"}
            </button>
          </form>

          {/* Enlaces de Utilidad Pública */}
          <div style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "10px", textAlign: "center", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
            <Link
              to="/registro"
              style={{ fontSize: "13px", color: "var(--primary)", textDecoration: "none", fontWeight: 700 }}
            >
              🚀 ¿Eres dueño de un Rent a Car? Solicita tu empresa aquí ↗
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
      </div>
    </div>
  );
}
