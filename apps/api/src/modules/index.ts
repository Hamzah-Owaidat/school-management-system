import { Router } from "express";
import type { EmailSender } from "../core/email/index.js";
import { buildOpenApiDocument } from "../core/openapi.js";
import type { RateLimitConfig } from "../core/rate-limit.js";
import { createAuthRouter } from "./auth/auth.routes.js";
import { createHealthRouter } from "./health/health.routes.js";
import type { DatabaseCheck } from "./health/health.service.js";

export interface ModuleDependencies {
  checkDatabase: DatabaseCheck;
  emailSender: EmailSender;
  rateLimitConfig: RateLimitConfig;
}

/** Mounts every module's router under /api/v1, plus the OpenAPI document they register into. */
export function createApiRouter(deps: ModuleDependencies): Router {
  const router = Router();

  router.use("/health", createHealthRouter(deps.checkDatabase));
  router.use("/auth", createAuthRouter(deps.emailSender, deps.rateLimitConfig));

  router.get("/openapi.json", (_req, res) => {
    res.json(buildOpenApiDocument());
  });

  return router;
}
