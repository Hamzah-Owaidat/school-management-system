import { LoginRequestSchema, MeResponseSchema } from "@sms/contracts";
import { Router } from "express";
import { ErrorResponseSchema, openApiRegistry } from "../../core/openapi.js";
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

export function createAuthRouter(): Router {
  const router = Router();
  const controller = createAuthController();

  router.post("/login", validate({ body: LoginRequestSchema }), controller.login);
  router.post("/logout", controller.logout);
  router.get("/me", requireAuth, controller.me);

  return router;
}
