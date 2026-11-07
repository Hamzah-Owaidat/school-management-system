import { randomUUID } from "node:crypto";
import { checkDatabaseConnection, getPrismaClient } from "@sms/db";
import request, { type Response as SupertestResponse } from "supertest";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { createInMemoryEmailSender, type InMemoryEmailSender } from "../../core/email/index.js";
import { DEFAULT_RATE_LIMIT_CONFIG, type RateLimitConfig } from "../../core/rate-limit.js";
import { generateAuthToken, hashAuthToken } from "./auth-tokens.js";
import { hashPassword } from "./password.js";

const prisma = getPrismaClient();
const INVALID_TOKEN_MESSAGE = "This link is invalid or has expired";

const createdUserIds: string[] = [];

afterEach(async () => {
  await prisma.authToken.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.authSession.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  createdUserIds.length = 0;
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function createTestUser(
  options: { password?: string; status?: "ACTIVE" | "SUSPENDED" } = {},
) {
  const passwordHash = options.password ? await hashPassword(options.password) : null;
  const user = await prisma.user.create({
    data: {
      email: `pwreset-test-${randomUUID()}@example.test`,
      passwordHash,
      status: options.status ?? "ACTIVE",
    },
  });
  createdUserIds.push(user.id);
  return user;
}

function extractToken(text: string): string {
  const match = /token=([^&\s]+)/.exec(text);
  if (!match?.[1]) throw new Error(`Could not find a token in: ${text}`);
  return match[1];
}

function cookieNameValue(response: SupertestResponse): string {
  const raw = response.headers["set-cookie"] as string[] | string | undefined;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header) throw new Error("Response had no Set-Cookie header");
  const [nameValue] = header.split(";");
  if (!nameValue) throw new Error("Could not parse the Set-Cookie header");
  return nameValue;
}

describe("POST /api/v1/auth/password/forgot (integration)", () => {
  const emailSender = createInMemoryEmailSender();
  const app = createApp(checkDatabaseConnection, emailSender, DEFAULT_RATE_LIMIT_CONFIG);

  it("returns the identical status and body for an existing, unknown and suspended email", async () => {
    const password = "correct-password-123";
    const existingUser = await createTestUser({ password });
    const suspendedUser = await createTestUser({ password, status: "SUSPENDED" });

    const existing = await request(app)
      .post("/api/v1/auth/password/forgot")
      .send({ email: existingUser.email });
    const unknown = await request(app)
      .post("/api/v1/auth/password/forgot")
      .send({ email: `unknown-${randomUUID()}@example.test` });
    const suspended = await request(app)
      .post("/api/v1/auth/password/forgot")
      .send({ email: suspendedUser.email });

    expect(existing.status).toBe(202);
    expect(unknown.status).toBe(202);
    expect(suspended.status).toBe(202);
    expect(existing.body).toEqual(unknown.body);
    expect(existing.body).toEqual(suspended.body);
  });

  it("only emails the existing ACTIVE user, and the stored tokenHash is not the token in the link", async () => {
    const password = "correct-password-123";
    const suspendedUser = await createTestUser({ password, status: "SUSPENDED" });
    const user = await createTestUser({ password });

    await request(app)
      .post("/api/v1/auth/password/forgot")
      .send({ email: `unknown-${randomUUID()}@example.test` });
    await request(app).post("/api/v1/auth/password/forgot").send({ email: suspendedUser.email });

    const before = emailSender.messages.length;
    await request(app).post("/api/v1/auth/password/forgot").send({ email: user.email });

    expect(emailSender.messages).toHaveLength(before + 1);
    const message = emailSender.messages[before];
    expect(message?.to).toBe(user.email);

    const token = extractToken(message?.text ?? "");
    const row = await prisma.authToken.findFirst({
      where: { userId: user.id, type: "PASSWORD_RESET" },
    });
    expect(row).not.toBeNull();
    expect(row?.tokenHash).not.toBe(token);
  });

  it("makes the previous token invalid when requested a second time", async () => {
    const password = "correct-password-123";
    const user = await createTestUser({ password });

    await request(app).post("/api/v1/auth/password/forgot").send({ email: user.email });
    const firstToken = extractToken(emailSender.messages.at(-1)?.text ?? "");

    await request(app).post("/api/v1/auth/password/forgot").send({ email: user.email });
    const secondToken = extractToken(emailSender.messages.at(-1)?.text ?? "");

    const firstReset = await request(app)
      .post("/api/v1/auth/password/reset")
      .send({ token: firstToken, password: "a-new-password-1" });
    expect(firstReset.status).toBe(400);
    expect(firstReset.body.error.message).toBe(INVALID_TOKEN_MESSAGE);

    const secondReset = await request(app)
      .post("/api/v1/auth/password/reset")
      .send({ token: secondToken, password: "a-new-password-2" });
    expect(secondReset.status).toBe(204);
  });
});

describe("POST /api/v1/auth/password/reset (integration)", () => {
  const emailSender = createInMemoryEmailSender();
  const app = createApp(checkDatabaseConnection, emailSender, DEFAULT_RATE_LIMIT_CONFIG);

  async function requestResetToken(email: string): Promise<string> {
    await request(app).post("/api/v1/auth/password/forgot").send({ email });
    return extractToken(emailSender.messages.at(-1)?.text ?? "");
  }

  it("resets the password: old password fails, new one works, every session is gone, a notice is sent, email is verified", async () => {
    const oldPassword = "old-password-123";
    const newPassword = "new-password-456";
    const user = await createTestUser({ password: oldPassword });

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: oldPassword });
    expect(login.status).toBe(200);
    await expect(prisma.authSession.count({ where: { userId: user.id } })).resolves.toBeGreaterThan(
      0,
    );

    const token = await requestResetToken(user.email);
    const emailsBeforeReset = emailSender.messages.length;

    const reset = await request(app)
      .post("/api/v1/auth/password/reset")
      .send({ token, password: newPassword });
    expect(reset.status).toBe(204);

    await expect(prisma.authSession.count({ where: { userId: user.id } })).resolves.toBe(0);

    expect(emailSender.messages).toHaveLength(emailsBeforeReset + 1);
    expect(emailSender.messages.at(-1)?.subject).toMatch(/password was changed/i);

    const oldLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: oldPassword });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: newPassword });
    expect(newLogin.status).toBe(200);

    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(dbUser.emailVerifiedAt).not.toBeNull();
  });

  it("rejects a used, an expired, a wrong-type and a random token — all with the same message", async () => {
    const user = await createTestUser({ password: "some-password-123" });

    const usedToken = await requestResetToken(user.email);
    const used = await request(app)
      .post("/api/v1/auth/password/reset")
      .send({ token: usedToken, password: "new-password-aaa" });
    expect(used.status).toBe(204);
    const reused = await request(app)
      .post("/api/v1/auth/password/reset")
      .send({ token: usedToken, password: "new-password-bbb" });

    const expiredToken = generateAuthToken();
    await prisma.authToken.create({
      data: {
        userId: user.id,
        type: "PASSWORD_RESET",
        tokenHash: hashAuthToken(expiredToken),
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    const expired = await request(app)
      .post("/api/v1/auth/password/reset")
      .send({ token: expiredToken, password: "new-password-ccc" });

    const wrongTypeToken = generateAuthToken();
    await prisma.authToken.create({
      data: {
        userId: user.id,
        type: "EMAIL_VERIFICATION",
        tokenHash: hashAuthToken(wrongTypeToken),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    const wrongType = await request(app)
      .post("/api/v1/auth/password/reset")
      .send({ token: wrongTypeToken, password: "new-password-ddd" });

    const random = await request(app)
      .post("/api/v1/auth/password/reset")
      .send({ token: "not-a-real-token-at-all", password: "new-password-eee" });

    for (const response of [reused, expired, wrongType, random]) {
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("VALIDATION_FAILED");
      expect(response.body.error.message).toBe(INVALID_TOKEN_MESSAGE);
    }
  });
});

describe("Email verification (integration)", () => {
  const emailSender = createInMemoryEmailSender();
  const app = createApp(checkDatabaseConnection, emailSender, DEFAULT_RATE_LIMIT_CONFIG);

  it("request (authenticated) sends an email; verify sets emailVerifiedAt; reusing the token fails", async () => {
    const password = "correct-password-123";
    const user = await createTestUser({ password });
    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password });
    const cookie = cookieNameValue(login);

    const before = emailSender.messages.length;
    const requestResponse = await request(app)
      .post("/api/v1/auth/email/verify/request")
      .set("Cookie", cookie);
    expect(requestResponse.status).toBe(202);
    expect(emailSender.messages).toHaveLength(before + 1);

    const token = extractToken(emailSender.messages[before]?.text ?? "");

    const verify = await request(app).post("/api/v1/auth/email/verify").send({ token });
    expect(verify.status).toBe(204);

    const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(dbUser.emailVerifiedAt).not.toBeNull();

    const reused = await request(app).post("/api/v1/auth/email/verify").send({ token });
    expect(reused.status).toBe(400);
    expect(reused.body.error.message).toBe(INVALID_TOKEN_MESSAGE);
  });

  it("requires authentication to request a verification email", async () => {
    const response = await request(app).post("/api/v1/auth/email/verify/request");
    expect(response.status).toBe(401);
  });
});

describe("Rate limiting (integration)", () => {
  function appWithTightLimits(
    emailSender: InMemoryEmailSender,
    overrides: Partial<RateLimitConfig>,
  ) {
    const config: RateLimitConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, ...overrides };
    return createApp(checkDatabaseConnection, emailSender, config);
  }

  it("returns 429 RATE_LIMITED with Retry-After on the third forgot-password request", async () => {
    const app = appWithTightLimits(createInMemoryEmailSender(), {
      forgotPasswordPerIp: { windowMs: 60_000, limit: 2 },
    });
    const email = `ratelimit-forgot-${randomUUID()}@example.test`;

    await request(app).post("/api/v1/auth/password/forgot").send({ email });
    await request(app).post("/api/v1/auth/password/forgot").send({ email });
    const third = await request(app).post("/api/v1/auth/password/forgot").send({ email });

    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe("RATE_LIMITED");
    expect(third.headers["retry-after"]).toBeDefined();
  });

  it("returns 429 RATE_LIMITED with Retry-After on the third login attempt", async () => {
    const app = appWithTightLimits(createInMemoryEmailSender(), {
      loginPerIpAndEmail: { windowMs: 60_000, limit: 2 },
    });
    const email = `ratelimit-login-${randomUUID()}@example.test`;

    await request(app).post("/api/v1/auth/login").send({ email, password: "whatever-12345" });
    await request(app).post("/api/v1/auth/login").send({ email, password: "whatever-12345" });
    const third = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "whatever-12345" });

    expect(third.status).toBe(429);
    expect(third.body.error.code).toBe("RATE_LIMITED");
    expect(third.headers["retry-after"]).toBeDefined();
  });
});
