import type { UserRole } from "@/types";

export type WorkspaceKpi = {
  title: string;
  value: string;
  description?: string;
  trend?: { value: number; direction: "up" | "down" | "stable" };
};

export type WorkspaceTable = {
  title: string;
  columns: string[];
  rows: string[][];
};

export type WorkspaceAction = {
  label: string;
  href: string;
  primary?: boolean;
};

export type RoleWorkspaceConfig = {
  role: UserRole;
  department: "RBC" | "WELTEL" | "CIIC_HIN" | "SFH";
  title: string;
  subtitle: string;
  accent: string;
  kpis: WorkspaceKpi[];
  panels: { title: string; body: string; tone?: "info" | "warn" | "ok" }[];
  table: WorkspaceTable;
  actions: WorkspaceAction[];
  roadmap: string[];
};

/** Dummy workspaces so each department role has a distinct home surface. */
export const ROLE_WORKSPACES: Record<string, RoleWorkspaceConfig> = {
  RBC_COORDINATOR: {
    role: "RBC_COORDINATOR",
    department: "RBC",
    title: "National program coordination",
    subtitle: "Interventions, learners, analytics, partner escalations",
    accent: "bg-purple-50 text-purple-700",
    kpis: [
      { title: "Districts on track", value: "22/30", trend: { value: 8, direction: "up" }, description: "vs last month" },
      { title: "Open interventions", value: "14", trend: { value: 3, direction: "down" }, description: "assigned to SFH/CIIC" },
      { title: "National completion", value: "61%", trend: { value: 4, direction: "up" } },
      { title: "Escalations overdue", value: "3", trend: { value: 1, direction: "up" }, description: "SLA > 5 days" },
    ],
    panels: [
      { title: "This week focus", body: "Gasabo & Nyagatare lagging Mid-Test pass rate. Draft stakeholder pack for Friday briefing.", tone: "info" },
      { title: "Partner OKRs", body: "SFH coverage 94% · CIIC publish lag 6 days · WelTel sync health 99.2%", tone: "ok" },
    ],
    table: {
      title: "Intervention board (demo)",
      columns: ["Risk", "District", "Owner", "Status", "Due"],
      rows: [
        ["Low Mid-Test pass", "Nyagatare", "SFH", "In progress", "Sep 12"],
        ["HC offline sync", "Rubavu", "WelTel", "Open", "Sep 10"],
        ["Content RW glossary", "National", "CIIC", "Review", "Sep 18"],
        ["Ghost CHW signal", "Kayonza", "SFH", "Investigating", "Sep 14"],
      ],
    },
    actions: [
      // TEMP hidden: Interventions / Analytics
      // { label: "Interventions", href: "/interventions", primary: true },
      { label: "CHW & CEHO", href: "/students", primary: true },
      // { label: "Analytics", href: "/analytics" },
    ],
    roadmap: [
      "Stakeholder pack generator (PDF)",
      "Policy impact simulator",
      "Public accountability wall",
    ],
  },

  RBC_ANALYST: {
    role: "RBC_ANALYST",
    department: "RBC",
    title: "Analytics workspace",
    subtitle: "Learners, equity gaps, completion — demo datasets",
    accent: "bg-violet-50 text-violet-700",
    kpis: [
      { title: "CHWs tracked", value: "12.4k", description: "active this quarter" },
      { title: "Equity gap (F/M)", value: "4.2pp", trend: { value: 1, direction: "down" } },
      { title: "Median time-to-pass", value: "46d", trend: { value: 5, direction: "down" } },
      { title: "Anomalies flagged", value: "7" },
    ],
    panels: [
      { title: "Anomaly watch", body: "Sudden −18% Mid-Test attempts in Rusizi sector this week.", tone: "warn" },
      { title: "Learner focus", body: "Use CHW & CEHO list + Demographics for equity cuts.", tone: "info" },
    ],
    table: {
      title: "Focus districts (demo)",
      columns: ["District", "CHWs", "Pass rate", "Gap", "Updated"],
      rows: [
        ["Gasabo", "412", "58%", "F −3pp", "Today"],
        ["Kicukiro", "186", "71%", "OK", "Yesterday"],
        ["Rusizi", "94", "49%", "Attempts ↓", "Sep 5"],
        ["Kayonza", "63", "44%", "Re-sit", "Sep 6"],
      ],
    },
    actions: [
      { label: "CHW & CEHO", href: "/students", primary: true },
      // TEMP hidden: Analytics
      // { label: "Analytics", href: "/analytics" },
      { label: "Certificates issued", href: "/certificates/issued" },
    ],
    roadmap: ["Survival curves", "Scheduled RBC warehouse export", "Counterfactual chapter model"],
  },

  RBC_VIEWER: {
    role: "RBC_VIEWER",
    department: "RBC",
    title: "Executive glance",
    subtitle: "Read-only national picture — 3 KPIs and narrative insights",
    accent: "bg-fuchsia-50 text-fuchsia-700",
    kpis: [
      { title: "CHWs active (30d)", value: "12.4k", trend: { value: 2, direction: "up" } },
      { title: "Certificates (MTD)", value: "841", trend: { value: 6, direction: "up" } },
      { title: "Meetings held", value: "326", trend: { value: 0, direction: "stable" } },
      { title: "Risk districts", value: "5", description: "below SLA" },
    ],
    panels: [
      { title: "Auto insight", body: "Completion improved in Eastern Province after SFH campaign; Western still 9pp below target.", tone: "info" },
      { title: "Bookmarks", body: "Saved views: National SLA · Gender equity · Final-test funnel.", tone: "ok" },
    ],
    table: {
      title: "Province snapshot (demo)",
      columns: ["Province", "Completion", "Trend", "Note"],
      rows: [
        ["Kigali", "74%", "↑", "On track"],
        ["Eastern", "63%", "↑", "Improving"],
        ["Southern", "59%", "→", "Watch"],
        ["Western", "52%", "↓", "Below SLA"],
        ["Northern", "61%", "↑", "Stable"],
      ],
    },
    actions: [
      // TEMP hidden: Analytics
      // { label: "Analytics", href: "/analytics", primary: true },
      { label: "Feedbacks", href: "/feedbacks", primary: true },
    ],
    roadmap: ["Shareable view links", "Comment-on-chart", "Mobile 3-KPI glance"],
  },

  WELTEL_ADMIN: {
    role: "WELTEL_ADMIN",
    department: "WELTEL",
    title: "Platform admin console",
    subtitle: "Staff access, module health, break-glass support",
    accent: "bg-blue-50 text-blue-700",
    kpis: [
      { title: "API uptime (7d)", value: "99.94%", trend: { value: 0, direction: "stable" } },
      { title: "Active staff seats", value: "28", description: "across 4 depts" },
      { title: "Open support tickets", value: "11", trend: { value: 2, direction: "down" } },
      { title: "Feature flags on", value: "6", description: "prod" },
    ],
    panels: [
      { title: "SLO board", body: "Push delivery p95 1.8s · Sync queue depth 42 · Stream chat OK.", tone: "ok" },
      { title: "Access marketplace", body: "2 time-boxed grants expire this week (CIIC reviewer, SFH enrollment).", tone: "info" },
    ],
    table: {
      title: "Module kill-switch board (demo)",
      columns: ["Module", "Status", "Owner", "Last change"],
      rows: [
        ["Course builder", "Live", "CIIC", "Sep 1"],
        ["Mobile sync", "Live", "WelTel", "Sep 6"],
        ["Kira bridge", "Degraded", "WelTel", "Today"],
        ["Announcements", "Live", "RBC", "Aug 28"],
      ],
    },
    actions: [
      { label: "Staff", href: "/staff", primary: true },
      { label: "Courses", href: "/courses" },
      { label: "User lookup", href: "/user-lookup" },
      { label: "Access Grants", href: "/access-grants" },
      { label: "Platform health", href: "/platform-health" },
    ],
    roadmap: ["Dept access marketplace", "Compliance vault", "Partner onboarding wizard"],
  },

  WELTEL_DEVELOPER: {
    role: "WELTEL_DEVELOPER",
    department: "WELTEL",
    title: "Developer / integrations desk",
    subtitle: "Tracers, webhooks, flags, preview environments",
    accent: "bg-sky-50 text-sky-700",
    kpis: [
      { title: "Error rate (1h)", value: "0.12%", trend: { value: 40, direction: "down" } },
      { title: "Webhook fails (24h)", value: "4", trend: { value: 1, direction: "up" } },
      { title: "Open fingerprints", value: "9", description: "unassigned" },
      { title: "Preview envs", value: "3", description: "linked to TESTER packs" },
    ],
    panels: [
      { title: "Live tracer", body: "Last path: user → course Mid-Test → 500 on /attempts (fingerprint #8841).", tone: "warn" },
      { title: "Contracts", body: "Mobile API contract green · Web auth kit green · cEMR stub yellow.", tone: "info" },
    ],
    table: {
      title: "Error fingerprints (demo)",
      columns: ["ID", "Route", "Count", "Owner", "Status"],
      rows: [
        ["#8841", "POST /attempts", "23", "You", "Investigating"],
        ["#8790", "GET /sync", "8", "Unassigned", "New"],
        ["#8712", "Stream token", "2", "Support", "Watching"],
        ["#8601", "JWT refresh", "1", "You", "Resolved"],
      ],
    },
    actions: [
      { label: "User lookup", href: "/user-lookup", primary: true },
      { label: "Kanban Board", href: "/kanban-board" },
      { label: "Integrations", href: "/integrations" },
      { label: "Platform health", href: "/platform-health" },
    ],
    roadmap: ["Webhook playground", "Chaos drills UI", "PR → TESTER pack link"],
  },

  WELTEL_SUPPORT: {
    role: "WELTEL_SUPPORT",
    department: "WELTEL",
    title: "Support desk",
    subtitle: "User timelines, recovery playbooks, account hygiene",
    accent: "bg-cyan-50 text-cyan-700",
    kpis: [
      { title: "Open tickets", value: "17", trend: { value: 3, direction: "down" } },
      { title: "Avg first reply", value: "41m", trend: { value: 12, direction: "down" } },
      { title: "Duplicate merges", value: "5", description: "this week" },
      { title: "CSAT (7d)", value: "4.6", trend: { value: 2, direction: "up" } },
    ],
    panels: [
      { title: "Playbook ready", body: "“Cannot sync offline lessons” — 6 steps · avg resolve 18m.", tone: "ok" },
      { title: "Impersonation", body: "Watermarked sessions auto-expire after 30 minutes (demo).", tone: "info" },
    ],
    table: {
      title: "Support queue (demo)",
      columns: ["Ticket", "User", "Issue", "Priority", "Age"],
      rows: [
        ["S-2041", "Amina M.", "Login loop", "High", "2h"],
        ["S-2038", "CEHO Gasabo", "Invite failed", "Med", "5h"],
        ["S-2033", "QA Tester", "Final test stuck", "High", "1d"],
        ["S-2029", "HC Remera", "Photo upload", "Low", "2d"],
      ],
    },
    actions: [
      { label: "User lookup", href: "/user-lookup", primary: true },
      { label: "Support Desk", href: "/support-desk" },
      { label: "Kanban Board", href: "/kanban-board" },
      { label: "Messaging", href: "/messaging" },
    ],
    roadmap: ["Support timeline", "Sync conflict resolver", "KB linked empty states"],
  },

  CIIC_CONTENT_LEAD: {
    role: "CIIC_CONTENT_LEAD",
    department: "CIIC_HIN",
    title: "Content operations",
    subtitle: "Draft → Review → Pilot → National publish pipeline",
    accent: "bg-emerald-50 text-emerald-700",
    kpis: [
      { title: "Courses live", value: "24", trend: { value: 1, direction: "up" } },
      { title: "In review", value: "6", description: "awaiting reviewer" },
      { title: "Pilot cohorts", value: "3", description: "active" },
      { title: "Publish lag", value: "6d", trend: { value: 2, direction: "down" } },
    ],
    panels: [
      { title: "Kanban focus", body: "Maternal health v3 blocked on clinical accuracy checklist (2 items).", tone: "warn" },
      { title: "Localization", body: "RW glossary 92% · EN complete · FR 40%.", tone: "info" },
    ],
    table: {
      title: "Content ops board (demo)",
      columns: ["Course", "Stage", "Owner", "Quality gate", "Next"],
      rows: [
        ["IMCI refresh", "Pilot", "Grace", "Pass", "National"],
        ["Maternal v3", "Review", "Samuel", "2 open", "Lead decide"],
        ["Malaria RW", "Draft", "You", "N/A", "Submit"],
        ["Neonatal care", "National", "Immaculee", "Pass", "Monitor"],
      ],
    },
    actions: [
      { label: "Staff", href: "/staff", primary: true },
      { label: "Kanban Board", href: "/kanban-board" },
      { label: "Tasks", href: "/tasks" },
      { label: "Version History", href: "/version-history" },
    ],
    roadmap: ["Competency map editor", "A/B lesson variants", "AI draft from MoH guidelines"],
  },

  CIIC_EDITOR: {
    role: "CIIC_EDITOR",
    department: "CIIC_HIN",
    title: "Editor workspace",
    subtitle: "Assigned drafts, media, branching scenarios",
    accent: "bg-green-50 text-green-700",
    kpis: [
      { title: "Assigned to me", value: "5", description: "courses" },
      { title: "Slides due (7d)", value: "38", trend: { value: 10, direction: "up" } },
      { title: "Media pending", value: "12", description: "uploads" },
      { title: "Comments open", value: "9" },
    ],
    panels: [
      { title: "Co-editing", body: "Samuel is on Maternal v3 · slide 14 · last seen 4m ago (demo).", tone: "info" },
      { title: "Accessibility", body: "3 slides missing alt-text · 1 video without RW captions.", tone: "warn" },
    ],
    table: {
      title: "My drafts (demo)",
      columns: ["Course", "Progress", "Comments", "Due", "Status"],
      rows: [
        ["Maternal v3", "78%", "4", "Sep 11", "Editing"],
        ["Malaria RW", "42%", "2", "Sep 16", "Draft"],
        ["Household sim A", "15%", "0", "Sep 22", "New"],
        ["IMCI quiz pack", "90%", "3", "Sep 9", "Submit soon"],
      ],
    },
    actions: [
      { label: "Kanban Board", href: "/kanban-board", primary: true },
      { label: "Courses", href: "/courses" },
      { label: "Templates", href: "/templates" },
      { label: "Feedbacks", href: "/feedbacks" },
    ],
    roadmap: ["Branching scenario builder", "Diff before submit", "Reuse clinical snippets"],
  },

  CIIC_REVIEWER: {
    role: "CIIC_REVIEWER",
    department: "CIIC_HIN",
    title: "Clinical review workspace",
    subtitle: "Move courses on the board, check feedbacks, approve quality",
    accent: "bg-teal-50 text-teal-700",
    kpis: [
      { title: "In review (board)", value: "6", trend: { value: 2, direction: "up" } },
      { title: "Avg review time", value: "1.4d", trend: { value: 8, direction: "down" } },
      { title: "SLA breaches", value: "1", description: "this week" },
      { title: "Approvals (MTD)", value: "11" },
    ],
    panels: [
      { title: "Rubric ready", body: "Medical accuracy · Bias · Reading level · Teach-back (TESTER).", tone: "ok" },
      { title: "Pilot digest", body: "IMCI pilot: 68% CHWs say slide 9 is unclear — flag for editor.", tone: "info" },
    ],
    table: {
      title: "Board focus (demo)",
      columns: ["Course", "Submitted", "SLA", "Score", "Action"],
      rows: [
        ["Maternal v3", "Sep 6", "2d left", "—", "Start review"],
        ["Malaria RW", "Sep 4", "Overdue", "72", "Request changes"],
        ["Neonatal care", "Sep 5", "1d left", "88", "Approve"],
        ["IMCI refresh", "Sep 3", "Done", "91", "Archived"],
      ],
    },
    actions: [
      { label: "Kanban Board", href: "/kanban-board", primary: true },
      { label: "Feedbacks", href: "/feedbacks" },
      { label: "Glossary", href: "/glossary" },
      { label: "Version History", href: "/version-history" },
    ],
    roadmap: ["Side-by-side versions", "Teach-back TESTER flow", "Guideline evidence links"],
  },

  SFH_COORDINATOR: {
    role: "SFH_COORDINATOR",
    department: "SFH",
    title: "Field coordination hub",
    subtitle: "Coverage, campaigns, CEHO performance, multi-HC ops",
    accent: "bg-amber-50 text-amber-800",
    kpis: [
      { title: "CHWs / CEHO avg", value: "14.2", description: "target 10–20" },
      { title: "At-risk teams", value: "8", trend: { value: 2, direction: "up" } },
      { title: "Campaign reach", value: "87%", trend: { value: 5, direction: "up" } },
      { title: "Ghost signals", value: "4", description: "needs verify" },
    ],
    panels: [
      { title: "Weekly digest", body: "3 CEHO teams stalled Mid-Test · 2 HCs understaffed vs catchment need.", tone: "warn" },
      { title: "Campaign mode", body: "IMCI national push deadline Sep 30 — 13 districts behind pace.", tone: "info" },
    ],
    table: {
      title: "Coverage planner (demo)",
      columns: ["Health center", "CEHOs", "CHWs", "Gap", "Action"],
      rows: [
        ["Remera HC", "2", "31", "+1 CEHO", "Suggest split"],
        ["Nyamirambo", "1", "9", "OK", "Monitor"],
        ["Kimisagara", "1", "22", "Over", "Rebalance"],
        ["Gatenga", "0", "11", "No CEHO", "Promote"],
      ],
    },
    actions: [
      { label: "Staff", href: "/staff", primary: true },
      { label: "Coverage planner", href: "/coverage" },
      { label: "Campaigns", href: "/campaigns" },
      { label: "CHW & CEHO", href: "/students" },
    ],
    roadmap: ["Coverage planner", "Campaign deadlines", "Partner scorecard for RBC"],
  },

  SFH_CEHO_MANAGER: {
    role: "SFH_CEHO_MANAGER",
    department: "SFH",
    title: "CEHO network manager",
    subtitle: "Group health, capacity balance, leadership pipeline",
    accent: "bg-orange-50 text-orange-800",
    kpis: [
      { title: "Active CEHO groups", value: "48", trend: { value: 2, direction: "up" } },
      { title: "Avg group size", value: "15", description: "ideal 10–20" },
      { title: "Groups overloaded", value: "6", trend: { value: 1, direction: "up" } },
      { title: "Deputy ready", value: "11", description: "succession pool" },
    ],
    panels: [
      { title: "Capacity suggestion", body: "Move 4 CHWs from Kimisagara → Nyamirambo to rebalance (demo).", tone: "info" },
      { title: "Group health index", body: "Learning 72 · Attendance 81 · Engagement 64 (national avg).", tone: "ok" },
    ],
    table: {
      title: "CEHO groups needing attention (demo)",
      columns: ["CEHO", "HC", "Members", "Health", "Issue"],
      rows: [
        ["Grace U.", "Kimisagara", "22", "58", "Overloaded"],
        ["Bosco N.", "Remera", "18", "61", "Low Mid-Test"],
        ["Jeanne K.", "Gatenga", "12", "79", "OK"],
        ["Patrick M.", "Niboye", "8", "55", "Underfilled"],
      ],
    },
    actions: [
      { label: "CEHO network", href: "/ceho-network", primary: true },
      { label: "Coverage", href: "/coverage" },
      { label: "Meetings", href: "/meetings" },
    ],
    roadmap: ["Auto rebalance suggestions", "Leadership academy track", "Coaching notes → Itsinda"],
  },

  SFH_ENROLLMENT: {
    role: "SFH_ENROLLMENT",
    department: "SFH",
    title: "Enrollment desk",
    subtitle: "Register CHWs/CEHOs, HC assign, certificate follow-up",
    accent: "bg-yellow-50 text-yellow-800",
    kpis: [
      { title: "New enrollments (7d)", value: "126", trend: { value: 9, direction: "up" } },
      { title: "Stuck at verify", value: "19", trend: { value: 4, direction: "up" } },
      { title: "HC unassigned", value: "7", description: "needs HC" },
      { title: "Cert follow-ups", value: "33", description: "awaiting print" },
    ],
    panels: [
      { title: "Focus", body: "Use CHW & CEHO list for register/verify · Health Centers for assign.", tone: "info" },
      { title: "Dedupe", body: "3 possible NID duplicates waiting for merge review (demo).", tone: "warn" },
    ],
    table: {
      title: "Onboarding queue (demo)",
      columns: ["Name", "Stage", "HC", "Days stuck", "Next"],
      rows: [
        ["Claudine I.", "Verify NID", "—", "4", "Call"],
        ["Eric H.", "Study plan", "Remera", "2", "Nudge"],
        ["Diane U.", "HC assign", "—", "1", "Assign"],
        ["Olivier B.", "Cert print", "Gatenga", "6", "Print"],
      ],
    },
    actions: [
      { label: "CHW & CEHO", href: "/students", primary: true },
      { label: "Health Centers", href: "/healthCenters" },
      { label: "Certificates", href: "/certificates/issued" },
    ],
    roadmap: ["Bulk NID enrollment", "Self-serve invite links", "Offline enrollment kit"],
  },
};

export function getRoleWorkspace(role: string | null | undefined): RoleWorkspaceConfig | null {
  if (!role) return null;
  return ROLE_WORKSPACES[role] ?? null;
}
