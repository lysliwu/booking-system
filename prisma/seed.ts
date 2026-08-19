import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.service.createMany({
    data: [
      {
        name: "Classic Manicure",
        description: "Shape, cuticle care, and polish.",
        durationMinutes: 30,
        priceCents: 3500,
      },
      {
        name: "Gel Manicure",
        description: "Long-lasting gel polish with shape and cuticle care.",
        durationMinutes: 45,
        priceCents: 5500,
      },
      {
        name: "Nail Art Design",
        description: "Custom hand-painted nail art, per set.",
        durationMinutes: 60,
        priceCents: 7500,
      },
      {
        name: "Gel Removal + Manicure",
        description: "Safe gel removal followed by a classic manicure.",
        durationMinutes: 45,
        priceCents: 4500,
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
