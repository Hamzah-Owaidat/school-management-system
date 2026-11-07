import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  // `pnpm build`/`pnpm test` must work with no .env and no database (see packages/db),
  // so a placeholder keeps config loading from failing when DATABASE_URL isn't set.
  DATABASE_URL: z.string().min(1).default("postgresql://localhost:5432/placeholder"),
  // "console" (dev only) logs emails through the logger instead of sending them; refused
  // in production below.
  EMAIL_TRANSPORT: z.enum(["smtp", "console"]).default("smtp"),
  SMTP_HOST: z.string().min(1).default("localhost"),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_USER: z.string().default(""),
  SMTP_PASSWORD: z.string().default(""),
  MAIL_FROM: z.email().default("no-reply@school-management-system.local"),
  // The web app's public base URL; reset/verification email links are built from it.
  APP_URL: z.url().default("http://localhost:3000"),
  // Number of proxy hops in front of the API (Express "trust proxy"), so req.ip is the
  // real client, not the proxy's address. 0 in development; 1 in staging/production (Caddy).
  TRUST_PROXY: z.coerce.number().int().nonnegative().default(0),
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

  // The console transport logs full email content (including reset/verification links) —
  // fine for local development, never acceptable in production.
  if (result.data.NODE_ENV === "production" && result.data.EMAIL_TRANSPORT === "console") {
    throw new Error(
      'Invalid environment configuration:\n  EMAIL_TRANSPORT: Cannot be "console" in production',
    );
  }

  return result.data;
}

export const config = loadConfig();

/** A session expires this long after its last activity (ADR 0003: 7 days). */
export const SESSION_IDLE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** A session expires this long after sign-in at the latest, regardless of activity (ADR 0003: 30 days). */
export const SESSION_ABSOLUTE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** The session middleware only extends idleExpiresAt/lastSeenAt this often, so most requests skip a write. */
export const SESSION_ACTIVITY_EXTEND_THRESHOLD_MS = 5 * 60 * 1000;
