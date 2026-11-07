import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;

/** An opaque session token: 32 random bytes, base64url-encoded. Sent only in the cookie, never stored raw. */
export function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** SHA-256 hash of a session token, the only form stored in AuthSession.tokenHash. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
