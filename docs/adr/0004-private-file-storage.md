# ADR 0004: Private file storage

**Status:** Accepted
**Date:** 2026-10-31
**Issue:** #2

## Context

Teachers upload learning materials, students upload assignment submissions, and schools upload logos. These files can contain children's work and personal data, so they must never be publicly readable (SRS FR-07, NFR-06).

## Decision

Store files in **S3-compatible object storage** in a **private bucket**: MinIO locally, DigitalOcean Spaces in production.

- **Upload:** files go through the API, which checks the permission, size (20 MB maximum) and type (allowlist: PDF, images, Office documents, plain text).
- **Key layout:** `schools/<school_id>/<module>/<uuid>`. The original file name is kept only in the database, never in the key.
- **Metadata:** a `File` table holds `school_id`, owner, module, original name, size, type and checksum.
- **Download:** the API checks the permission, then returns a signed link that expires after 5 minutes.
- **Deletion:** a soft delete in the database, with the object removed later by a background job.
- **Code:** the S3 client is used only inside the `files` module, so switching provider is a configuration change.

## Consequences

- A leaked or guessed link stops working after 5 minutes, and keys reveal nothing about the file.
- Uploads through the API use its bandwidth; that is fine at pilot scale.
- Local development matches production because both use the S3 API.
- Virus scanning of uploads is not included in v1 (open question).

## Alternatives considered

- **Files on the server's disk:** lost if the droplet is replaced, and hard to back up and scale.
- **Files in PostgreSQL:** makes the database large and backups slow.
- **Direct browser uploads with presigned PUT links:** less load on the API, but harder to validate files. Revisit if uploads grow.
