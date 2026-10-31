# School Management System

Multi-tenant School Management System (SaaS). One platform for many schools, with each school's data kept fully isolated. First rollout: one pilot school.

## Tech stack

- Web: Next.js (App Router) + TypeScript
- API: Express + TypeScript
- Database: PostgreSQL + Prisma
- Monorepo: pnpm workspaces + Turborepo
- Languages: Arabic (RTL), English, French

## Getting started

Requirements: Node.js 22.12 or newer, pnpm 12 (`npm install -g pnpm@12.16.1`).

```bash
pnpm install   # install all workspaces
pnpm dev       # web on http://localhost:3000, API on http://localhost:4000
```

| Command             | What it does                                         |
| ------------------- | ---------------------------------------------------- |
| `pnpm dev`          | Starts the web app and the API together              |
| `pnpm build`        | Builds every package and app                         |
| `pnpm lint`         | Runs ESLint everywhere                               |
| `pnpm typecheck`    | Runs the TypeScript compiler without emitting        |
| `pnpm test`         | Runs the tests (Vitest)                              |
| `pnpm format`       | Formats every file with Prettier                     |
| `pnpm format:check` | Checks that every file is formatted, without writing |

The web app forwards `/api/*` to the API, so the browser only talks to `localhost:3000`.

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
