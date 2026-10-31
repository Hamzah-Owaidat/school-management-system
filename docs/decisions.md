# Decisions

**Project:** School Management System
**Version:** 0.1
**Date:** 31 Oct 2026
**Owner:** Hamzah Owaidat
**Issue:** #4 · Milestone M0
**Related:** [SRS](./srs.md) · [Database design](./database-design.md) · [Permissions](./permissions.md) · [Architecture decision records](./adr/)

Every open question from the SRS and the design documents has an answer or an owner here. Technical architecture choices live in the [ADRs](./adr/); this log holds product and policy decisions.

**Status:** Decided = final for v1 · Proposed = an answer exists but the owner must confirm it · Open = no answer yet, the owner decides by the date given.

---

## 1. Summary

| ID | Topic | Answer | Owner | Status |
|----|-------|--------|-------|--------|
| D-01 | Finance model | Invoices from fee structures; record offline payments; no online payments | Hamzah | Decided |
| D-02 | Currency | USD and LBP; one currency per invoice; no conversion | Hamzah | Decided |
| D-03 | Parent identity | One account per parent email, linked to children by the school | Hamzah | Decided |
| D-04 | Grading | Each school chooses: out of 20, out of 100, or letters | Hamzah | Decided |
| D-05 | Attendance | Recorded every period by the lesson's teacher | Hamzah | Decided |
| D-06 | Report cards | Yes in v1: a PDF per student per term | Hamzah | Decided |
| D-07 | Student names | Latin name required; Arabic name optional | Hamzah (confirm with the school) | Proposed |
| D-08 | Digits in Arabic | Western digits (0–9) in every language | Hamzah (confirm with the school) | Proposed |
| D-09 | Notification channels | In-app and email; SMS and WhatsApp later | Hamzah | Decided |
| D-10 | Email provider | Not chosen yet | Hamzah | Open, before #14 (M2) |
| D-11 | Hosting region | Local until approval, then DigitalOcean Frankfurt (FRA1) | Hamzah | Decided |
| D-12 | Data retention | Periods in database design section 8.2 | Hamzah (confirm finance retention with the school's accountant) | Proposed |
| D-13 | Upload virus scanning | Not in v1 | Hamzah | Decided; revisit before the second school |
| D-14 | Row-level security | Not in v1 | Hamzah | Decided; revisit before the second school |
| D-15 | Out-of-scope list | SRS section 6 | Hamzah (confirm with the school) | Proposed |
| D-16 | Staging before approval | Local production build stands in for staging | Hamzah | Decided |
| D-17 | Finance separation of duties | Admin reads finance; only the accountant records or reverses payments | Hamzah | Decided |
| D-18 | Platform operator access | No access to school data inside the app in v1 | Hamzah | Decided |

---

## 2. Details

### D-01 Finance model

- The accountant defines **fee structures** per academic year and, optionally, per grade level, with items and due dates (installments).
- **Invoices** are created from a fee structure for each student, then issued. Extra charges are added as invoice lines.
- **Payments** are recorded by the accountant: cash, cheque, bank transfer or other. Each payment is allocated to one or more open invoices.
- **Discounts** (for example a sibling discount) and waivers are adjustments with a reason.
- **Not in v1:** online card payments, automatic late fees, payment plans beyond fee-structure installments.

### D-02 Currency

- A school enables one or more currencies; the pilot school uses **USD and LBP**.
- Each fee structure, invoice and payment has exactly one currency. A payment can only be allocated to an invoice in the same currency.
- Balances and reports show a total per currency, side by side. **No exchange rates or conversion** in v1.
- Schema change: `School.currency` becomes `School.currencies` (list) plus `School.defaultCurrency`.

### D-03 Parent identity

- A parent has **one account per email**, created through an invitation from the school.
- The school admin links parents to students (`StudentGuardian`). A parent can have several children, and a child can have several guardians (both parents can have accounts).
- A parent with children in two schools on the platform uses one login and switches school.
- Every linked guardian sees the child's grades, attendance, assignments, report cards and finance. The primary guardian is the default contact for notifications.
- Parents never submit work or change data for the student.

### D-04 Grading

- Each school chooses its default grading scale: **out of 20, out of 100, or letters** (with letter bands by percentage). A school can define more than one scale.
- Teachers always **enter marks** against each assessment's maximum (for example 14 out of 20 on a quiz).
- Averages are calculated as weighted percentages, then **shown on the school's scale** (for example 13.5/20, 67.5/100 or C+).
- Each scale has a pass mark.
- Schema change: `GradingScale` gains `type: NUMERIC | LETTER`.

### D-05 Attendance

- Attendance is taken **every period** by the teacher of that lesson, from the timetable.
- Statuses: present, absent, late, excused.
- A day counts as absent in reports when the student is absent in every period that day.
- The teacher can change today's records freely. Earlier days need a reason and keep history (database design section 10.2).
- The homeroom teacher and the school admin see the class's whole day.

### D-06 Report cards

- **In v1.** One PDF per student per term, in the student's or school's language (Arabic, English or French).
- Contents: school name and logo, student name (Arabic name too when present, D-07), class, term, each subject's average on the school's scale, the overall average, attendance totals, and a comment from the homeroom teacher.
- Generated by the school admin after the term's grades are locked. Each generation saves a snapshot, so a report card never changes after it is issued.
- Schema change: a new `ReportCard` table (database design section 4.7).
- Roadmap change: a new issue in M6, "Build report card generation" ([roadmap](./implementation-roadmap.md)).

### D-07 Student names

- **Proposed:** first and last name in Latin script are required; Arabic first and last name are optional.
- Arabic names appear on Arabic report cards and screens when present.

### D-08 Digits in Arabic

- **Proposed:** Western digits (0–9) in all three languages, as commonly used in Lebanese schools. Formatting stays a single setting so it can change later.

### D-09 Notification channels

- **In-app** notifications for everything; **email** for invitations, password resets, published grades, new report cards and announcements.
- SMS and WhatsApp are out of scope for v1 (SRS section 6).

### D-10 Email provider

- **Open.** Needed by issue #14 (password reset and email verification) in M2. Locally, Mailpit catches all emails.
- Decide by: the start of M2 (17 Nov 2026). Criteria: sending from the school platform's domain, Arabic and French content, cost at a few thousand emails a month.

### D-11 Hosting region

- Development and demos run locally until the pilot school approves (ADR 0005).
- Production: DigitalOcean, Frankfurt (FRA1), the closest region to Lebanon.

### D-12 Data retention

- **Proposed:** the periods in [database design section 8.2](./database-design.md#82-retention).
- Report cards are kept like other academic records.
- Hamzah confirms with the school how long finance records must be kept (proposed: at least 10 years).

### D-13 Upload virus scanning

- Not in v1. Only allowlisted file types are accepted (permissions threat F5).
- Revisit before a second school joins.

### D-14 Row-level security

- Not in v1. Tenant isolation relies on the scoped client, composite keys and cross-tenant tests (ADR 0002).
- Revisit before a second school joins.

### D-15 Out-of-scope list

- **Proposed:** the list in SRS section 6. Hamzah confirms it with the pilot school, then removes "To be confirmed" from the SRS.

### D-16 Staging before approval

- Until the pilot school approves, "staging" means a production build running locally with Docker Compose.
- Issues #10 (staging and production environments) and #11 (release v0.1.0 to staging) are done locally in M1. The DigitalOcean setup moves to after approval.

### D-17 Finance separation of duties

- The school admin can read finance and reports but can't record, allocate or reverse payments.
- A person who does both jobs holds two memberships and switches between them, so every finance action is recorded under the accountant role.

### D-18 Platform operator access

- In v1 the platform operator manages schools only and can't open a school's data inside the app.
- Support work happens with the school admin. Any direct database access is limited to the owner.
