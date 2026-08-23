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

type RentCarInfo = {
  nombre: string;
  rnc: string | null;
  telefono: string | null;
  direccion: string | null;
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
  const [rentCarInfo, setRentCarInfo] = useState<RentCarInfo | null>(null);

  const [formulario, setFormulario] = useState<FormularioPago>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [pagoImprimir, setPagoImprimir] = useState<Pago | null>(null);

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

      const [resPagos, resContratos, resRentCar] = await Promise.all([
        fetch(API_PAGOS),
        fetch(API_URLS.contratos),
        fetch(`${API_URLS.rentcars}/1`),
      ]);

      if (!resPagos.ok || !resContratos.ok) {
        throw new Error("No fue posible obtener la información de pagos.");
      }

      const [datosPagos, datosContratos, datosRentCar] = await Promise.all([
        resPagos.json(),
        resContratos.json(),
        resRentCar.ok ? resRentCar.json() : null,
      ]);

      setPagos(datosPagos);
      setContratos(datosContratos);
      setRentCarInfo(datosRentCar);
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

  const exportarCSV = () => {
    if (pagos.length === 0) return;

    const encabezados = ["ID", "Fecha", "Contrato ID", "Cliente", "Vehiculo", "Placa", "Metodo", "Referencia", "Monto", "Estado"];
    const filas = pagos.map((p) => [
      p.id,
      new Date(p.fecha).toLocaleDateString("es-DO"),
      p.contratoId,
      `"${p.contrato?.cliente?.nombre || ""} ${p.contrato?.cliente?.apellido || ""}"`,
      `"${p.contrato?.vehiculo?.marca || ""} ${p.contrato?.vehiculo?.modelo || ""}"`,
      `"${p.contrato?.vehiculo?.placa || ""}"`,
      p.tipo,
      `"${p.referencia || ""}"`,
      p.monto,
      p.estado,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [encabezados.join(","), ...filas.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RentOS_Pagos_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary-button" onClick={exportarCSV}>
            📥 Exportar CSV
          </button>
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
                        <button
                          type="button"
                          className="btn-action-edit"
                          style={{ background: "#f1f5f9", color: "#334155" }}
                          title="Ver e Imprimir Recibo"
                          onClick={() => setPagoImprimir(p)}
                        >
                          🖨️ Recibo
                        </button>
                        <button
                          type="button"
                          className="btn-action-edit"
                          style={{ background: "#dcfce7", color: "#15803d", borderColor: "#bbf7d0" }}
                          title="Enviar Recibo por WhatsApp al Cliente"
                          onClick={() => {
                            const tel = p.contrato?.cliente?.telefono ? p.contrato.cliente.telefono.replace(/[^0-9]/g, "") : "";
                            const texto = `Hola *${p.contrato?.cliente?.nombre || "Cliente"}*, te confirmamos la recepción de tu pago:\n\n🧾 *Recibo:* #${String(p.id).padStart(6, "0")}\n💰 *Monto:* $${Number(p.monto).toFixed(2)} USD\n💳 *Método:* ${p.tipo}\n🚗 *Vehículo:* ${p.contrato?.vehiculo?.marca || ""} ${p.contrato?.vehiculo?.modelo || ""} (${p.contrato?.vehiculo?.placa || ""})\n📅 *Fecha:* ${new Date(p.fecha).toLocaleDateString("es-DO")}\n\n¡Comprobante procesado con éxito por *${rentCarInfo?.nombre || "RentOS"}*!`;
                            window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, "_blank");
                          }}
                        >
                          💬 WhatsApp
                        </button>
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

      {/* Modal de Recibo Oficial Imprimible */}
      {pagoImprimir && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              maxWidth: "550px",
              width: "100%",
              padding: "32px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)",
              color: "#1e293b",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div style={{ textAlign: "center", borderBottom: "2px dashed #cbd5e1", paddingBottom: "16px", marginBottom: "16px" }}>
              <h2 style={{ margin: "0 0 4px 0", fontSize: "18px", color: "var(--primary)" }}>
                {rentCarInfo?.nombre || "RentOS Principal"}
              </h2>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                RNC: {rentCarInfo?.rnc || "1-31-00000-1"} • Tel: {rentCarInfo?.telefono || "(809) 555-0199"}
              </div>
              <div style={{ fontSize: "15px", fontWeight: "bold", marginTop: "10px", color: "#334155" }}>
                RECIBO OFICIAL DE PAGO #{String(pagoImprimir.id).padStart(6, "0")}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                Fecha y Hora: {new Date(pagoImprimir.fecha).toLocaleString("es-DO")}
              </div>
            </div>

            <div style={{ fontSize: "13px", lineHeight: "1.8", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Recibido de:</span>
                <strong>
                  {pagoImprimir.contrato?.cliente
                    ? `${pagoImprimir.contrato.cliente.nombre} ${pagoImprimir.contrato.cliente.apellido}`
                    : "Cliente"}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Por concepto de:</span>
                <span>Renta Contrato #{pagoImprimir.contratoId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Vehículo:</span>
                <span>
                  {pagoImprimir.contrato?.vehiculo?.marca} {pagoImprimir.contrato?.vehiculo?.modelo} (
                  <code>{pagoImprimir.contrato?.vehiculo?.placa}</code>)
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Método de Pago:</span>
                <span>{iconoTipoPago(pagoImprimir.tipo)}</span>
              </div>
              {pagoImprimir.referencia && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748b" }}>Referencia / Voucher:</span>
                  <code>{pagoImprimir.referencia}</code>
                </div>
              )}
            </div>

            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                padding: "16px",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <strong style={{ fontSize: "14px" }}>TOTAL PAGADO:</strong>
              <strong style={{ fontSize: "22px", color: "var(--success)" }}>
                ${Number(pagoImprimir.monto).toFixed(2)}
              </strong>
            </div>

            <div style={{ textAlign: "center", borderTop: "1px solid #cbd5e1", paddingTop: "20px" }}>
              <div style={{ width: "180px", borderTop: "1px solid #94a3b8", margin: "0 auto 6px auto" }} />
              <div style={{ fontSize: "11px", color: "#64748b" }}>Firma Autorizada / Caja</div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPagoImprimir(null)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => window.print()}
              >
                🖨️ Imprimir Recibo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}