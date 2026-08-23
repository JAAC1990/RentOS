/**
 * Servicio centralizado de API para RentOS Frontend.
 * Utiliza variables de entorno (VITE_API_URL) con fallback a localhost:3000/api.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const API_URLS = {
  vehiculos: `${API_BASE_URL}/vehiculos`,
  clientes: `${API_BASE_URL}/clientes`,
  contratos: `${API_BASE_URL}/contratos`,
  entregas: `${API_BASE_URL}/entregas`,
  pagos: `${API_BASE_URL}/pagos`,
  mantenimientos: `${API_BASE_URL}/mantenimientos`,
  backup: `${API_BASE_URL}/backup`,
};

export async function getVehiculos() {
  const response = await fetch(API_URLS.vehiculos);
  if (!response.ok) {
    throw new Error("No fue posible obtener los vehículos.");
  }
  return response.json();
}

export async function getClientes() {
  const response = await fetch(API_URLS.clientes);
  if (!response.ok) {
    throw new Error("No fue posible obtener los clientes.");
  }
  return response.json();
}

export async function getContratos() {
  const response = await fetch(API_URLS.contratos);
  if (!response.ok) {
    throw new Error("No fue posible obtener los contratos.");
  }
  return response.json();
}

export async function getEntregas() {
  const response = await fetch(API_URLS.entregas);
  if (!response.ok) {
    throw new Error("No fue posible obtener las entregas.");
  }
  return response.json();
}

export async function getPagos() {
  const response = await fetch(API_URLS.pagos);
  if (!response.ok) {
    throw new Error("No fue posible obtener los pagos.");
  }
  return response.json();
}
