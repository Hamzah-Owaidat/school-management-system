import { config, type Config } from "../config.js";
import { logger } from "../logger.js";
import { createConsoleEmailSender } from "./console-email-sender.js";
import { createSmtpEmailSender } from "./smtp-email-sender.js";
import type { EmailSender } from "./email-sender.js";

export type { EmailMessage, EmailSender } from "./email-sender.js";
export { createInMemoryEmailSender, type InMemoryEmailSender } from "./in-memory-email-sender.js";
export * from "./templates.js";

/** Picks the sender by EMAIL_TRANSPORT ("smtp" | "console"); config.ts refuses "console" in production. */
export function createEmailSender(cfg: Config = config): EmailSender {
  if (cfg.EMAIL_TRANSPORT === "console") {
    return createConsoleEmailSender(logger);
  }

  return createSmtpEmailSender({
    host: cfg.SMTP_HOST,
    port: cfg.SMTP_PORT,
    user: cfg.SMTP_USER || undefined,
    password: cfg.SMTP_PASSWORD || undefined,
    from: cfg.MAIL_FROM,
  });
}
