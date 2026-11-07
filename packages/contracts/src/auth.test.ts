import { describe, expect, it } from "vitest";
import {
  ForgotPasswordRequestSchema,
  LoginRequestSchema,
  MeResponseSchema,
  MembershipRoleOptionSchema,
  PasswordSchema,
  ResetPasswordRequestSchema,
  VerifyEmailRequestSchema,
} from "./auth.js";

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

describe("PasswordSchema", () => {
  it("rejects fewer than 10 characters", () => {
    expect(PasswordSchema.safeParse("a".repeat(9)).success).toBe(false);
  });

  it("accepts exactly 10 characters", () => {
    expect(PasswordSchema.safeParse("a".repeat(10)).success).toBe(true);
  });

  it("accepts exactly 128 characters", () => {
    expect(PasswordSchema.safeParse("a".repeat(128)).success).toBe(true);
  });

  it("rejects more than 128 characters", () => {
    expect(PasswordSchema.safeParse("a".repeat(129)).success).toBe(false);
  });

  it("has no composition rules (all lowercase, no digits or symbols, is fine)", () => {
    expect(PasswordSchema.safeParse("alllowercase").success).toBe(true);
  });
});

describe("ForgotPasswordRequestSchema", () => {
  it("accepts a valid email", () => {
    expect(ForgotPasswordRequestSchema.safeParse({ email: "a@example.com" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(ForgotPasswordRequestSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("ResetPasswordRequestSchema", () => {
  it("accepts a token and a valid password", () => {
    const result = ResetPasswordRequestSchema.safeParse({
      token: "some-token",
      password: "a-valid-password",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password that is too short", () => {
    const result = ResetPasswordRequestSchema.safeParse({ token: "some-token", password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty token", () => {
    const result = ResetPasswordRequestSchema.safeParse({
      token: "",
      password: "a-valid-password",
    });
    expect(result.success).toBe(false);
  });
});

describe("VerifyEmailRequestSchema", () => {
  it("accepts a non-empty token", () => {
    expect(VerifyEmailRequestSchema.safeParse({ token: "some-token" }).success).toBe(true);
  });

  it("rejects an empty token", () => {
    expect(VerifyEmailRequestSchema.safeParse({ token: "" }).success).toBe(false);
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
