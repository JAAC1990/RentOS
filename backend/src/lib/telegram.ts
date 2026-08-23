import "dotenv/config";

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

export async function enviarAlertaTelegram(
  mensaje: string,
): Promise<boolean> {
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
