import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Activity,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Repeat,
} from "lucide-react";
import { getAllDistricts } from "@/hooks/locations";
import {
  exportLearnerActiveness,
  getActivenessSummary,
  getLearnerActiveness,
  type AttendanceGranularity,
  type IActivenessWindow,
  type LearnerActivityStatus,
} from "@/services/attendance.service";
import { V2KpiCard, V2KpiSkeleton, V2SearchInput, V2Tabs, type V2TabItem } from "@/components/v2/V2Page";
import {
  V2_BTN_SECONDARY,
  V2_CARD_SHELL,
  V2_CARD_SHELL_PADDED,
  V2_INPUT,
  V2_MUTED,
  V2_PILL,
  V2_PILL_AMBER,
  V2_PILL_GRAY,
  V2_PILL_GREEN,
  V2_PILL_RED,
  V2_SECTION_TITLE,
  V2_STRONG,
  V2_TABLE_BODY,
  V2_TABLE_HEAD,
  V2_TABLE_ROW,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import { TrendLineChart } from "./TrendLineChart";

const PAGE_SIZE = 20;

const GRANULARITY_TABS: V2TabItem<AttendanceGranularity>[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

const STATUS_META: Record<LearnerActivityStatus, { label: string; hint: string; pill: string; bar: string }> = {
  active: { label: "Active", hint: "Learned in the last 7 days", pill: V2_PILL_GREEN, bar: "bg-emerald-500" },
  slowing: { label: "Slowing down", hint: "Last learned 7–30 days ago", pill: V2_PILL_AMBER, bar: "bg-amber-500" },
  inactive: { label: "Inactive", hint: "Nothing for 30+ days, or never", pill: V2_PILL_RED, bar: "bg-red-500" },
};

const trendOf = (w?: IActivenessWindow) =>
  w
    ? {
        value: Math.abs(w.change),
        direction: (w.change > 0 ? "up" : w.change < 0 ? "down" : "stable") as "up" | "down" | "stable",
      }
    : undefined;

const lastActiveText = (days: number | null) => {
  if (days === null) return "Never";
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

export const AttendanceAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [district, setDistrict] = useState("");
  const [gender, setGender] = useState("");
  const [granularity, setGranularity] = useState<AttendanceGranularity>("daily");
  const [windowDays, setWindowDays] = useState(30);
  const [status, setStatus] = useState<LearnerActivityStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [district, gender, windowDays, status, debouncedSearch]);

  const filters = { district: district || undefined, gender: gender || undefined };
  const districtNames = useMemo(() => getAllDistricts().map((d) => d.name.trim()).sort(), []);

  const { data: summaryRes, isLoading: summaryLoading } = useQuery({
    queryKey: ["attendance", "summary", granularity, filters],
    queryFn: () => getActivenessSummary(granularity, filters),
    keepPreviousData: true,
  });
  const summary = summaryRes?.data;

  const listParams = {
    ...filters,
    windowDays,
    status: status === "all" ? undefined : status,
    searchq: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
  };
  const { data: listRes, isLoading: listLoading, isFetching: listFetching } = useQuery({
    queryKey: ["attendance", "learners", listParams],
    queryFn: () => getLearnerActiveness(listParams),
    keepPreviousData: true,
  });
  const rows = listRes?.data ?? [];
  const totalPages = listRes?.pagination.totalPages ?? 1;

  const handleExport = async () => {
    setExporting(true);
    try {
      const { page: _page, limit: _limit, ...params } = listParams;
      await exportLearnerActiveness(params);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const statusTabs: V2TabItem<LearnerActivityStatus | "all">[] = [
    { key: "all", label: "All", count: summary?.totalLearners },
    ...(Object.keys(STATUS_META) as LearnerActivityStatus[]).map((key) => ({
      key,
      label: STATUS_META[key].label,
      count: summary?.statusCounts[key],
    })),
  ];

  const trendTitle =
    granularity === "daily"
      ? "Daily activeness, last 30 days"
      : granularity === "weekly"
        ? "Weekly activeness, last 12 weeks"
        : "Monthly activeness, last 12 months";

  return (
    <>
      <div className={`${V2_CARD_SHELL} p-3 flex flex-col sm:flex-row sm:items-center gap-2`}>
        <select value={district} onChange={(e) => setDistrict(e.target.value)} className={`px-3 py-2 text-sm ${V2_INPUT} sm:w-48`}>
          <option value=''>All districts</option>
          {districtNames.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select value={gender} onChange={(e) => setGender(e.target.value)} className={`px-3 py-2 text-sm ${V2_INPUT} sm:w-40`}>
          <option value=''>All genders</option>
          <option value='Male'>Male</option>
          <option value='Female'>Female</option>
        </select>
        <p className={`text-[11px] sm:ml-auto ${V2_MUTED}`}>
          A CHW is active on a day when they open or finish a slide, take a test, enrol in a course or log in.
        </p>
      </div>

      {summaryLoading ? (
        <V2KpiSkeleton count={4} />
      ) : (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <V2KpiCard
            label='Daily active'
            value={`${summary?.daily.ratio ?? 0}%`}
            Icon={CalendarCheck}
            trend={trendOf(summary?.daily)}
            sub={`${summary?.daily.active ?? 0} of ${summary?.daily.total ?? 0} CHWs today`}
          />
          <V2KpiCard
            label='Weekly active'
            value={`${summary?.weekly.ratio ?? 0}%`}
            Icon={CalendarDays}
            accent='text-purple-600 dark:text-purple-400'
            trend={trendOf(summary?.weekly)}
            sub={`${summary?.weekly.active ?? 0} CHWs, last 7 days`}
          />
          <V2KpiCard
            label='Monthly active'
            value={`${summary?.monthly.ratio ?? 0}%`}
            Icon={CalendarRange}
            accent='text-emerald-600 dark:text-emerald-400'
            trend={trendOf(summary?.monthly)}
            sub={`${summary?.monthly.active ?? 0} CHWs, last 30 days`}
          />
          <V2KpiCard
            label='Avg active days'
            value={summary?.avgActiveDays30 ?? 0}
            Icon={Repeat}
            accent='text-amber-500 dark:text-amber-400'
            sub='per active CHW, last 30 days'
          />
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <div className={`${V2_CARD_SHELL_PADDED} lg:col-span-2`}>
          <div className='flex flex-wrap items-center justify-between gap-2 mb-3'>
            <h3 className={V2_SECTION_TITLE}>{trendTitle}</h3>
            <V2Tabs items={GRANULARITY_TABS} active={granularity} onChange={setGranularity} />
          </div>
          <TrendLineChart data={summary?.trend ?? []} xKey='label' yKey='ratio' label='Active CHWs' unit='%' />
          <p className={`text-[11px] mt-2 ${V2_MUTED}`}>
            Share of registered CHWs who were active at least once in each{" "}
            {granularity === "daily" ? "day" : granularity === "weekly" ? "week" : "month"}
            {summary?.trend.some((t) => t.partial) ? ". The latest period is still in progress." : "."}
          </p>
        </div>

        <div className={V2_CARD_SHELL_PADDED}>
          <h3 className={`${V2_SECTION_TITLE} mb-3`}>CHW status</h3>
          <div className='space-y-3'>
            {(Object.keys(STATUS_META) as LearnerActivityStatus[]).map((key) => {
              const count = summary?.statusCounts[key] ?? 0;
              const pct = summary?.totalLearners ? Math.round((count / summary.totalLearners) * 100) : 0;
              return (
                <button
                  key={key}
                  type='button'
                  onClick={() => setStatus(key)}
                  className='w-full text-left p-2 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-colors'
                >
                  <div className='flex items-center justify-between mb-1 gap-3'>
                    <span className={`text-xs font-bold ${V2_STRONG}`}>{STATUS_META[key].label}</span>
                    <span className={`text-xs font-bold tabular-nums ${V2_STRONG}`}>
                      {count.toLocaleString()} <span className={V2_MUTED}>({pct}%)</span>
                    </span>
                  </div>
                  <div className='w-full bg-[#E8EEF6] dark:bg-slate-700 rounded-full h-1.5'>
                    <div className={`${STATUS_META[key].bar} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={`text-[11px] ${V2_MUTED}`}>{STATUS_META[key].hint}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={`${V2_CARD_SHELL} overflow-hidden`}>
        <div className='px-4 py-3 flex flex-col xl:flex-row xl:items-center gap-2'>
          <h3 className={`${V2_SECTION_TITLE} flex items-center gap-2`}>
            <Activity className='w-4 h-4 text-[#3363AD]' />
            CHW activeness
            {listFetching && !listLoading && <Loader2 className='w-4 h-4 animate-spin text-[#3363AD]' />}
          </h3>
          <div className='flex flex-wrap items-center gap-2 xl:ml-auto'>
            <V2Tabs items={statusTabs} active={status} onChange={setStatus} />
            <V2SearchInput value={search} onChange={setSearch} placeholder='Search name, phone or NID…' className='w-56' />
            <select
              value={windowDays}
              onChange={(e) => setWindowDays(Number(e.target.value))}
              className={`px-3 py-2 text-sm ${V2_INPUT}`}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button type='button' onClick={handleExport} disabled={exporting} className={V2_BTN_SECONDARY}>
              {exporting ? <Loader2 className='w-4 h-4 animate-spin' /> : <Download className='w-4 h-4' />}
              Export Excel
            </button>
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className={V2_TABLE_HEAD}>
              <tr>
                <th className='text-left px-4 py-2.5'>CHW</th>
                <th className='text-left px-3 py-2.5'>Location</th>
                <th className='text-left px-3 py-2.5'>Status</th>
                <th className='text-left px-3 py-2.5 w-56'>Active days (last {windowDays})</th>
                <th className='text-left px-3 py-2.5'>Last active</th>
                <th className='w-8' />
              </tr>
            </thead>
            <tbody className={V2_TABLE_BODY}>
              {listLoading ? (
                <tr>
                  <td colSpan={6} className={`px-4 py-8 text-center text-xs ${V2_MUTED}`}>
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-4 py-8 text-center text-xs ${V2_MUTED}`}>
                    No CHWs match these filters
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.userId} onClick={() => navigate(`/chw/${r.studentId}`)} className={`${V2_TABLE_ROW} cursor-pointer`}>
                    <td className='px-4 py-2.5'>
                      <p className={`font-semibold ${V2_STRONG}`}>{r.fullNames}</p>
                      <p className={`text-[11px] ${V2_MUTED}`}>{r.phoneNumber}</p>
                    </td>
                    <td className={`px-3 py-2.5 text-xs ${V2_MUTED}`}>
                      {[r.district, r.sector].filter(Boolean).join(" · ") || "—"}
                      {r.healthCenterName && <p className='truncate max-w-[200px]'>{r.healthCenterName}</p>}
                    </td>
                    <td className='px-3 py-2.5'>
                      <span className={`${V2_PILL} ${STATUS_META[r.status]?.pill ?? V2_PILL_GRAY}`}>
                        {STATUS_META[r.status]?.label ?? r.status}
                      </span>
                    </td>
                    <td className='px-3 py-2.5'>
                      <div className='flex items-center gap-2'>
                        <div className='flex-1 bg-[#E8EEF6] dark:bg-slate-700 rounded-full h-1.5'>
                          <div className='bg-[#3363AD] h-1.5 rounded-full' style={{ width: `${Math.min(100, r.activeRatio)}%` }} />
                        </div>
                        <span className={`text-xs tabular-nums whitespace-nowrap ${V2_STRONG}`}>
                          {r.daysActive} <span className={V2_MUTED}>({r.activeRatio}%)</span>
                        </span>
                      </div>
                    </td>
                    <td className={`px-3 py-2.5 text-xs ${V2_MUTED}`}>
                      <p className={V2_STRONG}>{lastActiveText(r.daysSinceActive)}</p>
                      {r.lastActiveDay && r.daysSinceActive! > 1 && <p>{r.lastActiveDay}</p>}
                    </td>
                    <td className='pr-3'>
                      <ChevronRight className='w-4 h-4 text-[#9AA3B2]' />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className='px-4 py-3 flex items-center justify-between border-t border-[rgba(51,99,173,0.08)] dark:border-slate-700'>
            <span className={`text-xs ${V2_MUTED}`}>
              Page {page} of {totalPages} · {listRes?.pagination.total.toLocaleString()} CHWs
            </span>
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`${V2_BTN_SECONDARY} px-3 py-1.5 disabled:opacity-40`}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                type='button'
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={`${V2_BTN_SECONDARY} px-3 py-1.5 disabled:opacity-40`}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AttendanceAnalytics;
