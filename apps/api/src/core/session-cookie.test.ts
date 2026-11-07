import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { loadConfig } from "./config.js";
import { createSessionCookie } from "./session-cookie.js";

function fakeResponse() {
  const headers: string[] = [];
  const res = {
    append: vi.fn((_name: string, value: string) => {
      headers.push(value);
    }),
  } as unknown as Response;
  return { res, headers };
}

describe("createSessionCookie in development", () => {
  const cookie = createSessionCookie(loadConfig({ NODE_ENV: "development" }));

  it("uses the plain cookie name", () => {
    expect(cookie.name).toBe("sms_session");
  });

  it("sets HttpOnly, SameSite=Lax, Path=/, without Secure", () => {
    const { res, headers } = fakeResponse();
    cookie.set(res, "token-value", new Date("2030-01-01T00:00:00Z"));

    expect(headers).toHaveLength(1);
    expect(headers[0]).toContain("sms_session=token-value");
    expect(headers[0]).toContain("HttpOnly");
    expect(headers[0]).toContain("SameSite=Lax");
    expect(headers[0]).toContain("Path=/");
    expect(headers[0]).not.toContain("Secure");
  });
});

describe("createSessionCookie in production", () => {
  const cookie = createSessionCookie(
    loadConfig({ NODE_ENV: "production", DATABASE_URL: "postgresql://real-host:5432/sms" }),
  );

  it("uses the __Host- prefixed cookie name", () => {
    expect(cookie.name).toBe("__Host-sms_session");
  });

  it("sets Secure in addition to HttpOnly, SameSite=Lax, Path=/", () => {
    const { res, headers } = fakeResponse();
    cookie.set(res, "token-value", new Date("2030-01-01T00:00:00Z"));

    expect(headers[0]).toContain("__Host-sms_session=token-value");
    expect(headers[0]).toContain("Secure");
    expect(headers[0]).toContain("HttpOnly");
    expect(headers[0]).toContain("SameSite=Lax");
    expect(headers[0]).toContain("Path=/");
  });

  it("clears the cookie with an empty value and a past expiry", () => {
    const { res, headers } = fakeResponse();
    cookie.clear(res);

    const [setCookieHeader] = headers;
    expect(setCookieHeader).toContain("__Host-sms_session=;");
    expect(setCookieHeader?.toLowerCase()).toContain("expires=thu, 01 jan 1970");
  });
});

describe("createSessionCookie read", () => {
  const cookie = createSessionCookie(loadConfig({ NODE_ENV: "development" }));

  it("reads the token from the Cookie header", () => {
    const req = { headers: { cookie: "sms_session=abc123; other=1" } } as unknown as Parameters<
      typeof cookie.read
    >[0];
    expect(cookie.read(req)).toBe("abc123");
  });

  it("returns undefined when there is no Cookie header", () => {
    const req = { headers: {} } as unknown as Parameters<typeof cookie.read>[0];
    expect(cookie.read(req)).toBeUndefined();
  });
});
