/**
 * ============================================================================
 * RentOS - Portal de Inicio de Sesión y Autenticación (LoginPage)
 * ============================================================================
 * Soporta previsualización dinámica interactiva de los 3 estilos solicitados:
 * 1. Split-Screen Tecnológico (Visual satelital/telemetría + formulario blanco limpio)
 * 2. Glassmorphism Neón (Fondo oscuro con orbes luminosos flotantes + tarjeta esmerilada)
 * 3. Showcase Corporativo (Resumen de ecosistema RentOS + portal administrativo slate)
 */

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type DisenoTipo = "split" | "neon" | "showcase";

export default function LoginPage() {
  const { login, usuario } = useAuth();
  const navigate = useNavigate();

  const [diseno, setDiseno] = useState<DisenoTipo>(() => {
    return (localStorage.getItem("rentos_login_diseno") as DisenoTipo) || "split";
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
  const [animandoDerrape, setAnimandoDerrape] = useState(false);

  // Síntesis de sonido de motor V8 y derrape de llanta con Web Audio API nativo
  const playSkidSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // 1. Rugido del motor en aceleración a fondo (V8 Twin-Turbo Launch Control)
      const engineOsc = ctx.createOscillator();
      engineOsc.type = "sawtooth";
      engineOsc.frequency.setValueAtTime(80, ctx.currentTime);
      engineOsc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.8);
      engineOsc.frequency.exponentialRampToValueAtTime(360, ctx.currentTime + 1.4);

      const engineGain = ctx.createGain();
      engineGain.gain.setValueAtTime(0.12, ctx.currentTime);
      engineGain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.7);
      engineGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);

      engineOsc.connect(engineGain);
      engineGain.connect(ctx.destination);
      engineOsc.start();
      engineOsc.stop(ctx.currentTime + 1.6);

      // 2. Ruido blanco de fricción y humo de neumático quemando caucho
      const bufferSize = ctx.sampleRate * 1.6;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 1.2));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1350, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 1.3);
      filter.Q.value = 2.8;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.22, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      // 3. Chirrido agudo de derrape sobre asfalto caliente
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1650, ctx.currentTime + 0.35);
      osc.frequency.exponentialRampToValueAtTime(580, ctx.currentTime + 1.2);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.08, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start();
      noise.start();
      osc.stop(ctx.currentTime + 1.25);
      noise.stop(ctx.currentTime + 1.5);
    } catch {
      // Ignorar si el navegador bloquea audio por políticas de interacción
    }
  };

  // Botón de prueba para que el usuario pueda ver el derrape sin ingresar contraseña
  const probarDerrape = () => {
    setAnimandoDerrape(true);
    playSkidSound();
    setTimeout(() => {
      setAnimandoDerrape(false);
    }, 2300);
  };

  useEffect(() => {
    if (usuario && !animandoDerrape) {
      navigate("/dashboard");
    }
  }, [usuario, navigate, animandoDerrape]);

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

      // ¡Animación de llanta derrapando fotorrealista antes de entrar a la plataforma!
      setAnimandoDerrape(true);
      playSkidSound();
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
    } finally {
      setIniciando(false);
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", backgroundColor: diseno === "neon" ? "#070b14" : diseno === "showcase" ? "#0b1324" : "#0a0f1d" }}>
      {/* Estilos CSS Inyectados para Animaciones Elegantes y Derrape Fotorrealista */}
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
        .anim-float { animation: floatSlow 5s ease-in-out infinite; }
        .anim-float-delayed { animation: floatSlow 6s ease-in-out infinite 2s; }
        .anim-orb-1 { animation: pulseGlow 10s ease-in-out infinite; }
        .anim-orb-2 { animation: pulseGlow2 12s ease-in-out infinite; }
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

        /* ANIMACIONES DE DERRAPE FOTORREALISTA */
        @keyframes intenseBurnoutVibe {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          20% { transform: translate(-2px, -3px) rotate(-0.5deg) scale(1.006); }
          40% { transform: translate(3px, 2px) rotate(0.6deg) scale(0.996); }
          60% { transform: translate(-2px, 3px) rotate(-0.4deg) scale(1.008); }
          80% { transform: translate(3px, -2px) rotate(0.5deg) scale(0.998); }
        }
        @keyframes thermoGlowAnim {
          0% { transform: scale(0.92); opacity: 0.65; filter: blur(12px); }
          100% { transform: scale(1.18); opacity: 1; filter: blur(20px); }
        }
        @keyframes wheelSpinBlurAnim {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes smokeDriftReal1 {
          0% { transform: translate(0, 0) scale(0.4); opacity: 0.8; }
          50% { opacity: 0.6; }
          100% { transform: translate(-90px, -70px) scale(2.2); opacity: 0; }
        }
        @keyframes smokeDriftReal2 {
          0% { transform: translate(0, 0) scale(0.5); opacity: 0.9; }
          50% { opacity: 0.7; }
          100% { transform: translate(80px, -90px) scale(2.6); opacity: 0; }
        }
        @keyframes sparkFlyReal {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-170px, 45px) scale(0.2); opacity: 0; }
        }
        @keyframes speedBarFill {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes revTextPulse {
          0%, 100% { transform: scale(1); text-shadow: 0 0 12px rgba(239,68,68,0.6); }
          50% { transform: scale(1.06); text-shadow: 0 0 30px rgba(239,68,68,1); }
        }
      `}</style>

      {/* BARRA SUPERIOR FLOTANTE DE SELECCIÓN DE DISEÑO */}
      <aside
        aria-label="Selector de diseño"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(16px)",
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🎨</span>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#f8fafc" }}>
              Previsualizador de Diseños de Login • RentOS
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>
              Haz clic en cada botón para ver en pantalla completa cómo luce y se siente cada opción:
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
              backgroundColor: diseno === "split" ? "#0284c7" : "transparent",
              color: diseno === "split" ? "#ffffff" : "#94a3b8",
              boxShadow: diseno === "split" ? "0 2px 8px rgba(2,132,199,0.5)" : "none",
            }}
          >
            1. Split-Screen Tecnológico ⭐
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
              boxShadow: diseno === "neon" ? "0 2px 8px rgba(99,102,241,0.5)" : "none",
            }}
          >
            2. Glassmorphism Neón
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
              boxShadow: diseno === "showcase" ? "0 2px 8px rgba(37,99,235,0.5)" : "none",
            }}
          >
            3. Showcase Corporativo
          </button>

          {/* BOTÓN PARA PROBAR EL DERRAPE DE LLANTA DIRECTAMENTE */}
          <button
            type="button"
            onClick={probarDerrape}
            title="Haz clic para ver cómo queda la animación de la llanta derrapando"
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 800,
              border: "1px solid rgba(249, 115, 22, 0.4)",
              cursor: "pointer",
              transition: "all 0.2s",
              backgroundColor: "rgba(249, 115, 22, 0.15)",
              color: "#fb923c",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginLeft: "4px",
              boxShadow: "0 2px 8px rgba(249, 115, 22, 0.25)",
            }}
          >
            <span>🏎️💨</span> Probar Derrape
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MODAL / OVERLAY EN PANTALLA COMPLETA: LLANTA DERRAPANDO FOTORREALISTA     */}
      {/* ========================================================================= */}
      {animandoDerrape && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(3, 7, 18, 0.96)",
            backdropFilter: "blur(24px)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            padding: "20px",
            color: "#ffffff",
          }}
        >
          {/* Resplandor térmico de fondo */}
          <div
            style={{
              position: "absolute",
              width: "600px",
              height: "600px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(249, 115, 22, 0.15) 50%, transparent 70%)",
              filter: "blur(80px)",
              pointerEvents: "none",
            }}
          />

          {/* TARJETA CINEMÁTICA CON LA LLANTA FOTORREALISTA EN BURNOUT */}
          <div
            className="anim-burnout-vibe"
            style={{
              position: "relative",
              maxWidth: "420px",
              width: "100%",
              aspectRatio: "1 / 1",
              borderRadius: "28px",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 30px 70px -15px rgba(0,0,0,0.9), 0 0 50px rgba(239,68,68,0.4)",
              backgroundColor: "#000000",
            }}
          >
            {/* Imagen Fotorrealista de la Llanta en Burnout */}
            <img
              src="/drift-burnout.jpg"
              alt="Llanta deportiva quemando caucho"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                filter: "contrast(1.08) saturate(1.15)",
              }}
            />

            {/* Efecto de Fricción Térmica Pulsante en el Disco de Freno al Rojo Vivo */}
            <div
              style={{
                position: "absolute",
                top: "37%",
                left: "39%",
                width: "28%",
                height: "28%",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255, 50, 0, 0.6) 0%, rgba(255, 140, 0, 0.4) 45%, transparent 75%)",
                filter: "blur(14px)",
                mixBlendMode: "screen",
                animation: "thermoGlowAnim 0.4s infinite alternate ease-in-out",
                pointerEvents: "none",
              }}
            />

            {/* Overlay de Giro a Alta Velocidad sobre el Rin (Motion Blur) */}
            <div
              style={{
                position: "absolute",
                top: "32%",
                left: "34%",
                width: "38%",
                height: "38%",
                borderRadius: "50%",
                background: "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.12) 30deg, transparent 60deg, rgba(255,255,255,0.14) 90deg, transparent 120deg, rgba(255,255,255,0.12) 150deg, transparent 180deg, rgba(255,255,255,0.15) 210deg, transparent 240deg, rgba(255,255,255,0.12) 270deg, transparent 300deg, rgba(255,255,255,0.15) 330deg, transparent 360deg)",
                animation: "wheelSpinBlurAnim 0.12s linear infinite",
                pointerEvents: "none",
                mixBlendMode: "overlay",
              }}
            />

            {/* Nubes de Humo Volumétrico Superpuestas */}
            <div
              style={{
                position: "absolute",
                top: "20%",
                left: "-10%",
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                backgroundColor: "rgba(241, 245, 249, 0.45)",
                filter: "blur(22px)",
                animation: "smokeDriftReal1 1.2s infinite ease-out",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "10%",
                right: "-5%",
                width: "140px",
                height: "140px",
                borderRadius: "50%",
                backgroundColor: "rgba(226, 232, 240, 0.5)",
                filter: "blur(26px)",
                animation: "smokeDriftReal2 1.4s infinite ease-out 0.2s",
                pointerEvents: "none",
              }}
            />

            {/* Chispas Volantes Dinámicas */}
            <div
              style={{
                position: "absolute",
                bottom: "12%",
                left: "42%",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#fef08a",
                boxShadow: "0 0 12px #f59e0b, 0 0 20px #ef4444",
                animation: "sparkFlyReal 0.4s infinite linear",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "10%",
                left: "38%",
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                backgroundColor: "#f97316",
                boxShadow: "0 0 10px #f97316",
                animation: "sparkFlyReal 0.45s infinite linear 0.15s",
                pointerEvents: "none",
              }}
            />

            {/* Badges de Telemetría Deportiva */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                zIndex: 20,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(15, 23, 42, 0.8)",
                backdropFilter: "blur(12px)",
                padding: "6px 14px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444", boxShadow: "0 0 10px #ef4444" }} />
              <span style={{ fontSize: "11px", fontWeight: 900, letterSpacing: "1px", color: "#f8fafc" }}>
                LAUNCH CONTROL • 8,200 RPM
              </span>
            </div>

            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                zIndex: 20,
                backgroundColor: "rgba(239, 68, 68, 0.25)",
                backdropFilter: "blur(12px)",
                padding: "6px 12px",
                borderRadius: "999px",
                border: "1px solid rgba(239,68,68,0.5)",
                fontSize: "11px",
                fontWeight: 900,
                color: "#fca5a5",
              }}
            >
              TURBO BOOST +2.1 BAR
            </div>
          </div>

          {/* HUD INFERIOR: TACÓMETRO Y MENSAJE DE ENTRADA */}
          <div style={{ textAlign: "center", marginTop: "20px", zIndex: 30, maxWidth: "420px", width: "100%" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 16px",
                borderRadius: "999px",
                backgroundColor: "rgba(239, 68, 68, 0.2)",
                border: "1px solid rgba(239, 68, 68, 0.5)",
                color: "#f87171",
                fontSize: "12px",
                fontWeight: 900,
                letterSpacing: "1px",
                marginBottom: "8px",
                animation: "revTextPulse 0.5s infinite alternate",
              }}
            >
              <span>🔥</span> ¡QUEMANDO NEUMÁTICOS EN PISTA!
            </div>

            <h3 style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 4px 0", letterSpacing: "-0.5px", color: "#ffffff" }}>
              Iniciando Sesión en RentOS...
            </h3>
            <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 14px 0" }}>
              Tracción verificada en las 4 ruedas. Acelerando al panel de control.
            </p>

            {/* Barra de Progreso Digital */}
            <div
              style={{
                width: "100%",
                height: "8px",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: "999px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 0 15px rgba(239,68,68,0.4)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #38bdf8 0%, #f59e0b 50%, #ef4444 100%)",
                  animation: "speedBarFill 1.8s ease-in-out forwards",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 1: SPLIT-SCREEN TECNOLÓGICO Y FLOTA (RECOMENDADO)                     */}
      {/* ========================================================================= */}
      {diseno === "split" && (
        <div style={{ minHeight: "calc(100vh - 65px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "28px 16px" }}>
          <div
            style={{
              maxWidth: "1060px",
              width: "100%",
              borderRadius: "28px",
              overflow: "hidden",
              boxShadow: "0 25px 60px -15px rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexWrap: "wrap",
              backgroundColor: "#0d1527",
            }}
          >
            {/* LADO IZQUIERDO: Visual Satelital, Telemetría & Métricas */}
            <div
              style={{
                flex: "1 1 520px",
                background: "linear-gradient(145deg, #070c18 0%, #0d172e 50%, #092347 100%)",
                padding: "48px 40px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                overflow: "hidden",
                borderRight: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Radar glow ambient */}
              <div
                style={{
                  position: "absolute",
                  top: "-100px",
                  right: "-100px",
                  width: "320px",
                  height: "320px",
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
                  SISTEMA EN VIVO • V4.2 SAAS MULTI-TENANT
                </div>

                <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff", lineHeight: 1.25, margin: "0 0 14px 0", letterSpacing: "-0.5px" }}>
                  Control inteligente y telemetría de tu flota.
                </h1>
                <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.6, margin: 0, maxWidth: "460px" }}>
                  Monitoreo satelital GPS en tiempo real, corte de ignición antirrobo, contratos digitales y facturación fiscal NCF automatizada en República Dominicana.
                </p>
              </div>

              {/* Tarjetas Flotantes con Datos del Sistema */}
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
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#f8fafc" }}>Telemetría GPS y Anti-Robo</div>
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
                    1 USD = 60.85 DOP
                  </span>
                </div>
              </div>

              {/* Pie Izquierdo */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "18px", fontSize: "12px", color: "#64748b" }}>
                <span>🛡️ Encriptación SHA-256 + Bcrypt</span>
                <span>📍 Santo Domingo • Punta Cana • Santiago</span>
              </div>
            </div>

            {/* LADO DERECHO: Formulario Limpio, Elegante y Luminoso */}
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
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "26px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                      color: "white",
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "22px",
                      boxShadow: "0 6px 16px rgba(2,132,199,0.35)",
                    }}
                  >
                    R
                  </div>
                  <div>
                    <h2 style={{ fontSize: "22px", margin: 0, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
                      RentOS
                    </h2>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                      Rent Operating System • Acceso Seguro
                    </span>
                  </div>
                </div>

                <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px 0" }}>
                  Iniciar Sesión
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 24px 0", lineHeight: 1.4 }}>
                  Introduce tus credenciales para acceder a tu panel.
                </p>

                {error && (
                  <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px", color: "#b91c1c", fontSize: "12px", marginBottom: "18px", lineHeight: 1.4 }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      placeholder="rentosrd@gmail.com o tu correo"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
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
                    <Link to="/recuperar-password" style={{ color: "#0284c7", fontWeight: 700, textDecoration: "none" }}>
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
                      background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 8px 20px rgba(2,132,199,0.35)",
                      transition: "transform 0.15s, box-shadow 0.15s",
                    }}
                  >
                    {iniciando ? "Verificando acceso..." : "Ingresar al Panel de Control"}
                  </button>
                </form>

                <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #f1f5f9", textAlign: "center", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <Link to="/registro" style={{ fontSize: "13px", fontWeight: 700, color: "#0284c7", textDecoration: "none" }}>
                    🚀 ¿Eres dueño de un Rent a Car? Solicita tu empresa ↗
                  </Link>
                  <a href="/reservar" target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#94a3b8", textDecoration: "none" }}>
                    🌐 Catálogo Público de Reservas ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: GLASSMORPHISM NEÓN CENTRADO (ESTILO FINTECH)                      */}
      {/* ========================================================================= */}
      {diseno === "neon" && (
        <div style={{ minHeight: "calc(100vh - 65px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 16px", position: "relative", overflow: "hidden" }}>
          {/* Orbes de neón luminosos animados de fondo */}
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

          {/* Tarjeta Glassmorphism de Alta Gama */}
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
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99,102,241,0.2)",
              color: "#f8fafc",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "26px" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  margin: "0 auto 14px",
                  background: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
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
                R
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 4px 0", color: "#ffffff" }}>
                RentOS
              </h2>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                Plataforma Operativa de Alto Rendimiento
              </p>
            </div>

            {error && (
              <div style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "10px", padding: "12px", color: "#fca5a5", fontSize: "12px", marginBottom: "18px", lineHeight: 1.4 }}>
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
                  placeholder="rentosrd@gmail.com o tu correo"
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
                {iniciando ? "Accediendo..." : "Iniciar Sesión Segura →"}
              </button>
            </form>

            <div style={{ marginTop: "26px", paddingTop: "18px", borderTop: "1px solid rgba(255,255,255,0.1)", textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link to="/registro" style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", textDecoration: "none" }}>
                🚀 Registrar mi Rent a Car en la Red ↗
              </Link>
              <a href="/reservar" target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#64748b", textDecoration: "none" }}>
                🌐 Explorar Catálogo de Autos Públicos ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: SHOWCASE CORPORATIVO CON 3 PILARES                               */}
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
            {/* Lado Izquierdo: Pilares del Sistema */}
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
                  <div style={{ width: "34px", height: "34px", borderRadius: "10px", backgroundColor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "#ffffff" }}>
                    R
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff", letterSpacing: "1px" }}>
                    RENTOS ECOSYSTEM
                  </span>
                </div>

                <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", lineHeight: 1.3, margin: "0 0 12px 0" }}>
                  Todo el ciclo de tu Rent a Car en una sola pantalla.
                </h2>
                <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.5, margin: "0 0 28px 0" }}>
                  Diseñado para el mercado dominicano: tasa BCRD, marbetes, revistas y contratos legales.
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

            {/* Lado Derecho: Formulario Slate Corporativo */}
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
                  <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: "0 0 4px 0" }}>
                    Portal Corporativo
                  </h3>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
                    SuperAdmin y Administradores RentOS
                  </p>
                </div>

                {error && (
                  <div style={{ backgroundColor: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "10px", padding: "12px", color: "#fca5a5", fontSize: "12px", marginBottom: "18px", lineHeight: 1.4 }}>
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
                      placeholder="rentosrd@gmail.com"
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
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 6px 18px rgba(37,99,235,0.4)",
                    }}
                  >
                    {iniciando ? "Accediendo..." : "Ingresar al Sistema"}
                  </button>
                </form>

                <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #1e293b", textAlign: "center", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <Link to="/registro" style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", textDecoration: "none" }}>
                    🚀 Solicitar Afiliación de Empresa ↗
                  </Link>
                  <a href="/reservar" target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#64748b", textDecoration: "none" }}>
                    🌐 Catálogo de Vehículos en Renta ↗
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
