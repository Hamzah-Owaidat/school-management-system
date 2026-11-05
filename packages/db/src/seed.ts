import type { PrismaClient } from "./generated/client.js";

/** Synthetic data only — no real schools, people or contact details. Safe to run more than once. */
export function seedDemoSchool(prisma: PrismaClient) {
  return prisma.school.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Demo School",
      slug: "demo",
      defaultLocale: "en",
      currencies: ["USD", "LBP"],
    },
  });
}
