import { describe, expect, it } from "vitest";
import type { PrismaClient } from "./generated/client.js";
import { checkDatabaseConnection } from "./index.js";

function fakeClient(queryRaw: () => Promise<unknown>): PrismaClient {
  return { $queryRaw: queryRaw } as unknown as PrismaClient;
}

describe("checkDatabaseConnection", () => {
  it("returns true when the query succeeds", async () => {
    const client = fakeClient(() => Promise.resolve([{ "?column?": 1 }]));
    await expect(checkDatabaseConnection(client)).resolves.toBe(true);
  });

  it("returns false when the query fails", async () => {
    const client = fakeClient(() => Promise.reject(new Error("connection refused")));
    await expect(checkDatabaseConnection(client)).resolves.toBe(false);
  });
});
