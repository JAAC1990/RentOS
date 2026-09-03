import prisma from "../dist/lib/prisma.js";

async function main() {
  console.log("Migrando columna slug en tabla RentCar...");
  await prisma.$executeRawUnsafe('ALTER TABLE "RentCar" ADD COLUMN IF NOT EXISTS "slug" TEXT;');
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "RentCar_slug_key" ON "RentCar"("slug");');

  const rentcars = await prisma.rentCar.findMany();
  for (const r of rentcars) {
    const slugGenerado =
      r.slug ||
      r.nombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") ||
      `rentcar-${r.id}`;

    await prisma.rentCar.update({
      where: { id: r.id },
      data: { slug: slugGenerado },
    });
    console.log(`✅ RentCar: [ID ${r.id}] "${r.nombre}" -> slug: "${slugGenerado}"`);
  }

  console.log("🎉 Migración completada exitosamente.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error en migración:", err);
  process.exit(1);
});
