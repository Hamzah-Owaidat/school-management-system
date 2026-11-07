import { createHash, randomBytes } from "node:crypto";
import { getPrismaClient, type PrismaClient } from "@sms/db";

const TOKEN_BYTES = 32;

/** A password reset token expires 1 hour after it's created (ADR 0003, threat S6). */
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
/** An email verification token expires 24 hours after it's created. */
export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export type AuthTokenType = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

const TTL_MS_BY_TYPE: Record<AuthTokenType, number> = {
  PASSWORD_RESET: PASSWORD_RESET_TOKEN_TTL_MS,
  EMAIL_VERIFICATION: EMAIL_VERIFICATION_TOKEN_TTL_MS,
};

/** An opaque auth token: 32 random bytes, base64url-encoded. Only its SHA-256 hash is stored. */
export function generateAuthToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashAuthToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a new token of this type for the user, deleting their earlier unused tokens of
 * the same type first (so an old email's link stops working once a new one is requested).
 * Returns the raw token — never stored, only ever put in the email link.
 */
export async function createAuthToken(
  userId: string,
  type: AuthTokenType,
  prisma: PrismaClient = getPrismaClient(),
): Promise<string> {
  const token = generateAuthToken();
  const tokenHash = hashAuthToken(token);
  const now = new Date();

  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, type, usedAt: null } }),
    prisma.authToken.create({
      data: { userId, type, tokenHash, expiresAt: new Date(now.getTime() + TTL_MS_BY_TYPE[type]) },
    }),
  ]);

  return token;
}

export interface ConsumedAuthToken {
  userId: string;
}

/**
 * Looks up a token by its hash and type, checks it hasn't been used or expired, and marks
 * it used — all in one transaction, so a token can never be consumed twice (threat S6).
 * Returns null for any invalid token (not found, wrong type, already used, expired).
 */
export async function consumeAuthToken(
  token: string,
  type: AuthTokenType,
  prisma: PrismaClient = getPrismaClient(),
): Promise<ConsumedAuthToken | null> {
  const tokenHash = hashAuthToken(token);

  return prisma.$transaction(async (tx) => {
    const row = await tx.authToken.findUnique({ where: { tokenHash } });
    const now = new Date();

    if (!row || row.type !== type || row.usedAt || row.expiresAt < now) {
      return null;
    }

    await tx.authToken.update({ where: { id: row.id }, data: { usedAt: now } });
    return { userId: row.userId };
  });
}
