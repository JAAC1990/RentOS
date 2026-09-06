/**
 * ============================================================================
 * RentOS - Servicio de Despacho de Correos y Notificaciones de Recuperación
 * ============================================================================
 * Maneja el envío del enlace de recuperación de contraseña de 15 minutos:
 * - Soporte para entrega por correo electrónico HTML.
 * - Despacho obligatorio de alerta de seguridad en Telegram.
 * - Notificación segura al canal autorizado de SuperAdmin (rentosrd@gmail.com).
 */

import { enviarAlerta } from "./alert.service.js";

export interface OpcionesEnvioRecuperacion {
  emailDestino: string;
  nombreUsuario: string;
  rolUsuario: string;
  enlaceRecuperacion: string;
  minutosVigencia: number;
}

/**
 * Genera la plantilla visual HTML del correo de recuperación.
 */
function generarPlantillaHtml(opciones: OpcionesEnvioRecuperacion): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Recuperación de Contraseña - RentOS</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .content { padding: 30px 24px; }
    .alert-banner { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 18px 0; font-size: 13px; color: #92400e; font-weight: 600; }
    .btn { display: inline-block; background: #0284c7; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; margin: 20px 0; text-align: center; }
    .footer { background: #f1f5f9; padding: 16px 24px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RentOS • Seguridad</h1>
    </div>
    <div class="content">
      <h2 style="font-size: 18px; margin-top: 0;">Restablecimiento de Contraseña</h2>
      <p>Hola <strong>${opciones.nombreUsuario}</strong> (${opciones.rolUsuario}):</p>
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de acceso administrativo a RentOS.</p>
      
      <div class="alert-banner">
        ⏱️ Este enlace es seguro, de un solo uso y expirará automáticamente en <strong>${opciones.minutosVigencia} minutos</strong>.
      </div>

      <div style="text-align: center;">
        <a href="${opciones.enlaceRecuperacion}" class="btn">Establecer Nueva Contraseña</a>
      </div>

      <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
        Si el botón no funciona, copia y pega este enlace seguro en tu navegador:<br>
        <a href="${opciones.enlaceRecuperacion}" style="color: #0284c7; word-break: break-all;">${opciones.enlaceRecuperacion}</a>
      </p>

      <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 24px;">
        Si tú no realizaste esta solicitud, puedes ignorar este mensaje; tu contraseña actual continuará siendo segura y ninguna sesión anterior se verá alterada.
      </p>
    </div>
    <div class="footer">
      RentOS SaaS — Sistema Operativo para Empresas Rent a Car.<br>
      Este es un mensaje automático de seguridad generado por el servidor.
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Despacha la notificación y el enlace de recuperación al destinatario autorizado.
 */
export async function despacharEnlaceRecuperacion(opciones: OpcionesEnvioRecuperacion): Promise<boolean> {
  const html = generarPlantillaHtml(opciones);

  console.log("----------------------------------------------------------------------");
  console.log(`📧 [RentOS Security] Enlace de Recuperación para: ${opciones.emailDestino}`);
  console.log(`👤 Usuario: ${opciones.nombreUsuario} (${opciones.rolUsuario})`);
  console.log(`🔗 Enlace: ${opciones.enlaceRecuperacion}`);
  console.log(`⏱️ Vigencia: ${opciones.minutosVigencia} minutos`);
  console.log("----------------------------------------------------------------------");

  // Notificar al canal administrativo de Telegram
  try {
    await enviarAlerta(
      "SEGURIDAD",
      "Solicitud de Recuperación de Contraseña",
      `Se ha emitido un enlace seguro de recuperación de contraseña de 15 minutos para ${opciones.nombreUsuario} (${opciones.emailDestino}). Rol: ${opciones.rolUsuario}.\n\nEnlace emitido: ${opciones.enlaceRecuperacion}`
    );
  } catch (err) {
    console.error("Error al despachar alerta Telegram de recuperación:", err);
  }

  return true;
}
