import pino from "pino";
import { pinoHttp } from "pino-http";
import { config } from "./config.js";
import { getRequestId } from "./request-id.js";

/** Redacts credentials wherever they might appear in a logged object (threat P1: no secrets in logs). */
const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
  "password",
  "token",
  "secret",
  "*.password",
  "*.token",
  "*.secret",
];

export const logger = pino({
  level: config.LOG_LEVEL,
  redact: { paths: REDACT_PATHS, censor: "[redacted]" },
  transport: config.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
});

/**
 * Logs one line per request (request ID, method, path, status, duration).
 * Never logs request bodies (threat P1) — only pino-http's own req/res metadata.
 */
export const httpLogger = pinoHttp({
  logger,
  // Our own requestId middleware (core/request-id.ts) runs first and already set req.id.
  genReqId: getRequestId,
});
