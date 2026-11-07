# API

Express API for the School Management System. See [docs/architecture.md](../../docs/architecture.md) for the system-wide picture and [ADR 0001](../../docs/adr/0001-modular-monolith.md) for why the API is split into modules.

## Layout

```text
src/
├── core/        # shared pieces every module builds on
├── modules/     # one folder per domain module
├── app.ts       # builds the Express app (used directly by tests)
└── server.ts    # starts the app, config and graceful shutdown
```

### `core/`

| File                   | What it does                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `config.ts`            | Parses `process.env` with Zod; throws a readable error if a variable is invalid        |
| `logger.ts`            | Pino logger + `pino-http` request logging, with credentials redacted                   |
| `request-id.ts`        | Reuses/generates `X-Request-Id`, exposed on `req.id`                                   |
| `errors.ts`            | `AppError` and helpers (`notFound()`, `forbidden()`, `conflict()`, …)                  |
| `error-handler.ts`     | Turns any thrown error into the shared error shape (see below)                         |
| `not-found-handler.ts` | Turns an unmatched route into the same error shape                                     |
| `validate.ts`          | `validate({ body, query, params })` middleware: parses with Zod, strips unknown fields |
| `openapi.ts`           | The shared OpenAPI registry every module registers its paths into                      |

### `modules/<name>/`

Each module owns its routes, validation and data access (ADR 0001). A module may import
another module's **service**, never its repository or tables.

| File                   | Required?                             | What it does                                              |
| ---------------------- | ------------------------------------- | --------------------------------------------------------- |
| `<name>.routes.ts`     | Always                                | Builds the module's `Router`; registers its OpenAPI paths |
| `<name>.controller.ts` | Always                                | Reads the request, calls the service, writes the response |
| `<name>.service.ts`    | Always                                | Business logic                                            |
| `<name>.schemas.ts`    | If the module takes request input     | Zod schemas for `body`/`query`/`params`                   |
| `<name>.policy.ts`     | If the module needs permission checks | Role/scope checks (added in #16)                          |
| `<name>.repository.ts` | If the module touches the database    | Prisma queries, always tenant-scoped                      |
| `<name>.test.ts`       | Always                                | Tests for the module                                      |

`health` is the first module and skips `schemas.ts`, `policy.ts` and `repository.ts`: it
takes no input, needs no permission check (it's public), and has no table of its own — it
only calls `@sms/db`'s connection check.

Every module is mounted under `/api/v1` by the registry in `modules/index.ts`.

## Adding a new endpoint

1. **Schema** — add the request/response Zod schema(s) to `packages/contracts` if the web
   app needs them too (like `HealthResponseSchema`); otherwise add them to the module's own
   `<name>.schemas.ts`.
2. **Route** — add the path to `<name>.routes.ts`, with `validate({ body, query, params })`
   if it takes input.
3. **Controller** — read `req.body`/`req.query`/`req.params` (already parsed and stripped
   by `validate`) and call the service.
4. **Service** — implement the business logic; call the repository for data access.
5. **Test** — add cases to `<name>.test.ts`.
6. **OpenAPI registration** — call `openApiRegistry.registerPath({ ... })` in
   `<name>.routes.ts` with the **full** path (e.g. `/api/v1/health`), referencing the
   contracts schemas directly (e.g. `ErrorResponseSchema` from `@sms/contracts`, re-exported
   by `core/openapi.ts` for convenience). Schemas are passed inline rather than through
   `registry.register()`/`$ref`: that helper needs `extendZodWithOpenApi()`, which doesn't
   patch instances built from this project's Zod 4 (ESM) build.

## Errors

Every error response has this shape:

```json
{ "error": { "code": "NOT_FOUND", "message": "...", "details": {}, "requestId": "..." } }
```

| Code                | Status |
| ------------------- | ------ |
| `VALIDATION_FAILED` | 400    |
| `UNAUTHENTICATED`   | 401    |
| `FORBIDDEN`         | 403    |
| `NOT_FOUND`         | 404    |
| `CONFLICT`          | 409    |
| `RATE_LIMITED`      | 429    |
| `INTERNAL`          | 500    |

Throw an `AppError` (via `notFound()`, `forbidden()`, `conflict()`, etc. from
`core/errors.ts`) from anywhere in a route, controller or service; `core/error-handler.ts`
turns it, a `ZodError`, a malformed JSON body, or a known Prisma error into this shape.
Anything else becomes `INTERNAL` with the message "Something went wrong" — stack traces,
SQL and internal messages are only ever logged, never sent to the client.

## Request IDs

Every request gets an ID on `req.id`: an incoming `X-Request-Id` header is reused if it's a
safe string (letters, digits, dashes, at most 128 characters), otherwise one is generated.
It's returned on the `X-Request-Id` response header and inside every error body, and used
to correlate a client-reported problem with the matching log line.

## Authentication

Server-side sessions identified by a cookie (ADR 0003), implemented in `core/session.ts`,
`core/session-cookie.ts`, `core/session-token.ts` and `modules/auth/`.

- **Cookie:** `__Host-sms_session` in production, `sms_session` in development and test —
  always `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production. It carries a 32
  random byte, base64url-encoded token; only its SHA-256 hash is stored, in
  `AuthSession.tokenHash`. The raw token is never logged (`core/logger.ts` redacts the
  `Cookie` and `Set-Cookie` headers) or written anywhere but the cookie itself.
- **Lifetimes:** a session expires 7 days after its last activity (`idleExpiresAt`) and 30
  days after sign-in at the latest (`absoluteExpiresAt`), regardless of activity — both are
  constants in `core/config.ts`.
- **`createSessionMiddleware()`** (mounted in `app.ts`, before the API router) runs on every
  request: it reads the cookie, loads the `AuthSession` with its user and active
  `MembershipRole`, and either attaches `req.auth` or leaves the request anonymous. An
  expired session, a missing row or a non-`ACTIVE` user all delete the session row (if any)
  and clear the cookie; none of that is treated as an error. Otherwise it extends
  `idleExpiresAt`/`lastSeenAt`, but at most once every 5 minutes, so routine requests skip a
  database write.
- **`req.auth`** (`core/session.ts`), set only when there is a valid session:
  ```ts
  interface AuthContext {
    sessionId: string;
    user: {
      id: string;
      email: string;
      locale: "ar" | "en" | "fr" | null;
      isPlatformOperator: boolean;
    };
    activeRole: {
      membershipRoleId: string;
      schoolId: string;
      schoolName: string;
      roleKey: RoleKey;
    } | null;
  }
  ```
  `activeRole` is `null` when the session hasn't selected one yet (e.g. a user with more
  than one role — role switching is #16/#19).
- **`requireAuth`** middleware rejects a request with no `req.auth` with 401
  `UNAUTHENTICATED`. Mount it after `createSessionMiddleware()` on any route that needs a
  signed-in user (see `modules/auth/auth.routes.ts`'s `GET /me`).
- **Endpoints**, all under `/api/v1/auth`:
  - `POST /login` — `{ email, password }`. Wrong password, unknown email, no password set
    and a non-`ACTIVE` user all return the identical 401 body (`"Email or password is
incorrect"`) in about the same time, since a real Argon2id verify always runs, against a
    dummy hash when there's no real one. On success it rotates the session (deletes any
    session the request already carried), sets the cookie, and returns the same body as
    `GET /me`.
  - `POST /logout` — deletes the current session and clears the cookie; returns 204 even
    with no session.
  - `GET /me` (`requireAuth`) — `{ user, activeRole, roles }`, where `roles` lists every
    `MembershipRole` the user could switch to (an `ACTIVE` membership in an `ACTIVE`
    school). Never returns `passwordHash` or `tokenHash`.
- Passwords are hashed with Argon2id (`@node-rs/argon2`, OWASP-recommended defaults) in
  `modules/auth/password.ts`.
