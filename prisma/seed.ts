import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.provider.upsert({
    where: { name: "ABC" },
    update: { baseDiscount: 36.7 }, // El valor real que me pasaste
    create: { name: "ABC", baseDiscount: 36.7 },
  });

  await prisma.provider.upsert({
    where: { name: "CARMAR" },
    update: {},
    create: { name: "CARMAR", baseDiscount: 20.0 }, // Pusimos 20% como ejemplo
  });

  await prisma.provider.upsert({
    where: { name: "CARMAR" },
    update: { baseDiscount: 15.0 }, // Seteamos el 15%
    create: { name: "CARMAR", baseDiscount: 15.0 },
  });

  console.log("Proveedores creados con éxito");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
