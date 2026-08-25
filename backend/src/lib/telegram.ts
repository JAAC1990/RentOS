/**
 * ============================================================================
 * RentOS - Integración y Notificaciones vía Telegram Bot API
 * ============================================================================
 * Este archivo permite despachar mensajes enriquecidos con formato HTML a un
 * canal o chat grupal de administradores a través del Bot oficial de Telegram.
 */

import "dotenv/config";

// Variables de entorno para autenticación con la API de Telegram
const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

/**
 * Envía un mensaje con formato HTML al chat o canal configurado en Telegram.
 * @param mensaje - Texto estructurado con etiquetas HTML admitidas por Telegram.
 * @returns boolean indicando si el mensaje fue recibido con éxito.
 */
export async function enviarAlertaTelegram(
  mensaje: string,
): Promise<boolean> {
  // Validar si las credenciales del Bot están presentes en el entorno
  if (!botToken || !chatId) {
    console.warn(
      "Telegram no está configurado: faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID.",
    );
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: mensaje,
          parse_mode: "HTML",
        }),
      },
    );

    if (!response.ok) {
      const detalle = await response.text();
      console.error(
        "Error enviando alerta a Telegram:",
        response.status,
        detalle,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error conectando con Telegram:", error);
    return false;
  }
}
