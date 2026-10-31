import { describe, expect, it } from "vitest";
import { HealthResponseSchema } from "./health.js";

describe("HealthResponseSchema", () => {
  it("accepts a valid health response", () => {
    const result = HealthResponseSchema.safeParse({
      status: "ok",
      service: "api",
      time: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown status", () => {
    const result = HealthResponseSchema.safeParse({
      status: "down",
      service: "api",
      time: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
