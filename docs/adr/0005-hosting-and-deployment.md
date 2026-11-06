# ADR 0005: Hosting and deployment

**Status:** Accepted
**Date:** 2026-10-31
**Issue:** #2

## Context

The system first needs approval from the pilot school. Until then there is no reason to pay for servers. After approval, it needs reliable hosting with backups that meet SRS NFR-04 (daily backups, at most 24 h of data lost, restored within 4 h).

## Decision

**Until the pilot school approves: local only.**

- Development runs on the developer's machine with Docker Compose: PostgreSQL, MinIO (file storage) and Mailpit (email).
- Demos to the school run from the local machine.

**After approval: DigitalOcean.**

- **Provider:** DigitalOcean, region Frankfurt (FRA1), the closest region to Lebanon.
- **App server:** a droplet running Docker Compose with three containers: `web` (Next.js), `api` (Express, also run as the worker) and `caddy` (HTTPS and routing).
- **Database:** DigitalOcean Managed PostgreSQL, with automatic daily backups and point-in-time recovery.
- **Files:** DigitalOcean Spaces, private bucket (see [ADR 0004](./0004-private-file-storage.md)).
- **Environments:** staging and production, each with its own droplet, database and bucket. Staging can use the smallest sizes.
- **Deployment:** GitHub Actions builds Docker images on every push to `staging` or `production`, pushes them to GitHub Container Registry, then connects to the droplet over SSH, pulls the images, runs Prisma migrations and restarts the containers.
- **Secrets:** stored in GitHub Actions secrets and in an `.env` file on the droplet, never in the repository.

## Consequences

- No hosting cost before the school approves.
- The setup matches the Docker Compose + Caddy workflow already used for other projects.
- The managed database handles backups and restores, which a self-run database would not.
- Staging tasks on the board (#10, #11) wait until approval, or "staging" means a local production build until then.
- The droplet is a single server: if it fails, the app is down until it is replaced. That is acceptable for one pilot school.

## Alternatives considered

- **PostgreSQL in Docker on the droplet:** cheaper, but backups, restores and upgrades become manual work.
- **Vercel + Render or Railway:** less server work, but two vendors and costs that grow with usage.
