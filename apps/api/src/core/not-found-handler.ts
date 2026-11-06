import type { NextFunction, Request, Response } from "express";
import { ErrorCode, type ErrorResponse } from "@sms/contracts";
import { getRequestId } from "./request-id.js";

/** Catches any request that no route matched, in the same error shape as every other failure. */
export function notFoundHandler(req: Request, res: Response, _next: NextFunction): void {
  const body: ErrorResponse = {
    error: { code: ErrorCode.NOT_FOUND, message: "Not found", requestId: getRequestId(req) },
  };
  res.status(404).json(body);
}
