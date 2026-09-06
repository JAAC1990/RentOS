/**
 * ============================================================================
 * RentOS - Portal de Solicitud de Recuperación de Contraseña
 * ============================================================================
 * Permite a los usuarios ADMIN y SUPERADMIN solicitar un enlace criptográfico
 * seguro de un solo uso con vigencia de 15 minutos.
 * Para el rol SUPERADMIN, el correo autorizado de entrega es rentosrd@gmail.com.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { API_URLS } from "../../services/api";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Por favor ingresa tu correo electrónico.");
      return;
    }

    try {
      setEnviando(true);
      setError("");
      setMensajeExito("");

      const res = await fetch(`${API_URLS.auth}/recuperar-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No fue posible procesar la solicitud.");
      }

      setMensajeExito(data.mensaje);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al solicitar recuperación.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-page-container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="login-card-container" style={{ maxWidth: "480px", width: "100%", margin: "0 auto" }}>
        <div className="login-form-side" style={{ width: "100%", padding: "36px 32px" }}>
          
          {/* Encabezado con Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
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
                Recuperación de Contraseña • Acceso Seguro
              </span>
            </div>
          </div>

          <h2 style={{ fontSize: "18px", margin: "0 0 8px 0" }}>¿Olvidaste tu contraseña?</h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 20px 0", lineHeight: "1.5" }}>
            Ingresa tu correo institucional o de administrador para recibir un enlace seguro de restablecimiento.
          </p>

          {/* Banner Informativo de Políticas de Seguridad */}
          <div
            style={{
              background: "#eff6ff",
              borderLeft: "4px solid #3b82f6",
              padding: "12px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              color: "#1e40af",
              marginBottom: "20px",
              lineHeight: "1.5",
            }}
          >
            🛡️ <strong>Protocolo de Seguridad:</strong>
            <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
              <li>Vigencia máxima del enlace: <strong>15 minutos</strong>.</li>
              <li>El enlace es de <strong>un solo uso</strong> e intransferible.</li>
              <li>Para el <strong>SuperAdministrador</strong>, la entrega se realiza al canal autorizado: <code>rentosrd@gmail.com</code>.</li>
              <li>Al cambiar la contraseña, <strong>se cerrarán todas las sesiones anteriores</strong> por seguridad.</li>
            </ul>
          </div>

          {error && <div className="alert-box error" style={{ marginBottom: "16px" }}>{error}</div>}

          {mensajeExito ? (
            <div>
              <div className="alert-box success" style={{ marginBottom: "20px", lineHeight: "1.5" }}>
                ✅ {mensajeExito}
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Por favor revisa tu bandeja de entrada y la carpeta de spam. Abre el enlace seguro para fijar tu nueva contraseña antes de que transcurran los 15 minutos.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setMensajeExito("");
                    setEmail("");
                  }}
                  style={{ width: "100%", padding: "10px" }}
                >
                  Solicitar otro enlace
                </button>
                <Link
                  to="/login"
                  className="primary-button"
                  style={{ width: "100%", textAlign: "center", textDecoration: "none", padding: "10px" }}
                >
                  Volver al Inicio de Sesión
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-field" style={{ marginBottom: "20px" }}>
                <label htmlFor="recEmail">Correo Electrónico Registrado *</label>
                <input
                  id="recEmail"
                  type="email"
                  placeholder="ejemplo@rentos.local o rentosrd@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="primary-button"
                style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}
                disabled={enviando}
              >
                {enviando ? "Generando Enlace Criptográfico..." : "Enviar Enlace de Recuperación (15 min)"}
              </button>

              <div style={{ textAlign: "center" }}>
                <Link
                  to="/login"
                  style={{
                    fontSize: "12px",
                    color: "var(--primary)",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  ← Regresar a Iniciar Sesión
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
