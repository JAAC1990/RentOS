/**
 * ============================================================================
 * RentOS - Portal de Inicio de Sesión y Autenticación Multi-Tenant (LoginPage)
 * ============================================================================
 * - Diseño Recomendado: Split-Screen Tecnológico con telemetría en vivo.
 * - Detección Dinámica de Empresa & Logo: Al escribir el usuario/correo,
 *   detecta automáticamente su Rent a Car y carga su logo oficial, nombre y colores.
 * - Soporte para SuperAdmin Global (rentosrd@gmail.com) con consola central.
 * - Protección contra fuerza bruta con bloqueo progresivo y recuperación de 15 min.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTasaCambio } from "../../context/TasaCambioContext";

type DisenoTipo = "split" | "neon" | "showcase";

interface EmpresaBranding {
  tipo: "DEFAULT" | "SUPERADMIN" | "EMPRESA" | "DESCONOCIDO";
  nombreEmpresa: string;
  slug?: string;
  logoUrl: string | null;
  eslogan: string;
  colorPrimario: string;
  rol?: string;
}

export default function LoginPage() {
  const { login, usuario } = useAuth();
  const { tasaCambio } = useTasaCambio();
  const navigate = useNavigate();

  const [diseno, setDiseno] = useState<DisenoTipo>(() => {
    return (localStorage.getItem("rentos_login_diseno") as DisenoTipo) || "neon";
  });

  const cambiarDiseno = (nuevo: DisenoTipo) => {
    setDiseno(nuevo);
    localStorage.setItem("rentos_login_diseno", nuevo);
  };

  const [email, setEmail] = useState(() => localStorage.getItem("rentos_remember_email") || "");
  const [password, setPassword] = useState(() => localStorage.getItem("rentos_remember_pass") || "");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [recordarPassword, setRecordarPassword] = useState(() => {
    return localStorage.getItem("rentos_remember_active") === "true";
  });

  const [error, setError] = useState("");
  const [iniciando, setIniciando] = useState(false);

  // Estado para la detección dinámica del Logo y Empresa
  const [empresaInfo, setEmpresaInfo] = useState<EmpresaBranding>({
    tipo: "DEFAULT",
    nombreEmpresa: "RentOS",
    logoUrl: null,
    eslogan: "Rent Operating System • Acceso Seguro",
    colorPrimario: "#0284c7",
  });
  const [buscandoEmpresa, setBuscandoEmpresa] = useState(false);

  // Redireccionar si ya está autenticado
  useEffect(() => {
    if (usuario) {
      navigate("/dashboard");
    }
  }, [usuario, navigate]);

  // Detección en tiempo real de la empresa según el correo escrito
  useEffect(() => {
    const emailLimpio = email.trim().toLowerCase();
    if (!emailLimpio || !emailLimpio.includes("@")) {
      setEmpresaInfo({
        tipo: "DEFAULT",
        nombreEmpresa: "RentOS",
        logoUrl: null,
        eslogan: "Rent Operating System • Acceso Seguro",
        colorPrimario: "#0284c7",
      });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setBuscandoEmpresa(true);
        const res = await fetch(`/api/auth/identificar-empresa?email=${encodeURIComponent(emailLimpio)}`);
        if (res.ok) {
          const data: EmpresaBranding = await res.json();
          setEmpresaInfo(data);
        }
      } catch (err) {
        console.error("Error al identificar empresa:", err);
      } finally {
        setBuscandoEmpresa(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [email]);

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

  const primaryColor = empresaInfo.colorPrimario || "#0284c7";

  return (
    <div style={{ position: "relative", minHeight: "100vh", backgroundColor: diseno === "neon" ? "#070b14" : diseno === "showcase" ? "#0b1324" : "#090e1a" }}>
      {/* Estilos CSS Inyectados para Animaciones Elegantes */}
      <style>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.45; }
          50% { transform: scale(1.18) translate(25px, -20px); opacity: 0.75; }
        }
        @keyframes pulseGlow2 {
          0%, 100% { transform: scale(1.1) translate(0, 0); opacity: 0.4; }
          50% { transform: scale(0.92) translate(-30px, 25px); opacity: 0.7; }
        }
        @keyframes shimmerLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
        @keyframes logoFadeIn {
          0% { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
        .anim-float { animation: floatSlow 5s ease-in-out infinite; }
        .anim-float-delayed { animation: floatSlow 6s ease-in-out infinite 2s; }
        .anim-orb-1 { animation: pulseGlow 10s ease-in-out infinite; }
        .anim-orb-2 { animation: pulseGlow2 12s ease-in-out infinite; }
        .anim-logo { animation: logoFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .btn-shimmer {
          position: relative;
          overflow: hidden;
        }
        .btn-shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          animation: shimmerLine 3s infinite;
        }
      `}</style>

      {/* BARRA SUPERIOR FLOTANTE DE OPCIONES DE DISEÑO */}
      <aside
        aria-label="Selector de diseño"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(16px)",
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "10px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "16px" }}>⚡</span>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc" }}>
              RentOS • Login Multi-Empresa con Detección Automática de Logo
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              {empresaInfo.tipo === "EMPRESA" ? (
                <span style={{ color: "#38bdf8", fontWeight: 700 }}>
                  🏢 Detectado: {empresaInfo.nombreEmpresa}
                </span>
              ) : empresaInfo.tipo === "SUPERADMIN" ? (
                <span style={{ color: "#fbbf24", fontWeight: 700 }}>
                  👑 Detectado: SuperAdmin Global
                </span>
              ) : (
                "Escribe tu correo abajo y mira cómo carga automáticamente el logo de tu Rent a Car:"
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#020617", padding: "4px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            type="button"
            onClick={() => cambiarDiseno("split")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              backgroundColor: diseno === "split" ? primaryColor : "transparent",
              color: diseno === "split" ? "#ffffff" : "#94a3b8",
              boxShadow: diseno === "split" ? `0 2px 10px ${primaryColor}66` : "none",
            }}
          >
            1. Split-Screen
          </button>
          <button
            type="button"
            onClick={() => cambiarDiseno("neon")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              backgroundColor: diseno === "neon" ? "#6366f1" : "transparent",
              color: diseno === "neon" ? "#ffffff" : "#94a3b8",
              boxShadow: diseno === "neon" ? "0 2px 10px rgba(99,102,241,0.6)" : "none",
            }}
          >
            2. Neón Glass (Activo) ⭐
          </button>
          <button
            type="button"
            onClick={() => cambiarDiseno("showcase")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              backgroundColor: diseno === "showcase" ? "#2563eb" : "transparent",
              color: diseno === "showcase" ? "#ffffff" : "#94a3b8",
            }}
          >
            3. Corporativo
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* VISTA 1: SPLIT-SCREEN TECNOLÓGICO (RECOMENDACIÓN PRINCIPAL)               */}
      {/* ========================================================================= */}
      {diseno === "split" && (
        <div style={{ minHeight: "calc(100vh - 65px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px" }}>
          <div
            style={{
              maxWidth: "1080px",
              width: "100%",
              borderRadius: "28px",
              overflow: "hidden",
              boxShadow: "0 30px 70px -15px rgba(0,0,0,0.65)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexWrap: "wrap",
              backgroundColor: "#0d1527",
            }}
          >
            {/* LADO IZQUIERDO: Visual Satelital, Telemetría & Identidad de Empresa */}
            <div
              style={{
                flex: "1 1 520px",
                background: "linear-gradient(145deg, #070c18 0%, #0c162c 50%, #092347 100%)",
                padding: "48px 42px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                borderRight: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Resplandor ambiental de radar */}
              <div
                style={{
                  position: "absolute",
                  top: "-100px",
                  right: "-100px",
                  width: "340px",
                  height: "340px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%)",
                  pointerEvents: "none",
                }}
              />

              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 14px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(14,165,233,0.12)",
                    border: "1px solid rgba(14,165,233,0.3)",
                    color: "#38bdf8",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    marginBottom: "24px",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#38bdf8",
                      boxShadow: "0 0 10px #38bdf8",
                    }}
                  />
                  {empresaInfo.tipo === "EMPRESA" ? (
                    <span>INSTANCIA DEDICADA • {empresaInfo.nombreEmpresa.toUpperCase()}</span>
                  ) : empresaInfo.tipo === "SUPERADMIN" ? (
                    <span>CONSOLA GLOBAL • SUPERADMIN CENTRAL</span>
                  ) : (
                    <span>SISTEMA EN VIVO • V4.2 SAAS MULTI-TENANT</span>
                  )}
                </div>

                <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff", lineHeight: 1.25, margin: "0 0 14px 0", letterSpacing: "-0.5px" }}>
                  {empresaInfo.tipo === "EMPRESA" ? (
                    <>Panel operativo de <span style={{ color: "#38bdf8" }}>{empresaInfo.nombreEmpresa}</span>.</>
                  ) : (
                    <>Control inteligente y telemetría de tu flota.</>
                  )}
                </h1>
                <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.6, margin: 0, maxWidth: "460px" }}>
                  {empresaInfo.tipo === "EMPRESA"
                    ? empresaInfo.eslogan
                    : "Monitoreo satelital GPS en tiempo real, corte de ignición antirrobo, contratos digitales y facturación fiscal NCF automatizada en República Dominicana."}
                </p>
              </div>

              {/* Tarjetas Flotantes con Datos del Sistema y Telemetría */}
              <div style={{ margin: "36px 0", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div
                  className="anim-float"
                  style={{
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "16px",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                      🛰️
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>
                        {empresaInfo.tipo === "EMPRESA" ? `Flota de ${empresaInfo.nombreEmpresa}` : "Telemetría GPS y Anti-Robo"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>Corte de ignición remoto y geocercas activas</div>
                    </div>
                  </div>
                  <span style={{ padding: "4px 10px", borderRadius: "8px", backgroundColor: "rgba(16,185,129,0.2)", color: "#34d399", fontSize: "11px", fontWeight: 700, border: "1px solid rgba(16,185,129,0.3)" }}>
                    ● 100% Conectado
                  </span>
                </div>

                <div
                  className="anim-float-delayed"
                  style={{
                    backgroundColor: "rgba(15, 23, 42, 0.75)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(12px)",
                    borderRadius: "16px",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: "rgba(14,165,233,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                      💵
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>Tasa Oficial Banco Central (BCRD)</div>
                      <div style={{ fontSize: "11px", color: "#94a3b8" }}>Sincronización cambiaria dinámica</div>
                    </div>
                  </div>
                  <span style={{ padding: "4px 10px", borderRadius: "8px", backgroundColor: "rgba(14,165,233,0.2)", color: "#38bdf8", fontSize: "11px", fontWeight: 700, border: "1px solid rgba(14,165,233,0.3)" }}>
                    {tasaCambio && tasaCambio > 0 ? `1 USD = ${tasaCambio.toFixed(2)} DOP (BCRD)` : "Sincronizando BCRD..."}
                  </span>
                </div>
              </div>

              {/* Pie Izquierdo */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "18px", fontSize: "12px", color: "#64748b" }}>
                <span>🛡️ Encriptación SHA-256 + Bcrypt</span>
                <span>📍 Santo Domingo • Punta Cana • Santiago</span>
              </div>
            </div>

            {/* LADO DERECHO: Formulario Limpio con LOGO DINÁMICO DE EMPRESA */}
            <div
              style={{
                flex: "1 1 380px",
                backgroundColor: "#ffffff",
                padding: "48px 40px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ maxWidth: "360px", width: "100%", margin: "0 auto" }}>
                
                {/* CABECERA DINÁMICA CON LOGO DE LA EMPRESA */}
                <div style={{ marginBottom: "26px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", minHeight: "54px" }}>
                    {empresaInfo.logoUrl ? (
                      /* LOGO REAL CARGADO DE LA EMPRESA */
                      <div className="anim-logo" style={{ display: "flex", alignItems: "center", maxWidth: "160px" }}>
                        <img
                          src={empresaInfo.logoUrl}
                          alt={empresaInfo.nombreEmpresa}
                          style={{
                            maxHeight: "52px",
                            maxWidth: "100%",
                            objectFit: "contain",
                            borderRadius: "10px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          }}
                        />
                      </div>
                    ) : (
                      /* AVATAR/LOGO INSIGNIA */
                      <div
                        className="anim-logo"
                        style={{
                          width: "48px",
                          height: "48px",
                          background: empresaInfo.tipo === "SUPERADMIN"
                            ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                            : `linear-gradient(135deg, ${primaryColor} 0%, #0369a1 100%)`,
                          color: "white",
                          borderRadius: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: "22px",
                          boxShadow: `0 6px 16px ${primaryColor}40`,
                          flexShrink: 0,
                        }}
                      >
                        {empresaInfo.tipo === "EMPRESA" ? empresaInfo.nombreEmpresa.charAt(0).toUpperCase() : "R"}
                      </div>
                    )}

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <h2 style={{ fontSize: "20px", margin: 0, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                          {empresaInfo.nombreEmpresa}
                        </h2>
                        {buscandoEmpresa && (
                          <span style={{ fontSize: "11px", color: "#94a3b8" }} title="Buscando logo...">🔄</span>
                        )}
                      </div>

                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>
                        {empresaInfo.tipo === "EMPRESA" ? (
                          <span style={{ color: primaryColor, fontWeight: 700 }}>
                            🏢 Acceso Oficial de Rent a Car
                          </span>
                        ) : empresaInfo.tipo === "SUPERADMIN" ? (
                          <span style={{ color: "#d97706", fontWeight: 700 }}>
                            👑 Consola Central SuperAdmin
                          </span>
                        ) : (
                          "Rent Operating System • Acceso Seguro"
                        )}
                      </div>
                    </div>
                  </div>

                  {empresaInfo.tipo === "EMPRESA" && (
                    <div
                      className="anim-logo"
                      style={{
                        marginTop: "12px",
                        padding: "6px 12px",
                        backgroundColor: "#f0f9ff",
                        borderRadius: "8px",
                        border: "1px solid #bae6fd",
                        fontSize: "11px",
                        color: "#0369a1",
                        fontWeight: 600,
                      }}
                    >
                      ✨ Bienvenido al portal de {empresaInfo.nombreEmpresa}
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
                  Iniciar Sesión
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 22px 0", lineHeight: 1.4 }}>
                  Introduce tus credenciales para acceder al panel.
                </p>

                {error && (
                  <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px", color: "#b91c1c", fontSize: "12px", marginBottom: "18px", lineHeight: 1.4 }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
                        Correo Electrónico *
                      </label>
                      {empresaInfo.tipo === "EMPRESA" && (
                        <span style={{ fontSize: "11px", color: primaryColor, fontWeight: 700 }}>
                          ✓ Empresa Reconocida
                        </span>
                      )}
                    </div>
                    <input
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "10px",
                        border: empresaInfo.tipo === "EMPRESA" ? `2px solid ${primaryColor}` : "1px solid #cbd5e1",
                        fontSize: "13px",
                        color: "#0f172a",
                        backgroundColor: "#f8fafc",
                        outline: "none",
                        transition: "all 0.2s",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Contraseña *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={mostrarPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "11px 40px 11px 14px",
                          borderRadius: "10px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          color: "#0f172a",
                          backgroundColor: "#f8fafc",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarPassword(!mostrarPassword)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "14px",
                          color: "#94a3b8",
                        }}
                      >
                        {mostrarPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginBottom: "22px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#475569" }}>
                      <input
                        type="checkbox"
                        checked={recordarPassword}
                        onChange={(e) => setRecordarPassword(e.target.checked)}
                      />
                      <span>Recordar credenciales</span>
                    </label>
                    <Link to="/recuperar-password" style={{ color: primaryColor, fontWeight: 700, textDecoration: "none" }}>
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    className="btn-shimmer"
                    disabled={iniciando}
                    style={{
                      width: "100%",
                      padding: "13px",
                      borderRadius: "12px",
                      background: `linear-gradient(135deg, ${primaryColor} 0%, #0369a1 100%)`,
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: `0 8px 20px ${primaryColor}50`,
                      transition: "all 0.2s",
                    }}
                  >
                    {iniciando ? "Verificando acceso..." : `Ingresar al Panel de ${empresaInfo.nombreEmpresa}`}
                  </button>
                </form>

                <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #f1f5f9", textAlign: "center", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <Link to="/registro" style={{ fontSize: "13px", fontWeight: 700, color: primaryColor, textDecoration: "none" }}>
                    🚀 ¿Eres dueño de un Rent a Car? Solicita tu empresa ↗
                  </Link>
                  {empresaInfo.tipo === "EMPRESA" && (
                    <a
                      href={`/portal/${empresaInfo.slug || "rentcar-santo-domingo"}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "12px", color: primaryColor, fontWeight: 700, textDecoration: "none" }}
                    >
                      🌐 Explorar Catálogo de Autos Públicos ({empresaInfo.nombreEmpresa}) ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: GLASSMORPHISM NEÓN                                               */}
      {/* ========================================================================= */}
      {diseno === "neon" && (
        <div style={{ minHeight: "calc(100vh - 65px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 16px", position: "relative", overflow: "hidden" }}>
          <div
            className="anim-orb-1"
            style={{
              position: "absolute",
              top: "15%",
              left: "20%",
              width: "350px",
              height: "350px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(14,165,233,0.35) 0%, transparent 70%)",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />
          <div
            className="anim-orb-2"
            style={{
              position: "absolute",
              bottom: "15%",
              right: "20%",
              width: "380px",
              height: "380px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(147,51,234,0.35) 0%, transparent 70%)",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 10,
              maxWidth: "430px",
              width: "100%",
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              borderRadius: "28px",
              padding: "40px 34px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
              color: "#f8fafc",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "26px" }}>
              {empresaInfo.logoUrl ? (
                <img
                  src={empresaInfo.logoUrl}
                  alt={empresaInfo.nombreEmpresa}
                  className="anim-logo"
                  style={{ maxHeight: "56px", maxWidth: "180px", objectFit: "contain", margin: "0 auto 12px", display: "block" }}
                />
              ) : (
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    margin: "0 auto 14px",
                    background: `linear-gradient(135deg, ${primaryColor} 0%, #6366f1 100%)`,
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: 900,
                    color: "#ffffff",
                    boxShadow: "0 8px 24px rgba(99,102,241,0.45)",
                  }}
                >
                  {empresaInfo.tipo === "EMPRESA" ? empresaInfo.nombreEmpresa.charAt(0).toUpperCase() : "R"}
                </div>
              )}
              <h2 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 4px 0", color: "#ffffff" }}>
                {empresaInfo.nombreEmpresa}
              </h2>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                {empresaInfo.eslogan}
              </p>
            </div>

            {error && (
              <div style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "10px", padding: "12px", color: "#fca5a5", fontSize: "12px", marginBottom: "18px" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontSize: "13px",
                    color: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.06)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
                  Contraseña *
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "12px 40px 12px 14px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      fontSize: "13px",
                      color: "#ffffff",
                      backgroundColor: "rgba(255,255,255,0.06)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#94a3b8",
                    }}
                  >
                    {mostrarPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginBottom: "22px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#94a3b8" }}>
                  <input
                    type="checkbox"
                    checked={recordarPassword}
                    onChange={(e) => setRecordarPassword(e.target.checked)}
                  />
                  <span>Recordar sesión</span>
                </label>
                <Link to="/recuperar-password" style={{ color: "#38bdf8", fontWeight: 700, textDecoration: "none" }}>
                  ¿Olvidaste tu clave?
                </Link>
              </div>

              <button
                type="submit"
                className="btn-shimmer"
                disabled={iniciando}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #0284c7 0%, #6366f1 50%, #4f46e5 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(99,102,241,0.45)",
                }}
              >
                {iniciando ? "Accediendo..." : `Ingresar a ${empresaInfo.nombreEmpresa}`}
              </button>
            </form>

            <div style={{ marginTop: "26px", paddingTop: "18px", borderTop: "1px solid rgba(255,255,255,0.1)", textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link to="/registro" style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", textDecoration: "none" }}>
                🚀 Registrar mi Rent a Car en la Red ↗
              </Link>
              {empresaInfo.tipo === "EMPRESA" && (
                <a
                  href={`/portal/${empresaInfo.slug || "rentcar-santo-domingo"}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: "12px", color: "#38bdf8", fontWeight: 700, textDecoration: "none" }}
                >
                  🌐 Explorar Catálogo de Autos Públicos ({empresaInfo.nombreEmpresa}) ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: SHOWCASE CORPORATIVO                                             */}
      {/* ========================================================================= */}
      {diseno === "showcase" && (
        <div style={{ minHeight: "calc(100vh - 65px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 16px" }}>
          <div
            style={{
              maxWidth: "1000px",
              width: "100%",
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexWrap: "wrap",
              backgroundColor: "#0f172a",
            }}
          >
            <div
              style={{
                flex: "1 1 480px",
                background: "linear-gradient(180deg, #172554 0%, #0f172a 100%)",
                padding: "44px 36px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRight: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: primaryColor, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#ffffff" }}>
                    {empresaInfo.tipo === "EMPRESA" ? empresaInfo.nombreEmpresa.charAt(0).toUpperCase() : "R"}
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff", letterSpacing: "1px" }}>
                    {empresaInfo.tipo === "EMPRESA" ? empresaInfo.nombreEmpresa.toUpperCase() : "RENTOS ECOSYSTEM"}
                  </span>
                </div>

                <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", lineHeight: 1.3, margin: "0 0 12px 0" }}>
                  {empresaInfo.tipo === "EMPRESA" ? `Bienvenido al sistema de ${empresaInfo.nombreEmpresa}.` : "Todo el ciclo de tu Rent a Car en una sola pantalla."}
                </h2>
                <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.5, margin: "0 0 28px 0" }}>
                  {empresaInfo.eslogan}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ padding: "14px", borderRadius: "12px", backgroundColor: "rgba(30, 41, 59, 0.7)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#38bdf8", marginBottom: "4px" }}>🚗 1. Parque Vehicular & Alquiler</div>
                    <div style={{ fontSize: "11px", color: "#cbd5e1" }}>Calendario de flota y protección de retorno contra eliminación accidental.</div>
                  </div>

                  <div style={{ padding: "14px", borderRadius: "12px", backgroundColor: "rgba(30, 41, 59, 0.7)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#34d399", marginBottom: "4px" }}>💰 2. Contabilidad & Finanzas</div>
                    <div style={{ fontSize: "11px", color: "#cbd5e1" }}>Preservación histórica de ingresos generados y cálculo de ROI por unidad.</div>
                  </div>

                  <div style={{ padding: "14px", borderRadius: "12px", backgroundColor: "rgba(30, 41, 59, 0.7)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#c084fc", marginBottom: "4px" }}>🔒 3. Seguridad Multi-Tenant</div>
                    <div style={{ fontSize: "11px", color: "#cbd5e1" }}>Aislamiento total de datos y protección progresiva contra intentos fallidos.</div>
                  </div>
                </div>
              </div>

              <div style={{ paddingTop: "20px", fontSize: "11px", color: "#64748b" }}>
                RentOS SaaS • Santo Domingo, República Dominicana
              </div>
            </div>

            <div
              style={{
                flex: "1 1 360px",
                backgroundColor: "#0b1324",
                padding: "44px 36px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ maxWidth: "340px", width: "100%", margin: "0 auto" }}>
                <div style={{ marginBottom: "24px" }}>
                  {empresaInfo.logoUrl ? (
                    <img src={empresaInfo.logoUrl} alt={empresaInfo.nombreEmpresa} className="anim-logo" style={{ maxHeight: "48px", maxWidth: "160px", objectFit: "contain", marginBottom: "12px", display: "block" }} />
                  ) : null}
                  <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: "0 0 4px 0" }}>
                    {empresaInfo.nombreEmpresa}
                  </h3>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                    {empresaInfo.tipo === "EMPRESA" ? "Acceso de Empresa Autorizada" : "SuperAdmin y Administradores RentOS"}
                  </p>
                </div>

                {error && (
                  <div style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "10px", padding: "12px", color: "#fca5a5", fontSize: "12px", marginBottom: "18px" }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
                      Usuario o Correo *
                    </label>
                    <input
                      type="email"
                      placeholder="tu@correo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "10px",
                        border: "1px solid #334155",
                        fontSize: "13px",
                        color: "#ffffff",
                        backgroundColor: "#1e293b",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#cbd5e1", marginBottom: "6px" }}>
                      Contraseña *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={mostrarPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                          width: "100%",
                          padding: "11px 40px 11px 14px",
                          borderRadius: "10px",
                          border: "1px solid #334155",
                          fontSize: "13px",
                          color: "#ffffff",
                          backgroundColor: "#1e293b",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarPassword(!mostrarPassword)}
                        style={{
                          position: "absolute",
                          right: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "14px",
                          color: "#94a3b8",
                        }}
                      >
                        {mostrarPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginBottom: "22px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#94a3b8" }}>
                      <input
                        type="checkbox"
                        checked={recordarPassword}
                        onChange={(e) => setRecordarPassword(e.target.checked)}
                      />
                      <span>Recordar equipo</span>
                    </label>
                    <Link to="/recuperar-password" style={{ color: "#38bdf8", fontWeight: 700, textDecoration: "none" }}>
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={iniciando}
                    style={{
                      width: "100%",
                      padding: "13px",
                      borderRadius: "10px",
                      backgroundColor: primaryColor,
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: `0 6px 18px ${primaryColor}50`,
                    }}
                  >
                    {iniciando ? "Accediendo..." : `Ingresar al Sistema (${empresaInfo.nombreEmpresa})`}
                  </button>
                </form>

                <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #1e293b", textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link to="/registro" style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", textDecoration: "none" }}>
                    🚀 Solicitar Afiliación de Empresa ↗
                  </Link>
                  {empresaInfo.tipo === "EMPRESA" && (
                    <a
                      href={`/portal/${empresaInfo.slug || "rentcar-santo-domingo"}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 700, textDecoration: "none" }}
                    >
                      🌐 Explorar Catálogo de Autos Públicos ({empresaInfo.nombreEmpresa}) ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
