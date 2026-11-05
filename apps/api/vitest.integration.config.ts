import path from "node:path";
import { defineConfig } from "vitest/config";

try {
  process.loadEnvFile(path.join(import.meta.dirname, "..", "..", ".env"));
} catch {
  // No root .env — fall back to real env vars (e.g. CI sets DATABASE_URL directly).
}

/** `pnpm test:integration`: needs a real database (DATABASE_URL), see README "Tests and CI". */
export default defineConfig({
  test: {
    include: ["**/*.integration.test.ts"],
  },
});
