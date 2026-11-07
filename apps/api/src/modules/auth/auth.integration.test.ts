import { randomUUID } from "node:crypto";
import { getPrismaClient } from "@sms/db";
import request, { type Response as SupertestResponse } from "supertest";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import { generateSessionToken, hashSessionToken } from "../../core/session-token.js";
import { hashPassword } from "./password.js";

const prisma = getPrismaClient();
const app = createApp();

const createdUserIds: string[] = [];
const createdSchoolIds: string[] = [];

afterEach(async () => {
  await prisma.authSession.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.membershipRole.deleteMany({
    where: { membership: { userId: { in: createdUserIds } } },
  });
  await prisma.schoolMembership.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.school.deleteMany({ where: { id: { in: createdSchoolIds } } });
  createdUserIds.length = 0;
  createdSchoolIds.length = 0;
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
      email: `auth-test-${randomUUID()}@example.test`,
      passwordHash,
      status: options.status ?? "ACTIVE",
    },
  });
  createdUserIds.push(user.id);
  return user;
}

async function createTestSchool() {
  const school = await prisma.school.create({
    data: { name: "Auth Test School", slug: `auth-test-${randomUUID()}` },
  });
  createdSchoolIds.push(school.id);
  return school;
}

async function attachRole(userId: string, schoolId: string, roleKey: string) {
  const membership = await prisma.schoolMembership.upsert({
    where: { schoolId_userId: { schoolId, userId } },
    update: {},
    create: { schoolId, userId },
  });
  const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
  await prisma.membershipRole.create({
    data: { schoolId, membershipId: membership.id, roleId: role.id },
  });
}

/** A raw AuthSession row bypassing login, so its expiry can be set directly. */
async function createRawSession(
  userId: string,
  overrides: Partial<{ idleExpiresAt: Date; absoluteExpiresAt: Date }> = {},
): Promise<string> {
  const token = generateSessionToken();
  const now = new Date();
  await prisma.authSession.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      lastSeenAt: now,
      idleExpiresAt: overrides.idleExpiresAt ?? new Date(now.getTime() + 60 * 60 * 1000),
      absoluteExpiresAt:
        overrides.absoluteExpiresAt ?? new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
  });
  return token;
}

/** The full Set-Cookie header string, for asserting attributes like HttpOnly. */
function setCookieHeader(response: SupertestResponse): string {
  const raw = response.headers["set-cookie"] as string[] | string | undefined;
  const header = Array.isArray(raw) ? raw[0] : raw;
  if (!header) throw new Error("Response had no Set-Cookie header");
  return header;
}

/** Just "name=value", safe to resend as a Cookie header on the next request. */
function cookieNameValue(response: SupertestResponse): string {
  const [nameValue] = setCookieHeader(response).split(";");
  if (!nameValue) throw new Error("Could not parse the Set-Cookie header");
  return nameValue;
}

describe("POST /api/v1/auth/login (integration)", () => {
  it("returns 200, the /me body, and a Set-Cookie with HttpOnly, SameSite=Lax, Path=/", async () => {
    const password = "correct-password-123";
    const user = await createTestUser({ password });

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(user.email);
    expect(response.body.activeRole).toBeNull();
    expect(response.body.roles).toEqual([]);

    const header = setCookieHeader(response);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Path=/");

    const token = cookieNameValue(response).split("=")[1];
    const session = await prisma.authSession.findFirst({ where: { userId: user.id } });
    expect(session).not.toBeNull();
    expect(session?.tokenHash).not.toBe(token);
  });

  it("returns an identical status and body for a wrong password and an unknown email", async () => {
    const password = "correct-password-123";
    const user = await createTestUser({ password });

    const wrongPassword = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "totally-wrong-password" });
    const unknownEmail = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: `unknown-${randomUUID()}@example.test`, password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe("UNAUTHENTICATED");
    expect(wrongPassword.body.error.message).toBe("Email or password is incorrect");
    expect({ ...wrongPassword.body.error, requestId: undefined }).toEqual({
      ...unknownEmail.body.error,
      requestId: undefined,
    });
  });

  it("returns the same 401 for a suspended user", async () => {
    const password = "correct-password-123";
    const user = await createTestUser({ password, status: "SUSPENDED" });

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
    expect(response.body.error.message).toBe("Email or password is incorrect");
  });

  it("returns the same 401 for a user with no password set", async () => {
    const user = await createTestUser();

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password: "anything" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
    expect(response.body.error.message).toBe("Email or password is incorrect");
  });

  it("deletes the previous session when logging in with an existing session cookie", async () => {
    const password = "correct-password-123";
    const user = await createTestUser({ password });

    const first = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password });
    const firstSession = await prisma.authSession.findFirst({ where: { userId: user.id } });
    expect(firstSession).not.toBeNull();

    const second = await request(app)
      .post("/api/v1/auth/login")
      .set("Cookie", cookieNameValue(first))
      .send({ email: user.email, password });

    expect(second.status).toBe(200);
    const sessions = await prisma.authSession.findMany({ where: { userId: user.id } });
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.id).not.toBe(firstSession?.id);
  });

  it("gives a user with two roles activeRole null and lists both roles", async () => {
    const password = "correct-password-123";
    const user = await createTestUser({ password });
    const school = await createTestSchool();
    await attachRole(user.id, school.id, "SCHOOL_ADMIN");
    await attachRole(user.id, school.id, "ACCOUNTANT");

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password });

    expect(response.status).toBe(200);
    expect(response.body.activeRole).toBeNull();
    expect(response.body.roles).toHaveLength(2);
    const roleKeys = response.body.roles.map((role: { roleKey: string }) => role.roleKey).sort();
    expect(roleKeys).toEqual(["ACCOUNTANT", "SCHOOL_ADMIN"]);
  });

  it("never returns passwordHash or tokenHash", async () => {
    const password = "correct-password-123";
    const user = await createTestUser({ password });

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password });

    const body = JSON.stringify(response.body);
    expect(body).not.toContain("passwordHash");
    expect(body).not.toContain("tokenHash");
  });
});

describe("GET /api/v1/auth/me (integration)", () => {
  it("returns the user and active role with the cookie; 401 without one", async () => {
    const password = "correct-password-123";
    const user = await createTestUser({ password });
    const school = await createTestSchool();
    await attachRole(user.id, school.id, "TEACHER");

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password });

    const me = await request(app).get("/api/v1/auth/me").set("Cookie", cookieNameValue(login));
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(user.email);
    expect(me.body.activeRole?.roleKey).toBe("TEACHER");
    expect(me.body.roles).toHaveLength(1);

    const withoutCookie = await request(app).get("/api/v1/auth/me");
    expect(withoutCookie.status).toBe(401);
    expect(withoutCookie.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("never returns passwordHash or tokenHash", async () => {
    const password = "correct-password-123";
    const user = await createTestUser({ password });

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password });
    const me = await request(app).get("/api/v1/auth/me").set("Cookie", cookieNameValue(login));

    const body = JSON.stringify(me.body);
    expect(body).not.toContain("passwordHash");
    expect(body).not.toContain("tokenHash");
  });

  it("treats an idle-expired session as anonymous and deletes the row", async () => {
    const user = await createTestUser();
    const token = await createRawSession(user.id, { idleExpiresAt: new Date(Date.now() - 1000) });

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", `sms_session=${token}`);
    expect(response.status).toBe(401);

    const session = await prisma.authSession.findFirst({ where: { userId: user.id } });
    expect(session).toBeNull();
  });

  it("treats an absolute-expired session as anonymous and deletes the row", async () => {
    const user = await createTestUser();
    const token = await createRawSession(user.id, {
      absoluteExpiresAt: new Date(Date.now() - 1000),
    });

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Cookie", `sms_session=${token}`);
    expect(response.status).toBe(401);

    const session = await prisma.authSession.findFirst({ where: { userId: user.id } });
    expect(session).toBeNull();
  });
});

describe("POST /api/v1/auth/logout (integration)", () => {
  it("deletes the session and clears the cookie; /me afterwards returns 401", async () => {
    const password = "correct-password-123";
    const user = await createTestUser({ password });

    const login = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: user.email, password });
    const cookie = cookieNameValue(login);

    const logout = await request(app).post("/api/v1/auth/logout").set("Cookie", cookie);
    expect(logout.status).toBe(204);
    expect(setCookieHeader(logout)).toContain("sms_session=;");

    const sessions = await prisma.authSession.findMany({ where: { userId: user.id } });
    expect(sessions).toHaveLength(0);

    const me = await request(app).get("/api/v1/auth/me").set("Cookie", cookie);
    expect(me.status).toBe(401);
  });

  it("returns 204 even without a session", async () => {
    const response = await request(app).post("/api/v1/auth/logout");
    expect(response.status).toBe(204);
  });
});
