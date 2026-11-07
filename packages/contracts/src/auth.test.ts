import { describe, expect, it } from "vitest";
import { LoginRequestSchema, MeResponseSchema, MembershipRoleOptionSchema } from "./auth.js";

describe("LoginRequestSchema", () => {
  it("accepts a valid email and password", () => {
    const result = LoginRequestSchema.safeParse({ email: "a@example.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = LoginRequestSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = LoginRequestSchema.safeParse({ email: "a@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("MembershipRoleOptionSchema", () => {
  it("accepts a known role key", () => {
    const result = MembershipRoleOptionSchema.safeParse({
      membershipRoleId: "4f6a0a4e-2b3b-4f45-9b1a-7b7f8e0f6e3a",
      schoolId: "4f6a0a4e-2b3b-4f45-9b1a-7b7f8e0f6e3b",
      schoolName: "Demo School",
      roleKey: "TEACHER",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown role key", () => {
    const result = MembershipRoleOptionSchema.safeParse({
      membershipRoleId: "4f6a0a4e-2b3b-4f45-9b1a-7b7f8e0f6e3a",
      schoolId: "4f6a0a4e-2b3b-4f45-9b1a-7b7f8e0f6e3b",
      schoolName: "Demo School",
      roleKey: "SUPERUSER",
    });
    expect(result.success).toBe(false);
  });
});

describe("MeResponseSchema", () => {
  it("accepts a user with no active role and no roles", () => {
    const result = MeResponseSchema.safeParse({
      user: {
        id: "4f6a0a4e-2b3b-4f45-9b1a-7b7f8e0f6e3a",
        email: "operator@demo.test",
        locale: null,
        isPlatformOperator: true,
      },
      activeRole: null,
      roles: [],
    });
    expect(result.success).toBe(true);
  });
});
