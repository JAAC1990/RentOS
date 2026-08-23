import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { enviarAlerta } from "../backend/src/services/alert.service.js";

async function test() {
  console.log("Probando envío de notificación de respaldo a Telegram...");
  console.log("Bot Token:", process.env.TELEGRAM_BOT_TOKEN ? "Configurado" : "Faltante");
  console.log("Chat ID:", process.env.TELEGRAM_CHAT_ID ? "Configurado" : "Faltante");

  const enviado = await enviarAlerta(
    "INFO",
    "Copia de Seguridad Realizada (Backup)",
    "Se ha generado y validado con éxito el respaldo de la base de datos PostgreSQL de RentOS (Rent Operating System)."
  );

  if (enviado) {
    console.log("✅ ¡Notificación de Telegram enviada exitosamente!");
  } else {
    console.log("❌ No se pudo enviar el mensaje a Telegram.");
  }
}

test();
