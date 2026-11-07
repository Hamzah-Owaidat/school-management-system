import { describe, expect, it } from "vitest";
import {
  emailVerificationEmailContent,
  passwordChangedEmailContent,
  passwordResetEmailContent,
} from "./templates.js";

const TOKEN = "abc123_-unique-token-value";
const LINK = `http://localhost:3000/reset-password?token=${TOKEN}`;
const VERIFY_LINK = `http://localhost:3000/verify-email?token=${TOKEN}`;

function withoutTheLink(text: string, link: string): string {
  return text.split(link).join("");
}

describe("passwordResetEmailContent", () => {
  const content = passwordResetEmailContent(LINK);

  it("includes the link in the text and html bodies", () => {
    expect(content.text).toContain(LINK);
    expect(content.html).toContain(LINK);
  });

  it("never mentions the raw token outside of the link", () => {
    expect(withoutTheLink(content.text, LINK)).not.toContain(TOKEN);
    expect(withoutTheLink(content.html, LINK)).not.toContain(TOKEN);
  });

  it("mentions the 1 hour expiry", () => {
    expect(content.text).toContain("1 hour");
  });
});

describe("emailVerificationEmailContent", () => {
  const content = emailVerificationEmailContent(VERIFY_LINK);

  it("includes the link in the text and html bodies", () => {
    expect(content.text).toContain(VERIFY_LINK);
    expect(content.html).toContain(VERIFY_LINK);
  });

  it("never mentions the raw token outside of the link", () => {
    expect(withoutTheLink(content.text, VERIFY_LINK)).not.toContain(TOKEN);
    expect(withoutTheLink(content.html, VERIFY_LINK)).not.toContain(TOKEN);
  });

  it("mentions the 24 hour expiry", () => {
    expect(content.text).toContain("24 hours");
  });
});

describe("passwordChangedEmailContent", () => {
  it("has no link or token", () => {
    const content = passwordChangedEmailContent();
    expect(content.text).not.toContain("http");
    expect(content.html).not.toContain("http");
  });
});
