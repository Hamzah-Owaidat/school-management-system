import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("loadConfig", () => {
  it("applies defaults when nothing is set", () => {
    const config = loadConfig({});
    expect(config.NODE_ENV).toBe("development");
    expect(config.API_PORT).toBe(4000);
    expect(config.LOG_LEVEL).toBe("info");
  });

  it("parses valid overrides", () => {
    const config = loadConfig({
      NODE_ENV: "production",
      API_PORT: "8080",
      LOG_LEVEL: "debug",
      DATABASE_URL: "postgresql://real-host:5432/sms",
    });
    expect(config.NODE_ENV).toBe("production");
    expect(config.API_PORT).toBe(8080);
    expect(config.LOG_LEVEL).toBe("debug");
    expect(config.DATABASE_URL).toBe("postgresql://real-host:5432/sms");
  });

  it("throws a readable error for an invalid API_PORT", () => {
    expect(() => loadConfig({ API_PORT: "not-a-number" })).toThrow(/API_PORT/);
  });

  it("throws a readable error for an invalid LOG_LEVEL", () => {
    expect(() => loadConfig({ LOG_LEVEL: "verbose" })).toThrow(/LOG_LEVEL/);
  });

  it("falls back to the placeholder DATABASE_URL in development", () => {
    const config = loadConfig({ NODE_ENV: "development" });
    expect(config.DATABASE_URL).toBe("postgresql://localhost:5432/placeholder");
  });

  it("falls back to the placeholder DATABASE_URL in test", () => {
    const config = loadConfig({ NODE_ENV: "test" });
    expect(config.DATABASE_URL).toBe("postgresql://localhost:5432/placeholder");
  });

  it("requires DATABASE_URL in production", () => {
    expect(() => loadConfig({ NODE_ENV: "production" })).toThrow(/DATABASE_URL/);
  });

  it("accepts a real DATABASE_URL in production", () => {
    const config = loadConfig({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://real-host:5432/sms",
    });
    expect(config.DATABASE_URL).toBe("postgresql://real-host:5432/sms");
  });

  it("defaults EMAIL_TRANSPORT to smtp", () => {
    expect(loadConfig({}).EMAIL_TRANSPORT).toBe("smtp");
  });

  it("accepts EMAIL_TRANSPORT=console outside production", () => {
    const config = loadConfig({ NODE_ENV: "development", EMAIL_TRANSPORT: "console" });
    expect(config.EMAIL_TRANSPORT).toBe("console");
  });

  it("refuses EMAIL_TRANSPORT=console in production", () => {
    expect(() =>
      loadConfig({
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://real-host:5432/sms",
        EMAIL_TRANSPORT: "console",
      }),
    ).toThrow(/EMAIL_TRANSPORT/);
  });

  it("accepts EMAIL_TRANSPORT=smtp in production", () => {
    const config = loadConfig({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://real-host:5432/sms",
      EMAIL_TRANSPORT: "smtp",
    });
    expect(config.EMAIL_TRANSPORT).toBe("smtp");
  });

  it("applies email and app URL defaults", () => {
    const config = loadConfig({});
    expect(config.SMTP_HOST).toBe("localhost");
    expect(config.SMTP_PORT).toBe(1025);
    expect(config.SMTP_USER).toBe("");
    expect(config.SMTP_PASSWORD).toBe("");
    expect(config.MAIL_FROM).toBe("no-reply@school-management-system.local");
    expect(config.APP_URL).toBe("http://localhost:3000");
    expect(config.TRUST_PROXY).toBe(0);
  });

  it("parses TRUST_PROXY as a number", () => {
    expect(loadConfig({ TRUST_PROXY: "1" }).TRUST_PROXY).toBe(1);
  });
});
