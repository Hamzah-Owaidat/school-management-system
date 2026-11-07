import { hash as hashPassword } from "@node-rs/argon2";
import {
  PERMISSION_DESCRIPTIONS,
  PermissionKey,
  ROLE_MATRIX,
  ROLES,
  RoleKey,
} from "@sms/contracts";
import type { PermissionCondition, PermissionScope, PrismaClient } from "./generated/client.js";

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

/**
 * Makes Role, Permission and RolePermission match packages/contracts exactly: inserts
 * missing rows, updates changed ones, deletes rows no longer in the matrix. Idempotent —
 * a row already matching the source of truth is left untouched, so running this twice in a
 * row leaves every `updatedAt` unchanged.
 */
export async function seedRolesAndPermissions(prisma: PrismaClient): Promise<void> {
  const permissionKeys = Object.values(PermissionKey);
  const roleKeys = Object.values(RoleKey);

  const existingPermissions = await prisma.permission.findMany();
  const existingPermissionByKey = new Map(existingPermissions.map((p) => [p.key, p]));

  const permissionIdByKey = new Map<string, string>();
  for (const key of permissionKeys) {
    const existing = existingPermissionByKey.get(key);
    const description = PERMISSION_DESCRIPTIONS[key];

    if (existing) {
      permissionIdByKey.set(key, existing.id);
      if (existing.description !== description) {
        await prisma.permission.update({ where: { id: existing.id }, data: { description } });
      }
      continue;
    }

    const created = await prisma.permission.create({ data: { key, description } });
    permissionIdByKey.set(key, created.id);
  }

  const existingRoles = await prisma.role.findMany();
  const existingRoleByKey = new Map(existingRoles.map((r) => [r.key, r]));

  const roleIdByKey = new Map<string, string>();
  for (const key of roleKeys) {
    const existing = existingRoleByKey.get(key);
    const { name, scope } = ROLES[key];

    if (existing) {
      roleIdByKey.set(key, existing.id);
      if (existing.name !== name || existing.scope !== scope) {
        await prisma.role.update({ where: { id: existing.id }, data: { name, scope } });
      }
      continue;
    }

    const created = await prisma.role.create({ data: { key, name, scope } });
    roleIdByKey.set(key, created.id);
  }

  const existingRolePermissions = await prisma.rolePermission.findMany();
  const existingByRoleAndPermission = new Map(
    existingRolePermissions.map((rp) => [`${rp.roleId}:${rp.permissionId}`, rp]),
  );

  for (const roleKey of roleKeys) {
    const roleId = roleIdByKey.get(roleKey);
    if (!roleId) throw new Error(`Role ${roleKey} was not seeded`);

    const matrixEntries = ROLE_MATRIX[roleKey];
    const matrixPermissionIds = new Set<string>();

    for (const entry of matrixEntries) {
      const permissionId = permissionIdByKey.get(entry.permission);
      if (!permissionId) throw new Error(`Permission ${entry.permission} was not seeded`);
      matrixPermissionIds.add(permissionId);

      const scope = entry.scope as PermissionScope;
      const condition = (entry.condition ?? null) as PermissionCondition | null;
      const existing = existingByRoleAndPermission.get(`${roleId}:${permissionId}`);

      if (existing) {
        if (existing.scope !== scope || existing.condition !== condition) {
          await prisma.rolePermission.update({
            where: { id: existing.id },
            data: { scope, condition },
          });
        }
        continue;
      }

      await prisma.rolePermission.create({ data: { roleId, permissionId, scope, condition } });
    }

    await prisma.rolePermission.deleteMany({
      where: { roleId, permissionId: { notIn: [...matrixPermissionIds] } },
    });
  }
}

const DEFAULT_SEED_DEMO_PASSWORD = "demo-password-123";

interface DemoUserSpec {
  /** Synthetic address on the reserved .test domain (RFC 2606) — never a real inbox. */
  email: string;
  isPlatformOperator?: boolean;
  /** Role keys to attach on one SchoolMembership at the demo school; omitted for no membership. */
  roleKeys?: RoleKey[];
}

const DEMO_USERS: DemoUserSpec[] = [
  { email: "operator@demo.test", isPlatformOperator: true },
  { email: "admin@demo.test", roleKeys: [RoleKey.SCHOOL_ADMIN] },
  { email: "teacher@demo.test", roleKeys: [RoleKey.TEACHER] },
  { email: "accountant@demo.test", roleKeys: [RoleKey.ACCOUNTANT] },
  { email: "student@demo.test", roleKeys: [RoleKey.STUDENT] },
  { email: "parent@demo.test", roleKeys: [RoleKey.PARENT] },
  { email: "admin-accountant@demo.test", roleKeys: [RoleKey.SCHOOL_ADMIN, RoleKey.ACCOUNTANT] },
];

/**
 * Creates the demo users listed in DEMO_USERS, all at the demo school, sharing one
 * local-only password (SEED_DEMO_PASSWORD, default "demo-password-123"). Synthetic data
 * only — never run this against a production database. Idempotent (upsert).
 */
export async function seedDemoUsers(prisma: PrismaClient): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("seedDemoUsers must never run with NODE_ENV=production");
  }

  const school = await prisma.school.findUniqueOrThrow({ where: { slug: "demo" } });
  const passwordHash = await hashPassword(
    process.env.SEED_DEMO_PASSWORD ?? DEFAULT_SEED_DEMO_PASSWORD,
  );

  for (const spec of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: { passwordHash, isPlatformOperator: spec.isPlatformOperator ?? false },
      create: {
        email: spec.email,
        passwordHash,
        isPlatformOperator: spec.isPlatformOperator ?? false,
      },
    });

    if (!spec.roleKeys || spec.roleKeys.length === 0) continue;

    const membership = await prisma.schoolMembership.upsert({
      where: { schoolId_userId: { schoolId: school.id, userId: user.id } },
      update: {},
      create: { schoolId: school.id, userId: user.id },
    });

    for (const roleKey of spec.roleKeys) {
      const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
      await prisma.membershipRole.upsert({
        where: {
          schoolId_membershipId_roleId: {
            schoolId: school.id,
            membershipId: membership.id,
            roleId: role.id,
          },
        },
        update: {},
        create: { schoolId: school.id, membershipId: membership.id, roleId: role.id },
      });
    }
  }
}
