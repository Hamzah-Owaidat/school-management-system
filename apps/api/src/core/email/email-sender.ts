export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Sends one email. Implementations: SmtpEmailSender (real), ConsoleEmailSender (dev), InMemoryEmailSender (tests). */
export interface EmailSender {
  send(message: EmailMessage): Promise<void>;
}
