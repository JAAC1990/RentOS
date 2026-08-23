import { useEffect, useState } from "react";

type Contrato = {
  id: number;
  clienteId: number;
  vehiculoId: number;
  fechaInicio: string;
  fechaFin: string;
  tarifaDiaria: number;
  deposito: number;
  kilometrajeInicial: number;
  kilometrajeFinal: number | null;
  estado: string;
  observaciones: string | null;
};

const API_URL = "http://localhost:3000/api";

function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarContratos() {
      try {
        setCargando(true);
        setError("");

        const response = await fetch(`${API_URL}/contratos`);

        if (!response.ok) {
          throw new Error("No fue posible obtener los contratos.");
        }

        const data: Contrato[] = await response.json();

        setContratos(data);
      } catch (err) {
        console.error("Error al cargar contratos:", err);

        setError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar los contratos.",
        );
      } finally {
        setCargando(false);
      }
    }

    cargarContratos();
  }, []);

  const estadoTexto = (estado: string) => {
    switch (estado) {
      case "ACTIVO":
        return "Activo";
      case "FINALIZADO":
        return "Finalizado";
      case "CANCELADO":
        return "Cancelado";
      default:
        return estado;
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-DO");
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Contratos</h1>

          <p>
            Administra el ciclo de alquiler de los vehículos.
          </p>
        </div>

        <button className="primary-button" type="button">
          + Nuevo contrato
        </button>
      </div>

      {error && (
        <div
          className="content-panel"
          style={{ marginBottom: "22px" }}
        >
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>

            <strong>
              No fue posible cargar los contratos
            </strong>

            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="content-panel">
        <div className="panel-header">
          <div>
            <h2>Contratos de alquiler</h2>

            <p>
              Contratos registrados actualmente en RentOS.
            </p>
          </div>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>

            <strong>Cargando contratos...</strong>

            <span>
              Estamos consultando la información del backend.
            </span>
          </div>
        ) : contratos.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>

            <strong>No hay contratos registrados</strong>

            <span>
              Los contratos que registres aparecerán aquí.
            </span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr>
                  <th style={{ padding: "14px 20px" }}>
                    Contrato
                  </th>

                  <th style={{ padding: "14px 20px" }}>
                    Cliente
                  </th>

                  <th style={{ padding: "14px 20px" }}>
                    Vehículo
                  </th>

                  <th style={{ padding: "14px 20px" }}>
                    Inicio
                  </th>

                  <th style={{ padding: "14px 20px" }}>
                    Fin
                  </th>

                  <th style={{ padding: "14px 20px" }}>
                    Tarifa diaria
                  </th>

                  <th style={{ padding: "14px 20px" }}>
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody>
                {contratos.map((contrato) => (
                  <tr key={contrato.id}>
                    <td style={{ padding: "14px 20px" }}>
                      <strong>#{contrato.id}</strong>
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      #{contrato.clienteId}
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      #{contrato.vehiculoId}
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      {formatearFecha(contrato.fechaInicio)}
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      {formatearFecha(contrato.fechaFin)}
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      ${contrato.tarifaDiaria.toFixed(2)}
                    </td>

                    <td style={{ padding: "14px 20px" }}>
                      {estadoTexto(contrato.estado)}
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

export default ContratosPage;