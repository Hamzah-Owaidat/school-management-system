import { checkDatabaseConnection } from "@sms/db";
import express, { type Express } from "express";
import helmet from "helmet";
import { errorHandler } from "./core/error-handler.js";
import { httpLogger } from "./core/logger.js";
import { notFoundHandler } from "./core/not-found-handler.js";
import { requestId } from "./core/request-id.js";
import { createApiRouter } from "./modules/index.js";
import type { DatabaseCheck } from "./modules/health/health.service.js";

export type { DatabaseCheck };

const JSON_BODY_LIMIT = "1mb";

/** Builds the Express app. Kept separate from server.ts so tests can use it without opening a port. */
export function createApp(checkDatabase: DatabaseCheck = checkDatabaseConnection): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestId);
  app.use(httpLogger);
  app.use(helmet());
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.use("/api/v1", createApiRouter({ checkDatabase }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
