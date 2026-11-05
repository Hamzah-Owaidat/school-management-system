import { describe, expect, it } from "vitest";
import { ErrorCode, ErrorResponseSchema } from "./errors.js";

describe("ErrorResponseSchema", () => {
  it("accepts a valid error response", () => {
    const result = ErrorResponseSchema.safeParse({
      error: { code: ErrorCode.NOT_FOUND, message: "Not found", requestId: "abc-123" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts an error response with details", () => {
    const result = ErrorResponseSchema.safeParse({
      error: {
        code: ErrorCode.VALIDATION_FAILED,
        message: "Validation failed",
        details: [{ path: "email", message: "Required" }],
        requestId: "abc-123",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown error code", () => {
    const result = ErrorResponseSchema.safeParse({
      error: { code: "NOPE", message: "Not found", requestId: "abc-123" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing requestId", () => {
    const result = ErrorResponseSchema.safeParse({
      error: { code: ErrorCode.INTERNAL, message: "Something went wrong" },
    });
    expect(result.success).toBe(false);
  });
});
