import express from "express";
import request from "supertest";
import { z } from "zod";
import { describe, expect, it } from "vitest";
import { errorHandler } from "./error-handler.js";
import { notFoundHandler } from "./not-found-handler.js";
import { requestId } from "./request-id.js";
import { validate } from "./validate.js";

const BodySchema = z.object({ name: z.string() });
const QuerySchema = z.object({ page: z.coerce.number().default(1) });

function buildApp() {
  const app = express();
  app.use(requestId);
  app.use(express.json());

  app.post("/body", validate({ body: BodySchema }), (req, res) => {
    res.json({ received: req.body });
  });

  app.get("/query", validate({ query: QuerySchema }), (req, res) => {
    res.json({ received: req.query });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe("validate", () => {
  it("strips unknown fields and a client-sent schoolId from the body", async () => {
    const response = await request(buildApp())
      .post("/body")
      .send({ name: "Demo", schoolId: "forged-school-id", extra: "nope" });

    expect(response.status).toBe(200);
    expect(response.body.received).toEqual({ name: "Demo" });
  });

  it("strips unknown fields from the query", async () => {
    const response = await request(buildApp()).get("/query").query({ page: "2", schoolId: "x" });

    expect(response.status).toBe(200);
    expect(response.body.received).toEqual({ page: 2 });
  });

  it("returns VALIDATION_FAILED with field errors when the body is invalid", async () => {
    const response = await request(buildApp()).post("/body").send({});

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_FAILED");
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "name" })]),
    );
  });
});
