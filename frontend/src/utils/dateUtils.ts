/**
 * ============================================================================
 * RentOS - Utilidades de Formato de Fechas Dominicanas / Latinoamericanas
 * ============================================================================
 * Estandariza la visualización de fechas en toda la aplicación bajo el formato:
 * Día / Mes / Año (DD/MM/YYYY) y Hora de 12h (hh:mm AM/PM).
 */

/**
 * Formatea una fecha a formato día/mes/año (DD/MM/YYYY).
 * Ej: "2026-08-25" -> "25/08/2026"
 * 
 * @param fecha Fecha en string ISO, Date o timestamp
 * @returns String con formato DD/MM/YYYY o cadena vacía si es inválida
 */
export function formatearFecha(fecha: string | Date | null | undefined): string {
  if (!fecha) return "";

  // Si es un string YYYY-MM-DD puro sin zona horaria, evitamos desfases UTC
  if (typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}/.test(fecha)) {
    const fechaPura = fecha.split("T")[0];
    const partes = fechaPura.split("-");
    if (partes.length === 3) {
      const [anio, mes, dia] = partes;
      return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${anio}`;
    }
  }

  const d = typeof fecha === "string" || typeof fecha === "number" ? new Date(fecha) : fecha;
  if (!d || isNaN(d.getTime())) return "";

  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();

  return `${dia}/${mes}/${anio}`;
}

/**
 * Formatea fecha y hora (DD/MM/YYYY, hh:mm AM/PM).
 * Ej: "2026-08-25T14:30:00" -> "25/08/2026, 02:30 PM"
 */
export function formatearFechaHora(fecha: string | Date | null | undefined): string {
  if (!fecha) return "";

  const d = typeof fecha === "string" || typeof fecha === "number" ? new Date(fecha) : fecha;
  if (!d || isNaN(d.getTime())) return "";

  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();

  let horas = d.getHours();
  const minutos = String(d.getMinutes()).padStart(2, "0");
  const ampm = horas >= 12 ? "PM" : "AM";
  horas = horas % 12;
  horas = horas ? horas : 12; // Las 0 horas se convierten en 12
  const horasStr = String(horas).padStart(2, "0");

  return `${dia}/${mes}/${anio} ${horasStr}:${minutos} ${ampm}`;
}

/**
 * Formatea fecha en texto largo en español.
 * Ej: "25 de agosto de 2026"
 */
export function formatearFechaLarga(fecha: string | Date | null | undefined): string {
  if (!fecha) return "";
  const d = typeof fecha === "string" || typeof fecha === "number" ? new Date(fecha) : fecha;
  if (!d || isNaN(d.getTime())) return "";

  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
}
