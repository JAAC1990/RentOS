/**
 * ============================================================================
 * RentOS - Consola de Configuración de Super Admin & Marca Global
 * ============================================================================
 * Permite al SuperAdmin (rentosrd@gmail.com) personalizar:
 * 1. Identidad corporativa de la plataforma: Nombre, eslogan, logo y paleta de colores.
 * 2. Canales oficiales de soporte, correo de recuperación y WhatsApp de mesa de ayuda.
 * 3. Parámetros de seguridad (expiración de enlaces, bloqueos progresivos).
 * 4. Control global de la tasa de cambio BCRD (automático vs manual).
 * 5. Megáfono / Anuncio global emitido a toda la red de Rent a Cars.
 * 6. Términos de servicio y políticas de uso de RentOS.
 */

import React, { useEffect, useState } from "react";
import { API_URLS } from "../services/api";

export interface SuperAdminConfig {
  id: number;
  nombrePlataforma: string;
  esloganPlataforma: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  colorPrimario: string;
  colorAcento: string;
  emailSoporte: string;
  telefonoSoporte: string;
  whatsappSoporte: string;
  tiempoExpiracionTokenMin: number;
  maxIntentosFallidos: number;
  tiempoBloqueoMin: number;
  modoTasa: "AUTOMATICO_BCRD" | "MANUAL";
  tasaManual: number | null;
  margenTasaDop: number;
  anuncioActivo: boolean;
  anuncioMensaje: string;
  anuncioTipo: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
  permitirRegistroPublico: boolean;
  terminosServicio: string;
  politicaPrivacidad: string;
}

const PRESETS_COLOR_SUPERADMIN = [
  { nombre: "Azul RentOS", primario: "#0284c7", acento: "#38bdf8" },
  { nombre: "Índigo Deep", primario: "#4f46e5", acento: "#818cf8" },
  { nombre: "Púrpura Real", primario: "#7c3aed", acento: "#c084fc" },
  { nombre: "Verde Esmeralda", primario: "#059669", acento: "#34d399" },
  { nombre: "Cyber Neón", primario: "#0891b2", acento: "#22d3ee" },
  { nombre: "Dorado Ejecutivo", primario: "#d97706", acento: "#fbbf24" },
  { nombre: "Carmesí Deportivo", primario: "#dc2626", acento: "#f87171" },
  { nombre: "Grafito Oscuro", primario: "#1e293b", acento: "#94a3b8" },
];

export default function SuperAdminConfigSection() {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Estado del formulario
  const [nombrePlataforma, setNombrePlataforma] = useState("RentOS Global");
  const [esloganPlataforma, setEsloganPlataforma] = useState("Consola de Administración Central Multi-Tenant");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [tipoEntradaLogo, setTipoEntradaLogo] = useState<"archivo" | "url">("archivo");
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [colorPrimario, setColorPrimario] = useState("#0284c7");
  const [colorAcento, setColorAcento] = useState("#38bdf8");
  const [emailSoporte, setEmailSoporte] = useState("rentosrd@gmail.com");
  const [telefonoSoporte, setTelefonoSoporte] = useState("(809) 555-0100");
  const [whatsappSoporte, setWhatsappSoporte] = useState("18095550100");
  const [tiempoExpiracionTokenMin, setTiempoExpiracionTokenMin] = useState(15);
  const [maxIntentosFallidos, setMaxIntentosFallidos] = useState(5);
  const [tiempoBloqueoMin, setTiempoBloqueoMin] = useState(15);
  const [modoTasa, setModoTasa] = useState<"AUTOMATICO_BCRD" | "MANUAL">("AUTOMATICO_BCRD");
  const [tasaManual, setTasaManual] = useState<string>("58.70");
  const [margenTasaDop, setMargenTasaDop] = useState<string>("0.00");
  const [anuncioActivo, setAnuncioActivo] = useState(false);
  const [anuncioMensaje, setAnuncioMensaje] = useState("Bienvenido a la red de RentOS. Sistema operativo para Rent a Cars.");
  const [anuncioTipo, setAnuncioTipo] = useState<"INFO" | "SUCCESS" | "WARNING" | "DANGER">("INFO");
  const [permitirRegistroPublico, setPermitirRegistroPublico] = useState(true);
  const [terminosServicio, setTerminosServicio] = useState("");
  const [politicaPrivacidad, setPoliticaPrivacidad] = useState("");

  const cargarConfiguracion = async () => {
    try {
      setCargando(true);
      setError("");
      const res = await fetch(API_URLS.superadminConfig);
      if (!res.ok) throw new Error("No fue posible consultar la configuración de Super Admin.");
      const data: SuperAdminConfig = await res.json();

      setNombrePlataforma(data.nombrePlataforma || "RentOS Global");
      setEsloganPlataforma(data.esloganPlataforma || "Consola de Administración Central Multi-Tenant");
      setLogoUrl(data.logoUrl || "");
      setFaviconUrl(data.faviconUrl || "");
      setColorPrimario(data.colorPrimario || "#0284c7");
      setColorAcento(data.colorAcento || "#38bdf8");
      setEmailSoporte(data.emailSoporte || "rentosrd@gmail.com");
      setTelefonoSoporte(data.telefonoSoporte || "(809) 555-0100");
      setWhatsappSoporte(data.whatsappSoporte || "18095550100");
      setTiempoExpiracionTokenMin(data.tiempoExpiracionTokenMin || 15);
      setMaxIntentosFallidos(data.maxIntentosFallidos || 5);
      setTiempoBloqueoMin(data.tiempoBloqueoMin || 15);
      setModoTasa(data.modoTasa || "AUTOMATICO_BCRD");
      setTasaManual(data.tasaManual ? String(data.tasaManual) : "58.70");
      setMargenTasaDop(String(data.margenTasaDop || "0.00"));
      setAnuncioActivo(Boolean(data.anuncioActivo));
      setAnuncioMensaje(data.anuncioMensaje || "Bienvenido a la red de RentOS.");
      setAnuncioTipo(data.anuncioTipo || "INFO");
      setPermitirRegistroPublico(data.permitirRegistroPublico !== false);
      setTerminosServicio(data.terminosServicio || "");
      setPoliticaPrivacidad(data.politicaPrivacidad || "");
    } catch (err) {
      console.error(err);
      setError("No fue posible conectar con el servidor para obtener los datos de Super Admin.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  // Subida y compresión de Logo para Super Admin
  const handleSubirLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG, WEBP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("La imagen no debe superar los 8 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimized = canvas.toDataURL("image/png");
          setLogoUrl(optimized);
          setMensaje("🖼️ Logotipo de Super Admin cargado y optimizado con éxito.");
        } else {
          setLogoUrl(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const payload = {
        nombrePlataforma,
        esloganPlataforma,
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        colorPrimario,
        colorAcento,
        emailSoporte,
        telefonoSoporte,
        whatsappSoporte,
        tiempoExpiracionTokenMin: Number(tiempoExpiracionTokenMin),
        maxIntentosFallidos: Number(maxIntentosFallidos),
        tiempoBloqueoMin: Number(tiempoBloqueoMin),
        modoTasa,
        tasaManual: modoTasa === "MANUAL" ? parseFloat(tasaManual) || null : null,
        margenTasaDop: parseFloat(margenTasaDop) || 0,
        anuncioActivo,
        anuncioMensaje,
        anuncioTipo,
        permitirRegistroPublico,
        terminosServicio,
        politicaPrivacidad,
      };

      const res = await fetch(API_URLS.superadminConfig, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "No fue posible guardar la configuración.");
      }

      setMensaje("✨ ¡Configuración global de SuperAdmin actualizada exitosamente! Los cambios ya están en vigor en la plataforma.");
      // Limpiar mensaje tras unos segundos
      setTimeout(() => setMensaje(""), 6000);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al guardar la configuración de SuperAdmin.");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="content-panel">
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <strong>Cargando consola de control de Super Admin...</strong>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Banner Superior Distintivo SuperAdmin */}
      <div
        style={{
          background: "linear-gradient(135deg, #090e1a 0%, #1e1b4b 50%, #0f172a 100%)",
          borderRadius: "16px",
          padding: "24px 28px",
          color: "#ffffff",
          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 800, color: "#fbbf24", marginBottom: "8px" }}>
            <span>👑</span> CONTROL MAESTRO DE SUPERADMIN
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 6px 0", letterSpacing: "-0.5px" }}>
            Personalización de Plataforma & Marca Global
          </h2>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0, maxWidth: "680px", lineHeight: 1.5 }}>
            Aquí puedes personalizar el logotipo del sistema, colores del login, datos de soporte, políticas de seguridad y emitir comunicados urgentes o anuncios a todos los Rent a Cars de la red.
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>Correo de SuperAdmin Autorizado:</div>
          <code style={{ fontSize: "13px", color: "#38bdf8", fontWeight: 700, background: "rgba(56,189,248,0.1)", padding: "4px 8px", borderRadius: "6px" }}>
            {emailSoporte}
          </code>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && (
        <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "14px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>✅</span>
          <span>{mensaje}</span>
        </div>
      )}
      {error && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", padding: "14px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={guardarConfiguracion} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* ========================================================================= */}
        {/* SECCIÓN 1: IDENTIDAD VISUAL & MARCA DE LA PLATAFORMA                     */}
        {/* ========================================================================= */}
        <div className="content-panel">
          <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>🎨 Identidad Visual, Logotipo y Colores de la Plataforma</h2>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Aplica al login y cabecera global</span>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "20px" }}>
              <div className="form-field">
                <label>Nombre Comercial de la Plataforma *</label>
                <input
                  type="text"
                  value={nombrePlataforma}
                  onChange={(e) => setNombrePlataforma(e.target.value)}
                  placeholder="RentOS Global"
                  required
                />
                <span className="field-hint">Se mostrará en la barra de navegación, correos y pantalla de acceso.</span>
              </div>

              <div className="form-field">
                <label>Eslogan / Frase de Acceso *</label>
                <input
                  type="text"
                  value={esloganPlataforma}
                  onChange={(e) => setEsloganPlataforma(e.target.value)}
                  placeholder="Consola de Administración Central Multi-Tenant"
                />
                <span className="field-hint">Aparece en el subtítulo del login cuando se detecta el SuperAdmin.</span>
              </div>
            </div>

            {/* Selector de Logotipo */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "18px", marginTop: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", alignItems: "flex-start" }}>
                <div>
                  <label style={{ fontWeight: 700, fontSize: "13px", display: "block", marginBottom: "6px" }}>
                    Logotipo Oficial de Super Admin / RentOS
                  </label>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 12px 0" }}>
                    Carga el logo oficial que se presentará en la consola de SuperAdmin y en el formulario de inicio de sesión cuando ingreses tu correo.
                  </p>

                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <button
                      type="button"
                      onClick={() => setTipoEntradaLogo("archivo")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: tipoEntradaLogo === "archivo" ? "2px solid var(--primary)" : "1px solid var(--border)",
                        backgroundColor: tipoEntradaLogo === "archivo" ? "var(--primary-soft)" : "transparent",
                        color: tipoEntradaLogo === "archivo" ? "var(--primary)" : "var(--text)",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      📁 Subir desde mi Dispositivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoEntradaLogo("url")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: tipoEntradaLogo === "url" ? "2px solid var(--primary)" : "1px solid var(--border)",
                        backgroundColor: tipoEntradaLogo === "url" ? "var(--primary-soft)" : "transparent",
                        color: tipoEntradaLogo === "url" ? "var(--primary)" : "var(--text)",
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      🔗 Enlace / URL de Internet
                    </button>
                  </div>

                  {tipoEntradaLogo === "archivo" ? (
                    <div>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml, image/webp"
                        onChange={handleSubirLogo}
                        style={{ fontSize: "13px" }}
                      />
                      <span className="field-hint" style={{ display: "block", marginTop: "4px" }}>
                        PNG transparente o SVG recomendado (máx. 8 MB). Se optimiza automáticamente.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://ejemplo.com/logos/rentos-logo.png"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "13px" }}
                      />
                      <span className="field-hint" style={{ display: "block", marginTop: "4px" }}>
                        Enlace directo HTTPS con terminación .png, .svg, o .jpg
                      </span>
                    </div>
                  )}

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      style={{
                        marginTop: "10px",
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      🗑️ Quitar logotipo personalizado
                    </button>
                  )}
                </div>

                {/* Previsualización del Logo en Modo Claro y Oscuro */}
                <div style={{ backgroundColor: "var(--background)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px", textTransform: "uppercase" }}>
                    Vista Previa en Vivo del Logo
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ backgroundColor: "#ffffff", padding: "14px", borderRadius: "8px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "10px", color: "#64748b", display: "block", marginBottom: "6px" }}>Fondo Blanco</span>
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo preview" style={{ maxHeight: "42px", maxWidth: "100%", objectFit: "contain" }} />
                      ) : (
                        <div style={{ color: colorPrimario, fontWeight: 900, fontSize: "18px" }}>{nombrePlataforma}</div>
                      )}
                    </div>

                    <div style={{ backgroundColor: "#0f172a", padding: "14px", borderRadius: "8px", textAlign: "center", border: "1px solid #1e293b" }}>
                      <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", marginBottom: "6px" }}>Fondo Oscuro</span>
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo preview" style={{ maxHeight: "42px", maxWidth: "100%", objectFit: "contain" }} />
                      ) : (
                        <div style={{ color: colorAcento, fontWeight: 900, fontSize: "18px" }}>{nombrePlataforma}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Paleta de Colores de Marca */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "18px", marginTop: "18px" }}>
              <label style={{ fontWeight: 700, fontSize: "13px", display: "block", marginBottom: "8px" }}>
                Paleta Cromática de la Plataforma SuperAdmin
              </label>

              {/* Presets Rápidos */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                {PRESETS_COLOR_SUPERADMIN.map((preset) => (
                  <button
                    key={preset.nombre}
                    type="button"
                    onClick={() => {
                      setColorPrimario(preset.primario);
                      setColorAcento(preset.acento);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: colorPrimario === preset.primario ? `2px solid ${preset.primario}` : "1px solid var(--border)",
                      backgroundColor: colorPrimario === preset.primario ? "var(--primary-soft)" : "transparent",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: preset.primario }} />
                    <span>{preset.nombre}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                <div className="form-field">
                  <label>Color Primario (Hexadecimal)</label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="color"
                      value={colorPrimario}
                      onChange={(e) => setColorPrimario(e.target.value)}
                      style={{ width: "42px", height: "38px", padding: "2px", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer" }}
                    />
                    <input
                      type="text"
                      value={colorPrimario}
                      onChange={(e) => setColorPrimario(e.target.value)}
                      style={{ flex: 1, padding: "8px 12px", fontSize: "13px", fontFamily: "monospace", borderRadius: "8px", border: "1px solid var(--border)" }}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Color de Acento / Neón (Hexadecimal)</label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="color"
                      value={colorAcento}
                      onChange={(e) => setColorAcento(e.target.value)}
                      style={{ width: "42px", height: "38px", padding: "2px", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer" }}
                    />
                    <input
                      type="text"
                      value={colorAcento}
                      onChange={(e) => setColorAcento(e.target.value)}
                      style={{ flex: 1, padding: "8px 12px", fontSize: "13px", fontFamily: "monospace", borderRadius: "8px", border: "1px solid var(--border)" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 2: CANALES OFICIALES DE SOPORTE & ASISTENCIA                     */}
        {/* ========================================================================= */}
        <div className="content-panel">
          <div className="panel-header">
            <h2>📞 Canales de Soporte Técnico & Atención a Rent a Cars</h2>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
              <div className="form-field">
                <label>Correo Electrónico Oficial de SuperAdmin *</label>
                <input
                  type="email"
                  value={emailSoporte}
                  onChange={(e) => setEmailSoporte(e.target.value)}
                  placeholder="rentosrd@gmail.com"
                  required
                />
                <span className="field-hint">Destino donde llegarán las solicitudes de recuperación y notificaciones críticas.</span>
              </div>

              <div className="form-field">
                <label>Teléfono de Soporte Central</label>
                <input
                  type="text"
                  value={telefonoSoporte}
                  onChange={(e) => setTelefonoSoporte(e.target.value)}
                  placeholder="(809) 555-0100"
                />
                <span className="field-hint">Línea de soporte telefónico directo para los administradores de rent a car.</span>
              </div>

              <div className="form-field">
                <label>WhatsApp Central de Asistencia Técnica</label>
                <input
                  type="text"
                  value={whatsappSoporte}
                  onChange={(e) => setWhatsappSoporte(e.target.value)}
                  placeholder="18095550100"
                />
                <span className="field-hint">Número sin guiones ni espacios para enlace directo a WhatsApp Web.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 3: CONTROL GLOBAL DE TASA DE CAMBIO (BCRD)                       */}
        {/* ========================================================================= */}
        <div className="content-panel">
          <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>💵 Control Maestro de Tasa de Cambio (USD ⇄ DOP)</h2>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Afecta a todos los cálculos del sistema</span>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", alignItems: "flex-start" }}>
              <div className="form-field">
                <label>Modo de Conversión Cambiaria</label>
                <select
                  value={modoTasa}
                  onChange={(e) => setModoTasa(e.target.value as "AUTOMATICO_BCRD" | "MANUAL")}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "13px" }}
                >
                  <option value="AUTOMATICO_BCRD">🟢 Automático BCRD (Tasa del Día del Banco Central)</option>
                  <option value="MANUAL">🔴 Manual Forzado (Fijada por SuperAdmin de Emergencia)</option>
                </select>
                <span className="field-hint">
                  {modoTasa === "AUTOMATICO_BCRD"
                    ? "La tasa se sincroniza en vivo con la API oficial del Banco Central de la República Dominicana."
                    : "La tasa quedará congelada en el valor manual indicado abajo."}
                </span>
              </div>

              {modoTasa === "MANUAL" && (
                <div className="form-field">
                  <label>Tasa Manual Forzada (RD$ por 1 USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={tasaManual}
                    onChange={(e) => setTasaManual(e.target.value)}
                    placeholder="58.70"
                    required
                  />
                  <span className="field-hint">Valor fijo de emergencia que utilizarán todos los Rent a Cars.</span>
                </div>
              )}

              <div className="form-field">
                <label>Margen Comercial de Ajuste (+/- RD$)</label>
                <input
                  type="number"
                  step="0.05"
                  value={margenTasaDop}
                  onChange={(e) => setMargenTasaDop(e.target.value)}
                  placeholder="0.00"
                />
                <span className="field-hint">Margen opcional sumado al cambio oficial (+/- pesos dominicanos).</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 4: MEGÁFONO / ANUNCIO GLOBAL BROADCAST (BANNER A TODA LA RED)     */}
        {/* ========================================================================= */}
        <div className="content-panel">
          <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>📢 Megáfono / Anuncio Global Broadcast (Banner a Toda la Red)</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, color: anuncioActivo ? "var(--success)" : "var(--text-secondary)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={anuncioActivo}
                  onChange={(e) => setAnuncioActivo(e.target.checked)}
                  style={{ marginRight: "6px" }}
                />
                {anuncioActivo ? "Transmisión ACTIVA" : "Transmisión APAGADA"}
              </label>
            </div>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 16px 0" }}>
              Cuando esté activo, este mensaje se mostrará de inmediato en la parte superior de la pantalla de todos los usuarios de RentOS (dueños, administradores y empleados de todos los rent a cars).
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "16px", marginBottom: "16px" }}>
              <div className="form-field">
                <label>Tipo de Anuncio</label>
                <select
                  value={anuncioTipo}
                  onChange={(e) => setAnuncioTipo(e.target.value as "INFO" | "SUCCESS" | "WARNING" | "DANGER")}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "13px" }}
                >
                  <option value="INFO">ℹ️ Informativo (Azul)</option>
                  <option value="SUCCESS">✅ Éxito / Novedad (Verde)</option>
                  <option value="WARNING">⚠️ Mantenimiento (Amarillo)</option>
                  <option value="DANGER">🚨 Urgente / Crítico (Rojo)</option>
                </select>
              </div>

              <div className="form-field">
                <label>Mensaje del Comunicado a la Red *</label>
                <input
                  type="text"
                  value={anuncioMensaje}
                  onChange={(e) => setAnuncioMensaje(e.target.value)}
                  placeholder="Mantenimiento preventivo programado para el domingo a las 02:00 AM."
                  required={anuncioActivo}
                />
              </div>
            </div>

            {/* Vista previa en vivo del Banner tal como se ve en la app */}
            <div style={{ marginTop: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "6px", textTransform: "uppercase" }}>
                Vista Previa en Vivo del Banner de Notificación
              </div>
              <div
                style={{
                  backgroundColor:
                    anuncioTipo === "DANGER"
                      ? "#b91c1c"
                      : anuncioTipo === "WARNING"
                      ? "#b45309"
                      : anuncioTipo === "SUCCESS"
                      ? "#15803d"
                      : "#0284c7",
                  color: "#ffffff",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>
                    {anuncioTipo === "DANGER" ? "🚨" : anuncioTipo === "WARNING" ? "⚠️" : anuncioTipo === "SUCCESS" ? "🎉" : "📢"}
                  </span>
                  <span>
                    <strong>{nombrePlataforma}:</strong> {anuncioMensaje || "Escribe el mensaje arriba para previsualizarlo..."}
                  </span>
                </div>
                <span style={{ fontSize: "11px", opacity: 0.85, cursor: "pointer" }}>✕ Cerrar</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 5: POLÍTICAS DE SEGURIDAD & AFILIACIONES                         */}
        {/* ========================================================================= */}
        <div className="content-panel">
          <div className="panel-header">
            <h2>🛡️ Directivas de Seguridad & Solicitudes de Nuevas Empresas</h2>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
              <div className="form-field">
                <label>Vigencia de Enlaces de Recuperación (Minutos) *</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={tiempoExpiracionTokenMin}
                  onChange={(e) => setTiempoExpiracionTokenMin(parseInt(e.target.value) || 15)}
                  required
                />
                <span className="field-hint">Tiempo máximo de validez del token de un solo uso (estándar: 15 min).</span>
              </div>

              <div className="form-field">
                <label>Máximo de Intentos Fallidos de Login *</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={maxIntentosFallidos}
                  onChange={(e) => setMaxIntentosFallidos(parseInt(e.target.value) || 5)}
                  required
                />
                <span className="field-hint">Intentos erróneos permitidos antes de activar el bloqueo progresivo.</span>
              </div>

              <div className="form-field">
                <label>Tiempo de Bloqueo Base (Minutos) *</label>
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={tiempoBloqueoMin}
                  onChange={(e) => setTiempoBloqueoMin(parseInt(e.target.value) || 15)}
                  required
                />
                <span className="field-hint">Penalización de tiempo aplicada al superar los intentos máximos.</span>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={permitirRegistroPublico}
                  onChange={(e) => setPermitirRegistroPublico(e.target.checked)}
                />
                <div>
                  <strong style={{ fontSize: "13px" }}>Permitir solicitudes de registro de nuevos Rent a Cars</strong>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>
                    Muestra el botón "🚀 ¿Eres dueño de un Rent a Car? Solicita tu empresa" en el Login. Las solicitudes quedan pendientes de aprobación en tu panel de Solicitudes.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN 6: TÉRMINOS Y CONDICIONES GLOBALES DE RENTOS                     */}
        {/* ========================================================================= */}
        <div className="content-panel">
          <div className="panel-header">
            <h2>📜 Políticas de Uso, Términos y Privacidad de la Red</h2>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <div className="form-field" style={{ marginBottom: "18px" }}>
              <label>Términos y Condiciones Generales de RentOS</label>
              <textarea
                rows={3}
                value={terminosServicio}
                onChange={(e) => setTerminosServicio(e.target.value)}
                placeholder="El uso de la plataforma RentOS está reservado a empresas autorizadas..."
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "13px" }}
              />
            </div>

            <div className="form-field">
              <label>Política de Privacidad y Manejo de Datos</label>
              <textarea
                rows={3}
                value={politicaPrivacidad}
                onChange={(e) => setPoliticaPrivacidad(e.target.value)}
                placeholder="La información de clientes, contratos y pagos está estrictamente protegida por aislamiento multi-tenant..."
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "13px" }}
              />
            </div>
          </div>
        </div>

        {/* Botón Flotante / Acciones de Guardado */}
        <div
          style={{
            position: "sticky",
            bottom: "20px",
            backgroundColor: "var(--surface)",
            padding: "16px 24px",
            borderRadius: "14px",
            boxShadow: "0 10px 30px -5px rgba(0,0,0,0.25)",
            border: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 50,
          }}
        >
          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            👑 Las modificaciones realizadas aquí tienen efecto global inmediato sobre toda la arquitectura RentOS.
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="secondary-button"
              onClick={cargarConfiguracion}
              disabled={guardando}
            >
              🔄 Descartar y Recargar
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={guardando}
              style={{
                backgroundColor: colorPrimario || "var(--primary)",
                padding: "12px 28px",
                fontSize: "14px",
                fontWeight: 800,
                boxShadow: `0 4px 15px ${colorPrimario}55`,
              }}
            >
              {guardando ? "Guardando en Servidor..." : "💾 Guardar Configuración de SuperAdmin"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
