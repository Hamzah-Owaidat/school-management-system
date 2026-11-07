import { PermissionKey, ROLE_MATRIX, RoleKey } from "@sms/contracts";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getPrismaClient, seedRolesAndPermissions } from "./index.js";

const prisma = getPrismaClient();

const matrixEntryCount = Object.values(ROLE_MATRIX).reduce(
  (total, entries) => total + entries.length,
  0,
);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("seedRolesAndPermissions", () => {
  beforeAll(async () => {
    await seedRolesAndPermissions(prisma);
  });

  it("creates every role and permission", async () => {
    await expect(prisma.role.count()).resolves.toBe(Object.values(RoleKey).length);
    await expect(prisma.permission.count()).resolves.toBe(Object.values(PermissionKey).length);
  });

  it("makes RolePermission match the matrix exactly", async () => {
    await expect(prisma.rolePermission.count()).resolves.toBe(matrixEntryCount);

    for (const [roleKey, entries] of Object.entries(ROLE_MATRIX)) {
      for (const entry of entries) {
        const row = await prisma.rolePermission.findFirst({
          where: { role: { key: roleKey }, permission: { key: entry.permission } },
        });
        expect(row).toMatchObject({
          scope: entry.scope,
          condition: entry.condition ?? null,
        });
      }
    }
  });

  it("never attaches PLATFORM_OPERATOR's permission through a school role", async () => {
    const row = await prisma.rolePermission.findFirst({
      where: {
        permission: { key: PermissionKey.PLATFORM_SCHOOLS_MANAGE },
        role: { key: { not: RoleKey.PLATFORM_OPERATOR } },
      },
    });
    expect(row).toBeNull();
  });

  it("changes nothing when run twice", async () => {
    const before = await prisma.rolePermission.findMany({ orderBy: { id: "asc" } });

    await seedRolesAndPermissions(prisma);

    const after = await prisma.rolePermission.findMany({ orderBy: { id: "asc" } });
    expect(after).toEqual(before);
    await expect(prisma.role.count()).resolves.toBe(Object.values(RoleKey).length);
    await expect(prisma.permission.count()).resolves.toBe(Object.values(PermissionKey).length);
  });
});

describe("tenancy constraints", () => {
  it("rejects a second SchoolMembership for the same user and school", async () => {
    const school = await prisma.school.create({
      data: { name: "Membership Test School", slug: `membership-test-${crypto.randomUUID()}` },
    });
    const user = await prisma.user.create({
      data: { email: `membership-${crypto.randomUUID()}@example.test` },
    });

    try {
      await prisma.schoolMembership.create({ data: { schoolId: school.id, userId: user.id } });

      await expect(
        prisma.schoolMembership.create({ data: { schoolId: school.id, userId: user.id } }),
      ).rejects.toMatchObject({ code: "P2002" });
    } finally {
      await prisma.schoolMembership.deleteMany({ where: { schoolId: school.id } });
      await prisma.user.delete({ where: { id: user.id } });
      await prisma.school.delete({ where: { id: school.id } });
    }
  });

  it("rejects a MembershipRole whose schoolId differs from its membership's school", async () => {
    const schoolA = await prisma.school.create({
      data: { name: "School A", slug: `school-a-${crypto.randomUUID()}` },
    });
    const schoolB = await prisma.school.create({
      data: { name: "School B", slug: `school-b-${crypto.randomUUID()}` },
    });
    const user = await prisma.user.create({
      data: { email: `cross-school-${crypto.randomUUID()}@example.test` },
    });
    const role = await prisma.role.findUniqueOrThrow({ where: { key: RoleKey.TEACHER } });

    try {
      const membershipInSchoolA = await prisma.schoolMembership.create({
        data: { schoolId: schoolA.id, userId: user.id },
      });

      await expect(
        prisma.membershipRole.create({
          data: {
            schoolId: schoolB.id,
            membershipId: membershipInSchoolA.id,
            roleId: role.id,
          },
        }),
      ).rejects.toMatchObject({ code: "P2003" });
    } finally {
      await prisma.schoolMembership.deleteMany({
        where: { OR: [{ schoolId: schoolA.id }, { schoolId: schoolB.id }] },
      });
      await prisma.user.delete({ where: { id: user.id } });
      await prisma.school.deleteMany({ where: { id: { in: [schoolA.id, schoolB.id] } } });
    }
  });

  it("cascades a deleted User's AuthSession and AuthToken, but refuses a User with a SchoolMembership", async () => {
    const userWithSessions = await prisma.user.create({
      data: { email: `sessions-${crypto.randomUUID()}@example.test` },
    });
    await prisma.authSession.create({
      data: {
        userId: userWithSessions.id,
        tokenHash: `session-${crypto.randomUUID()}`,
        lastSeenAt: new Date(),
        idleExpiresAt: new Date(Date.now() + 1000 * 60 * 60),
        absoluteExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });
    await prisma.authToken.create({
      data: {
        userId: userWithSessions.id,
        type: "EMAIL_VERIFICATION",
        tokenHash: `token-${crypto.randomUUID()}`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    await prisma.user.delete({ where: { id: userWithSessions.id } });

    await expect(
      prisma.authSession.findFirst({ where: { userId: userWithSessions.id } }),
    ).resolves.toBeNull();
    await expect(
      prisma.authToken.findFirst({ where: { userId: userWithSessions.id } }),
    ).resolves.toBeNull();

    const school = await prisma.school.create({
      data: { name: "Delete Guard School", slug: `delete-guard-${crypto.randomUUID()}` },
    });
    const userWithMembership = await prisma.user.create({
      data: { email: `membership-guard-${crypto.randomUUID()}@example.test` },
    });

    try {
      await prisma.schoolMembership.create({
        data: { schoolId: school.id, userId: userWithMembership.id },
      });

      await expect(
        prisma.user.delete({ where: { id: userWithMembership.id } }),
      ).rejects.toMatchObject({ code: "P2003" });
    } finally {
      await prisma.schoolMembership.deleteMany({ where: { schoolId: school.id } });
      await prisma.user.delete({ where: { id: userWithMembership.id } });
      await prisma.school.delete({ where: { id: school.id } });
    }
  });
});
