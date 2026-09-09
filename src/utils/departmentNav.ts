import type { UserRole } from "@/types";
import {
  DEPARTMENT_STAFF_ROLES,
  resolveDepartmentStaffRole,
} from "@/utils/roles";

export type DeptNavItem = {
  id: string;
  label: string;
  path: string;
  kind: "new" | "existing";
  roles: UserRole[];
  group?: string;
};

/**
 * Least-privilege sidebar: each item lists ONLY roles that need it.
 * Do not use broad dept arrays (e.g. all WELTEL) for shared modules.
 *
 * WELTEL_SUPPORT → support desk + user/HC lookup + messaging (no staff admin,
 * no platform health, no recordings, no access grants).
 */
export const DEPARTMENT_NAV: DeptNavItem[] = [
  // ═══════════════════════════════════════════════════════════
  // RBC — people → places → training → schedule → communications
  // ═══════════════════════════════════════════════════════════
  // TEMP hidden — re-enable when ready
  // {
  //   id: "rbc-interventions",
  //   label: "Interventions",
  //   path: "/interventions",
  //   kind: "new",
  //   roles: ["RBC_COORDINATOR"],
  //   group: "RBC",
  // },
  {
    id: "rbc-students",
    label: "CHW & CEHO",
    path: "/students",
    kind: "existing",
    roles: ["RBC_COORDINATOR", "RBC_ANALYST"],
    group: "RBC",
  },
  {
    id: "rbc-hc",
    label: "Health Centers",
    path: "/healthCenters",
    kind: "existing",
    roles: ["RBC_COORDINATOR", "RBC_ANALYST"],
    group: "RBC",
  },
  {
    id: "rbc-courses",
    label: "Courses",
    path: "/courses",
    kind: "existing",
    roles: ["RBC_COORDINATOR", "RBC_ANALYST"],
    group: "RBC",
  },
  {
    id: "rbc-certs",
    label: "Certificates",
    path: "/certificates/issued",
    kind: "existing",
    roles: ["RBC_COORDINATOR", "RBC_ANALYST"],
    group: "RBC",
  },
  // TEMP hidden — re-enable when ready
  // {
  //   id: "rbc-briefings",
  //   label: "Briefings",
  //   path: "/briefings",
  //   kind: "new",
  //   roles: ["RBC_COORDINATOR"],
  //   group: "RBC",
  // },
  // {
  //   id: "rbc-analytics",
  //   label: "Analytics",
  //   path: "/analytics",
  //   kind: "existing",
  //   roles: ["RBC_COORDINATOR", "RBC_ANALYST", "RBC_VIEWER"],
  //   group: "RBC",
  // },
  // {
  //   id: "rbc-demographics",
  //   label: "Demographics",
  //   path: "/demographics/learners",
  //   kind: "existing",
  //   roles: ["RBC_ANALYST", "RBC_COORDINATOR"],
  //   group: "RBC",
  // },
  {
    id: "rbc-meetings",
    label: "Meetings",
    path: "/meetings",
    kind: "existing",
    roles: ["RBC_COORDINATOR"],
    group: "RBC",
  },
  {
    id: "rbc-calender",
    label: "Calender",
    path: "/calender",
    kind: "existing",
    roles: ["RBC_COORDINATOR"],
    group: "RBC",
  },
  {
    id: "rbc-announcement",
    label: "Announcement",
    path: "/announcement",
    kind: "existing",
    roles: ["RBC_COORDINATOR"],
    group: "RBC",
  },
  {
    id: "rbc-feedbacks",
    label: "Feedbacks",
    path: "/feedbacks",
    kind: "existing",
    roles: ["RBC_COORDINATOR", "RBC_ANALYST", "RBC_VIEWER"],
    group: "RBC",
  },

  // ═══════════════════════════════════════════════════════════
  // WELTEL — admin: staff → users → access → ops → platform
  // Messaging is injected for all dept staff in the layout shell
  // ═══════════════════════════════════════════════════════════
  {
    id: "weltel-staff",
    label: "Staff",
    path: "/staff",
    kind: "existing",
    roles: ["WELTEL_ADMIN"],
    group: "WELTEL",
  },
  {
    id: "weltel-users",
    label: "User lookup",
    path: "/user-lookup",
    kind: "existing",
    roles: ["WELTEL_SUPPORT", "WELTEL_ADMIN", "WELTEL_DEVELOPER"],
    group: "WELTEL",
  },
  {
    id: "weltel-access",
    label: "Access Grants",
    path: "/access-grants",
    kind: "new",
    roles: ["WELTEL_ADMIN"],
    group: "WELTEL",
  },
  {
    id: "weltel-support",
    label: "Support Desk",
    path: "/support-desk",
    kind: "new",
    roles: ["WELTEL_SUPPORT", "WELTEL_ADMIN"],
    group: "WELTEL",
  },
  {
    id: "weltel-kanban",
    label: "Kanban Board",
    path: "/kanban-board",
    kind: "existing",
    roles: ["WELTEL_SUPPORT", "WELTEL_DEVELOPER", "WELTEL_ADMIN"],
    group: "WELTEL",
  },
  {
    id: "weltel-health",
    label: "Platform Health",
    path: "/platform-health",
    kind: "new",
    roles: ["WELTEL_ADMIN", "WELTEL_DEVELOPER"],
    group: "WELTEL",
  },
  {
    id: "weltel-integrations",
    label: "Integrations",
    path: "/integrations",
    kind: "new",
    roles: ["WELTEL_DEVELOPER", "WELTEL_ADMIN"],
    group: "WELTEL",
  },

  // ═══════════════════════════════════════════════════════════
  // CIIC-HIN — staff (lead) → courses → assets → board → follow-up
  // ═══════════════════════════════════════════════════════════
  {
    id: "ciic-staff",
    label: "Staff",
    path: "/staff",
    kind: "existing",
    roles: ["CIIC_CONTENT_LEAD"],
    group: "CIIC",
  },
  {
    id: "ciic-courses",
    label: "Courses",
    path: "/courses",
    kind: "existing",
    roles: ["CIIC_CONTENT_LEAD", "CIIC_EDITOR", "CIIC_REVIEWER"],
    group: "CIIC",
  },
  {
    id: "ciic-tasks",
    label: "Tasks",
    path: "/tasks",
    kind: "new",
    roles: ["CIIC_CONTENT_LEAD"],
    group: "CIIC",
  },
  {
    id: "ciic-templates",
    label: "Templates",
    path: "/templates",
    kind: "new",
    roles: ["CIIC_CONTENT_LEAD", "CIIC_EDITOR"],
    group: "CIIC",
  },
  {
    id: "ciic-documents",
    label: "Documents",
    path: "/documents",
    kind: "new",
    roles: ["CIIC_CONTENT_LEAD", "CIIC_EDITOR", "CIIC_REVIEWER"],
    group: "CIIC",
  },
  {
    id: "ciic-glossary",
    label: "Glossary",
    path: "/glossary",
    kind: "new",
    roles: ["CIIC_CONTENT_LEAD", "CIIC_EDITOR", "CIIC_REVIEWER"],
    group: "CIIC",
  },
  {
    id: "ciic-resources",
    label: "Resources",
    path: "/resources",
    kind: "new",
    roles: ["CIIC_CONTENT_LEAD", "CIIC_EDITOR", "CIIC_REVIEWER"],
    group: "CIIC",
  },
  {
    id: "ciic-versions",
    label: "Version History",
    path: "/version-history",
    kind: "new",
    roles: ["CIIC_CONTENT_LEAD", "CIIC_REVIEWER"],
    group: "CIIC",
  },
  {
    id: "ciic-kanban",
    label: "Kanban Board",
    path: "/kanban-board",
    kind: "existing",
    roles: ["CIIC_CONTENT_LEAD", "CIIC_EDITOR", "CIIC_REVIEWER"],
    group: "CIIC",
  },
  {
    id: "ciic-certs",
    label: "Certificates",
    path: "/certificates",
    kind: "existing",
    roles: ["CIIC_CONTENT_LEAD", "CIIC_EDITOR", "CIIC_REVIEWER"],
    group: "CIIC",
  },
  {
    id: "ciic-feedbacks",
    label: "Feedbacks",
    path: "/feedbacks",
    kind: "existing",
    roles: ["CIIC_CONTENT_LEAD", "CIIC_REVIEWER", "CIIC_EDITOR"],
    group: "CIIC",
  },

  // ═══════════════════════════════════════════════════════════
  // SFH — staff (coordinator) → field plan → people → ops
  // ═══════════════════════════════════════════════════════════
  {
    id: "sfh-staff",
    label: "Staff",
    path: "/staff",
    kind: "existing",
    roles: ["SFH_COORDINATOR"],
    group: "SFH",
  },
  {
    id: "sfh-coverage",
    label: "Coverage Planner",
    path: "/coverage",
    kind: "new",
    roles: ["SFH_COORDINATOR", "SFH_CEHO_MANAGER"],
    group: "SFH",
  },
  {
    id: "sfh-ceho-net",
    label: "CEHO Network",
    path: "/ceho-network",
    kind: "new",
    roles: ["SFH_CEHO_MANAGER", "SFH_COORDINATOR"],
    group: "SFH",
  },
  {
    id: "sfh-campaigns",
    label: "Campaigns",
    path: "/campaigns",
    kind: "new",
    roles: ["SFH_COORDINATOR"],
    group: "SFH",
  },
  {
    id: "sfh-students",
    label: "CHW & CEHO",
    path: "/students",
    kind: "existing",
    roles: ["SFH_COORDINATOR", "SFH_CEHO_MANAGER", "SFH_ENROLLMENT"],
    group: "SFH",
  },
  {
    id: "sfh-hc",
    label: "Health Centers",
    path: "/healthCenters",
    kind: "existing",
    roles: ["SFH_COORDINATOR", "SFH_ENROLLMENT"],
    group: "SFH",
  },
  {
    id: "sfh-meetings",
    label: "Meetings",
    path: "/meetings",
    kind: "existing",
    roles: ["SFH_COORDINATOR", "SFH_CEHO_MANAGER"],
    group: "SFH",
  },
  {
    id: "sfh-calender",
    label: "Calender",
    path: "/calender",
    kind: "existing",
    roles: ["SFH_COORDINATOR", "SFH_CEHO_MANAGER"],
    group: "SFH",
  },
  {
    id: "sfh-certs",
    label: "Certificates",
    path: "/certificates/issued",
    kind: "existing",
    roles: ["SFH_ENROLLMENT", "SFH_COORDINATOR"],
    group: "SFH",
  },
];

/** Documented expected sidebar per role (for tests / review).
 *  Messaging is always injected by the layout shell for department staff. */
export const ROLE_SIDEBAR_EXPECTATIONS: Record<UserRole, string[]> = {
  WELTEL_SUPPORT: [
    "User lookup",
    "Support Desk",
    "Kanban Board",
    "Messaging",
  ],
  WELTEL_DEVELOPER: [
    "User lookup",
    "Kanban Board",
    "Platform Health",
    "Integrations",
    "Messaging",
  ],
  WELTEL_ADMIN: [
    "Staff",
    "User lookup",
    "Access Grants",
    "Support Desk",
    "Kanban Board",
    "Platform Health",
    "Integrations",
    "Messaging",
  ],
  RBC_VIEWER: ["Feedbacks", "Messaging"],
  RBC_ANALYST: [
    "CHW & CEHO",
    "Health Centers",
    "Courses",
    "Certificates",
    // "Analytics",
    // "Demographics",
    "Feedbacks",
    "Messaging",
  ],
  RBC_COORDINATOR: [
    // "Interventions",
    "CHW & CEHO",
    "Health Centers",
    "Courses",
    "Certificates",
    // "Briefings",
    // "Analytics",
    // "Demographics",
    "Meetings",
    "Calender",
    "Announcement",
    "Feedbacks",
    "Messaging",
  ],
  CIIC_REVIEWER: [
    "Courses",
    "Documents",
    "Glossary",
    "Resources",
    "Version History",
    "Kanban Board",
    "Certificates",
    "Feedbacks",
    "Messaging",
  ],
  CIIC_EDITOR: [
    "Courses",
    "Templates",
    "Documents",
    "Glossary",
    "Resources",
    "Kanban Board",
    "Certificates",
    "Feedbacks",
    "Messaging",
  ],
  CIIC_CONTENT_LEAD: [
    "Staff",
    "Courses",
    "Tasks",
    "Templates",
    "Documents",
    "Glossary",
    "Resources",
    "Version History",
    "Kanban Board",
    "Certificates",
    "Feedbacks",
    "Messaging",
  ],
  SFH_ENROLLMENT: [
    "CHW & CEHO",
    "Health Centers",
    "Certificates",
    "Messaging",
  ],
  SFH_CEHO_MANAGER: [
    "Coverage Planner",
    "CEHO Network",
    "CHW & CEHO",
    "Meetings",
    "Calender",
    "Messaging",
  ],
  SFH_COORDINATOR: [
    "Staff",
    "Coverage Planner",
    "CEHO Network",
    "Campaigns",
    "CHW & CEHO",
    "Health Centers",
    "Meetings",
    "Calender",
    "Certificates",
    "Messaging",
  ],
  // Field / legacy — not used by department sidebar builder
  ADMIN: [],
  TRAINER: [],
  TRAINEE: [],
  TESTER: [],
  DEVELOPER: [],
  CEHO: [],
  STAFF: [],
};

export function isDepartmentStaffUser(
  roles: string | string[] | undefined | null,
): boolean {
  return !!resolveDepartmentStaffRole(roles);
}

/** Exact role match only — no inheritance expansion for sidebar. */
export function navItemsForRoles(userRoles: string[]): DeptNavItem[] {
  const set = new Set(userRoles);
  const primary = resolveDepartmentStaffRole(userRoles);
  // Prefer primary department staff role so legacy ADMIN alias does not widen menu
  const rolesToMatch = primary ? [primary] : [...set];

  return DEPARTMENT_NAV.filter((item) =>
    item.roles.some((r) => rolesToMatch.includes(r)),
  );
}

export const NEW_FEATURE_PATHS = DEPARTMENT_NAV.filter((n) => n.kind === "new").map(
  (n) => n.path,
);

export const ALL_DEPT_STAFF_FOR_NEW_FEATURES: UserRole[] = [
  ...DEPARTMENT_STAFF_ROLES,
];
