# Permissions and threat model

**Project:** School Management System
**Version:** 0.1 (draft)
**Date:** 31 Oct 2026
**Owner:** Hamzah Owaidat
**Issue:** #4 · Milestone M0
**Related:** [SRS](./srs.md) · [Architecture](./architecture.md) · [Database design](./database-design.md) · [Decisions](./decisions.md)

---

## 1. How permissions work

1. **Deny by default.** A request is allowed only if a rule below allows it.
2. **Permission + scope.** Every check asks two questions: does the role have the permission key, and is the record inside the user's scope?
3. **One active role.** Permissions come only from the session's active membership. A user who is both a teacher and a parent switches between the two; the permissions are never merged.
4. **School from the session.** The school is always the active membership's school, never a value sent by the browser.
5. **Suspended means nothing.** A suspended user, membership or school has no permissions.
6. **Checked on the server.** The web app hides buttons the user can't use, but only the API's policy layer decides (issue #16).

Permission keys are constants in `packages/contracts` so the API and the web app use the same names.

---

## 2. Scopes

| Scope           | Meaning                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------- |
| **School**      | Every record of the active school                                                                 |
| **Own classes** | Classes where the teacher teaches a subject (`ClassSubject.teacherId`) or is the homeroom teacher |
| **Own lessons** | Only the class subjects the teacher teaches (narrower than own classes)                           |
| **Self**        | The student's own records, from enrolled classes only                                             |
| **Children**    | Records of students linked to the parent through `StudentGuardian`                                |
| **Published**   | Only grades from published assessments and report cards that have been generated                  |

---

## 3. Permission keys

| Key                        | What it allows                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `platform.schools.manage`  | Create, edit and suspend schools; invite a school's first admin                      |
| `school.settings.read`     | See school name, logo, languages, currencies, grading scale                          |
| `school.settings.update`   | Change school settings                                                               |
| `staff.read`               | See staff list and roles                                                             |
| `staff.manage`             | Invite staff, change roles, suspend memberships                                      |
| `academics.read`           | See years, terms, grade levels, classes, subjects                                    |
| `academics.manage`         | Create and change years, terms, grade levels, classes, subjects, teacher assignments |
| `students.read`            | See student profiles                                                                 |
| `students.manage`          | Create, edit, withdraw and anonymize students                                        |
| `guardians.read`           | See parent profiles and links                                                        |
| `guardians.manage`         | Create parents, link them to students, send invitations                              |
| `enrollment.read`          | See enrollments and class lists                                                      |
| `enrollment.manage`        | Enroll, transfer and withdraw students                                               |
| `timetable.read`           | See the timetable                                                                    |
| `timetable.manage`         | Create and change periods and timetable entries                                      |
| `materials.read`           | See learning materials                                                               |
| `materials.manage`         | Create, edit and delete learning materials                                           |
| `assignments.read`         | See assignments                                                                      |
| `assignments.manage`       | Create, edit and delete assignments                                                  |
| `submissions.create`       | Submit work for an assignment                                                        |
| `submissions.review`       | Read submissions, return feedback and marks                                          |
| `attendance.read`          | See attendance                                                                       |
| `attendance.record`        | Record attendance for today's lessons                                                |
| `attendance.correct`       | Change attendance for an earlier day (reason required)                               |
| `grades.read`              | See grades                                                                           |
| `grades.enter`             | Create assessments and enter grades while in draft                                   |
| `grades.publish`           | Publish an assessment's grades                                                       |
| `grades.correct`           | Change a published grade (reason required)                                           |
| `terms.lock`               | Lock and unlock a term's grades                                                      |
| `reportcards.read`         | See and download report cards                                                        |
| `reportcards.generate`     | Generate report cards for a term                                                     |
| `announcements.read`       | See announcements                                                                    |
| `announcements.publish`    | Create, publish and delete announcements                                             |
| `finance.read`             | See fee structures, invoices, payments and balances                                  |
| `finance.fees.manage`      | Create and change fee structures                                                     |
| `finance.invoices.manage`  | Create, issue, adjust and void invoices                                              |
| `finance.payments.record`  | Record payments and allocate them                                                    |
| `finance.payments.reverse` | Reverse a payment or an allocation (reason required)                                 |
| `finance.reconcile`        | Open and close reconciliation batches                                                |
| `reports.read`             | See academic, attendance, enrollment and finance reports                             |
| `reports.export`           | Export reports as files                                                              |
| `audit.read`               | Read the school's audit log                                                          |

---

## 4. Role matrix

`—` means not allowed.

| Key                        | Platform operator | School admin | Teacher                     | Accountant   | Student             | Parent              |
| -------------------------- | ----------------- | ------------ | --------------------------- | ------------ | ------------------- | ------------------- |
| `platform.schools.manage`  | All schools       | —            | —                           | —            | —                   | —                   |
| `school.settings.read`     | —                 | School       | School                      | School       | School              | School              |
| `school.settings.update`   | —                 | School       | —                           | —            | —                   | —                   |
| `staff.read`               | —                 | School       | School                      | School       | —                   | —                   |
| `staff.manage`             | —                 | School       | —                           | —            | —                   | —                   |
| `academics.read`           | —                 | School       | School                      | School       | Self                | Children            |
| `academics.manage`         | —                 | School       | —                           | —            | —                   | —                   |
| `students.read`            | —                 | School       | Own classes                 | School       | Self                | Children            |
| `students.manage`          | —                 | School       | —                           | —            | —                   | —                   |
| `guardians.read`           | —                 | School       | Own classes                 | School       | —                   | Self                |
| `guardians.manage`         | —                 | School       | —                           | —            | —                   | —                   |
| `enrollment.read`          | —                 | School       | Own classes                 | School       | Self                | Children            |
| `enrollment.manage`        | —                 | School       | —                           | —            | —                   | —                   |
| `timetable.read`           | —                 | School       | School                      | —            | Self                | Children            |
| `timetable.manage`         | —                 | School       | —                           | —            | —                   | —                   |
| `materials.read`           | —                 | School       | Own lessons                 | —            | Self                | Children            |
| `materials.manage`         | —                 | —            | Own lessons                 | —            | —                   | —                   |
| `assignments.read`         | —                 | School       | Own lessons                 | —            | Self                | Children            |
| `assignments.manage`       | —                 | —            | Own lessons                 | —            | —                   | —                   |
| `submissions.create`       | —                 | —            | —                           | —            | Self                | —                   |
| `submissions.review`       | —                 | School       | Own lessons                 | —            | Self (own feedback) | Children (feedback) |
| `attendance.read`          | —                 | School       | Own classes                 | —            | Self                | Children            |
| `attendance.record`        | —                 | School       | Own lessons                 | —            | —                   | —                   |
| `attendance.correct`       | —                 | School       | Own lessons                 | —            | —                   | —                   |
| `grades.read`              | —                 | School       | Own lessons                 | —            | Self, published     | Children, published |
| `grades.enter`             | —                 | —            | Own lessons                 | —            | —                   | —                   |
| `grades.publish`           | —                 | School       | Own lessons                 | —            | —                   | —                   |
| `grades.correct`           | —                 | School       | Own lessons, unlocked terms | —            | —                   | —                   |
| `terms.lock`               | —                 | School       | —                           | —            | —                   | —                   |
| `reportcards.read`         | —                 | School       | Own classes                 | —            | Self, published     | Children, published |
| `reportcards.generate`     | —                 | School       | —                           | —            | —                   | —                   |
| `announcements.read`       | —                 | School       | Targeted                    | Targeted     | Targeted            | Targeted            |
| `announcements.publish`    | —                 | School       | Own classes                 | —            | —                   | —                   |
| `finance.read`             | —                 | School       | —                           | School       | Self                | Children            |
| `finance.fees.manage`      | —                 | —            | —                           | School       | —                   | —                   |
| `finance.invoices.manage`  | —                 | —            | —                           | School       | —                   | —                   |
| `finance.payments.record`  | —                 | —            | —                           | School       | —                   | —                   |
| `finance.payments.reverse` | —                 | —            | —                           | School       | —                   | —                   |
| `finance.reconcile`        | —                 | —            | —                           | School       | —                   | —                   |
| `reports.read`             | —                 | School       | Own classes                 | Finance only | —                   | —                   |
| `reports.export`           | —                 | School       | Own classes                 | Finance only | —                   | —                   |
| `audit.read`               | —                 | School       | —                           | Finance only | —                   | —                   |

Notes:

- **Separation of duties:** the school admin can read finance but can't record or reverse payments. A person who does both jobs gets two memberships (admin and accountant) and switches between them.
- **Teachers and parents:** a teacher sees the parents of students in their own classes so they can contact them; they never see finance.
- **Students' finance:** students see their own balance; parents see each linked child's invoices and payments (decision D-03).
- **Platform operator:** has no access to a school's data inside the app in v1 (decision D-18).

---

## 5. Threat model

Each row names a threat, how it is stopped and which issue tests it.

### 5.1 Tenant isolation

| #   | Threat                                          | Mitigation                                                                                                                 | Tested in |
| --- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------- |
| T1  | A user guesses another school's record ID       | Tenant-scoped Prisma client adds `schoolId` to every query; composite foreign keys; another school's ID returns 404        | #17, #18  |
| T2  | The browser sends a forged `schoolId`           | `schoolId` is taken from the session only; Zod schemas strip it from input                                                 | #17       |
| T3  | A report or raw query forgets the school filter | Raw SQL allowed only inside reviewed repository functions that take `schoolId`; report tests run with two schools          | #18, #59  |
| T4  | A background job mixes schools                  | Every job payload carries `schoolId`; the worker uses the scoped client; export files are stored under the school's prefix | #60       |
| T5  | The platform operator reads school data         | No in-app access in v1; database access is limited to the owner and audit-logged at the provider                           | #65       |

### 5.2 Sign-in and sessions

| #   | Threat                                                | Mitigation                                                                                                                     | Tested in |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------- |
| S1  | Password guessing or credential stuffing              | Rate limits per IP and per email; Argon2id; the same error for a wrong email and a wrong password                              | #13, #15  |
| S2  | Session stolen through injected script (XSS)          | `httpOnly` cookie; Content Security Policy; React escaping; user text rendered as plain text, never raw HTML                   | #15, #65  |
| S3  | Cross-site request forgery                            | `SameSite=Lax` cookie plus `Origin` check on every state-changing request                                                      | #15       |
| S4  | Session fixation                                      | New session ID at sign-in and when the active membership changes                                                               | #13       |
| S5  | A suspended user keeps working                        | Their sessions are deleted at suspension; status checked on every request                                                      | #15       |
| S6  | Account takeover through password reset               | Single-use token, stored as a hash, expires after 1 hour; no hint whether the email exists; email sent after a password change | #14       |
| S7  | A stolen invitation link                              | Single-use token bound to the invited email, expires after 7 days, can be revoked                                              | #25       |
| S8  | A user raises their own role                          | Roles come from the membership, never from the request; only `staff.manage` changes roles, and every change is audit-logged    | #16       |
| S9  | A parent or teacher opens records outside their scope | Policy checks for every scope in section 2; portal isolation tests                                                             | #45, #49  |

### 5.3 Files

| #   | Threat                                     | Mitigation                                                                                               | Tested in |
| --- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- | --------- |
| F1  | A file link is shared or leaked            | Private bucket; signed links expire after 5 minutes; permission checked before every link                | #30       |
| F2  | An uploaded HTML or SVG file runs script   | Type allowlist; content type set by the server; files other than images and PDFs download as attachments | #30       |
| F3  | Huge uploads fill storage or block the API | 20 MB limit; upload rate limit per user                                                                  | #30       |
| F4  | A file name escapes its folder             | Storage keys are UUIDs; the original name is stored only in the database                                 | #30       |
| F5  | An uploaded file contains malware          | Not scanned in v1 (decision D-13); allowlisted types only                                                | —         |

### 5.4 Finance

| #   | Threat                                                    | Mitigation                                                                                                                                | Tested in |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| M1  | A payment is posted twice (double click, retry)           | Idempotency key, unique per school                                                                                                        | #53       |
| M2  | Someone edits or deletes payment history                  | Payments, allocations and adjustments are append-only; corrections are reversals with a reason; the app's database role can't delete them | #55       |
| M3  | An accountant reverses a cash payment and keeps the money | Every reversal needs a reason, is audit-logged, shows in reconciliation and in the admin's daily reversals report                         | #55, #58  |
| M4  | Rounding errors                                           | Integer amounts in the smallest unit (`BigInt`)                                                                                           | #51       |
| M5  | USD paid against an LBP invoice                           | Allocations allowed only between the same currency                                                                                        | #54       |
| M6  | Duplicate or missing receipt numbers                      | Numbers come from a locked per-school sequence                                                                                            | #52       |

### 5.5 Grades and privacy

| #   | Threat                               | Mitigation                                                                               | Tested in |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------- | --------- |
| G1  | A published grade is changed quietly | Reason required, `GradeChange` history, audit log; locked terms only by the school admin | #39       |
| P1  | Personal data ends up in logs        | Logs contain IDs, never names, emails, grades or amounts                                 | #8, #65   |
| P2  | A leaked backup                      | Provider encryption at rest; backup access limited to the owner                          | #68       |
