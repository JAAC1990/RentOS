import { useEffect, useState } from "react";

type Vehiculo = {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  placa: string;
  vin: string;
  kilometraje: number;
  estado: string;
  tarifaDiaria: string;
};

function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarVehiculos() {
      try {
        setCargando(true);
        setError("");

        const response = await fetch(
          "http://localhost:3000/api/vehiculos",
        );

        if (!response.ok) {
          throw new Error(
            "No fue posible obtener los vehículos.",
          );
        }

        const data: Vehiculo[] = await response.json();

        setVehiculos(data);
      } catch (err) {
        console.error("Error al cargar vehículos:", err);

        setError(
          "No fue posible conectar con el servidor de RentOS.",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarVehiculos();
  }, []);

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Vehículos</h1>

          <p>
            Administra la flota de vehículos de tu Rent Car.
          </p>
        </div>

        <button className="primary-button">
          + Nuevo vehículo
        </button>
      </div>

      <div className="content-panel">
        <div className="panel-header">
          <div>
            <h2>Flota de vehículos</h2>

            <p>
              Vehículos registrados actualmente en RentOS.
            </p>
          </div>
        </div>

        {cargando && (
          <div className="empty-state">
            <div className="empty-state-icon">
              🚗
            </div>

            <strong>
              Cargando vehículos...
            </strong>

            <span>
              Estamos consultando la información del
              servidor.
            </span>
          </div>
        )}

        {!cargando && error && (
          <div className="empty-state">
            <div className="empty-state-icon">
              ⚠️
            </div>

            <strong>
              No se pudieron cargar los vehículos
            </strong>

            <span>{error}</span>
          </div>
        )}

        {!cargando && !error && vehiculos.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              🚗
            </div>

            <strong>
              No hay vehículos registrados
            </strong>

            <span>
              Cuando registres vehículos aparecerán aquí.
            </span>
          </div>
        )}

        {!cargando && !error && vehiculos.length > 0 && (
          <div
            style={{
              overflowX: "auto",
              padding: "0 20px 20px",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px 10px",
                      borderBottom:
                        "1px solid var(--border)",
                    }}
                  >
                    Vehículo
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px 10px",
                      borderBottom:
                        "1px solid var(--border)",
                    }}
                  >
                    Año
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px 10px",
                      borderBottom:
                        "1px solid var(--border)",
                    }}
                  >
                    Placa
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px 10px",
                      borderBottom:
                        "1px solid var(--border)",
                    }}
                  >
                    Color
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px 10px",
                      borderBottom:
                        "1px solid var(--border)",
                    }}
                  >
                    Kilometraje
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px 10px",
                      borderBottom:
                        "1px solid var(--border)",
                    }}
                  >
                    Tarifa diaria
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "14px 10px",
                      borderBottom:
                        "1px solid var(--border)",
                    }}
                  >
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody>
                {vehiculos.map((vehiculo) => (
                  <tr key={vehiculo.id}>
                    <td
                      style={{
                        padding: "14px 10px",
                        borderBottom:
                          "1px solid var(--border)",
                      }}
                    >
                      <strong>
                        {vehiculo.marca}{" "}
                        {vehiculo.modelo}
                      </strong>

                      <div
                        style={{
                          marginTop: "3px",
                          color:
                            "var(--text-secondary)",
                          fontSize: "11px",
                        }}
                      >
                        VIN: {vehiculo.vin}
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "14px 10px",
                        borderBottom:
                          "1px solid var(--border)",
                      }}
                    >
                      {vehiculo.anio}
                    </td>

                    <td
                      style={{
                        padding: "14px 10px",
                        borderBottom:
                          "1px solid var(--border)",
                        fontWeight: 600,
                      }}
                    >
                      {vehiculo.placa}
                    </td>

                    <td
                      style={{
                        padding: "14px 10px",
                        borderBottom:
                          "1px solid var(--border)",
                      }}
                    >
                      {vehiculo.color}
                    </td>

                    <td
                      style={{
                        padding: "14px 10px",
                        borderBottom:
                          "1px solid var(--border)",
                      }}
                    >
                      {vehiculo.kilometraje.toLocaleString(
                        "es-DO",
                      )}{" "}
                      km
                    </td>

                    <td
                      style={{
                        padding: "14px 10px",
                        borderBottom:
                          "1px solid var(--border)",
                        fontWeight: 600,
                      }}
                    >
                      ${vehiculo.tarifaDiaria}
                    </td>

                    <td
                      style={{
                        padding: "14px 10px",
                        borderBottom:
                          "1px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          padding: "5px 9px",
                          borderRadius: "999px",
                          background:
                            vehiculo.estado ===
                            "DISPONIBLE"
                              ? "#dcfce7"
                              : "#dbeafe",
                          color:
                            vehiculo.estado ===
                            "DISPONIBLE"
                              ? "#166534"
                              : "#1e40af",
                          fontSize: "11px",
                          fontWeight: 700,
                        }}
                      >
                        {vehiculo.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default VehiculosPage;

