import type { HealthResponse } from "@sms/contracts";

export type DatabaseCheck = () => Promise<boolean>;

export async function getHealth(checkDatabase: DatabaseCheck): Promise<HealthResponse> {
  const databaseOk = await checkDatabase();
  return {
    status: "ok",
    service: "api",
    database: databaseOk ? "ok" : "down",
    time: new Date().toISOString(),
  };
}
