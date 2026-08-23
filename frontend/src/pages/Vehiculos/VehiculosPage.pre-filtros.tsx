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

type NuevoVehiculo = {
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  placa: string;
  vin: string;
  kilometraje: string;
  tarifaDiaria: string;
  estado: string;
};

const formularioInicial: NuevoVehiculo = {
  marca: "",
  modelo: "",
  anio: "",
  color: "",
  placa: "",
  vin: "",
  kilometraje: "0",
  tarifaDiaria: "",
  estado: "DISPONIBLE",
};

function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] =
    useState<NuevoVehiculo>(formularioInicial);

  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");

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

  useEffect(() => {
    cargarVehiculos();
  }, []);

  function manejarCambio(
    campo: keyof NuevoVehiculo,
    valor: string,
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function abrirFormulario() {
    setErrorFormulario("");
    setFormulario(formularioInicial);
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    setErrorFormulario("");
    setFormulario(formularioInicial);
  }

  async function crearVehiculo(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorFormulario("");

    if (!formulario.marca.trim()) {
      setErrorFormulario("La marca es obligatoria.");
      return;
    }

    if (!formulario.modelo.trim()) {
      setErrorFormulario("El modelo es obligatorio.");
      return;
    }

    if (!formulario.anio.trim()) {
      setErrorFormulario("El año es obligatorio.");
      return;
    }

    if (!formulario.placa.trim()) {
      setErrorFormulario("La placa es obligatoria.");
      return;
    }

    if (!formulario.tarifaDiaria.trim()) {
      setErrorFormulario(
        "La tarifa diaria es obligatoria.",
      );
      return;
    }

    const anio = Number(formulario.anio);
    const kilometraje = Number(formulario.kilometraje);
    const tarifaDiaria = Number(formulario.tarifaDiaria);

    if (!Number.isInteger(anio)) {
      setErrorFormulario("El año no es válido.");
      return;
    }

    if (
      !Number.isInteger(kilometraje) ||
      kilometraje < 0
    ) {
      setErrorFormulario(
        "El kilometraje debe ser un número entero mayor o igual a 0.",
      );
      return;
    }

    if (!Number.isFinite(tarifaDiaria) || tarifaDiaria < 0) {
      setErrorFormulario(
        "La tarifa diaria no es válida.",
      );
      return;
    }

    try {
      setGuardando(true);

      const response = await fetch(
        "http://localhost:3000/api/vehiculos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            marca: formulario.marca.trim(),
            modelo: formulario.modelo.trim(),
            anio,
            color: formulario.color.trim(),
            placa: formulario.placa.trim(),
            vin: formulario.vin.trim(),
            kilometraje,
            tarifaDiaria,
            estado: formulario.estado,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No fue posible registrar el vehículo.",
        );
      }

      setMostrarFormulario(false);
      setFormulario(formularioInicial);

      await cargarVehiculos();
    } catch (err) {
      console.error("Error al crear vehículo:", err);

      setErrorFormulario(
        err instanceof Error
          ? err.message
          : "No fue posible registrar el vehículo.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Vehículos</h1>

          <p>
            Administra la flota de vehículos de tu Rent Car.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={abrirFormulario}
        >
          + Nuevo vehículo
        </button>
      </div>

      {mostrarFormulario && (
        <div
          className="content-panel"
          style={{
            marginBottom: "20px",
          }}
        >
          <div className="panel-header">
            <div>
              <h2>Nuevo vehículo</h2>

              <p>
                Registra un nuevo vehículo en la flota.
              </p>
            </div>
          </div>

          <form
            onSubmit={crearVehiculo}
            style={{
              padding: "0 20px 20px",
            }}
          >
            {errorFormulario && (
              <div
                style={{
                  marginBottom: "16px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: "#fee2e2",
                  color: "#991b1b",
                  fontSize: "13px",
                }}
              >
                {errorFormulario}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <label>
                <div
                  style={{
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  Marca *
                </div>

                <input
                  type="text"
                  value={formulario.marca}
                  onChange={(event) =>
                    manejarCambio(
                      "marca",
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Toyota"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label>
                <div
                  style={{
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  Modelo *
                </div>

                <input
                  type="text"
                  value={formulario.modelo}
                  onChange={(event) =>
                    manejarCambio(
                      "modelo",
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Corolla"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label>
                <div
                  style={{
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  Año *
                </div>

                <input
                  type="number"
                  value={formulario.anio}
                  onChange={(event) =>
                    manejarCambio(
                      "anio",
                      event.target.value,
                    )
                  }
                  placeholder="Ej. 2026"
                  required
                  min="1900"
                  max="2100"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label>
                <div
                  style={{
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  Color
                </div>

                <input
                  type="text"
                  value={formulario.color}
                  onChange={(event) =>
                    manejarCambio(
                      "color",
                      event.target.value,
                    )
                  }
                  placeholder="Ej. Blanco"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label>
                <div
                  style={{
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  Placa *
                </div>

                <input
                  type="text"
                  value={formulario.placa}
                  onChange={(event) =>
                    manejarCambio(
                      "placa",
                      event.target.value,
                    )
                  }
                  placeholder="Ej. A123456"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label>
                <div
                  style={{
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  VIN
                </div>

                <input
                  type="text"
                  value={formulario.vin}
                  onChange={(event) =>
                    manejarCambio(
                      "vin",
                      event.target.value,
                    )
                  }
                  placeholder="Número VIN"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label>
                <div
                  style={{
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  Kilometraje
                </div>

                <input
                  type="number"
                  value={formulario.kilometraje}
                  onChange={(event) =>
                    manejarCambio(
                      "kilometraje",
                      event.target.value,
                    )
                  }
                  min="0"
                  step="1"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label>
                <div
                  style={{
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  Tarifa diaria *
                </div>

                <input
                  type="number"
                  value={formulario.tarifaDiaria}
                  onChange={(event) =>
                    manejarCambio(
                      "tarifaDiaria",
                      event.target.value,
                    )
                  }
                  placeholder="Ej. 55"
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                  }}
                />
              </label>

              <label>
                <div
                  style={{
                    marginBottom: "6px",
                    fontWeight: 600,
                  }}
                >
                  Estado
                </div>

                <select
                  value={formulario.estado}
                  onChange={(event) =>
                    manejarCambio(
                      "estado",
                      event.target.value,
                    )
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    boxSizing: "border-box",
                    background: "white",
                  }}
                >
                  <option value="DISPONIBLE">
                    Disponible
                  </option>

                  <option value="ALQUILADO">
                    Alquilado
                  </option>

                  <option value="MANTENIMIENTO">
                    Mantenimiento
                  </option>
                </select>
              </label>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <button
                type="submit"
                className="primary-button"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar vehículo"}
              </button>

              <button
                type="button"
                onClick={cerrarFormulario}
                disabled={guardando}
                style={{
                  padding: "10px 16px",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  background: "white",
                  cursor: guardando
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

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
                        VIN: {vehiculo.vin || "—"}
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
                      {vehiculo.color || "—"}
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
                              : vehiculo.estado ===
                                  "MANTENIMIENTO"
                                ? "#fef3c7"
                                : "#dbeafe",
                          color:
                            vehiculo.estado ===
                            "DISPONIBLE"
                              ? "#166534"
                              : vehiculo.estado ===
                                  "MANTENIMIENTO"
                                ? "#92400e"
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

