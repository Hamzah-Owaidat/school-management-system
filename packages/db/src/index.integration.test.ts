import { afterAll, describe, expect, it } from "vitest";
import { checkDatabaseConnection, getPrismaClient } from "./index.js";
import { seedDemoSchool } from "./seed.js";

const prisma = getPrismaClient();

afterAll(async () => {
  await prisma.$disconnect();
});

describe("database integration", () => {
  it("connects to the real database", async () => {
    await expect(checkDatabaseConnection(prisma)).resolves.toBe(true);
  });

  it("seeds the demo school and reads it back", async () => {
    await seedDemoSchool(prisma);

    const school = await prisma.school.findUnique({ where: { slug: "demo" } });
    expect(school?.name).toBe("Demo School");
    expect(school?.currencies).toEqual(["USD", "LBP"]);
  });

  it("rejects a second school with the same slug", async () => {
    await seedDemoSchool(prisma);

    await expect(
      prisma.school.create({
        data: { name: "Another Demo School", slug: "demo", defaultLocale: "en" },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });
});
