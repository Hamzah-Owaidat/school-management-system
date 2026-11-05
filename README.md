# School Management System

Multi-tenant School Management System (SaaS). One platform for many schools, with each school's data kept fully isolated. First rollout: one pilot school.

## Tech stack

- Web: Next.js (App Router) + TypeScript
- API: Express + TypeScript
- Database: PostgreSQL + Prisma
- Monorepo: pnpm workspaces + Turborepo
- Languages: Arabic (RTL), English, French

## Getting started

Requirements: Node.js 22.12 or newer, pnpm 12 (`npm install -g pnpm@12.16.1`), [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
cp .env.example .env   # local-only defaults; edit if a port is already taken
pnpm install            # install all workspaces
pnpm db:up              # start PostgreSQL and Mailpit
pnpm db:migrate         # create the database schema
pnpm db:seed            # add a demo school (synthetic data)
pnpm dev                # web on http://localhost:3000, API on http://localhost:4000
```

| Port   | Service        |
| ------ | -------------- |
| `3000` | Web            |
| `4000` | API            |
| `5432` | PostgreSQL     |
| `8025` | Mailpit web UI |

| Command                 | What it does                                                        |
| ----------------------- | ------------------------------------------------------------------- |
| `pnpm dev`              | Starts the web app and the API together                             |
| `pnpm build`            | Builds every package and app                                        |
| `pnpm lint`             | Runs ESLint everywhere                                              |
| `pnpm typecheck`        | Runs the TypeScript compiler without emitting                       |
| `pnpm test`             | Runs the unit tests (Vitest)                                        |
| `pnpm test:integration` | Runs the integration tests against a real database (see below)      |
| `pnpm format`           | Formats every file with Prettier                                    |
| `pnpm format:check`     | Checks that every file is formatted, without writing                |
| `pnpm db:up`            | Starts PostgreSQL and Mailpit in Docker                             |
| `pnpm db:down`          | Stops them                                                          |
| `pnpm db:migrate`       | Applies migrations, creating new ones from schema changes           |
| `pnpm db:deploy`        | Applies existing migrations without creating new ones (CI, deploys) |
| `pnpm db:seed`          | Adds synthetic demo data                                            |
| `pnpm db:reset`         | Drops the database, re-applies migrations and seeds it again        |
| `pnpm db:studio`        | Opens Prisma Studio to browse the database                          |
| `pnpm db:check`         | Fails if `schema.prisma` has changes not covered by a migration     |

The web app forwards `/api/*` to the API, so the browser never makes cross-origin calls.

## Tests and CI

- **Unit tests** (`*.test.ts`, run with `pnpm test`) never touch a real database. `apps/api` and `packages/db` fake out the database so `pnpm test` works with no `.env` file and no PostgreSQL running.
- **Integration tests** (`*.integration.test.ts`, run with `pnpm test:integration`) use a real PostgreSQL database. Run them locally with:
  ```bash
  pnpm db:up
  pnpm db:deploy
  pnpm test:integration
  ```
  They're idempotent (safe to run twice in a row) and read `DATABASE_URL` from the root `.env`.

CI (`.github/workflows/ci.yml`) runs on every pull request into `development`, `staging` and `production`, and on every push to those branches:

- **`quality`** — install, `format:check`, `lint`, `typecheck`, `test`, `build`. Runs with no `.env` file and no database, proving the build doesn't secretly need either.
- **`integration`** — spins up a throwaway `postgres:17` service container, applies migrations (`db:deploy`), checks the schema is fully migrated (`db:check`), then runs `test:integration`.

Both `quality` and `integration` are required checks: a failing test blocks merging.

### Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): summary`. A commit-msg hook (commitlint) rejects messages that don't match.

Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `perf`, `ci`, `build`, `style`, `revert`.

Examples:

```
feat(api): add login route
fix(web): correct RTL layout
docs: update SRS
```

## Repository layout

| Path                 | Contents                                                                  |
| -------------------- | ------------------------------------------------------------------------- |
| `apps/web`           | Next.js frontend                                                          |
| `apps/api`           | Express API                                                               |
| `packages/contracts` | Types and Zod schemas shared by web and API                               |
| `packages/config`    | Shared TypeScript and ESLint configuration                                |
| `packages/db`        | Prisma schema, migrations, seed script, database client                   |
| `docs`               | SRS, architecture, ADRs, database design, permissions, decisions, roadmap |

## Branches

| Branch        | Purpose                       | Deploys to |
| ------------- | ----------------------------- | ---------- |
| `production`  | Live code used by schools     | Production |
| `staging`     | Release candidate for testing | Staging    |
| `development` | Integration branch (default)  | Local      |

Nobody pushes directly to these branches. Every change goes through a pull request. See CONTRIBUTING.md.

## Planning

- Project board: GitHub Projects - "School Management System"
- Milestones: M0 to M7 (Issues - Milestones)
- Daily work: the "Today" view on the project board

## Documentation

Project documents live in the `docs/` folder: SRS, architecture, database design, permissions, decisions and roadmap.

## Status

M1 (repository and infrastructure) in progress. Not production ready.

## License

Private and proprietary. All rights reserved.
