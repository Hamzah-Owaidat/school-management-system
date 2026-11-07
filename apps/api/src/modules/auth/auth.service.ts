import type { MeResponse, RoleKey } from "@sms/contracts";
import { getPrismaClient } from "@sms/db";
import { config, SESSION_ABSOLUTE_TTL_MS, SESSION_IDLE_TTL_MS } from "../../core/config.js";
import {
  emailVerificationEmailContent,
  passwordChangedEmailContent,
  passwordResetEmailContent,
  type EmailSender,
} from "../../core/email/index.js";
import { unauthenticated, validationFailed } from "../../core/errors.js";
import { logger } from "../../core/logger.js";
import type { AuthContext, AuthUser } from "../../core/session.js";
import { generateSessionToken, hashSessionToken } from "../../core/session-token.js";
import { consumeAuthToken, createAuthToken } from "./auth-tokens.js";
import { hashPassword, verifyPasswordOrDummy } from "./password.js";
import {
  completePasswordReset,
  createSession,
  deleteAllSessionsForUser,
  deleteSessionByTokenHash,
  findUserByEmail,
  findUserById,
  listSelectableMembershipRoles,
  markEmailVerified,
  updateLastLogin,
  type SelectableMembershipRole,
} from "./auth.repository.js";

const WRONG_CREDENTIALS_MESSAGE = "Email or password is incorrect";
const INVALID_TOKEN_MESSAGE = "This link is invalid or has expired";

/** Same body whether or not the email exists, has a password or is suspended (no account enumeration). */
export const FORGOT_PASSWORD_MESSAGE =
  "If an account exists for this email, we sent a link to reset the password";
export const EMAIL_VERIFICATION_REQUEST_MESSAGE =
  "If your email needs verifying, we sent a link to verify it";

/** Fires the send but never awaits it in the request path, and never logs the message itself (only that sending failed). */
function sendEmailWithoutBlocking(
  emailSender: EmailSender,
  message: Parameters<EmailSender["send"]>[0],
): void {
  void emailSender.send(message).catch((err: unknown) => {
    logger.error({ err }, "Failed to send email");
  });
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginContext {
  ip?: string;
  userAgent?: string;
  /** The session cookie already on the request, if any; rotated out on a successful login (ADR 0003). */
  existingToken?: string;
}

export interface LoginResult {
  token: string;
  expiresAt: Date;
  body: MeResponse;
}

function toRoleOption(candidate: SelectableMembershipRole): MeResponse["roles"][number] {
  return {
    membershipRoleId: candidate.id,
    schoolId: candidate.schoolId,
    schoolName: candidate.school.name,
    roleKey: candidate.role.key as RoleKey,
  };
}

function buildMeResponse(
  user: {
    id: string;
    email: string;
    locale: MeResponse["user"]["locale"];
    isPlatformOperator: boolean;
  },
  candidates: SelectableMembershipRole[],
  activeMembershipRoleId: string | null,
): MeResponse {
  const roles = candidates.map(toRoleOption);
  const activeRole = activeMembershipRoleId
    ? (roles.find((role) => role.membershipRoleId === activeMembershipRoleId) ?? null)
    : null;

  return {
    user: {
      id: user.id,
      email: user.email,
      locale: user.locale,
      isPlatformOperator: user.isPlatformOperator,
    },
    activeRole,
    roles,
  };
}

export async function login(input: LoginInput, context: LoginContext): Promise<LoginResult> {
  const email = input.email.toLowerCase();
  const user = await findUserByEmail(email);

  // Always runs a real Argon2id verify, even when the user or password doesn't exist, so
  // the response time can't reveal which emails are registered (permissions.md threat S1).
  const passwordOk = await verifyPasswordOrDummy(user?.passwordHash ?? null, input.password);

  if (!user || !passwordOk || user.status !== "ACTIVE") {
    throw unauthenticated(WRONG_CREDENTIALS_MESSAGE);
  }

  // Session rotation on sign-in (ADR 0003, threat S4): drop whatever session the browser
  // was already carrying before issuing a new one.
  if (context.existingToken) {
    await deleteSessionByTokenHash(hashSessionToken(context.existingToken));
  }

  const candidates = await listSelectableMembershipRoles(user.id);
  const onlyCandidate = candidates.length === 1 ? candidates[0] : undefined;
  const activeMembershipRoleId = onlyCandidate?.id ?? null;

  const token = generateSessionToken();
  const now = new Date();
  const absoluteExpiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_TTL_MS);

  await createSession({
    userId: user.id,
    tokenHash: hashSessionToken(token),
    activeMembershipRoleId,
    ip: context.ip,
    userAgent: context.userAgent,
    lastSeenAt: now,
    idleExpiresAt: new Date(now.getTime() + SESSION_IDLE_TTL_MS),
    absoluteExpiresAt,
  });

  await updateLastLogin(user.id, now);

  return {
    token,
    expiresAt: absoluteExpiresAt,
    body: buildMeResponse(user, candidates, activeMembershipRoleId),
  };
}

export async function logout(token: string): Promise<void> {
  await deleteSessionByTokenHash(hashSessionToken(token));
}

export async function getMe(auth: AuthContext): Promise<MeResponse> {
  const candidates = await listSelectableMembershipRoles(auth.user.id);
  return buildMeResponse(auth.user, candidates, auth.activeRole?.membershipRoleId ?? null);
}

/**
 * Always resolves, whatever the email turns out to be (threat S1/S6: no account
 * enumeration). Only an ACTIVE user with that email gets a token and an email.
 */
export async function forgotPassword(email: string, emailSender: EmailSender): Promise<void> {
  const user = await findUserByEmail(email.toLowerCase());

  if (user && user.status === "ACTIVE") {
    const token = await createAuthToken(user.id, "PASSWORD_RESET");
    const link = `${config.APP_URL}/reset-password?token=${token}`;
    sendEmailWithoutBlocking(emailSender, { to: user.email, ...passwordResetEmailContent(link) });
  }
}

/**
 * A valid token hashes the new password, consumes the token, verifies the email (the link
 * proved the address), and revokes every session (ADR 0003) — all in one transaction, so a
 * failure partway through leaves the token unused and nothing else changed. The "password
 * changed" notice is only sent after the transaction commits. Any other token (wrong type,
 * used, expired, unknown, or racing another request for the same token) throws the same
 * generic error.
 */
export async function resetPassword(
  token: string,
  password: string,
  emailSender: EmailSender,
): Promise<void> {
  const passwordHash = await hashPassword(password);
  const now = new Date();

  const user = await getPrismaClient().$transaction(async (tx) => {
    const consumed = await consumeAuthToken(token, "PASSWORD_RESET", tx);
    if (!consumed) return null;

    const updated = await completePasswordReset(consumed.userId, passwordHash, now, tx);
    await deleteAllSessionsForUser(consumed.userId, tx);
    return updated;
  });

  if (!user) throw validationFailed(INVALID_TOKEN_MESSAGE);

  sendEmailWithoutBlocking(emailSender, { to: user.email, ...passwordChangedEmailContent() });
}

/** Sends a verification email only if the user's address isn't verified yet. Always resolves. */
export async function requestEmailVerification(
  authUser: AuthUser,
  emailSender: EmailSender,
): Promise<void> {
  const user = await findUserById(authUser.id);
  if (!user || user.emailVerifiedAt) return;

  const token = await createAuthToken(user.id, "EMAIL_VERIFICATION");
  const link = `${config.APP_URL}/verify-email?token=${token}`;
  sendEmailWithoutBlocking(emailSender, { to: user.email, ...emailVerificationEmailContent(link) });
}

/**
 * A valid token consumes it and verifies the email in one transaction. Any other token
 * (wrong type, used, expired, unknown, or racing another request for the same token) throws
 * the same generic error as a password reset.
 */
export async function verifyEmail(token: string): Promise<void> {
  const now = new Date();

  const consumed = await getPrismaClient().$transaction(async (tx) => {
    const result = await consumeAuthToken(token, "EMAIL_VERIFICATION", tx);
    if (!result) return null;

    await markEmailVerified(result.userId, now, tx);
    return result;
  });

  if (!consumed) throw validationFailed(INVALID_TOKEN_MESSAGE);
}
