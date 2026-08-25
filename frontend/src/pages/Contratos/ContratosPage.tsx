/**
 * ============================================================================
 * RentOS - Contratos de Alquiler, Formalización Legal & Validación QR (ContratosPage)
 * ============================================================================
 * Manejo integral de contratos de arrendamiento vehicular:
 * - Selección de cliente y vehículo disponible con cálculo automático de días e importes.
 * - Registro de depósito en garantía, seguro (Full Cover/Full/De Ley), delivery y referencias.
 * - Impresión del Contrato Oficial Dominicano con Diagrama 360°, Checklist de 24 accesorios,
 *   Medidor de Combustible y Código QR de verificación de autenticidad.
 * - Captura de Firma Digital Táctil (Touch Canvas) para firma en celular, tablet o PC.
 * - Selector de Plantilla (Estándar Dominicana vs. Personalizada de la Empresa).
 * - Despacho de Contrato y Enlace de Autenticidad a WhatsApp con 1 solo clic.
 * - Extensiones de renta y finalización con registro de odómetro.
 */

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { API_URLS } from "../../services/api";
import ContratoDominicanoImprimible, { type DatosContratoImpresion } from "../../components/ContratoDominicanoImprimible";
import ModalFirmaDigital from "../../components/ModalFirmaDigital";

type Cliente = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string | null;
  direccion?: string | null;
  documentoNumero?: string | null;
  licenciaNumero?: string | null;
  estado: string;
};

type Vehiculo = {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  placa: string;
  vin?: string | null;
  color: string | null;
  tarifaDiaria: string | number;
  kilometraje: number;
  estado: string;
};

type RentCarInfo = {
  id: number;
  nombre: string;
  rnc: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ciudad: string;
  logoUrl?: string | null;
  colorPrimario?: string | null;
  whatsapp?: string | null;
  moneda: string;
  terminosContrato: string | null;
  tipoPlantillaContrato?: string | null;
  clausulasPersonalizadas?: string | null;
};

type Contrato = {
  id: number;
  codigoVerificacion?: string | null;
  clienteId: number;
  vehiculoId: number;
  fechaInicio: string;
  fechaFin: string;
  tarifaDiaria: string | number;
  precioHora?: string | number | null;
  deposito: string | number;
  cobrosExtra?: string | number | null;
  deliveryMonto?: string | number | null;
  kilometrajeInicial: number;
  kilometrajeFinal: number | null;
  tipoSeguro?: string | null;
  nivelCombustibleSalida?: string | null;
  inventarioChecklist?: Record<string, boolean> | null;
  firmaCliente?: string | null;
  firmaArrendador?: string | null;
  refFamiliarNombre?: string | null;
  refFamiliarTel?: string | null;
  estado: "BORRADOR" | "ACTIVO" | "FINALIZADO" | "CANCELADO";
  observaciones: string | null;
  rentCar?: RentCarInfo;
  cliente: Cliente;
  vehiculo: Vehiculo;
  entrega?: {
    defectos?: Array<{
      descripcion: string;
      ubicacion?: string | null;
      tipoDano?: string | null;
      coordX?: number | null;
      coordY?: number | null;
    }>;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type FormularioContrato = {
  clienteId: string;
  vehiculoId: string;
  fechaInicio: string;
  fechaFin: string;
  tarifaDiaria: string;
  precioHora: string;
  deposito: string;
  cobrosExtra: string;
  deliveryMonto: string;
  kilometrajeInicial: string;
  tipoSeguro: string;
  nivelCombustibleSalida: string;
  refFamiliarNombre: string;
  refFamiliarTel: string;
  estado: "BORRADOR" | "ACTIVO" | "FINALIZADO" | "CANCELADO";
  observaciones: string;
};

const hoy = new Date().toISOString().split("T")[0];
const manana = new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0];

const formularioInicial: FormularioContrato = {
  clienteId: "",
  vehiculoId: "",
  fechaInicio: hoy,
  fechaFin: manana,
  tarifaDiaria: "",
  precioHora: "",
  deposito: "200",
  cobrosExtra: "0",
  deliveryMonto: "0",
  kilometrajeInicial: "0",
  tipoSeguro: "FULL",
  nivelCombustibleSalida: "100%",
  refFamiliarNombre: "",
  refFamiliarTel: "",
  estado: "ACTIVO",
  observaciones: "",
};

export default function ContratosPage() {
  const { tenantActivoId } = useAuth();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [rentCarInfo, setRentCarInfo] = useState<RentCarInfo | null>(null);

  const [formulario, setFormulario] = useState<FormularioContrato>(formularioInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Estados de Modales Especializados
  const [contratoImprimir, setContratoImprimir] = useState<Contrato | null>(null);
  const [contratoFirma, setContratoFirma] = useState<Contrato | null>(null);

  // Extensión de Contrato y Recordatorio de Retorno
  const [contratoExtender, setContratoExtender] = useState<Contrato | null>(null);
  const [diasExtra, setDiasExtra] = useState(1);
  const [guardandoExtension, setGuardandoExtension] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");

  const [error, setError] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const API_CONTRATOS = API_URLS.contratos;

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");

      const targetRentCarId = tenantActivoId || 1;
      const [resContratos, resClientes, resVehiculos, resRentCar] = await Promise.all([
        fetch(`${API_CONTRATOS}?rentCarId=${targetRentCarId}`),
        fetch(API_URLS.clientes),
        fetch(API_URLS.vehiculos),
        fetch(`${API_URLS.rentcars}/${targetRentCarId}`),
      ]);

      if (!resContratos.ok || !resClientes.ok || !resVehiculos.ok) {
        throw new Error("No fue posible cargar la información de contratos.");
      }

      const [datosContratos, datosClientes, datosVehiculos, datosRentCar] = await Promise.all([
        resContratos.json(),
        resClientes.json(),
        resVehiculos.json(),
        resRentCar.ok ? resRentCar.json() : null,
      ]);

      setContratos(datosContratos);
      setClientes(datosClientes);
      setVehiculos(datosVehiculos);
      setRentCarInfo(datosRentCar);
    } catch (err) {
      console.error(err);
      setError("No fue posible conectar con el servidor para cargar contratos.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantActivoId]);

  // Estadísticas en tiempo real
  const stats = useMemo(() => {
    const total = contratos.length;
    const activos = contratos.filter((c) => c.estado === "ACTIVO").length;
    const finalizados = contratos.filter((c) => c.estado === "FINALIZADO").length;
    const borradores = contratos.filter((c) => c.estado === "BORRADOR").length;
    return { total, activos, finalizados, borradores };
  }, [contratos]);

  // Filtrado y búsqueda instantánea
  const contratosFiltrados = useMemo(() => {
    return contratos.filter((c) => {
      const cumpleFiltroEstado =
        filtroEstado === "TODOS" || c.estado === filtroEstado;

      const texto = `${c.id} ${c.codigoVerificacion || ""} ${c.cliente?.nombre || ""} ${c.cliente?.apellido || ""} ${c.vehiculo?.marca || ""} ${c.vehiculo?.modelo || ""} ${c.vehiculo?.placa || ""}`.toLowerCase();
      const cumpleBusqueda = texto.includes(busqueda.toLowerCase());

      return cumpleFiltroEstado && cumpleBusqueda;
    });
  }, [contratos, busqueda, filtroEstado]);

  // Cálculo automático de días y total estimado
  const diasCalculados = useMemo(() => {
    if (!formulario.fechaInicio || !formulario.fechaFin) return 1;
    const inicio = new Date(formulario.fechaInicio).getTime();
    const fin = new Date(formulario.fechaFin).getTime();
    if (fin <= inicio) return 1;
    const diff = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [formulario.fechaInicio, formulario.fechaFin]);

  const totalEstimado = useMemo(() => {
    const tarifa = Number(formulario.tarifaDiaria) || 0;
    const extras = Number(formulario.cobrosExtra) || 0;
    const delivery = Number(formulario.deliveryMonto) || 0;
    const subtotal = diasCalculados * tarifa + extras + delivery;
    return subtotal.toFixed(2);
  }, [diasCalculados, formulario.tarifaDiaria, formulario.cobrosExtra, formulario.deliveryMonto]);

  const handleSeleccionarVehiculo = (vehiculoIdStr: string) => {
    const v = vehiculos.find((item) => item.id === Number(vehiculoIdStr));
    setFormulario((actual) => ({
      ...actual,
      vehiculoId: vehiculoIdStr,
      tarifaDiaria: v ? String(v.tarifaDiaria) : actual.tarifaDiaria,
      kilometrajeInicial: v ? String(v.kilometraje) : actual.kilometrajeInicial,
    }));
  };

  const handleSeleccionarCliente = (clienteIdStr: string) => {
    const c = clientes.find((item) => item.id === Number(clienteIdStr));
    setFormulario((actual) => ({
      ...actual,
      clienteId: clienteIdStr,
      refFamiliarTel: c?.telefono || actual.refFamiliarTel,
    }));
  };

  const validarFormulario = () => {
    setErrorFormulario("");

    if (!formulario.clienteId) {
      setErrorFormulario("Debe seleccionar un cliente.");
      return false;
    }
    if (!formulario.vehiculoId) {
      setErrorFormulario("Debe seleccionar un vehículo.");
      return false;
    }
    if (!formulario.fechaInicio) {
      setErrorFormulario("La fecha de inicio es requerida.");
      return false;
    }
    if (!formulario.fechaFin) {
      setErrorFormulario("La fecha de entrega/fin es requerida.");
      return false;
    }
    if (new Date(formulario.fechaFin) <= new Date(formulario.fechaInicio)) {
      setErrorFormulario("La fecha de fin debe ser posterior a la fecha de inicio.");
      return false;
    }
    if (!formulario.tarifaDiaria || Number(formulario.tarifaDiaria) <= 0) {
      setErrorFormulario("La tarifa diaria debe ser mayor a 0.");
      return false;
    }
    if (Number(formulario.deposito) < 0) {
      setErrorFormulario("El depósito no puede ser negativo.");
      return false;
    }

    return true;
  };

  const limpiarFormulario = () => {
    setFormulario(formularioInicial);
    setEditandoId(null);
    setErrorFormulario("");
    setMostrarFormulario(false);
  };

  const guardarContrato = async () => {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);
      setErrorFormulario("");
      setMensaje("");

      const datos = {
        rentCarId: tenantActivoId || 1,
        clienteId: Number(formulario.clienteId),
        vehiculoId: Number(formulario.vehiculoId),
        fechaInicio: new Date(formulario.fechaInicio).toISOString(),
        fechaFin: new Date(formulario.fechaFin).toISOString(),
        tarifaDiaria: Number(formulario.tarifaDiaria),
        precioHora: formulario.precioHora ? Number(formulario.precioHora) : null,
        deposito: Number(formulario.deposito),
        cobrosExtra: Number(formulario.cobrosExtra || 0),
        deliveryMonto: Number(formulario.deliveryMonto || 0),
        kilometrajeInicial: Number(formulario.kilometrajeInicial),
        tipoSeguro: formulario.tipoSeguro,
        nivelCombustibleSalida: formulario.nivelCombustibleSalida,
        refFamiliarNombre: formulario.refFamiliarNombre.trim() || undefined,
        refFamiliarTel: formulario.refFamiliarTel.trim() || undefined,
        estado: formulario.estado,
        observaciones: formulario.observaciones.trim() || undefined,
      };

      const url = editandoId === null ? API_CONTRATOS : `${API_CONTRATOS}/${editandoId}`;
      const metodo = editandoId === null ? "POST" : "PUT";

      const respuesta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      const resultado = await respuesta.json().catch(() => null);

      if (!respuesta.ok) {
        throw new Error(
          resultado?.error || resultado?.message || "No fue posible guardar el contrato."
        );
      }

      setMensaje(
        editandoId === null
          ? `✅ Contrato formalizado con éxito con código QR de verificación.`
          : "✅ Contrato actualizado correctamente."
      );

      limpiarFormulario();
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setErrorFormulario(
        err instanceof Error ? err.message : "Error al guardar el contrato."
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarFirmaDigital = async (firmaBase64: string) => {
    if (!contratoFirma) return;

    try {
      setError("");
      const res = await fetch(`${API_CONTRATOS}/${contratoFirma.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmaCliente: firmaBase64,
        }),
      });

      if (!res.ok) {
        throw new Error("No fue posible guardar la firma digital del cliente.");
      }

      setMensaje(`✍️ Firma digital del cliente estampada con éxito en el Contrato #${contratoFirma.id}.`);
      setContratoFirma(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al guardar la firma digital.");
    }
  };

  const handleGuardarExtension = async () => {
    if (!contratoExtender) return;
    try {
      setGuardandoExtension(true);
      const fechaFinActual = new Date(contratoExtender.fechaFin);
      const nuevaFechaFin = new Date(fechaFinActual.getTime() + diasExtra * 86400000);
      const nuevaFechaFinStr = nuevaFechaFin.toISOString().split("T")[0];

      const res = await fetch(`${API_CONTRATOS}/${contratoExtender.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fechaFin: nuevaFechaFinStr,
          observaciones: contratoExtender.observaciones
            ? `${contratoExtender.observaciones} | Extensión de ${diasExtra} día(s) aplicada el ${new Date().toLocaleDateString("es-DO")}`
            : `Extensión de ${diasExtra} día(s) aplicada el ${new Date().toLocaleDateString("es-DO")}`,
        }),
      });

      if (!res.ok) {
        throw new Error("No fue posible guardar la extensión del contrato.");
      }

      setMensaje(`✅ Contrato #${contratoExtender.id} extendido por ${diasExtra} día(s) con éxito.`);
      setContratoExtender(null);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al extender contrato.");
    } finally {
      setGuardandoExtension(false);
    }
  };

  const finalizarRenta = async (contrato: Contrato) => {
    const kmFinal = window.prompt(
      `Kilometraje actual al recibir el vehículo (${contrato.vehiculo.marca} ${contrato.vehiculo.modelo}):`,
      String(contrato.vehiculo.kilometraje + 50)
    );

    if (kmFinal === null) return;

    try {
      setError("");
      setMensaje("");

      const respuesta = await fetch(`${API_CONTRATOS}/${contrato.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "FINALIZADO",
          kilometrajeFinal: Number(kmFinal),
        }),
      });

      if (!respuesta.ok) {
        const errorData = await respuesta.json().catch(() => null);
        throw new Error(errorData?.error || "Error al finalizar renta.");
      }

      setMensaje(`🏁 Contrato #${contrato.id} finalizado y vehículo liberado a DISPONIBLE.`);
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "No fue posible finalizar el contrato.");
    }
  };

  const eliminarContrato = async (id: number) => {
    const confirmar = window.confirm(
      "¿Está seguro de que desea anular/eliminar este contrato? El vehículo volverá a estar disponible."
    );
    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      const respuesta = await fetch(`${API_CONTRATOS}/${id}`, {
        method: "DELETE",
      });

      if (!respuesta.ok) {
        throw new Error("No fue posible eliminar el contrato.");
      }

      setMensaje("🗑️ Contrato eliminado y vehículo liberado.");
      await cargarDatos();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error al eliminar contrato.");
    }
  };

  const exportarCSV = () => {
    if (contratos.length === 0) return;

    const encabezados = ["ID", "Codigo QR", "Cliente", "Telefono", "Vehiculo", "Placa", "Fecha Inicio", "Fecha Fin", "Tarifa Diaria", "Deposito", "Estado"];
    const filas = contratos.map((c) => [
      c.id,
      c.codigoVerificacion || `CON-${c.id}`,
      `"${c.cliente?.nombre || ""} ${c.cliente?.apellido || ""}"`,
      `"${c.cliente?.telefono || ""}"`,
      `"${c.vehiculo?.marca || ""} ${c.vehiculo?.modelo || ""}"`,
      `"${c.vehiculo?.placa || ""}"`,
      new Date(c.fechaInicio).toLocaleDateString("es-DO"),
      new Date(c.fechaFin).toLocaleDateString("es-DO"),
      c.tarifaDiaria,
      c.deposito,
      c.estado,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [encabezados.join(","), ...filas.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RentOS_Contratos_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const vehiculosDisponibles = useMemo(() => {
    return vehiculos.filter(
      (v) => v.estado === "DISPONIBLE" || (editandoId !== null && String(v.id) === formulario.vehiculoId)
    );
  }, [vehiculos, editandoId, formulario.vehiculoId]);

  // Prepara objeto completo para el componente de impresión dominicano
  const contratoParaImprimir: DatosContratoImpresion | null = useMemo(() => {
    if (!contratoImprimir) return null;
    return {
      id: contratoImprimir.id,
      codigoVerificacion: contratoImprimir.codigoVerificacion,
      fechaInicio: contratoImprimir.fechaInicio,
      fechaFin: contratoImprimir.fechaFin,
      tarifaDiaria: contratoImprimir.tarifaDiaria,
      precioHora: contratoImprimir.precioHora,
      deposito: contratoImprimir.deposito,
      cobrosExtra: contratoImprimir.cobrosExtra,
      deliveryMonto: contratoImprimir.deliveryMonto,
      kilometrajeInicial: contratoImprimir.kilometrajeInicial,
      kilometrajeFinal: contratoImprimir.kilometrajeFinal,
      tipoSeguro: contratoImprimir.tipoSeguro,
      nivelCombustibleSalida: contratoImprimir.nivelCombustibleSalida,
      inventarioChecklist: contratoImprimir.inventarioChecklist,
      firmaCliente: contratoImprimir.firmaCliente,
      firmaArrendador: contratoImprimir.firmaArrendador,
      refFamiliarNombre: contratoImprimir.refFamiliarNombre,
      refFamiliarTel: contratoImprimir.refFamiliarTel,
      observaciones: contratoImprimir.observaciones,
      rentCar: contratoImprimir.rentCar || rentCarInfo || {
        id: tenantActivoId || 1,
        nombre: "RentOS Dominicana",
        ciudad: "Santo Domingo",
        moneda: "USD",
        terminosContrato: null,
      },
      cliente: contratoImprimir.cliente,
      vehiculo: contratoImprimir.vehiculo,
      entrega: contratoImprimir.entrega,
    };
  }, [contratoImprimir, rentCarInfo, tenantActivoId]);

  return (
    <div className="contratos-container">
      {/* Encabezado Principal */}
      <div className="page-heading">
        <div>
          <h1>Contratos & Formalización Legal</h1>
          <p>Genera contratos oficiales auto-rellenables con QR de legitimidad, diagramas 360° y firma digital.</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button className="secondary-button" onClick={exportarCSV}>
            📥 Exportar CSV
          </button>
          <button
            className="primary-button"
            onClick={() => {
              limpiarFormulario();
              setMostrarFormulario(true);
            }}
          >
            + Formalizar Nuevo Contrato
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas de Flota y Contratos */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-title">Total Contratos</span>
          <span className="metric-value">{stats.total}</span>
          <span className="metric-caption">Historial completo</span>
        </div>
        <div className="metric-card success">
          <span className="metric-title">Autos en Renta (Activos)</span>
          <span className="metric-value">{stats.activos}</span>
          <span className="metric-caption">Flota en posesión de clientes</span>
        </div>
        <div className="metric-card warning">
          <span className="metric-title">Reservas / Borradores</span>
          <span className="metric-value">{stats.borradores}</span>
          <span className="metric-caption">Pendientes de despacho</span>
        </div>
        <div className="metric-card">
          <span className="metric-title">Finalizados</span>
          <span className="metric-value">{stats.finalizados}</span>
          <span className="metric-caption">Vehículos devueltos con éxito</span>
        </div>
      </div>

      {/* Alertas */}
      {mensaje && <div className="alert-box success">{mensaje}</div>}
      {error && <div className="alert-box error">{error}</div>}

      {/* Formulario de Contrato */}
      {mostrarFormulario && (
        <section className="content-panel" id="formulario-contrato">
          <div className="panel-header">
            <h2>{editandoId === null ? "Formalizar Nuevo Contrato de Renta" : "Modificar Contrato"}</h2>
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
              guardarContrato();
            }}
          >
            <div className="form-grid">
              {/* Selección de Cliente y Vehículo */}
              <div className="form-field">
                <label htmlFor="clienteId">Cliente Arrendatario *</label>
                <select
                  id="clienteId"
                  value={formulario.clienteId}
                  onChange={(e) => handleSeleccionarCliente(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {clientes
                    .filter((c) => c.estado !== "BLOQUEADO")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellido} ({c.telefono})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="vehiculoId">Vehículo a Rentar *</label>
                <select
                  id="vehiculoId"
                  value={formulario.vehiculoId}
                  onChange={(e) => handleSeleccionarVehiculo(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar Vehículo --</option>
                  {vehiculosDisponibles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} {v.anio} • Placa: {v.placa} (${Number(v.tarifaDiaria)}/día)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="estadoContrato">Estado Inicial del Contrato *</label>
                <select
                  id="estadoContrato"
                  value={formulario.estado}
                  onChange={(e) =>
                    setFormulario((prev) => ({
                      ...prev,
                      estado: e.target.value as "BORRADOR" | "ACTIVO" | "FINALIZADO" | "CANCELADO",
                    }))
                  }
                  required
                >
                  <option value="ACTIVO">Activo (Vehículo en posesión del cliente)</option>
                  <option value="BORRADOR">Borrador / Reserva preliminar</option>
                </select>
              </div>

              {/* Fechas de Renta */}
              <div className="form-field">
                <label htmlFor="fechaInicio">Fecha & Hora de Salida *</label>
                <input
                  id="fechaInicio"
                  type="date"
                  value={formulario.fechaInicio}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, fechaInicio: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="fechaFin">Fecha de Devolución Estimada *</label>
                <input
                  id="fechaFin"
                  type="date"
                  value={formulario.fechaFin}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, fechaFin: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="tipoSeguro">Cobertura de Seguro *</label>
                <select
                  id="tipoSeguro"
                  value={formulario.tipoSeguro}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, tipoSeguro: e.target.value }))
                  }
                >
                  <option value="FULL">Seguro Full (Estándar)</option>
                  <option value="FULL_COVER">Full Cover (Cero Deducible)</option>
                  <option value="LEY">Seguro Obligatorio de Ley</option>
                </select>
              </div>

              {/* Tarifas y Depósito */}
              <div className="form-field">
                <label htmlFor="tarifaDiaria">Tarifa Diaria ({rentCarInfo?.moneda || "USD"}) *</label>
                <input
                  id="tarifaDiaria"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Tarifa por día"
                  value={formulario.tarifaDiaria}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, tarifaDiaria: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="deposito">Depósito de Garantía ({rentCarInfo?.moneda || "USD"}) *</label>
                <input
                  id="deposito"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Monto de depósito"
                  value={formulario.deposito}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, deposito: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="deliveryMonto">Cargo Delivery / Aeropuerto ({rentCarInfo?.moneda || "USD"})</label>
                <input
                  id="deliveryMonto"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formulario.deliveryMonto}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, deliveryMonto: e.target.value }))
                  }
                />
              </div>

              {/* Kilometraje y Nivel de Gasolina */}
              <div className="form-field">
                <label htmlFor="kilometrajeInicial">Kilometraje de Salida (km)</label>
                <input
                  id="kilometrajeInicial"
                  type="number"
                  min="0"
                  value={formulario.kilometrajeInicial}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, kilometrajeInicial: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="nivelCombustibleSalida">Nivel Combustible Salida</label>
                <select
                  id="nivelCombustibleSalida"
                  value={formulario.nivelCombustibleSalida}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, nivelCombustibleSalida: e.target.value }))
                  }
                >
                  <option value="100%">100% (Tanque Lleno - F)</option>
                  <option value="75%">75% (3/4 de Tanque)</option>
                  <option value="50%">50% (Medio Tanque - 1/2)</option>
                  <option value="25%">25% (1/4 de Tanque)</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="cobrosExtra">Cobros Extra / Adicionales ({rentCarInfo?.moneda || "USD"})</label>
                <input
                  id="cobrosExtra"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formulario.cobrosExtra}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, cobrosExtra: e.target.value }))
                  }
                />
              </div>

              {/* Referencias Familiares */}
              <div className="form-field">
                <label htmlFor="refFamiliarNombre">Nombre de Referencia Familiar</label>
                <input
                  id="refFamiliarNombre"
                  type="text"
                  placeholder="Ej. María Pérez (Hermana)"
                  value={formulario.refFamiliarNombre}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, refFamiliarNombre: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="refFamiliarTel">Teléfono Referencia Familiar</label>
                <input
                  id="refFamiliarTel"
                  type="text"
                  placeholder="Ej. 809-555-9988"
                  value={formulario.refFamiliarTel}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, refFamiliarTel: e.target.value }))
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="precioHora">Precio Hora Extra (Opcional)</label>
                <input
                  id="precioHora"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej. 10.00"
                  value={formulario.precioHora}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, precioHora: e.target.value }))
                  }
                />
              </div>

              {/* Resumen Calculado de la Renta */}
              <div
                style={{
                  gridColumn: "span 3",
                  background: "var(--primary-soft)",
                  padding: "16px 20px",
                  borderRadius: "10px",
                  border: "1px solid #bfdbfe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <strong style={{ color: "var(--primary)", fontSize: "14px" }}>
                    Resumen Estimado: {diasCalculados} {diasCalculados === 1 ? "día" : "días"} de renta
                  </strong>
                  <div style={{ color: "var(--text-secondary)", fontSize: "12px", marginTop: "2px" }}>
                    Tarifa diaria: ${Number(formulario.tarifaDiaria || 0).toFixed(2)} • Depósito: ${Number(formulario.deposito || 0).toFixed(2)} • Extras/Delivery: ${(Number(formulario.cobrosExtra || 0) + Number(formulario.deliveryMonto || 0)).toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block" }}>
                    Total Alquiler Estimado:
                  </span>
                  <strong style={{ fontSize: "22px", color: "var(--primary)" }}>
                    ${totalEstimado} {rentCarInfo?.moneda || "USD"}
                  </strong>
                </div>
              </div>

              <div className="form-field" style={{ gridColumn: "span 3" }}>
                <label htmlFor="observaciones">Observaciones / Condiciones Especiales</label>
                <input
                  id="observaciones"
                  type="text"
                  placeholder="Ej. Vehículo entregado impecable, incluye silla para bebé y GPS."
                  value={formulario.observaciones}
                  onChange={(e) =>
                    setFormulario((prev) => ({ ...prev, observaciones: e.target.value }))
                  }
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={limpiarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={guardando}
                >
                  {guardando
                    ? "Procesando..."
                    : editandoId === null
                    ? "🚀 Formalizar & Generar Contrato con QR"
                    : "Actualizar Contrato"}
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* Controles de Búsqueda y Filtros */}
      <div className="controls-panel">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por código QR, cliente, vehículo o placa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="filtroEstado">Estado:</label>
          <select
            id="filtroEstado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">En posesión (Activo)</option>
            <option value="BORRADOR">Borrador / Reserva</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Tabla Principal de Contratos */}
      <div className="content-panel">
        <div className="panel-header">
          <h2>Expedientes de Contratos ({contratosFiltrados.length})</h2>
        </div>

        {cargando ? (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <strong>Cargando contratos y flota...</strong>
          </div>
        ) : contratosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <strong>No se encontraron contratos registrados</strong>
            <p>Formaliza un nuevo contrato de renta para comenzar.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. / Código QR</th>
                  <th>Cliente Arrendatario</th>
                  <th>Vehículo Asignado</th>
                  <th>Período de Renta</th>
                  <th>Importes & Depósito</th>
                  <th>Firma & Seguridad</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contratosFiltrados.map((c) => {
                  const dias = Math.max(
                    1,
                    Math.ceil((new Date(c.fechaFin).getTime() - new Date(c.fechaInicio).getTime()) / (1000 * 60 * 60 * 24))
                  );
                  const total = (dias * Number(c.tarifaDiaria) + Number(c.cobrosExtra || 0) + Number(c.deliveryMonto || 0)).toFixed(2);
                  const codigoQr = c.codigoVerificacion || `CON-${c.id}`;

                  return (
                    <tr key={c.id}>
                      <td>
                        <strong style={{ color: "var(--primary)", display: "block" }}>
                          #{c.id}
                        </strong>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                          {codigoQr}
                        </span>
                      </td>
                      <td>
                        <strong>
                          {c.cliente?.nombre} {c.cliente?.apellido}
                        </strong>
                        <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                          Tel: {c.cliente?.telefono}
                        </div>
                      </td>
                      <td>
                        <strong>
                          {c.vehiculo?.marca} {c.vehiculo?.modelo} ({c.vehiculo?.anio})
                        </strong>
                        <div style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                          Placa: <b>{c.vehiculo?.placa}</b> • {c.tipoSeguro || "FULL"}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "12px" }}>
                          {new Date(c.fechaInicio).toLocaleDateString("es-DO")} ➔ {new Date(c.fechaFin).toLocaleDateString("es-DO")}
                        </div>
                        <small style={{ color: "var(--text-secondary)" }}>
                          ({dias} {dias === 1 ? "día" : "días"})
                        </small>
                      </td>
                      <td>
                        <div style={{ fontWeight: "bold", color: "var(--primary)" }}>
                          ${total} {rentCarInfo?.moneda || "USD"}
                        </div>
                        <small style={{ color: "var(--text-secondary)", fontSize: "11px" }}>
                          Depósito: ${Number(c.deposito)}
                        </small>
                      </td>
                      <td>
                        {c.firmaCliente ? (
                          <span style={{ color: "var(--success)", fontSize: "12px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                            ✍️ Firmado
                          </span>
                        ) : (
                          <span style={{ color: "var(--warning)", fontSize: "11px" }}>
                            ⚠️ Sin firma
                          </span>
                        )}
                        <a
                          href={`/verificar/${codigoQr}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: "10px", color: "var(--primary)", textDecoration: "none", display: "block", marginTop: "2px" }}
                        >
                          🛡️ Ver Sello QR ↗
                        </a>
                      </td>
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
                      <td style={{ textAlign: "right" }}>
                        <div className="actions-cell" style={{ justifyContent: "flex-end", flexWrap: "wrap", gap: "4px" }}>
                          {/* Ver / Imprimir Contrato Dominicano Oficial */}
                          <button
                            type="button"
                            className="btn-action-edit"
                            style={{ background: "#1e3a8a", color: "#ffffff", borderColor: "#1e3a8a", fontWeight: 700 }}
                            title="Ver e Imprimir Contrato Oficial Dominicano"
                            onClick={() => setContratoImprimir(c)}
                          >
                            📄 Contrato QR
                          </button>

                          {/* Capturar Firma Digital Táctil */}
                          <button
                            type="button"
                            className="btn-action-edit"
                            style={{ background: "#e0f2fe", color: "#0369a1", borderColor: "#bae6fd" }}
                            title="Estampar Firma Digital Táctil del Arrendatario"
                            onClick={() => setContratoFirma(c)}
                          >
                            ✍️ Firmar
                          </button>

                          {/* Enviar Contrato y Enlace de Autenticidad por WhatsApp */}
                          <button
                            type="button"
                            className="btn-action-edit"
                            style={{ background: "#dcfce7", color: "#15803d", borderColor: "#bbf7d0" }}
                            title="Enviar Contrato y Enlace de Verificación por WhatsApp"
                            onClick={() => {
                              const tel = c.cliente?.telefono ? c.cliente.telefono.replace(/[^0-9]/g, "") : "";
                              const linkVerificacion = `${window.location.origin}/verificar/${codigoQr}`;
                              const texto = `Hola *${c.cliente?.nombre}*, te adjuntamos los detalles oficiales de tu Contrato de Alquiler No. *${codigoQr}* con *${rentCarInfo?.nombre || "RentOS"}*:\n\n🚗 *Vehículo:* ${c.vehiculo?.marca} ${c.vehiculo?.modelo} (Placa *${c.vehiculo?.placa}*)\n📅 *Período:* ${new Date(c.fechaInicio).toLocaleDateString("es-DO")} al ${new Date(c.fechaFin).toLocaleDateString("es-DO")} (${dias} días)\n💰 *Total:* $${total} ${rentCarInfo?.moneda || "USD"}\n🛡️ *Depósito:* $${Number(c.deposito).toFixed(2)}\n\n🛡️ *Enlace Oficial de Verificación QR de Legitimidad:*\n${linkVerificacion}\n\n¡Gracias por preferirnos!`;
                              window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, "_blank");
                            }}
                          >
                            💬 WhatsApp
                          </button>

                          {c.estado === "ACTIVO" && (
                            <>
                              <button
                                type="button"
                                className="btn-action-edit"
                                style={{ background: "#ede9fe", color: "#6d28d9", borderColor: "#ddd6fe" }}
                                title="Extender Días de Renta"
                                onClick={() => {
                                  setContratoExtender(c);
                                  setDiasExtra(1);
                                }}
                              >
                                ➕ Extender
                              </button>

                              <button
                                type="button"
                                className="btn-action-edit"
                                style={{ background: "var(--success-soft)", borderColor: "#bbf7d0", color: "var(--success)" }}
                                onClick={() => finalizarRenta(c)}
                              >
                                🏁 Finalizar
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => eliminarContrato(c.id)}
                            title="Eliminar Contrato"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Extensión de Días */}
      {contratoExtender && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-card" style={{ maxWidth: "440px" }}>
            <div className="modal-header">
              <h3>⏱️ Extender Alquiler</h3>
              <button
                type="button"
                className="close-button"
                onClick={() => setContratoExtender(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ padding: "20px" }}>
              <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--text-secondary)" }}>
                Contrato <b>#{contratoExtender.id}</b> • Cliente: <b>{contratoExtender.cliente?.nombre} {contratoExtender.cliente?.apellido}</b>
              </p>
              <div className="form-field" style={{ marginBottom: "16px" }}>
                <label htmlFor="diasExtraInput">¿Cuántos días adicionales deseas agregar?</label>
                <input
                  id="diasExtraInput"
                  type="number"
                  min="1"
                  max="60"
                  value={diasExtra}
                  onChange={(e) => setDiasExtra(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div style={{ background: "var(--primary-soft)", padding: "12px", borderRadius: "8px", fontSize: "13px", color: "var(--primary)" }}>
                Nueva Fecha de Retorno: <b>{new Date(new Date(contratoExtender.fechaFin).getTime() + diasExtra * 86400000).toLocaleDateString("es-DO")}</b>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: "12px 20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setContratoExtender(null)}
                disabled={guardandoExtension}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleGuardarExtension}
                disabled={guardandoExtension}
              >
                {guardandoExtension ? "Extendiendo..." : "💾 Confirmar Extensión"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Captura de Firma Digital Táctil */}
      {contratoFirma && (
        <ModalFirmaDigital
          titulo={`Firma Digital de Arrendatario - Contrato #${contratoFirma.id}`}
          subtitulo={`Firma del cliente ${contratoFirma.cliente?.nombre} ${contratoFirma.cliente?.apellido}`}
          firmaExistente={contratoFirma.firmaCliente}
          onGuardar={handleGuardarFirmaDigital}
          onCerrar={() => setContratoFirma(null)}
        />
      )}

      {/* Modal de Impresión de Contrato Oficial Dominicano Auto-rellenable */}
      {contratoParaImprimir && (
        <ContratoDominicanoImprimible
          contrato={contratoParaImprimir}
          onCerrar={() => setContratoImprimir(null)}
        />
      )}
    </div>
  );
}