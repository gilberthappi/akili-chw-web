import type { UserRole } from "@/types";

/** TRAINEE is the DB/API value; UI label is CHW. */
export const isLearnerRole = (role?: string | null) =>
  role === "TRAINEE" || role === "TESTER";

/** Department staff roles also satisfy legacy ADMIN/TRAINER/DEVELOPER/STAFF checks. */
export const ROLE_INHERITS: Partial<Record<string, UserRole[]>> = {
  WELTEL_ADMIN: ["ADMIN", "DEVELOPER", "STAFF"],
  WELTEL_DEVELOPER: ["DEVELOPER", "STAFF"],
  WELTEL_SUPPORT: ["STAFF"],
  RBC_COORDINATOR: ["ADMIN", "STAFF"],
  RBC_ANALYST: ["STAFF"],
  RBC_VIEWER: ["STAFF"],
  CIIC_CONTENT_LEAD: ["TRAINER", "ADMIN", "STAFF"],
  CIIC_EDITOR: ["TRAINER", "STAFF"],
  CIIC_REVIEWER: ["TRAINER", "STAFF"],
  SFH_COORDINATOR: ["STAFF", "TRAINER"],
  SFH_CEHO_MANAGER: ["STAFF"],
  SFH_ENROLLMENT: ["STAFF"],
};

export const DEPARTMENT_STAFF_ROLES: UserRole[] = [
  "RBC_COORDINATOR",
  "RBC_ANALYST",
  "RBC_VIEWER",
  "WELTEL_ADMIN",
  "WELTEL_DEVELOPER",
  "WELTEL_SUPPORT",
  "CIIC_CONTENT_LEAD",
  "CIIC_EDITOR",
  "CIIC_REVIEWER",
  "SFH_COORDINATOR",
  "SFH_CEHO_MANAGER",
  "SFH_ENROLLMENT",
];

/** Roles that inherit ADMIN (platform / dept coordinators). */
export const PLATFORM_ADMIN_ROLES: UserRole[] = [
  "ADMIN",
  "WELTEL_ADMIN",
  "RBC_COORDINATOR",
  "CIIC_CONTENT_LEAD",
];

/** Roles that inherit DEVELOPER. */
export const DEVELOPER_ROLES: UserRole[] = [
  "DEVELOPER",
  "WELTEL_ADMIN",
  "WELTEL_DEVELOPER",
];

/** Roles that inherit TRAINER / content. */
export const CONTENT_ROLES: UserRole[] = [
  "TRAINER",
  "CIIC_CONTENT_LEAD",
  "CIIC_EDITOR",
  "CIIC_REVIEWER",
  "SFH_COORDINATOR",
];

/** Roles that inherit STAFF (any department staff). */
export const STAFF_ROLES: UserRole[] = [
  "STAFF",
  ...DEPARTMENT_STAFF_ROLES,
];

/** Field learners (CHW + CEHO). */
export const FIELD_LEARNER_ROLES: UserRole[] = ["TRAINEE", "TESTER", "CEHO"];

export const CEHO_ONLY: UserRole[] = ["CEHO"];

/** Anyone authenticated in the main app shell. */
export const APP_SHELL_ROLES: UserRole[] = [
  "ADMIN",
  "TRAINEE",
  "TESTER",
  "TRAINER",
  "DEVELOPER",
  "STAFF",
  "CEHO",
  ...DEPARTMENT_STAFF_ROLES,
];

/** Staff management (admins / developers / dept coordinators). */
export const STAFF_MGMT_ROLES: UserRole[] = [
  ...PLATFORM_ADMIN_ROLES,
  ...DEVELOPER_ROLES,
  "SFH_COORDINATOR",
];

/** Course authoring / analytics / certificates management. */
export const COURSE_MGMT_ROLES: UserRole[] = [
  ...PLATFORM_ADMIN_ROLES,
  ...CONTENT_ROLES,
  ...DEVELOPER_ROLES,
];

/** CHW & CEHO list, feedbacks, certificates list (includes STAFF). */
export const LEARNER_MGMT_ROLES: UserRole[] = [
  ...PLATFORM_ADMIN_ROLES,
  ...CONTENT_ROLES,
  ...DEVELOPER_ROLES,
  ...STAFF_ROLES,
];

/** Health Centers — platform ADMIN + RBC/SFH (not CEHO). */
export const HEALTH_CENTER_ROLES: UserRole[] = [
  "ADMIN",
  "RBC_COORDINATOR",
  "RBC_ANALYST",
  "SFH_COORDINATOR",
  "SFH_ENROLLMENT",
];

/** Meetings / attendance (staff + CEHO). */
export const MEETING_ROLES: UserRole[] = [
  ...LEARNER_MGMT_ROLES,
  "CEHO",
];

/** Calendar / messaging / settings — staff + field. */
export const COLLAB_ROLES: UserRole[] = [
  ...LEARNER_MGMT_ROLES,
  ...FIELD_LEARNER_ROLES,
];

/** Human-readable role labels (API values unchanged). */
export const ROLE_DISPLAY: Record<string, string> = {
  TRAINEE: "CHW",
  TESTER: "CHW (Tester)",
  CEHO: "CEHO",
  ADMIN: "Admin",
  TRAINER: "Trainer",
  DEVELOPER: "Developer",
  STAFF: "Staff",
  RBC_COORDINATOR: "RBC Coordinator",
  RBC_ANALYST: "RBC Analyst",
  RBC_VIEWER: "RBC Viewer",
  WELTEL_ADMIN: "WelTel Admin",
  WELTEL_DEVELOPER: "WelTel Developer",
  WELTEL_SUPPORT: "WelTel Support",
  CIIC_CONTENT_LEAD: "CIIC Content Lead",
  CIIC_EDITOR: "CIIC Editor",
  CIIC_REVIEWER: "CIIC Reviewer",
  SFH_COORDINATOR: "SFH Coordinator",
  SFH_CEHO_MANAGER: "SFH CEHO Manager",
  SFH_ENROLLMENT: "SFH Enrollment",
};

export function formatRoleLabel(role?: string | null): string {
  if (!role) return "";
  return ROLE_DISPLAY[role] ?? role.replace(/_/g, " ");
}

export function expandRoles(roles: string[]): Set<string> {
  const out = new Set<string>();
  for (const r of roles) {
    out.add(r);
    for (const legacy of ROLE_INHERITS[r] ?? []) out.add(legacy);
  }
  return out;
}

/** Options for staff assignment UI. */
export const STAFF_ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: ROLE_DISPLAY.WELTEL_ADMIN, value: "WELTEL_ADMIN" },
  { label: ROLE_DISPLAY.WELTEL_DEVELOPER, value: "WELTEL_DEVELOPER" },
  { label: ROLE_DISPLAY.WELTEL_SUPPORT, value: "WELTEL_SUPPORT" },
  { label: ROLE_DISPLAY.RBC_COORDINATOR, value: "RBC_COORDINATOR" },
  { label: ROLE_DISPLAY.RBC_ANALYST, value: "RBC_ANALYST" },
  { label: ROLE_DISPLAY.RBC_VIEWER, value: "RBC_VIEWER" },
  { label: ROLE_DISPLAY.CIIC_CONTENT_LEAD, value: "CIIC_CONTENT_LEAD" },
  { label: ROLE_DISPLAY.CIIC_EDITOR, value: "CIIC_EDITOR" },
  { label: ROLE_DISPLAY.CIIC_REVIEWER, value: "CIIC_REVIEWER" },
  { label: ROLE_DISPLAY.SFH_COORDINATOR, value: "SFH_COORDINATOR" },
  { label: ROLE_DISPLAY.SFH_CEHO_MANAGER, value: "SFH_CEHO_MANAGER" },
  { label: ROLE_DISPLAY.SFH_ENROLLMENT, value: "SFH_ENROLLMENT" },
  // Legacy (migration)
  { label: `${ROLE_DISPLAY.ADMIN} (legacy)`, value: "ADMIN" },
  { label: `${ROLE_DISPLAY.TRAINER} (legacy)`, value: "TRAINER" },
  { label: `${ROLE_DISPLAY.DEVELOPER} (legacy)`, value: "DEVELOPER" },
  { label: `${ROLE_DISPLAY.STAFF} (legacy)`, value: "STAFF" },
];

/** Prefer department staff role when present (order = product priority). */
const DEPT_ROLE_PRIORITY: UserRole[] = [
  "WELTEL_ADMIN",
  "RBC_COORDINATOR",
  "CIIC_CONTENT_LEAD",
  "SFH_COORDINATOR",
  "WELTEL_DEVELOPER",
  "CIIC_EDITOR",
  "SFH_CEHO_MANAGER",
  "RBC_ANALYST",
  "SFH_ENROLLMENT",
  "WELTEL_SUPPORT",
  "CIIC_REVIEWER",
  "RBC_VIEWER",
];

export function resolveDepartmentStaffRole(
  roles: string | string[] | undefined | null,
): UserRole | null {
  const list = !roles ? [] : Array.isArray(roles) ? roles : [roles];
  for (const preferred of DEPT_ROLE_PRIORITY) {
    if (list.includes(preferred)) return preferred;
  }
  for (const r of list) {
    if ((DEPARTMENT_STAFF_ROLES as string[]).includes(r)) return r as UserRole;
  }
  return null;
}

/**
 * Department roles that keep the classic admin analytics dashboard at `/`
 * (not the per-role RoleWorkspace home).
 */
const LEGACY_ADMIN_DASHBOARD_ROLES: UserRole[] = ["RBC_COORDINATOR"];

/** True when home should be RoleWorkspaceHome instead of classic Dashboard. */
export function usesRoleWorkspaceHome(
  roles: string | string[] | undefined | null,
): boolean {
  const departmentRole = resolveDepartmentStaffRole(roles);
  if (!departmentRole) return false;
  return !LEGACY_ADMIN_DASHBOARD_ROLES.includes(departmentRole);
}
