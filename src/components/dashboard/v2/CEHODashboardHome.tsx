import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  Plus,
  Users,
  Video,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { CehoTask, TASK_STATUS_LABEL, taskStart } from "@/components/tasks/cehoTasks";
import { useCehoTasks } from "@/hooks/useCehoTasks";
import { CEHODashboardVersionSwitcher } from "@/components/dashboard/DashboardVersionSwitcher";
import { getMyGroup, getGroupMonitoring } from "@/services/cehoGroup.service";
import { getAllEvents } from "@/services/calender.service";
import { getAllAnnouncements, type IAnnouncement } from "@/services/announcement.service";
import type { IEvent } from "@/types";

const BANNER_DISMISS_KEY = "ceho-home-banner-dismissed";

const readDismissedBanner = () => {
  try {
    return localStorage.getItem(BANNER_DISMISS_KEY);
  } catch {
    return null;
  }
};

const PAGE =
  "relative bg-[#E7EEF5] dark:bg-page-bg -mx-4 -mt-4 -mb-12 px-3 sm:px-4 lg:px-5 pt-4 pb-10 min-h-[calc(100vh-4rem)] text-[#2A3138] dark:text-slate-100";

const CARD =
  "bg-white dark:bg-card-bg rounded-[18px] shadow-[0_10px_28px_rgba(31,55,84,0.06)] border border-white/70 dark:border-slate-700";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type CalKind = "meeting" | "training" | "field";

const KIND_COLOR: Record<CalKind, string> = {
  meeting: "#3EAE70",
  training: "#3B8BEB",
  field: "#E56B6B",
};

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const shiftMonth = (key: string, delta: number) => {
  const [year, month] = key.split("-").map(Number);
  return monthKey(new Date(year, month - 1 + delta, 1));
};

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const formatHours = (minutes: number) => {
  if (!minutes || minutes <= 0) return "0";
  const hours = minutes / 60;
  if (hours >= 10) return String(Math.round(hours));
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const eventKind = (type: IEvent["type"]): CalKind => {
  if (type === "MEETING") return "meeting";
  if (type === "TRAINING" || type === "WEBINAR") return "training";
  return "field";
};

const asEvents = (payload: unknown): IEvent[] => {
  if (Array.isArray(payload)) return payload as IEvent[];
  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: IEvent[] }).data;
  }
  return [];
};

type Period = "today" | "week" | "month";

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

const PeriodFilter: React.FC<{ value: Period; onChange: (period: Period) => void }> = ({ value, onChange }) => (
  <div className="relative shrink-0">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as Period)}
      aria-label="Time period"
      className="appearance-none rounded-lg bg-[#F3F5F8] dark:bg-slate-800 pl-2.5 pr-7 py-1 text-[12px] font-semibold text-[#5C6770] dark:text-slate-300 cursor-pointer focus:outline-none"
    >
      {PERIODS.map((period) => (
        <option key={period.id} value={period.id}>
          {period.label}
        </option>
      ))}
    </select>
    <ChevronDown size={14} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8B95A1]" />
  </div>
);

const TaskIcon: React.FC<{ kind: CalKind }> = ({ kind }) => {
  const Icon = kind === "meeting" ? Video : kind === "training" ? BookOpen : MapPin;
  return <Icon size={16} strokeWidth={2} />;
};

const PersonMark: React.FC<{ name: string; photo?: string | null }> = ({ name, photo }) => {
  const initial = (name.trim()[0] || "?").toUpperCase();
  const palette = ["#6D5BD0", "#E07A9A", "#C4844A", "#3B8BEB", "#3EAE70"];
  const index = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % palette.length;
  if (photo) {
    return <img src={photo} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />;
  }
  return (
    <span
      className="w-8 h-8 rounded-full text-white text-xs font-bold inline-flex items-center justify-center shrink-0"
      style={{ background: palette[index] }}
    >
      {initial}
    </span>
  );
};

const DOT_ROWS = 4;
const DOT_COLS = 5;

const DotSquare: React.FC<{ className?: string; edge: "topRight" | "bottomLeft" }> = ({
  className = "",
  edge,
}) => (
  <div className={`grid h-12 w-[3.75rem] grid-cols-5 grid-rows-4 gap-1 pointer-events-none ${className}`} aria-hidden>
    {Array.from({ length: DOT_ROWS * DOT_COLS }, (_, index) => {
      const row = Math.floor(index / DOT_COLS);
      const col = index % DOT_COLS;
      const hide =
        (edge === "bottomLeft" && row === 0 && col === DOT_COLS - 1) ||
        (edge === "topRight" && row === DOT_ROWS - 1 && col === 0);
      return <span key={index} className={hide ? "" : "rounded-[3px] bg-white/45"} />;
    })}
  </div>
);

const StatCard: React.FC<{
  label: string;
  value: string;
  detail?: string;
  loading?: boolean;
  tone: "blue" | "coral" | "green";
  icon: React.ReactNode;
  onClick?: () => void;
}> = ({ label, value, detail, loading, tone, icon, onClick }) => {
  const toneClass = {
    blue: "bg-[#3C9BE3]",
    coral: "bg-[#F18984]",
    green: "bg-[#45B56C]",
  }[tone];

  const body = (
    <>
      <DotSquare edge="topRight" className="absolute top-0.5 right-0.5" />
      <DotSquare edge="bottomLeft" className="absolute bottom-0.5 left-0.5" />
      <div className="relative z-10 self-start">
        <p className="text-[13px] font-medium leading-none text-white">{label}</p>
        {loading ? (
          <span className="mt-2.5 inline-block h-8 w-14 rounded-md bg-white/35 animate-pulse" />
        ) : (
          <p className="mt-2.5 flex h-9 items-end gap-1.5">
            <span className="text-[32px] leading-none font-bold tracking-tight">{value}</span>
            <span className={`pb-0.5 text-[13px] font-medium leading-none ${detail ? "text-white" : "invisible"}`}>
              {detail || "–"}
            </span>
          </p>
        )}
      </div>
      <div className="absolute right-4 bottom-3.5 text-white">{icon}</div>
    </>
  );

  const className = `relative overflow-hidden rounded-[14px] ${toneClass} text-white min-h-[150px] px-4 pt-4 pb-3.5 text-left w-full flex flex-col items-start`;
  if (!onClick) return <div className={className}>{body}</div>;
  return (
    <button type="button" onClick={onClick} className={`${className} cursor-pointer hover:brightness-[1.03] transition`}>
      {body}
    </button>
  );
};

const Donut: React.FC<{ present: number; absent: number }> = ({ present, absent }) => {
  const total = present + absent;
  const r = 54;
  const c = 2 * Math.PI * r;
  const gap = total > 0 && present > 0 && absent > 0 ? 8 : 0;
  const presentLen = total ? Math.max((present / total) * c - gap, 0) : 0;
  const absentLen = total ? Math.max((absent / total) * c - gap, 0) : 0;

  return (
    <svg viewBox="0 0 148 148" className="w-[148px] h-[148px] shrink-0" aria-hidden>
      <circle cx="74" cy="74" r={r} fill="none" stroke="#EEF2F6" strokeWidth="16" className="dark:stroke-slate-700" />
      {presentLen > 0 && (
        <circle
          cx="74"
          cy="74"
          r={r}
          fill="none"
          stroke="#3B8BEB"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${presentLen} ${c}`}
          transform="rotate(-90 74 74)"
        />
      )}
      {absentLen > 0 && (
        <circle
          cx="74"
          cy="74"
          r={r}
          fill="none"
          stroke="#F07B7B"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${absentLen} ${c}`}
          strokeDashoffset={-(presentLen + gap)}
          transform="rotate(-90 74 74)"
        />
      )}
    </svg>
  );
};

const CourseTabs: React.FC<{
  tabs: Array<{ id: string; title: string; shortName: string }>;
  courseId: string;
  onSelect: (id: string) => void;
}> = ({ tabs, courseId, onSelect }) => {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const updateEdges = () => {
    const el = scroller.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setEdges((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  };

  useEffect(() => {
    updateEdges();
    const el = scroller.current;
    if (!el) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [tabs]);

  const move = (direction: -1 | 1) => {
    scroller.current?.scrollBy({ left: direction * 160, behavior: "smooth" });
  };

  const arrow =
    "shrink-0 mb-1 grid h-6 w-6 place-items-center rounded-full text-[#5C6770] hover:bg-[#EEF3F8] disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-slate-800";

  return (
    <div className="mt-3 flex items-end gap-1 border-b border-[#EEF1F4] dark:border-slate-700">
      <button type="button" aria-label="Scroll courses left" className={arrow} disabled={!edges.left} onClick={() => move(-1)}>
        <ChevronLeft size={16} />
      </button>
      <div
        ref={scroller}
        onScroll={updateEdges}
        className="flex min-w-0 flex-1 flex-nowrap gap-x-4 overflow-x-auto overscroll-x-contain scrollbar-hide text-[13px] font-semibold"
      >
        <button
          type="button"
          onClick={() => onSelect("all")}
          className={`shrink-0 whitespace-nowrap pb-2 ${courseId === "all" ? "text-[#2F89E6] border-b-2 border-[#2F89E6]" : "text-[#8B95A1]"}`}
        >
          All
        </button>
        {tabs.map((course) => (
          <button
            key={course.id}
            type="button"
            onClick={() => onSelect(course.id)}
            className={`shrink-0 whitespace-nowrap pb-2 ${courseId === course.id ? "text-[#2F89E6] border-b-2 border-[#2F89E6]" : "text-[#8B95A1]"}`}
            title={course.title}
          >
            {course.shortName || course.title}
          </button>
        ))}
      </div>
      <button type="button" aria-label="Scroll courses right" className={arrow} disabled={!edges.right} onClick={() => move(1)}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export const CEHODashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [courseId, setCourseId] = useState("all");
  const [attendancePeriod, setAttendancePeriod] = useState<Period>("today");
  const [coursePeriod, setCoursePeriod] = useState<Period>("today");
  const { tasks: upcoming, isLoading: tasksLoading, saveTask: persistTask } = useCehoTasks({
    query: { status: "upcoming", sort: "time", limit: 7 },
  });
  const monthRange = useMemo(() => {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 0);
    return { from: dayKey(start), to: dayKey(end) };
  }, [month]);
  const { days: taskDays } = useCehoTasks({
    query: { from: monthRange.from, to: monthRange.to, sort: "time" },
  });
  const [taskOpen, setTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CehoTask | null>(null);
  const [dismissedBanner, setDismissedBanner] = useState<string | null>(readDismissedBanner);

  const { data: myGroup, isError: groupMissing, isLoading: groupLoading } = useQuery({
    queryKey: ["ceho-group-mine"],
    queryFn: getMyGroup,
    retry: false,
  });

  const { data: monitoring, isLoading: monitoringLoading } = useQuery({
    queryKey: ["ceho-group-monitoring"],
    queryFn: getGroupMonitoring,
    retry: false,
  });

  const { data: eventsPayload } = useQuery({
    queryKey: ["events"],
    queryFn: getAllEvents,
    retry: false,
  });

  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => (await getAllAnnouncements()).data,
    retry: false,
  });

  const members = useMemo(
    () => (monitoring?.members ?? []).filter((member) => !member.isLeader),
    [monitoring?.members],
  );

  const events = useMemo(
    () => asEvents(eventsPayload).filter((event) => event.status !== "cancelled" && !event.isCancelled && event.startAt),
    [eventsPayload],
  );

  const marks = useMemo(() => {
    const map = new Map<string, CalKind>();
    const rank: Record<CalKind, number> = { meeting: 3, training: 2, field: 1 };
    taskDays.forEach((day) => map.set(day.date, day.kind));
    events.forEach((event) => {
      const date = new Date(event.startAt);
      if (Number.isNaN(date.getTime())) return;
      const key = dayKey(date);
      const kind = eventKind(event.type);
      const current = map.get(key);
      if (!current || rank[kind] > rank[current]) map.set(key, kind);
    });
    return map;
  }, [events, taskDays]);

  const taskTitles = useMemo(() => {
    const map = new Map<string, string[]>();
    taskDays.forEach((day) => map.set(day.date, day.titles));
    return map;
  }, [taskDays]);

  const saveTask = (task: CehoTask) => {
    persistTask(task, { onSuccess: () => setTaskOpen(false) });
  };

  const openTask = (task: CehoTask | null) => {
    setEditingTask(task);
    setTaskOpen(true);
  };

  const calendarCells = useMemo(() => {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(year, mon, 0);
    end.setDate(end.getDate() + (6 - end.getDay()));
    const cells: Array<{ date: Date; inMonth: boolean }> = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      cells.push({ date: new Date(cursor), inMonth: cursor.getMonth() === mon - 1 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return cells;
  }, [month]);

  const monthLabel = useMemo(() => {
    const [year, mon] = month.split("-").map(Number);
    return new Date(year, mon - 1, 1).toLocaleDateString(undefined, { month: "long" });
  }, [month]);

  const announcement: IAnnouncement | undefined = (announcements ?? []).find((item) => item.status !== "draft");
  const firstName = user?.fullNames?.trim().split(/\s+/)[0];
  const courseTabs = monitoring?.courseTabs ?? [];
  const bannerKey = announcement?.id ?? (groupMissing ? "no-group" : "group");
  const bannerLoading = !announcement && !groupMissing && (groupLoading || monitoringLoading);
  const bannerDismissed = dismissedBanner === bannerKey;

  const dismissBanner = () => {
    setDismissedBanner(bannerKey);
    try {
      localStorage.setItem(BANNER_DISMISS_KEY, bannerKey);
    } catch {
      /* private mode */
    }
  };

  const expandBanner = () => {
    setDismissedBanner(null);
    try {
      localStorage.removeItem(BANNER_DISMISS_KEY);
    } catch {
      /* private mode */
    }
  };

  const periodView = monitoring?.views?.[attendancePeriod];
  const attendanceView =
    courseId === "all"
      ? periodView?.attendance.all ?? { present: 0, absent: 0 }
      : periodView?.attendance.courses[courseId] ?? { present: 0, absent: 0 };
  const shownCourses = monitoring?.views?.[coursePeriod]?.courses ?? [];
  const shownActivities = monitoring?.activities ?? [];
  const chwCount = monitoring?.stats?.chwCount ?? members.length;
  const courseCount = monitoring?.stats?.courseCount ?? 0;
  const studyMinutes = monitoring?.stats?.studyMinutes ?? 0;

  const bannerBody = announcement ? (
    <>
      <span className="font-semibold text-[#374151] dark:text-slate-100">{announcement.title}. </span>
      {announcement.body ? <span className="line-clamp-2 block">{announcement.body}</span> : null}
    </>
  ) : groupMissing ? (
    "No CHW group is assigned to you yet."
  ) : groupLoading || monitoringLoading ? (
    "Loading your group…"
  ) : (
    <>
      You supervise {members.length} community health worker{members.length === 1 ? "" : "s"}
      {myGroup?.name ? ` in ${myGroup.name}` : ""}.{" "}
      <Link to="/ceho-group" className="text-[#2F89E6] font-semibold hover:underline">
        Open your group.
      </Link>
    </>
  );

  return (
    <div className={PAGE}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="relative flex-1 min-w-[240px] rounded-xl border border-[#C5DDF3] bg-[#F8FBFE] dark:bg-slate-800/70 dark:border-slate-600 px-4 py-1.5 pr-10 text-[13px] leading-relaxed text-[#4B5563] dark:text-slate-300">
          <p className="font-semibold text-[#374151] dark:text-slate-100">
            Hello{firstName ? ` ${firstName}` : ""}
          </p>
          {!bannerDismissed && <p>{bannerBody}</p>}
          {!bannerLoading && (
            <button
              type="button"
              onClick={bannerDismissed ? expandBanner : dismissBanner}
              aria-label={bannerDismissed ? "Show message" : "Close message"}
              aria-expanded={!bannerDismissed}
              className="absolute top-2.5 right-2.5 p-1 rounded-md text-[#8B95A1] hover:text-[#374151] hover:bg-[#E7EEF5] dark:hover:bg-slate-700 dark:hover:text-slate-100"
            >
              {bannerDismissed ? <ChevronDown size={14} /> : <X size={14} />}
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <CEHODashboardVersionSwitcher />
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

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.9fr)] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Total CHWs"
              value={String(chwCount)}
              detail="members"
              loading={monitoringLoading}
              tone="blue"
              icon={<Users size={46} strokeWidth={2} />}
              onClick={() => navigate("/ceho-group?tab=members")}
            />
            <StatCard
              label="Your Courses"
              value={String(courseCount)}
              detail="active"
              loading={monitoringLoading}
              tone="coral"
              icon={<FileText size={46} strokeWidth={2} />}
              onClick={() => navigate("/ceho-group?tab=learning")}
            />
            <StatCard
              label="Study Hours"
              value={formatHours(studyMinutes)}
              detail="this month"
              loading={monitoringLoading}
              tone="green"
              icon={<Clock size={46} strokeWidth={2} />}
              onClick={() => navigate("/ceho-group?tab=learning")}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className={`${CARD} p-4`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-bold">CHW Attendance</h2>
                <PeriodFilter value={attendancePeriod} onChange={setAttendancePeriod} />
              </div>
              <CourseTabs tabs={courseTabs} courseId={courseId} onSelect={setCourseId} />
              {monitoringLoading ? (
                <p className="text-[13px] text-[#8B95A1] py-8 text-center">Loading attendance…</p>
              ) : (
              <div className="mt-4 flex items-center gap-4">
                <Donut present={attendanceView.present} absent={attendanceView.absent} />
                <div className="space-y-3">
                  <div>
                    <p className="flex items-center gap-2 text-[13px] text-[#5C6770] dark:text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3B8BEB]" />
                      Present
                    </p>
                    <p className="text-[22px] font-semibold leading-none mt-1 ml-4">{attendanceView.present}</p>
                  </div>
                  <div>
                    <p className="flex items-center gap-2 text-[13px] text-[#5C6770] dark:text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F07B7B]" />
                      Absent
                    </p>
                    <p className="text-[22px] font-semibold leading-none mt-1 ml-4">{attendanceView.absent}</p>
                  </div>
                </div>
              </div>
              )}
              <p className="mt-2 text-[11px] text-[#9AA3AE]">
                {attendancePeriod === "today"
                  ? "Present means active in the last 48 hours."
                  : attendancePeriod === "week"
                    ? "Present means active in the last 7 days."
                    : "Present means active in the last 30 days."}{" "}
                Absent is everyone else in this view.
              </p>
            </section>

            <section className={`${CARD} p-4`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-bold">Courses For You</h2>
                <div className="flex items-center gap-3">
                  <PeriodFilter value={coursePeriod} onChange={setCoursePeriod} />
                  <Link to="/ceho-group?tab=learning" className="text-[13px] font-semibold text-[#2F89E6] hover:underline">
                    View All
                  </Link>
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {shownCourses.length === 0 ? (
                  <p className="text-[13px] text-[#8B95A1] py-8 text-center">
                    {monitoringLoading ? "Loading courses…" : "No course progress for this period."}
                  </p>
                ) : (
                  shownCourses.slice(0, 2).map((course) => (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => navigate("/ceho-group?tab=learning")}
                      className="w-full text-left rounded-xl bg-[#F4F6F8] dark:bg-slate-800 px-3 py-3 hover:bg-[#E8EEF4] dark:hover:bg-slate-700"
                    >
                      <p className="text-[13px] font-semibold leading-snug">{course.title}</p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#6B7280] dark:text-slate-400">
                        <Users size={13} />
                        {course.students} CHW{course.students === 1 ? "" : "s"}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] text-[#8B95A1] w-14 shrink-0">Progress</span>
                        <div className="flex-1 h-2 rounded-full bg-[#E3E8EE] dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#3B8BEB]"
                            style={{ width: `${Math.min(100, Math.max(0, course.progress))}%` }}
                          />
                        </div>
                        <span className="text-[12px] font-semibold text-[#5C6770] dark:text-slate-300 w-9 text-right">
                          {course.progress}%
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>
          </div>

          <section className={`${CARD} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold">Recent Activities</h2>
              <Link to="/ceho-group?tab=members" className="text-[13px] font-semibold text-[#2F89E6] hover:underline">
                View All
              </Link>
            </div>
            <div className="mt-2">
              {shownActivities.length === 0 ? (
                <p className="text-[13px] text-[#8B95A1] py-6 text-center">
                  {monitoringLoading ? "Loading activity…" : "No recent activity in this group yet."}
                </p>
              ) : (
                shownActivities.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate("/ceho-group?tab=members")}
                    className="w-full flex items-center gap-3 py-3 border-b border-[#F0F2F5] dark:border-slate-700 last:border-0 text-left hover:bg-[#F8FBFE] dark:hover:bg-slate-800/60"
                  >
                    <PersonMark name={item.name} photo={item.photo} />
                    <p className="text-[13px] text-[#5C6770] dark:text-slate-300 min-w-0 flex-1">
                      <span className="font-semibold text-[#2A3138] dark:text-slate-100">{item.name}</span> {item.text}
                    </p>
                    {item.at && (
                      <span className="text-[11px] text-[#9AA3AE] tabular-nums shrink-0">
                        {new Date(item.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-4 min-w-0">
          <section className={`${CARD} p-4`}>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMonth((current) => shiftMonth(current, -1))}
                className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F6F9] dark:hover:bg-slate-700"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-[18px] font-semibold">{monthLabel}</h2>
              <button
                type="button"
                onClick={() => setMonth((current) => shiftMonth(current, 1))}
                className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F6F9] dark:hover:bg-slate-700"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 text-center text-[12px] text-[#9AA3AE]">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-1 font-medium">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 text-center">
              {calendarCells.map((cell) => {
                const key = dayKey(cell.date);
                const kind = cell.inMonth ? marks.get(key) : undefined;
                const titles = cell.inMonth ? taskTitles.get(key) : undefined;
                return (
                  <button
                    key={key}
                    type="button"
                    title={titles?.join(" · ")}
                    onClick={() => navigate(`/calender?date=${key}`)}
                    className="h-9 flex items-center justify-center"
                  >
                    <span
                      className={`w-8 h-8 rounded-full text-[13px] inline-flex items-center justify-center ${
                        kind
                          ? "text-white font-semibold"
                          : cell.inMonth
                            ? "text-[#3A424A] dark:text-slate-200"
                            : "text-[#C5CDD6] dark:text-slate-600"
                      }`}
                      style={kind ? { background: KIND_COLOR[kind] } : undefined}
                    >
                      {cell.date.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3">
              <p className="text-[13px] font-semibold">Calendar Guide</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#5C6770] dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <i className="w-2.5 h-2.5 rounded-full bg-[#3EAE70]" /> Meetings
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="w-2.5 h-2.5 rounded-full bg-[#3B8BEB]" /> Training
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="w-2.5 h-2.5 rounded-full bg-[#E56B6B]" /> Field
                </span>
              </div>
            </div>
          </section>

          <section className={`${CARD} p-4`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-bold">Upcoming Tasks</h2>
              <Link to="/tasks" className="text-[13px] font-semibold text-[#2F89E6] hover:underline">
                View All
              </Link>
            </div>
            <div className="mt-2">
              {tasksLoading ? (
                <p className="text-[13px] text-[#8B95A1] py-6 text-center">Loading tasks…</p>
              ) : upcoming.length === 0 ? (
                <p className="text-[13px] text-[#8B95A1] py-6 text-center">No upcoming tasks.</p>
              ) : (
                upcoming.map((task) => {
                  const when = taskStart(task);
                  const today = task.date === dayKey(new Date());
                  const bubble = {
                    meeting: "bg-[#E7F6EC] text-[#217A45]",
                    training: "bg-[#E8F3FC] text-[#1D6FB8]",
                    field: "bg-[#FDECEC] text-[#E07070]",
                  }[task.kind];
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => openTask(task)}
                      className="w-full flex items-center gap-3 py-2.5 border-b border-[#F0F2F5] dark:border-slate-700 last:border-0 text-left hover:bg-[#F8FBFE] dark:hover:bg-slate-800/60 rounded-lg px-1"
                    >
                      <span className={`w-9 h-9 rounded-full inline-flex items-center justify-center shrink-0 ${bubble}`}>
                        <TaskIcon kind={task.kind} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-medium truncate">{task.title}</span>
                        <span className="block text-[11px] text-[#8B95A1] truncate">
                          {TASK_STATUS_LABEL[task.status]}
                          {task.source === "system" ? " · Group" : ""}
                          {!today ? ` · ${when.toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
                          {task.overdue ? " · Overdue" : ""}
                        </span>
                      </span>
                      <span className="text-[12px] text-[#9AA3AE] tabular-nums shrink-0">
                        {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
      <TaskDialog open={taskOpen} task={editingTask} onClose={() => setTaskOpen(false)} onSave={saveTask} />
    </div>
  );
};

export default CEHODashboardHome;
