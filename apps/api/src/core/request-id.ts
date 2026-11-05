import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { NextFunction, Request, Response } from "express";

export const REQUEST_ID_HEADER = "X-Request-Id";

const SAFE_REQUEST_ID = /^[A-Za-z0-9-]{1,128}$/;

/**
 * Reuses a safe incoming X-Request-Id, otherwise generates one; always echoed back on the
 * response. `req.id` itself is typed by pino-http (core/logger.ts), which augments
 * `http.IncomingMessage` with `id: ReqId` — we only ever assign it a string here.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER);
  const id = incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  req.id = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
}

/** Reads back the string set by `requestId` above (pino-http types `req.id` as `string | number | object`). */
export function getRequestId(req: IncomingMessage): string {
  return typeof req.id === "string" ? req.id : "";
}
