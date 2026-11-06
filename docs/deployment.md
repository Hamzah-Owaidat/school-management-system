# Deployment

**Project:** School Management System
**Related:** [ADR 0005](./adr/0005-hosting-and-deployment.md) · [Decisions D-11, D-16](./decisions.md) · [Architecture](./architecture.md#6-environments)

## 1. Environments

| Environment | Where today                                                                              | Where after approval              |
| ----------- | ---------------------------------------------------------------------------------------- | --------------------------------- |
| Local       | Developer machine, `docker-compose.yml` (dev dependencies only: PostgreSQL, Mailpit)     | Same                              |
| Staging     | **The same machine**, `docker-compose.prod.yml`, run by hand (D-16)                      | DigitalOcean droplet, region FRA1 |
| Production  | **The same machine**, `docker-compose.prod.yml`, a separate run with its own data (D-16) | DigitalOcean droplet, region FRA1 |

Until the pilot school approves, "staging" and "production" are both the **same
local production build**, run with different env files and different databases
— never real servers (ADR 0005, D-16). The deploy workflow that would push to a
real droplet already exists (`.github/workflows/deploy.yml`) but is switched off
(see [section 4](#4-switching-on-real-deploys)).

## 2. Running the local production stack

```bash
cp .env.staging.example .env.staging   # then fill in real (local-only) values
pnpm prod:up                           # builds the images and starts the stack
```

This builds `apps/api/Dockerfile` and `apps/web/Dockerfile`, starts PostgreSQL,
runs migrations once (the `migrate` service), then starts the API, the web app
and Caddy. Caddy serves everything on one address (`SITE_ADDRESS`, default
`http://localhost:8080`): `/api/*` goes to the API, everything else to the web
app — same-origin, as in [ADR 0003](./adr/0003-authentication-and-sessions.md).

| Command          | What it does                                 |
| ---------------- | -------------------------------------------- |
| `pnpm prod:up`   | Builds and starts the stack (`.env.staging`) |
| `pnpm prod:down` | Stops it                                     |
| `pnpm prod:logs` | Follows every service's logs                 |

To run a second instance standing in for "production" at the same time, copy
`.env.production.example` to `.env.production` with **different** values (see
below) and run the same commands with `--env-file .env.production -p sms-production`
(the `-p` flag gives it a separate Compose project name and volumes, so it
doesn't collide with the staging run).

## 3. Env files and secrets

| File                      | Committed?          | Used by                    |
| ------------------------- | ------------------- | -------------------------- |
| `.env.staging.example`    | Yes                 | Template — copy, then edit |
| `.env.production.example` | Yes                 | Template — copy, then edit |
| `.env.staging`            | **No** (gitignored) | The staging stack          |
| `.env.production`         | **No** (gitignored) | The production stack       |

**Every secret must be different between `.env.staging` and `.env.production`**
— different `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (D-16: "no
production secret is used in staging"). They also use separate Docker volumes
and are never pointed at each other's database.

The example files list every variable the stack needs (`NODE_ENV`,
`SITE_ADDRESS`, `DATABASE_URL`, `POSTGRES_*`, `LOG_LEVEL`, `API_PORT`,
`SMTP_*`, `MAIL_FROM`) with `change-me` placeholders — never real values.

## 4. Switching on real deploys

`.github/workflows/deploy.yml` already builds and pushes `apps/api` and
`apps/web` images to GitHub Container Registry on every push to `staging` or
`production` (job `images`) — this runs now, so the Dockerfiles stay tested.
The `deploy` job (SSH to the server, pull, migrate, restart) is skipped until
turned on. After the pilot school approves and the DigitalOcean droplets exist:

1. Create the droplet(s) and the managed PostgreSQL database(s) (not part of
   this repo; see [ADR 0005](./adr/0005-hosting-and-deployment.md)).
2. On each droplet: clone this repo to `/opt/school-management-system`, copy
   the matching `.env.staging` or `.env.production` there with real values.
3. In GitHub, create the **Environments** "staging" and "production" (already
   referenced by `deploy.yml`; not created by this repo).
4. For each environment, add:
   - Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`.
   - Variable: `DEPLOY_ENABLED` = `true`.
5. Push to `staging` or `production` — the `deploy` job now runs.

## 5. Rollback

Every image is tagged with the commit SHA it was built from (as well as the
branch name). To roll back, redeploy the previous SHA tag on the server:

```bash
export IMAGE_TAG=<previous-sha>
docker compose -f docker-compose.prod.yml --env-file .env.production pull api web
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Migrations are forward-only (`prisma migrate deploy` never rolls back a
schema change) — a rollback that also needs a schema change requires its own
migration, not just redeploying an older image.
