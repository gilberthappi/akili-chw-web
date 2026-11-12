import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlarmClock, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, Columns3, GripVertical, Loader, Plus, Search, Table2 } from "lucide-react";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import {
  CehoTask,
  TASK_KIND_LABEL,
  TASK_STATUS_LABEL,
  taskStart,
  type TaskKind,
  type TaskStatus,
} from "@/components/tasks/cehoTasks";
import { useCehoTasks } from "@/hooks/useCehoTasks";
import { V2_PAGE_CANVAS, V2_PAGE_SUBTITLE, V2_PAGE_TITLE } from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

type ViewMode = "table" | "board";

const VIEW_KEY = "ceho-tasks-view";
const PAGE_SIZE = 8;

const COLUMNS: { id: TaskStatus; label: string; hint: string; accent: string }[] = [
  { id: "todo", label: "To do", hint: "Not started", accent: "bg-[#3C9BE3]" },
  { id: "due", label: "Due", hint: "Needs attention now", accent: "bg-[#E6A23C]" },
  { id: "in_progress", label: "In progress", hint: "Being done", accent: "bg-[#F18984]" },
  { id: "postponed", label: "Postponed", hint: "Moved to later", accent: "bg-[#8B7EC8]" },
  { id: "done", label: "Done", hint: "Finished", accent: "bg-[#45B56C]" },
];

const kindDot: Record<CehoTask["kind"], string> = {
  meeting: "bg-[#3EAE70]",
  training: "bg-[#3B8BEB]",
  field: "bg-[#E56B6B]",
};

const kindChip: Record<CehoTask["kind"], string> = {
  meeting: "bg-[#E7F6EC] text-[#217A45]",
  training: "bg-[#E8F3FC] text-[#1D6FB8]",
  field: "bg-[#FDECEA] text-[#C45B56]",
};

const statusTone: Record<TaskStatus, string> = {
  todo: "bg-[#E8F3FC] text-[#1D6FB8] dark:bg-sky-950/50 dark:text-sky-200",
  due: "bg-[#FFF4D6] text-[#9A6700] dark:bg-amber-950/40 dark:text-amber-200",
  in_progress: "bg-[#FDECEA] text-[#C45B56] dark:bg-rose-950/40 dark:text-rose-200",
  postponed: "bg-[#EEEAF8] text-[#5C4D8A] dark:bg-violet-950/40 dark:text-violet-200",
  done: "bg-[#E7F6EC] text-[#217A45] dark:bg-emerald-950/40 dark:text-emerald-200",
};

const readView = (): ViewMode => {
  try {
    return localStorage.getItem(VIEW_KEY) === "board" ? "board" : "table";
  } catch {
    return "table";
  }
};

const whenLabel = (task: CehoTask) => {
  const when = taskStart(task);
  return {
    day: when.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    time: when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
    overdue: Boolean(task.overdue),
  };
};

const StatusSelect: React.FC<{
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
}> = ({ value, onChange }) => (
  <select
    value={value}
    aria-label="Task status"
    onClick={(event) => event.stopPropagation()}
    onChange={(event) => onChange(event.target.value as TaskStatus)}
    className={`rounded-full px-2.5 py-1 text-[12px] font-semibold cursor-pointer focus:outline-none ${statusTone[value]}`}
  >
    {COLUMNS.map((column) => (
      <option key={column.id} value={column.id}>
        {column.label}
      </option>
    ))}
  </select>
);

const DOT_ROWS = 4;
const DOT_COLS = 5;

const DotSquare: React.FC<{ className?: string; edge: "topRight" | "bottomLeft" }> = ({ className = "", edge }) => (
  <div className={`grid h-10 w-[3.1rem] grid-cols-5 grid-rows-4 gap-[3px] pointer-events-none ${className}`} aria-hidden>
    {Array.from({ length: DOT_ROWS * DOT_COLS }, (_, index) => {
      const row = Math.floor(index / DOT_COLS);
      const col = index % DOT_COLS;
      const hide =
        (edge === "bottomLeft" && row === 0 && col === DOT_COLS - 1) ||
        (edge === "topRight" && row === DOT_ROWS - 1 && col === 0);
      return <span key={index} className={hide ? "" : "rounded-[2px] bg-white/45"} />;
    })}
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: number;
  detail: string;
  tone: "blue" | "amber" | "coral" | "violet" | "green";
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}> = ({ label, value, detail, tone, icon, active, onClick }) => {
  const toneClass = {
    blue: "bg-[#3C9BE3]",
    amber: "bg-[#E6A23C]",
    coral: "bg-[#F18984]",
    violet: "bg-[#8B7EC8]",
    green: "bg-[#45B56C]",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative overflow-hidden rounded-[14px] ${toneClass} text-white min-h-[132px] px-4 pt-4 pb-3.5 text-left w-full flex flex-col items-start hover:brightness-[1.03] transition ${
        active ? "ring-2 ring-offset-2 ring-[#1A2332] dark:ring-white dark:ring-offset-slate-900" : ""
      }`}
    >
      <DotSquare edge="topRight" className="absolute top-0.5 right-0.5" />
      <DotSquare edge="bottomLeft" className="absolute bottom-0.5 left-0.5" />
      <div className="relative z-10">
        <p className="text-[13px] font-medium leading-none">{label}</p>
        <p className="mt-2.5 flex h-9 items-end gap-1.5">
          <span className="text-[32px] leading-none font-bold tracking-tight">{value}</span>
          <span className="pb-0.5 text-[13px] font-medium leading-none">{detail}</span>
        </p>
      </div>
      <div className="absolute right-4 bottom-3.5 text-white">{icon}</div>
    </button>
  );
};

export const TasksPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CehoTask | null>(null);
  const [view, setView] = useState<ViewMode>(readView);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "">("");
  const [kindFilter, setKindFilter] = useState<TaskKind | "">("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const listQuery = useMemo(
    () =>
      view === "board"
        ? { status: statusFilter || undefined, sort: "time" as const, layout: "board" as const }
        : {
            search: search || undefined,
            status: statusFilter || undefined,
            kind: kindFilter || undefined,
            sort: "upcoming" as const,
            page,
            limit: PAGE_SIZE,
          },
    [view, statusFilter, kindFilter, search, page],
  );

  const {
    tasks: pageRows,
    columns: board,
    counts,
    total,
    page: pageSafe,
    pages: totalPages,
    isLoading,
    isError,
    saveTask,
    setStatus,
  } = useCehoTasks({ query: listQuery });

  useEffect(() => {
    setPage(1);
  }, [search, kindFilter, statusFilter]);

  useEffect(() => {
    if (!isLoading && page > totalPages) setPage(totalPages);
  }, [isLoading, page, totalPages]);

  const openTask = (task: CehoTask | null) => {
    setEditing(task);
    setOpen(true);
  };

  const save = (task: CehoTask) => {
    saveTask(task, { onSuccess: () => setOpen(false) });
  };

  const changeStatus = (id: string, status: TaskStatus) => {
    setStatus({ id, status });
  };

  const chooseView = (next: ViewMode) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* private mode */
    }
  };

  const toggleFilter = (status: TaskStatus) => {
    setStatusFilter((current) => (current === status ? "" : status));
  };

  const columns = statusFilter ? COLUMNS.filter((column) => column.id === statusFilter) : COLUMNS;

  return (
    <div className={V2_PAGE_CANVAS}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className={V2_PAGE_TITLE}>Tasks</h1>
          <p className={V2_PAGE_SUBTITLE}>
            Tasks you add are saved for your account. The system also adds tasks from your group: inactive CHWs, stuck courses, and weak tests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full bg-[#F3F5F8] dark:bg-slate-800 p-1" role="group" aria-label="Task view">
            <button
              type="button"
              onClick={() => chooseView("table")}
              aria-pressed={view === "table"}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                view === "table" ? "bg-white dark:bg-slate-700 text-[#1A2332] dark:text-white shadow-sm" : "text-[#5C6770] dark:text-slate-300"
              }`}
            >
              <Table2 size={14} />
              Table
            </button>
            <button
              type="button"
              onClick={() => chooseView("board")}
              aria-pressed={view === "board"}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
                view === "board" ? "bg-white dark:bg-slate-700 text-[#1A2332] dark:text-white shadow-sm" : "text-[#5C6770] dark:text-slate-300"
              }`}
            >
              <Columns3 size={14} />
              Board
            </button>
          </div>
          <button
            type="button"
            onClick={() => openTask(null)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary text-white text-sm font-semibold px-4 py-1.5 shadow-sm"
          >
            <Plus size={16} strokeWidth={2.4} />
            Add Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="To do"
          value={counts.todo}
          detail="waiting"
          tone="blue"
          icon={<CircleDashed size={42} strokeWidth={1.75} />}
          active={statusFilter === "todo"}
          onClick={() => toggleFilter("todo")}
        />
        <StatCard
          label="Due"
          value={counts.due}
          detail="now"
          tone="amber"
          icon={<AlarmClock size={42} strokeWidth={1.75} />}
          active={statusFilter === "due"}
          onClick={() => toggleFilter("due")}
        />
        <StatCard
          label="In progress"
          value={counts.in_progress}
          detail="active"
          tone="coral"
          icon={<Loader size={42} strokeWidth={1.75} />}
          active={statusFilter === "in_progress"}
          onClick={() => toggleFilter("in_progress")}
        />
        <StatCard
          label="Postponed"
          value={counts.postponed}
          detail="later"
          tone="violet"
          icon={<CalendarClock size={42} strokeWidth={1.75} />}
          active={statusFilter === "postponed"}
          onClick={() => toggleFilter("postponed")}
        />
        <StatCard
          label="Done"
          value={counts.done}
          detail="finished"
          tone="green"
          icon={<CheckCircle2 size={42} strokeWidth={1.75} />}
          active={statusFilter === "done"}
          onClick={() => toggleFilter("done")}
        />
      </div>

      {view === "table" ? (
        <section className="bg-white dark:bg-card-bg rounded-[18px] border border-[rgba(51,99,173,0.20)] dark:border-slate-600/60 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#F0F2F5] dark:border-slate-700">
            <label className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8B95A1]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title or notes"
                aria-label="Search tasks"
                className="w-full rounded-lg border border-[#D5E0EA] dark:border-slate-600 bg-white dark:bg-slate-800 pl-8 pr-3 py-1.5 text-[13px] text-[#2A3138] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3B8BEB]/30"
              />
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as TaskStatus | "")}
              aria-label="Filter by status"
              className="rounded-lg border border-[#D5E0EA] dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-[13px] font-semibold text-[#5C6770] dark:text-slate-200 focus:outline-none"
            >
              <option value="">All statuses</option>
              {COLUMNS.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.label}
                </option>
              ))}
            </select>
            <select
              value={kindFilter}
              onChange={(event) => setKindFilter(event.target.value as TaskKind | "")}
              aria-label="Filter by type"
              className="rounded-lg border border-[#D5E0EA] dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-[13px] font-semibold text-[#5C6770] dark:text-slate-200 focus:outline-none"
            >
              <option value="">All types</option>
              {(Object.keys(TASK_KIND_LABEL) as TaskKind[]).map((kind) => (
                <option key={kind} value={kind}>
                  {TASK_KIND_LABEL[kind]}
                </option>
              ))}
            </select>
          </div>
          {isLoading ? (
            <p className="text-sm text-[#8B95A1] py-10 text-center">Loading tasks…</p>
          ) : isError ? (
            <p className="text-sm text-[#C45B56] py-10 text-center">Tasks could not be loaded.</p>
          ) : total === 0 ? (
            <p className="text-sm text-[#8B95A1] py-10 text-center">No tasks match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-[#8B95A1] border-b border-[#F0F2F5] dark:border-slate-700">
                    <th className="px-4 py-3 font-semibold">Task</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">When</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((task) => {
                    const when = whenLabel(task);
                    return (
                      <tr
                        key={task.id}
                        className="border-b border-[#F0F2F5] dark:border-slate-700 last:border-0 hover:bg-[#F8FBFE] dark:hover:bg-slate-800/60"
                      >
                        <td className="px-4 py-3">
                          <button type="button" onClick={() => openTask(task)} className="text-left">
                            <span className="block text-sm font-semibold text-[#2A3138] dark:text-slate-100">
                              {task.title}
                              {task.source === "system" && (
                                <span className="ml-2 align-middle rounded-full bg-[#E8F3FC] text-[#1D6FB8] px-2 py-0.5 text-[10px] font-semibold">
                                  Group
                                </span>
                              )}
                            </span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-[#5C6770] dark:text-slate-300">
                            <span className={`w-2 h-2 rounded-full ${kindDot[task.kind]}`} />
                            {TASK_KIND_LABEL[task.kind]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#5C6770] dark:text-slate-300 tabular-nums whitespace-nowrap">
                          {when.day}
                          <span className="block text-[12px] text-[#8B95A1]">{when.time}</span>
                          {when.overdue && <span className="text-[11px] font-semibold text-[#C45B56]">Overdue</span>}
                        </td>
                        <td className="px-4 py-3">
                          <StatusSelect value={task.status} onChange={(status) => changeStatus(task.id, status)} />
                        </td>
                        <td className="px-4 py-3 text-[13px] text-[#8B95A1] max-w-[240px] truncate">{task.notes || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {total > 0 && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#F0F2F5] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/60">
              <p className="text-[12px] text-[#8B95A1]">
                Showing{" "}
                <span className="font-semibold text-[#2A3138] dark:text-slate-100">
                  {(pageSafe - 1) * PAGE_SIZE + 1}–{Math.min(pageSafe * PAGE_SIZE, total)}
                </span>{" "}
                of <span className="font-semibold text-[#2A3138] dark:text-slate-100">{total}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={pageSafe === 1}
                  aria-label="Previous page"
                  className="p-1.5 rounded-lg text-[#5C6770] hover:bg-[#F1F5F9] dark:hover:bg-slate-700 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[12px] font-semibold text-[#2A3138] dark:text-slate-100 tabular-nums">
                  {pageSafe} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={pageSafe === totalPages}
                  aria-label="Next page"
                  className="p-1.5 rounded-lg text-[#5C6770] hover:bg-[#F1F5F9] dark:hover:bg-slate-700 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <div
          className={
            columns.length === 1
              ? "grid grid-cols-1"
              : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3 items-start"
          }
        >
          {columns.map((column) => (
            <section
              key={column.id}
              className="min-w-0 rounded-[18px] border border-[rgba(51,99,173,0.20)] dark:border-slate-600/60 bg-[#F7F9FB] dark:bg-slate-900/40 min-h-[220px] flex flex-col overflow-hidden"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!dragId) return;
                changeStatus(dragId, column.id);
                setDragId(null);
              }}
            >
              <header className="flex items-center justify-between gap-2 px-3.5 py-3 border-b border-[#E6EDF3] dark:border-slate-700 bg-white/70 dark:bg-slate-900/30">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 text-[13px] font-bold text-[#1A2332] dark:text-slate-100">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${column.accent}`} />
                    <span className="truncate">{column.label}</span>
                  </h2>
                  <p className="text-[11px] text-[#8B95A1] mt-0.5 truncate">{column.hint}</p>
                </div>
                <span className="text-[11px] font-semibold text-[#5C6770] bg-white dark:bg-slate-800 rounded-full px-2 py-0.5 shrink-0">
                  {(board?.[column.id] ?? []).length}
                </span>
              </header>
              <div className={`p-2.5 flex-1 ${columns.length === 1 ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 content-start" : "space-y-2.5"}`}>
                {(board?.[column.id] ?? []).length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#D5E0EA] dark:border-slate-600 text-center text-[12px] text-[#8B95A1] py-8">
                    Drop a task here
                  </div>
                )}
                {(board?.[column.id] ?? []).map((task) => {
                  const when = whenLabel(task);
                  return (
                    <article
                      key={task.id}
                      draggable
                      onDragStart={() => setDragId(task.id)}
                      onDragEnd={() => setDragId(null)}
                      className={`rounded-2xl border border-[#E6EDF3] dark:border-slate-700 bg-white dark:bg-card-bg shadow-sm overflow-hidden cursor-grab active:cursor-grabbing ${
                        dragId === task.id ? "opacity-60" : ""
                      }`}
                    >
                      <div className={`h-1 ${column.accent}`} />
                      <div className="p-3">
                        <div className="flex items-start gap-1.5">
                          <GripVertical size={14} className="text-[#C5D0DA] mt-0.5 shrink-0" />
                          <button type="button" onClick={() => openTask(task)} className="min-w-0 flex-1 text-left">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${kindChip[task.kind]}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${kindDot[task.kind]}`} />
                              {TASK_KIND_LABEL[task.kind]}
                            </span>
                            {task.source === "system" && (
                              <span className="ml-1.5 inline-flex rounded-full bg-[#E8F3FC] text-[#1D6FB8] px-2 py-0.5 text-[10px] font-semibold">
                                Group
                              </span>
                            )}
                            <span className="block text-sm font-semibold text-[#2A3138] dark:text-slate-100 mt-1.5 leading-snug">{task.title}</span>
                            {task.notes && <span className="block text-[12px] text-[#8B95A1] mt-1 line-clamp-3">{task.notes}</span>}
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[12px] text-[#5C6770] dark:text-slate-300 tabular-nums">
                            {when.day}
                            <span className="text-[#8B95A1]"> · {when.time}</span>
                            {when.overdue && <span className="ml-1.5 font-semibold text-[#C45B56]">Overdue</span>}
                          </span>
                          <StatusSelect value={task.status} onChange={(status) => changeStatus(task.id, status)} />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="text-[12px] text-[#8B95A1]">
        {statusFilter ? "Click the highlighted card again to show every status. " : "Click a card to focus that status. "}
        Done and postponed tasks stay off Upcoming Tasks. See the schedule on the{" "}
        <Link to="/calender" className="text-[#2F89E6] font-semibold hover:underline">
          calendar
        </Link>
        .
      </p>

      <TaskDialog open={open} task={editing} onClose={() => setOpen(false)} onSave={save} />
    </div>
  );
};

export default TasksPage;
