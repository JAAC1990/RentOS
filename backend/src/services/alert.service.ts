import { enviarAlertaTelegram } from "../lib/telegram.js";

export type TipoAlerta =
  | "INFO"
  | "AVISO"
  | "ALERTA"
  | "ERROR"
  | "SEGURIDAD";

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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
