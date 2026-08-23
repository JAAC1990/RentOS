import { useEffect, useMemo, useState } from "react";
import { API_URLS } from "../../services/api";

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
  fechaInicio: string;
  fechaFin: string;
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

export default function EntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [contratosActivos, setContratosActivos] = useState<Contrato[]>([]);

  const [contratoId, setContratoId] = useState("");
  const [kilometraje, setKilometraje] = useState("");
  const [nivelCombustible, setNivelCombustible] = useState("100% (Lleno)");
  const [observaciones, setObservaciones] = useState("");

  // Pines de daños interactivos
  const [puntosDano, setPuntosDano] = useState<PuntoDano[]>([]);
  const [tipoDanoSeleccionado, setTipoDanoSeleccionado] = useState<PuntoDano["tipoDano"]>("RAYON");
  const [severidadSeleccionada, setSeveridadSeleccionada] = useState<PuntoDano["severidad"]>("LEVE");

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

      const [resEntregas, resContratos] = await Promise.all([
        fetch(API_ENTREGAS),
        fetch(API_URLS.contratos),
      ]);

      if (!resEntregas.ok || !resContratos.ok) {
        throw new Error("No fue posible obtener los registros de entregas e inspección.");
      }

      const [datosEntregas, datosContratos] = await Promise.all([
        resEntregas.json(),
        resContratos.json(),
      ]);

      setEntregas(datosEntregas);
      setContratosActivos(datosContratos.filter((c: Contrato) => c.estado === "ACTIVO"));
    } catch (err) {
      console.error(err);
      setError("Error al conectar con el servidor para cargar entregas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

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
        observaciones: observaciones.trim() || undefined,
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

      setMensaje("✅ Devolución e inspección visual registradas. Vehículo liberado a DISPONIBLE.");
      setContratoId("");
      setKilometraje("");
      setPuntosDano([]);
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
          <h1>Recepción & Inspección Visual 360°</h1>
          <p>
            Registra el retorno de unidades, odómetro final, nivel de combustible y mapa interactivo de
            daños.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          {mostrarFormulario ? "Cerrar Inspección" : "🔑 Nueva Recepción / Check-in"}
        </button>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Formulario de Devolución con Mapa de Daños */}
      {mostrarFormulario && (
        <section className="content-panel" style={{ marginBottom: "24px" }}>
          <div className="panel-header">
            <h2>Inspección de Devolución (Check-in)</h2>
            <button className="secondary-button" onClick={() => setMostrarFormulario(false)}>
              Cancelar
            </button>
          </div>

          <form onSubmit={procesarRecepcion} style={{ padding: "20px" }}>
            <div className="form-grid" style={{ marginBottom: "20px" }}>
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

              <div className="form-field">
                <label htmlFor="combustibleSelect">Nivel de Combustible *</label>
                <select
                  id="combustibleSelect"
                  value={nivelCombustible}
                  onChange={(e) => setNivelCombustible(e.target.value)}
                  required
                >
                  <option value="100% (Lleno)">⛽ 100% (Tanque Lleno)</option>
                  <option value="75% (3/4)">⛽ 75% (3/4 Tanque)</option>
                  <option value="50% (Medio)">⛽ 50% (Medio Tanque)</option>
                  <option value="25% (1/4)">⛽ 25% (1/4 Tanque)</option>
                  <option value="Reserva">⚠️ Reserva (Vacío)</option>
                </select>
              </div>
            </div>

            {/* DIAGRAMA INTERACTIVO DE DAÑOS */}
            <div
              style={{
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "20px",
                background: "var(--surface)",
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <h3 style={{ margin: "0 0 2px 0", fontSize: "16px" }}>
                    🎨 Diagrama Visual de Daños & Carrocería
                  </h3>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Haz clic sobre la silueta del vehículo para colocar un punto rojo en la zona con defecto.
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

              <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px", alignItems: "center" }}>
                {/* Silueta del Auto (Canvas Interactivo) */}
                <div
                  onClick={handleCarDiagramClick}
                  style={{
                    width: "280px",
                    height: "380px",
                    margin: "0 auto",
                    backgroundColor: "var(--primary-soft)",
                    borderRadius: "40px",
                    border: "3px solid #64748b",
                    position: "relative",
                    cursor: "crosshair",
                    boxShadow: "inset 0 0 20px rgba(0,0,0,0.05)",
                  }}
                >
                  {/* Detalles visuales del auto */}
                  <div style={{ position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)", fontSize: "10px", fontWeight: "bold", color: "#64748b" }}>
                    FRENTE
                  </div>
                  {/* Parabrisas delantero */}
                  <div style={{ position: "absolute", top: "60px", left: "20px", right: "20px", height: "45px", background: "rgba(100, 116, 139, 0.2)", borderRadius: "10px 10px 4px 4px", border: "1px solid #94a3b8" }} />
                  {/* Techo */}
                  <div style={{ position: "absolute", top: "115px", left: "25px", right: "25px", height: "130px", background: "rgba(100, 116, 139, 0.1)", borderRadius: "6px" }} />
                  {/* Luneta trasera */}
                  <div style={{ position: "absolute", top: "255px", left: "20px", right: "20px", height: "45px", background: "rgba(100, 116, 139, 0.2)", borderRadius: "4px 4px 10px 10px", border: "1px solid #94a3b8" }} />
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
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: p.severidad === "GRAVE" ? "#ef4444" : p.severidad === "MEDIO" ? "#f59e0b" : "#3b82f6",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
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
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
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

            <div className="form-field" style={{ marginBottom: "20px" }}>
              <label htmlFor="obsEntrega">Observaciones de Inspección</label>
              <textarea
                id="obsEntrega"
                rows={2}
                placeholder="Ej. Vehículo limpio por dentro, incluye rueda de repuesto y llave de cruz."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  boxSizing: "border-box",
                }}
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
              <button type="submit" className="primary-button" disabled={guardando}>
                {guardando ? "Procesando Devolución..." : "🏁 Confirmar Recepción y Liberar Auto"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Historial de Inspecciones */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>
            Historial de Inspecciones & Entregas{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "13px" }}>
              ({entregasFiltradas.length} registros)
            </span>
          </h2>

          <div style={{ width: "260px" }}>
            <input
              type="text"
              placeholder="Buscar por cliente, contrato o placa..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                fontSize: "13px",
                boxSizing: "border-box",
              }}
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
            <div className="empty-state-icon">🔑</div>
            <strong>No hay registros de devoluciones</strong>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha & Hora</th>
                  <th>Contrato / Cliente</th>
                  <th>Vehículo</th>
                  <th>Km Retorno</th>
                  <th>Combustible</th>
                  <th>Inspección Visual</th>
                  <th style={{ textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {entregasFiltradas.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>#INS-{e.id}</strong>
                    </td>
                    <td>
                      {new Date(e.fechaHora).toLocaleDateString("es-DO")}{" "}
                      <small style={{ color: "var(--text-secondary)" }}>
                        {new Date(e.fechaHora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </small>
                    </td>
                    <td>
                      <strong>Contrato #{e.contratoId}</strong>
                      <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                        {e.contrato?.cliente?.nombre} {e.contrato?.cliente?.apellido}
                      </div>
                    </td>
                    <td>
                      <strong>{e.contrato?.vehiculo?.marca} {e.contrato?.vehiculo?.modelo}</strong>
                      <div><code>{e.contrato?.vehiculo?.placa}</code></div>
                    </td>
                    <td>
                      <strong>{e.kilometraje?.toLocaleString()} km</strong>
                    </td>
                    <td>
                      <span className="badge badge-disponible">{e.nivelCombustible || "100%"}</span>
                    </td>
                    <td>
                      {e.defectos && e.defectos.length > 0 ? (
                        <span className="badge badge-mantenimiento">
                          ⚠️ {e.defectos.length} daño(s)
                        </span>
                      ) : (
                        <span className="badge badge-disponible">✓ Sin daños</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn-action-edit"
                        style={{ background: "#f1f5f9", color: "#334155" }}
                        onClick={() => setEntregaVerDetalle(e)}
                      >
                        👁️ Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Ficha de Inspección Detallada */}
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
              borderRadius: "14px",
              maxWidth: "550px",
              width: "100%",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, fontSize: "18px" }}>
                📋 Ficha de Inspección #INS-{entregaVerDetalle.id}
              </h2>
              <button
                className="secondary-button"
                style={{ padding: "4px 8px" }}
                onClick={() => setEntregaVerDetalle(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "14px", background: "var(--primary-soft)", borderRadius: "8px", marginBottom: "16px", fontSize: "13px", lineHeight: "1.7" }}>
              <div>🚗 <b>Vehículo:</b> {entregaVerDetalle.contrato?.vehiculo?.marca} {entregaVerDetalle.contrato?.vehiculo?.modelo} (<code>{entregaVerDetalle.contrato?.vehiculo?.placa}</code>)</div>
              <div>👤 <b>Cliente:</b> {entregaVerDetalle.contrato?.cliente?.nombre} {entregaVerDetalle.contrato?.cliente?.apellido}</div>
              <div>🛣️ <b>Odómetro de Recepción:</b> {entregaVerDetalle.kilometraje?.toLocaleString()} km</div>
              <div>⛽ <b>Nivel Combustible:</b> {entregaVerDetalle.nivelCombustible}</div>
              {entregaVerDetalle.observaciones && <div>📝 <b>Notas:</b> {entregaVerDetalle.observaciones}</div>}
            </div>

            <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
              Reporte de Daños ({entregaVerDetalle.defectos?.length || 0})
            </h4>

            {(!entregaVerDetalle.defectos || entregaVerDetalle.defectos.length === 0) ? (
              <div style={{ color: "var(--success)", fontSize: "13px", padding: "12px", background: "var(--success-soft)", borderRadius: "6px" }}>
                ✓ Vehículo entregado sin daños ni abolladuras.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "200px", overflowY: "auto" }}>
                {entregaVerDetalle.defectos.map((d, idx) => (
                  <div
                    key={d.id || idx}
                    style={{
                      padding: "8px 12px",
                      background: "var(--background)",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      fontSize: "12px",
                    }}
                  >
                    <strong>#{idx + 1} • {d.tipoDano || "DEFECTO"} ({d.severidad || "LEVE"})</strong>: {d.descripcion}
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      Ubicación: {d.ubicacion || "Carrocería"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                type="button"
                className="primary-button"
                onClick={() => setEntregaVerDetalle(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}