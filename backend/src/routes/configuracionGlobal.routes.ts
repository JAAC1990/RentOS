/**
 * ============================================================================
 * RentOS - Configuración Global y Marca de Super Admin (White-Label Plataforma)
 * ============================================================================
 * Permite al SuperAdmin parametrizar:
 * - Nombre y eslogan oficial de la plataforma RentOS.
 * - Logotipo, favicon y paleta de colores corporativos del sistema.
 * - Canales oficiales de soporte, correo de recuperación y WhatsApp central.
 * - Políticas de seguridad (expiración de enlaces, intentos fallidos, bloqueos).
 * - Control global de tasa de cambio (BCRD automático vs forzado manual).
 * - Mega-anuncio broadcast a todos los Rent a Cars en sus pantallas.
 * - Términos de servicio y políticas de uso de la red.
 */

import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

export interface ConfiguracionGlobalData {
  id: number;
  nombrePlataforma: string;
  esloganPlataforma: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  colorPrimario: string;
  colorAcento: string;
  emailSoporte: string;
  telefonoSoporte: string;
  whatsappSoporte: string;
  tiempoExpiracionTokenMin: number;
  maxIntentosFallidos: number;
  tiempoBloqueoMin: number;
  modoTasa: "AUTOMATICO_BCRD" | "MANUAL";
  tasaManual: number | null;
  margenTasaDop: number;
  anuncioActivo: boolean;
  anuncioMensaje: string;
  anuncioTipo: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
  permitirRegistroPublico: boolean;
  terminosServicio: string;
  politicaPrivacidad: string;
  updatedAt?: string;
}

const DEFAULT_CONFIG: ConfiguracionGlobalData = {
  id: 1,
  nombrePlataforma: "RentOS Global",
  esloganPlataforma: "Consola de Administración Central Multi-Tenant",
  logoUrl: null,
  faviconUrl: null,
  colorPrimario: "#0284c7",
  colorAcento: "#38bdf8",
  emailSoporte: "rentosrd@gmail.com",
  telefonoSoporte: "(809) 555-0100",
  whatsappSoporte: "18095550100",
  tiempoExpiracionTokenMin: 15,
  maxIntentosFallidos: 5,
  tiempoBloqueoMin: 15,
  modoTasa: "AUTOMATICO_BCRD",
  tasaManual: null,
  margenTasaDop: 0.0,
  anuncioActivo: false,
  anuncioMensaje: "Bienvenido a la red de RentOS. Sistema operativo para Rent a Cars.",
  anuncioTipo: "INFO",
  permitirRegistroPublico: true,
  terminosServicio: "El uso de la plataforma RentOS está reservado a empresas autorizadas y suscriptores de la red.",
  politicaPrivacidad: "La información de clientes, contratos y pagos está estrictamente protegida por aislamiento multi-tenant.",
};

let memoriaConfig: ConfiguracionGlobalData = { ...DEFAULT_CONFIG };
let tablaInicializada = false;

/**
 * Garantiza que la tabla 'configuracion_global' exista en PostgreSQL
 */
async function asegurarTabla(): Promise<void> {
  if (tablaInicializada) return;
  try {
    const ddl = `
      CREATE TABLE IF NOT EXISTS configuracion_global (
        id INT PRIMARY KEY DEFAULT 1,
        nombre_plataforma VARCHAR(255) DEFAULT 'RentOS Global',
        eslogan_plataforma TEXT DEFAULT 'Consola de Administración Central Multi-Tenant',
        logo_url TEXT,
        favicon_url TEXT,
        color_primario VARCHAR(50) DEFAULT '#0284c7',
        color_acento VARCHAR(50) DEFAULT '#38bdf8',
        email_soporte VARCHAR(255) DEFAULT 'rentosrd@gmail.com',
        telefono_soporte VARCHAR(50) DEFAULT '(809) 555-0100',
        whatsapp_soporte VARCHAR(50) DEFAULT '18095550100',
        tiempo_expiracion_token_min INT DEFAULT 15,
        max_intentos_fallidos INT DEFAULT 5,
        tiempo_bloqueo_min INT DEFAULT 15,
        modo_tasa VARCHAR(50) DEFAULT 'AUTOMATICO_BCRD',
        tasa_manual NUMERIC(10,2),
        margen_tasa_dop NUMERIC(10,2) DEFAULT 0.00,
        anuncio_activo BOOLEAN DEFAULT false,
        anuncio_mensaje TEXT DEFAULT 'Bienvenido a la red de RentOS. Sistema operativo para Rent a Cars.',
        anuncio_tipo VARCHAR(50) DEFAULT 'INFO',
        permitir_registro_publico BOOLEAN DEFAULT true,
        terminos_servicio TEXT DEFAULT 'El uso de la plataforma RentOS está reservado a empresas autorizadas.',
        politica_privacidad TEXT DEFAULT 'La información de clientes y contratos está estrictamente protegida.',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO configuracion_global (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
    `;
    await prisma.$executeRawUnsafe(ddl);
    tablaInicializada = true;
  } catch (err) {
    console.error("Aviso: No fue posible ejecutar DDL de configuracion_global:", err);
  }
}

/**
 * Consulta la configuración global desde la base de datos o memoria
 */
export async function obtenerConfiguracionGlobal(): Promise<ConfiguracionGlobalData> {
  try {
    await asegurarTabla();
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM configuracion_global WHERE id = 1 LIMIT 1;`
    );

    if (rows && rows.length > 0) {
      const r = rows[0];
      memoriaConfig = {
        id: 1,
        nombrePlataforma: r.nombre_plataforma || DEFAULT_CONFIG.nombrePlataforma,
        esloganPlataforma: r.eslogan_plataforma || DEFAULT_CONFIG.esloganPlataforma,
        logoUrl: r.logo_url || null,
        faviconUrl: r.favicon_url || null,
        colorPrimario: r.color_primario || DEFAULT_CONFIG.colorPrimario,
        colorAcento: r.color_acento || DEFAULT_CONFIG.colorAcento,
        emailSoporte: r.email_soporte || DEFAULT_CONFIG.emailSoporte,
        telefonoSoporte: r.telefono_soporte || DEFAULT_CONFIG.telefonoSoporte,
        whatsappSoporte: r.whatsapp_soporte || DEFAULT_CONFIG.whatsappSoporte,
        tiempoExpiracionTokenMin: Number(r.tiempo_expiracion_token_min) || DEFAULT_CONFIG.tiempoExpiracionTokenMin,
        maxIntentosFallidos: Number(r.max_intentos_fallidos) || DEFAULT_CONFIG.maxIntentosFallidos,
        tiempoBloqueoMin: Number(r.tiempo_bloqueo_min) || DEFAULT_CONFIG.tiempoBloqueoMin,
        modoTasa: r.modo_tasa === "MANUAL" ? "MANUAL" : "AUTOMATICO_BCRD",
        tasaManual: r.tasa_manual ? Number(r.tasa_manual) : null,
        margenTasaDop: Number(r.margen_tasa_dop) || 0.0,
        anuncioActivo: Boolean(r.anuncio_activo),
        anuncioMensaje: r.anuncio_mensaje || DEFAULT_CONFIG.anuncioMensaje,
        anuncioTipo: ["INFO", "SUCCESS", "WARNING", "DANGER"].includes(r.anuncio_tipo)
          ? r.anuncio_tipo
          : "INFO",
        permitirRegistroPublico: r.permitir_registro_publico !== false,
        terminosServicio: r.terminos_servicio || DEFAULT_CONFIG.terminosServicio,
        politicaPrivacidad: r.politica_privacidad || DEFAULT_CONFIG.politicaPrivacidad,
        updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error("Error al leer configuracion_global de DB:", err);
  }
  return memoriaConfig;
}

// ----------------------------------------------------------------------------
// GET /api/superadmin/configuracion
// ----------------------------------------------------------------------------
// Retorna la configuración global del Super Admin y de la plataforma RentOS
router.get("/", async (_req, res) => {
  try {
    const config = await obtenerConfiguracionGlobal();
    res.json(config);
  } catch (error) {
    console.error("Error al obtener configuración de Super Admin:", error);
    res.json(memoriaConfig);
  }
});

// ----------------------------------------------------------------------------
// GET /api/superadmin/configuracion/anuncio
// ----------------------------------------------------------------------------
// Endpoint público ligero para el banner global en cabecera o dashboard
router.get("/anuncio", async (_req, res) => {
  try {
    const config = await obtenerConfiguracionGlobal();
    res.json({
      activo: config.anuncioActivo,
      mensaje: config.anuncioMensaje,
      tipo: config.anuncioTipo,
      nombrePlataforma: config.nombrePlataforma,
    });
  } catch {
    res.json({
      activo: memoriaConfig.anuncioActivo,
      mensaje: memoriaConfig.anuncioMensaje,
      tipo: memoriaConfig.anuncioTipo,
      nombrePlataforma: memoriaConfig.nombrePlataforma,
    });
  }
});

// ----------------------------------------------------------------------------
// PUT /api/superadmin/configuracion
// ----------------------------------------------------------------------------
// Actualiza la configuración global de la plataforma (Exclusivo SuperAdmin)
router.put("/", async (req, res) => {
  try {
    await asegurarTabla();
    const data = req.body || {};

    const nuevoNombre = data.nombrePlataforma ? String(data.nombrePlataforma).trim() : memoriaConfig.nombrePlataforma;
    const nuevoEslogan = data.esloganPlataforma !== undefined ? String(data.esloganPlataforma).trim() : memoriaConfig.esloganPlataforma;
    const nuevoLogo = data.logoUrl !== undefined ? (data.logoUrl ? String(data.logoUrl).trim() : null) : memoriaConfig.logoUrl;
    const nuevoFavicon = data.faviconUrl !== undefined ? (data.faviconUrl ? String(data.faviconUrl).trim() : null) : memoriaConfig.faviconUrl;
    const nuevoColorPrimario = data.colorPrimario ? String(data.colorPrimario).trim() : memoriaConfig.colorPrimario;
    const nuevoColorAcento = data.colorAcento ? String(data.colorAcento).trim() : memoriaConfig.colorAcento;
    const nuevoEmail = data.emailSoporte ? String(data.emailSoporte).trim().toLowerCase() : memoriaConfig.emailSoporte;
    const nuevoTelefono = data.telefonoSoporte !== undefined ? String(data.telefonoSoporte).trim() : memoriaConfig.telefonoSoporte;
    const nuevoWhatsapp = data.whatsappSoporte !== undefined ? String(data.whatsappSoporte).trim() : memoriaConfig.whatsappSoporte;
    const nuevoTiempoExp = data.tiempoExpiracionTokenMin ? Math.max(1, Number(data.tiempoExpiracionTokenMin)) : memoriaConfig.tiempoExpiracionTokenMin;
    const nuevoMaxIntentos = data.maxIntentosFallidos ? Math.max(1, Number(data.maxIntentosFallidos)) : memoriaConfig.maxIntentosFallidos;
    const nuevoTiempoBloqueo = data.tiempoBloqueoMin ? Math.max(1, Number(data.tiempoBloqueoMin)) : memoriaConfig.tiempoBloqueoMin;
    const nuevoModoTasa = data.modoTasa === "MANUAL" ? "MANUAL" : "AUTOMATICO_BCRD";
    const nuevaTasaManual = data.tasaManual !== undefined && data.tasaManual !== null ? Number(data.tasaManual) : null;
    const nuevoMargenTasa = data.margenTasaDop !== undefined ? Number(data.margenTasaDop) : 0.0;
    const nuevoAnuncioActivo = data.anuncioActivo !== undefined ? Boolean(data.anuncioActivo) : memoriaConfig.anuncioActivo;
    const nuevoAnuncioMensaje = data.anuncioMensaje !== undefined ? String(data.anuncioMensaje).trim() : memoriaConfig.anuncioMensaje;
    const nuevoAnuncioTipo = ["INFO", "SUCCESS", "WARNING", "DANGER"].includes(data.anuncioTipo) ? data.anuncioTipo : "INFO";
    const nuevoPermitirReg = data.permitirRegistroPublico !== undefined ? Boolean(data.permitirRegistroPublico) : memoriaConfig.permitirRegistroPublico;
    const nuevosTerminos = data.terminosServicio !== undefined ? String(data.terminosServicio).trim() : memoriaConfig.terminosServicio;
    const nuevaPolitica = data.politicaPrivacidad !== undefined ? String(data.politicaPrivacidad).trim() : memoriaConfig.politicaPrivacidad;

    // Actualizar en PostgreSQL
    const sql = `
      UPDATE configuracion_global
      SET
        nombre_plataforma = $1,
        eslogan_plataforma = $2,
        logo_url = $3,
        favicon_url = $4,
        color_primario = $5,
        color_acento = $6,
        email_soporte = $7,
        telefono_soporte = $8,
        whatsapp_soporte = $9,
        tiempo_expiracion_token_min = $10,
        max_intentos_fallidos = $11,
        tiempo_bloqueo_min = $12,
        modo_tasa = $13,
        tasa_manual = $14,
        margen_tasa_dop = $15,
        anuncio_activo = $16,
        anuncio_mensaje = $17,
        anuncio_tipo = $18,
        permitir_registro_publico = $19,
        terminos_servicio = $20,
        politica_privacidad = $21,
        updated_at = NOW()
      WHERE id = 1;
    `;

    await prisma.$executeRawUnsafe(
      sql,
      nuevoNombre,
      nuevoEslogan,
      nuevoLogo,
      nuevoFavicon,
      nuevoColorPrimario,
      nuevoColorAcento,
      nuevoEmail,
      nuevoTelefono,
      nuevoWhatsapp,
      nuevoTiempoExp,
      nuevoMaxIntentos,
      nuevoTiempoBloqueo,
      nuevoModoTasa,
      nuevaTasaManual,
      nuevoMargenTasa,
      nuevoAnuncioActivo,
      nuevoAnuncioMensaje,
      nuevoAnuncioTipo,
      nuevoPermitirReg,
      nuevosTerminos,
      nuevaPolitica
    );

    // Actualizar memoria
    memoriaConfig = {
      id: 1,
      nombrePlataforma: nuevoNombre,
      esloganPlataforma: nuevoEslogan,
      logoUrl: nuevoLogo,
      faviconUrl: nuevoFavicon,
      colorPrimario: nuevoColorPrimario,
      colorAcento: nuevoColorAcento,
      emailSoporte: nuevoEmail,
      telefonoSoporte: nuevoTelefono,
      whatsappSoporte: nuevoWhatsapp,
      tiempoExpiracionTokenMin: nuevoTiempoExp,
      maxIntentosFallidos: nuevoMaxIntentos,
      tiempoBloqueoMin: nuevoTiempoBloqueo,
      modoTasa: nuevoModoTasa,
      tasaManual: nuevaTasaManual,
      margenTasaDop: nuevoMargenTasa,
      anuncioActivo: nuevoAnuncioActivo,
      anuncioMensaje: nuevoAnuncioMensaje,
      anuncioTipo: nuevoAnuncioTipo,
      permitirRegistroPublico: nuevoPermitirReg,
      terminosServicio: nuevosTerminos,
      politicaPrivacidad: nuevaPolitica,
      updatedAt: new Date().toISOString(),
    };

    res.json({
      mensaje: "Configuración global de SuperAdmin actualizada exitosamente.",
      config: memoriaConfig,
    });
  } catch (error) {
    console.error("Error al actualizar configuración de Super Admin:", error);
    res.status(500).json({
      error: "No fue posible actualizar la configuración de Super Admin.",
      detalle: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
