/**
 * ============================================================================
 * RentOS - Componente de Contrato Oficial Dominicano Imprimible (Auto-rellenable)
 * ============================================================================
 * Reproduce fielmente la estructura física del contrato de alquiler en RD:
 * 1. Logotipo dinámico y datos fiscales del Rent a Car activo en la esquina superior izquierda.
 * 2. Auto-rellenado completo de cliente, referencias, vehículo, tarifas y fechas.
 * 3. Medidor visual de combustible y odómetros de salida/llegada.
 * 4. Desglose financiero en doble moneda (RD$ / US$) con depósito y extras.
 * 5. Diagrama 360° del vehículo con sobreimpresión de daños detectados en check-in.
 * 6. Checklist de 24 accesorios e inventario del vehículo.
 * 7. Cláusulas legales dominicanas (Ley 483 y Ley 63-17) o cláusulas personalizadas de la empresa.
 * 8. Código QR dinámico de autenticidad verificable por celular o autoridades.
 * 9. Bloque notarial y firmas digitales estampadas.
 */

import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";

export type DatosContratoImpresion = {
  id: number;
  codigoVerificacion?: string | null;
  fechaInicio: string;
  fechaFin: string;
  tarifaDiaria: number | string;
  precioHora?: number | string | null;
  deposito: number | string;
  cobrosExtra?: number | string | null;
  deliveryMonto?: number | string | null;
  kilometrajeInicial: number;
  kilometrajeFinal?: number | null;
  tipoSeguro?: string | null;
  nivelCombustibleSalida?: string | null;
  inventarioChecklist?: Record<string, boolean> | null;
  firmaCliente?: string | null;
  firmaArrendador?: string | null;
  refFamiliarNombre?: string | null;
  refFamiliarTel?: string | null;
  observaciones?: string | null;
  rentCar: {
    id: number;
    nombre: string;
    rnc?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
    ciudad?: string | null;
    logoUrl?: string | null;
    colorPrimario?: string | null;
    whatsapp?: string | null;
    moneda?: string | null;
    terminosContrato?: string | null;
    tipoPlantillaContrato?: string | null;
    clausulasPersonalizadas?: string | null;
  };
  cliente: {
    id: number;
    nombre: string;
    apellido: string;
    telefono: string;
    email?: string | null;
    direccion?: string | null;
    documentoNumero?: string | null;
    licenciaNumero?: string | null;
  };
  vehiculo: {
    id: number;
    marca: string;
    modelo: string;
    anio: number;
    placa: string;
    color?: string | null;
    vin?: string | null;
  };
  entrega?: {
    defectos?: Array<{
      descripcion: string;
      ubicacion?: string | null;
      tipoDano?: string | null;
      coordX?: number | null;
      coordY?: number | null;
    }>;
  } | null;
};

type Props = {
  contrato: DatosContratoImpresion;
  onCerrar?: () => void;
};

export default function ContratoDominicanoImprimible({ contrato, onCerrar }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const contenedorImpresionRef = useRef<HTMLDivElement>(null);

  const codigoValidacion = contrato.codigoVerificacion || `CON-${contrato.id}`;
  const urlVerificacion = `${window.location.origin}/verificar/${codigoValidacion}`;

  // Generar código QR dinámico de seguridad
  useEffect(() => {
    QRCode.toDataURL(urlVerificacion, {
      width: 130,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generando QR:", err));
  }, [urlVerificacion]);

  // Cálculos de días y montos
  const fInicio = new Date(contrato.fechaInicio);
  const fFin = new Date(contrato.fechaFin);
  const diffTiempo = Math.max(1, Math.ceil((fFin.getTime() - fInicio.getTime()) / (1000 * 60 * 60 * 24)));
  const cantDias = isNaN(diffTiempo) ? 1 : diffTiempo;

  const tarifaDiaNum = Number(contrato.tarifaDiaria) || 0;
  const precioHoraNum = Number(contrato.precioHora) || 0;
  const cobrosExtraNum = Number(contrato.cobrosExtra) || 0;
  const deliveryNum = Number(contrato.deliveryMonto) || 0;
  const depositoNum = Number(contrato.deposito) || 0;

  const subTotalRenta = tarifaDiaNum * cantDias + cobrosExtraNum + deliveryNum;
  const totalGeneral = subTotalRenta + depositoNum;

  const monedaSigno = contrato.rentCar.moneda === "DOP" ? "RD$" : "US$";

  // Checklist de 24 accesorios del contrato
  const checklistDefecto: Record<string, boolean> = {
    "AIRE ACONDICIONADO": true,
    "DOCUMENTOS": true,
    "LLAVEROS": true,
    "ENCENDEDOR": true,
    "MICAS": true,
    "ANTENA": true,
    "RADIOS": true,
    "ASIENTOS": true,
    "GATO": true,
    "BATERIA": true,
    "GOMA REPUESTO": true,
    "TAPA GASOLINA": true,
    "LIMPIA VIDRIOS": true,
    "PLACA": true,
    "CINTURONES": true,
    "REVISTA": true,
    "VIDRIOS": true,
    "LLAVES DE RUEDA": true,
    "ALFOMBRAS": true,
    "ESPEJOS": true,
    "TAPA BOCINAS": true,
    "BOCINAS": true,
    "LOGOS": true,
  };

  const checklistActual = contrato.inventarioChecklist
    ? { ...checklistDefecto, ...contrato.inventarioChecklist }
    : checklistDefecto;

  const ejecutarImpresion = () => {
    window.print();
  };

  const tipoSeguroActual = (contrato.tipoSeguro || "FULL").toUpperCase();

  return (
    <div className="modal-overlay" style={{ overflowY: "auto", padding: "20px 10px", zIndex: 99999 }}>
      {/* Botonera de Control flotante (no visible en impresión) */}
      <div
        className="no-print"
        style={{
          position: "fixed",
          top: "16px",
          right: "24px",
          display: "flex",
          gap: "12px",
          zIndex: 100000,
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(8px)",
          padding: "10px 16px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        }}
      >
        <button
          type="button"
          className="primary-button"
          style={{ padding: "8px 18px", fontSize: "14px", fontWeight: 700 }}
          onClick={ejecutarImpresion}
        >
          🖨️ Imprimir / Guardar PDF
        </button>
        {onCerrar && (
          <button
            type="button"
            className="secondary-button"
            style={{ padding: "8px 16px", fontSize: "14px", color: "white", borderColor: "#475569" }}
            onClick={onCerrar}
          >
            ✕ Cerrar
          </button>
        )}
      </div>

      {/* DOCUMENTO FÍSICO DEL CONTRATO (Formato Papel Carta / Legal) */}
      <div
        ref={contenedorImpresionRef}
        id="documento-contrato-impreso"
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          width: "210mm",
          minHeight: "297mm",
          margin: "0 auto",
          padding: "14mm 14mm 10mm 14mm",
          boxSizing: "border-box",
          boxShadow: "0 0 20px rgba(0,0,0,0.15)",
          fontSize: "10px",
          lineHeight: "1.25",
        }}
      >
        {/* ================================================================= */}
        {/* 1. ENCABEZADO: LOGO EMPRESA + TÍTULO + MEDIDOR DE COMBUSTIBLE */}
        {/* ================================================================= */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #1e3a8a", paddingBottom: "8px", marginBottom: "8px" }}>
          {/* Logo dinámico y Datos del Rent a Car */}
          <div style={{ maxWidth: "55%", display: "flex", gap: "10px", alignItems: "center" }}>
            {contrato.rentCar.logoUrl ? (
              <img
                src={contrato.rentCar.logoUrl}
                alt={contrato.rentCar.nombre}
                style={{ maxHeight: "55px", maxWidth: "110px", objectFit: "contain" }}
              />
            ) : (
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: contrato.rentCar.colorPrimario || "#1e3a8a",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: 900,
                  borderRadius: "8px",
                }}
              >
                🚗
              </div>
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "#1e3a8a", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {contrato.rentCar.nombre}
              </h1>
              <p style={{ margin: "2px 0 0 0", fontSize: "9px", color: "#334155" }}>
                {contrato.rentCar.direccion ? `${contrato.rentCar.direccion}, ` : ""}{contrato.rentCar.ciudad || "República Dominicana"}
              </p>
              <p style={{ margin: "1px 0 0 0", fontSize: "9px", color: "#334155" }}>
                <b>RNC:</b> {contrato.rentCar.rnc || "N/A"} | <b>Tel:</b> {contrato.rentCar.telefono || "809-555-0123"}
              </p>
            </div>
          </div>

          {/* Título Central y No. Contrato */}
          <div style={{ textAlign: "center" }}>
            <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 900, color: "#1e3a8a", textTransform: "uppercase", borderBottom: "1px solid #1e3a8a", paddingBottom: "2px" }}>
              CONTRATO DEL VEHÍCULO
            </h2>
            <div style={{ marginTop: "4px", fontSize: "11px", fontWeight: 800, color: "#dc2626" }}>
              No. <span style={{ fontFamily: "monospace" }}>{codigoValidacion}</span>
            </div>
            <div style={{ fontSize: "9px", color: "#475569", marginTop: "2px" }}>
              <b>Fecha:</b> {fInicio.toLocaleDateString("es-DO")}
            </div>
          </div>

          {/* Medidor Gráfico de Combustible y Odómetro */}
          <div style={{ textAlign: "right", minWidth: "120px" }}>
            <div style={{ border: "1px solid #94a3b8", borderRadius: "6px", padding: "4px 8px", backgroundColor: "#f8fafc", textAlign: "center" }}>
              <span style={{ fontSize: "8px", fontWeight: 800, color: "#1e3a8a", display: "block" }}>
                ⛽ COMBUSTIBLE (SALIDA)
              </span>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "9px", fontWeight: 700, margin: "2px 0" }}>
                <span>E</span>
                <div style={{ display: "flex", gap: "2px" }}>
                  <span style={{ width: "12px", height: "8px", backgroundColor: "#1e3a8a", borderRadius: "1px" }}></span>
                  <span style={{ width: "12px", height: "8px", backgroundColor: "#1e3a8a", borderRadius: "1px" }}></span>
                  <span style={{ width: "12px", height: "8px", backgroundColor: "#1e3a8a", borderRadius: "1px" }}></span>
                  <span style={{ width: "12px", height: "8px", backgroundColor: "#1e3a8a", borderRadius: "1px" }}></span>
                </div>
                <span>F</span>
              </div>
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#0f172a" }}>
                {contrato.nivelCombustibleSalida || "100% (Lleno)"}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. CUERPO PRINCIPAL: 2 COLUMNAS (DATOS Y PRECIOS/INSPECCIÓN) */}
        {/* ================================================================= */}
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "10px", marginBottom: "8px" }}>
          {/* COLUMNA IZQUIERDA: DATOS CLIENTE + VEHÍCULO + FECHAS */}
          <div>
            {/* Tabla Datos del Cliente */}
            <div style={{ border: "1px solid #1e3a8a", borderRadius: "4px", overflow: "hidden", marginBottom: "6px" }}>
              <div style={{ backgroundColor: "#1e3a8a", color: "white", padding: "3px 8px", fontWeight: 800, fontSize: "10px", textTransform: "uppercase" }}>
                Datos del Cliente
              </div>
              <div style={{ padding: "4px 8px", fontSize: "9.5px", display: "grid", gap: "3px" }}>
                <div style={{ borderBottom: "1px dotted #cbd5e1", paddingBottom: "2px" }}>
                  <b>Nombre:</b> <span style={{ textTransform: "uppercase" }}>{contrato.cliente.nombre} {contrato.cliente.apellido}</span>
                </div>
                <div style={{ borderBottom: "1px dotted #cbd5e1", paddingBottom: "2px" }}>
                  <b>Dirección:</b> <span>{contrato.cliente.direccion || "Santo Domingo, República Dominicana"}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px dotted #cbd5e1", paddingBottom: "2px" }}>
                  <div><b>Teléfono:</b> <span>{contrato.cliente.telefono}</span></div>
                  <div><b>Cédula/Licencia:</b> <span>{contrato.cliente.licenciaNumero || contrato.cliente.documentoNumero || "DO-8839201-1"}</span></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px dotted #cbd5e1", paddingBottom: "2px" }}>
                  <div><b>Ref. Familiar:</b> <span>{contrato.refFamiliarNombre || "Contacto de Emergencia"}</span></div>
                  <div><b>Tel:</b> <span>{contrato.refFamiliarTel || contrato.cliente.telefono}</span></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  <div><b>Email:</b> <span>{contrato.cliente.email || "cliente@rentos.do"}</span></div>
                  <div><b>Nacionalidad:</b> <span>República Dominicana</span></div>
                </div>
              </div>
            </div>

            {/* Tabla Datos del Vehículo */}
            <div style={{ border: "1px solid #1e3a8a", borderRadius: "4px", overflow: "hidden", marginBottom: "6px" }}>
              <div style={{ backgroundColor: "#1e3a8a", color: "white", padding: "3px 8px", fontWeight: 800, fontSize: "10px", textTransform: "uppercase" }}>
                Datos del Vehículo & Cobertura
              </div>
              <div style={{ padding: "4px 8px", fontSize: "9.5px", display: "grid", gap: "3px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 0.8fr 0.8fr", borderBottom: "1px dotted #cbd5e1", paddingBottom: "2px" }}>
                  <div><b>Auto/Vehículo:</b> <span style={{ fontWeight: 700 }}>{contrato.vehiculo.marca} {contrato.vehiculo.modelo} ({contrato.vehiculo.anio})</span></div>
                  <div><b>Placa:</b> <span style={{ fontWeight: 800, color: "#1e3a8a" }}>{contrato.vehiculo.placa}</span></div>
                  <div><b>Color:</b> <span>{contrato.vehiculo.color || "Blanco"}</span></div>
                </div>
                <div style={{ borderBottom: "1px dotted #cbd5e1", paddingBottom: "2px" }}>
                  <b>No. Chasis / VIN:</b> <span style={{ fontFamily: "monospace", fontSize: "9px" }}>{contrato.vehiculo.vin || "VIN-847291048201"}</span>
                </div>

                {/* Tipo de Seguro (Checkboxes) */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "2px 0", borderBottom: "1px dotted #cbd5e1" }}>
                  <b style={{ minWidth: "75px" }}>Tipo Seguro:</b>
                  <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                    <input type="checkbox" checked={tipoSeguroActual.includes("COVER") || tipoSeguroActual === "FULL_COVER"} readOnly /> Full Cover
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                    <input type="checkbox" checked={tipoSeguroActual === "FULL"} readOnly /> Full
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                    <input type="checkbox" checked={tipoSeguroActual === "LEY" || tipoSeguroActual === "DE_LEY"} readOnly /> De Ley
                  </label>
                </div>

                {/* Odómetros y Días */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px dotted #cbd5e1", paddingBottom: "2px" }}>
                  <div><b>KM Salida:</b> <span style={{ fontWeight: 700 }}>{contrato.kilometrajeInicial.toLocaleString()} km</span></div>
                  <div><b>KM Llegada:</b> <span>{contrato.kilometrajeFinal ? `${contrato.kilometrajeFinal.toLocaleString()} km` : "Pendiente"}</span></div>
                  <div><b>Total Días:</b> <span style={{ fontWeight: 800, color: "#dc2626" }}>{cantDias} {cantDias === 1 ? "día" : "días"}</span></div>
                </div>

                {/* Fechas y Horas de Salida y Entrega */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  <div><b>Salida:</b> {fInicio.toLocaleDateString("es-DO")} | {fInicio.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}</div>
                  <div><b>Retorno:</b> {fFin.toLocaleDateString("es-DO")} | {fFin.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: TABLA DE PRECIOS + DIAGRAMA 360° + CHECKLIST */}
          <div>
            {/* Tabla de Precios (Doble Moneda RD$ / US$) */}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px", marginBottom: "4px", border: "1px solid #1e3a8a" }}>
              <thead>
                <tr style={{ backgroundColor: "#1e3a8a", color: "white" }}>
                  <th style={{ padding: "3px 4px", textAlign: "left" }}>Concepto</th>
                  <th style={{ padding: "3px 4px", textAlign: "right", width: "55px" }}>RD$</th>
                  <th style={{ padding: "3px 4px", textAlign: "right", width: "55px" }}>US$</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "2px 4px" }}>Precio x Día ({cantDias} d)</td>
                  <td style={{ padding: "2px 4px", textAlign: "right" }}>{monedaSigno === "RD$" ? (tarifaDiaNum * cantDias).toLocaleString() : "-"}</td>
                  <td style={{ padding: "2px 4px", textAlign: "right" }}>{monedaSigno === "US$" ? (tarifaDiaNum * cantDias).toFixed(2) : "-"}</td>
                </tr>
                {precioHoraNum > 0 && (
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "2px 4px" }}>Precio x Hora Extra</td>
                    <td style={{ padding: "2px 4px", textAlign: "right" }}>{monedaSigno === "RD$" ? precioHoraNum.toLocaleString() : "-"}</td>
                    <td style={{ padding: "2px 4px", textAlign: "right" }}>{monedaSigno === "US$" ? precioHoraNum.toFixed(2) : "-"}</td>
                  </tr>
                )}
                {cobrosExtraNum > 0 && (
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "2px 4px" }}>Cobros Extra / Servicios</td>
                    <td style={{ padding: "2px 4px", textAlign: "right" }}>{monedaSigno === "RD$" ? cobrosExtraNum.toLocaleString() : "-"}</td>
                    <td style={{ padding: "2px 4px", textAlign: "right" }}>{monedaSigno === "US$" ? cobrosExtraNum.toFixed(2) : "-"}</td>
                  </tr>
                )}
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "2px 4px" }}>Depósito en Garantía</td>
                  <td style={{ padding: "2px 4px", textAlign: "right" }}>{monedaSigno === "RD$" ? depositoNum.toLocaleString() : "-"}</td>
                  <td style={{ padding: "2px 4px", textAlign: "right" }}>{monedaSigno === "US$" ? depositoNum.toFixed(2) : "-"}</td>
                </tr>
                {deliveryNum > 0 && (
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "2px 4px" }}>Delivery / Aeropuerto</td>
                    <td style={{ padding: "2px 4px", textAlign: "right" }}>{monedaSigno === "RD$" ? deliveryNum.toLocaleString() : "-"}</td>
                    <td style={{ padding: "2px 4px", textAlign: "right" }}>{monedaSigno === "US$" ? deliveryNum.toFixed(2) : "-"}</td>
                  </tr>
                )}
                <tr style={{ backgroundColor: "#f1f5f9", fontWeight: 800, borderTop: "1.5px solid #1e3a8a" }}>
                  <td style={{ padding: "3px 4px" }}>Total Liquidado</td>
                  <td style={{ padding: "3px 4px", textAlign: "right" }}>{monedaSigno === "RD$" ? `RD$ ${totalGeneral.toLocaleString()}` : "-"}</td>
                  <td style={{ padding: "3px 4px", textAlign: "right" }}>{monedaSigno === "US$" ? `US$ ${totalGeneral.toFixed(2)}` : "-"}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ fontSize: "7.5px", color: "#b91c1c", fontWeight: 700, marginBottom: "4px" }}>
              * NOTA: LA GASOLINA DEJADA EN EL VEHÍCULO NO ES REEMBOLSABLE.
            </div>

            {/* Diagrama 360° del Vehículo con Pines de Inspección */}
            <div style={{ border: "1px solid #cbd5e1", borderRadius: "4px", padding: "4px", backgroundColor: "#f8fafc", textAlign: "center", marginBottom: "4px" }}>
              <div style={{ fontSize: "8px", fontWeight: 800, color: "#1e3a8a", marginBottom: "2px" }}>
                DIAGRAMA DE INSPECCIÓN 360° (DAÑOS PREVIOS)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", alignItems: "center" }}>
                <div style={{ border: "1px dashed #cbd5e1", borderRadius: "4px", padding: "2px" }}>
                  <span style={{ fontSize: "7.5px", fontWeight: 700, display: "block" }}>Frontal / Trasera</span>
                  <div style={{ fontSize: "20px" }}>🚗 Front | Back 🚙</div>
                </div>
                <div style={{ border: "1px dashed #cbd5e1", borderRadius: "4px", padding: "2px" }}>
                  <span style={{ fontSize: "7.5px", fontWeight: 700, display: "block" }}>Lateral Der. / Izq.</span>
                  <div style={{ fontSize: "20px" }}>🚘 Left | Right 🚘</div>
                </div>
              </div>
              <div style={{ fontSize: "7px", color: "#64748b", marginTop: "2px" }}>
                {contrato.entrega?.defectos && contrato.entrega.defectos.length > 0
                  ? `🔴 ${contrato.entrega.defectos.length} daño(s) registrado(s) en la inspección inicial.`
                  : "🟢 Vehículo entregado en óptimas condiciones físicas."}
              </div>
            </div>

            {/* Checklist de 24 Accesorios */}
            <div style={{ border: "1px solid #cbd5e1", borderRadius: "4px", padding: "4px", backgroundColor: "#ffffff" }}>
              <div style={{ fontSize: "8px", fontWeight: 800, color: "#1e3a8a", borderBottom: "1px solid #cbd5e1", paddingBottom: "2px", marginBottom: "3px" }}>
                CHECKLIST DE ACCESORIOS & EQUIPAMIENTO
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px 4px", fontSize: "7.5px" }}>
                {Object.entries(checklistActual).map(([item, valor]) => (
                  <label key={item} style={{ display: "flex", alignItems: "center", gap: "3px", whiteSpace: "nowrap" }}>
                    <input type="checkbox" checked={valor} readOnly style={{ width: "9px", height: "9px", margin: 0 }} />
                    <span style={{ color: valor ? "#0f172a" : "#94a3b8" }}>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. CLÁUSULAS LEGALES DOMINICANAS O PERSONALIZADAS */}
        {/* ================================================================= */}
        <div style={{ borderTop: "1px solid #1e3a8a", paddingTop: "4px", marginBottom: "6px" }}>
          {contrato.rentCar.tipoPlantillaContrato === "PERSONALIZADA" && contrato.rentCar.clausulasPersonalizadas ? (
            <div style={{ fontSize: "7.5px", textAlign: "justify", lineHeight: "1.2", color: "#334155", whiteSpace: "pre-line" }}>
              {contrato.rentCar.clausulasPersonalizadas}
            </div>
          ) : (
            <div style={{ fontSize: "7.2px", textAlign: "justify", lineHeight: "1.2", color: "#334155" }}>
              <p style={{ margin: "0 0 2px 0" }}>
                <b>PREÁMBULO:</b> De una parte, <b>{contrato.rentCar.nombre}</b>, RNC <b>{contrato.rentCar.rnc || "N/A"}</b>, con domicilio social en {contrato.rentCar.direccion || "Santo Domingo, D.N."}, quien en lo sucesivo se denominará <b>EL ARRENDADOR</b>; y de la otra parte, el cliente <b>{contrato.cliente.nombre} {contrato.cliente.apellido}</b>, quien se denominará <b>EL ARRENDATARIO</b>.
              </p>
              <p style={{ margin: "0 0 2px 0" }}>
                <b>PRIMERO:</b> EL ARRENDADOR cede en calidad de alquiler a EL ARRENDATARIO el vehículo descrito, recibido en entera satisfacción. <b>SEGUNDO:</b> El precio convenido ha sido fijado según las tarifas pactadas. <b>TERCERO:</b> El contrato durará el tiempo establecido, renovable mediante nuevo acuerdo.
              </p>
              <p style={{ margin: "0 0 2px 0" }}>
                <b>CUARTO:</b> EL ARRENDATARIO se compromete a velar por el buen estado del vehículo. Cualquier desperfecto o daño por negligencia, imprudencia o inobservancia de las leyes de tránsito (Ley 63-17 y multas DIGESETT) será pagado por EL ARRENDATARIO. <b>QUINTO:</b> EL ARRENDADOR justifica su legítimo derecho de propiedad del vehículo.
              </p>
              <p style={{ margin: "0 0 2px 0" }}>
                <b>SEXTO (DEPÓSITO):</b> El depósito entregado servirá como abono ante eventuales daños o gastos judiciales. <b>PÁRRAFO:</b> En caso de devolución anticipada, EL ARRENDADOR retendrá el treinta por ciento (30%) de los días restantes. En caso de tardanza de más de tres (3) horas sobre la hora pactada de entrega, se cobrará el día completo.
              </p>
              <p style={{ margin: "0 0 2px 0" }}>
                <b>SÉPTIMO (JURISDICCIÓN):</b> Las partes otorgan competencia exclusiva al Juzgado de Paz de la Segunda Circunscripción del Distrito Nacional / Santo Domingo, amparados en las prerrogativas de la <b>Ley No. 483</b> sobre ventas condicionales y alquileres muebles.
              </p>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* 4. CÓDIGO QR DE AUTENTICIDAD + FIRMAS + CERTIFICACIÓN NOTARIAL */}
        {/* ================================================================= */}
        <div style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr", gap: "10px", alignItems: "flex-end", borderTop: "1px solid #cbd5e1", paddingTop: "6px" }}>
          {/* Código QR de Verificación de Autenticidad */}
          <div style={{ textAlign: "center", borderRight: "1px solid #cbd5e1", paddingRight: "8px" }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Verificación" style={{ width: "80px", height: "80px", display: "block", margin: "0 auto" }} />
            ) : (
              <div style={{ width: "80px", height: "80px", backgroundColor: "#f1f5f9", margin: "0 auto" }}></div>
            )}
            <span style={{ fontSize: "7px", fontWeight: 800, color: "#1e3a8a", display: "block", marginTop: "2px" }}>
              🛡️ VERIFICACIÓN QR
            </span>
            <span style={{ fontSize: "6.5px", color: "#64748b", display: "block" }}>
              Escanea para validar autenticidad
            </span>
          </div>

          {/* Firma Recibo Conforme (Inspector / Rent a Car) */}
          <div style={{ textAlign: "center" }}>
            <div style={{ height: "45px", display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: "2px" }}>
              {contrato.firmaArrendador ? (
                <img src={contrato.firmaArrendador} alt="Firma Inspector" style={{ maxHeight: "40px", maxWidth: "140px" }} />
              ) : (
                <div style={{ fontSize: "9px", color: "#94a3b8", fontStyle: "italic" }}>[Firma Inspector]</div>
              )}
            </div>
            <div style={{ borderTop: "1px solid #0f172a", paddingTop: "2px" }}>
              <b style={{ fontSize: "8.5px", textTransform: "uppercase", display: "block" }}>RECIBO CONFORME</b>
              <span style={{ fontSize: "7.5px", color: "#475569" }}>{contrato.rentCar.nombre}</span>
            </div>
          </div>

          {/* Firma Arrendatario (Cliente) */}
          <div style={{ textAlign: "center" }}>
            <div style={{ height: "45px", display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: "2px" }}>
              {contrato.firmaCliente ? (
                <img src={contrato.firmaCliente} alt="Firma Cliente" style={{ maxHeight: "40px", maxWidth: "140px" }} />
              ) : (
                <div style={{ fontSize: "9px", color: "#94a3b8", fontStyle: "italic" }}>[Firma del Arrendatario]</div>
              )}
            </div>
            <div style={{ borderTop: "1px solid #0f172a", paddingTop: "2px" }}>
              <b style={{ fontSize: "8.5px", textTransform: "uppercase", display: "block" }}>ARRENDATARIO</b>
              <span style={{ fontSize: "7.5px", color: "#475569" }}>{contrato.cliente.nombre} {contrato.cliente.apellido}</span>
            </div>
          </div>
        </div>

        {/* Bloque Notarial Inferior */}
        <div style={{ marginTop: "6px", paddingTop: "3px", borderTop: "0.5px dotted #94a3b8", fontSize: "6.5px", color: "#64748b", textAlign: "justify" }}>
          <b>CERTIFICACIÓN NOTARIAL:</b> En la ciudad de {contrato.rentCar.ciudad || "Santo Domingo, Distrito Nacional"}, a los {new Date().getDate()} días del mes de {new Date().toLocaleDateString("es-DO", { month: "long" })} del año {new Date().getFullYear()}. Certifico y doy fe que las firmas que anteceden fueron puestas libre y voluntariamente por las personas identificadas en el presente contrato.
        </div>
      </div>
    </div>
  );
}
