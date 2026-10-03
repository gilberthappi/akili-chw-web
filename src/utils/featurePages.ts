import type { RoleWorkspaceConfig } from "@/utils/roleWorkspaces";

export type FeaturePageConfig = {
  path: string;
  title: string;
  subtitle: string;
  accent: string;
  demo: boolean;
  kpis: RoleWorkspaceConfig["kpis"];
  panels: RoleWorkspaceConfig["panels"];
  table: RoleWorkspaceConfig["table"];
  actions?: { label: string; href: string; primary?: boolean }[];
};

/** Dummy content for new department feature pages. */
export const FEATURE_PAGES: Record<string, FeaturePageConfig> = {
  "/interventions": {
    path: "/interventions",
    title: "Intervention board",
    subtitle: "Assign risks to SFH / CIIC / WelTel with SLA timers",
    accent: "bg-violet-50 text-violet-700",
    demo: true,
    kpis: [
      { title: "Open", value: "14" },
      { title: "In progress", value: "8" },
      { title: "Overdue", value: "3", trend: { value: 1, direction: "up" } },
      { title: "Closed (7d)", value: "11" },
    ],
    panels: [
      { title: "Escalation", body: "3 items past 5-day SLA — notify department leads.", tone: "warn" },
      { title: "Audit", body: "All assignments logged for RBC export (demo).", tone: "info" },
    ],
    table: {
      title: "Open interventions",
      columns: ["Risk", "District", "Owner", "Status", "Due"],
      rows: [
        ["Low Mid-Test pass", "Nyagatare", "SFH", "In progress", "Sep 12"],
        ["HC offline sync", "Rubavu", "WelTel", "Open", "Sep 10"],
        ["Content RW glossary", "National", "CIIC", "Review", "Sep 18"],
        ["Ghost CHW signal", "Kayonza", "SFH", "Investigating", "Sep 14"],
      ],
    },
    actions: [
      { label: "Analytics", href: "/analytics", primary: true },
      { label: "CHW & CEHO", href: "/chw" },
    ],
  },

  "/briefings": {
    path: "/briefings",
    title: "Stakeholder briefings",
    subtitle: "Weekly pack generator (EN/RW) — demo placeholders",
    accent: "bg-purple-50 text-purple-800",
    demo: true,
    kpis: [
      { title: "Packs this month", value: "4" },
      { title: "Recipients", value: "28" },
      { title: "Avg open rate", value: "71%" },
      { title: "Pending draft", value: "1" },
    ],
    panels: [
      { title: "Friday pack", body: "National SLA + Western breach + 3 interventions — draft ready.", tone: "info" },
      { title: "Languages", body: "EN complete · RW summary auto-draft (demo).", tone: "ok" },
    ],
    table: {
      title: "Recent packs",
      columns: ["Week", "Focus", "Audience", "Status", "Sent"],
      rows: [
        ["W36", "Western SLA", "MoH + partners", "Draft", "—"],
        ["W35", "Campaign pace", "SFH leads", "Sent", "Sep 1"],
        ["W34", "Content lag", "CIIC + RBC", "Sent", "Aug 25"],
        ["W33", "Sync health", "WelTel", "Sent", "Aug 18"],
      ],
    },
  },

  "/platform-health": {
    path: "/platform-health",
    title: "Platform health / SLOs",
    subtitle: "API, sync, push, Stream — kill-switches and module status",
    accent: "bg-blue-50 text-blue-700",
    demo: true,
    kpis: [
      { title: "API uptime 7d", value: "99.94%" },
      { title: "Push p95", value: "1.8s" },
      { title: "Sync queue", value: "42" },
      { title: "Error rate 1h", value: "0.12%", trend: { value: 40, direction: "down" } },
    ],
    panels: [
      { title: "Kira bridge", body: "Degraded — investigating webhook failures (4/24h).", tone: "warn" },
      { title: "Kill-switches", body: "All modules Live except Kira bridge (demo).", tone: "info" },
    ],
    table: {
      title: "Modules",
      columns: ["Module", "Status", "Owner", "Last change"],
      rows: [
        ["Course builder", "Live", "CIIC", "Sep 1"],
        ["Mobile sync", "Live", "WelTel", "Sep 6"],
        ["Kira bridge", "Degraded", "WelTel", "Today"],
        ["Announcements", "Live", "RBC", "Aug 28"],
      ],
    },
    actions: [
      { label: "Integrations", href: "/integrations", primary: true },
      { label: "Support desk", href: "/support-desk" },
    ],
  },

  "/support-desk": {
    path: "/support-desk",
    title: "Support desk",
    subtitle: "Tickets, playbooks, account recovery timelines",
    accent: "bg-cyan-50 text-cyan-700",
    demo: true,
    kpis: [
      { title: "Open tickets", value: "17", trend: { value: 3, direction: "down" } },
      { title: "First reply", value: "41m", trend: { value: 12, direction: "down" } },
      { title: "Merges (7d)", value: "5" },
      { title: "CSAT", value: "4.6", trend: { value: 2, direction: "up" } },
    ],
    panels: [
      { title: "Playbook", body: "Offline sync stuck — 6 steps · avg 18m resolve.", tone: "ok" },
      { title: "Impersonation", body: "Watermarked sessions expire in 30m (demo).", tone: "info" },
    ],
    table: {
      title: "Queue",
      columns: ["Ticket", "User", "Issue", "Priority", "Age"],
      rows: [
        ["S-2041", "Amina M.", "Login loop", "High", "2h"],
        ["S-2038", "CEHO Gasabo", "Invite failed", "Med", "5h"],
        ["S-2033", "QA Tester", "Final test stuck", "High", "1d"],
        ["S-2029", "HC Remera", "Photo upload", "Low", "2d"],
      ],
    },
    actions: [
      { label: "Find learners", href: "/chw", primary: true },
      { label: "Messaging", href: "/messaging" },
    ],
  },

  "/integrations": {
    path: "/integrations",
    title: "Integrations & tracers",
    subtitle: "Webhooks, fingerprints, WelTel / cEMR / Kira contracts",
    accent: "bg-sky-50 text-sky-700",
    demo: true,
    kpis: [
      { title: "Webhook fails 24h", value: "4", trend: { value: 1, direction: "up" } },
      { title: "Open fingerprints", value: "9" },
      { title: "Preview envs", value: "3" },
      { title: "Contracts green", value: "2/3" },
    ],
    panels: [
      { title: "Tracer", body: "user → Mid-Test → 500 on /attempts (#8841).", tone: "warn" },
      { title: "Contracts", body: "Mobile OK · Web auth OK · cEMR stub yellow.", tone: "info" },
    ],
    table: {
      title: "Error fingerprints",
      columns: ["ID", "Route", "Count", "Owner", "Status"],
      rows: [
        ["#8841", "POST /attempts", "23", "You", "Investigating"],
        ["#8790", "GET /sync", "8", "Unassigned", "New"],
        ["#8712", "Stream token", "2", "Support", "Watching"],
        ["#8601", "JWT refresh", "1", "You", "Resolved"],
      ],
    },
  },

  "/access-grants": {
    path: "/access-grants",
    title: "Access marketplace",
    subtitle: "Time-boxed department role grants (demo)",
    accent: "bg-indigo-50 text-indigo-700",
    demo: true,
    kpis: [
      { title: "Active grants", value: "6" },
      { title: "Expiring 7d", value: "2" },
      { title: "Staff seats", value: "28" },
      { title: "Departments", value: "4" },
    ],
    panels: [
      { title: "Expiring", body: "CIIC reviewer + SFH enrollment grants end this week.", tone: "warn" },
      { title: "Policy", body: "Break-glass requires reason + auto-expire ≤ 24h.", tone: "info" },
    ],
    table: {
      title: "Grants",
      columns: ["User", "Role", "Dept", "Expires", "Status"],
      rows: [
        ["alice@…", "CIIC_REVIEWER", "CIIC", "Sep 12", "Active"],
        ["bosco@…", "SFH_ENROLLMENT", "SFH", "Sep 10", "Active"],
        ["diane@…", "RBC_VIEWER", "RBC", "Sep 30", "Active"],
        ["eric@…", "WELTEL_SUPPORT", "WELTEL", "Aug 1", "Expired"],
      ],
    },
    actions: [{ label: "Manage staff", href: "/staff", primary: true }],
  },

  "/documents": {
    path: "/documents",
    title: "Documents library",
    subtitle: "Guidelines, SOPs, briefs, and source packs for course authors",
    accent: "bg-emerald-50 text-emerald-800",
    demo: true,
    kpis: [
      { title: "Documents", value: "86" },
      { title: "Updated (7d)", value: "9", trend: { value: 3, direction: "up" } },
      { title: "Pending review", value: "4" },
      { title: "Linked to courses", value: "61%" },
    ],
    panels: [
      { title: "MoH pack", body: "IMCI national guideline PDF refreshed Sep 5 — attach to IMCI refresh.", tone: "ok" },
      { title: "Stale", body: "3 SOPs older than 12 months still linked in Maternal v3.", tone: "warn" },
    ],
    table: {
      title: "Recent documents (demo)",
      columns: ["Name", "Type", "Lang", "Updated", "Used by"],
      rows: [
        ["IMCI guideline 2024", "PDF", "EN/RW", "Sep 5", "IMCI refresh"],
        ["Maternal accuracy SOP", "DOCX", "EN", "Sep 2", "Maternal v3"],
        ["Teach-back script pack", "PDF", "RW", "Aug 28", "Neonatal care"],
        ["Clinical terms sheet", "XLSX", "EN/RW", "Sep 6", "Glossary"],
      ],
    },
    actions: [
      { label: "Dictionary", href: "/dictionary", primary: true },
      { label: "Resources", href: "/resources" },
      { label: "Courses", href: "/courses" },
    ],
  },

  "/glossary": {
    path: "/glossary",
    title: "Clinical glossary",
    subtitle: "Approved clinical terms for course authors (RW / EN)",
    accent: "bg-emerald-50 text-emerald-900",
    demo: true,
    kpis: [
      { title: "Terms", value: "1,240" },
      { title: "Pending approve", value: "12" },
      { title: "Used in courses", value: "68%" },
      { title: "Updated (7d)", value: "9" },
    ],
    panels: [
      { title: "New", body: "12 clinical terms awaiting Content Lead approve.", tone: "info" },
      { title: "Conflict", body: "Danger signs has 2 RW variants — pick one before Maternal v3.", tone: "warn" },
    ],
    table: {
      title: "Recent terms (demo)",
      columns: ["Term (EN)", "Term (RW)", "Domain", "Status", "Used by"],
      rows: [
        ["Danger signs", "Ibimenyetso by'akaga", "IMCI", "Approved", "IMCI refresh"],
        ["Teach-back", "Gusubiza inyigisho", "Pedagogy", "Pending", "Neonatal care"],
        ["Referral", "Kohereza", "Care pathway", "Approved", "11 courses"],
        ["Postpartum", "Nyuma y'ubustani", "Maternal", "Draft", "Maternal v3"],
      ],
    },
    actions: [
      { label: "Documents", href: "/documents", primary: true },
      { label: "Courses", href: "/courses" },
    ],
  },

  "/resources": {
    path: "/resources",
    title: "Media & resources",
    subtitle: "Images, icons, illustrations, and reusable visual assets",
    accent: "bg-teal-50 text-teal-800",
    demo: true,
    kpis: [
      { title: "Assets", value: "412" },
      { title: "Images", value: "268" },
      { title: "Icons / vectors", value: "97" },
      { title: "Missing alt text", value: "14", trend: { value: 2, direction: "down" } },
    ],
    panels: [
      { title: "Reuse", body: "CHW silhouette set used in 11 courses — prefer library over new upload.", tone: "info" },
      { title: "A11y", body: "14 images still need RW alt text before National publish.", tone: "warn" },
    ],
    table: {
      title: "Resource library (demo)",
      columns: ["Asset", "Kind", "Tags", "Linked", "Status"],
      rows: [
        ["chw-home-visit.svg", "Icon", "field, chw", "8 courses", "Ready"],
        ["maternal-care-hero.png", "Image", "maternal", "Maternal v3", "Needs alt"],
        ["imci-danger-signs.png", "Image", "imci, clinical", "IMCI refresh", "Ready"],
        ["kira-badge-set.zip", "Icons", "brand", "—", "Draft"],
      ],
    },
    actions: [
      { label: "Documents", href: "/documents", primary: true },
      { label: "Templates", href: "/templates" },
      { label: "Kanban Board", href: "/kanban-board" },
    ],
  },

  "/tasks": {
    path: "/tasks",
    title: "Tasks",
    subtitle: "Work items for courses and modules — owner, due date, status",
    accent: "bg-green-50 text-green-800",
    demo: true,
    kpis: [
      { title: "Open tasks", value: "18" },
      { title: "Due this week", value: "7", trend: { value: 2, direction: "up" } },
      { title: "Overdue", value: "3" },
      { title: "Unassigned", value: "4" },
    ],
    panels: [
      { title: "Focus", body: "Maternal v3 module 4 still unassigned — due Sep 14.", tone: "warn" },
      { title: "Load", body: "Samuel has 5 open tasks · Grace has 2.", tone: "info" },
    ],
    table: {
      title: "Tasks (demo)",
      columns: ["Task", "Owner", "Role", "Due", "Status"],
      rows: [
        ["Maternal v3 · M4 draft", "—", "Editor", "Sep 14", "Unassigned"],
        ["Malaria RW · Quiz pack", "Grace", "Editor", "Sep 11", "On track"],
        ["IMCI · Video captions", "Samuel", "Editor", "Sep 9", "Overdue"],
        ["Neonatal · Review notes", "Immaculee", "Reviewer", "Sep 12", "In progress"],
      ],
    },
    actions: [
      { label: "Courses", href: "/courses", primary: true },
      { label: "Kanban Board", href: "/kanban-board" },
      { label: "Templates", href: "/templates" },
    ],
  },

  "/templates": {
    path: "/templates",
    title: "Content templates",
    subtitle: "Reusable lesson, quiz, and scenario shells for editors",
    accent: "bg-teal-50 text-teal-900",
    demo: true,
    kpis: [
      { title: "Templates", value: "22" },
      { title: "Lesson shells", value: "9" },
      { title: "Quiz shells", value: "7" },
      { title: "Scenarios", value: "6" },
    ],
    panels: [
      { title: "Popular", body: "Teach-back lesson used 14× this quarter.", tone: "ok" },
      { title: "New", body: "Branching household visit scenario v2 ready for Lead approve.", tone: "info" },
    ],
    table: {
      title: "Template library (demo)",
      columns: ["Name", "Type", "Lang", "Uses", "Updated"],
      rows: [
        ["Teach-back lesson", "Lesson", "RW/EN", "14", "Aug 20"],
        ["MCQ clinical pack", "Quiz", "EN", "11", "Sep 1"],
        ["Household visit branch", "Scenario", "RW", "6", "Sep 6"],
        ["Danger-sign checklist", "Lesson", "RW/EN", "9", "Jul 12"],
      ],
    },
    actions: [
      { label: "Courses", href: "/courses", primary: true },
      { label: "Tasks", href: "/tasks" },
      { label: "Resources", href: "/resources" },
    ],
  },

  "/version-history": {
    path: "/version-history",
    title: "Version history",
    subtitle: "Course versions, what changed, and rollback points",
    accent: "bg-lime-50 text-lime-900",
    demo: true,
    kpis: [
      { title: "Versions tracked", value: "64" },
      { title: "Published", value: "24" },
      { title: "Rollbacks (90d)", value: "2" },
      { title: "Pending release", value: "3" },
    ],
    panels: [
      { title: "Latest", body: "IMCI refresh v3.2 — captions + quiz fix · signed by Lead Sep 4.", tone: "ok" },
      { title: "Caution", body: "Maternal v3 draft differs from v2.8 by 41 slides — review before pilot.", tone: "warn" },
    ],
    table: {
      title: "Recent versions (demo)",
      columns: ["Course", "Version", "Change", "By", "Action"],
      rows: [
        ["IMCI refresh", "v3.2", "Captions + quiz", "Lead", "Live"],
        ["Maternal v3", "v3.0-draft", "Accuracy edits", "Samuel", "Compare"],
        ["Malaria RW", "v2.1", "FR strings", "Grace", "Rollback avail"],
        ["Neonatal care", "v1.4", "National publish", "Lead", "Live"],
      ],
    },
    actions: [
      { label: "Kanban Board", href: "/kanban-board", primary: true },
      { label: "Courses", href: "/courses" },
      { label: "Version History", href: "/version-history" },
    ],
  },

  "/coverage": {
    path: "/coverage",
    title: "Coverage planner",
    subtitle: "CHWs per CEHO vs catchment need (target 10–20)",
    accent: "bg-amber-50 text-amber-800",
    demo: true,
    kpis: [
      { title: "Avg CHW/CEHO", value: "14.2" },
      { title: "Overloaded", value: "6", trend: { value: 1, direction: "up" } },
      { title: "No CEHO", value: "4" },
      { title: "At-risk teams", value: "8" },
    ],
    panels: [
      { title: "Suggest", body: "Split Kimisagara (22 CHWs) or move 4 → Nyamirambo.", tone: "info" },
      { title: "Ghost signals", body: "4 CHWs need verification this week.", tone: "warn" },
    ],
    table: {
      title: "Health centers",
      columns: ["Health center", "CEHOs", "CHWs", "Gap", "Action"],
      rows: [
        ["Remera HC", "2", "31", "+1 CEHO", "Suggest split"],
        ["Nyamirambo", "1", "9", "OK", "Monitor"],
        ["Kimisagara", "1", "22", "Over", "Rebalance"],
        ["Gatenga", "0", "11", "No CEHO", "Promote"],
      ],
    },
    actions: [
      { label: "CHW & CEHO", href: "/chw", primary: true },
      { label: "CEHO network", href: "/ceho-network" },
    ],
  },

  "/ceho-network": {
    path: "/ceho-network",
    title: "CEHO network",
    subtitle: "Group health, capacity balance, succession",
    accent: "bg-orange-50 text-orange-800",
    demo: true,
    kpis: [
      { title: "Active groups", value: "48", trend: { value: 2, direction: "up" } },
      { title: "Avg size", value: "15" },
      { title: "Overloaded", value: "6" },
      { title: "Deputy ready", value: "11" },
    ],
    panels: [
      { title: "Rebalance", body: "Move 4 CHWs Kimisagara → Nyamirambo (demo).", tone: "info" },
      { title: "Health index", body: "Learning 72 · Attendance 81 · Engagement 64.", tone: "ok" },
    ],
    table: {
      title: "Groups needing attention",
      columns: ["CEHO", "HC", "Members", "Health", "Issue"],
      rows: [
        ["Grace U.", "Kimisagara", "22", "58", "Overloaded"],
        ["Bosco N.", "Remera", "18", "61", "Low Mid-Test"],
        ["Jeanne K.", "Gatenga", "12", "79", "OK"],
        ["Patrick M.", "Niboye", "8", "55", "Underfilled"],
      ],
    },
    actions: [
      { label: "CHW & CEHO", href: "/chw", primary: true },
      { label: "Meetings", href: "/meetings" },
    ],
  },

  "/campaigns": {
    path: "/campaigns",
    title: "Field campaigns",
    subtitle: "Push one course regionally with deadlines",
    accent: "bg-amber-50 text-amber-900",
    demo: true,
    kpis: [
      { title: "Active campaigns", value: "2" },
      { title: "Reach", value: "87%", trend: { value: 5, direction: "up" } },
      { title: "Districts behind", value: "13" },
      { title: "Deadline", value: "Sep 30" },
    ],
    panels: [
      { title: "IMCI national", body: "13 districts behind pace — nudge CEHOs in Western.", tone: "warn" },
      { title: "Next", body: "Malaria RW regional pilot starts Oct 5.", tone: "info" },
    ],
    table: {
      title: "Campaign progress",
      columns: ["Campaign", "Course", "Target", "Done", "Status"],
      rows: [
        ["IMCI national", "IMCI refresh", "12.4k", "10.8k", "Behind"],
        ["Gasabo push", "Maternal v2", "1.2k", "1.1k", "On track"],
        ["Pilot B", "Malaria RW", "400", "186", "Pilot"],
        ["Cert drive", "Neonatal", "800", "640", "Watch"],
      ],
    },
    actions: [{ label: "Coverage", href: "/coverage", primary: true }],
  },
};

export function getFeaturePage(path: string): FeaturePageConfig | null {
  return FEATURE_PAGES[path] ?? null;
}
