import express from "express";
import request from "supertest";
import { z } from "zod";
import { Prisma } from "@sms/db";
import { describe, expect, it } from "vitest";
import { conflict, notFound } from "./errors.js";
import { errorHandler } from "./error-handler.js";
import { requestId } from "./request-id.js";

function buildApp() {
  const app = express();
  app.use(requestId);
  app.use(express.json());

  app.get("/app-error", (_req, _res, next) => next(notFound("No such widget")));

  app.get("/zod-error", () => {
    z.object({ name: z.string() }).parse({});
  });

  app.get("/boom", () => {
    throw new Error("super secret stack trace detail");
  });

  app.get("/conflict", (_req, _res, next) => next(conflict()));

  app.get("/prisma-unique", () => {
    throw new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed on the fields: (slug)",
      {
        code: "P2002",
        clientVersion: "7.10.1",
        meta: { target: ["schools", "slug"], modelName: "School" },
      },
    );
  });

  app.get("/prisma-not-found", () => {
    throw new Prisma.PrismaClientKnownRequestError(
      "An operation failed because it depends on one or more records that were required but not found.",
      {
        code: "P2025",
        clientVersion: "7.10.1",
      },
    );
  });

  app.post("/echo", (req, res) => res.json(req.body));

  app.use(errorHandler);
  return app;
}

describe("errorHandler", () => {
  it("passes an AppError's code, status and message straight through", async () => {
    const response = await request(buildApp()).get("/app-error");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
    expect(response.body.error.message).toBe("No such widget");
    expect(response.body.error.requestId).toBeTruthy();
  });

  it("maps a ZodError to 400 VALIDATION_FAILED", async () => {
    const response = await request(buildApp()).get("/zod-error");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_FAILED");
    expect(response.body.error.details).toBeDefined();
  });

  it("maps malformed JSON to 400 VALIDATION_FAILED", async () => {
    const response = await request(buildApp())
      .post("/echo")
      .set("Content-Type", "application/json")
      .send("{not valid json");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("maps an unexpected Error to 500 INTERNAL with no stack, message or SQL", async () => {
    const response = await request(buildApp()).get("/boom");

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe("INTERNAL");
    expect(response.body.error.message).toBe("Something went wrong");
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain("super secret stack trace detail");
    expect(serialized).not.toMatch(/at .*\(.*:\d+:\d+\)/);
  });

  it("maps a Prisma unique-constraint error to 409 CONFLICT without leaking field or table names", async () => {
    const response = await request(buildApp()).get("/prisma-unique");

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain("slug");
    expect(serialized).not.toContain("schools");
    expect(serialized).not.toContain("School");
  });

  it("maps a Prisma record-not-found error to 404 NOT_FOUND", async () => {
    const response = await request(buildApp()).get("/prisma-not-found");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});
