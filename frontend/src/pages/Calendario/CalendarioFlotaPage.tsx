/**
 * ============================================================================
 * RentOS - Calendario Interactivo y Diagrama de Gantt de Flota (CalendarioFlotaPage)
 * ============================================================================
 * Visualización cronológica de alquileres y reservas:
 * - Vista Gantt por días de la semana y meses con barras de tiempo codificadas por color.
 * - Detección visual de solapamientos, días de retorno y disponibilidad futura.
 * - Accesos directos para extender o consultar contratos desde la línea de tiempo.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_URLS } from "../../services/api";
import { formatearFecha } from "../../utils/dateUtils";

type Vehiculo = {
  id: number;
  rentCarId: number;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  color: string | null;
  tarifaDiaria: string | number;
  estado: "DISPONIBLE" | "ALQUILADO" | "MANTENIMIENTO" | "INACTIVO";
};

type Contrato = {
  id: number;
  rentCarId: number;
  clienteId: number;
  vehiculoId: number;
  fechaInicio: string;
  fechaFin: string;
  estado: "BORRADOR" | "ACTIVO" | "FINALIZADO" | "CANCELADO";
  cliente?: {
    nombre: string;
    apellido: string;
    telefono: string;
  };
  vehiculo?: Vehiculo;
};

const NOMBRES_MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function CalendarioFlotaPage() {
  const { tenantActivoId } = useAuth();
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const hoy = new Date();
  const [mesActual, setMesActual] = useState(hoy.getMonth());
  const [anioActual, setAnioActual] = useState(hoy.getFullYear());
  const [filtroBusqueda, setFiltroBusqueda] = useState("");

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [resVehiculos, resContratos] = await Promise.all([
        fetch(API_URLS.vehiculos),
        fetch(API_URLS.contratos),
      ]);

      if (!resVehiculos.ok || !resContratos.ok) {
        throw new Error("No fue posible cargar la información de flota y contratos.");
      }

      const [datosVehiculos, datosContratos] = await Promise.all([
        resVehiculos.json(),
        resContratos.json(),
      ]);

      const targetTenant = tenantActivoId || 1;
      const vehiculosFiltrados = datosVehiculos.filter(
        (v: Vehiculo) => !v.rentCarId || v.rentCarId === targetTenant
      );
      const contratosFiltrados = datosContratos.filter(
        (c: Contrato) => (!c.rentCarId || c.rentCarId === targetTenant) && c.estado !== "CANCELADO"
      );

      setVehiculos(vehiculosFiltrados);
      setContratos(contratosFiltrados);
    } catch (err) {
      console.error(err);
      setError("Error al conectar con el servidor para obtener el calendario.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantActivoId]);

  // Días del mes seleccionado
  const diasDelMes = useMemo(() => {
    const totalDias = new Date(anioActual, mesActual + 1, 0).getDate();
    return Array.from({ length: totalDias }, (_, i) => i + 1);
  }, [mesActual, anioActual]);

  const navegarMes = (direccion: number) => {
    let nuevoMes = mesActual + direccion;
    let nuevoAnio = anioActual;

    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio -= 1;
    } else if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio += 1;
    }

    setMesActual(nuevoMes);
    setAnioActual(nuevoAnio);
  };

  const irAlMesActual = () => {
    setMesActual(hoy.getMonth());
    setAnioActual(hoy.getFullYear());
  };

  // Filtrar vehículos por búsqueda
  const vehiculosVisibles = useMemo(() => {
    if (!filtroBusqueda.trim()) return vehiculos;
    const q = filtroBusqueda.toLowerCase();
    return vehiculos.filter(
      (v) =>
        v.marca.toLowerCase().includes(q) ||
        v.modelo.toLowerCase().includes(q) ||
        v.placa.toLowerCase().includes(q)
    );
  }, [vehiculos, filtroBusqueda]);

  // Verificar si un vehículo tiene contrato en una fecha específica
  const obtenerEstadoVehiculoEnDia = (vehiculoId: number, dia: number) => {
    const fechaEvaluada = new Date(anioActual, mesActual, dia, 12, 0, 0);

    for (const c of contratos) {
      if (c.vehiculoId === vehiculoId) {
        const inicio = new Date(c.fechaInicio);
        const fin = new Date(c.fechaFin);

        inicio.setHours(0, 0, 0, 0);
        fin.setHours(23, 59, 59, 999);

        if (fechaEvaluada >= inicio && fechaEvaluada <= fin) {
          return {
            ocupado: true,
            tipo: c.estado === "ACTIVO" ? "ALQUILADO" : "RESERVADO",
            contrato: c,
          };
        }
      }
    }

    return { ocupado: false, tipo: "DISPONIBLE", contrato: null };
  };

  // Cálculo de tasa de ocupación del mes
  const estadisticasMes = useMemo(() => {
    if (vehiculos.length === 0 || diasDelMes.length === 0) {
      return { totalDiasAuto: 0, diasOcupados: 0, porcentajeOcupacion: 0 };
    }

    const totalDiasAuto = vehiculos.length * diasDelMes.length;
    let diasOcupados = 0;

    vehiculos.forEach((v) => {
      diasDelMes.forEach((d) => {
        const st = obtenerEstadoVehiculoEnDia(v.id, d);
        if (st.ocupado) diasOcupados++;
      });
    });

    const porcentajeOcupacion = totalDiasAuto > 0 ? Math.round((diasOcupados / totalDiasAuto) * 100) : 0;
    return { totalDiasAuto, diasOcupados, porcentajeOcupacion };
  }, [vehiculos, contratos, diasDelMes, mesActual, anioActual]);

  return (
    <div className="calendario-container">
      {/* Encabezado */}
      <div className="page-heading">
        <div>
          <h1>📅 Calendario Visual de Flota & Disponibilidad</h1>
          <p>
            Vista Timeline interactiva para planificar alquileres, prever retornos y evitar sobreventas (overbooking).
          </p>
        </div>

        {/* Controles de Navegación de Mes */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="secondary-button" onClick={() => navegarMes(-1)}>
            ◀ Mes Anterior
          </button>
          <button
            className="secondary-button"
            onClick={irAlMesActual}
            style={{ fontWeight: 700 }}
          >
            Hoy: {NOMBRES_MESES[mesActual]} {anioActual}
          </button>
          <button className="secondary-button" onClick={() => navegarMes(1)}>
            Mes Siguiente ▶
          </button>
        </div>
      </div>

      {error && <div className="alert-box error">{error}</div>}

      {/* Tarjetas de Métricas de Ocupación del Mes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="metric-card" style={{ borderLeft: "4px solid var(--primary)" }}>
          <div className="metric-title">Tasa de Ocupación Mensual</div>
          <div className="metric-value" style={{ color: "var(--primary)" }}>
            {estadisticasMes.porcentajeOcupacion}%
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {estadisticasMes.diasOcupados} de {estadisticasMes.totalDiasAuto} días-auto ocupados
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid #22c55e" }}>
          <div className="metric-title">Flota Total Activa</div>
          <div className="metric-value" style={{ color: "#15803d" }}>
            {vehiculos.length} vehículos
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Disponibles para renta inmediata
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div className="metric-title">Contratos en {NOMBRES_MESES[mesActual]}</div>
          <div className="metric-value" style={{ color: "#7c3aed" }}>
            {contratos.length}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Alquileres y reservas programadas
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Leyenda */}
      <div
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            type="text"
            placeholder="🔍 Buscar por marca, modelo o placa..."
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            style={{ width: "280px" }}
          />
        </div>

        {/* Leyenda de Estados */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#3b82f6", display: "inline-block" }} />
            <strong>Alquilado (En uso)</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#f59e0b", display: "inline-block" }} />
            <strong>Reserva Futura</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "var(--background)", border: "1px solid var(--border)", display: "inline-block" }} />
            <span style={{ color: "var(--text-secondary)" }}>Disponible</span>
          </div>
        </div>
      </div>

      {/* TABLA TIMELINE / GANTT INTERACTIVA */}
      <div className="content-panel" style={{ padding: 0, overflow: "hidden" }}>
        {cargando ? (
          <div className="empty-state" style={{ padding: "40px" }}>
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando calendario de disponibilidad...</strong>
          </div>
        ) : vehiculosVisibles.length === 0 ? (
          <div className="empty-state" style={{ padding: "40px" }}>
            <div className="empty-state-icon">🚗</div>
            <strong>No se encontraron vehículos que coincidan con la búsqueda.</strong>
          </div>
        ) : (
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
                minWidth: `${180 + diasDelMes.length * 36}px`,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "var(--primary-soft)", borderBottom: "2px solid var(--border)" }}>
                  <th
                    style={{
                      position: "sticky",
                      left: 0,
                      backgroundColor: "var(--surface)",
                      zIndex: 5,
                      padding: "12px 16px",
                      textAlign: "left",
                      minWidth: "200px",
                      borderRight: "2px solid var(--border)",
                    }}
                  >
                    Vehículo
                  </th>

                  {diasDelMes.map((dia) => {
                    const fechaCol = new Date(anioActual, mesActual, dia);
                    const diaSemanaNombre = DIAS_SEMANA[fechaCol.getDay()];
                    const esFinDeSemana = fechaCol.getDay() === 0 || fechaCol.getDay() === 6;
                    const esHoy =
                      dia === hoy.getDate() &&
                      mesActual === hoy.getMonth() &&
                      anioActual === hoy.getFullYear();

                    return (
                      <th
                        key={dia}
                        style={{
                          padding: "8px 4px",
                          textAlign: "center",
                          minWidth: "34px",
                          backgroundColor: esHoy ? "var(--primary)" : esFinDeSemana ? "rgba(0,0,0,0.03)" : "transparent",
                          color: esHoy ? "white" : "var(--text)",
                          borderRight: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ fontSize: "9px", textTransform: "uppercase", opacity: esHoy ? 1 : 0.7 }}>
                          {diaSemanaNombre}
                        </div>
                        <div style={{ fontSize: "13px", fontWeight: 800 }}>{dia}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {vehiculosVisibles.map((v) => (
                  <tr key={v.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    {/* Columna Fija: Datos del Vehículo */}
                    <td
                      style={{
                        position: "sticky",
                        left: 0,
                        backgroundColor: "var(--surface)",
                        zIndex: 4,
                        padding: "10px 16px",
                        borderRight: "2px solid var(--border)",
                        boxShadow: "2px 0 5px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: "13px" }}>
                        {v.marca} {v.modelo}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                        Placa: <b>{v.placa}</b> • ${Number(v.tarifaDiaria).toFixed(0)}/día
                      </div>
                    </td>

                    {/* Celdas de los Días */}
                    {diasDelMes.map((dia) => {
                      const st = obtenerEstadoVehiculoEnDia(v.id, dia);
                      const fechaCol = new Date(anioActual, mesActual, dia);
                      const esFinDeSemana = fechaCol.getDay() === 0 || fechaCol.getDay() === 6;
                      const esHoy =
                        dia === hoy.getDate() &&
                        mesActual === hoy.getMonth() &&
                        anioActual === hoy.getFullYear();

                      return (
                        <td
                          key={dia}
                          style={{
                            padding: "4px 2px",
                            textAlign: "center",
                            borderRight: "1px solid var(--border)",
                            backgroundColor: esHoy
                              ? "var(--primary-soft)"
                              : esFinDeSemana
                              ? "rgba(0,0,0,0.015)"
                              : "transparent",
                            verticalAlign: "middle",
                          }}
                        >
                          {st.ocupado ? (
                            <Link
                              to="/contratos"
                              title={`Contrato #${st.contrato?.id} • Cliente: ${st.contrato?.cliente?.nombre} ${st.contrato?.cliente?.apellido} (Hasta ${formatearFecha(st.contrato?.fechaFin)})`}
                              style={{
                                display: "block",
                                height: "28px",
                                borderRadius: "4px",
                                backgroundColor: st.tipo === "ALQUILADO" ? "#3b82f6" : "#f59e0b",
                                color: "white",
                                fontSize: "10px",
                                fontWeight: 700,
                                textDecoration: "none",
                                lineHeight: "28px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                padding: "0 4px",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                              }}
                            >
                              CT-{st.contrato?.id}
                            </Link>
                          ) : (
                            <div
                              style={{
                                height: "28px",
                                borderRadius: "4px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--text-secondary)",
                                fontSize: "10px",
                                opacity: 0.3,
                              }}
                            >
                              •
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
