/**
 * ============================================================================
 * RentOS - Estado de Cuenta Financiero Imprimible del Cliente (PDF / Print)
 * ============================================================================
 * Genera un informe contable y financiero oficial para el cliente:
 * - Membrete de la empresa Rent a Car con RNC y datos de contacto.
 * - Datos del arrendatario / empresa.
 * - Resumen financiero: Total Facturado, Total Pagado y Balance Pendiente.
 * - Desglose pormenorizado "En qué gastó": contratos, vehículos, días,
 *   cobertura de seguros, cargos de delivery y adicionales.
 */

import { useRef } from "react";
import { formatearFecha } from "../utils/dateUtils";

export type DesgloseGastoContrato = {
  contratoId: number;
  vehiculo: string;
  fechaInicio: string;
  fechaFin: string;
  diasRenta: number;
  tarifaDiaria: number;
  costoRentaBase: number;
  tipoSeguro: string;
  cobrosExtra: number;
  deliveryMonto: number;
  depositoGarantia: number;
  totalContrato: number;
  totalPagado: number;
  saldoPendiente: number;
  estado: string;
  observaciones?: string | null;
};

export type DatosEstadoCuentaCliente = {
  cliente: {
    id: number;
    nombre: string;
    apellido: string;
    telefono: string;
    email?: string | null;
    direccion?: string | null;
    rncOCedula?: string | null;
  };
  totalFacturado: number;
  totalPagado: number;
  balancePendiente: number;
  cantidadContratos: number;
  desgloseEnQueGasto: DesgloseGastoContrato[];
  rentCar: {
    nombre: string;
    rnc?: string | null;
    telefono?: string | null;
    email?: string | null;
    direccion?: string | null;
    ciudad?: string | null;
    logoUrl?: string | null;
    eslogan?: string | null;
  };
  moneda: "USD" | "DOP";
  tasaCambio: number;
  periodoTexto?: string;
};

interface Props {
  datos: DatosEstadoCuentaCliente;
  onCerrar: () => void;
}

export default function EstadoCuentaClienteImprimible({ datos, onCerrar }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const { cliente, rentCar, moneda, tasaCambio } = datos;

  const formatearMonto = (montoUSD: number) => {
    if (moneda === "USD") {
      return `$ ${montoUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    }
    return `RD$ ${(montoUSD * tasaCambio).toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DOP`;
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.8)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Barra de Acciones Superior */}
      <div
        className="no-print"
        style={{
          width: "100%",
          maxWidth: "850px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          background: "var(--surface)",
          padding: "10px 16px",
          borderRadius: "8px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <strong style={{ fontSize: "14px" }}>
            📄 Estado de Cuenta de Cliente: {cliente.nombre} {cliente.apellido}
          </strong>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            ({moneda === "USD" ? "Valores en Dólares US$" : `Valores en Pesos RD$ - Tasa: ${tasaCambio}`})
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={handleImprimir}
            style={{
              padding: "6px 14px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            🖨️ Imprimir / Guardar en PDF
          </button>
          <button
            onClick={onCerrar}
            style={{
              padding: "6px 12px",
              backgroundColor: "#64748b",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            ✕ Cerrar
          </button>
        </div>
      </div>

      {/* Hoja Imprimible (A4 / Carta) */}
      <div
        ref={contenedorRef}
        style={{
          width: "100%",
          maxWidth: "850px",
          maxHeight: "85vh",
          overflowY: "auto",
          backgroundColor: "#ffffff",
          color: "#0f172a",
          padding: "36px 40px",
          borderRadius: "8px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontSize: "12px",
          lineHeight: "1.4",
        }}
      >
        {/* Cabecera Corporativa */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "2px solid #1e3a8a",
            paddingBottom: "16px",
            marginBottom: "20px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "22px", color: "#1e3a8a", fontWeight: 800 }}>
              {rentCar.nombre || "RentOS Mobility Dominicana"}
            </h1>
            {rentCar.eslogan && (
              <div style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                {rentCar.eslogan}
              </div>
            )}
            <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>
              {rentCar.rnc && <span>RNC: <b>{rentCar.rnc}</b> • </span>}
              <span>{rentCar.direccion || "Av. 27 de Febrero, Santo Domingo, D.N."}</span>
            </div>
            <div style={{ fontSize: "11px", color: "#475569" }}>
              {rentCar.telefono && <span>Tel: {rentCar.telefono} • </span>}
              {rentCar.email && <span>Email: {rentCar.email}</span>}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#1e3a8a",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Estado de Cuenta Oficial
            </span>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px" }}>
              Fecha de Emisión: <b>{formatearFecha(new Date().toISOString())}</b>
            </div>
            {datos.periodoTexto && (
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                Período: <b>{datos.periodoTexto}</b>
              </div>
            )}
          </div>
        </div>

        {/* Datos del Cliente y Resumen Financiero */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {/* Ficha del Cliente */}
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              padding: "12px 14px",
              background: "#f8fafc",
            }}
          >
            <div style={{ fontSize: "10px", fontWeight: 800, color: "#1e3a8a", textTransform: "uppercase", marginBottom: "4px" }}>
              Información del Arrendatario / Cliente
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
              {cliente.nombre} {cliente.apellido}
            </div>
            <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
              Teléfono: <b>{cliente.telefono}</b>
            </div>
            {cliente.email && (
              <div style={{ fontSize: "11px", color: "#475569" }}>
                Email: {cliente.email}
              </div>
            )}
            {cliente.direccion && (
              <div style={{ fontSize: "11px", color: "#475569" }}>
                Dirección: {cliente.direccion}
              </div>
            )}
          </div>

          {/* Balance Financiero Resumido */}
          <div
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: "6px",
              padding: "12px 14px",
              background: "#eff6ff",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <div>
              <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block" }}>
                Total Facturado (Gastos):
              </span>
              <strong style={{ fontSize: "14px", color: "#0f172a" }}>
                {formatearMonto(datos.totalFacturado)}
              </strong>
            </div>
            <div>
              <span style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", display: "block" }}>
                Total Abonado / Pagado:
              </span>
              <strong style={{ fontSize: "14px", color: "#15803d" }}>
                {formatearMonto(datos.totalPagado)}
              </strong>
            </div>
            <div style={{ gridColumn: "span 2", borderTop: "1px solid #bfdbfe", paddingTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#1e3a8a" }}>
                Saldo Pendiente por Liquidar:
              </span>
              <strong
                style={{
                  fontSize: "15px",
                  color: datos.balancePendiente > 0 ? "#dc2626" : "#15803d",
                }}
              >
                {formatearMonto(datos.balancePendiente)}
              </strong>
            </div>
          </div>
        </div>

        {/* Desglose Detallado "En qué gastó" */}
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#1e3a8a",
              textTransform: "uppercase",
              marginBottom: "8px",
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: "4px",
            }}
          >
            Detalle de Alquileres, Contratos y Servicios Consumidos
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11px",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#1e3a8a", color: "#ffffff" }}>
                <th style={{ padding: "6px 8px" }}>Contrato</th>
                <th style={{ padding: "6px 8px" }}>Vehículo Rentado</th>
                <th style={{ padding: "6px 8px" }}>Período & Días</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>Renta Base</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>Extras/Delivery</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>Total Facturado</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>Total Pagado</th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {datos.desgloseEnQueGasto.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "16px", color: "#64748b" }}>
                    No hay contratos registrados para este cliente en el período seleccionado.
                  </td>
                </tr>
              ) : (
                datos.desgloseEnQueGasto.map((item, idx) => (
                  <tr
                    key={item.contratoId || idx}
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                    }}
                  >
                    <td style={{ padding: "6px 8px", fontWeight: 700 }}>
                      #{item.contratoId}
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <strong>{item.vehiculo}</strong>
                      <div style={{ fontSize: "10px", color: "#64748b" }}>
                        Seguro: {item.tipoSeguro}
                      </div>
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      {formatearFecha(item.fechaInicio)} al {formatearFecha(item.fechaFin)}
                      <div style={{ fontSize: "10px", color: "#1e3a8a", fontWeight: 700 }}>
                        {item.diasRenta} {item.diasRenta === 1 ? "día" : "días"}
                      </div>
                    </td>
                    <td style={{ padding: "6px 8px", textAlign: "right" }}>
                      {formatearMonto(item.costoRentaBase)}
                    </td>
                    <td style={{ padding: "6px 8px", textAlign: "right" }}>
                      {formatearMonto(item.cobrosExtra + item.deliveryMonto)}
                    </td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700 }}>
                      {formatearMonto(item.totalContrato)}
                    </td>
                    <td style={{ padding: "6px 8px", textAlign: "right", color: "#15803d", fontWeight: 700 }}>
                      {formatearMonto(item.totalPagado)}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        textAlign: "right",
                        fontWeight: 700,
                        color: item.saldoPendiente > 0 ? "#dc2626" : "#15803d",
                      }}
                    >
                      {formatearMonto(item.saldoPendiente)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: "#f1f5f9", fontWeight: 800, borderTop: "2px solid #cbd5e1" }}>
                <td colSpan={5} style={{ padding: "8px", textAlign: "right" }}>
                  TOTALES ACUMULADOS:
                </td>
                <td style={{ padding: "8px", textAlign: "right" }}>
                  {formatearMonto(datos.totalFacturado)}
                </td>
                <td style={{ padding: "8px", textAlign: "right", color: "#15803d" }}>
                  {formatearMonto(datos.totalPagado)}
                </td>
                <td
                  style={{
                    padding: "8px",
                    textAlign: "right",
                    color: datos.balancePendiente > 0 ? "#dc2626" : "#15803d",
                  }}
                >
                  {formatearMonto(datos.balancePendiente)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Firmas de Conformidad */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            marginTop: "40px",
            paddingTop: "20px",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ height: "40px" }}></div>
            <div style={{ borderTop: "1px solid #94a3b8", width: "80%", margin: "0 auto", paddingTop: "4px" }}>
              <div style={{ fontWeight: 700, fontSize: "11px" }}>Firma & Sello Arrendador</div>
              <div style={{ fontSize: "10px", color: "#64748b" }}>{rentCar.nombre}</div>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ height: "40px" }}></div>
            <div style={{ borderTop: "1px solid #94a3b8", width: "80%", margin: "0 auto", paddingTop: "4px" }}>
              <div style={{ fontWeight: 700, fontSize: "11px" }}>Firma de Conformidad del Cliente</div>
              <div style={{ fontSize: "10px", color: "#64748b" }}>{cliente.nombre} {cliente.apellido}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
