export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

/** English for now (translations come in #62). The link is the only place the token appears. */
export function passwordResetEmailContent(link: string): EmailContent {
  return {
    subject: "Reset your password",
    text: `We received a request to reset your password.\n\nUse this link within 1 hour:\n${link}\n\nIf you didn't request this, you can ignore this email — your password won't change.`,
    html: `<p>We received a request to reset your password.</p><p>Use this link within 1 hour:</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, you can ignore this email — your password won't change.</p>`,
  };
}

export function emailVerificationEmailContent(link: string): EmailContent {
  return {
    subject: "Verify your email address",
    text: `Confirm your email address using this link within 24 hours:\n${link}\n\nIf you didn't request this, you can ignore this email.`,
    html: `<p>Confirm your email address using this link within 24 hours:</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, you can ignore this email.</p>`,
  };
}

/** No link: sent after a password change so the account owner notices even if they didn't do it. */
export function passwordChangedEmailContent(): EmailContent {
  return {
    subject: "Your password was changed",
    text: "Your password was just changed. If this wasn't you, contact your school administrator immediately.",
    html: "<p>Your password was just changed. If this wasn't you, contact your school administrator immediately.</p>",
  };
}
