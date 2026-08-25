/**
 * ============================================================================
 * RentOS - Utilidad de Respaldo y Restauración de Base de Datos (pg_dump / psql)
 * ============================================================================
 * Este archivo contiene las funciones nativas para generar copias de seguridad
 * en formato SQL, listar los archivos existentes en la carpeta de respaldos y
 * ejecutar la restauración segura de la base de datos PostgreSQL.
 */

import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Directorio en disco donde se guardan los archivos .sql de respaldo
const backupDirectory = path.resolve(
  process.env.BACKUP_DIR || "./backups",
);

/**
 * Genera un nombre de archivo único para el backup basado en la fecha y hora actual.
 * Ejemplo: rentos_backup_2026-08-24_15-30-00-123.sql
 */
async function obtenerNombreBackup(): Promise<string> {
  const ahora = new Date();

  const fecha = ahora
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");

  return `rentos_backup_${fecha}.sql`;
}

/**
 * Ejecuta `pg_dump` para generar una copia de seguridad íntegra de la base de datos.
 * Retorna el nombre del archivo, su ruta absoluta y su tamaño en bytes.
 */
export async function crearBackup(): Promise<{
  archivo: string;
  ruta: string;
  tamaño: number;
}> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  // Asegurar que el directorio de backups exista
  await fs.mkdir(backupDirectory, {
    recursive: true,
  });

  const nombreArchivo = await obtenerNombreBackup();
  const rutaArchivo = path.join(
    backupDirectory,
    nombreArchivo,
  );

  // Ejecutar pg_dump para volcar la estructura y los datos en texto plano SQL
  await execFileAsync(
    process.env.PG_DUMP_PATH || "pg_dump",
    [
      databaseUrl,
      "--format=plain",
      "--file",
      rutaArchivo,
    ],
    {
      windowsHide: true,
    },
  );

  const estadisticas = await fs.stat(rutaArchivo);

  return {
    archivo: nombreArchivo,
    ruta: rutaArchivo,
    tamaño: estadisticas.size,
  };
}

/**
 * Lee la carpeta de backups y devuelve un arreglo con todos los archivos .sql
 * ordenados cronológicamente del más reciente al más antiguo.
 */
export async function listarBackups(): Promise<
  Array<{
    archivo: string;
    tamaño: number;
    fecha: Date;
  }>
> {
  await fs.mkdir(backupDirectory, {
    recursive: true,
  });

  const archivos = await fs.readdir(
    backupDirectory,
    {
      withFileTypes: true,
    },
  );

  const backups = [];

  for (const archivo of archivos) {
    if (
      !archivo.isFile() ||
      !archivo.name.endsWith(".sql") ||
      !archivo.name.startsWith("rentos_backup_")
    ) {
      continue;
    }

    const ruta = path.join(
      backupDirectory,
      archivo.name,
    );

    const estadisticas = await fs.stat(ruta);

    backups.push({
      archivo: archivo.name,
      tamaño: estadisticas.size,
      fecha: estadisticas.mtime,
    });
  }

  // Ordenar de más reciente a más antiguo
  backups.sort(
    (a, b) =>
      b.fecha.getTime() -
      a.fecha.getTime(),
  );

  return backups;
}

/**
 * Restaura la base de datos PostgreSQL utilizando la utilidad `psql`
 * a partir de un archivo .sql existente en el directorio de backups.
 * Incluye validaciones de seguridad de Path Traversal para evitar accesos indebidos.
 */
export async function restaurarBackup(
  nombreArchivo: string,
): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  // Validación de seguridad para evitar ataques de Path Traversal
  if (
    !nombreArchivo ||
    !nombreArchivo.startsWith("rentos_backup_") ||
    !nombreArchivo.endsWith(".sql") ||
    nombreArchivo.includes("..") ||
    nombreArchivo.includes("/") ||
    nombreArchivo.includes("\\")
  ) {
    throw new Error("Nombre de backup no válido.");
  }

  const rutaArchivo = path.resolve(
    backupDirectory,
    nombreArchivo,
  );

  const directorioReal = path.resolve(
    backupDirectory,
  );

  if (!rutaArchivo.startsWith(directorioReal)) {
    throw new Error("Ruta de backup no permitida.");
  }

  // Verificar que el archivo realmente exista y sea accesible
  await fs.access(rutaArchivo);

  // Ejecutar psql para aplicar las sentencias SQL sobre la base de datos
  await execFileAsync(
    process.env.PSQL_PATH || "psql",
    [
      databaseUrl,
      "--file",
      rutaArchivo,
    ],
    {
      windowsHide: true,
    },
  );
}
