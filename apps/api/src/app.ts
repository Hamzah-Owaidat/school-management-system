import { checkDatabaseConnection } from "@sms/db";
import express, { type Express } from "express";
import helmet from "helmet";
import { config } from "./core/config.js";
import { createEmailSender, type EmailSender } from "./core/email/index.js";
import { errorHandler } from "./core/error-handler.js";
import { httpLogger } from "./core/logger.js";
import { notFoundHandler } from "./core/not-found-handler.js";
import { DEFAULT_RATE_LIMIT_CONFIG, type RateLimitConfig } from "./core/rate-limit.js";
import { requestId } from "./core/request-id.js";
import { createSessionMiddleware } from "./core/session.js";
import { createApiRouter } from "./modules/index.js";
import type { DatabaseCheck } from "./modules/health/health.service.js";

export type { DatabaseCheck };

const JSON_BODY_LIMIT = "1mb";

/** Builds the Express app. Kept separate from server.ts so tests can use it without opening a port. */
export function createApp(
  checkDatabase: DatabaseCheck = checkDatabaseConnection,
  emailSender: EmailSender = createEmailSender(),
  rateLimitConfig: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG,
): Express {
  const app = express();

  // Number of proxy hops in front of the API, so req.ip (used by the rate limiters) is the
  // real client's address, not the proxy's.
  app.set("trust proxy", config.TRUST_PROXY);
  app.disable("x-powered-by");
  app.use(requestId);
  app.use(httpLogger);
  app.use(helmet());
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use(createSessionMiddleware());

  app.use("/api/v1", createApiRouter({ checkDatabase, emailSender, rateLimitConfig }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
