/**
 * ============================================================================
 * RentOS - Servicio Centralizado de Endpoints API (Frontend)
 * ============================================================================
 * Centraliza las URLs base de conexión al backend REST y provee funciones
 * tipadas para consultar vehículos, clientes, contratos, entregas y pagos.
 */

// URL base dinámica con soporte para variables de entorno de producción o proxy relativo
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Diccionario de endpoints de todos los micro-módulos del sistema
export const API_URLS = {
  vehiculos: `${API_BASE_URL}/vehiculos`,
  clientes: `${API_BASE_URL}/clientes`,
  contratos: `${API_BASE_URL}/contratos`,
  entregas: `${API_BASE_URL}/entregas`,
  pagos: `${API_BASE_URL}/pagos`,
  mantenimientos: `${API_BASE_URL}/mantenimientos`,
  contabilidad: `${API_BASE_URL}/contabilidad`,
  gastos: `${API_BASE_URL}/gastos`,
  gps: `${API_BASE_URL}/gps`,
  users: `${API_BASE_URL}/users`,
  auth: `${API_BASE_URL}/auth`,
  credito: `${API_BASE_URL}/credito`,
  red: `${API_BASE_URL}/red`,
  rentcars: `${API_BASE_URL}/rentcars`,
  solicitudes: `${API_BASE_URL}/solicitudes`,
  backup: `${API_BASE_URL}/backups`,
  tasaCambio: `${API_BASE_URL}/tasa-cambio`,
};

/**
 * Consulta la lista de vehículos disponibles en el backend.
 */
export async function getVehiculos() {
  const response = await fetch(API_URLS.vehiculos);
  if (!response.ok) {
    throw new Error("No fue posible obtener los vehículos.");
  }
  return response.json();
}

/**
 * Consulta la lista de clientes registrados.
 */
export async function getClientes() {
  const response = await fetch(API_URLS.clientes);
  if (!response.ok) {
    throw new Error("No fue posible obtener los clientes.");
  }
  return response.json();
}

/**
 * Consulta la lista de contratos de alquiler.
 */
export async function getContratos() {
  const response = await fetch(API_URLS.contratos);
  if (!response.ok) {
    throw new Error("No fue posible obtener los contratos.");
  }
  return response.json();
}

/**
 * Consulta el historial de recepciones e inspecciones 360°.
 */
export async function getEntregas() {
  const response = await fetch(API_URLS.entregas);
  if (!response.ok) {
    throw new Error("No fue posible obtener las entregas.");
  }
  return response.json();
}

/**
 * Consulta los pagos y cobros registrados.
 */
export async function getPagos() {
  const response = await fetch(API_URLS.pagos);
  if (!response.ok) {
    throw new Error("No fue posible obtener los pagos.");
  }
  return response.json();
}
