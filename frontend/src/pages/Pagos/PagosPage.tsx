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
};

type Contrato = {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  tarifaDiaria: string | number;
  deposito: string | number;
  estado: string;
  cliente: Cliente;
  vehiculo: Vehiculo;
};

type Pago = {
  id: number;
  contratoId: number;
  monto: string | number;
  fecha: string;
  tipo: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "PAYPAL" | "OTRO";
  referencia: string | null;
  estado: "PAGADO" | "PENDIENTE" | "ANULADO";
  contrato?: Contrato;
};

type FormularioPago = {
  contratoId: string;
  monto: string;
  tipo: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "PAYPAL" | "OTRO";
  referencia: string;
  estado: "PAGADO" | "PENDIENTE" | "ANULADO";
};

const formularioInicial: FormularioPago = {
  contratoId: "",
  monto: "",
  tipo: "TRANSFERENCIA",
  referencia: "",
  estado: "PAGADO",
};

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);

  const [formulario, setFormulario] = useState<FormularioPago>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const [error, setError] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_PAGOS = API_URLS.pagos;

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const [resPagos, resContratos] = await Promise.all([
        fetch(API_PAGOS),
        fetch(API_URLS.contratos),
      ]);

      if (!resPagos.ok || !resContratos.ok) {
        throw new Error("No fue posible obtener la información de pagos.");
      }

      const [datosPagos, datosContratos] = await Promise.all([
        resPagos.json(),
        resContratos.json(),
      ]);

      setPagos(datosPagos);
      setContratos(datosContratos);
    } catch (err) {
      console.error(err);
      setError("No fue posible conectar con el servidor para cargar los pagos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Estadísticas calculadas en tiempo real
  const stats = useMemo(() => {
    const totalRecaudado = pagos
      .filter((p) => p.estado === "PAGADO")
      .reduce((sum, p) => sum + Number(p.monto), 0);

    const cantidadPagados = pagos.filter((p) => p.estado === "PAGADO").length;
    const cantidadPendientes = pagos.filter((p) => p.estado === "PENDIENTE").length;
    const cantidadAnulados = pagos.filter((p) => p.estado === "ANULADO").length;

    return {
      totalRecaudado: totalRecaudado.toFixed(2),
      cantidadPagados,
      cantidadPendientes,
      cantidadAnulados,
    };
  }, [pagos]);

  // Filtrado y búsqueda
  const pagosFiltrados = useMemo(() => {
    return pagos.filter((p) => {
      const cumpleFiltroTipo =
        filtroTipo === "TODOS" || p.tipo === filtroTipo;
      const cumpleFiltroEstado =
        filtroEstado === "TODOS" || p.estado === filtroEstado;

      const texto = `${p.id} ${p.contratoId} ${p.referencia || ""} ${p.contrato?.cliente?.nombre || ""} ${p.contrato?.cliente?.apellido || ""} ${p.contrato?.vehiculo?.marca || ""} ${p.contrato?.vehiculo?.placa || ""}`.toLowerCase();
      const cumpleBusqueda = texto.includes(busqueda.toLowerCase());

      return cumpleFiltroTipo && cumpleFiltroEstado && cumpleBusqueda;
    });
  }, [pagos, busqueda, filtroTipo, filtroEstado]);

  const handleSeleccionarContrato = (contratoIdStr: string) => {
    const c = contratos.find((item) => item.id === Number(contratoIdStr));
    let montoSugerido = "";
    if (c) {
      const dias = Math.max(
        1,
        Math.ceil(
          (new Date(c.fechaFin).getTime() - new Date(c.fechaInicio).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      montoSugerido = (dias * Number(c.tarifaDiaria)).toFixed(2);
    }

    setFormulario((actual) => ({
      ...actual,
      contratoId: contratoIdStr,
      monto: montoSugerido || actual.monto,
    }));
  };

  const validarFormulario = () => {
    setErrorFormulario("");

    if (!formulario.contratoId) {
      setErrorFormulario("Debe seleccionar un contrato.");
      return false;
    }
    if (!formulario.monto || Number(formulario.monto) <= 0) {
      setErrorFormulario("El monto debe ser superior a 0.");
      return false;
    }

    return true;
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setErrorFormulario("");
    setMostrarFormulario(false);
  };

  const registrarPago = async () => {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensaje("");

      const datos = {
        contratoId: Number(formulario.contratoId),
        monto: Number(formulario.monto),
        tipo: formulario.tipo,
        referencia: formulario.referencia.trim() || undefined,
        estado: formulario.estado,
      };

      const respuesta = await fetch(API_PAGOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          resultado?.error || resultado?.message || "No fue posible registrar el pago."
        );
      }

      setMensaje("✅ Pago registrado y acreditado exitosamente.");
      limpiarFormulario();
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setErrorFormulario(
        err instanceof Error ? err.message : "Error al registrar el pago."
      );
    } finally {
      setGuardando(false);
    }
  };

  const anularPago = async (id: number) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea anular este pago? Esta acción cambiará su estado a ANULADO."
    );
    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      const respuesta = await fetch(`${API_PAGOS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "ANULADO" }),
      });

      if (!respuesta.ok) {
        throw new Error("No fue posible anular el pago.");
      }

      setMensaje("⚠️ Pago marcado como ANULADO.");
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al anular pago.");
    }
  };

  const iconoTipoPago = (tipo: string) => {
    switch (tipo) {
      case "EFECTIVO":
        return "💵 Efectivo";
      case "TRANSFERENCIA":
        return "🏦 Transferencia";
      case "TARJETA":
        return "💳 Tarjeta";
      case "PAYPAL":
        return "🅿️ PayPal";
      default:
        return "📄 " + tipo;
    }
  };

  return (
    <div className="pagos-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Gestión de Pagos y Caja</h1>
          <p>Registra cobros de alquileres, depósitos y controla los balances de tu Rent Car.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            if (mostrarFormulario) {
              setMostrarFormulario(false);
            } else {
              limpiarFormulario();
              setMostrarFormulario(true);
            }
          }}
        >
          {mostrarFormulario ? "Cerrar Formulario" : "+ Registrar Pago"}
        </button>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon available">💰</div>
          <div className="stat-info">
            <span className="stat-label">Total Recaudado</span>
            <strong className="stat-value" style={{ color: "var(--success)" }}>
              ${stats.totalRecaudado}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-label">Cobros Realizados</span>
            <strong className="stat-value">{stats.cantidadPagados}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon maintenance">⏳</div>
          <div className="stat-info">
            <span className="stat-label">Pagos Pendientes</span>
            <strong className="stat-value">{stats.cantidadPendientes}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🚫</div>
          <div className="stat-info">
            <span className="stat-label">Anulados</span>
            <strong className="stat-value">{stats.cantidadAnulados}</strong>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Formulario de Pago */}
      {mostrarFormulario && (
        <section className="content-panel" id="formulario-pago">
          <div className="panel-header">
            <h2>Registrar Nuevo Cobro / Recibo</h2>
            <button className="secondary-button" onClick={limpiarFormulario}>
              Cancelar
            </button>
          </div>

          {errorFormulario && (
            <div className="alert-box error" style={{ margin: "20px 24px 0" }}>
              {errorFormulario}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              registrarPago();
            }}
          >
            <div className="form-grid">
              <div className="form-field" style={{ gridColumn: "span 2" }}>
                <label htmlFor="contratoId">Contrato de Alquiler *</label>
                <select
                  id="contratoId"
                  value={formulario.contratoId}
                  onChange={(e) => handleSeleccionarContrato(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Contrato --</option>
                  {contratos.map((c) => (
                    <option key={c.id} value={c.id}>
                      Contrato #{c.id} • {c.cliente?.nombre} {c.cliente?.apellido} — {c.vehiculo?.marca} {c.vehiculo?.modelo} ({c.vehiculo?.placa})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="monto">Monto a Cobrar (USD / DOP) *</label>
                <input
                  id="monto"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={formulario.monto}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, monto: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="tipoPago">Método de Pago *</label>
                <select
                  id="tipoPago"
                  value={formulario.tipo}
                  onChange={(e) =>
                    setFormulario((prev) => ({
                      ...prev,
                      tipo: e.target.value as FormularioPago["tipo"],
                    }))
                  }
                  required
                >
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                  <option value="TARJETA">💳 Tarjeta de Crédito / Débito</option>
                  <option value="PAYPAL">🅿️ PayPal</option>
                  <option value="OTRO">📄 Otro</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="referencia">No. de Referencia / Voucher</label>
                <input
                  id="referencia"
                  type="text"
                  placeholder="Ej. TRANSF-893412 o Recibo #045"
                  value={formulario.referencia}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, referencia: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="estadoPago">Estado de la Transacción *</label>
                <select
                  id="estadoPago"
                  value={formulario.estado}
                  onChange={(e) =>
                    setFormulario((prev) => ({
                      ...prev,
                      estado: e.target.value as "PAGADO" | "PENDIENTE" | "ANULADO",
                    }))
                  }
                  required
                >
                  <option value="PAGADO">Pagado (Fondos confirmados)</option>
                  <option value="PENDIENTE">Pendiente de acreditación</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-button" disabled={guardando}>
                  {guardando ? "Procesando Cobro..." : "Confirmar y Registrar Pago"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={limpiarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* Filtros y Buscador */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por #ID pago, contrato, cliente o referencia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filtro-tipo" style={{ fontSize: "12px", fontWeight: 600 }}>
            Método:
          </label>
          <select
            id="filtro-tipo"
            className="filter-select"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="TODOS">Todos los métodos</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="TARJETA">Tarjeta</option>
            <option value="PAYPAL">PayPal</option>
          </select>

          <label htmlFor="filtro-estado-pago" style={{ fontSize: "12px", fontWeight: 600, marginLeft: "8px" }}>
            Estado:
          </label>
          <select
            id="filtro-estado-pago"
            className="filter-select"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PAGADO">Pagados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="ANULADO">Anulados</option>
          </select>

          {(busqueda || filtroTipo !== "TODOS" || filtroEstado !== "TODOS") && (
            <button
              className="secondary-button"
              style={{ padding: "8px 12px", fontSize: "12px" }}
              onClick={() => {
                setBusqueda("");
                setFiltroTipo("TODOS");
                setFiltroEstado("TODOS");
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>
            Libro de Transacciones{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "13px" }}>
              ({pagosFiltrados.length} de {pagos.length} cobros)
            </span>
          </h2>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando registro de pagos...</strong>
          </div>
        ) : pagosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💳</div>
            <strong>No se encontraron transacciones</strong>
            <span>
              {pagos.length === 0
                ? "Aún no se han registrado cobros ni depósitos. Haz clic en '+ Registrar Pago' para crear el primero."
                : "No hay pagos que coincidan con los filtros seleccionados."}
            </span>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Transacción</th>
                  <th>Fecha</th>
                  <th>Contrato / Cliente</th>
                  <th>Vehículo</th>
                  <th>Método de Pago</th>
                  <th>Referencia</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>#{p.id}</strong>
                    </td>
                    <td>
                      {new Date(p.fecha).toLocaleDateString("es-DO")}{" "}
                      <small style={{ color: "var(--text-secondary)" }}>
                        {new Date(p.fecha).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </small>
                    </td>
                    <td>
                      <div>
                        <strong>Contrato #{p.contratoId}</strong>
                      </div>
                      <small style={{ color: "var(--text-secondary)" }}>
                        {p.contrato?.cliente ? `${p.contrato.cliente.nombre} ${p.contrato.cliente.apellido}` : "-"}
                      </small>
                    </td>
                    <td>
                      {p.contrato?.vehiculo ? (
                        <div>
                          <span>{p.contrato.vehiculo.marca} {p.contrato.vehiculo.modelo}</span>
                          <div><code>{p.contrato.vehiculo.placa}</code></div>
                        </div>
                      ) : "-"}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{iconoTipoPago(p.tipo)}</span>
                    </td>
                    <td>
                      {p.referencia ? <code>{p.referencia}</code> : <span style={{ color: "var(--text-light)" }}>-</span>}
                    </td>
                    <td>
                      <strong style={{ fontSize: "14px", color: p.estado === "PAGADO" ? "var(--success)" : "inherit" }}>
                        ${Number(p.monto).toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          p.estado === "PAGADO"
                            ? "badge-disponible"
                            : p.estado === "PENDIENTE"
                            ? "badge-mantenimiento"
                            : "badge-inactivo"
                        }`}
                      >
                        {p.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                        {p.estado !== "ANULADO" && (
                          <button
                            type="button"
                            className="btn-action-delete"
                            title="Anular pago"
                            onClick={() => anularPago(p.id)}
                          >
                            🚫 Anular
                          </button>
                        )}
                      </div>
                    </td>
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