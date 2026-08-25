/**
 * ============================================================================
 * RentOS - Portal Público de Verificación de Autenticidad QR (VerificarContratoPage)
 * ============================================================================
 * Pantalla pública a la que redirige el Código QR del contrato físico:
 * - Consulta el endpoint /api/contratos/verificar/:codigo
 * - Muestra el sello de autenticidad verde y los metadatos inmutables del contrato.
 * - Proporciona validación legal inmediata a inspectores, DIGESETT, aseguradoras y clientes.
 */

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_URLS } from "../../services/api";

type ResultadoVerificacion = {
  valido: boolean;
  selloAutenticidad?: string;
  codigoVerificacion?: string;
  hashIntegridad?: string;
  contratoId?: number;
  estado?: string;
  fechaEmision?: string;
  vigencia?: {
    inicio: string;
    fin: string;
    dias: number;
  };
  empresa?: {
    nombre: string;
    rnc?: string | null;
    telefono?: string | null;
    email?: string | null;
    ciudad?: string | null;
    direccion?: string | null;
    logoUrl?: string | null;
    whatsapp?: string | null;
  };
  cliente?: {
    nombreCompleto: string;
    telefono: string;
    email?: string | null;
    estado?: string;
  };
  vehiculo?: {
    descripcion: string;
    placa: string;
    color?: string | null;
    vin?: string | null;
  };
  seguro?: string;
  kilometrajeInicial?: number;
  tieneFirmaDigital?: boolean;
  inspeccionRealizada?: boolean;
  mensaje?: string;
  error?: string;
};

export default function VerificarContratoPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!codigo) return;

    fetch(`${API_URLS.contratos}/verificar/${codigo}`)
      .then((res) => res.json())
      .then((data) => {
        setResultado(data);
      })
      .catch((err) => {
        console.error("Error al verificar contrato:", err);
        setResultado({
          valido: false,
          mensaje: "No fue posible conectar con el servidor de validación de RentOS.",
        });
      })
      .finally(() => {
        setCargando(false);
      });
  }, [codigo]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px",
      }}
    >
      {/* Cabecera de Confianza y Seguridad */}
      <div style={{ maxWidth: "560px", width: "100%", textAlign: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "28px" }}>🛡️</span>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#38bdf8", letterSpacing: "0.5px" }}>
            RentOS Digital Trust
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
          Servicio Oficial de Verificación de Contratos y Legitimidad Vehicular en República Dominicana
        </p>
      </div>

      {/* Contenedor Principal */}
      <div
        style={{
          maxWidth: "560px",
          width: "100%",
          backgroundColor: "#1e293b",
          borderRadius: "20px",
          padding: "28px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          border: "1px solid #334155",
        }}
      >
        {cargando ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>⏳</div>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#e2e8f0" }}>Consultando base de datos oficial...</h3>
            <p style={{ fontSize: "13px", color: "#94a3b8" }}>Validando firma y hash de seguridad</p>
          </div>
        ) : resultado?.valido ? (
          <div>
            {/* Sello de Autenticidad Verde */}
            <div
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                border: "2px solid #10b981",
                borderRadius: "14px",
                padding: "16px",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "4px" }}>✅</div>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: 900, color: "#10b981" }}>
                CONTRATO OFICIAL AUTÉNTICO Y REGISTRADO
              </h2>
              <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1" }}>
                Este contrato fue emitido legítimamente a través de la plataforma RentOS y se encuentra activo y legalmente vigente.
              </p>
              <div
                style={{
                  marginTop: "8px",
                  display: "inline-block",
                  backgroundColor: "#10b981",
                  color: "#0f172a",
                  fontWeight: 800,
                  fontSize: "11px",
                  padding: "3px 10px",
                  borderRadius: "6px",
                }}
              >
                CÓDIGO: {resultado.codigoVerificacion}
              </div>
            </div>

            {/* Ficha de la Empresa Emisora */}
            <div style={{ borderBottom: "1px solid #334155", paddingBottom: "14px", marginBottom: "14px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "1px" }}>
                🏢 Empresa Emisora
              </span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#ffffff" }}>
                    {resultado.empresa?.nombre}
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                    RNC: <b>{resultado.empresa?.rnc || "N/A"}</b> | Tel: {resultado.empresa?.telefono}
                  </p>
                  <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#64748b" }}>
                    {resultado.empresa?.ciudad}, República Dominicana
                  </p>
                </div>
                {resultado.empresa?.logoUrl && (
                  <img
                    src={resultado.empresa.logoUrl}
                    alt="Logo"
                    style={{ maxHeight: "40px", maxWidth: "90px", objectFit: "contain" }}
                  />
                )}
              </div>
            </div>

            {/* Datos del Vehículo Arrendado */}
            <div style={{ borderBottom: "1px solid #334155", paddingBottom: "14px", marginBottom: "14px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "1px" }}>
                🚗 Vehículo Autorizado
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "6px" }}>
                <div style={{ backgroundColor: "#0f172a", padding: "10px", borderRadius: "10px" }}>
                  <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Vehículo:</span>
                  <strong style={{ fontSize: "14px", color: "#f8fafc" }}>{resultado.vehiculo?.descripcion}</strong>
                </div>
                <div style={{ backgroundColor: "#0f172a", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                  <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Placa Dominicana:</span>
                  <strong style={{ fontSize: "16px", color: "#38bdf8", letterSpacing: "1px" }}>{resultado.vehiculo?.placa}</strong>
                </div>
              </div>
              <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontSize: "12px", color: "#cbd5e1" }}>
                <span><b>Color:</b> {resultado.vehiculo?.color || "Blanco"}</span>
                <span><b>Seguro:</b> {resultado.seguro}</span>
                <span><b>Odómetro Salida:</b> {resultado.kilometrajeInicial?.toLocaleString()} km</span>
              </div>
            </div>

            {/* Datos del Arrendatario */}
            <div style={{ borderBottom: "1px solid #334155", paddingBottom: "14px", marginBottom: "14px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "1px" }}>
                👤 Arrendatario Registrado
              </span>
              <div style={{ marginTop: "4px" }}>
                <h4 style={{ margin: 0, fontSize: "15px", color: "#ffffff" }}>
                  {resultado.cliente?.nombreCompleto}
                </h4>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                  Teléfono de Contacto: <b>{resultado.cliente?.telefono}</b>
                </p>
              </div>
            </div>

            {/* Período de Vigencia */}
            <div style={{ borderBottom: "1px solid #334155", paddingBottom: "14px", marginBottom: "14px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "1px" }}>
                📅 Vigencia de Alquiler
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "6px", fontSize: "12px" }}>
                <div style={{ backgroundColor: "#0f172a", padding: "8px 12px", borderRadius: "8px" }}>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: "10px" }}>Fecha Inicio:</span>
                  <b>{resultado.vigencia?.inicio ? new Date(resultado.vigencia.inicio).toLocaleDateString("es-DO") : ""}</b>
                </div>
                <div style={{ backgroundColor: "#0f172a", padding: "8px 12px", borderRadius: "8px" }}>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: "10px" }}>Fecha Retorno:</span>
                  <b>{resultado.vigencia?.fin ? new Date(resultado.vigencia.fin).toLocaleDateString("es-DO") : ""}</b>
                </div>
              </div>
            </div>

            {/* Hash Criptográfico de Integridad */}
            <div style={{ fontSize: "10px", color: "#64748b", textAlign: "center", marginTop: "12px" }}>
              <div><b>Hash Criptográfico de Seguridad:</b> <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>{resultado.hashIntegridad}</span></div>
              <div style={{ marginTop: "4px" }}>Protegido por el protocolo de auditoría RentOS Smart Contract Engine</div>
            </div>
          </div>
        ) : (
          /* En caso de que no sea válido o no exista */
          <div style={{ textAlign: "center", padding: "30px 10px" }}>
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>⚠️</div>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#ef4444", fontWeight: 800 }}>
              CONTRATO NO ENCONTRADO O NO VÁLIDO
            </h2>
            <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.5", margin: "0 0 20px 0" }}>
              {resultado?.mensaje || "El código escaneado no corresponde a ningún contrato legalmente registrado en la red de RentOS."}
            </p>
            <Link
              to="/login"
              style={{
                display: "inline-block",
                backgroundColor: "#0284c7",
                color: "white",
                textDecoration: "none",
                padding: "10px 20px",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "13px",
              }}
            >
              Ir a Inicio de RentOS
            </Link>
          </div>
        )}
      </div>

      {/* Pie de página */}
      <div style={{ marginTop: "24px", fontSize: "11px", color: "#64748b", textAlign: "center" }}>
        RentOS &copy; {new Date().getFullYear()} — Plataforma de Gestión de Flota y Alquiler de Vehículos
      </div>
    </div>
  );
}
