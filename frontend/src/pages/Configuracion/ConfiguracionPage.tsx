import { useEffect, useState } from "react";
import { API_URLS } from "../../services/api";

type RentCar = {
  id: number;
  nombre: string;
  rnc: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ciudad: string;
  logoUrl: string | null;
  moneda: string;
  terminosContrato: string | null;
  limiteKilometrajeDiario: number | null;
  cargoKmExtra: string | number | null;
  depositoEstandar: string | number | null;
  telegramChatId?: string | null;
  activo: boolean;
};

export default function ConfiguracionPage() {
  const [rentCar, setRentCar] = useState<RentCar | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [creandoBackup, setCreandoBackup] = useState(false);

  const [nombre, setNombre] = useState("");
  const [rnc, setRnc] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [ciudad, setCiudad] = useState("Santo Domingo");
  const [direccion, setDireccion] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
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

      const res = await fetch(`${API_RENTCARS}/1`);
      if (!res.ok) throw new Error("No fue posible cargar los datos de la empresa.");

      const data: RentCar = await res.json();
      setRentCar(data);

      setNombre(data.nombre || "");
      setRnc(data.rnc || "");
      setTelefono(data.telefono || "");
      setEmail(data.email || "");
      setCiudad(data.ciudad || "Santo Domingo");
      setDireccion(data.direccion || "");
      setLogoUrl(data.logoUrl || "");
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
  }, []);

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

      const datos = {
        nombre: nombre.trim(),
        rnc: rnc.trim() || undefined,
        telefono: telefono.trim() || undefined,
        email: email.trim() || undefined,
        ciudad: ciudad.trim(),
        direccion: direccion.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        moneda,
        depositoEstandar: Number(depositoEstandar),
        limiteKilometrajeDiario: Number(limiteKm),
        cargoKmExtra: Number(cargoKmExtra),
        terminosContrato: terminosContrato.trim() || undefined,
        telegramChatId: telegramChatId.trim() || undefined,
      };

      const res = await fetch(`${API_RENTCARS}/1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (!res.ok) throw new Error("No fue posible guardar los cambios de configuración.");

      setMensaje("✅ Configuración y marca de la empresa actualizadas con éxito.");
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
          <h1>Configuración de Empresa y Marca</h1>
          <p>
            Personaliza los datos de tu Rent Car, políticas de alquiler, moneda y respaldos.
            {rentCar && (
              <span style={{ display: "inline-block", marginLeft: "10px" }} className="badge badge-disponible">
                Tenant #{rentCar.id} • Activo
              </span>
            )}
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={ejecutarBackup}
          disabled={creandoBackup}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          {creandoBackup ? "⏳ Respaldando..." : "💾 Generar Backup + Alerta Telegram"}
        </button>
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
            borderRadius: "12px",
            padding: "18px 24px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "var(--shadow)",
          }}
        >
          <div>
            <strong style={{ fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
              🌐 Tu Enlace de Reservas Online para Clientes
            </strong>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>
              Comparte este link en tu Instagram, WhatsApp Business o Google Maps para recibir reservas online directamente en tu panel.
            </span>
            <div style={{ marginTop: "8px" }}>
              <code style={{ fontSize: "13px", padding: "6px 10px", background: "var(--primary-soft)", color: "var(--primary)", borderRadius: "6px", fontWeight: 600 }}>
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
                setMensaje("📋 ¡Enlace de reservas copiado al portapapeles!");
              }}
            >
              📋 Copiar Enlace
            </button>
            <a
              href={`/reservar?rentcar=${rentCar.id}`}
              target="_blank"
              rel="noreferrer"
              className="primary-button"
              style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px" }}
            >
              👁️ Probar Catálogo ↗
            </a>
          </div>
        </div>
      )}

      {cargando ? (
        <div className="content-panel">
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando configuración del Rent Car...</strong>
          </div>
        </div>
      ) : (
        <form onSubmit={guardarCambios}>
          {/* Sección 1: Datos de la Empresa */}
          <div className="content-panel" style={{ marginBottom: "20px" }}>
            <div className="panel-header">
              <h2>🏢 Identidad de Empresa & Facturación</h2>
            </div>

            <div className="form-grid">
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
                <label htmlFor="ciudadEmpresa">Ciudad / Región</label>
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
                <label htmlFor="telefonoEmpresa">Teléfono / WhatsApp de Contacto</label>
                <input
                  id="telefonoEmpresa"
                  type="text"
                  placeholder="Ej. (809) 555-0100"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
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

              <div className="form-field">
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

          {/* Sección 2: Políticas de Renta y Tarifas */}
          <div className="content-panel" style={{ marginBottom: "20px" }}>
            <div className="panel-header">
              <h2>📋 Parámetros de Alquiler & Contratos</h2>
            </div>

            <div className="form-grid">
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
                <label htmlFor="depositoEstandar">Depósito de Garantía Estándar ($)</label>
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
                <label htmlFor="cargoKmExtra">Cargo por Kilómetro Adicional ($/km)</label>
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
                <label htmlFor="terminosContrato">Términos y Condiciones al Pie del Contrato</label>
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

          {/* Panel de Alertas & Telegram */}
          <div className="content-panel" style={{ marginTop: "20px" }}>
            <div className="panel-header">
              <h2>🔔 Notificaciones & Canal de Alertas (Telegram)</h2>
            </div>
            <div className="form-grid" style={{ padding: "0 24px 20px" }}>
              <div className="form-field" style={{ gridColumn: "span 2" }}>
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

          {/* Botones de Acción */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
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
              style={{ minWidth: "160px" }}
            >
              {guardando ? "Guardando..." : "Guardar Configuración"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
