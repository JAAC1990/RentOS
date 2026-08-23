import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Creando tabla RentCar y registro inicial...");
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "RentCar" (
      "id" SERIAL PRIMARY KEY,
      "nombre" TEXT NOT NULL DEFAULT 'RentOS Principal - Santo Domingo',
      "rnc" TEXT UNIQUE,
      "telefono" TEXT DEFAULT '809-555-0199',
      "email" TEXT DEFAULT 'info@rentos.do',
      "direccion" TEXT DEFAULT 'Av. 27 de Febrero, Santo Domingo',
      "ciudad" TEXT NOT NULL DEFAULT 'Santo Domingo',
      "logoUrl" TEXT,
      "activo" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO "RentCar" ("id", "nombre", "rnc", "telefono", "email", "direccion", "ciudad", "activo", "createdAt", "updatedAt")
    VALUES (1, 'RentOS Principal - Santo Domingo', '132-00000-1', '809-555-0199', 'contacto@rentos.do', 'Av. 27 de Febrero #100, Santo Domingo', 'Santo Domingo', true, NOW(), NOW())
    ON CONFLICT ("id") DO NOTHING;
  `);

  console.log("Rent Car inicial creado con éxito.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
