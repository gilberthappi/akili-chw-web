import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, GripVertical, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { resolveDepartmentStaffRole, formatRoleLabel } from "@/utils/roles";

export type BoardStatus =
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "published";

export type BoardTicket = {
  id: string;
  title: string;
  description: string;
  status: BoardStatus;
  priority: "low" | "medium" | "high";
  createdBy: string;
  assignee?: string;
  createdAt: string;
  updatedAt: string;
};

type BoardKind = "weltel" | "ciic";

const WELTEL_COLUMNS: { id: BoardStatus; label: string; hint: string }[] = [
  { id: "todo", label: "To do", hint: "New / queued" },
  { id: "in_progress", label: "In progress", hint: "Developer working" },
  { id: "in_review", label: "In review", hint: "QA / support check" },
  { id: "done", label: "Done", hint: "Fixed, not released" },
  { id: "published", label: "Published", hint: "Live in prod" },
];

const CIIC_COLUMNS: { id: BoardStatus; label: string; hint: string }[] = [
  { id: "todo", label: "To do", hint: "Queued work" },
  { id: "in_progress", label: "In progress", hint: "Editor working" },
  { id: "in_review", label: "In review", hint: "Clinical / lead review" },
  { id: "done", label: "Ready", hint: "Ready to publish" },
  { id: "published", label: "Published", hint: "Live nationally" },
];

const WELTEL_SEED: BoardTicket[] = [
  {
    id: "T-2041",
    title: "Login loop on Android",
    description: "CHW reports stuck after OTP on Samsung A14.",
    status: "todo",
    priority: "high",
    createdBy: "WelTel Support",
    assignee: "Developer",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "T-2038",
    title: "CEHO invite SMS not sent",
    description: "Invite created but SMS gateway returned 429.",
    status: "in_progress",
    priority: "medium",
    createdBy: "WelTel Support",
    assignee: "Developer",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "T-2033",
    title: "Final test stuck at 99%",
    description: "Result screen never opens after submit.",
    status: "in_review",
    priority: "high",
    createdBy: "WelTel Support",
    assignee: "Developer",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "T-2029",
    title: "Photo upload timeout",
    description: "HC Remera profile photo fails on slow network.",
    status: "done",
    priority: "low",
    createdBy: "WelTel Support",
    assignee: "Developer",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "T-2010",
    title: "Push token refresh",
    description: "Expired FCM tokens cleaned on login.",
    status: "published",
    priority: "medium",
    createdBy: "WelTel Support",
    assignee: "Developer",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

const CIIC_SEED: BoardTicket[] = [
  {
    id: "C-112",
    title: "Maternal v3 accuracy fixes",
    description: "Close 2 medical accuracy checklist items before National.",
    status: "todo",
    priority: "high",
    createdBy: "Content Lead",
    assignee: "Editor",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "C-109",
    title: "RW captions for IMCI video",
    description: "Add Kinyarwanda captions; source MP4 in Resources.",
    status: "in_progress",
    priority: "medium",
    createdBy: "Editor",
    assignee: "Editor",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "C-104",
    title: "Malaria RW clinical review",
    description: "Reviewer SLA overdue — score 72, request changes.",
    status: "in_review",
    priority: "high",
    createdBy: "Content Lead",
    assignee: "Reviewer",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "C-098",
    title: "Icon pack: danger signs",
    description: "Upload SVG set to Resources and link in Documents SOP.",
    status: "done",
    priority: "low",
    createdBy: "Editor",
    assignee: "Editor",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "C-090",
    title: "Neonatal care national publish",
    description: "Gates passed · FR 40% accepted for pilot markets.",
    status: "published",
    priority: "medium",
    createdBy: "Content Lead",
    assignee: "Content Lead",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

function boardKindForRole(primaryRole: string | null): BoardKind {
  if (primaryRole?.startsWith("CIIC_")) return "ciic";
  return "weltel";
}

function storageKey(kind: BoardKind) {
  return kind === "ciic" ? "chw.ciic.boards.v1" : "chw.support.boards.v1";
}

function loadTickets(kind: BoardKind): BoardTicket[] {
  const seed = kind === "ciic" ? CIIC_SEED : WELTEL_SEED;
  try {
    const raw = localStorage.getItem(storageKey(kind));
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as BoardTicket[];
    return Array.isArray(parsed) && parsed.length ? parsed : seed;
  } catch {
    return seed;
  }
}

function saveTickets(kind: BoardKind, tickets: BoardTicket[]) {
  localStorage.setItem(storageKey(kind), JSON.stringify(tickets));
}

const priorityClass: Record<BoardTicket["priority"], string> = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-800",
  low: "bg-gray-100 text-gray-600",
};

export const BoardsPage = () => {
  const { user, hasRole } = useAuth();
  const primaryRole = resolveDepartmentStaffRole(
    user?.roles as string[] | string | undefined,
  );
  const kind = boardKindForRole(primaryRole);
  const columns = kind === "ciic" ? CIIC_COLUMNS : WELTEL_COLUMNS;

  const isCiic = kind === "ciic";
  const canCreate = isCiic
    ? hasRole(["CIIC_CONTENT_LEAD", "CIIC_EDITOR", "CIIC_REVIEWER"]) ||
      !!primaryRole?.startsWith("CIIC_")
    : hasRole(["WELTEL_SUPPORT", "WELTEL_ADMIN"]) ||
      primaryRole === "WELTEL_SUPPORT" ||
      primaryRole === "WELTEL_ADMIN";
  const canMove = isCiic
    ? hasRole(["CIIC_CONTENT_LEAD", "CIIC_EDITOR", "CIIC_REVIEWER"]) ||
      !!primaryRole?.startsWith("CIIC_")
    : hasRole(["WELTEL_DEVELOPER", "WELTEL_ADMIN", "WELTEL_SUPPORT"]) ||
      !!primaryRole?.startsWith("WELTEL_");

  const [tickets, setTickets] = useState<BoardTicket[]>(() =>
    loadTickets(kind),
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<BoardTicket["priority"]>("medium");
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    setTickets(loadTickets(kind));
  }, [kind]);

  useEffect(() => {
    saveTickets(kind, tickets);
  }, [kind, tickets]);

  const byColumn = useMemo(() => {
    const map: Record<BoardStatus, BoardTicket[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
      published: [],
    };
    for (const t of tickets) map[t.status].push(t);
    return map;
  }, [tickets]);

  const moveTicket = useCallback((id: string, status: BoardStatus) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status, updatedAt: new Date().toISOString() }
          : t,
      ),
    );
  }, []);

  const createTicket = () => {
    if (!title.trim()) return;
    const prefix = isCiic ? "C" : "T";
    const nextNum =
      Math.max(
        isCiic ? 100 : 2000,
        ...tickets.map((t) => parseInt(t.id.replace(/\D/g, ""), 10) || 0),
      ) + 1;
    const ticket: BoardTicket = {
      id: `${prefix}-${nextNum}`,
      title: title.trim(),
      description: description.trim(),
      status: "todo",
      priority,
      createdBy: user?.fullNames || formatRoleLabel(primaryRole) || "User",
      assignee: "Unassigned",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTickets((prev) => [ticket, ...prev]);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setCreateOpen(false);
  };

  const onDropColumn = (status: BoardStatus) => {
    if (!dragId || !canMove) return;
    moveTicket(dragId, status);
    setDragId(null);
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isCiic
              ? "Track content work · Editors & reviewers move cards through the pipeline"
              : "Support creates tickets · Developers move them through the pipeline"}
          </p>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#3363AD] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#284f8a]"
          >
            <Plus size={14} />
            New ticket
          </button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div
            key={col.id}
            className="w-[260px] shrink-0 rounded-2xl border border-gray-100 bg-gray-50/80 flex flex-col max-h-[calc(100vh-220px)]"
            onDragOver={(e) => {
              if (canMove) e.preventDefault();
            }}
            onDrop={() => onDropColumn(col.id)}
          >
            <div className="px-3 py-2.5 border-b border-gray-100 bg-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                  {col.label}
                </h2>
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {byColumn[col.id].length}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-0.5">{col.hint}</p>
            </div>

            <div className="p-2 space-y-2 overflow-y-auto flex-1">
              {byColumn[col.id].map((ticket) => (
                <div
                  key={ticket.id}
                  draggable={canMove}
                  onDragStart={() => setDragId(ticket.id)}
                  onDragEnd={() => setDragId(null)}
                  className={`rounded-xl border border-gray-100 bg-white p-3 shadow-xs ${
                    canMove ? "cursor-grab active:cursor-grabbing" : ""
                  } ${dragId === ticket.id ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-1.5">
                    {canMove && (
                      <GripVertical
                        size={14}
                        className="text-gray-300 mt-0.5 shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-[#3363AD]">
                          {ticket.id}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${priorityClass[ticket.priority]}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">
                        {ticket.title}
                      </p>
                      {ticket.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {ticket.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                        <span>{ticket.createdBy}</span>
                        <span>{ticket.assignee || "—"}</span>
                      </div>
                      {canMove && (
                        <select
                          className="mt-1 w-full text-[11px] border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white"
                          value={ticket.status}
                          onChange={(e) =>
                            moveTicket(ticket.id, e.target.value as BoardStatus)
                          }
                        >
                          {columns.map((c) => (
                            <option key={c.id} value={c.id}>
                              Move → {c.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {byColumn[col.id].length === 0 && (
                <p className="text-center text-[11px] text-gray-400 py-6">
                  Empty
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">New ticket</h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Title
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#3363AD]"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    isCiic
                      ? "Course / asset work summary"
                      : "Short problem summary"
                  }
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Description
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#3363AD] min-h-[90px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isCiic
                      ? "Course, asset links, owner, due…"
                      : "Steps, device, user affected…"
                  }
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Priority
                </label>
                <select
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={priority}
                  onChange={(e) =>
                    setPriority(e.target.value as BoardTicket["priority"])
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-600 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={createTicket}
                disabled={!title.trim()}
                className="px-3.5 py-2 text-xs font-bold text-white rounded-xl bg-[#3363AD] hover:bg-[#284f8a] disabled:opacity-40"
              >
                Create ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardsPage;
