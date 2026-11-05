import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";

describe("GET /api/v1/health (integration)", () => {
  it("reports the database as ok against the real database", async () => {
    const response = await request(createApp()).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body.database).toBe("ok");
  });
});
