import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_URLS } from "../../services/api";

type Vehiculo = {
  id: number;
  marca: string;
  modelo: string;
  placa: string;
  estado: string;
};

type Cliente = {
  id: number;
  nombre: string;
  apellido: string;
  estado: string;
};

type Contrato = {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  tarifaDiaria: number;
  estado: string;
  cliente: {
    nombre: string;
    apellido: string;
  };
  vehiculo: {
    marca: string;
    modelo: string;
    placa: string;
  };
};

type Pago = {
  id: number;
  monto: number;
  fecha: string;
  tipo: string;
  estado: string;
  contrato?: {
    cliente?: {
      nombre: string;
      apellido: string;
    };
  };
};

export default function DashboardPage() {
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

        setVehiculos(datosVehiculos);
        setClientes(datosClientes);
        setContratos(datosContratos);
        setPagos(datosPagos);
      } catch (err) {
        console.error("Error al cargar el dashboard:", err);
        setError("No fue posible cargar las métricas del dashboard.");
      } finally {
        setCargando(false);
      }
    }

    cargarDashboard();
  }, []);

  const stats = useMemo(() => {
    const totalVehiculos = vehiculos.length;
    const disponibles = vehiculos.filter((v) => v.estado === "DISPONIBLE").length;
    const alquilados = vehiculos.filter((v) => v.estado === "ALQUILADO").length;
    const mantenimiento = vehiculos.filter((v) => v.estado === "MANTENIMIENTO").length;

    const totalIngresos = pagos
      .filter((p) => p.estado === "PAGADO")
      .reduce((sum, p) => sum + Number(p.monto), 0);

    const rentasActivas = contratos.filter((c) => c.estado === "ACTIVO").length;
    const totalClientes = clientes.length;

    return {
      totalVehiculos,
      disponibles,
      alquilados,
      mantenimiento,
      totalIngresos: totalIngresos.toFixed(2),
      rentasActivas,
      totalClientes,
    };
  }, [vehiculos, clientes, contratos, pagos]);

  return (
    <div className="dashboard-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Panel de Control Principal</h1>
          <p>Visión ejecutiva de la operación, finanzas y estado de flota de tu Rent Car.</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/contratos" className="primary-button">
            + Emitir Contrato
          </Link>
          <Link to="/pagos" className="secondary-button">
            + Cobrar / Pago
          </Link>
        </div>
      </div>

      {error && <div className="alert-box error">{error}</div>}

      {/* Tarjetas de Métricas Principales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon available">💰</div>
          <div className="stat-info">
            <span className="stat-label">Ingresos Totales</span>
            <strong className="stat-value" style={{ color: "var(--success)" }}>
              ${stats.totalIngresos}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rented">🔑</div>
          <div className="stat-info">
            <span className="stat-label">Rentas en Curso</span>
            <strong className="stat-value" style={{ color: "var(--primary)" }}>
              {stats.rentasActivas}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚗</div>
          <div className="stat-info">
            <span className="stat-label">Flota Disponible</span>
            <strong className="stat-value">{stats.disponibles} de {stats.totalVehiculos}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-label">Cartera de Clientes</span>
            <strong className="stat-value">{stats.totalClientes}</strong>
          </div>
        </div>
      </div>

      {/* Cuadrícula de Paneles de Operación */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
        {/* Panel 1: Rentas y Alquileres Recientes */}
        <div className="content-panel">
          <div className="panel-header">
            <h2>Rentas Recientes</h2>
            <Link to="/contratos" style={{ color: "var(--primary)", fontSize: "12px", fontWeight: 600 }}>
              Ver todas ➔
            </Link>
          </div>

          {cargando ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <span>Cargando contratos...</span>
            </div>
          ) : contratos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📄</div>
              <strong>No hay rentas activas</strong>
              <span>Genera contratos en la pestaña de Contratos.</span>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Vehículo</th>
                    <th>Devolución</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.slice(0, 5).map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.cliente?.nombre} {c.cliente?.apellido}</strong>
                      </td>
                      <td>
                        {c.vehiculo?.marca} {c.vehiculo?.modelo} (<code>{c.vehiculo?.placa}</code>)
                      </td>
                      <td>{new Date(c.fechaFin).toLocaleDateString("es-DO")}</td>
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
          )}
        </div>

        {/* Panel 2: Flujo de Caja y Cobros Recientes */}
        <div className="content-panel">
          <div className="panel-header">
            <h2>Últimos Cobros Registrados</h2>
            <Link to="/pagos" style={{ color: "var(--primary)", fontSize: "12px", fontWeight: 600 }}>
              Ver caja ➔
            </Link>
          </div>

          {cargando ? (
            <div className="empty-state">
              <div className="empty-state-icon">⏳</div>
              <span>Cargando transacciones...</span>
            </div>
          ) : pagos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <strong>No hay cobros registrados</strong>
              <span>Registra cobros y recibos en la pestaña de Pagos.</span>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Método</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td>
                        <strong>
                          {p.contrato?.cliente
                            ? `${p.contrato.cliente.nombre} ${p.contrato.cliente.apellido}`
                            : `Transacción #${p.id}`}
                        </strong>
                      </td>
                      <td>{p.tipo}</td>
                      <td>
                        <strong style={{ color: p.estado === "PAGADO" ? "var(--success)" : "inherit" }}>
                          ${Number(p.monto).toFixed(2)}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            p.estado === "PAGADO"
                              ? "badge-disponible"
                              : "badge-inactivo"
                          }`}
                        >
                          {p.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}