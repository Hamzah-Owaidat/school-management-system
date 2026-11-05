import { describe, expect, it } from "vitest";
import { HealthResponseSchema } from "./health.js";

describe("HealthResponseSchema", () => {
  it("accepts a valid health response", () => {
    const result = HealthResponseSchema.safeParse({
      status: "ok",
      service: "api",
      database: "ok",
      time: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown status", () => {
    const result = HealthResponseSchema.safeParse({
      status: "down",
      service: "api",
      database: "ok",
      time: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown database value", () => {
    const result = HealthResponseSchema.safeParse({
      status: "ok",
      service: "api",
      database: "unknown",
      time: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
