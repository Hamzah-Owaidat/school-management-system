import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client.js";

/** Synthetic data only — no real schools, people or contact details. */
async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.school.upsert({
      where: { slug: "demo" },
      update: {},
      create: {
        name: "Demo School",
        slug: "demo",
        defaultLocale: "en",
        currencies: ["USD", "LBP"],
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
