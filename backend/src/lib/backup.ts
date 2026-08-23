import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const backupDirectory = path.resolve(
  process.env.BACKUP_DIR || "./backups",
);

async function obtenerNombreBackup(): Promise<string> {
  const ahora = new Date();

  const fecha = ahora
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");

  return `rentos_backup_${fecha}.sql`;
}

export async function crearBackup(): Promise<{
  archivo: string;
  ruta: string;
  tamaño: number;
}> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurada.");
  }

  await fs.mkdir(backupDirectory, {
    recursive: true,
  });

  const nombreArchivo = await obtenerNombreBackup();
  const rutaArchivo = path.join(
    backupDirectory,
    nombreArchivo,
  );

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

  backups.sort(
    (a, b) =>
      b.fecha.getTime() -
      a.fecha.getTime(),
  );

  return backups;
}

export async function restaurarBackup(
  nombreArchivo: string,
): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está configurada.");
  }

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

  await fs.access(rutaArchivo);

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
