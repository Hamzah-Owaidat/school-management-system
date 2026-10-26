# School Management System

Multi-tenant School Management System (SaaS). One platform for many schools, with each school's data kept fully isolated. First rollout: one pilot school.

## Tech stack

- Web: Next.js (App Router) + TypeScript
- API: Express + TypeScript
- Database: PostgreSQL + Prisma
- Languages: Arabic (RTL), English, French

## Branches

| Branch | Purpose | Deploys to |
|---|---|---|
| `production` | Live code used by schools | Production |
| `staging` | Release candidate for testing | Staging |
| `development` | Integration branch (default) | Local |

Nobody pushes directly to these branches. Every change goes through a pull request. See CONTRIBUTING.md.

## Planning

- Project board: GitHub Projects - "School Management System"
- Milestones: M0 to M7 (Issues - Milestones)
- Daily work: the "Today" view on the project board

## Documentation

Project documents live in the `docs/` folder: SRS, architecture, database design, permissions, decisions and roadmap.

## Status

Planning (M0). Not production ready.

## License

Private and proprietary. All rights reserved.
