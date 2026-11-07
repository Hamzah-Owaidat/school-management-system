import { z } from "zod";
import { RoleKey } from "./permissions.js";

/** POST /api/v1/auth/login request body. */
export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/** At least 10 and at most 128 characters; no composition rules. Reused by password reset and invitations (#25). */
export const PasswordSchema = z.string().min(10).max(128);

/** A generic body for endpoints that must not reveal whether the action actually did anything (no account enumeration). */
export const MessageResponseSchema = z.object({ message: z.string() });

export type MessageResponse = z.infer<typeof MessageResponseSchema>;

/** POST /api/v1/auth/password/forgot request body. */
export const ForgotPasswordRequestSchema = z.object({
  email: z.email(),
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

/** POST /api/v1/auth/password/reset request body. */
export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  password: PasswordSchema,
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

/** POST /api/v1/auth/email/verify request body. */
export const VerifyEmailRequestSchema = z.object({
  token: z.string().min(1),
});

export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;

export const AuthUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  locale: z.enum(["ar", "en", "fr"]).nullable(),
  isPlatformOperator: z.boolean(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;

/** A role the session can use: one MembershipRole, with its school and role key. */
export const MembershipRoleOptionSchema = z.object({
  membershipRoleId: z.uuid(),
  schoolId: z.uuid(),
  schoolName: z.string(),
  roleKey: z.enum(RoleKey),
});

export type MembershipRoleOption = z.infer<typeof MembershipRoleOptionSchema>;

/** Shared by POST /api/v1/auth/login (200) and GET /api/v1/auth/me (200). */
export const MeResponseSchema = z.object({
  user: AuthUserSchema,
  activeRole: MembershipRoleOptionSchema.nullable(),
  roles: z.array(MembershipRoleOptionSchema),
});

export type MeResponse = z.infer<typeof MeResponseSchema>;
