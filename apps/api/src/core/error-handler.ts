import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@sms/db";
import { ErrorCode, type ErrorResponse } from "@sms/contracts";
import { AppError } from "./errors.js";
import { logger } from "./logger.js";
import { getRequestId } from "./request-id.js";

interface ErrorShape {
  code: ErrorCode;
  status: number;
  message: string;
  details?: unknown;
}

function isMalformedJsonError(err: unknown): boolean {
  return (
    err instanceof SyntaxError &&
    (err as { status?: number }).status === 400 &&
    (err as { type?: string }).type === "entity.parse.failed"
  );
}

function shapeZodError(err: ZodError): ErrorShape {
  return {
    code: ErrorCode.VALIDATION_FAILED,
    status: 400,
    message: "Validation failed",
    details: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
  };
}

function shapePrismaError(err: Prisma.PrismaClientKnownRequestError): ErrorShape | undefined {
  // Messages below are intentionally generic: they never repeat err.meta, which can
  // carry table and column names straight from the database.
  if (err.code === "P2002") {
    return { code: ErrorCode.CONFLICT, status: 409, message: "This conflicts with existing data" };
  }
  if (err.code === "P2025") {
    return { code: ErrorCode.NOT_FOUND, status: 404, message: "Not found" };
  }
  return undefined;
}

function shapeError(err: unknown): ErrorShape {
  if (err instanceof AppError) {
    return { code: err.code, status: err.status, message: err.message, details: err.details };
  }

  if (err instanceof ZodError) {
    return shapeZodError(err);
  }

  if (isMalformedJsonError(err)) {
    return {
      code: ErrorCode.VALIDATION_FAILED,
      status: 400,
      message: "The request body is not valid JSON",
    };
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const shape = shapePrismaError(err);
    if (shape) return shape;
  }

  return { code: ErrorCode.INTERNAL, status: 500, message: "Something went wrong" };
}

/**
 * Turns every error into the shared { error: { code, message, details?, requestId } } shape.
 * Stack traces, SQL and internal messages are only ever logged, never sent to the client.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const shape = shapeError(err);
  const requestId = getRequestId(req);

  if (shape.code === ErrorCode.INTERNAL) {
    logger.error({ requestId, err }, "Unhandled error");
  } else {
    logger.warn({ requestId, code: shape.code, err }, "Request failed");
  }

  const body: ErrorResponse = {
    error: {
      code: shape.code,
      message: shape.message,
      ...(shape.details !== undefined ? { details: shape.details } : {}),
      requestId,
    },
  };
  res.status(shape.status).json(body);
}
