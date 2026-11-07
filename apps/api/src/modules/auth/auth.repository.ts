import { getPrismaClient, type PrismaClient, type Prisma } from "@sms/db";

/** Accepts either the real client or an interactive transaction's client, so callers can compose these into one transaction. */
type Db = PrismaClient | Prisma.TransactionClient;

const SELECTABLE_MEMBERSHIP_ROLE_INCLUDE = {
  role: true,
  school: true,
} satisfies Prisma.MembershipRoleInclude;

export type SelectableMembershipRole = Prisma.MembershipRoleGetPayload<{
  include: typeof SELECTABLE_MEMBERSHIP_ROLE_INCLUDE;
}>;

export function findUserByEmail(email: string, prisma: PrismaClient = getPrismaClient()) {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string, prisma: PrismaClient = getPrismaClient()) {
  return prisma.user.findUnique({ where: { id } });
}

/** MembershipRoles a user can choose as their active role: an ACTIVE membership in an ACTIVE school. */
export function listSelectableMembershipRoles(
  userId: string,
  prisma: PrismaClient = getPrismaClient(),
): Promise<SelectableMembershipRole[]> {
  return prisma.membershipRole.findMany({
    where: { membership: { userId, status: "ACTIVE" }, school: { status: "ACTIVE" } },
    include: SELECTABLE_MEMBERSHIP_ROLE_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
}

export interface CreateSessionInput {
  userId: string;
  tokenHash: string;
  activeMembershipRoleId: string | null;
  ip?: string;
  userAgent?: string;
  lastSeenAt: Date;
  idleExpiresAt: Date;
  absoluteExpiresAt: Date;
}

export function createSession(input: CreateSessionInput, prisma: PrismaClient = getPrismaClient()) {
  return prisma.authSession.create({ data: input });
}

/** Idempotent: deleting a token hash that has no row is not an error. */
export function deleteSessionByTokenHash(
  tokenHash: string,
  prisma: PrismaClient = getPrismaClient(),
) {
  return prisma.authSession.deleteMany({ where: { tokenHash } });
}

export function updateLastLogin(
  userId: string,
  at: Date,
  prisma: PrismaClient = getPrismaClient(),
) {
  return prisma.user.update({ where: { id: userId }, data: { lastLoginAt: at } });
}

/** Sets the new password hash and, if the email wasn't verified yet, verifies it too — the reset link proved the address. */
export async function completePasswordReset(
  userId: string,
  passwordHash: string,
  at: Date,
  prisma: Db = getPrismaClient(),
) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash, emailVerifiedAt: user.emailVerifiedAt ?? at },
  });
}

export function markEmailVerified(userId: string, at: Date, prisma: Db = getPrismaClient()) {
  return prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: at } });
}

/** Revokes every session of this user (ADR 0003: a password reset deletes all sessions). */
export function deleteAllSessionsForUser(userId: string, prisma: Db = getPrismaClient()) {
  return prisma.authSession.deleteMany({ where: { userId } });
}
