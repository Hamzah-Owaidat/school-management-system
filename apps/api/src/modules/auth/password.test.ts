import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, verifyPasswordOrDummy } from "./password.js";

describe("hashPassword / verifyPassword", () => {
  it("verifies the correct password", async () => {
    const hash = await hashPassword("correct-password");
    await expect(verifyPassword(hash, "correct-password")).resolves.toBe(true);
  });

  it("rejects the wrong password", async () => {
    const hash = await hashPassword("correct-password");
    await expect(verifyPassword(hash, "wrong-password")).resolves.toBe(false);
  });

  it("hashes the same password differently each time (random salt)", async () => {
    const a = await hashPassword("same-password");
    const b = await hashPassword("same-password");
    expect(a).not.toBe(b);
  });
});

describe("verifyPasswordOrDummy", () => {
  it("verifies a real hash normally", async () => {
    const hash = await hashPassword("correct-password");
    await expect(verifyPasswordOrDummy(hash, "correct-password")).resolves.toBe(true);
    await expect(verifyPasswordOrDummy(hash, "wrong-password")).resolves.toBe(false);
  });

  it("returns false when there is no stored hash, after still running a verify", async () => {
    await expect(verifyPasswordOrDummy(null, "anything")).resolves.toBe(false);
  });
});
