/**
 * ============================================================================
 * RentOS - Recepción, Inspección 360° y Check-in de Flota (EntregasPage)
 * ============================================================================
 * Módulo de recepción y control de daños:
 * - Mapa visual interactivo de daños de carrocería (rayones, abolladuras, roturas).
 * - Carga de fotografías de evidencia en tiempo real.
 * - Registro de odómetro de retorno y nivel de combustible.
 * - Cierre de contrato y restitución del auto al catálogo de disponibles.
 */

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URLS } from "../../services/api";
import { formatearFechaHora } from "../../utils/dateUtils";

type Cliente = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
};

type Vehiculo = {
  id: number;
  marca: string;
  modelo: string;
  placa: string;
  color: string | null;
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

type Defecto = {
  id?: number;
  descripcion: string;
  ubicacion?: string | null;
  tipoDano?: string | null;
  severidad?: string | null;
  coordX?: number | null;
  coordY?: number | null;
};

type Evidencia = {
  id?: number;
  archivoUrl: string;
  nombreArchivo: string;
  descripcion?: string | null;
};

type Entrega = {
  id: number;
  contratoId: number;
  kilometraje: number;
  nivelCombustible: string | null;
  tieneDefectos: boolean;
  observaciones: string | null;
  fechaHora: string;
  contrato?: Contrato;
  defectos?: Defecto[];
  evidencias?: Evidencia[];
};

type PuntoDano = {
  id: string;
  coordX: number;
  coordY: number;
  ubicacion: string;
  tipoDano: "RAYON" | "ABOLLADURA" | "GOLPE" | "ROTURA_VIDRIO" | "LLANTA";
  severidad: "LEVE" | "MEDIO" | "GRAVE";
  descripcion: string;
};

type FotoSubida = {
  id: string;
  archivoUrl: string;
  nombreArchivo: string;
};

export default function EntregasPage() {
  const { tenantActivoId } = useAuth();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [contratosActivos, setContratosActivos] = useState<Contrato[]>([]);

  const [contratoId, setContratoId] = useState("");
  const [kilometraje, setKilometraje] = useState("");
  const [nivelCombustible, setNivelCombustible] = useState("100% (Lleno)");
  const [observaciones, setObservaciones] = useState("");

  // Control de Depósito de Garantía
  const [estadoDeposito, setEstadoDeposito] = useState<"DEVUELTO" | "DEDUCIDO" | "RETENIDO">("DEVUELTO");
  const [montoDeducido, setMontoDeducido] = useState("0");
  const [motivoDeduccion, setMotivoDeduccion] = useState("");

  // Pines de daños interactivos
  const [puntosDano, setPuntosDano] = useState<PuntoDano[]>([]);
  const [tipoDanoSeleccionado, setTipoDanoSeleccionado] = useState<PuntoDano["tipoDano"]>("RAYON");
  const [severidadSeleccionada, setSeveridadSeleccionada] = useState<PuntoDano["severidad"]>("LEVE");

  // Fotos / Evidencias de Inspección
  const [fotosInspeccion, setFotosInspeccion] = useState<FotoSubida[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [entregaVerDetalle, setEntregaVerDetalle] = useState<Entrega | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_ENTREGAS = API_URLS.entregas;

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const targetTenant = tenantActivoId || 1;
      const [resEntregas, resContratos] = await Promise.all([
        fetch(`${API_ENTREGAS}?rentCarId=${targetTenant}`),
        fetch(`${API_URLS.contratos}?rentCarId=${targetTenant}`),
      ]);

      if (!resEntregas.ok || !resContratos.ok) {
        throw new Error("No fue posible obtener los registros de entregas e inspección.");
      }

      const [datosEntregas, datosContratos] = await Promise.all([
        resEntregas.json(),
        resContratos.json(),
      ]);

      const contratosTenant = datosContratos.filter(
        (c: Contrato) => (!c.rentCarId || c.rentCarId === targetTenant) && c.estado === "ACTIVO"
      );

      setEntregas(datosEntregas.filter((e: Entrega) => !e.contrato?.rentCarId || e.contrato?.rentCarId === targetTenant));
      setContratosActivos(contratosTenant);
    } catch (err) {
      console.error(err);
      setError("Error al conectar con el servidor para cargar entregas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantActivoId]);

  const contratoSeleccionadoObj = useMemo(() => {
    return contratosActivos.find((c) => String(c.id) === contratoId);
  }, [contratosActivos, contratoId]);

  const entregasFiltradas = useMemo(() => {
    return entregas.filter((e) => {
      const texto = `${e.id} ${e.contratoId} ${e.contrato?.cliente?.nombre || ""} ${e.contrato?.cliente?.apellido || ""} ${e.contrato?.vehiculo?.marca || ""} ${e.contrato?.vehiculo?.placa || ""}`.toLowerCase();
      return texto.includes(busqueda.toLowerCase());
    });
  }, [entregas, busqueda]);

  const handleCarDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    let zona = "Lateral";
    if (y < 25) zona = "Frente / Capó";
    else if (y > 75) zona = "Trasera / Baúl";
    else if (x < 30) zona = "Lateral Izquierdo";
    else if (x > 70) zona = "Lateral Derecho";
    else zona = "Techo / Habitáculo";

    const nuevoPunto: PuntoDano = {
      id: String(Date.now()),
      coordX: Math.round(x),
      coordY: Math.round(y),
      ubicacion: zona,
      tipoDano: tipoDanoSeleccionado,
      severidad: severidadSeleccionada,
      descripcion: `${tipoDanoSeleccionado} (${severidadSeleccionada}) en ${zona}`,
    };

    setPuntosDano((prev) => [...prev, nuevoPunto]);
  };

  const eliminarPuntoDano = (id: string) => {
    setPuntosDano((prev) => prev.filter((p) => p.id !== id));
  };

  // Subir fotos de inspección con compresión Canvas
  const handleSubirFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        if (!src) return;

        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 800;
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
            const optimized = canvas.toDataURL("image/jpeg", 0.85);
            setFotosInspeccion((prev) => [
              ...prev,
              {
                id: String(Date.now() + Math.random()),
                archivoUrl: optimized,
                nombreArchivo: file.name,
              },
            ]);
          }
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
  };

  const eliminarFoto = (id: string) => {
    setFotosInspeccion((prev) => prev.filter((f) => f.id !== id));
  };

  const procesarRecepcion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contratoId) {
      setError("Debes seleccionar un contrato activo.");
      return;
    }

    if (!kilometraje || Number(kilometraje) <= 0) {
      setError("Debes ingresar el kilometraje de retorno.");
      return;
    }

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      let obsFinal = observaciones.trim();
      if (estadoDeposito === "DEDUCIDO") {
        obsFinal += ` | Depósito DEDUCIDO: $${montoDeducido} USD por motivo: ${motivoDeduccion}`;
      } else if (estadoDeposito === "RETENIDO") {
        obsFinal += ` | Depósito RETENIDO para inspección mecánica detallada.`;
      } else {
        obsFinal += ` | Depósito DEVUELTO completo al cliente.`;
      }

      const datos = {
        contratoId: Number(contratoId),
        kilometraje: Number(kilometraje),
        nivelCombustible,
        tieneDefectos: puntosDano.length > 0,
        defectosDetalle: puntosDano.map((p) => ({
          descripcion: p.descripcion,
          ubicacion: p.ubicacion,
          tipoDano: p.tipoDano,
          severidad: p.severidad,
          coordX: p.coordX,
          coordY: p.coordY,
        })),
        fotosEvidencias: fotosInspeccion.map((f) => ({
          archivoUrl: f.archivoUrl,
          nombreArchivo: f.nombreArchivo,
          descripcion: "Foto de recepción / check-in",
        })),
        observaciones: obsFinal.trim(),
      };

      const respuesta = await fetch(API_ENTREGAS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (!respuesta.ok) {
        const dataErr = await respuesta.json().catch(() => null);
        throw new Error(dataErr?.error || "No fue posible registrar la devolución.");
      }

      setMensaje("✅ Devolución, fotos e inspección 360° registradas. Vehículo liberado a DISPONIBLE.");
      setContratoId("");
      setKilometraje("");
      setPuntosDano([]);
      setFotosInspeccion([]);
      setObservaciones("");
      setMostrarFormulario(false);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al procesar devolución.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="entregas-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Recepción & Inspección Visual 360° (Check-in)</h1>
          <p>
            Registra el retorno de vehículos, odómetro final, fotos de inspección, nivel de combustible y control de depósito.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          {mostrarFormulario ? "Cerrar Formulario" : "🔑 Nueva Recepción / Check-in"}
        </button>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Formulario de Devolución con Mapa de Daños */}
      {mostrarFormulario && (
        <section className="content-panel" style={{ marginBottom: "24px" }}>
          <div className="panel-header">
            <h2>Inspección de Devolución (Check-in & Check-out)</h2>
            <button className="secondary-button" onClick={() => setMostrarFormulario(false)}>
              Cancelar
            </button>
          </div>

          <form onSubmit={procesarRecepcion} style={{ padding: "24px" }}>
            <div className="form-grid" style={{ marginBottom: "24px" }}>
              <div className="form-field" style={{ gridColumn: "span 2" }}>
                <label htmlFor="contratoSelect">Contrato Activo a Recibir *</label>
                <select
                  id="contratoSelect"
                  value={contratoId}
                  onChange={(e) => setContratoId(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Contrato Activo --</option>
                  {contratosActivos.map((c) => (
                    <option key={c.id} value={c.id}>
                      Contrato #{c.id} • {c.cliente?.nombre} {c.cliente?.apellido} — {c.vehiculo?.marca} {c.vehiculo?.modelo} ({c.vehiculo?.placa})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="kmRetorno">Kilometraje Final (Odómetro) *</label>
                <input
                  id="kmRetorno"
                  type="number"
                  placeholder="Ej. 15450"
                  value={kilometraje}
                  onChange={(e) => setKilometraje(e.target.value)}
                  required
                />
              </div>

              {/* Selector Visual de Nivel de Combustible */}
              <div className="form-field" style={{ gridColumn: "span 3" }}>
                <label>Nivel de Combustible al Recibir</label>
                <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                  {[
                    { label: "⚠️ E (Vacío / Reserva)", val: "Reserva" },
                    { label: "⛽ 1/4 Tanque", val: "25% (1/4)" },
                    { label: "⛽ 1/2 Tanque", val: "50% (Medio)" },
                    { label: "⛽ 3/4 Tanque", val: "75% (3/4)" },
                    { label: "⛽ Full (100% Lleno)", val: "100% (Lleno)" },
                  ].map((comb) => (
                    <button
                      key={comb.val}
                      type="button"
                      onClick={() => setNivelCombustible(comb.val)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: nivelCombustible === comb.val ? "2px solid var(--primary)" : "1px solid var(--border)",
                        backgroundColor: nivelCombustible === comb.val ? "var(--primary-soft)" : "var(--surface)",
                        color: nivelCombustible === comb.val ? "var(--primary)" : "var(--text)",
                        fontWeight: nivelCombustible === comb.val ? 800 : 500,
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      {comb.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECCIÓN: CONTROL DE DEPÓSITO DE GARANTÍA */}
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "18px 20px",
                backgroundColor: "var(--surface)",
                marginBottom: "24px",
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                💰 Control de Depósito de Garantía
                {contratoSeleccionadoObj && (
                  <span style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 700 }}>
                    (Depósito Original: ${Number(contratoSeleccionadoObj.deposito).toFixed(2)} USD)
                  </span>
                )}
              </h3>

              <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                <button
                  type="button"
                  onClick={() => setEstadoDeposito("DEVUELTO")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: estadoDeposito === "DEVUELTO" ? "2px solid #22c55e" : "1px solid var(--border)",
                    backgroundColor: estadoDeposito === "DEVUELTO" ? "rgba(34, 197, 94, 0.15)" : "var(--background)",
                    color: estadoDeposito === "DEVUELTO" ? "#15803d" : "var(--text)",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  ✓ Reembolsar Completo
                </button>

                <button
                  type="button"
                  onClick={() => setEstadoDeposito("DEDUCIDO")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: estadoDeposito === "DEDUCIDO" ? "2px solid #ea580c" : "1px solid var(--border)",
                    backgroundColor: estadoDeposito === "DEDUCIDO" ? "rgba(234, 88, 12, 0.15)" : "var(--background)",
                    color: estadoDeposito === "DEDUCIDO" ? "#c2410c" : "var(--text)",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  ⚠️ Deducir por Daños / Combustible
                </button>

                <button
                  type="button"
                  onClick={() => setEstadoDeposito("RETENIDO")}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: estadoDeposito === "RETENIDO" ? "2px solid #dc2626" : "1px solid var(--border)",
                    backgroundColor: estadoDeposito === "RETENIDO" ? "rgba(220, 38, 38, 0.15)" : "var(--background)",
                    color: estadoDeposito === "RETENIDO" ? "#b91c1c" : "var(--text)",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  🔒 Retener Depósito
                </button>
              </div>

              {estadoDeposito === "DEDUCIDO" && (
                <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "12px", background: "var(--background)", padding: "14px", borderRadius: "8px" }}>
                  <div className="form-field">
                    <label>Monto a Deducir ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={montoDeducido}
                      onChange={(e) => setMontoDeducido(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Motivo de la Deducción</label>
                    <input
                      type="text"
                      placeholder="Ej. Faltante de 1/2 tanque de gasolina y rayón en puerta derecha"
                      value={motivoDeduccion}
                      onChange={(e) => setMotivoDeduccion(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            {/* DIAGRAMA INTERACTIVO DE DAÑOS */}
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "20px",
                background: "var(--surface)",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <h3 style={{ margin: "0 0 2px 0", fontSize: "16px" }}>
                    🎨 Diagrama Visual de Daños & Carrocería
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Haz clic sobre la silueta del vehículo para colocar un punto en la zona con defecto.
                  </span>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <select
                    value={tipoDanoSeleccionado}
                    onChange={(e) => setTipoDanoSeleccionado(e.target.value as PuntoDano["tipoDano"])}
                    style={{ padding: "6px 10px", fontSize: "12px" }}
                  >
                    <option value="RAYON">✏️ Rayón / Rasguño</option>
                    <option value="ABOLLADURA">🔨 Abolladura</option>
                    <option value="GOLPE">💥 Golpe / Choque</option>
                    <option value="ROTURA_VIDRIO">🪟 Rotura de Cristal</option>
                    <option value="LLANTA">🛞 Llanta / Rin raspado</option>
                  </select>

                  <select
                    value={severidadSeleccionada}
                    onChange={(e) => setSeveridadSeleccionada(e.target.value as PuntoDano["severidad"])}
                    style={{ padding: "6px 10px", fontSize: "12px" }}
                  >
                    <option value="LEVE">🟢 Leve</option>
                    <option value="MEDIO">🟡 Medio</option>
                    <option value="GRAVE">🔴 Grave</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "24px", alignItems: "center" }}>
                {/* Silueta del Auto (Canvas Interactivo) */}
                <div
                  onClick={handleCarDiagramClick}
                  style={{
                    width: "260px",
                    height: "360px",
                    margin: "0 auto",
                    backgroundColor: "var(--primary-soft)",
                    borderRadius: "40px",
                    border: "3px solid #64748b",
                    position: "relative",
                    cursor: "crosshair",
                    boxShadow: "inset 0 0 20px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", fontSize: "10px", fontWeight: "bold", color: "#64748b" }}>
                    FRENTE
                  </div>
                  <div style={{ position: "absolute", top: "55px", left: "20px", right: "20px", height: "45px", background: "rgba(100, 116, 139, 0.2)", borderRadius: "10px 10px 4px 4px", border: "1px solid #94a3b8" }} />
                  <div style={{ position: "absolute", top: "110px", left: "25px", right: "25px", height: "120px", background: "rgba(100, 116, 139, 0.1)", borderRadius: "6px" }} />
                  <div style={{ position: "absolute", top: "240px", left: "20px", right: "20px", height: "45px", background: "rgba(100, 116, 139, 0.2)", borderRadius: "4px 4px 10px 10px", border: "1px solid #94a3b8" }} />
                  <div style={{ position: "absolute", bottom: "10px", left: "50%", transform: "translateX(-50%)", fontSize: "10px", fontWeight: "bold", color: "#64748b" }}>
                    TRASERA
                  </div>

                  {/* Pines de Daño Registrados */}
                  {puntosDano.map((p, idx) => (
                    <div
                      key={p.id}
                      title={p.descripcion}
                      style={{
                        position: "absolute",
                        top: `${p.coordY}%`,
                        left: `${p.coordX}%`,
                        transform: "translate(-50%, -50%)",
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        backgroundColor: p.severidad === "GRAVE" ? "#ef4444" : p.severidad === "MEDIO" ? "#f59e0b" : "#3b82f6",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "900",
                        boxShadow: "0 0 8px rgba(0,0,0,0.5)",
                        zIndex: 10,
                      }}
                    >
                      {idx + 1}
                    </div>
                  ))}
                </div>

                {/* Lista de Defectos Marcados */}
                <div>
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>
                    Puntos de Daño Registrados ({puntosDano.length})
                  </h4>

                  {puntosDano.length === 0 ? (
                    <div style={{ color: "var(--text-secondary)", fontSize: "13px", padding: "20px", background: "var(--background)", borderRadius: "8px", textAlign: "center" }}>
                      ✨ Ningún daño reportado. El vehículo está en perfectas condiciones.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
                      {puntosDano.map((p, idx) => (
                        <div
                          key={p.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 12px",
                            background: "var(--background)",
                            borderRadius: "6px",
                            border: "1px solid var(--border)",
                            fontSize: "12px",
                          }}
                        >
                          <div>
                            <strong>#{idx + 1} • {p.tipoDano}</strong> ({p.severidad}) en <i>{p.ubicacion}</i>
                          </div>
                          <button
                            type="button"
                            className="btn-action-delete"
                            style={{ padding: "2px 6px" }}
                            onClick={() => eliminarPuntoDano(p.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN: 📸 FOTOS / EVIDENCIAS DE INSPECCIÓN */}
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "20px",
                background: "var(--surface)",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ margin: "0 0 2px 0", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    📸 Fotos de Inspección & Estado del Vehículo
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Toma fotos con tu cámara o sube imágenes de la carrocería, odómetro y combustible.
                  </span>
                </div>

                <div>
                  <input
                    id="input-fotos-inspeccion"
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleSubirFotos}
                  />
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => document.getElementById("input-fotos-inspeccion")?.click()}
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    📷 Tomar / Subir Fotos ({fotosInspeccion.length})
                  </button>
                </div>
              </div>

              {fotosInspeccion.length === 0 ? (
                <div style={{ padding: "18px", textAlign: "center", color: "var(--text-secondary)", background: "var(--background)", borderRadius: "8px", fontSize: "12px" }}>
                  📷 No hay fotos adjuntas todavía. Puedes tomar fotos directas desde tu teléfono.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "12px" }}>
                  {fotosInspeccion.map((foto) => (
                    <div
                      key={foto.id}
                      style={{
                        position: "relative",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid var(--border)",
                        aspectRatio: "1",
                        background: "#000",
                      }}
                    >
                      <img
                        src={foto.archivoUrl}
                        alt="Evidencia"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      <button
                        type="button"
                        onClick={() => eliminarFoto(foto.id)}
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          background: "rgba(220, 38, 38, 0.85)",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          width: "22px",
                          height: "22px",
                          fontSize: "11px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-field" style={{ marginBottom: "24px" }}>
              <label htmlFor="obsEntrega">Observaciones Generales de Recepción</label>
              <textarea
                id="obsEntrega"
                rows={2}
                placeholder="Ej. Vehículo limpio por dentro, incluye rueda de repuesto y llave de cruz."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setMostrarFormulario(false)}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={guardando}
                style={{ minWidth: "220px" }}
              >
                {guardando ? "Procesando Check-in..." : "✓ Completar Check-in & Liberar Auto"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Listado Histórico de Entregas & Devoluciones */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>Historial de Devoluciones & Inspecciones Realizadas</h2>
          <div className="panel-actions">
            <input
              type="text"
              placeholder="Buscar por cliente, placa o ID..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ width: "260px" }}
            />
          </div>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando inspecciones...</strong>
          </div>
        ) : entregasFiltradas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚗</div>
            <strong>No hay registros de devoluciones encontrados.</strong>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha y Hora</th>
                  <th>Contrato</th>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Odómetro Final</th>
                  <th>Combustible</th>
                  <th>Daños</th>
                  <th>Fotos</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {entregasFiltradas.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <span className="badge badge-mantenimiento">REC-{e.id}</span>
                    </td>
                    <td style={{ fontSize: "12px" }}>
                      {formatearFechaHora(e.fechaHora)}
                    </td>
                    <td>
                      <strong>Contrato #{e.contratoId}</strong>
                    </td>
                    <td>
                      {e.contrato?.cliente ? (
                        <div>
                          <strong>{e.contrato.cliente.nombre} {e.contrato.cliente.apellido}</strong>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            {e.contrato.cliente.telefono}
                          </div>
                        </div>
                      ) : "Cliente Desconocido"}
                    </td>
                    <td>
                      {e.contrato?.vehiculo ? (
                        <div>
                          <strong>{e.contrato.vehiculo.marca} {e.contrato.vehiculo.modelo}</strong>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            Placa: {e.contrato.vehiculo.placa}
                          </div>
                        </div>
                      ) : "N/D"}
                    </td>
                    <td>
                      <strong>{e.kilometraje.toLocaleString()} km</strong>
                    </td>
                    <td>
                      <span className="badge badge-disponible">
                        {e.nivelCombustible || "100%"}
                      </span>
                    </td>
                    <td>
                      {e.tieneDefectos || (e.defectos && e.defectos.length > 0) ? (
                        <span className="badge badge-mantenimiento" style={{ backgroundColor: "#ef4444", color: "white" }}>
                          ⚠️ {e.defectos?.length || 1} Daños
                        </span>
                      ) : (
                        <span className="badge badge-disponible">
                          ✓ Impecable
                        </span>
                      )}
                    </td>
                    <td>
                      {e.evidencias && e.evidencias.length > 0 ? (
                        <span className="badge badge-alquilado">
                          📸 {e.evidencias.length} fotos
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Sin fotos</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-action-primary"
                        style={{ fontSize: "11px", padding: "4px 8px" }}
                        onClick={() => setEntregaVerDetalle(e)}
                      >
                        👁️ Ver Reporte
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalle de Recepción */}
      {entregaVerDetalle && (
        <div
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
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--surface)",
              borderRadius: "16px",
              maxWidth: "750px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.3)",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "14px", marginBottom: "16px" }}>
              <div>
                <h2 style={{ margin: "0 0 2px 0", fontSize: "18px" }}>
                  📋 Reporte de Inspección REC-{entregaVerDetalle.id}
                </h2>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Contrato #{entregaVerDetalle.contratoId} • Recibido el {formatearFechaHora(entregaVerDetalle.fechaHora)}
                </span>
              </div>
              <button className="secondary-button" onClick={() => setEntregaVerDetalle(null)}>
                ✕ Cerrar
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div style={{ background: "var(--background)", padding: "14px", borderRadius: "10px" }}>
                <strong style={{ fontSize: "13px", display: "block", marginBottom: "6px" }}>👤 Cliente:</strong>
                <div>{entregaVerDetalle.contrato?.cliente?.nombre} {entregaVerDetalle.contrato?.cliente?.apellido}</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Tel: {entregaVerDetalle.contrato?.cliente?.telefono}</div>
              </div>

              <div style={{ background: "var(--background)", padding: "14px", borderRadius: "10px" }}>
                <strong style={{ fontSize: "13px", display: "block", marginBottom: "6px" }}>🚗 Vehículo:</strong>
                <div>{entregaVerDetalle.contrato?.vehiculo?.marca} {entregaVerDetalle.contrato?.vehiculo?.modelo}</div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Placa: {entregaVerDetalle.contrato?.vehiculo?.placa} • Odómetro Final: {entregaVerDetalle.kilometraje.toLocaleString()} km
                </div>
              </div>
            </div>

            {/* Daños Registrados */}
            <div style={{ marginBottom: "20px" }}>
              <strong style={{ fontSize: "14px", display: "block", marginBottom: "8px" }}>
                🎨 Mapa de Daños Reportados ({entregaVerDetalle.defectos?.length || 0})
              </strong>
              {entregaVerDetalle.defectos && entregaVerDetalle.defectos.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {entregaVerDetalle.defectos.map((def, idx) => (
                    <div
                      key={def.id || idx}
                      style={{
                        padding: "10px 14px",
                        background: "var(--background)",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        fontSize: "12px",
                      }}
                    >
                      <strong>#{idx + 1} • {def.tipoDano || "DEFECTO"} ({def.severidad || "LEVE"})</strong> en <i>{def.ubicacion || "Carrocería"}</i>
                      <div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                        {def.descripcion}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "12px", background: "var(--background)", borderRadius: "8px", fontSize: "12px", color: "var(--success)" }}>
                  ✓ Vehículo devuelto sin daños reportados.
                </div>
              )}
            </div>

            {/* Galería de Fotos de Evidencia */}
            {entregaVerDetalle.evidencias && entregaVerDetalle.evidencias.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <strong style={{ fontSize: "14px", display: "block", marginBottom: "8px" }}>
                  📸 Fotos de Inspección ({entregaVerDetalle.evidencias.length})
                </strong>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" }}>
                  {entregaVerDetalle.evidencias.map((ev, idx) => (
                    <a
                      key={ev.id || idx}
                      href={ev.archivoUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid var(--border)",
                        aspectRatio: "1",
                        display: "block",
                      }}
                    >
                      <img
                        src={ev.archivoUrl}
                        alt="Evidencia"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Observaciones */}
            {entregaVerDetalle.observaciones && (
              <div style={{ padding: "12px 14px", background: "var(--primary-soft)", borderRadius: "8px", fontSize: "12px", color: "var(--text)" }}>
                <strong>Observaciones de Recepción:</strong> {entregaVerDetalle.observaciones}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}