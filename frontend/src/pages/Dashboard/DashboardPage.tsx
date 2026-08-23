import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_URLS } from "../../services/api";

type Vehiculo = {
  id: number;
  rentCarId?: number;
  marca: string;
  modelo: string;
  placa: string;
  tarifaDiaria: number | string;
  estado: "DISPONIBLE" | "ALQUILADO" | "MANTENIMIENTO" | "INACTIVO";
};

type Cliente = {
  id: number;
  rentCarId?: number;
  nombre: string;
  apellido: string;
  telefono: string;
  estado: string;
};

type Contrato = {
  id: number;
  rentCarId?: number;
  fechaInicio: string;
  fechaFin: string;
  tarifaDiaria: number | string;
  deposito: number | string;
  estado: "BORRADOR" | "ACTIVO" | "FINALIZADO" | "CANCELADO";
  clienteId: number;
  vehiculoId: number;
  cliente?: {
    nombre: string;
    apellido: string;
  };
  vehiculo?: {
    marca: string;
    modelo: string;
    placa: string;
  };
};

type Pago = {
  id: number;
  contratoId: number;
  monto: number | string;
  fecha: string;
  tipo: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "PAYPAL" | "OTRO";
  estado: "PAGADO" | "PENDIENTE" | "ANULADO";
  contrato?: {
    rentCarId?: number;
    cliente?: {
      nombre: string;
      apellido: string;
    };
    vehiculo?: {
      marca: string;
      modelo: string;
      placa: string;
    };
  };
};

export default function DashboardPage() {
  const { tenantActivoId } = useAuth();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarDashboard() {
      try {
        setCargando(true);
        setError("");

        const [resVehiculos, resClientes, resContratos, resPagos] =
          await Promise.all([
            fetch(API_URLS.vehiculos),
            fetch(API_URLS.clientes),
            fetch(API_URLS.contratos),
            fetch(API_URLS.pagos),
          ]);

        const [datosVehiculos, datosClientes, datosContratos, datosPagos] =
          await Promise.all([
            resVehiculos.ok ? resVehiculos.json() : [],
            resClientes.ok ? resClientes.json() : [],
            resContratos.ok ? resContratos.json() : [],
            resPagos.ok ? resPagos.json() : [],
          ]);

        const targetTenant = tenantActivoId || 1;

        setVehiculos(
          datosVehiculos.filter((v: Vehiculo) => !v.rentCarId || v.rentCarId === targetTenant)
        );
        setClientes(
          datosClientes.filter((c: Cliente) => !c.rentCarId || c.rentCarId === targetTenant)
        );
        setContratos(
          datosContratos.filter((c: Contrato) => !c.rentCarId || c.rentCarId === targetTenant)
        );
        setPagos(
          datosPagos.filter((p: Pago) => !p.contrato?.rentCarId || p.contrato?.rentCarId === targetTenant)
        );
      } catch (err) {
        console.error("Error al cargar el dashboard:", err);
        setError("No fue posible cargar las métricas del dashboard.");
      } finally {
        setCargando(false);
      }
    }

    cargarDashboard();
  }, [tenantActivoId]);

  const stats = useMemo(() => {
    const totalVehiculos = vehiculos.length;
    const disponibles = vehiculos.filter((v) => v.estado === "DISPONIBLE").length;
    const alquilados = vehiculos.filter((v) => v.estado === "ALQUILADO").length;
    const mantenimiento = vehiculos.filter((v) => v.estado === "MANTENIMIENTO").length;

    const pagosCompletados = pagos.filter((p) => p.estado === "PAGADO");
    const totalIngresos = pagosCompletados.reduce((sum, p) => sum + Number(p.monto), 0);

    const tasaOcupacion = totalVehiculos > 0 ? Math.round((alquilados / totalVehiculos) * 100) : 0;
    const rentasActivas = contratos.filter((c) => c.estado === "ACTIVO").length;
    const totalClientes = clientes.length;

    // Cierre de caja por método de pago
    const desgloseMetodos: Record<string, number> = {
      EFECTIVO: 0,
      TARJETA: 0,
      TRANSFERENCIA: 0,
      OTROS: 0,
    };

    pagosCompletados.forEach((p) => {
      const tipo = p.tipo?.toUpperCase() || "OTROS";
      if (desgloseMetodos[tipo] !== undefined) {
        desgloseMetodos[tipo] += Number(p.monto);
      } else {
        desgloseMetodos["OTROS"] += Number(p.monto);
      }
    });

    // Ranking de vehículos más rentables
    const rentabilidadVehiculos: Record<number, { auto: Vehiculo; totalIngresos: number; totalRentas: number }> = {};

    vehiculos.forEach((v) => {
      rentabilidadVehiculos[v.id] = { auto: v, totalIngresos: 0, totalRentas: 0 };
    });

    contratos.forEach((c) => {
      if (rentabilidadVehiculos[c.vehiculoId]) {
        rentabilidadVehiculos[c.vehiculoId].totalRentas += 1;
        const dias = Math.max(1, Math.ceil((new Date(c.fechaFin).getTime() - new Date(c.fechaInicio).getTime()) / (1000 * 60 * 60 * 24)));
        rentabilidadVehiculos[c.vehiculoId].totalIngresos += dias * Number(c.tarifaDiaria);
      }
    });

    const rankingAutos = Object.values(rentabilidadVehiculos)
      .sort((a, b) => b.totalIngresos - a.totalIngresos)
      .slice(0, 5);

    return {
      totalVehiculos,
      disponibles,
      alquilados,
      mantenimiento,
      tasaOcupacion,
      totalIngresos: totalIngresos.toFixed(2),
      rentasActivas,
      totalClientes,
      desgloseMetodos,
      rankingAutos,
    };
  }, [vehiculos, clientes, contratos, pagos]);

  return (
    <div className="dashboard-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>📊 Panel de Control Financiero & Operativo</h1>
          <p>Métricas en tiempo real, tasa de ocupación de flota, cierre de caja y rentabilidad de vehículos.</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/calendario" className="secondary-button" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            📅 Calendario de Flota
          </Link>
          <Link to="/contratos" className="primary-button">
            + Emitir Contrato
          </Link>
        </div>
      </div>

      {error && <div className="alert-box error">{error}</div>}

      {/* Tarjetas Principales de KPI */}
      <div className="dashboard-metrics" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div className="metric-card">
          <div className="metric-title">Ingresos Totales Registrados</div>
          <div className="metric-value" style={{ color: "#15803d" }}>
            ${Number(stats.totalIngresos).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Total acumulado en caja
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Tasa de Ocupación de Flota</div>
          <div className="metric-value" style={{ color: "var(--primary)" }}>
            {stats.tasaOcupacion}%
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {stats.alquilados} de {stats.totalVehiculos} autos en renta hoy
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Alquileres Activos</div>
          <div className="metric-value" style={{ color: "#7c3aed" }}>
            {stats.rentasActivas}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Contratos vigentes en carretera
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-title">Flota Disponible para Renta</div>
          <div className="metric-value" style={{ color: "#0284c7" }}>
            {stats.disponibles} autos
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Listos para entrega inmediata
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="content-panel" style={{ padding: "40px" }}>
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Calculando analíticas financieras...</strong>
          </div>
        </div>
      ) : (
        <>
          {/* SECCIÓN DE GRÁFICOS Y ANÁLISIS FINANCIERO */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px", marginBottom: "24px" }}>
            {/* Gráfico 1: Ocupación de Flota (Visual Gauge / Donut) */}
            <div className="content-panel" style={{ margin: 0 }}>
              <div className="panel-header">
                <h2>🚗 Distribución de Estado de Flota</h2>
              </div>
              <div style={{ padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: "20px" }}>
                {/* Visual Circle Gauge */}
                <div style={{ position: "relative", width: "150px", height: "150px" }}>
                  <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                    {/* Fondo */}
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth="3.8"
                    />
                    {/* Alquilados */}
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="var(--primary)"
                      strokeWidth="3.8"
                      strokeDasharray={`${stats.tasaOcupacion}, 100`}
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "24px", fontWeight: 900, color: "var(--text)", display: "block" }}>
                      {stats.tasaOcupacion}%
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--text-secondary)", textTransform: "uppercase" }}>
                      Ocupación
                    </span>
                  </div>
                </div>

                {/* Leyenda y Conteo */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: "160px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--primary)" }} />
                      Alquilados:
                    </span>
                    <strong>{stats.alquilados}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#22c55e" }} />
                      Disponibles:
                    </span>
                    <strong>{stats.disponibles}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
                      Mantenimiento:
                    </span>
                    <strong>{stats.mantenimiento}</strong>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Total Parque:</span>
                    <strong>{stats.totalVehiculos} autos</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico 2: Cierre de Caja por Método de Pago */}
            <div className="content-panel" style={{ margin: 0 }}>
              <div className="panel-header">
                <h2>💳 Cierre de Caja por Forma de Pago</h2>
              </div>
              <div style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {[
                    { label: "💵 Efectivo", val: stats.desgloseMetodos.EFECTIVO, color: "#16a34a" },
                    { label: "💳 Tarjeta de Crédito / Débito", val: stats.desgloseMetodos.TARJETA, color: "#0284c7" },
                    { label: "🏦 Transferencia Bancaria", val: stats.desgloseMetodos.TRANSFERENCIA, color: "#7c3aed" },
                    { label: "🌐 Otros / PayPal", val: stats.desgloseMetodos.OTROS, color: "#ea580c" },
                  ].map((m) => {
                    const total = Number(stats.totalIngresos) || 1;
                    const pct = Math.round((m.val / total) * 100);
                    return (
                      <div key={m.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                          <span>{m.label}</span>
                          <strong>${m.val.toLocaleString("en-US", { minimumFractionDigits: 2 })} ({pct}%)</strong>
                        </div>
                        <div style={{ width: "100%", height: "8px", backgroundColor: "var(--background)", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              backgroundColor: m.color,
                              borderRadius: "4px",
                              transition: "width 0.5s ease-out",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Ranking de Vehículos Más Rentables */}
          <div className="content-panel" style={{ marginBottom: "24px" }}>
            <div className="panel-header">
              <h2>🏆 Top 5 Vehículos Más Rentables</h2>
              <Link to="/vehiculos" className="secondary-button" style={{ fontSize: "12px" }}>
                Ver Flota Completa ↗
              </Link>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ranking</th>
                    <th>Vehículo</th>
                    <th>Placa</th>
                    <th>Tarifa Diaria</th>
                    <th>Veces Alquilado</th>
                    <th>Ingresos Estimados</th>
                    <th>Estado Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.rankingAutos.map((item, idx) => (
                    <tr key={item.auto.id}>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: idx === 0 ? "#f59e0b" : idx === 1 ? "#94a3b8" : idx === 2 ? "#d97706" : "var(--background)",
                            color: idx < 3 ? "white" : "var(--text)",
                            fontWeight: 900,
                            fontSize: "12px",
                          }}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td>
                        <strong>{item.auto.marca} {item.auto.modelo}</strong>
                      </td>
                      <td>
                        <code>{item.auto.placa}</code>
                      </td>
                      <td>${Number(item.auto.tarifaDiaria).toFixed(0)} USD/día</td>
                      <td>
                        <strong>{item.totalRentas}</strong> contratos
                      </td>
                      <td>
                        <strong style={{ color: "#15803d", fontSize: "14px" }}>
                          ${item.totalIngresos.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            item.auto.estado === "ALQUILADO"
                              ? "badge-alquilado"
                              : item.auto.estado === "DISPONIBLE"
                              ? "badge-disponible"
                              : "badge-mantenimiento"
                          }`}
                        >
                          {item.auto.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Últimos Alquileres Registrados */}
          <div className="content-panel">
            <div className="panel-header">
              <h2>📄 Contratos y Alquileres Recientes</h2>
              <Link to="/contratos" className="secondary-button" style={{ fontSize: "12px" }}>
                Ver Todos los Contratos ↗
              </Link>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Vehículo</th>
                    <th>Fecha Inicio</th>
                    <th>Fecha Fin</th>
                    <th>Tarifa</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.slice(0, 5).map((c) => (
                    <tr key={c.id}>
                      <td>
                        <span className="badge badge-mantenimiento">CT-{String(c.id).padStart(5, "0")}</span>
                      </td>
                      <td>
                        <strong>{c.cliente?.nombre} {c.cliente?.apellido}</strong>
                      </td>
                      <td>
                        {c.vehiculo?.marca} {c.vehiculo?.modelo} ({c.vehiculo?.placa})
                      </td>
                      <td>{new Date(c.fechaInicio).toLocaleDateString("es-DO")}</td>
                      <td>{new Date(c.fechaFin).toLocaleDateString("es-DO")}</td>
                      <td>${Number(c.tarifaDiaria).toFixed(2)}</td>
                      <td>
                        <span
                          className={`badge ${
                            c.estado === "ACTIVO"
                              ? "badge-alquilado"
                              : c.estado === "FINALIZADO"
                              ? "badge-disponible"
                              : "badge-mantenimiento"
                          }`}
                        >
                          {c.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}