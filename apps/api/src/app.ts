import { checkDatabaseConnection } from "@sms/db";
import express, { type Express } from "express";
import type { HealthResponse } from "@sms/contracts";

export type DatabaseCheck = () => Promise<boolean>;

/** Builds the Express app. Kept separate from server.ts so tests can use it without opening a port. */
export function createApp(checkDatabase: DatabaseCheck = checkDatabaseConnection): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

  app.get("/api/health", async (_req, res) => {
    const databaseOk = await checkDatabase();
    const body: HealthResponse = {
      status: "ok",
      service: "api",
      database: databaseOk ? "ok" : "down",
      time: new Date().toISOString(),
    };
    res.json(body);
  });

  return app;
}
