import { describe, expect, it } from "vitest";
import { generateSessionToken, hashSessionToken } from "./session-token.js";

describe("generateSessionToken", () => {
  it("generates a unique token on every call", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toBe(b);
  });

  it("encodes 32 random bytes as base64url", () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
  });
});

describe("hashSessionToken", () => {
  it("is deterministic", () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });

  it("produces a different hash for a different token", () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(hashSessionToken(a)).not.toBe(hashSessionToken(b));
  });

  it("produces a 64-character hex digest", () => {
    expect(hashSessionToken(generateSessionToken())).toMatch(/^[a-f0-9]{64}$/);
  });

  it("never equals the raw token", () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).not.toBe(token);
  });
});
