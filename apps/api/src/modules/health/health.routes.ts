import { Router } from "express";
import { HealthResponseSchema } from "@sms/contracts";
import { ErrorResponseSchema, openApiRegistry } from "../../core/openapi.js";
import { createHealthController } from "./health.controller.js";
import type { DatabaseCheck } from "./health.service.js";

openApiRegistry.registerPath({
  method: "get",
  path: "/api/v1/health",
  tags: ["health"],
  summary: "Service and database health",
  responses: {
    200: {
      description: 'The API is reachable; "database" reports whether PostgreSQL answered',
      content: { "application/json": { schema: HealthResponseSchema } },
    },
    500: {
      description: "Unexpected error",
      content: { "application/json": { schema: ErrorResponseSchema } },
    },
  },
});

/** This module has no request input (so no schemas.ts), no permission check (so no policy.ts, it's public) and no table of its own (so no repository.ts) — it only reads @sms/db's connection check. */
export function createHealthRouter(checkDatabase: DatabaseCheck): Router {
  const router = Router();
  router.get("/", createHealthController(checkDatabase));
  return router;
}
