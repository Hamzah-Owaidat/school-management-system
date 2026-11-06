# ADR 0002: Multi-tenancy model

**Status:** Accepted
**Date:** 2026-10-31
**Issue:** #2

## Context

The platform hosts many schools, and one school must never see another school's data (SRS NFR-01). It starts with one pilot school and should onboard more without new infrastructure for each.

## Decision

Use **one shared PostgreSQL database and schema**, with a `school_id` column on every tenant table.

- **Global tables** (no `school_id`): `User`, `Session`, `School`.
- **Membership:** `Membership(user_id, school_id, role)` links a user to a school. One person can hold different roles in different schools (for example, teacher in one school and parent in another).
- **Tenant context:** after sign-in, the session stores the active `school_id`. The API reads it on every request; it never trusts a `school_id` sent by the browser.
- **Enforcement in code:** repositories receive a tenant-scoped Prisma client (a Prisma client extension) that adds `school_id` to every read and write on tenant tables.
- **Enforcement in the database:** tenant tables use composite unique keys and foreign keys that include `school_id`, so a row cannot point to another school's row.
- **Tests:** cross-tenant tests call every endpoint as a user of school A against school B's data and expect 403 or 404 (issues #18, #49).
- **Platform operator:** works outside tenant context; any access to a school's data is audit-logged.

## Consequences

- One database to migrate, back up and monitor, however many schools join.
- Adding a school is a row in `School`, not new infrastructure.
- A missing filter would leak data, so the scoped client and the cross-tenant tests are mandatory, not optional.
- Per-school backup or restore is not possible at the database level; it would need a filtered export.

## Alternatives considered

- **Database per school:** strongest isolation, but migrations, backups and costs multiply with every school.
- **Schema per school:** same migration problem, and poor support in Prisma.
- **PostgreSQL row-level security (RLS):** a strong extra layer, but it needs a database session variable set inside every transaction, which is complex with Prisma. Revisit before the second school is onboarded.
