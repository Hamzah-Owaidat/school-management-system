# Software Requirements Specification (SRS)

**Project:** School Management System
**Version:** 0.1 (draft)
**Date:** 31 Oct 2026
**Owner:** Hamzah Owaidat
**Issue:** #1 · Milestone M0

---

## 1. Purpose and scope

This document defines what version 1.0 of the School Management System must do. It is the reference for every later milestone (M1–M7).

The system is a multi-tenant web app (SaaS): one platform hosts many schools, and each school's data is fully isolated. Version 1.0 launches with one pilot school on 8 Feb 2027.

**Stack:** Next.js + Express + TypeScript + PostgreSQL (Prisma).

---

## 2. Roles

| # | Role | Who | Can do | Cannot do |
|---|------|-----|--------|-----------|
| 1 | Platform operator | The SaaS owner (us) | Create, edit and suspend schools; invite each school's first admin | See a school's student data in normal use (any support access is audit-logged) |
| 2 | School admin | Principal or office staff | Manage school settings, academic structure, staff, students, enrollment, announcements and reports | Access another school's data |
| 3 | Teacher | Teaching staff | For their own classes: take attendance, enter grades, post materials and assignments, view the timetable | See classes they are not assigned to; change fees or payments |
| 4 | Accountant | Finance staff | Manage fee structures, invoices, payments, reversals and finance reports | Change grades or attendance |
| 5 | Student | Enrolled student | See their own timetable, materials, published grades and attendance; submit assignments; read announcements | See other students' data |
| 6 | Parent / guardian | Linked to one or more students | See each linked child's grades, attendance, assignments, announcements and fees; switch between children | See children they are not linked to; submit work for the student |

---

## 3. Functional requirements

Priority: **Must** = required for the pilot launch · **Should** = planned for v1, can slip · **Later** = after v1.

| ID | Requirement | Priority | Acceptance note | Issues |
|----|-------------|----------|-----------------|--------|
| FR-01 | **Sign-in and accounts:** sign in with email and password, sign out, reset a forgotten password by email, verify email | Must | A reset link expires after 1 hour and works only once | #13, #14, #19 |
| FR-02 | **Roles and permissions:** every action is checked against the user's role and scope (school, class, child) | Must | A teacher requesting another class's grades gets a 403, tested for every role | #16 |
| FR-03 | **School management (platform):** the platform operator creates, edits and suspends schools | Should | Users of a suspended school cannot sign in, and its data is kept | #21 |
| FR-04 | **School settings and staff:** name, logo, default language, timezone, currency; invite staff and assign roles | Must | An invited teacher sets a password and sees only teacher screens | #22 |
| FR-05 | **Academic structure:** academic years, terms, grade levels, classes, subjects and teacher assignments | Must | An admin sets up a full year without developer help; only one year is active at a time | #23, #24, #27 |
| FR-06 | **Students, teachers and enrollment:** profiles, email invitations, enroll a student in a class, transfer between classes | Must | After a transfer, the student's past attendance and grades stay under the old class | #25, #26, #28 |
| FR-07 | **Learning materials:** teachers upload files and links per class and subject | Should | A student outside the class cannot open a file, even with its link | #30, #31, #32 |
| FR-08 | **Assignments and submissions:** teachers set assignments with due dates; students submit; teachers return feedback and a mark | Must | A late submission is accepted and marked "late" | #33, #34, #35 |
| FR-09 | **Attendance:** teachers record present, absent, late or excused; corrections keep history | Must | Editing a past record keeps the old value, who changed it, when and why | #36, #37 |
| FR-10 | **Grades:** grading scales, weighted assessments, grade entry, publishing and corrections | Must | Students and parents see a grade only after it is published; term averages follow the weights | #38, #39, #40 |
| FR-11 | **Timetable:** a weekly timetable per class | Should | Saving a period that double-books a teacher or room is refused with a clear message | #41, #42 |
| FR-12 | **Student and parent portals:** dashboards, guardian links, child switcher, announcements and notifications | Must | A parent with two children sees only those two; switching child changes all the data shown | #44–#48 |
| FR-13 | **Finance:** fee structures, invoices, payment recording, allocation, reversals and reconciliation | Must | Posting the same payment twice creates only one payment; a reversal keeps both entries in history | #51–#57 |
| FR-14 | **Reports and exports:** finance, academic, attendance and enrollment reports; exports run in the background | Should | An admin exports a class's term grades; a large export finishes in the background and notifies the admin | #58, #59, #60 |

---

## 4. Non-functional requirements

| ID | Area | Target | How we check |
|----|------|--------|--------------|
| NFR-01 | Tenancy | Every record belongs to one school, and every query is filtered by the current school. Zero cross-school reads. | Cross-tenant tests on every API endpoint pass in CI (#17, #18, #49) |
| NFR-02 | Security | Passwords hashed (Argon2id); httpOnly secure cookies; CSRF protection; rate-limited login; audit log for grade, payment and role changes | Security review before launch (#15, #65) |
| NFR-03 | Performance | 95% of API calls answer in under 500 ms; pages are usable in under 3 s on 4G, for a school with 1,000 students and 100 users online at once | Load test (#66) |
| NFR-04 | Recovery | Automatic daily database backups kept for 30 days; at most 24 h of data lost; service restored within 4 h | Restore drill passed before launch (#68) |
| NFR-05 | Accessibility | WCAG 2.2 AA: full keyboard use, labelled inputs, sufficient contrast | Accessibility pass (#64) |
| NFR-06 | Privacy | Collect only the student data the school needs; uploaded files are private and their links expire; users see only their own or their linked children's data; a school can export or delete a student's data on request | Portal isolation E2E tests (#49) |
| NFR-07 | Financial integrity | Money stored as whole numbers in the smallest unit, with its currency; payment posting is idempotent; financial records are never deleted, only reversed | Finance API tests (#51, #53, #55) |
| NFR-08 | Devices | Responsive down to phone width; latest two versions of Chrome, Safari, Firefox and Edge | Critical E2E suite (#67) |

---

## 5. Languages

- The interface is available in **Arabic, English and French**, including every screen, email and error message.
- **Arabic is right-to-left**: the layout mirrors. English and French are left-to-right.
- Each user chooses their language; new users start with the school's default language.
- Dates, numbers and currency are formatted for the chosen language.
- Text that users type (names, announcements, materials) is shown as written and is not auto-translated.
- Checked by the localization and RTL QA tasks (#62, #63).

---

## 6. Out of scope for v1

To be confirmed:

- Native mobile apps (v1 is a responsive web app)
- Online card payments (v1 records cash, cheque and bank-transfer payments)
- Chat or direct messaging (announcements are one-way)
- Live or video classes
- Online quizzes with automatic grading
- Online admissions and applications for new students
- Transport, library, cafeteria and inventory
- Staff HR and payroll
- SMS and WhatsApp notifications (v1 uses in-app and email only)
- Self-service school sign-up and subscription billing (the platform operator adds schools manually)
- Integration with Ministry of Education systems

---

## 7. Open questions

1. **Currency:** does the pilot school bill in USD, LBP or both?
2. **Grading scale:** marks out of 20, out of 100, or letters?
3. **Report cards:** are printable term report cards needed in v1?
4. **Names:** store student names in both Arabic and Latin script?
5. **Attendance:** recorded once per day or per period?
6. **Arabic digits:** Western (0–9) or Eastern Arabic (٠–٩) in the Arabic interface?