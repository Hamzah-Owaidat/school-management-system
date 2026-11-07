import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/client.js";
import { seedDemoSchool, seedDemoUsers, seedRolesAndPermissions } from "../src/seed.js";

async function main(): Promise<void> {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    await seedDemoSchool(prisma);
    await seedRolesAndPermissions(prisma);
    // Demo users are local-only; never created against a production database.
    if (process.env.NODE_ENV !== "production") {
      await seedDemoUsers(prisma);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
