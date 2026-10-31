import express, { type Express } from "express";
import type { HealthResponse } from "@sms/contracts";

/** Builds the Express app. Kept separate from server.ts so tests can use it without opening a port. */
export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    const body: HealthResponse = {
      status: "ok",
      service: "api",
      time: new Date().toISOString(),
    };
    res.json(body);
  });

  return app;
}
