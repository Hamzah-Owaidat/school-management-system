import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  // `pnpm build`/`pnpm test` must work with no .env and no database (see packages/db),
  // so a placeholder keeps config loading from failing when DATABASE_URL isn't set.
  DATABASE_URL: z.string().min(1).default("postgresql://localhost:5432/placeholder"),
});

export type Config = z.infer<typeof EnvSchema>;

/** Parses process.env with Zod, throwing a readable error if a variable is invalid. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = EnvSchema.safeParse(env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  // The placeholder above only exists so dev/test can run with no .env and no
  // database; a production process must always be told the real database.
  if (result.data.NODE_ENV === "production" && !env.DATABASE_URL) {
    throw new Error("Invalid environment configuration:\n  DATABASE_URL: Required in production");
  }

  return result.data;
}

export const config = loadConfig();
