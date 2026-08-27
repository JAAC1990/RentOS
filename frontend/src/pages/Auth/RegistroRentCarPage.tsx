/**
 * ============================================================================
 * RentOS - Formulario Público de Registro de Rent a Car (RegistroRentCarPage)
 * ============================================================================
 * Proceso de incorporación para nuevos clientes de la plataforma SaaS:
 * - Captura de datos fiscales (RNC, razón social, ciudad y representante legal).
 * - Creación de solicitud en estado PENDIENTE.
 * - Despacho automático de alerta al Telegram del SuperAdministrador.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import PhoneInput, { validarTelefono } from "../../components/PhoneInput";
import { API_URLS } from "../../services/api";

export default function RegistroRentCarPage() {
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [rnc, setRnc] = useState("");
  const [ciudad, setCiudad] = useState("Santo Domingo");
  const [nombreContacto, setNombreContacto] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [direccion, setDireccion] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [enviadoExito, setEnviadoExito] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombreNegocio || !nombreContacto || !email || !telefono || !password) {
      setError("Por favor completa los campos obligatorios.");
      return;
    }

    const valTel = validarTelefono(telefono);
    if (!valTel.valido) {
      setError(valTel.mensajeError || "El teléfono ingresado no es válido.");
      return;
    }

    try {
      setEnviando(true);
      setError("");

      const res = await fetch(`${API_URLS.solicitudes || "http://localhost:3000/api/solicitudes"}/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreNegocio,
          rnc,
          ciudad,
          nombreContacto,
          email,
          telefono,
          password,
          direccion,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No fue posible procesar la solicitud.");
      }

      setEnviadoExito(true);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al registrar solicitud.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--background)",
        padding: "24px 20px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          width: "100%",
          backgroundColor: "var(--surface)",
          borderRadius: "20px",
          border: "1px solid var(--border)",
          padding: "36px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Cabecera */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
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
            <h1 style={{ fontSize: "20px", margin: 0, fontWeight: 800 }}>RentOS SaaS</h1>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              Solicitud de Registro para Nuevos Rent a Cars
            </span>
          </div>
        </div>

        {enviadoExito ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "50px", marginBottom: "12px" }}>🎉</div>
            <h2 style={{ fontSize: "20px", color: "var(--success)", margin: "0 0 8px 0" }}>
              ¡Solicitud Enviada con Éxito!
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: "0 0 24px 0" }}>
              Hemos recibido la información de <b>{nombreNegocio}</b>. El <b>SuperAdministrador</b> ha recibido una
              alerta de autorización en su Telegram y revisará tu cuenta en breve para activarla.
            </p>
            <div style={{ background: "var(--primary-soft)", padding: "14px", borderRadius: "10px", fontSize: "13px", textAlign: "left", marginBottom: "24px" }}>
              <div>👤 <b>Contacto:</b> {nombreContacto}</div>
              <div>📧 <b>Email de acceso:</b> {email}</div>
              <div>📍 <b>Ciudad:</b> {ciudad}</div>
              <div>⏳ <b>Estado:</b> <span className="badge badge-mantenimiento">PENDIENTE DE AUTORIZACIÓN</span></div>
            </div>
            <Link to="/login" className="primary-button" style={{ display: "inline-block", textDecoration: "none", padding: "10px 24px" }}>
              Volver al Inicio de Sesión
            </Link>
          </div>
        ) : (
          <>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 20px 0" }}>
              Completa los datos de tu empresa de alquiler de autos. Tu cuenta será creada y enviada al
              SuperAdministrador para su revisión y activación.
            </p>

            {error && <div className="alert-box error" style={{ marginBottom: "16px" }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div className="form-field">
                  <label htmlFor="regNegocio">Nombre Comercial del Rent a Car *</label>
                  <input
                    id="regNegocio"
                    type="text"
                    placeholder="Ej. Caribe Rent a Car"
                    value={nombreNegocio}
                    onChange={(e) => setNombreNegocio(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="regRnc">RNC / Identificación Fiscal</label>
                  <input
                    id="regRnc"
                    type="text"
                    placeholder="Ej. 1-31-88992-1"
                    value={rnc}
                    onChange={(e) => setRnc(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div className="form-field">
                  <label htmlFor="regContacto">Nombre y Apellido del Dueño / Contacto *</label>
                  <input
                    id="regContacto"
                    type="text"
                    placeholder="Ej. Carlos Santana"
                    value={nombreContacto}
                    onChange={(e) => setNombreContacto(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="regCiudad">Ciudad / Región *</label>
                  <input
                    id="regCiudad"
                    type="text"
                    placeholder="Santo Domingo, Punta Cana, etc."
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div className="form-field">
                  <label htmlFor="regEmail">Correo Electrónico (Para Iniciar Sesión) *</label>
                  <input
                    id="regEmail"
                    type="email"
                    placeholder="carlos@cariberent.do"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="regTel">Teléfono / WhatsApp *</label>
                  <PhoneInput
                    id="regTel"
                    value={telefono}
                    onChange={(val) => setTelefono(val)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div className="form-field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label htmlFor="regPass" style={{ margin: 0 }}>Contraseña Deseada *</label>
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        fontSize: "11px",
                        cursor: "pointer",
                        padding: 0,
                        fontWeight: 600,
                      }}
                    >
                      {mostrarPassword ? "🙈 Ocultar" : "👁️ Ver"}
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      id="regPass"
                      type={mostrarPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingRight: "36px" }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {mostrarPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="regDir">Dirección de la Sucursal</label>
                  <input
                    id="regDir"
                    type="text"
                    placeholder="Av. Principal #12"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="primary-button"
                style={{ width: "100%", padding: "12px", fontSize: "14px", fontWeight: 700 }}
                disabled={enviando}
              >
                {enviando ? "Enviando Solicitud..." : "🚀 Enviar Solicitud de Registro"}
              </button>
            </form>

            <div style={{ marginTop: "20px", textAlign: "center", fontSize: "13px" }}>
              ¿Ya tienes una cuenta autorizada?{" "}
              <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
                Inicia sesión aquí
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
