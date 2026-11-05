import { ErrorCode } from "@sms/contracts";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

/** An error with a stable code and HTTP status, safe to send to the client as-is. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

export function validationFailed(message: string, details?: unknown): AppError {
  return new AppError(ErrorCode.VALIDATION_FAILED, message, details);
}

export function unauthenticated(message = "Authentication required"): AppError {
  return new AppError(ErrorCode.UNAUTHENTICATED, message);
}

export function forbidden(message = "You are not allowed to do this"): AppError {
  return new AppError(ErrorCode.FORBIDDEN, message);
}

export function notFound(message = "Not found"): AppError {
  return new AppError(ErrorCode.NOT_FOUND, message);
}

export function conflict(
  message = "This conflicts with existing data",
  details?: unknown,
): AppError {
  return new AppError(ErrorCode.CONFLICT, message, details);
}

export function rateLimited(message = "Too many requests"): AppError {
  return new AppError(ErrorCode.RATE_LIMITED, message);
}
