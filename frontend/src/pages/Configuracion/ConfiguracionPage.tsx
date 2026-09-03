/**
 * ============================================================================
 * RentOS - Configuración de Empresa y Marca Blanca (ConfiguracionPage)
 * ============================================================================
 * Personalización integral del negocio:
 * - Subida de logotipo de la empresa y paleta de color primario corporativo.
 * - Políticas de arrendamiento, límite de kilometraje diario y cargo por km extra.
 * - Parámetros de WhatsApp para clientes y Chat ID de Telegram para alertas operativas.
 */

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URLS } from "../../services/api";
import PhoneInput, { validarTelefono } from "../../components/PhoneInput";

type RentCar = {
  id: number;
  nombre: string;
  slug?: string | null;
  rnc: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ciudad: string;
  logoUrl: string | null;
  eslogan?: string | null;
  colorPrimario?: string | null;
  whatsapp?: string | null;
  moneda: string;
  terminosContrato: string | null;
  limiteKilometrajeDiario: number | null;
  cargoKmExtra: string | number | null;
  depositoEstandar: string | number | null;
  telegramChatId?: string | null;
  activo: boolean;
};

const COLORES_PRESET = [
  { nombre: "Azul RentOS", hex: "#0284c7" },
  { nombre: "Azul Marino", hex: "#1e3a8a" },
  { nombre: "Verde Esmeralda", hex: "#16a34a" },
  { nombre: "Naranja Deportivo", hex: "#ea580c" },
  { nombre: "Rojo Pasión", hex: "#dc2626" },
  { nombre: "Púrpura Luxury", hex: "#7c3aed" },
  { nombre: "Grafito Oscuro", hex: "#334155" },
];

export default function ConfiguracionPage() {
  const { tenantActivoId, usuario } = useAuth();
  const [rentCar, setRentCar] = useState<RentCar | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [creandoBackup, setCreandoBackup] = useState(false);

  // Campos de Identidad & Marca
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [eslogan, setEslogan] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [tipoEntradaLogo, setTipoEntradaLogo] = useState<"archivo" | "url">("archivo");
  const [colorPrimario, setColorPrimario] = useState("#0284c7");
  const [rnc, setRnc] = useState("");
  const [ciudad, setCiudad] = useState("Santo Domingo");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const handleSubirArchivoLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG, WEBP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("La imagen no debe superar los 10 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) return;

      // Optimizar y redimensionar imagen en Canvas para guardado ultraligero
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
          const optimizedDataUrl = canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.9);
          setLogoUrl(optimizedDataUrl);
          setMensaje("🖼️ Logotipo cargado y optimizado con éxito. Pulsa 'Guardar Personalización'.");
        } else {
          setLogoUrl(src);
        }
      };
      img.onerror = () => {
        setLogoUrl(src);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Parámetros de Alquiler y Plantilla de Contrato
  const [moneda, setMoneda] = useState("USD");
  const [depositoEstandar, setDepositoEstandar] = useState("200.00");
  const [limiteKm, setLimiteKm] = useState("200");
  const [cargoKmExtra, setCargoKmExtra] = useState("0.25");
  const [tipoPlantillaContrato, setTipoPlantillaContrato] = useState("ESTANDAR_DOMINICANA");
  const [clausulasPersonalizadas, setClausulasPersonalizadas] = useState("");
  const [terminosContrato, setTerminosContrato] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_RENTCARS = API_URLS.rentcars;
  const API_BACKUP = "http://localhost:3000/api/backups";

  const cargarConfiguracion = async () => {
    try {
      setCargando(true);
      setError("");

      const targetId = tenantActivoId || 1;
      const res = await fetch(`${API_RENTCARS}/${targetId}`);
      if (!res.ok) throw new Error("No fue posible cargar los datos de la empresa.");

      const data = await res.json();
      setRentCar(data);

      setNombre(data.nombre || "");
      setSlug(data.slug || "");
      setEslogan(data.eslogan || "");
      setLogoUrl(data.logoUrl || "");
      setColorPrimario(data.colorPrimario || "#0284c7");
      setRnc(data.rnc || "");
      setCiudad(data.ciudad || "Santo Domingo");
      setDireccion(data.direccion || "");
      setTelefono(data.telefono || "");
      setWhatsapp(data.whatsapp || data.telefono || "");
      setEmail(data.email || "");
      setMoneda(data.moneda || "USD");
      setDepositoEstandar(String(data.depositoEstandar || "200.00"));
      setLimiteKm(String(data.limiteKilometrajeDiario || "200"));
      setCargoKmExtra(String(data.cargoKmExtra || "0.25"));
      setTipoPlantillaContrato(data.tipoPlantillaContrato || "ESTANDAR_DOMINICANA");
      setClausulasPersonalizadas(data.clausulasPersonalizadas || "");
      setTerminosContrato(
        data.terminosContrato ||
          "El cliente se compromete a devolver el vehículo en las mismas condiciones mecánicas y de combustible en que fue recibido. Cualquier infracción de tránsito durante el período de renta es responsabilidad exclusiva del conductor."
      );
      setTelegramChatId(data.telegramChatId || "");
    } catch (err) {
      console.error(err);
      setError("No fue posible conectar con el servidor para obtener la configuración.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarConfiguracion();
  }, [tenantActivoId]);

  const guardarCambios = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      setError("El nombre comercial de la empresa es obligatorio.");
      return;
    }

    if (telefono.trim()) {
      const valTel = validarTelefono(telefono);
      if (!valTel.valido) {
        setError(valTel.mensajeError || "El teléfono de oficina no es válido.");
        return;
      }
    }

    if (whatsapp.trim()) {
      const valWsp = validarTelefono(whatsapp);
      if (!valWsp.valido) {
        setError(valWsp.mensajeError || "El WhatsApp para reservas no es válido.");
        return;
      }
    }

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const targetId = tenantActivoId || 1;
      const datos = {
        nombre: nombre.trim(),
        slug: slug.trim() ? slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "") : null,
        eslogan: eslogan.trim() || null,
        logoUrl: logoUrl.trim() || null,
        colorPrimario: colorPrimario.trim() || "#0284c7",
        rnc: rnc.trim() || null,
        ciudad: ciudad.trim(),
        direccion: direccion.trim() || null,
        telefono: telefono.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        moneda,
        depositoEstandar: Number(depositoEstandar),
        limiteKilometrajeDiario: Number(limiteKm),
        cargoKmExtra: Number(cargoKmExtra),
        tipoPlantillaContrato,
        clausulasPersonalizadas: clausulasPersonalizadas.trim() || null,
        terminosContrato: terminosContrato.trim() || null,
        telegramChatId: telegramChatId.trim() || null,
      };

      const res = await fetch(`${API_RENTCARS}/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (!res.ok) {
        let errMsg = "No fue posible guardar los cambios de configuración.";
        try {
          const errData = await res.json();
          if (errData.error) errMsg = `${errData.error} ${errData.detalle || ""}`.trim();
        } catch {
          // ignore
        }
        throw new Error(errMsg);
      }

      setMensaje("✅ Configuración, marca y logotipo de la empresa actualizados con éxito.");
      await cargarConfiguracion();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al guardar configuración.");
    } finally {
      setGuardando(false);
    }
  };

  const ejecutarBackup = async () => {
    try {
      setCreandoBackup(true);
      setError("");
      setMensaje("");

      const res = await fetch(API_BACKUP, { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "No fue posible crear la copia de seguridad.");

      setMensaje(
        `💾 Copia de seguridad generada con éxito (${data.archivo}) y notificación enviada a tu Telegram.`
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al generar backup.");
    } finally {
      setCreandoBackup(false);
    }
  };

  return (
    <div className="configuracion-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Personalización de Perfil, Marca & Configuración</h1>
          <p>
            Personaliza el logotipo de tu Rent a Car, color de marca, datos comerciales y políticas de alquiler.
            {rentCar && (
              <span style={{ display: "inline-block", marginLeft: "10px" }} className="badge badge-disponible">
                Empresa: {rentCar.nombre} (ID #{rentCar.id})
              </span>
            )}
          </p>
        </div>

        {usuario?.rol === "SUPERADMIN" && (
          <button
            className="secondary-button"
            onClick={ejecutarBackup}
            disabled={creandoBackup}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            {creandoBackup ? "⏳ Respaldando..." : "💾 Generar Backup + Telegram"}
          </button>
        )}
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Banner de Sitio Web y Portal Interactivo Independiente */}
      {rentCar && (
        <div
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "14px",
            padding: "20px 24px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "var(--shadow)",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <strong style={{ fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              🌐 Tu Página Web y Portal de Reservas Oficial
            </strong>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
              Tus clientes verán tu marca, logo, flota exclusiva y podrán cotizar en tiempo real o reservar por WhatsApp:
            </span>
            <div style={{ marginTop: "8px" }}>
              <code style={{ fontSize: "13px", padding: "6px 10px", background: "var(--primary-soft)", color: "var(--primary)", borderRadius: "6px", fontWeight: 700 }}>
                {`${window.location.origin}/portal/${slug || rentCar.slug || rentCar.id}`}
              </code>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/portal/${slug || rentCar.slug || rentCar.id}`);
                setMensaje("📋 ¡Enlace copiado al portapapeles! Compártelo con tus clientes o en tus redes sociales.");
              }}
            >
              📋 Copiar Enlace
            </button>
            <a
              href={`/portal/${slug || rentCar.slug || rentCar.id}`}
              target="_blank"
              rel="noreferrer"
              className="primary-button"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                backgroundColor: colorPrimario || "var(--primary)",
              }}
            >
              🚀 Abrir Mi Sitio Web ↗
            </a>
          </div>
        </div>
      )}

      {cargando ? (
        <div className="content-panel">
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando personalización del Rent Car...</strong>
          </div>
        </div>
      ) : (
        <form onSubmit={guardarCambios}>
          {/* SECCIÓN 1: PERSONALIZACIÓN VISUAL DE MARCA */}
          <div className="content-panel" style={{ marginBottom: "24px" }}>
            <div className="panel-header">
              <h2>🎨 Identidad Visual & Logotipo</h2>
            </div>

            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", alignItems: "flex-start" }}>
                <div>
                  <div className="form-field" style={{ marginBottom: "16px" }}>
                    <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Logotipo de la Empresa</span>
                      <span style={{ fontSize: "11px", fontWeight: "normal", color: "var(--text-secondary)" }}>
                        PNG transparente, JPG o SVG
                      </span>
                    </label>

                    {/* Toggle entre Archivo Local y URL */}
                    <div style={{ display: "flex", gap: "8px", margin: "6px 0 10px 0" }}>
                      <button
                        type="button"
                        onClick={() => setTipoEntradaLogo("archivo")}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: tipoEntradaLogo === "archivo" ? "2px solid var(--primary)" : "1px solid var(--border)",
                          backgroundColor: tipoEntradaLogo === "archivo" ? "var(--primary-soft)" : "var(--surface)",
                          color: tipoEntradaLogo === "archivo" ? "var(--primary)" : "var(--text)",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        📁 Buscar en mi Dispositivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoEntradaLogo("url")}
                        style={{
                          flex: 1,
                          padding: "6px 10px",
                          borderRadius: "6px",
                          border: tipoEntradaLogo === "url" ? "2px solid var(--primary)" : "1px solid var(--border)",
                          backgroundColor: tipoEntradaLogo === "url" ? "var(--primary-soft)" : "var(--surface)",
                          color: tipoEntradaLogo === "url" ? "var(--primary)" : "var(--text)",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        🔗 Usar Enlace / URL Web
                      </button>
                    </div>

                    {tipoEntradaLogo === "archivo" ? (
                      <div
                        style={{
                          border: "2px dashed var(--border)",
                          borderRadius: "10px",
                          padding: "16px",
                          textAlign: "center",
                          backgroundColor: "var(--surface)",
                          cursor: "pointer",
                          transition: "border-color 0.2s",
                        }}
                        onClick={() => document.getElementById("file-input-logo")?.click()}
                      >
                        <input
                          id="file-input-logo"
                          type="file"
                          accept="image/png, image/jpeg, image/svg+xml, image/webp"
                          style={{ display: "none" }}
                          onChange={handleSubirArchivoLogo}
                        />
                        <div style={{ fontSize: "24px", marginBottom: "4px" }}>📤</div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary)" }}>
                          Haz clic para elegir el logo desde tu PC o Móvil
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          Formatos: PNG, JPG, SVG o WEBP (máx. 4 MB)
                        </div>
                      </div>
                    ) : (
                      <input
                        id="logoUrlInput"
                        type="url"
                        placeholder="https://ejemplo.com/logo.png"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                      />
                    )}

                    {logoUrl && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                        <span style={{ fontSize: "11px", color: "var(--success)", fontWeight: 600 }}>
                          ✓ Logotipo cargado en memoria
                        </span>
                        <button
                          type="button"
                          onClick={() => setLogoUrl("")}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--danger)",
                            fontSize: "11px",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          🗑️ Quitar Logotipo
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="form-field" style={{ marginBottom: "14px" }}>
                    <label htmlFor="esloganInput">Eslogan Comercial / Frase de la Empresa</label>
                    <input
                      id="esloganInput"
                      type="text"
                      placeholder="Ej. Los mejores autos para tus vacaciones en Punta Cana"
                      value={eslogan}
                      onChange={(e) => setEslogan(e.target.value)}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="colorPickerInput">Color Primario de tu Marca</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                      <input
                        id="colorPickerInput"
                        type="color"
                        value={colorPrimario}
                        onChange={(e) => setColorPrimario(e.target.value)}
                        style={{ width: "42px", height: "38px", border: "none", borderRadius: "6px", cursor: "pointer", padding: 0 }}
                      />
                      <input
                        type="text"
                        value={colorPrimario}
                        onChange={(e) => setColorPrimario(e.target.value)}
                        style={{ width: "100px", padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "13px", fontWeight: 700 }}
                      />
                    </div>

                    <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                      {COLORES_PRESET.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setColorPrimario(c.hex)}
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: c.hex,
                            border: colorPrimario === c.hex ? "2px solid #000" : "1px solid rgba(0,0,0,0.1)",
                            cursor: "pointer",
                          }}
                          title={c.nombre}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Vista Previa de la Marca */}
                <div
                  style={{
                    background: "var(--background)",
                    border: "2px dashed var(--border)",
                    borderRadius: "14px",
                    padding: "20px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "12px" }}>
                    Vista Previa de Marca en Catálogo y Contratos
                  </div>

                  <div
                    style={{
                      backgroundColor: "var(--surface)",
                      borderRadius: "12px",
                      padding: "20px",
                      border: "1px solid var(--border)",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                    }}
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo Preview"
                        style={{ maxHeight: "60px", maxWidth: "180px", objectFit: "contain", marginBottom: "8px" }}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    ) : (
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          backgroundColor: colorPrimario,
                          color: "white",
                          borderRadius: "10px",
                          margin: "0 auto 8px auto",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 900,
                          fontSize: "22px",
                        }}
                      >
                        {nombre ? nombre.charAt(0).toUpperCase() : "R"}
                      </div>
                    )}

                    <h3 style={{ margin: "0 0 2px 0", fontSize: "16px", fontWeight: 800 }}>
                      {nombre || "Nombre de tu Rent a Car"}
                    </h3>
                    <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
                      {eslogan || "Tu eslogan aparecerá aquí"}
                    </p>

                    <button
                      type="button"
                      style={{
                        backgroundColor: colorPrimario,
                        color: "white",
                        border: "none",
                        padding: "8px 18px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "12px",
                        cursor: "default",
                      }}
                    >
                      🚗 Botón de Ejemplo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: INFORMACIÓN FISCAL Y DE CONTACTO */}
          <div className="content-panel" style={{ marginBottom: "24px" }}>
            <div className="panel-header">
              <h2>🏢 Datos Comerciales, Fiscales & Contacto</h2>
            </div>

            <div className="form-grid" style={{ padding: "20px 24px" }}>
              <div className="form-field">
                <label htmlFor="nombreEmpresa">Nombre Comercial del Rent Car *</label>
                <input
                  id="nombreEmpresa"
                  type="text"
                  placeholder="Ej. RentOS Principal - Santo Domingo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="slugEmpresa">Enlace URL de tu Sitio Web (Slug)</label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ padding: "8px 10px", background: "var(--background)", border: "1px solid var(--border)", borderRight: "none", borderRadius: "8px 0 0 8px", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                    /portal/
                  </span>
                  <input
                    id="slugEmpresa"
                    type="text"
                    placeholder="ej. caribe-rentals"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    style={{ borderRadius: "0 8px 8px 0" }}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="rncEmpresa">RNC / Identificación Fiscal</label>
                <input
                  id="rncEmpresa"
                  type="text"
                  placeholder="Ej. 1-31-98765-4"
                  value={rnc}
                  onChange={(e) => setRnc(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="ciudadEmpresa">Ciudad / Región *</label>
                <input
                  id="ciudadEmpresa"
                  type="text"
                  placeholder="Ej. Santo Domingo, Bávaro, Santiago"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="telefonoEmpresa">Teléfono de Oficina</label>
                <PhoneInput
                  id="telefonoEmpresa"
                  value={telefono}
                  onChange={(val) => setTelefono(val)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="whatsappEmpresa">WhatsApp Directo para Reservas</label>
                <PhoneInput
                  id="whatsappEmpresa"
                  value={whatsapp}
                  onChange={(val) => setWhatsapp(val)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="emailEmpresa">Correo Electrónico Comercial</label>
                <input
                  id="emailEmpresa"
                  type="email"
                  placeholder="contacto@rentcar.do"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-field" style={{ gridColumn: "span 3" }}>
                <label htmlFor="direccionEmpresa">Dirección de la Sucursal Principal</label>
                <input
                  id="direccionEmpresa"
                  type="text"
                  placeholder="Ej. Av. 27 de Febrero #45, Ensanche Naco"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: POLÍTICAS DE RENTA, MONEDA Y CONTRATO */}
          <div className="content-panel" style={{ marginBottom: "24px" }}>
            <div className="panel-header">
              <h2>📋 Parámetros de Alquiler & Cláusulas del Contrato</h2>
            </div>

            <div className="form-grid" style={{ padding: "20px 24px" }}>
              <div className="form-field">
                <label htmlFor="monedaSelect">Moneda Principal de Cobro *</label>
                <select
                  id="monedaSelect"
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value)}
                >
                  <option value="USD">USD ($ Dólares Estadounidenses)</option>
                  <option value="DOP">DOP (RD$ Pesos Dominicanos)</option>
                  <option value="EUR">EUR (€ Euros)</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="depositoEstandar">Depósito de Garantía Estándar ({moneda})</label>
                <input
                  id="depositoEstandar"
                  type="number"
                  min="0"
                  step="10"
                  value={depositoEstandar}
                  onChange={(e) => setDepositoEstandar(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="limiteKm">Límite Diario de Kilometraje (km/día)</label>
                <input
                  id="limiteKm"
                  type="number"
                  min="50"
                  value={limiteKm}
                  onChange={(e) => setLimiteKm(e.target.value)}
                />
              </div>

              <div className="form-field">
                <label htmlFor="cargoKmExtra">Cargo por Kilómetro Extra ({moneda}/km)</label>
                <input
                  id="cargoKmExtra"
                  type="number"
                  min="0"
                  step="0.05"
                  value={cargoKmExtra}
                  onChange={(e) => setCargoKmExtra(e.target.value)}
                />
              </div>

              {/* Selector de Plantilla de Contrato */}
              <div className="form-field" style={{ gridColumn: "span 3", backgroundColor: "var(--primary-soft, #f0f9ff)", padding: "16px", borderRadius: "10px", border: "1px solid #bfdbfe" }}>
                <label style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary, #0284c7)", display: "block", marginBottom: "8px" }}>
                  📜 Formato de Contrato Legal & Cláusulas
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                  <div
                    onClick={() => setTipoPlantillaContrato("ESTANDAR_DOMINICANA")}
                    style={{
                      border: tipoPlantillaContrato === "ESTANDAR_DOMINICANA" ? "2px solid var(--primary)" : "1px solid var(--border)",
                      backgroundColor: tipoPlantillaContrato === "ESTANDAR_DOMINICANA" ? "#ffffff" : "var(--surface)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      cursor: "pointer",
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                    }}
                  >
                    <input
                      type="radio"
                      name="tipoPlantilla"
                      checked={tipoPlantillaContrato === "ESTANDAR_DOMINICANA"}
                      onChange={() => setTipoPlantillaContrato("ESTANDAR_DOMINICANA")}
                      style={{ marginTop: "3px" }}
                    />
                    <div>
                      <strong style={{ fontSize: "13px", display: "block" }}>
                        🇩🇴 Plantilla Oficial Dominicana (Recomendada)
                      </strong>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4", display: "block", marginTop: "2px" }}>
                        Diseño físico auto-rellenable con logotipo de tu empresa, medidor de combustible, diagrama de daños 360°, checklist de 24 accesorios, código QR de autenticidad y leyes dominicanas (Ley 483 y Ley 63-17).
                      </span>
                    </div>
                  </div>

                  <div
                    onClick={() => setTipoPlantillaContrato("PERSONALIZADA")}
                    style={{
                      border: tipoPlantillaContrato === "PERSONALIZADA" ? "2px solid var(--primary)" : "1px solid var(--border)",
                      backgroundColor: tipoPlantillaContrato === "PERSONALIZADA" ? "#ffffff" : "var(--surface)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      cursor: "pointer",
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                    }}
                  >
                    <input
                      type="radio"
                      name="tipoPlantilla"
                      checked={tipoPlantillaContrato === "PERSONALIZADA"}
                      onChange={() => setTipoPlantillaContrato("PERSONALIZADA")}
                      style={{ marginTop: "3px" }}
                    />
                    <div>
                      <strong style={{ fontSize: "13px", display: "block" }}>
                        ⚙️ Plantilla Personalizada de la Empresa
                      </strong>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4", display: "block", marginTop: "2px" }}>
                        Permite a tu empresa redactar o pegar cláusulas legales particulares formuladas por tu propio abogado o asesor legal sin alterar el formato de impresión.
                      </span>
                    </div>
                  </div>
                </div>

                {tipoPlantillaContrato === "PERSONALIZADA" && (
                  <div>
                    <label htmlFor="clausulasPersonalizadas" style={{ fontSize: "12px", fontWeight: 700, marginBottom: "4px", display: "block" }}>
                      Redacta o pega las Cláusulas Legales de tu Empresa:
                    </label>
                    <textarea
                      id="clausulasPersonalizadas"
                      rows={6}
                      placeholder="Pega aquí el texto legal de tu contrato (Preámbulo, Primero, Segundo, Cláusulas de penalización, Juzgados, etc.)..."
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        fontFamily: "inherit",
                        fontSize: "12px",
                        lineHeight: "1.5",
                        boxSizing: "border-box",
                      }}
                      value={clausulasPersonalizadas}
                      onChange={(e) => setClausulasPersonalizadas(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="form-field" style={{ gridColumn: "span 3" }}>
                <label htmlFor="terminosContrato">Notas adicionales al pie del contrato</label>
                <input
                  id="terminosContrato"
                  type="text"
                  placeholder="Ej. Devolución con el mismo nivel de combustible. Prohibido fumar dentro del auto."
                  value={terminosContrato}
                  onChange={(e) => setTerminosContrato(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: CANAL DE ALERTAS PRIVADO TELEGRAM */}
          <div className="content-panel" style={{ marginBottom: "24px" }}>
            <div className="panel-header">
              <h2>🔔 Notificaciones & Canal de Alertas (Telegram)</h2>
            </div>
            <div className="form-grid" style={{ padding: "20px 24px" }}>
              <div className="form-field" style={{ gridColumn: "span 3" }}>
                <label htmlFor="telegramChatId">Telegram Chat ID para Alertas de esta Empresa</label>
                <input
                  id="telegramChatId"
                  type="text"
                  placeholder="Ej. 1234567890 (ID numérico de tu chat privado o grupo de Telegram)"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                />
                <small style={{ color: "var(--text-secondary)", fontSize: "11px", marginTop: "4px", display: "block" }}>
                  Las auditorías de seguros vencidos, marbetes y cambios de aceite de esta empresa se enviarán directamente a este chat de Telegram.
                </small>
              </div>
            </div>
          </div>

          {/* Botones de Guardar */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              type="button"
              className="secondary-button"
              onClick={cargarConfiguracion}
              disabled={guardando}
            >
              Restablecer
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={guardando}
              style={{ minWidth: "180px", backgroundColor: colorPrimario || "var(--primary)" }}
            >
              {guardando ? "Guardando..." : "💾 Guardar Personalización"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
