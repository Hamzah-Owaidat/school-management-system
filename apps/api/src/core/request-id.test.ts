import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { requestId } from "./request-id.js";

function buildApp() {
  const app = express();
  app.use(requestId);
  app.get("/echo", (req, res) => res.json({ id: req.id }));
  return app;
}

describe("requestId", () => {
  it("reuses a safe incoming X-Request-Id", async () => {
    const response = await request(buildApp()).get("/echo").set("X-Request-Id", "abc-123");

    expect(response.headers["x-request-id"]).toBe("abc-123");
    expect(response.body.id).toBe("abc-123");
  });

  it("replaces an unsafe incoming X-Request-Id with a generated UUID", async () => {
    const response = await request(buildApp())
      .get("/echo")
      .set("X-Request-Id", "has spaces/slashes");

    expect(response.headers["x-request-id"]).not.toBe("has spaces/slashes");
    expect(response.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("generates a UUID when no X-Request-Id is sent", async () => {
    const response = await request(buildApp()).get("/echo");

    expect(response.headers["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("replaces an incoming id longer than 128 characters", async () => {
    const response = await request(buildApp()).get("/echo").set("X-Request-Id", "a".repeat(129));

    expect(response.headers["x-request-id"]).toHaveLength(36);
  });
});
