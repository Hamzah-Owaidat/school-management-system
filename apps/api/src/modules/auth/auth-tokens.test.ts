import { describe, expect, it } from "vitest";
import {
  EMAIL_VERIFICATION_TOKEN_TTL_MS,
  PASSWORD_RESET_TOKEN_TTL_MS,
  generateAuthToken,
  hashAuthToken,
} from "./auth-tokens.js";

describe("generateAuthToken", () => {
  it("generates a unique token on every call", () => {
    expect(generateAuthToken()).not.toBe(generateAuthToken());
  });

  it("encodes 32 random bytes as base64url", () => {
    const token = generateAuthToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
  });
});

describe("hashAuthToken", () => {
  it("is deterministic", () => {
    const token = generateAuthToken();
    expect(hashAuthToken(token)).toBe(hashAuthToken(token));
  });

  it("produces a different hash for a different token", () => {
    expect(hashAuthToken(generateAuthToken())).not.toBe(hashAuthToken(generateAuthToken()));
  });

  it("produces a 64-character hex digest, never equal to the raw token", () => {
    const token = generateAuthToken();
    const hash = hashAuthToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toBe(token);
  });
});

describe("token expiry constants", () => {
  it("expires a password reset token after 1 hour", () => {
    expect(PASSWORD_RESET_TOKEN_TTL_MS).toBe(60 * 60 * 1000);
  });

  it("expires an email verification token after 24 hours", () => {
    expect(EMAIL_VERIFICATION_TOKEN_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });
});
