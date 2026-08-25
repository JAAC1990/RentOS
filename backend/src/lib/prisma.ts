/**
 * ============================================================================
 * RentOS - Cliente de Base de Datos Prisma ORM & Conexión PostgreSQL
 * ============================================================================
 * Este módulo configura y exporta la instancia singleton del cliente de Prisma,
 * utilizando el adaptador de PostgreSQL de alto rendimiento (@prisma/adapter-pg)
 * y garantizando la lectura segura de las variables de entorno desde el archivo .env.
 */

import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Obtener la ruta del archivo actual en formato ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ubicación del archivo de configuración de variables de entorno (.env)
const envPath = path.resolve(__dirname, "../../../.env");

// Cargar variables de entorno
dotenv.config({
  path: envPath,
});

// Cadena de conexión principal a la base de datos PostgreSQL
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    `DATABASE_URL no está configurada. Archivo .env esperado en: ${envPath}`,
  );
}

// Inicializar el adaptador nativo de PostgreSQL para Prisma
const adapter = new PrismaPg({
  connectionString,
});

// Instancia global de Prisma Client para todas las operaciones de la base de datos
const prisma = new PrismaClient({
  adapter,
});

export default prisma;
