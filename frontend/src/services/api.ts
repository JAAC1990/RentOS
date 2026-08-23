
const API_URL = "http://localhost:3000/api";

export async function getVehiculos() {
  const response = await fetch(`${API_URL}/vehiculos`);

  if (!response.ok) {
    throw new Error("No fue posible obtener los vehículos.");
  }

  return response.json();
}

export async function getClientes() {
  const response = await fetch(`${API_URL}/clientes`);

  if (!response.ok) {
    throw new Error("No fue posible obtener los clientes.");
  }

  return response.json();
}

export async function getContratos() {
  const response = await fetch(`${API_URL}/contratos`);

  if (!response.ok) {
    throw new Error("No fue posible obtener los contratos.");
  }

  return response.json();
}

export async function getEntregas() {
  const response = await fetch(`${API_URL}/entregas`);

  if (!response.ok) {
    throw new Error("No fue posible obtener las entregas.");
  }

  return response.json();
}

export async function getPagos() {
  const response = await fetch(`${API_URL}/pagos`);

  if (!response.ok) {
    throw new Error("No fue posible obtener los pagos.");
  }

  return response.json();
}
