import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  PermissionCondition,
  type PermissionKey,
  PermissionScope,
  ROLE_MATRIX,
  RoleKey,
  type RoleMatrixEntry,
} from "./permissions.js";

/**
 * Parses the role matrix table from docs/permissions.md section 4, so a unit test can
 * catch the doc and ROLE_MATRIX drifting apart. If this parser starts throwing, the table
 * in the doc has changed shape and the mapping below needs updating too.
 */

const DOC_PATH = path.join(import.meta.dirname, "..", "..", "..", "docs", "permissions.md");

const HEADER_TO_ROLE: Record<string, RoleKey> = {
  "Platform operator": RoleKey.PLATFORM_OPERATOR,
  "School admin": RoleKey.SCHOOL_ADMIN,
  Teacher: RoleKey.TEACHER,
  Accountant: RoleKey.ACCOUNTANT,
  Student: RoleKey.STUDENT,
  Parent: RoleKey.PARENT,
};

/** Splits a markdown table row like `| a | b | c |` into `["a", "b", "c"]`. */
function splitRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function parseCell(
  permission: string,
  cellText: string,
): Omit<RoleMatrixEntry, "permission"> | null {
  switch (cellText) {
    case "—":
      return null;
    case "All schools":
      return { scope: PermissionScope.ALL_SCHOOLS };
    case "School":
      return { scope: PermissionScope.SCHOOL };
    case "Own classes":
      return { scope: PermissionScope.OWN_CLASSES };
    case "Own lessons":
      return { scope: PermissionScope.OWN_LESSONS };
    case "Self":
      return { scope: PermissionScope.SELF };
    case "Children":
      return { scope: PermissionScope.CHILDREN };
    case "Targeted":
      return { scope: PermissionScope.TARGETED };
    case "Self, published":
      return { scope: PermissionScope.SELF, condition: PermissionCondition.PUBLISHED_ONLY };
    case "Children, published":
      return { scope: PermissionScope.CHILDREN, condition: PermissionCondition.PUBLISHED_ONLY };
    case "Own lessons, unlocked terms":
      return {
        scope: PermissionScope.OWN_LESSONS,
        condition: PermissionCondition.UNLOCKED_TERMS_ONLY,
      };
    case "Finance only":
      return { scope: PermissionScope.SCHOOL, condition: PermissionCondition.FINANCE_ONLY };
    case "Self (own feedback)":
      return { scope: PermissionScope.SELF, condition: PermissionCondition.FEEDBACK_ONLY };
    case "Children (feedback)":
      return { scope: PermissionScope.CHILDREN, condition: PermissionCondition.FEEDBACK_ONLY };
    default:
      throw new Error(
        `Unrecognized role matrix cell "${cellText}" for permission "${permission}" in docs/permissions.md. Update the parser in permissions.doc-sync.test.ts.`,
      );
  }
}

/** Parses the section 4 role matrix table into the same shape as ROLE_MATRIX. */
function parseRoleMatrixFromDocs(): Record<RoleKey, RoleMatrixEntry[]> {
  const markdown = readFileSync(DOC_PATH, "utf-8");

  const sectionStart = markdown.indexOf("## 4. Role matrix");
  if (sectionStart === -1) throw new Error("Could not find '## 4. Role matrix' in permissions.md");
  const sectionEnd = markdown.indexOf("## 5. Threat model", sectionStart);
  if (sectionEnd === -1) throw new Error("Could not find '## 5. Threat model' in permissions.md");
  const section = markdown.slice(sectionStart, sectionEnd);

  const tableLines = section.split("\n").filter((line) => line.trim().startsWith("|"));
  if (tableLines.length < 3) throw new Error("Could not find the role matrix table rows");

  const headerLine = tableLines[0];
  if (!headerLine) throw new Error("Could not find the role matrix header row");

  const headerCells = splitRow(headerLine);
  const roleColumns = headerCells.slice(1).map((header) => {
    const role = HEADER_TO_ROLE[header];
    if (!role) throw new Error(`Unrecognized role matrix column "${header}"`);
    return role;
  });

  const matrix: Record<RoleKey, RoleMatrixEntry[]> = {
    PLATFORM_OPERATOR: [],
    SCHOOL_ADMIN: [],
    TEACHER: [],
    ACCOUNTANT: [],
    STUDENT: [],
    PARENT: [],
  };

  // tableLines[0] is the header, tableLines[1] is the "---" separator.
  for (const line of tableLines.slice(2)) {
    const cells = splitRow(line);
    const permissionCell = cells[0];
    if (!permissionCell) throw new Error(`Could not read the permission key cell in row: ${line}`);
    const permission = permissionCell.replace(/`/g, "") as PermissionKey;

    for (const [index, role] of roleColumns.entries()) {
      const cellText = cells[index + 1];
      if (cellText === undefined) {
        throw new Error(`Row for "${permission}" is missing a cell for column ${index + 1}`);
      }
      const entry = parseCell(permission, cellText);
      if (entry) matrix[role].push({ permission, ...entry });
    }
  }

  return matrix;
}

function sortedByPermission(entries: RoleMatrixEntry[]): RoleMatrixEntry[] {
  return [...entries].sort((a, b) => a.permission.localeCompare(b.permission));
}

describe("ROLE_MATRIX matches docs/permissions.md section 4", () => {
  const docMatrix = parseRoleMatrixFromDocs();

  for (const role of Object.values(RoleKey)) {
    it(`matches for ${role}`, () => {
      expect(sortedByPermission(ROLE_MATRIX[role])).toEqual(sortedByPermission(docMatrix[role]));
    });
  }
});
