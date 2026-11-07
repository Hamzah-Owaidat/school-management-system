import {
  ForgotPasswordRequestSchema,
  LoginRequestSchema,
  MeResponseSchema,
  MessageResponseSchema,
  ResetPasswordRequestSchema,
  VerifyEmailRequestSchema,
} from "@sms/contracts";
import type { Request } from "express";
import { Router } from "express";
import { ipKeyGenerator } from "express-rate-limit";
import type { EmailSender } from "../../core/email/index.js";
import { ErrorResponseSchema, openApiRegistry } from "../../core/openapi.js";
import { createRateLimiter, type RateLimitConfig } from "../../core/rate-limit.js";
import { requireAuth } from "../../core/session.js";
import { validate } from "../../core/validate.js";
import { createAuthController } from "./auth.controller.js";

openApiRegistry.registerPath({
  method: "post",
  path: "/api/v1/auth/login",
  tags: ["auth"],
  summary: "Sign in with email and password",
  request: { body: { content: { "application/json": { schema: LoginRequestSchema } } } },
  responses: {
    200: {
      description: "Signed in; the session cookie is set on the response",
      content: { "application/json": { schema: MeResponseSchema } },
    },
    401: {
      description: "Email or password is incorrect",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    429: {
      description: "Too many attempts",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: "/api/v1/auth/logout",
  tags: ["auth"],
  summary: "Sign out",
  responses: {
    204: {
      description: "Signed out; the session cookie is cleared. Safe to call with no session.",
    },
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: "/api/v1/auth/me",
  tags: ["auth"],
  summary: "The current session's user and role",
  responses: {
    200: {
      description: "The signed-in user, their active role and every role they can switch to",
      content: { "application/json": { schema: MeResponseSchema } },
    },
    401: {
      description: "Not signed in",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: "/api/v1/auth/password/forgot",
  tags: ["auth"],
  summary: "Request a password reset email",
  request: { body: { content: { "application/json": { schema: ForgotPasswordRequestSchema } } } },
  responses: {
    202: {
      description:
        "Always returned, whether or not the email exists, has a password or is suspended (no account enumeration)",
      content: { "application/json": { schema: MessageResponseSchema } },
    },
    429: {
      description: "Too many requests",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: "/api/v1/auth/password/reset",
  tags: ["auth"],
  summary: "Reset the password with a token from the forgot-password email",
  request: { body: { content: { "application/json": { schema: ResetPasswordRequestSchema } } } },
  responses: {
    204: { description: "Password changed; every session was revoked" },
    400: {
      description: "The token is invalid, used, expired, or the wrong type",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    429: {
      description: "Too many requests",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: "/api/v1/auth/email/verify/request",
  tags: ["auth"],
  summary: "Request an email verification email",
  responses: {
    202: {
      description: "Always returned; an email is sent only if the address isn't verified yet",
      content: { "application/json": { schema: MessageResponseSchema } },
    },
    401: {
      description: "Not signed in",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    429: {
      description: "Too many requests",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: "/api/v1/auth/email/verify",
  tags: ["auth"],
  summary: "Verify the email address with a token from the verification email",
  request: { body: { content: { "application/json": { schema: VerifyEmailRequestSchema } } } },
  responses: {
    204: { description: "Email verified" },
    400: {
      description: "The token is invalid, used, expired, or the wrong type",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
    429: {
      description: "Too many requests",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

function emailFromBody(req: Request): string {
  const body = req.body as { email?: unknown } | undefined;
  return typeof body?.email === "string" ? body.email.toLowerCase() : "";
}

export function createAuthRouter(
  emailSender: EmailSender,
  rateLimitConfig: RateLimitConfig,
): Router {
  const router = Router();
  const controller = createAuthController(emailSender);

  router.post(
    "/login",
    createRateLimiter(rateLimitConfig.loginPerIp),
    createRateLimiter({
      ...rateLimitConfig.loginPerIpAndEmail,
      keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? "")}:${emailFromBody(req)}`,
    }),
    validate({ body: LoginRequestSchema }),
    controller.login,
  );
  router.post("/logout", controller.logout);
  router.get("/me", requireAuth, controller.me);

  router.post(
    "/password/forgot",
    createRateLimiter(rateLimitConfig.forgotPasswordPerIp),
    createRateLimiter({
      ...rateLimitConfig.forgotPasswordPerEmail,
      keyGenerator: (req) => emailFromBody(req),
    }),
    validate({ body: ForgotPasswordRequestSchema }),
    controller.forgotPassword,
  );

  router.post(
    "/password/reset",
    createRateLimiter(rateLimitConfig.resetPerIp),
    validate({ body: ResetPasswordRequestSchema }),
    controller.resetPassword,
  );

  router.post(
    "/email/verify/request",
    requireAuth,
    createRateLimiter({
      ...rateLimitConfig.verificationRequestPerUser,
      keyGenerator: (req) => req.auth?.user.id ?? "anonymous",
    }),
    controller.requestEmailVerification,
  );

  router.post(
    "/email/verify",
    createRateLimiter(rateLimitConfig.verifyPerIp),
    validate({ body: VerifyEmailRequestSchema }),
    controller.verifyEmail,
  );

  return router;
}
