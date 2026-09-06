/**
 * ============================================================================
 * RentOS - Portal de Establecimiento de Nueva Contraseña
 * ============================================================================
 * Valida el token criptográfico de 15 minutos, permite ingresar la nueva clave,
 * la encripta en el servidor con bcrypt, invalida el token de un solo uso
 * y cierra atómicamente todas las sesiones anteriores activas.
 */

import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { API_URLS } from "../../services/api";

export default function RestablecerPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [validandoToken, setValidandoToken] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [motivoInvalido, setMotivoInvalido] = useState("");
  const [datosUsuario, setDatosUsuario] = useState<{ email?: string; nombre?: string; minutosRestantes?: number }>({});

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidandoToken(false);
      setTokenValido(false);
      setMotivoInvalido("No se proporcionó ningún token de recuperación en el enlace.");
      return;
    }

    const verificar = async () => {
      try {
        setValidandoToken(true);
        const res = await fetch(`${API_URLS.auth}/validar-token-recuperacion?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (data.valido) {
          setTokenValido(true);
          setDatosUsuario(data);
        } else {
          setTokenValido(false);
          setMotivoInvalido(data.motivo || "El enlace de recuperación es inválido o ha expirado.");
        }
      } catch (err) {
        console.error(err);
        setTokenValido(false);
        setMotivoInvalido("No fue posible conectar con el servidor de autenticación.");
      } finally {
        setValidandoToken(false);
      }
    };

    verificar();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("Por favor completa ambos campos de contraseña.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden. Por favor verifica.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const res = await fetch(`${API_URLS.auth}/restablecer-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No fue posible restablecer la contraseña.");
      }

      setExito(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al procesar el cambio de contraseña.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="login-page-container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div className="login-card-container" style={{ maxWidth: "480px", width: "100%", margin: "0 auto" }}>
        <div className="login-form-side" style={{ width: "100%", padding: "36px 32px" }}>
          
          {/* Logo RentOS */}
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
                Restablecer Contraseña • Seguridad Criptográfica
              </span>
            </div>
          </div>

          {validandoToken ? (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>🔄</div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                Validando enlace criptográfico y vigencia de 15 minutos...
              </p>
            </div>
          ) : !tokenValido ? (
            <div>
              <div className="alert-box error" style={{ marginBottom: "18px", lineHeight: "1.5" }}>
                🛑 <strong>Enlace no disponible:</strong><br />
                {motivoInvalido}
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: "1.5" }}>
                Los enlaces de recuperación tienen una vigencia estricta de 15 minutos y quedan invalidados inmediatamente tras su primer uso para proteger tu cuenta de accesos no autorizados.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Link
                  to="/recuperar-password"
                  className="primary-button"
                  style={{ textAlign: "center", textDecoration: "none", padding: "11px" }}
                >
                  Solicitar un Nuevo Enlace
                </Link>
                <Link
                  to="/login"
                  className="secondary-button"
                  style={{ textAlign: "center", textDecoration: "none", padding: "10px" }}
                >
                  Regresar al Login
                </Link>
              </div>
            </div>
          ) : exito ? (
            <div>
              <div className="alert-box success" style={{ marginBottom: "18px", lineHeight: "1.5" }}>
                🎉 <strong>¡Contraseña restablecida con éxito!</strong><br />
                Tu nueva clave ha sido guardada con cifrado seguro. Todas las sesiones activas en otros dispositivos han sido revocadas e invalidadas inmediatamente.
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "24px" }}>
                Ya puedes iniciar sesión con tu correo <strong>{datosUsuario.email}</strong> y tu nueva contraseña.
              </p>
              <button
                type="button"
                className="primary-button"
                style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: 700 }}
                onClick={() => navigate("/login")}
              >
                Ir a Iniciar Sesión Ahora →
              </button>
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: "18px", margin: "0 0 6px 0" }}>Crea tu nueva contraseña</h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 16px 0" }}>
                Usuario: <strong>{datosUsuario.nombre}</strong> ({datosUsuario.email})
              </p>

              {datosUsuario.minutosRestantes !== undefined && (
                <div
                  style={{
                    background: "#fef3c7",
                    borderLeft: "4px solid #f59e0b",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#92400e",
                    marginBottom: "18px",
                  }}
                >
                  ⏱️ <strong>Tiempo restante para usar este enlace:</strong> aproximadamente {datosUsuario.minutosRestantes} minuto(s).
                </div>
              )}

              {error && <div className="alert-box error" style={{ marginBottom: "16px" }}>{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-field" style={{ marginBottom: "14px" }}>
                  <label htmlFor="newPass">Nueva Contraseña *</label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="newPass"
                      type={mostrarPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ paddingRight: "40px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
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

                <div className="form-field" style={{ marginBottom: "20px" }}>
                  <label htmlFor="confirmPass">Confirmar Nueva Contraseña *</label>
                  <input
                    id="confirmPass"
                    type={mostrarPassword ? "text" : "password"}
                    placeholder="Repite tu nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="primary-button"
                  style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}
                  disabled={guardando}
                >
                  {guardando ? "Guardando e Invalidando Sesiones..." : "Guardar Nueva Contraseña"}
                </button>

                <div style={{ textAlign: "center" }}>
                  <Link
                    to="/login"
                    style={{ fontSize: "12px", color: "var(--text-secondary)", textDecoration: "none" }}
                  >
                    Cancelar y regresar al inicio
                  </Link>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
