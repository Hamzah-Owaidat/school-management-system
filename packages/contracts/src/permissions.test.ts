import { describe, expect, it } from "vitest";
import {
  PERMISSION_DESCRIPTIONS,
  PermissionCondition,
  PermissionKey,
  PermissionScope,
  ROLE_MATRIX,
  ROLES,
  RoleKey,
  RoleScope,
} from "./permissions.js";

const permissionKeys = Object.values(PermissionKey);
const roleKeys = Object.values(RoleKey);

describe("PermissionKey", () => {
  it("has exactly 42 keys", () => {
    expect(permissionKeys).toHaveLength(42);
  });

  it("has no duplicate keys", () => {
    expect(new Set(permissionKeys).size).toBe(permissionKeys.length);
  });

  it("has a description for every key", () => {
    for (const key of permissionKeys) {
      expect(PERMISSION_DESCRIPTIONS[key]).toBeTruthy();
    }
  });
});

describe("RoleKey", () => {
  it("has exactly 6 roles", () => {
    expect(roleKeys).toHaveLength(6);
  });

  it("gives every role a display name and scope", () => {
    for (const key of roleKeys) {
      expect(ROLES[key].name).toBeTruthy();
      expect(Object.values(RoleScope)).toContain(ROLES[key].scope);
    }
  });

  it("scopes the platform operator to PLATFORM and the rest to SCHOOL", () => {
    expect(ROLES[RoleKey.PLATFORM_OPERATOR].scope).toBe(RoleScope.PLATFORM);
    for (const key of roleKeys) {
      if (key === RoleKey.PLATFORM_OPERATOR) continue;
      expect(ROLES[key].scope).toBe(RoleScope.SCHOOL);
    }
  });
});

describe("ROLE_MATRIX", () => {
  it("only uses known permission keys", () => {
    for (const entries of Object.values(ROLE_MATRIX)) {
      for (const entry of entries) {
        expect(permissionKeys).toContain(entry.permission);
      }
    }
  });

  it("never attaches the platform operator's permission to another role", () => {
    for (const role of roleKeys) {
      if (role === RoleKey.PLATFORM_OPERATOR) continue;
      const matrix = ROLE_MATRIX[role];
      expect(
        matrix.some((entry) => entry.permission === PermissionKey.PLATFORM_SCHOOLS_MANAGE),
      ).toBe(false);
    }
  });

  it("gives the accountant finance.payments.record with scope SCHOOL", () => {
    const entry = ROLE_MATRIX[RoleKey.ACCOUNTANT].find(
      (e) => e.permission === PermissionKey.FINANCE_PAYMENTS_RECORD,
    );
    expect(entry).toEqual({
      permission: PermissionKey.FINANCE_PAYMENTS_RECORD,
      scope: PermissionScope.SCHOOL,
    });
  });

  it("does not give the school admin finance.payments.record (D-17 separation of duties)", () => {
    const entry = ROLE_MATRIX[RoleKey.SCHOOL_ADMIN].find(
      (e) => e.permission === PermissionKey.FINANCE_PAYMENTS_RECORD,
    );
    expect(entry).toBeUndefined();
  });

  it("gives the teacher grades.correct scoped to own lessons, unlocked terms only", () => {
    const entry = ROLE_MATRIX[RoleKey.TEACHER].find(
      (e) => e.permission === PermissionKey.GRADES_CORRECT,
    );
    expect(entry).toEqual({
      permission: PermissionKey.GRADES_CORRECT,
      scope: PermissionScope.OWN_LESSONS,
      condition: PermissionCondition.UNLOCKED_TERMS_ONLY,
    });
  });

  it("gives the student and parent grades.read as published only", () => {
    const studentEntry = ROLE_MATRIX[RoleKey.STUDENT].find(
      (e) => e.permission === PermissionKey.GRADES_READ,
    );
    const parentEntry = ROLE_MATRIX[RoleKey.PARENT].find(
      (e) => e.permission === PermissionKey.GRADES_READ,
    );
    expect(studentEntry?.condition).toBe(PermissionCondition.PUBLISHED_ONLY);
    expect(parentEntry?.condition).toBe(PermissionCondition.PUBLISHED_ONLY);
  });

  it("gives the accountant reports.read and audit.read as finance only", () => {
    const reportsEntry = ROLE_MATRIX[RoleKey.ACCOUNTANT].find(
      (e) => e.permission === PermissionKey.REPORTS_READ,
    );
    const auditEntry = ROLE_MATRIX[RoleKey.ACCOUNTANT].find(
      (e) => e.permission === PermissionKey.AUDIT_READ,
    );
    expect(reportsEntry?.condition).toBe(PermissionCondition.FINANCE_ONLY);
    expect(auditEntry?.condition).toBe(PermissionCondition.FINANCE_ONLY);
  });
});
