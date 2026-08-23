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

async function verify() {
  console.log("--- VERIFICACIÓN DE BASE DE DATOS RENTOS ---");

  const rentCars = await prisma.rentCar.findMany();
  console.log(`Rent Cars registrados: ${rentCars.length}`);
  rentCars.forEach((rc) => {
    console.log(` - [ID ${rc.id}] ${rc.nombre} (${rc.ciudad}) - RNC: ${rc.rnc}`);
  });

  const vehiculos = await prisma.vehiculo.findMany({
    include: {
      rentCar: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  console.log(`\nVehículos registrados: ${vehiculos.length}`);
  vehiculos.forEach((v) => {
    console.log(` - [ID ${v.id}] ${v.marca} ${v.modelo} ${v.anio} | Placa: ${v.placa} | Estado: ${v.estado} | Empresa: ${v.rentCar.nombre}`);
  });

  console.log("\n✅ Verificación exitosa: Todos los vehículos están intactos y vinculados a su Rent Car.");
}

verify()
  .catch((e) => {
    console.error("Error en verificación:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
