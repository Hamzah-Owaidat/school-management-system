# Changelog

All notable changes to this project are listed here. Format: Keep a Changelog. Versions: Semantic Versioning.

## [Unreleased]

### Added

- Identity and tenancy schema: users, sessions, school memberships, roles and permissions seeded from `packages/contracts`, and an audit log (#12)
- Login, logout and secure cookie sessions, with Argon2id password hashing and local-only demo users (#13)
- Password reset, email verification and rate limiting on sign-in and recovery endpoints (#14)

### Fixed

- Production stack containers (`postgres`, `migrate`, `api`) now read `DATABASE_URL`, `POSTGRES_*`, `NODE_ENV`, `API_PORT`, `LOG_LEVEL`, `SMTP_*` and `MAIL_FROM` only from the selected env file, never from a variable already exported in the shell running Compose
- Installed OpenSSL and ca-certificates in the API image so Prisma no longer falls back to an outdated OpenSSL version and can run migrations reliably

## [0.1.0] - 2026-11-05

First internal release: there are no user-facing features yet, and staging runs as a local production build until the pilot school approves (decision D-16).

### Added

- Project setup: repository, branches, rulesets, labels, milestones, project board.
- Software requirements specification (#70)
- Architecture document and decision records (#71)
- Database design and ERD (#72)
- Permissions, threat model, decisions log and roadmap (#73)
- Monorepo with pnpm workspaces and Turborepo: Next.js web app, Express API, shared contracts and config packages (#74)
- Code quality tooling: strict TypeScript, ESLint, Prettier, Husky, lint-staged and commitlint (#75)
- Local environment: Docker Compose with PostgreSQL and Mailpit, Prisma 7, the first migration and a synthetic seed (#76)
- API foundation: module pattern, request validation, a consistent error shape, request IDs, structured logging, `GET /api/v1/health` and an OpenAPI document (#77)
- CI pipeline with quality and integration jobs, required on pull requests into development, staging and production (#78)
- Docker images for the API and web app, a local production stack (Docker Compose and Caddy) and a deploy workflow (#79)

### Changed

- `DATABASE_URL` is now required when `NODE_ENV` is production (#79)
