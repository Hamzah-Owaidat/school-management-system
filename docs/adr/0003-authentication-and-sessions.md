# ADR 0003: Authentication and sessions

**Status:** Accepted
**Date:** 2026-10-31
**Issue:** #2

## Context

Users include children and parents, and the data includes grades and payments. Accounts must be revocable at once: when a user is suspended, a school is suspended, or a password is reset (issue #15).

## Decision

Use **server-side sessions** stored in PostgreSQL, identified by a cookie.

- **Passwords:** hashed with Argon2id.
- **Session cookie:** a random ID (at least 128 bits), `httpOnly`, `Secure`, `SameSite=Lax`, path `/`. Only a hash of the ID is stored in the `Session` table.
- **Lifetime:** a session expires after 7 days without activity and after 30 days at most.
- **Rotation:** a new session ID is issued at sign-in and when the active school or role changes.
- **Revocation:** sign-out, password reset, user suspension and school suspension delete the affected sessions.
- **CSRF:** `SameSite=Lax`, plus an `Origin` header check on every state-changing request.
- **CORS:** web and API share one domain, so CORS stays closed; there is no cross-origin allowlist.
- **Rate limiting:** on sign-in, password reset and verification endpoints, per IP and per email.
- **Email tokens (verification, reset):** random, stored as a hash, single use; reset tokens expire after 1 hour (SRS FR-01).
- **Invitations:** staff, students and parents are invited by email; there is no public sign-up.

## Consequences

- Suspension and sign-out take effect on the next request.
- Every request reads the session from the database. That is acceptable at the expected load and can be cached later.
- Passwords and tokens never sit in browser storage, where JavaScript could read them.

## Alternatives considered

- **JWT access and refresh tokens:** harder to revoke at once, and easy to store unsafely in the browser.
- **Third-party auth service:** adds cost and a vendor, and limits Arabic and French email content. Can be revisited for single sign-on later.
