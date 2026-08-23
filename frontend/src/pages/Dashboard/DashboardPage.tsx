 import { useEffect, useState } from "react";

type Vehiculo = {
  id: number;
  estado: string;
};

type Cliente = {
  id: number;
  estado: string;
};

const API_URL = "http://localhost:3000/api";

function DashboardPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarDashboard() {
      try {
        setCargando(true);
        setError("");

        const [vehiculosResponse, clientesResponse] = await Promise.all([
          fetch(`${API_URL}/vehiculos`),
          fetch(`${API_URL}/clientes`),
        ]);

        if (!vehiculosResponse.ok) {
          throw new Error("No fue posible obtener los vehículos.");
        }

        if (!clientesResponse.ok) {
          throw new Error("No fue posible obtener los clientes.");
        }

        const vehiculosData: Vehiculo[] = await vehiculosResponse.json();
        const clientesData: Cliente[] = await clientesResponse.json();

        setVehiculos(vehiculosData);
        setClientes(clientesData);
      } catch (err) {
        console.error("Error al cargar el dashboard:", err);

        setError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar los datos del dashboard.",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarDashboard();
  }, []);

  const totalVehiculos = vehiculos.length;

  const vehiculosDisponibles = vehiculos.filter(
    (vehiculo) => vehiculo.estado === "DISPONIBLE",
  ).length;

  const vehiculosAlquilados = vehiculos.filter(
    (vehiculo) => vehiculo.estado === "ALQUILADO",
  ).length;

  const vehiculosMantenimiento = vehiculos.filter(
    (vehiculo) => vehiculo.estado === "MANTENIMIENTO",
  ).length;

  const totalClientes = clientes.length;

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>

          <p>
            Resumen general de la operación de tu Rent Car.
          </p>
        </div>
      </div>

      {error && (
        <div className="content-panel" style={{ marginBottom: "22px" }}>
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>

            <strong>No fue posible cargar los datos</strong>

            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚗</div>

          <div className="stat-label">Vehículos</div>

          <div className="stat-value">
            {cargando ? "—" : totalVehiculos}
          </div>

          <div className="stat-description">
            Total registrado
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✓</div>

          <div className="stat-label">Disponibles</div>

          <div className="stat-value">
            {cargando ? "—" : vehiculosDisponibles}
          </div>

          <div className="stat-description">
            Listos para alquilar
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔑</div>

          <div className="stat-label">Alquilados</div>

          <div className="stat-value">
            {cargando ? "—" : vehiculosAlquilados}
          </div>

          <div className="stat-description">
            En alquiler actualmente
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>

          <div className="stat-label">Clientes</div>

          <div className="stat-value">
            {cargando ? "—" : totalClientes}
          </div>

          <div className="stat-description">
            Clientes registrados
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Actividad reciente</h2>

              <p>
                Movimientos recientes del sistema.
              </p>
            </div>
          </div>

          <div className="empty-state">
            <div className="empty-state-icon">📊</div>

            <strong>Actividad pendiente</strong>

            <span>
              La actividad reciente se conectará posteriormente
              con contratos, entregas y pagos.
            </span>
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <h2>Estado de la flota</h2>

              <p>
                Situación actual de los vehículos.
              </p>
            </div>
          </div>

          <div className="fleet-status">
            <div className="fleet-row">
              <span>
                <i className="legend-dot available" />
                Disponibles
              </span>

              <strong>
                {cargando ? "—" : vehiculosDisponibles}
              </strong>
            </div>

            <div className="fleet-row">
              <span>
                <i className="legend-dot rented" />
                Alquilados
              </span>

              <strong>
                {cargando ? "—" : vehiculosAlquilados}
              </strong>
            </div>

            <div className="fleet-row">
              <span>
                <i className="legend-dot maintenance" />
                Mantenimiento
              </span>

              <strong>
                {cargando ? "—" : vehiculosMantenimiento}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardPage;