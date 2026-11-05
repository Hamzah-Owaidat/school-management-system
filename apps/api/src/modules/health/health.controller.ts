import type { Request, Response } from "express";
import { getHealth, type DatabaseCheck } from "./health.service.js";

export function createHealthController(checkDatabase: DatabaseCheck) {
  return async function getHealthHandler(_req: Request, res: Response): Promise<void> {
    res.json(await getHealth(checkDatabase));
  };
}
