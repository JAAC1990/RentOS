import { useEffect, useMemo, useState } from "react";

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

type FormularioVehiculo = {
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

const API_URL = "http://localhost:3000/api/vehiculos";

const formularioInicial: FormularioVehiculo = {
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
    useState<FormularioVehiculo>(formularioInicial);

  const [vehiculoEditando, setVehiculoEditando] =
    useState<Vehiculo | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  async function cargarVehiculos() {
    try {
      setCargando(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("No fue posible obtener los vehículos.");
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

  const vehiculosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return vehiculos.filter((vehiculo) => {
      const coincideBusqueda =
        texto === "" ||
        vehiculo.marca.toLowerCase().includes(texto) ||
        vehiculo.modelo.toLowerCase().includes(texto) ||
        vehiculo.color.toLowerCase().includes(texto) ||
        vehiculo.placa.toLowerCase().includes(texto) ||
        vehiculo.vin.toLowerCase().includes(texto) ||
        String(vehiculo.anio).includes(texto) ||
        String(vehiculo.kilometraje).includes(texto);

      const coincideEstado =
        filtroEstado === "TODOS" ||
        vehiculo.estado === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [vehiculos, busqueda, filtroEstado]);

  function manejarCambio(
    campo: keyof FormularioVehiculo,
    valor: string,
  ) {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function abrirFormularioNuevo() {
    setErrorFormulario("");
    setFormulario(formularioInicial);
    setVehiculoEditando(null);
    setMostrarFormulario(true);
  }

  function abrirFormularioEditar(vehiculo: Vehiculo) {
    setErrorFormulario("");

    setFormulario({
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: String(vehiculo.anio),
      color: vehiculo.color || "",
      placa: vehiculo.placa,
      vin: vehiculo.vin || "",
      kilometraje: String(vehiculo.kilometraje),
      tarifaDiaria: String(vehiculo.tarifaDiaria),
      estado: vehiculo.estado,
    });

    setVehiculoEditando(vehiculo);
    setMostrarFormulario(true);
  }

  function cerrarFormulario() {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    setErrorFormulario("");
    setFormulario(formularioInicial);
    setVehiculoEditando(null);
  }

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroEstado("TODOS");
  }

  function validarFormulario(): boolean {
    if (!formulario.marca.trim()) {
      setErrorFormulario("La marca es obligatoria.");
      return false;
    }

    if (!formulario.modelo.trim()) {
      setErrorFormulario("El modelo es obligatorio.");
      return false;
    }

    if (!formulario.anio.trim()) {
      setErrorFormulario("El año es obligatorio.");
      return false;
    }

    if (!formulario.placa.trim()) {
      setErrorFormulario("La placa es obligatoria.");
      return false;
    }

    if (!formulario.tarifaDiaria.trim()) {
      setErrorFormulario("La tarifa diaria es obligatoria.");
      return false;
    }

    const anio = Number(formulario.anio);
    const kilometraje = Number(formulario.kilometraje);
    const tarifaDiaria = Number(formulario.tarifaDiaria);

    if (!Number.isInteger(anio)) {
      setErrorFormulario("El año no es válido.");
      return false;
    }

    if (anio < 1900 || anio > 2100) {
      setErrorFormulario(
        "El año debe estar entre 1900 y 2100.",
      );
      return false;
    }

    if (
      !Number.isInteger(kilometraje) ||
      kilometraje < 0
    ) {
      setErrorFormulario(
        "El kilometraje debe ser un número entero mayor o igual a 0.",
      );
      return false;
    }

    if (
      !Number.isFinite(tarifaDiaria) ||
      tarifaDiaria < 0
    ) {
      setErrorFormulario(
        "La tarifa diaria no es válida.",
      );
      return false;
    }

    if (
      vehiculoEditando &&
      kilometraje < vehiculoEditando.kilometraje
    ) {
      setErrorFormulario(
        "El nuevo kilometraje no puede ser menor que el kilometraje actual.",
      );
      return false;
    }

    return true;
  }

  async function crearVehiculo() {
    const anio = Number(formulario.anio);
    const kilometraje = Number(formulario.kilometraje);
    const tarifaDiaria = Number(formulario.tarifaDiaria);

    const response = await fetch(API_URL, {
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
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "No fue posible registrar el vehículo.",
      );
    }
  }

  async function actualizarVehiculo() {
    if (!vehiculoEditando) {
      throw new Error(
        "No se encontró el vehículo que se desea editar.",
      );
    }

    const anio = Number(formulario.anio);
    const kilometraje = Number(formulario.kilometraje);
    const tarifaDiaria = Number(formulario.tarifaDiaria);

    const response = await fetch(
      `${API_URL}/${vehiculoEditando.id}`,
      {
        method: "PUT",
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
          "No fue posible actualizar el vehículo.",
      );
    }
  }

  async function guardarVehiculo(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorFormulario("");

    if (!validarFormulario()) {
      return;
    }

    try {
      setGuardando(true);

      if (vehiculoEditando) {
        await actualizarVehiculo();
      } else {
        await crearVehiculo();
      }

      setMostrarFormulario(false);
      setFormulario(formularioInicial);
      setVehiculoEditando(null);

      await cargarVehiculos();
    } catch (err) {
      console.error(
        "Error al guardar vehículo:",
        err,
      );

      setErrorFormulario(
        err instanceof Error
          ? err.message
          : "No fue posible guardar el vehículo.",
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
          onClick={abrirFormularioNuevo}
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
              <h2>
                {vehiculoEditando
                  ? "Editar vehículo"
                  : "Nuevo vehículo"}
              </h2>

              <p>
                {vehiculoEditando
                  ? `Actualiza la información del vehículo ${vehiculoEditando.marca} ${vehiculoEditando.modelo}.`
                  : "Registra un nuevo vehículo en la flota."}
              </p>
            </div>
          </div>

          <form
            onSubmit={guardarVehiculo}
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
                  : vehiculoEditando
                    ? "Guardar cambios"
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

        {!cargando &&
          !error &&
          vehiculos.length > 0 && (
            <div
              style={{
                padding: "0 20px 20px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(250px, 1fr) 180px auto",
                  gap: "12px",
                  alignItems: "end",
                  marginBottom: "20px",
                }}
              >
                <label>
                  <div
                    style={{
                      marginBottom: "6px",
                      fontWeight: 600,
                    }}
                  >
                    Buscar vehículo
                  </div>

                  <input
                    type="text"
                    value={busqueda}
                    onChange={(event) =>
                      setBusqueda(event.target.value)
                    }
                    placeholder="Marca, modelo, color, placa, VIN..."
                    style={{
                      width: "100%",
                      padding: "11px 12px",
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
                    value={filtroEstado}
                    onChange={(event) =>
                      setFiltroEstado(event.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "11px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      boxSizing: "border-box",
                      background: "white",
                    }}
                  >
                    <option value="TODOS">
                      Todos
                    </option>

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

                <button
                  type="button"
                  onClick={limpiarFiltros}
                  style={{
                    padding: "11px 16px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    background: "white",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Limpiar filtros
                </button>
              </div>

              <div
                style={{
                  marginBottom: "14px",
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                }}
              >
                Mostrando{" "}
                <strong>
                  {vehiculosFiltrados.length}
                </strong>{" "}
                de <strong>{vehiculos.length}</strong>{" "}
                vehículos.
              </div>
            </div>
          )}

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

        {!cargando &&
          !error &&
          vehiculos.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                🚗
              </div>

              <strong>
                No hay vehículos registrados
              </strong>

              <span>
                Cuando registres vehículos aparecerán
                aquí.
              </span>
            </div>
          )}

        {!cargando &&
          !error &&
          vehiculos.length > 0 &&
          vehiculosFiltrados.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                🔎
              </div>

              <strong>
                No encontramos vehículos
              </strong>

              <span>
                Prueba con otro término de búsqueda o
                cambia el filtro de estado.
              </span>
            </div>
          )}

        {!cargando &&
          !error &&
          vehiculosFiltrados.length > 0 && (
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

                    <th
                      style={{
                        textAlign: "left",
                        padding: "14px 10px",
                        borderBottom:
                          "1px solid var(--border)",
                      }}
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {vehiculosFiltrados.map((vehiculo) => (
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
                          VIN:{" "}
                          {vehiculo.vin || "—"}
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

                      <td
                        style={{
                          padding: "14px 10px",
                          borderBottom:
                            "1px solid var(--border)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            abrirFormularioEditar(
                              vehiculo,
                            )
                          }
                          style={{
                            padding: "8px 12px",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            background: "white",
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          ✏️ Editar
                        </button>
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