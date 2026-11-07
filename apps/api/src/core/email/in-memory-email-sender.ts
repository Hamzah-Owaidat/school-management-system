import type { EmailMessage, EmailSender } from "./email-sender.js";

export interface InMemoryEmailSender extends EmailSender {
  readonly messages: EmailMessage[];
}

/** Records every "sent" message instead of delivering it. For tests only. */
export function createInMemoryEmailSender(): InMemoryEmailSender {
  const messages: EmailMessage[] = [];

  return {
    messages,
    send(message: EmailMessage): Promise<void> {
      messages.push(message);
      return Promise.resolve();
    },
  };
}
