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
