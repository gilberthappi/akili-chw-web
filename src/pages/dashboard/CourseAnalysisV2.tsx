import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Award,
  Users,
  TrendingUp,
  Star,
  ClipboardList,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  AdminDashboardFiltersProvider,
  useAdminDashboardFilters,
} from "@/components/dashboard/v2/AdminDashboardFiltersContext";
import { DashboardGlobalFilters } from "@/components/dashboard/DashboardGlobalFilters";
import { V2_CARD_SHELL_PADDED } from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import {
  CourseAnalysisTab,
  useAdminDashboardV2CourseAnalysis,
} from "@/hooks/useAdminDashboardV2CourseAnalysis";

const PIE_COLORS = ["#3363AD", "#5BA8A0", "#E5B842", "#E07070", "#8B9DC3"];

const TABS: { key: CourseAnalysisTab; label: string }[] = [
  { key: "all", label: "All enrolled" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "certified", label: "Certified" },
  { key: "not_started", label: "Not started" },
  { key: "assessments", label: "Assessments" },
  { key: "at_risk", label: "At risk" },
  { key: "reviews", label: "Reviews" },
];

const fmt = (n: number | null | undefined, suffix = "") =>
  n == null || Number.isNaN(n) ? "—" : `${n}${suffix}`;

const CourseAnalysisBoard: React.FC = () => {
  const { courseId = "" } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { filters, setFilters } = useAdminDashboardFilters();
  const [tab, setTab] = useState<CourseAnalysisTab>("all");
  const [searchq, setSearchq] = useState("");
  const [page, setPage] = useState(1);
  const [timeframe, setTimeframe] = useState("monthly");

  const { data, isLoading, isFetching } = useAdminDashboardV2CourseAnalysis({
    courseId,
    tab,
    searchq,
    page,
    limit: 25,
    timeframe,
    filters,
  });

  const kpis = data?.kpis;
  const course = data?.course;
  const charts = data?.charts;
  const learners = data?.learners ?? [];
  const pagination = data?.pagination;
  const tabCounts = data?.tabCounts;

  const kpiCards = useMemo(() => {
    if (!kpis) return [];
    return [
      {
        label: "Enrolled",
        value: kpis.enrolled,
        hint: `${kpis.notStarted} not started`,
        icon: Users,
      },
      {
        label: "In progress",
        value: kpis.inProgress,
        hint: `${fmt(kpis.avgProgress, "%")} avg progress`,
        icon: TrendingUp,
      },
      {
        label: "Completed",
        value: kpis.completed,
        hint: `${fmt(kpis.completionRate, "%")} rate`,
        icon: CheckCircle2,
      },
      {
        label: "Certified",
        value: kpis.certified,
        hint: `${fmt(kpis.certificationRate, "%")} of completers`,
        icon: Award,
      },
      {
        label: "Knowledge gain",
        value: fmt(kpis.knowledgeGain),
        hint: `Pre ${fmt(kpis.avgPre)} → Post ${fmt(kpis.avgPost)}`,
        icon: BookOpen,
      },
      {
        label: "Attempts",
        value: kpis.attempts,
        hint: `${fmt(kpis.avgExamAttempts)} avg exam tries`,
        icon: ClipboardList,
      },
      {
        label: "Rating",
        value: fmt(kpis.avgRating),
        hint: `${kpis.reviewCount} reviews`,
        icon: Star,
      },
    ];
  }, [kpis]);

  const onTabChange = (next: CourseAnalysisTab) => {
    setTab(next);
    setPage(1);
  };

  if (!courseId) {
    return (
      <div className="p-6 text-sm text-red-500">Missing course id.</div>
    );
  }

  return (
    <div className="relative bg-white -mx-4 -mt-4 -mb-12 px-3 sm:px-4 lg:px-5 pt-3 sm:pt-4 lg:pt-5 pb-10 min-h-[calc(100vh-4rem)] space-y-4 text-gray-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5B6575] hover:text-[#3363AD]"
          >
            <ArrowLeft size={14} />
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {isLoading && !course ? "Loading course…" : course?.title ?? "Course"}
          </h1>
          {course && (
            <p className="text-xs text-gray-500">
              {course.sections} sections · {course.chapters} chapters ·{" "}
              {course.mediaFiles} media · {course.questions} questions
              {course.isPublished ? "" : " · Draft"}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DashboardGlobalFilters filters={filters} onChange={setFilters} />
          {isFetching && !isLoading && (
            <span className="text-xs text-gray-400">Updating…</span>
          )}
          <Link
            to={`/courses/edit/${courseId}`}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-[#B8CDE0] text-[#3363AD] hover:bg-[#EEF4FF]"
          >
            Edit course
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {isLoading && !kpis
          ? Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`${V2_CARD_SHELL_PADDED} h-[88px] animate-pulse bg-[#F5F8FC]`}
              />
            ))
          : kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={V2_CARD_SHELL_PADDED}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-semibold text-[#5B6575]">
                      {card.label}
                    </p>
                    <span className="w-7 h-7 rounded-lg bg-[#C5D3E0] flex items-center justify-center">
                      <Icon size={14} className="text-[#1A2332]" />
                    </span>
                  </div>
                  <p className="text-xl font-bold text-[#1A2332] mt-1 tabular-nums">
                    {card.value}
                  </p>
                  <p className="text-[10px] text-[#8A94A6] mt-0.5 truncate">
                    {card.hint}
                  </p>
                </div>
              );
            })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.9fr)] gap-4 min-h-[280px]">
        <div className={`${V2_CARD_SHELL_PADDED} flex flex-col min-h-[280px]`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[14px] font-bold text-[#1A2332]">Trends</h3>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="text-[11px] font-semibold border border-[#B8CDE0] rounded-lg px-2 py-1 text-[#5B6575]"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.trends.series ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="enrollments" name="Enrollments" stroke="#3363AD" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="completions" name="Completions" stroke="#5BA8A0" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="certifications" name="Certifications" stroke="#E5B842" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${V2_CARD_SHELL_PADDED} flex flex-col min-h-[280px]`}>
          <h3 className="text-[14px] font-bold text-[#1A2332] mb-2">
            Assessment averages
          </h3>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.assessments ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip />
                <Bar dataKey="value" name="Avg score" fill="#3363AD" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-rows-2 gap-4 min-h-[280px]">
          <PieCard title="Gender" data={charts?.genderPie ?? []} />
          <PieCard title="Status" data={charts?.statusPie ?? []} />
        </div>
      </div>

      {/* Rating pie + structure note */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PieCard title="Ratings" data={charts?.ratingPie ?? []} tall />
        <div className={`${V2_CARD_SHELL_PADDED} md:col-span-2`}>
          <h3 className="text-[14px] font-bold text-[#1A2332] mb-2">
            Score snapshot
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Stat label="Avg Pre" value={fmt(kpis?.avgPre)} />
            <Stat label="Avg Mid" value={fmt(kpis?.avgMid)} />
            <Stat label="Avg Post" value={fmt(kpis?.avgPost)} />
            <Stat label="Knowledge gain" value={fmt(kpis?.knowledgeGain)} />
          </div>
        </div>
      </div>

      {/* Tabbed learners table */}
      <div className={`${V2_CARD_SHELL_PADDED} space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[14px] font-bold text-[#1A2332]">Learners</h3>
          <input
            value={searchq}
            onChange={(e) => {
              setSearchq(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, phone, district…"
            className="text-[12px] border border-[#B8CDE0] rounded-lg px-3 py-1.5 w-full sm:w-64 focus:outline-none focus:border-[#3363AD]"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const count = tabCounts?.[t.key] ?? 0;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => onTabChange(t.key)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                  active
                    ? "bg-[#3363AD] text-white border-[#3363AD]"
                    : "bg-white text-[#5B6575] border-[#D5E4F2] hover:border-[#3363AD]"
                }`}
              >
                {t.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto border border-[#E8EEF4] rounded-xl">
          <table className="min-w-full text-left text-[11px]">
            <thead className="bg-[#F5F8FC] text-[#5B6575]">
              <tr>
                {[
                  "Learner",
                  "Gender",
                  "Age",
                  "District",
                  "HC",
                  "Enrolled",
                  "Progress",
                  "Pre",
                  "Mid",
                  "Post",
                  "Gain",
                  "Avg",
                  "Done",
                  "Cert",
                  "Review",
                  "Last login",
                ].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && learners.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-3 py-8 text-center text-[#9AA3B2]">
                    Loading learners…
                  </td>
                </tr>
              ) : learners.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-3 py-8 text-center text-[#9AA3B2]">
                    No learners in this tab
                  </td>
                </tr>
              ) : (
                learners.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[#F1F5F9] hover:bg-[#F8FBFF]"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2 min-w-[160px]">
                        {row.photo ? (
                          <img
                            src={row.photo}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-[#C5D3E0] flex items-center justify-center text-[10px] font-bold">
                            {row.fullNames.charAt(0)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1A2332] truncate max-w-[140px]">
                            {row.fullNames}
                          </p>
                          <p className="text-[#8A94A6] truncate max-w-[140px]">
                            {row.phoneNumber || row.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">{row.gender}</td>
                    <td className="px-3 py-2">{row.ageGroup}</td>
                    <td className="px-3 py-2">{row.district}</td>
                    <td className="px-3 py-2 max-w-[120px] truncate">
                      {row.healthCenterName ?? "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDate(row.enrolledAt)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{fmt(row.progress, "%")}</td>
                    <td className="px-3 py-2 tabular-nums">{fmt(row.preScore)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmt(row.midScore)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmt(row.postScore)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmt(row.knowledgeGain)}</td>
                    <td className="px-3 py-2 tabular-nums">{fmt(row.avgScore)}</td>
                    <td className="px-3 py-2">{row.completed ? "Yes" : "—"}</td>
                    <td className="px-3 py-2">{row.certified ? "Yes" : "—"}</td>
                    <td className="px-3 py-2">
                      {row.reviewRating != null ? `${row.reviewRating}★` : "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {formatDate(row.lastLoginAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-[11px] text-[#5B6575]">
            <span>
              Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
              learners
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded-lg border border-[#B8CDE0] disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 rounded-lg border border-[#B8CDE0] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#F5F8FC] px-3 py-2">
      <p className="text-[10px] font-semibold text-[#5B6575]">{label}</p>
      <p className="text-lg font-bold text-[#1A2332] tabular-nums">{value}</p>
    </div>
  );
}

function PieCard({
  title,
  data,
  tall,
}: {
  title: string;
  data: Array<{ label: string; value: number }>;
  tall?: boolean;
}) {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <div
      className={`${V2_CARD_SHELL_PADDED} flex flex-col ${
        tall ? "min-h-[220px]" : "min-h-0"
      }`}
    >
      <h3 className="text-[13px] font-bold text-[#1A2332] mb-1">{title}</h3>
      <div className="flex-1 min-h-[120px]">
        {filtered.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[11px] text-[#9AA3B2]">
            No data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filtered}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={48}
                paddingAngle={2}
              >
                {filtered.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const CourseAnalysisV2: React.FC = () => (
  <AdminDashboardFiltersProvider>
    <CourseAnalysisBoard />
  </AdminDashboardFiltersProvider>
);

export default CourseAnalysisV2;
