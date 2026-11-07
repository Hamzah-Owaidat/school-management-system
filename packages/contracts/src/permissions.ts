/**
 * Permissions and the role matrix from docs/permissions.md (sections 3 and 4).
 * This is the single source of truth: the API's policy layer (#16) and the
 * database seed (packages/db) both read from here.
 */

/** Permission keys from docs/permissions.md section 3. */
export const PermissionKey = {
  PLATFORM_SCHOOLS_MANAGE: "platform.schools.manage",
  SCHOOL_SETTINGS_READ: "school.settings.read",
  SCHOOL_SETTINGS_UPDATE: "school.settings.update",
  STAFF_READ: "staff.read",
  STAFF_MANAGE: "staff.manage",
  ACADEMICS_READ: "academics.read",
  ACADEMICS_MANAGE: "academics.manage",
  STUDENTS_READ: "students.read",
  STUDENTS_MANAGE: "students.manage",
  GUARDIANS_READ: "guardians.read",
  GUARDIANS_MANAGE: "guardians.manage",
  ENROLLMENT_READ: "enrollment.read",
  ENROLLMENT_MANAGE: "enrollment.manage",
  TIMETABLE_READ: "timetable.read",
  TIMETABLE_MANAGE: "timetable.manage",
  MATERIALS_READ: "materials.read",
  MATERIALS_MANAGE: "materials.manage",
  ASSIGNMENTS_READ: "assignments.read",
  ASSIGNMENTS_MANAGE: "assignments.manage",
  SUBMISSIONS_CREATE: "submissions.create",
  SUBMISSIONS_REVIEW: "submissions.review",
  ATTENDANCE_READ: "attendance.read",
  ATTENDANCE_RECORD: "attendance.record",
  ATTENDANCE_CORRECT: "attendance.correct",
  GRADES_READ: "grades.read",
  GRADES_ENTER: "grades.enter",
  GRADES_PUBLISH: "grades.publish",
  GRADES_CORRECT: "grades.correct",
  TERMS_LOCK: "terms.lock",
  REPORTCARDS_READ: "reportcards.read",
  REPORTCARDS_GENERATE: "reportcards.generate",
  ANNOUNCEMENTS_READ: "announcements.read",
  ANNOUNCEMENTS_PUBLISH: "announcements.publish",
  FINANCE_READ: "finance.read",
  FINANCE_FEES_MANAGE: "finance.fees.manage",
  FINANCE_INVOICES_MANAGE: "finance.invoices.manage",
  FINANCE_PAYMENTS_RECORD: "finance.payments.record",
  FINANCE_PAYMENTS_REVERSE: "finance.payments.reverse",
  FINANCE_RECONCILE: "finance.reconcile",
  REPORTS_READ: "reports.read",
  REPORTS_EXPORT: "reports.export",
  AUDIT_READ: "audit.read",
} as const;

export type PermissionKey = (typeof PermissionKey)[keyof typeof PermissionKey];

/** What each permission key allows (docs/permissions.md section 3). */
export const PERMISSION_DESCRIPTIONS: Record<PermissionKey, string> = {
  [PermissionKey.PLATFORM_SCHOOLS_MANAGE]:
    "Create, edit and suspend schools; invite a school's first admin",
  [PermissionKey.SCHOOL_SETTINGS_READ]:
    "See school name, logo, languages, currencies, grading scale",
  [PermissionKey.SCHOOL_SETTINGS_UPDATE]: "Change school settings",
  [PermissionKey.STAFF_READ]: "See staff list and roles",
  [PermissionKey.STAFF_MANAGE]: "Invite staff, change roles, suspend memberships",
  [PermissionKey.ACADEMICS_READ]: "See years, terms, grade levels, classes, subjects",
  [PermissionKey.ACADEMICS_MANAGE]:
    "Create and change years, terms, grade levels, classes, subjects, teacher assignments",
  [PermissionKey.STUDENTS_READ]: "See student profiles",
  [PermissionKey.STUDENTS_MANAGE]: "Create, edit, withdraw and anonymize students",
  [PermissionKey.GUARDIANS_READ]: "See parent profiles and links",
  [PermissionKey.GUARDIANS_MANAGE]: "Create parents, link them to students, send invitations",
  [PermissionKey.ENROLLMENT_READ]: "See enrollments and class lists",
  [PermissionKey.ENROLLMENT_MANAGE]: "Enroll, transfer and withdraw students",
  [PermissionKey.TIMETABLE_READ]: "See the timetable",
  [PermissionKey.TIMETABLE_MANAGE]: "Create and change periods and timetable entries",
  [PermissionKey.MATERIALS_READ]: "See learning materials",
  [PermissionKey.MATERIALS_MANAGE]: "Create, edit and delete learning materials",
  [PermissionKey.ASSIGNMENTS_READ]: "See assignments",
  [PermissionKey.ASSIGNMENTS_MANAGE]: "Create, edit and delete assignments",
  [PermissionKey.SUBMISSIONS_CREATE]: "Submit work for an assignment",
  [PermissionKey.SUBMISSIONS_REVIEW]: "Read submissions, return feedback and marks",
  [PermissionKey.ATTENDANCE_READ]: "See attendance",
  [PermissionKey.ATTENDANCE_RECORD]: "Record attendance for today's lessons",
  [PermissionKey.ATTENDANCE_CORRECT]: "Change attendance for an earlier day (reason required)",
  [PermissionKey.GRADES_READ]: "See grades",
  [PermissionKey.GRADES_ENTER]: "Create assessments and enter grades while in draft",
  [PermissionKey.GRADES_PUBLISH]: "Publish an assessment's grades",
  [PermissionKey.GRADES_CORRECT]: "Change a published grade (reason required)",
  [PermissionKey.TERMS_LOCK]: "Lock and unlock a term's grades",
  [PermissionKey.REPORTCARDS_READ]: "See and download report cards",
  [PermissionKey.REPORTCARDS_GENERATE]: "Generate report cards for a term",
  [PermissionKey.ANNOUNCEMENTS_READ]: "See announcements",
  [PermissionKey.ANNOUNCEMENTS_PUBLISH]: "Create, publish and delete announcements",
  [PermissionKey.FINANCE_READ]: "See fee structures, invoices, payments and balances",
  [PermissionKey.FINANCE_FEES_MANAGE]: "Create and change fee structures",
  [PermissionKey.FINANCE_INVOICES_MANAGE]: "Create, issue, adjust and void invoices",
  [PermissionKey.FINANCE_PAYMENTS_RECORD]: "Record payments and allocate them",
  [PermissionKey.FINANCE_PAYMENTS_REVERSE]: "Reverse a payment or an allocation (reason required)",
  [PermissionKey.FINANCE_RECONCILE]: "Open and close reconciliation batches",
  [PermissionKey.REPORTS_READ]: "See academic, attendance, enrollment and finance reports",
  [PermissionKey.REPORTS_EXPORT]: "Export reports as files",
  [PermissionKey.AUDIT_READ]: "Read the school's audit log",
};

/** Role keys from docs/permissions.md section 4. */
export const RoleKey = {
  PLATFORM_OPERATOR: "PLATFORM_OPERATOR",
  SCHOOL_ADMIN: "SCHOOL_ADMIN",
  TEACHER: "TEACHER",
  ACCOUNTANT: "ACCOUNTANT",
  STUDENT: "STUDENT",
  PARENT: "PARENT",
} as const;

export type RoleKey = (typeof RoleKey)[keyof typeof RoleKey];

/** Where a role lives: PLATFORM roles are never attached to a school membership (D-18). */
export const RoleScope = {
  PLATFORM: "PLATFORM",
  SCHOOL: "SCHOOL",
} as const;

export type RoleScope = (typeof RoleScope)[keyof typeof RoleScope];

export const ROLES: Record<RoleKey, { name: string; scope: RoleScope }> = {
  [RoleKey.PLATFORM_OPERATOR]: { name: "Platform operator", scope: RoleScope.PLATFORM },
  [RoleKey.SCHOOL_ADMIN]: { name: "School admin", scope: RoleScope.SCHOOL },
  [RoleKey.TEACHER]: { name: "Teacher", scope: RoleScope.SCHOOL },
  [RoleKey.ACCOUNTANT]: { name: "Accountant", scope: RoleScope.SCHOOL },
  [RoleKey.STUDENT]: { name: "Student", scope: RoleScope.SCHOOL },
  [RoleKey.PARENT]: { name: "Parent", scope: RoleScope.SCHOOL },
};

/** The scope of a role's grant on a permission (docs/permissions.md section 2). */
export const PermissionScope = {
  ALL_SCHOOLS: "ALL_SCHOOLS",
  SCHOOL: "SCHOOL",
  OWN_CLASSES: "OWN_CLASSES",
  OWN_LESSONS: "OWN_LESSONS",
  SELF: "SELF",
  CHILDREN: "CHILDREN",
  TARGETED: "TARGETED",
} as const;

export type PermissionScope = (typeof PermissionScope)[keyof typeof PermissionScope];

/** A narrowing condition on top of a scope, for matrix cells like "Self, published". */
export const PermissionCondition = {
  PUBLISHED_ONLY: "PUBLISHED_ONLY",
  UNLOCKED_TERMS_ONLY: "UNLOCKED_TERMS_ONLY",
  FINANCE_ONLY: "FINANCE_ONLY",
  FEEDBACK_ONLY: "FEEDBACK_ONLY",
} as const;

export type PermissionCondition = (typeof PermissionCondition)[keyof typeof PermissionCondition];

export interface RoleMatrixEntry {
  permission: PermissionKey;
  scope: PermissionScope;
  condition?: PermissionCondition;
}

/** The role matrix from docs/permissions.md section 4. A missing permission means "—": not allowed. */
export const ROLE_MATRIX: Record<RoleKey, RoleMatrixEntry[]> = {
  [RoleKey.PLATFORM_OPERATOR]: [
    { permission: PermissionKey.PLATFORM_SCHOOLS_MANAGE, scope: PermissionScope.ALL_SCHOOLS },
  ],
  [RoleKey.SCHOOL_ADMIN]: [
    { permission: PermissionKey.SCHOOL_SETTINGS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.SCHOOL_SETTINGS_UPDATE, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.STAFF_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.STAFF_MANAGE, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ACADEMICS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ACADEMICS_MANAGE, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.STUDENTS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.STUDENTS_MANAGE, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.GUARDIANS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.GUARDIANS_MANAGE, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ENROLLMENT_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ENROLLMENT_MANAGE, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.TIMETABLE_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.TIMETABLE_MANAGE, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.MATERIALS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ASSIGNMENTS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.SUBMISSIONS_REVIEW, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ATTENDANCE_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ATTENDANCE_RECORD, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ATTENDANCE_CORRECT, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.GRADES_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.GRADES_PUBLISH, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.GRADES_CORRECT, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.TERMS_LOCK, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.REPORTCARDS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.REPORTCARDS_GENERATE, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ANNOUNCEMENTS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ANNOUNCEMENTS_PUBLISH, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.FINANCE_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.REPORTS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.REPORTS_EXPORT, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.AUDIT_READ, scope: PermissionScope.SCHOOL },
  ],
  [RoleKey.TEACHER]: [
    { permission: PermissionKey.SCHOOL_SETTINGS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.STAFF_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ACADEMICS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.STUDENTS_READ, scope: PermissionScope.OWN_CLASSES },
    { permission: PermissionKey.GUARDIANS_READ, scope: PermissionScope.OWN_CLASSES },
    { permission: PermissionKey.ENROLLMENT_READ, scope: PermissionScope.OWN_CLASSES },
    { permission: PermissionKey.TIMETABLE_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.MATERIALS_READ, scope: PermissionScope.OWN_LESSONS },
    { permission: PermissionKey.MATERIALS_MANAGE, scope: PermissionScope.OWN_LESSONS },
    { permission: PermissionKey.ASSIGNMENTS_READ, scope: PermissionScope.OWN_LESSONS },
    { permission: PermissionKey.ASSIGNMENTS_MANAGE, scope: PermissionScope.OWN_LESSONS },
    { permission: PermissionKey.SUBMISSIONS_REVIEW, scope: PermissionScope.OWN_LESSONS },
    { permission: PermissionKey.ATTENDANCE_READ, scope: PermissionScope.OWN_CLASSES },
    { permission: PermissionKey.ATTENDANCE_RECORD, scope: PermissionScope.OWN_LESSONS },
    { permission: PermissionKey.ATTENDANCE_CORRECT, scope: PermissionScope.OWN_LESSONS },
    { permission: PermissionKey.GRADES_READ, scope: PermissionScope.OWN_LESSONS },
    { permission: PermissionKey.GRADES_ENTER, scope: PermissionScope.OWN_LESSONS },
    { permission: PermissionKey.GRADES_PUBLISH, scope: PermissionScope.OWN_LESSONS },
    {
      permission: PermissionKey.GRADES_CORRECT,
      scope: PermissionScope.OWN_LESSONS,
      condition: PermissionCondition.UNLOCKED_TERMS_ONLY,
    },
    { permission: PermissionKey.REPORTCARDS_READ, scope: PermissionScope.OWN_CLASSES },
    { permission: PermissionKey.ANNOUNCEMENTS_READ, scope: PermissionScope.TARGETED },
    { permission: PermissionKey.ANNOUNCEMENTS_PUBLISH, scope: PermissionScope.OWN_CLASSES },
    { permission: PermissionKey.REPORTS_READ, scope: PermissionScope.OWN_CLASSES },
    { permission: PermissionKey.REPORTS_EXPORT, scope: PermissionScope.OWN_CLASSES },
  ],
  [RoleKey.ACCOUNTANT]: [
    { permission: PermissionKey.SCHOOL_SETTINGS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.STAFF_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ACADEMICS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.STUDENTS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.GUARDIANS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ENROLLMENT_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ANNOUNCEMENTS_READ, scope: PermissionScope.TARGETED },
    { permission: PermissionKey.FINANCE_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.FINANCE_FEES_MANAGE, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.FINANCE_INVOICES_MANAGE, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.FINANCE_PAYMENTS_RECORD, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.FINANCE_PAYMENTS_REVERSE, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.FINANCE_RECONCILE, scope: PermissionScope.SCHOOL },
    {
      permission: PermissionKey.REPORTS_READ,
      scope: PermissionScope.SCHOOL,
      condition: PermissionCondition.FINANCE_ONLY,
    },
    {
      permission: PermissionKey.REPORTS_EXPORT,
      scope: PermissionScope.SCHOOL,
      condition: PermissionCondition.FINANCE_ONLY,
    },
    {
      permission: PermissionKey.AUDIT_READ,
      scope: PermissionScope.SCHOOL,
      condition: PermissionCondition.FINANCE_ONLY,
    },
  ],
  [RoleKey.STUDENT]: [
    { permission: PermissionKey.SCHOOL_SETTINGS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ACADEMICS_READ, scope: PermissionScope.SELF },
    { permission: PermissionKey.STUDENTS_READ, scope: PermissionScope.SELF },
    { permission: PermissionKey.ENROLLMENT_READ, scope: PermissionScope.SELF },
    { permission: PermissionKey.TIMETABLE_READ, scope: PermissionScope.SELF },
    { permission: PermissionKey.MATERIALS_READ, scope: PermissionScope.SELF },
    { permission: PermissionKey.ASSIGNMENTS_READ, scope: PermissionScope.SELF },
    { permission: PermissionKey.SUBMISSIONS_CREATE, scope: PermissionScope.SELF },
    {
      permission: PermissionKey.SUBMISSIONS_REVIEW,
      scope: PermissionScope.SELF,
      condition: PermissionCondition.FEEDBACK_ONLY,
    },
    { permission: PermissionKey.ATTENDANCE_READ, scope: PermissionScope.SELF },
    {
      permission: PermissionKey.GRADES_READ,
      scope: PermissionScope.SELF,
      condition: PermissionCondition.PUBLISHED_ONLY,
    },
    {
      permission: PermissionKey.REPORTCARDS_READ,
      scope: PermissionScope.SELF,
      condition: PermissionCondition.PUBLISHED_ONLY,
    },
    { permission: PermissionKey.ANNOUNCEMENTS_READ, scope: PermissionScope.TARGETED },
    { permission: PermissionKey.FINANCE_READ, scope: PermissionScope.SELF },
  ],
  [RoleKey.PARENT]: [
    { permission: PermissionKey.SCHOOL_SETTINGS_READ, scope: PermissionScope.SCHOOL },
    { permission: PermissionKey.ACADEMICS_READ, scope: PermissionScope.CHILDREN },
    { permission: PermissionKey.STUDENTS_READ, scope: PermissionScope.CHILDREN },
    { permission: PermissionKey.GUARDIANS_READ, scope: PermissionScope.SELF },
    { permission: PermissionKey.ENROLLMENT_READ, scope: PermissionScope.CHILDREN },
    { permission: PermissionKey.TIMETABLE_READ, scope: PermissionScope.CHILDREN },
    { permission: PermissionKey.MATERIALS_READ, scope: PermissionScope.CHILDREN },
    { permission: PermissionKey.ASSIGNMENTS_READ, scope: PermissionScope.CHILDREN },
    {
      permission: PermissionKey.SUBMISSIONS_REVIEW,
      scope: PermissionScope.CHILDREN,
      condition: PermissionCondition.FEEDBACK_ONLY,
    },
    { permission: PermissionKey.ATTENDANCE_READ, scope: PermissionScope.CHILDREN },
    {
      permission: PermissionKey.GRADES_READ,
      scope: PermissionScope.CHILDREN,
      condition: PermissionCondition.PUBLISHED_ONLY,
    },
    {
      permission: PermissionKey.REPORTCARDS_READ,
      scope: PermissionScope.CHILDREN,
      condition: PermissionCondition.PUBLISHED_ONLY,
    },
    { permission: PermissionKey.ANNOUNCEMENTS_READ, scope: PermissionScope.TARGETED },
    { permission: PermissionKey.FINANCE_READ, scope: PermissionScope.CHILDREN },
  ],
};
