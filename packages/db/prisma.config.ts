import path from "node:path";
import { defineConfig } from "prisma/config";

try {
  process.loadEnvFile(path.join(import.meta.dirname, "..", "..", ".env"));
} catch {
  // No root .env (e.g. a CI build with no database) — fall back to real env vars.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // `prisma generate` never connects, so a placeholder keeps `pnpm build` working
    // with no .env and no database (e.g. CI). `migrate`/`studio` need the real value.
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/placeholder",
  },
});
