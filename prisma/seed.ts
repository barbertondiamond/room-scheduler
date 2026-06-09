import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.room.deleteMany();

  const rooms = [];

  for (let i = 1; i <= 15; i++) {
    rooms.push({
      name: `Room ${String(i).padStart(2, "0")}`,
    });
  }

  await prisma.room.createMany({
    data: rooms,
  });

  console.log("✅ 15 cleanly numbered rooms created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
