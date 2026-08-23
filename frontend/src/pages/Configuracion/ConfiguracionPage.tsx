import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URLS } from "../../services/api";
import PhoneInput from "../../components/PhoneInput";

type RentCar = {
  id: number;
  nombre: string;
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

    if (file.size > 4 * 1024 * 1024) {
      setError("La imagen no debe superar los 4 MB para optimizar la velocidad de carga.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
        setMensaje("🖼️ Logotipo cargado desde tu dispositivo. Recuerda pulsar 'Guardar Personalización'.");
      }
    };
    reader.readAsDataURL(file);
  };

  // Parámetros de Alquiler
  const [moneda, setMoneda] = useState("USD");
  const [depositoEstandar, setDepositoEstandar] = useState("200.00");
  const [limiteKm, setLimiteKm] = useState("200");
  const [cargoKmExtra, setCargoKmExtra] = useState("0.25");
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

      const data: RentCar = await res.json();
      setRentCar(data);

      setNombre(data.nombre || "");
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

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const targetId = tenantActivoId || 1;
      const datos = {
        nombre: nombre.trim(),
        eslogan: eslogan.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        colorPrimario: colorPrimario.trim() || "#0284c7",
        rnc: rnc.trim() || undefined,
        ciudad: ciudad.trim(),
        direccion: direccion.trim() || undefined,
        telefono: telefono.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        email: email.trim() || undefined,
        moneda,
        depositoEstandar: Number(depositoEstandar),
        limiteKilometrajeDiario: Number(limiteKm),
        cargoKmExtra: Number(cargoKmExtra),
        terminosContrato: terminosContrato.trim() || undefined,
        telegramChatId: telegramChatId.trim() || undefined,
      };

      const res = await fetch(`${API_RENTCARS}/${targetId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (!res.ok) throw new Error("No fue posible guardar los cambios de configuración.");

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

      {/* Banner de Enlace Público de Reservas */}
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
          }}
        >
          <div>
            <strong style={{ fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              🌐 Tu Catálogo Público de Reservas Online
            </strong>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
              Tus clientes verán tu logo, eslogan y color de marca en este enlace:
            </span>
            <div style={{ marginTop: "8px" }}>
              <code style={{ fontSize: "13px", padding: "6px 10px", background: "var(--primary-soft)", color: "var(--primary)", borderRadius: "6px", fontWeight: 700 }}>
                {`${window.location.origin}/reservar?rentcar=${rentCar.id}`}
              </code>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/reservar?rentcar=${rentCar.id}`);
                setMensaje("📋 ¡Enlace copiado al portapapeles!");
              }}
            >
              📋 Copiar Enlace
            </button>
            <a
              href={`/reservar?rentcar=${rentCar.id}`}
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
              👁️ Ver Portal con mi Marca ↗
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

              <div className="form-field" style={{ gridColumn: "span 3" }}>
                <label htmlFor="terminosContrato">Términos y Cláusulas al Pie del Contrato Oficial</label>
                <textarea
                  id="terminosContrato"
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    fontFamily: "inherit",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    boxSizing: "border-box",
                  }}
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
