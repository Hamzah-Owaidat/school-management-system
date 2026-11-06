# ADR 0001: Modular monolith

**Status:** Accepted
**Date:** 2026-10-31
**Issue:** #2

## Context

One developer builds the system, and the first release serves one pilot school. The product still has many areas (academics, teaching, attendance, grading, finance, portals) that must stay separate enough to change safely.

## Decision

Build one Express API and one Next.js web app, deployed together, with the API split into **domain modules** (`academics`, `attendance`, `finance` and others; see [architecture](../architecture.md#4-api-modules)).

Rules:

- Each module owns its routes, validation, services and Prisma queries.
- A module calls another module only through its service functions, never through its repository or tables.
- Shared code (session, tenant context, policy, errors, audit) lives in `core/`.
- Background jobs run in a worker started from the same codebase.

## Consequences

- One codebase, one deployment and one database: simple to run, debug and back up.
- Clear module boundaries keep the option to split a module into its own service later.
- The rules are enforced by code review and lint import rules, not by the network, so they need discipline.
- The whole API scales as one unit; that is enough for the expected load (see SRS NFR-03).

## Alternatives considered

- **Microservices:** too much infrastructure and operations work for one developer and one pilot school.
- **Unstructured monolith:** fastest at first, but finance, grading and portals would become tangled.
