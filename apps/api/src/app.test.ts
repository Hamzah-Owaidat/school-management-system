import { HealthResponseSchema } from "@sms/contracts";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("GET /api/health", () => {
  it("returns database ok when the check succeeds", async () => {
    const response = await request(createApp(() => Promise.resolve(true))).get("/api/health");

    expect(response.status).toBe(200);
    const body = HealthResponseSchema.parse(response.body);
    expect(body.service).toBe("api");
    expect(body.database).toBe("ok");
  });

  it("returns database down when the check fails", async () => {
    const response = await request(createApp(() => Promise.resolve(false))).get("/api/health");

    expect(response.status).toBe(200);
    const body = HealthResponseSchema.parse(response.body);
    expect(body.database).toBe("down");
  });
});
