/**
 * ============================================================================
 * RentOS - Servicio Unificado de Alertas y Notificaciones Críticas
 * ============================================================================
 * Proporciona un formato uniforme para el envío de alertas operativas, errores,
 * respaldos completados e incidentes de seguridad hacia los canales del equipo.
 */

import { enviarAlertaTelegram } from "../lib/telegram.js";

// Tipos de severidad y naturaleza de alertas admitidas en el sistema
export type TipoAlerta =
  | "INFO"
  | "AVISO"
  | "ALERTA"
  | "ERROR"
  | "SEGURIDAD";

/**
 * Sanitiza texto para evitar inyecciones de código HTML en el parse_mode de Telegram.
 */
function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Construye una plantilla visual con emoji, encabezado, tipo de severidad y cuerpo
 * del mensaje, y la envía a través del servicio de mensajería disponible.
 *
 * @param tipo - Nivel de severidad (INFO, AVISO, ALERTA, ERROR, SEGURIDAD)
 * @param titulo - Resumen breve del evento
 * @param mensaje - Detalle completo de la operación o error
 */
export async function enviarAlerta(
  tipo: TipoAlerta,
  titulo: string,
  mensaje: string,
): Promise<boolean> {
  const iconos: Record<TipoAlerta, string> = {
    INFO: "ℹ️",
    AVISO: "⚠️",
    ALERTA: "🚨",
    ERROR: "❌",
    SEGURIDAD: "🔐",
  };

  const texto = [
    `${iconos[tipo]} <b>RentOS — ${escaparHtml(titulo)}</b>`,
    "",
    `<b>Tipo:</b> ${tipo}`,
    `<b>Mensaje:</b> ${escaparHtml(mensaje)}`,
    "",
    `<b>Fecha:</b> ${new Date().toISOString()}`,
  ].join("\n");

  return enviarAlertaTelegram(texto);
}
