/**
 * ============================================================================
 * RentOS - Facturación, Recibos NCF y Control de Pagos (PagosPage)
 * ============================================================================
 * Módulo de tesorería y cobros:
 * - Emisión de recibos de pago con numeración de comprobante fiscal NCF.
 * - Registro por método de pago (Efectivo, Tarjeta, Transferencia, PayPal).
 * - Generación de recibo imprimible para el cliente.
 * - Resumen financiero de ingresos cobrados vs saldos pendientes.
 */

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URLS } from "../../services/api";
import { formatearFecha } from "../../utils/dateUtils";

type Cliente = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string | null;
  rncOCedula?: string | null;
};

type Vehiculo = {
  id: number;
  marca: string;
  modelo: string;
  placa: string;
};

type Contrato = {
  id: number;
  rentCarId?: number;
  fechaInicio: string;
  fechaFin: string;
  tarifaDiaria: string | number;
  deposito: string | number;
  estado: string;
  cliente: Cliente;
  vehiculo: Vehiculo;
};

type Pago = {
  id: number;
  contratoId: number;
  monto: string | number;
  fecha: string;
  tipo: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "PAYPAL" | "OTRO";
  referencia: string | null;
  estado: "PAGADO" | "PENDIENTE" | "ANULADO";
  ncf?: string | null;
  tipoDocumento?: "RECIBO" | "FACTURA_FISCAL";
  contrato?: Contrato;
};

type FormularioPago = {
  contratoId: string;
  monto: string;
  tipo: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "PAYPAL" | "OTRO";
  referencia: string;
  estado: "PAGADO" | "PENDIENTE" | "ANULADO";
  tipoDocumento: "RECIBO" | "FACTURA_FISCAL";
  ncf: string;
};

type RentCarInfo = {
  id?: number;
  nombre: string;
  rnc: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string;
  logoUrl?: string | null;
  colorPrimario?: string | null;
  moneda: string;
};

const formularioInicial: FormularioPago = {
  contratoId: "",
  monto: "",
  tipo: "TRANSFERENCIA",
  referencia: "",
  estado: "PAGADO",
  tipoDocumento: "RECIBO",
  ncf: "",
};

export default function PagosPage() {
  const { tenantActivoId } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [rentCarInfo, setRentCarInfo] = useState<RentCarInfo | null>(null);

  const [formulario, setFormulario] = useState<FormularioPago>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pagoImprimir, setPagoImprimir] = useState<Pago | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const [error, setError] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_PAGOS = API_URLS.pagos;

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const targetTenant = tenantActivoId || 1;
      const [resPagos, resContratos, resRentCar] = await Promise.all([
        fetch(API_PAGOS),
        fetch(API_URLS.contratos),
        fetch(`${API_URLS.rentcars}/${targetTenant}`),
      ]);

      if (!resPagos.ok || !resContratos.ok) {
        throw new Error("No fue posible obtener la información de pagos.");
      }

      const [datosPagos, datosContratos, datosRentCar] = await Promise.all([
        resPagos.json(),
        resContratos.json(),
        resRentCar.ok ? resRentCar.json() : null,
      ]);

      setPagos(datosPagos);
      setContratos(datosContratos);
      setRentCarInfo(datosRentCar);
    } catch (err) {
      console.error(err);
      setError("No fue posible conectar con el servidor para cargar los pagos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantActivoId]);

  // Estadísticas calculadas en tiempo real
  const stats = useMemo(() => {
    const totalRecaudado = pagos
      .filter((p) => p.estado === "PAGADO")
      .reduce((sum, p) => sum + Number(p.monto), 0);

    const cantidadPagados = pagos.filter((p) => p.estado === "PAGADO").length;
    const cantidadPendientes = pagos.filter((p) => p.estado === "PENDIENTE").length;
    const cantidadAnulados = pagos.filter((p) => p.estado === "ANULADO").length;

    return {
      totalRecaudado: totalRecaudado.toFixed(2),
      cantidadPagados,
      cantidadPendientes,
      cantidadAnulados,
    };
  }, [pagos]);

  // Filtrado y búsqueda
  const pagosFiltrados = useMemo(() => {
    return pagos.filter((p) => {
      const matchTipo = filtroTipo === "TODOS" || p.tipo === filtroTipo;
      const matchEstado = filtroEstado === "TODOS" || p.estado === filtroEstado;

      const texto = `${p.id} ${p.contratoId} ${p.referencia || ""} ${p.contrato?.cliente?.nombre || ""} ${p.contrato?.cliente?.apellido || ""} ${p.contrato?.vehiculo?.placa || ""}`.toLowerCase();
      const matchBusqueda = texto.includes(busqueda.toLowerCase());

      return matchTipo && matchEstado && matchBusqueda;
    });
  }, [pagos, filtroTipo, filtroEstado, busqueda]);

  const registrarPago = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formulario.contratoId) {
      setErrorFormulario("Debes seleccionar el contrato correspondiente.");
      return;
    }

    if (!formulario.monto || Number(formulario.monto) <= 0) {
      setErrorFormulario("Ingresa un monto válido mayor a 0.");
      return;
    }

    try {
      setGuardando(true);
      setErrorFormulario("");
      setError("");

      const datos = {
        contratoId: Number(formulario.contratoId),
        monto: Number(formulario.monto),
        tipo: formulario.tipo,
        referencia: formulario.referencia.trim() || undefined,
        estado: formulario.estado,
      };

      const respuesta = await fetch(API_PAGOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => null);
        throw new Error(errorData?.error || "Error al registrar el pago.");
      }

      const pagoCreado = await respuesta.json();

      setMensaje("✅ Pago registrado correctamente.");
      setFormulario(formularioInicial);
      setMostrarFormulario(false);
      await cargarDatos();

      // Abrir recibo automáticamente
      setPagoImprimir(pagoCreado);
    } catch (err) {
      console.error(err);
      setErrorFormulario(err instanceof Error ? err.message : "Error al guardar el pago.");
    } finally {
      setGuardando(false);
    }
  };

  const iconoTipoPago = (tipo: Pago["tipo"]) => {
    switch (tipo) {
      case "EFECTIVO":
        return "💵 Efectivo";
      case "TRANSFERENCIA":
        return "🏦 Transferencia";
      case "TARJETA":
        return "💳 Tarjeta";
      case "PAYPAL":
        return "🌐 PayPal / Online";
      default:
        return "📦 Otro";
    }
  };

  return (
    <div className="pagos-container">
      {/* Encabezado */}
      <div className="page-heading">
        <div>
          <h1>Facturación & Cuentas por Cobrar (NCF / Recibos)</h1>
          <p>
            Emite facturas fiscales, comprobantes NCF, cobros por tarjeta, transferencias y despacho de recibos por WhatsApp.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          {mostrarFormulario ? "Cerrar Formulario" : "+ Registrar Cobro / Factura"}
        </button>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Tarjetas de Métricas de Caja */}
      <div className="dashboard-metrics" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div className="metric-card">
          <div className="metric-title">Total Recaudado</div>
          <div className="metric-value" style={{ color: "var(--success)" }}>
            ${Number(stats.totalRecaudado).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {stats.cantidadPagados} cobros confirmados
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Cobros Pendientes</div>
          <div className="metric-value" style={{ color: "var(--warning)" }}>
            {stats.cantidadPendientes}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Pagos en proceso o por validar
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Pagos Anulados</div>
          <div className="metric-value" style={{ color: "var(--danger)" }}>
            {stats.cantidadAnulados}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Cancelados o revertidos
          </div>
        </div>
      </div>

      {/* Formulario de Nuevo Pago / Factura */}
      {mostrarFormulario && (
        <section className="content-panel" style={{ marginBottom: "24px" }}>
          <div className="panel-header">
            <h2>Registrar Nuevo Cobro / Emisión de Recibo Fiscal</h2>
            <button className="secondary-button" onClick={() => setMostrarFormulario(false)}>
              Cancelar
            </button>
          </div>

          {errorFormulario && <div className="alert-box error" style={{ margin: "16px 20px 0" }}>{errorFormulario}</div>}

          <form onSubmit={registrarPago} style={{ padding: "20px" }}>
            <div className="form-grid">
              <div className="form-field" style={{ gridColumn: "span 2" }}>
                <label htmlFor="contratoSelect">Contrato Correspondiente *</label>
                <select
                  id="contratoSelect"
                  value={formulario.contratoId}
                  onChange={(e) => setFormulario({ ...formulario, contratoId: e.target.value })}
                  required
                >
                  <option value="">-- Seleccionar Contrato --</option>
                  {contratos.map((c) => (
                    <option key={c.id} value={c.id}>
                      Contrato #{c.id} • {c.cliente?.nombre} {c.cliente?.apellido} — {c.vehiculo?.marca} {c.vehiculo?.modelo} ({c.vehiculo?.placa}) [Tarifa: ${c.tarifaDiaria}/día]
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="montoInput">Monto a Cobrar ($) *</label>
                <input
                  id="montoInput"
                  type="number"
                  step="0.01"
                  placeholder="Ej. 150.00"
                  value={formulario.monto}
                  onChange={(e) => setFormulario({ ...formulario, monto: e.target.value })}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="tipoSelect">Método de Pago *</label>
                <select
                  id="tipoSelect"
                  value={formulario.tipo}
                  onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value as FormularioPago["tipo"] })}
                  required
                >
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                  <option value="TARJETA">💳 Tarjeta de Crédito / Débito</option>
                  <option value="PAYPAL">🌐 PayPal / Pago Online</option>
                  <option value="OTRO">📦 Otro</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="refInput">Número de Comprobante / Voucher / NCF</label>
                <input
                  id="refInput"
                  type="text"
                  placeholder="Ej. B0200000045 o Voucher #88392"
                  value={formulario.referencia}
                  onChange={(e) => setFormulario({ ...formulario, referencia: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label htmlFor="estadoSelect">Estado del Cobro</label>
                <select
                  id="estadoSelect"
                  value={formulario.estado}
                  onChange={(e) => setFormulario({ ...formulario, estado: e.target.value as FormularioPago["estado"] })}
                  required
                >
                  <option value="PAGADO">✓ PAGADO (Cobrado con éxito)</option>
                  <option value="PENDIENTE">⏳ PENDIENTE (Por confirmar)</option>
                  <option value="ANULADO">✕ ANULADO</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setMostrarFormulario(false)}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button type="submit" className="primary-button" disabled={guardando}>
                {guardando ? "Registrando Pago..." : "💾 Guardar & Emitir Recibo"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tabla de Pagos */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>Historial de Pagos & Recibos Emitidos</h2>
          <div className="panel-actions" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              style={{ fontSize: "12px", padding: "6px 10px" }}
            >
              <option value="TODOS">Todos los Métodos</option>
              <option value="EFECTIVO">💵 Efectivo</option>
              <option value="TARJETA">💳 Tarjeta</option>
              <option value="TRANSFERENCIA">🏦 Transferencia</option>
              <option value="PAYPAL">🌐 PayPal</option>
            </select>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{ fontSize: "12px", padding: "6px 10px" }}
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="PAGADO">PAGADO</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="ANULADO">ANULADO</option>
            </select>

            <input
              type="text"
              placeholder="Buscar por cliente, placa, ID o NCF..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: "240px" }}
            />
          </div>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando pagos...</strong>
          </div>
        ) : pagosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <strong>No hay pagos que coincidan con los filtros.</strong>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Contrato</th>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Referencia / NCF</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="badge badge-mantenimiento">REC-{String(p.id).padStart(5, "0")}</span>
                    </td>
                    <td>{formatearFecha(p.fecha)}</td>
                    <td>
                      <strong>Contrato #{p.contratoId}</strong>
                    </td>
                    <td>
                      {p.contrato?.cliente ? (
                        <div>
                          <strong>{p.contrato.cliente.nombre} {p.contrato.cliente.apellido}</strong>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            {p.contrato.cliente.telefono}
                          </div>
                        </div>
                      ) : "Cliente N/D"}
                    </td>
                    <td>
                      {p.contrato?.vehiculo ? (
                        <div>
                          <strong>{p.contrato.vehiculo.marca} {p.contrato.vehiculo.modelo}</strong>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            {p.contrato.vehiculo.placa}
                          </div>
                        </div>
                      ) : "N/D"}
                    </td>
                    <td>
                      <strong style={{ fontSize: "14px", color: "#15803d" }}>
                        ${Number(p.monto).toFixed(2)}
                      </strong>
                    </td>
                    <td>{iconoTipoPago(p.tipo)}</td>
                    <td>
                      {p.referencia ? <code>{p.referencia}</code> : <span style={{ color: "var(--text-secondary)" }}>-</span>}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          p.estado === "PAGADO"
                            ? "badge-disponible"
                            : p.estado === "PENDIENTE"
                            ? "badge-alquilado"
                            : "badge-mantenimiento"
                        }`}
                      >
                        {p.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-action-primary"
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                        onClick={() => setPagoImprimir(p)}
                      >
                        🧾 Recibo / NCF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Recibo Oficial / Factura Fiscal Imprimible */}
      {pagoImprimir && (
        <div
          id="modal-recibo-oficial"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          {/* Estilos dedicados para impresión perfecta */}
          <style>{`
            @media print {
              body, html {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }
              body * {
                visibility: hidden !important;
              }
              #modal-recibo-oficial,
              #modal-recibo-oficial * {
                visibility: visible !important;
              }
              #modal-recibo-oficial {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                background: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
                display: block !important;
                z-index: 999999 !important;
              }
              .modal-recibo-card {
                box-shadow: none !important;
                border: none !important;
                max-width: 100% !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
              @page {
                size: letter portrait;
                margin: 12mm 15mm;
              }
            }
          `}</style>

          <div
            className="modal-recibo-card"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              maxWidth: "580px",
              width: "100%",
              padding: "32px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
              color: "#1e293b",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {/* Cabecera del Recibo con Logotipo */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed #cbd5e1", paddingBottom: "16px", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {rentCarInfo?.logoUrl ? (
                  <img
                    src={rentCarInfo.logoUrl}
                    alt="Logo"
                    style={{ maxHeight: "50px", maxWidth: "120px", objectFit: "contain" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: rentCarInfo?.colorPrimario || "var(--primary)",
                      color: "white",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "18px",
                    }}
                  >
                    {rentCarInfo?.nombre ? rentCarInfo.nombre.charAt(0).toUpperCase() : "R"}
                  </div>
                )}
                <div>
                  <h2 style={{ margin: "0 0 2px 0", fontSize: "17px", color: rentCarInfo?.colorPrimario || "var(--primary)", fontWeight: 800 }}>
                    {rentCarInfo?.nombre || "RentOS Principal"}
                  </h2>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>
                    RNC: {rentCarInfo?.rnc || "1-31-00000-1"} • Tel: {rentCarInfo?.telefono || "(809) 555-0199"}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "#64748b", textTransform: "uppercase" }}>
                  COMPROBANTE DE PAGO
                </div>
                <div style={{ fontSize: "17px", fontWeight: "900", color: rentCarInfo?.colorPrimario || "var(--primary)" }}>
                  No. REC-{String(pagoImprimir.id).padStart(6, "0")}
                </div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>
                  {new Date(pagoImprimir.fecha).toLocaleString("es-DO")}
                </div>
              </div>
            </div>

            {/* Desglose de Pago */}
            <div style={{ fontSize: "13px", lineHeight: "1.9", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Recibido de:</span>
                <strong>
                  {pagoImprimir.contrato?.cliente
                    ? `${pagoImprimir.contrato.cliente.nombre} ${pagoImprimir.contrato.cliente.apellido}`
                    : "Cliente"}
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Concepto:</span>
                <span>Renta de Vehículo (Contrato #{pagoImprimir.contratoId})</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Vehículo:</span>
                <span>
                  {pagoImprimir.contrato?.vehiculo?.marca} {pagoImprimir.contrato?.vehiculo?.modelo} (
                  <b>{pagoImprimir.contrato?.vehiculo?.placa}</b>)
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Método de Pago:</span>
                <span>{iconoTipoPago(pagoImprimir.tipo)}</span>
              </div>

              {pagoImprimir.referencia && (
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "4px" }}>
                  <span style={{ color: "#64748b" }}>Comprobante / NCF:</span>
                  <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>
                    {pagoImprimir.referencia}
                  </code>
                </div>
              )}
            </div>

            {/* Total Destacado */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                padding: "14px 18px",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <strong style={{ fontSize: "14px", color: "#166534" }}>MONTO TOTAL PAGADO:</strong>
              <strong style={{ fontSize: "22px", color: "#15803d" }}>
                ${Number(pagoImprimir.monto).toFixed(2)} {rentCarInfo?.moneda || "USD"}
              </strong>
            </div>

            <div style={{ textAlign: "center", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
              <div style={{ width: "160px", borderTop: "1px solid #94a3b8", margin: "0 auto 4px auto" }} />
              <div style={{ fontSize: "11px", color: "#64748b" }}>Firma & Sello Autorizado de Caja</div>
            </div>

            {/* Botones de Acción (Ocultos al imprimir) */}
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPagoImprimir(null)}
              >
                Cerrar
              </button>

              <div style={{ display: "flex", gap: "8px" }}>
                {pagoImprimir.contrato?.cliente?.telefono && (
                  <a
                    href={`https://wa.me/${pagoImprimir.contrato.cliente.telefono.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      `Hola ${pagoImprimir.contrato.cliente.nombre}, confirmamos la recepción de tu pago por valor de $${Number(pagoImprimir.monto).toFixed(2)} ${rentCarInfo?.moneda || "USD"} correspondiente al Contrato #${pagoImprimir.contratoId} (${pagoImprimir.contrato.vehiculo?.marca} ${pagoImprimir.contrato.vehiculo?.modelo}). ¡Gracias por tu preferencia con ${rentCarInfo?.nombre || "RentOS"}!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="primary-button"
                    style={{ backgroundColor: "#22c55e", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    💬 Enviar a WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => window.print()}
                >
                  🖨️ Imprimir Recibo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}