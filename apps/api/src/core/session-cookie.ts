import { parse, serialize } from "cookie";
import type { Request, Response } from "express";
import { config as defaultConfig, type Config } from "./config.js";

export interface SessionCookie {
  /** The cookie's name: `__Host-sms_session` in production, `sms_session` otherwise. */
  name: string;
  /** Sets the session cookie, expiring it at the session's absolute expiry. */
  set(res: Response, token: string, expiresAt: Date): void;
  /** Clears the session cookie (same attributes, empty value, expired in the past). */
  clear(res: Response): void;
  /** Reads the session token from the request's Cookie header, if present. */
  read(req: Request): string | undefined;
}

/**
 * Builds the session cookie helpers from a Config, so behavior that differs between
 * development and production (name, Secure) can be tested without depending on the
 * process's real environment.
 */
export function createSessionCookie(cfg: Config = defaultConfig): SessionCookie {
  const isProduction = cfg.NODE_ENV === "production";
  // __Host- requires Secure, Path=/ and no Domain attribute, all true below (ADR 0003).
  const name = isProduction ? "__Host-sms_session" : "sms_session";

  function baseOptions() {
    return {
      httpOnly: true,
      sameSite: "lax" as const,
      path: "/",
      secure: isProduction,
    };
  }

  return {
    name,
    set(res, token, expiresAt) {
      res.append("Set-Cookie", serialize(name, token, { ...baseOptions(), expires: expiresAt }));
    },
    clear(res) {
      res.append("Set-Cookie", serialize(name, "", { ...baseOptions(), expires: new Date(0) }));
    },
    read(req) {
      const header = req.headers.cookie;
      if (!header) return undefined;
      return parse(header)[name];
    },
  };
}

/** The session cookie built from the process's real config; what the app actually uses. */
export const sessionCookie = createSessionCookie();
