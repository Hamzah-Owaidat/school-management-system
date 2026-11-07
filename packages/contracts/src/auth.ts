import { z } from "zod";
import { RoleKey } from "./permissions.js";

/** POST /api/v1/auth/login request body. */
export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

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
