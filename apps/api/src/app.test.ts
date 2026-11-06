import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("createApp", () => {
  it("returns a 404 in the shared error shape, with a requestId, for an unknown route", async () => {
    const response = await request(createApp(() => Promise.resolve(true))).get("/api/v1/nope");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
    expect(response.body.error.requestId).toBeTruthy();
    expect(response.headers["x-request-id"]).toBe(response.body.error.requestId);
  });

  it("returns 400 VALIDATION_FAILED for a malformed JSON body", async () => {
    const response = await request(createApp(() => Promise.resolve(true)))
      .get("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{not valid json");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("serves a valid OpenAPI document that includes /api/v1/health", async () => {
    const response = await request(createApp(() => Promise.resolve(true))).get(
      "/api/v1/openapi.json",
    );

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.1.0");
    expect(response.body.paths).toHaveProperty("/api/v1/health");
  });
});
