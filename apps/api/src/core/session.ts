import { getPrismaClient, type PrismaClient, type Prisma } from "@sms/db";
import type { RoleKey } from "@sms/contracts";
import type { NextFunction, Request, Response } from "express";
import { SESSION_ACTIVITY_EXTEND_THRESHOLD_MS, SESSION_IDLE_TTL_MS } from "./config.js";
import { unauthenticated } from "./errors.js";
import { sessionCookie } from "./session-cookie.js";
import { hashSessionToken } from "./session-token.js";

export interface ActiveRole {
  membershipRoleId: string;
  schoolId: string;
  schoolName: string;
  roleKey: RoleKey;
}

export interface AuthUser {
  id: string;
  email: string;
  locale: "ar" | "en" | "fr" | null;
  isPlatformOperator: boolean;
}

export interface AuthContext {
  sessionId: string;
  user: AuthUser;
  activeRole: ActiveRole | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

const SESSION_INCLUDE = {
  user: true,
  activeMembershipRole: { include: { role: true, school: true } },
} satisfies Prisma.AuthSessionInclude;

type LoadedSession = Prisma.AuthSessionGetPayload<{ include: typeof SESSION_INCLUDE }>;

function buildFindSession(prisma: PrismaClient) {
  return (tokenHash: string): Promise<LoadedSession | null> =>
    prisma.authSession.findUnique({ where: { tokenHash }, include: SESSION_INCLUDE });
}

function toActiveRole(
  membershipRole: NonNullable<LoadedSession["activeMembershipRole"]>,
): ActiveRole {
  return {
    membershipRoleId: membershipRole.id,
    schoolId: membershipRole.schoolId,
    schoolName: membershipRole.school.name,
    roleKey: membershipRole.role.key as RoleKey,
  };
}

/**
 * Loads the session from its cookie on every request. An expired session, a missing row,
 * or a non-ACTIVE user all leave the request anonymous (req.auth stays unset) and clear the
 * cookie; nothing else is treated as an error here — see requireAuth for that.
 */
export function createSessionMiddleware(prisma: PrismaClient = getPrismaClient()) {
  const findSession = buildFindSession(prisma);

  return async function sessionMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = sessionCookie.read(req);
    if (!token) {
      next();
      return;
    }

    const tokenHash = hashSessionToken(token);
    const authSession = await findSession(tokenHash);

    const now = new Date();
    const isExpired =
      !authSession || authSession.idleExpiresAt < now || authSession.absoluteExpiresAt < now;
    const isUserInactive = authSession ? authSession.user.status !== "ACTIVE" : false;

    if (!authSession || isExpired || isUserInactive) {
      if (authSession) {
        await prisma.authSession.deleteMany({ where: { id: authSession.id } });
      }
      sessionCookie.clear(res);
      next();
      return;
    }

    const msSinceLastSeen = now.getTime() - authSession.lastSeenAt.getTime();
    if (msSinceLastSeen >= SESSION_ACTIVITY_EXTEND_THRESHOLD_MS) {
      await prisma.authSession.update({
        where: { id: authSession.id },
        data: { lastSeenAt: now, idleExpiresAt: new Date(now.getTime() + SESSION_IDLE_TTL_MS) },
      });
    }

    req.auth = {
      sessionId: authSession.id,
      user: {
        id: authSession.user.id,
        email: authSession.user.email,
        locale: authSession.user.locale,
        isPlatformOperator: authSession.user.isPlatformOperator,
      },
      activeRole: authSession.activeMembershipRole
        ? toActiveRole(authSession.activeMembershipRole)
        : null,
    };

    next();
  };
}

/** Rejects a request with no valid session. Mount after createSessionMiddleware(). */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) {
    next(unauthenticated());
    return;
  }
  next();
}
