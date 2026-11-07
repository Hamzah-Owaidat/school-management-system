import nodemailer from "nodemailer";
import type { EmailMessage, EmailSender } from "./email-sender.js";

export interface SmtpSenderConfig {
  host: string;
  port: number;
  user?: string;
  password?: string;
  from: string;
}

/** The real sender: SMTP via nodemailer. Mailpit catches everything locally (D-10). */
export function createSmtpEmailSender(smtpConfig: SmtpSenderConfig): EmailSender {
  const transport = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: false,
    auth: smtpConfig.user ? { user: smtpConfig.user, pass: smtpConfig.password } : undefined,
  });

  return {
    async send(message: EmailMessage): Promise<void> {
      await transport.sendMail({ from: smtpConfig.from, ...message });
    },
  };
}
