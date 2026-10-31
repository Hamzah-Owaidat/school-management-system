import { HealthResponseSchema } from "@sms/contracts";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("GET /api/health", () => {
  it("returns ok with a valid body", async () => {
    const response = await request(createApp()).get("/api/health");

    expect(response.status).toBe(200);
    expect(HealthResponseSchema.parse(response.body).service).toBe("api");
  });
});
