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
  estado: string;
  tarifaDiaria: string;
};

const formularioInicial: FormularioVehiculo = {
  marca: "",
  modelo: "",
  anio: "",
  color: "",
  placa: "",
  vin: "",
  kilometraje: "0",
  estado: "DISPONIBLE",
  tarifaDiaria: "",
};

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [formulario, setFormulario] =
    useState<FormularioVehiculo>(formularioInicial);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_URL = "http://localhost:3000/api/vehiculos";

  const cargarVehiculos = async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch(API_URL);

      if (!respuesta.ok) {
        throw new Error("No fue posible cargar los vehículos.");
      }

      const datos = await respuesta.json();

      setVehiculos(datos);
    } catch (error) {
      console.error(error);

      setError(
        "No se pudieron cargar los vehículos. No fue posible conectar con el servidor de RentOS."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const actualizarCampo = (
    campo: keyof FormularioVehiculo,
    valor: string
  ) => {
    setFormulario((actual) => ({
      ...actual,
      [campo]: valor,
    }));

    setErrorFormulario("");
    setMensaje("");
  };

  const validarFormulario = () => {
    setErrorFormulario("");

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

    const anio = Number(formulario.anio);

    if (!Number.isInteger(anio) || anio < 1900) {
      setErrorFormulario("El año no es válido.");
      return false;
    }

    // El color es obligatorio.
    if (!formulario.color.trim()) {
      setErrorFormulario("El color es obligatorio.");
      return false;
    }

    // El VIN es obligatorio.
    if (!formulario.vin.trim()) {
      setErrorFormulario("El VIN es obligatorio.");
      return false;
    }

    if (!formulario.placa.trim()) {
      setErrorFormulario("La placa es obligatoria.");
      return false;
    }

    if (!formulario.kilometraje.trim()) {
      setErrorFormulario("El kilometraje es obligatorio.");
      return false;
    }

    const kilometraje = Number(formulario.kilometraje);

    // El kilometraje mínimo permitido es 0.
    if (!Number.isFinite(kilometraje) || kilometraje < 0) {
      setErrorFormulario(
        "El kilometraje debe ser un valor igual o superior a 0."
      );
      return false;
    }

    if (!formulario.tarifaDiaria.trim()) {
      setErrorFormulario("La tarifa diaria es obligatoria.");
      return false;
    }

    const tarifaDiaria = Number(formulario.tarifaDiaria);

    if (!Number.isFinite(tarifaDiaria) || tarifaDiaria < 0) {
      setErrorFormulario(
        "La tarifa diaria debe ser un valor igual o superior a 0."
      );
      return false;
    }

    return true;
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setEditandoId(null);
    setErrorFormulario("");
  };

  const guardarVehiculo = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensaje("");

      const datos = {
        marca: formulario.marca.trim(),
        modelo: formulario.modelo.trim(),
        anio: Number(formulario.anio),
        color: formulario.color.trim(),
        placa: formulario.placa.trim(),
        vin: formulario.vin.trim(),
        kilometraje: Number(formulario.kilometraje),
        estado: formulario.estado,
        tarifaDiaria: Number(formulario.tarifaDiaria),
      };

      const url =
        editandoId === null
          ? API_URL
          : `${API_URL}/${editandoId}`;

      const metodo = editandoId === null ? "POST" : "PUT";

      const respuesta = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
      });

      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          resultado?.message ||
            resultado?.error ||
            "No fue posible guardar el vehículo."
        );
      }

      if (editandoId === null) {
        setMensaje("Vehículo guardado correctamente.");
      } else {
        setMensaje("Vehículo actualizado correctamente.");
      }

      limpiarFormulario();

      await cargarVehiculos();
    } catch (error) {
      console.error(error);

      setErrorFormulario(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el vehículo."
      );
    } finally {
      setGuardando(false);
    }
  };

  const editarVehiculo = (vehiculo: Vehiculo) => {
    setEditandoId(vehiculo.id);

    setFormulario({
      marca: vehiculo.marca ?? "",
      modelo: vehiculo.modelo ?? "",
      anio: String(vehiculo.anio ?? ""),
      color: vehiculo.color ?? "",
      placa: vehiculo.placa ?? "",
      vin: vehiculo.vin ?? "",
      kilometraje: String(vehiculo.kilometraje ?? 0),
      estado: vehiculo.estado ?? "DISPONIBLE",
      tarifaDiaria: String(vehiculo.tarifaDiaria ?? ""),
    });

    setErrorFormulario("");
    setMensaje("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const eliminarVehiculo = async (id: number) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea eliminar este vehículo?"
    );

    if (!confirmar) {
      return;
    }

    try {
      setError("");
      setMensaje("");

      const respuesta = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          resultado?.message ||
            resultado?.error ||
            "No fue posible eliminar el vehículo."
        );
      }

      setMensaje("Vehículo eliminado correctamente.");

      if (editandoId === id) {
        limpiarFormulario();
      }

      await cargarVehiculos();
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el vehículo."
      );
    }
  };

  const cancelarEdicion = () => {
    limpiarFormulario();
    setMensaje("");
  };

  const cantidadVehiculos = useMemo(
    () => vehiculos.length,
    [vehiculos]
  );

  if (cargando) {
    return (
      <div>
        <h1>Vehículos</h1>
        <p>Cargando vehículos...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Vehículos</h1>

      <p>
        Total de vehículos: <strong>{cantidadVehiculos}</strong>
      </p>
<button
  type="button"
  onClick={() => {
    limpiarFormulario();
    setMensaje("");
    setErrorFormulario("");

    setTimeout(() => {
      document
        .getElementById("formulario-vehiculo")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 0);
  }}
>
  + Nuevo vehículo
</button>
      {error && (
        <div role="alert">
          <strong>No se pudieron cargar los vehículos</strong>
          <p>{error}</p>
        </div>
      )}

      {mensaje && (
        <div role="status">
          {mensaje}
        </div>
      )}

      <section id="formulario-vehiculo">
        <h2>
          {editandoId === null
            ? "Registrar vehículo"
            : "Editar vehículo"}
        </h2>

        {errorFormulario && (
          <div role="alert">
            <strong>Revise el formulario</strong>
            <p>{errorFormulario}</p>
          </div>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            guardarVehiculo();
          }}
        >
          <div>
            <label htmlFor="marca">
              Marca *
            </label>

            <input
              id="marca"
              type="text"
              value={formulario.marca}
              onChange={(event) =>
                actualizarCampo("marca", event.target.value)
              }
              required
            />
          </div>

          <div>
            <label htmlFor="modelo">
              Modelo *
            </label>

            <input
              id="modelo"
              type="text"
              value={formulario.modelo}
              onChange={(event) =>
                actualizarCampo("modelo", event.target.value)
              }
              required
            />
          </div>

          <div>
            <label htmlFor="anio">
              Año *
            </label>

            <input
              id="anio"
              type="number"
              min="1900"
              value={formulario.anio}
              onChange={(event) =>
                actualizarCampo("anio", event.target.value)
              }
              required
            />
          </div>

          <div>
            <label htmlFor="color">
              Color *
            </label>

            <input
              id="color"
              type="text"
              value={formulario.color}
              onChange={(event) =>
                actualizarCampo("color", event.target.value)
              }
              required
            />
          </div>

          <div>
            <label htmlFor="placa">
              Placa *
            </label>

            <input
              id="placa"
              type="text"
              value={formulario.placa}
              onChange={(event) =>
                actualizarCampo("placa", event.target.value)
              }
              required
            />
          </div>

          <div>
            <label htmlFor="vin">
              VIN *
            </label>

            <input
              id="vin"
              type="text"
              value={formulario.vin}
              onChange={(event) =>
                actualizarCampo("vin", event.target.value)
              }
              required
            />
          </div>

          <div>
            <label htmlFor="kilometraje">
              Kilometraje *
            </label>

            <input
              id="kilometraje"
              type="number"
              min="0"
              value={formulario.kilometraje}
              onChange={(event) =>
                actualizarCampo(
                  "kilometraje",
                  event.target.value
                )
              }
              required
            />
          </div>

          <div>
            <label htmlFor="estado">
              Estado *
            </label>

            <select
              id="estado"
              value={formulario.estado}
              onChange={(event) =>
                actualizarCampo("estado", event.target.value)
              }
              required
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
          </div>

          <div>
            <label htmlFor="tarifaDiaria">
              Tarifa diaria *
            </label>

            <input
              id="tarifaDiaria"
              type="number"
              min="0"
              step="0.01"
              value={formulario.tarifaDiaria}
              onChange={(event) =>
                actualizarCampo(
                  "tarifaDiaria",
                  event.target.value
                )
              }
              required
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : editandoId === null
                ? "Guardar vehículo"
                : "Guardar cambios"}
            </button>

            {editandoId !== null && (
              <button
                type="button"
                onClick={cancelarEdicion}
                disabled={guardando}
              >
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2>Listado de vehículos</h2>

        {vehiculos.length === 0 ? (
          <p>No hay vehículos registrados.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Color</th>
                <th>Placa</th>
                <th>VIN</th>
                <th>Kilometraje</th>
                <th>Estado</th>
                <th>Tarifa diaria</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {vehiculos.map((vehiculo) => (
                <tr key={vehiculo.id}>
                  <td>{vehiculo.id}</td>
                  <td>{vehiculo.marca}</td>
                  <td>{vehiculo.modelo}</td>
                  <td>{vehiculo.anio}</td>
                  <td>{vehiculo.color}</td>
                  <td>{vehiculo.placa}</td>
                  <td>{vehiculo.vin}</td>
                  <td>{vehiculo.kilometraje}</td>
                  <td>{vehiculo.estado}</td>
                  <td>{vehiculo.tarifaDiaria}</td>

                  <td>
                    <button
                      type="button"
                      onClick={() =>
                        editarVehiculo(vehiculo)
                      }
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        eliminarVehiculo(vehiculo.id)
                      }
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}