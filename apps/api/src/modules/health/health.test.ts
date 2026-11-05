import request from "supertest";
import { describe, expect, it } from "vitest";
import { HealthResponseSchema } from "@sms/contracts";
import { createApp } from "../../app.js";

describe("GET /api/v1/health", () => {
  it("returns database ok when the check succeeds, with an X-Request-Id header", async () => {
    const response = await request(createApp(() => Promise.resolve(true))).get("/api/v1/health");

    expect(response.status).toBe(200);
    const body = HealthResponseSchema.parse(response.body);
    expect(body.service).toBe("api");
    expect(body.database).toBe("ok");
    expect(response.headers["x-request-id"]).toBeTruthy();
  });

  it("returns database down when the check fails", async () => {
    const response = await request(createApp(() => Promise.resolve(false))).get("/api/v1/health");

    expect(response.status).toBe(200);
    const body = HealthResponseSchema.parse(response.body);
    expect(body.database).toBe("down");
  });
});
