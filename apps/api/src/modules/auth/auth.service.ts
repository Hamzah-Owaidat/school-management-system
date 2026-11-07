import type { MeResponse, RoleKey } from "@sms/contracts";
import { SESSION_ABSOLUTE_TTL_MS, SESSION_IDLE_TTL_MS } from "../../core/config.js";
import { unauthenticated } from "../../core/errors.js";
import type { AuthContext } from "../../core/session.js";
import { generateSessionToken, hashSessionToken } from "../../core/session-token.js";
import { verifyPasswordOrDummy } from "./password.js";
import {
  createSession,
  deleteSessionByTokenHash,
  findUserByEmail,
  listSelectableMembershipRoles,
  updateLastLogin,
  type SelectableMembershipRole,
} from "./auth.repository.js";

const WRONG_CREDENTIALS_MESSAGE = "Email or password is incorrect";

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
