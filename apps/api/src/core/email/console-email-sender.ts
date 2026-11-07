import type { Logger } from "pino";
import type { EmailMessage, EmailSender } from "./email-sender.js";

/**
 * Development only (config.ts refuses it in production). Logs the full message, including
 * any reset/verification link and its token, through the logger — the whole point of this
 * sender is to let you read the email in the terminal. Never do this anywhere else:
 * core/logger.ts redacts tokens, and the real senders never log message content.
 */
export function createConsoleEmailSender(logger: Logger): EmailSender {
  return {
    send(message: EmailMessage): Promise<void> {
      logger.info(
        { to: message.to, subject: message.subject, text: message.text },
        "Email (console transport, development only)",
      );
      return Promise.resolve();
    },
  };
}
