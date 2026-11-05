import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client.js";

export type { PrismaClient } from "./generated/client.js";

let client: PrismaClient | undefined;

/** Creates a new PrismaClient wired to PostgreSQL through the pg driver adapter. */
export function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

/** Lazily-created default client, shared by the process that calls this. */
export function getPrismaClient(): PrismaClient {
  client ??= createPrismaClient();
  return client;
}

/** Runs SELECT 1 to check that the database is reachable. */
export async function checkDatabaseConnection(
  client: PrismaClient = getPrismaClient(),
): Promise<boolean> {
  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
