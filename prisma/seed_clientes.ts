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

async function seedClientes() {
  console.log("Insertando clientes iniciales de prueba...");

  const clientesIniciales = [
    {
      rentCarId: 1,
      nombre: "Carlos",
      apellido: "García Martínez",
      telefono: "809-555-1001",
      email: "carlos.garcia@gmail.com",
      direccion: "Piantini, Santo Domingo",
      estado: "ACTIVO" as const,
    },
    {
      rentCarId: 1,
      nombre: "María",
      apellido: "Fernández Santos",
      telefono: "829-555-2002",
      email: "maria.fernandez@outlook.com",
      direccion: "Bella Vista, Santo Domingo",
      estado: "ACTIVO" as const,
    },
    {
      rentCarId: 1,
      nombre: "Alejandro",
      apellido: "Rodríguez Peña",
      telefono: "849-555-3003",
      email: "arodriguez@empresa.do",
      direccion: "Naco, Santo Domingo",
      estado: "BLOQUEADO" as const,
    },
  ];

  for (const c of clientesIniciales) {
    const existe = await prisma.cliente.findFirst({
      where: { telefono: c.telefono },
    });

    if (!existe) {
      await prisma.cliente.create({ data: c });
      console.log(` -> Cliente creado: ${c.nombre} ${c.apellido} (${c.estado})`);
    }
  }

  console.log("✅ Clientes listos en base de datos.");
}

seedClientes()
  .catch((e) => {
    console.error("Error al poblar clientes:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
