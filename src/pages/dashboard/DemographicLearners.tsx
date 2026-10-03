import { useMemo, useState, useCallback, FC } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import toast from "react-hot-toast";
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  Users,
  X,
} from "lucide-react";
import {
  exportDemographicLearners,
  getDemographicLearners,
} from "@/services/analytics.service";
import api from "@/services/api";
import { getAllDistricts, getSectorsByDistrict } from "@/hooks/locations";
import { formatDate } from "@/utils/formats/formats";
import { V2KpiCard, V2KpiSkeleton, V2PageHeader, V2SearchInput } from "@/components/v2/V2Page";
import {
  V2_BTN_SECONDARY,
  V2_CARD_SHELL,
  V2_INPUT,
  V2_MUTED,
  V2_PAGE_CANVAS,
  V2_PILL,
  V2_STRONG,
  V2_TABLE_BODY,
  V2_TABLE_HEAD,
  V2_TABLE_ROW,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import type { IDemographicLearner, IDemographicLearnersSummary } from "@/types";

const BAND_OPTIONS = [
  { value: "excellent", label: "Excellent (90–100%)" },
  { value: "good", label: "Good (80–89%)" },
  { value: "average", label: "Average (70–79%)" },
  { value: "poor", label: "Poor (60–69%)" },
  { value: "failing", label: "Failing (<60%)" },
];
const AGE_OPTIONS = ["<30", "30-49", "50-59", "60+"];
const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "SUSPENDED", "GRADUATED"];

/** Filters with their own control on this page. */
const PAGE_FILTERS = ["district", "sector", "gender", "ageGroup", "courseId", "performanceBand", "status"] as const;
/** Filters that only arrive from dashboard drill-downs; shown as removable chips. */
const DRILLDOWN_FILTERS: Record<string, string> = {
  province: "Province",
  role: "Role",
  healthCenterId: "Health center",
  year: "Year",
  month: "Month",
};

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  INACTIVE: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  SUSPENDED: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  GRADUATED: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

const SELECT = `px-3 py-2 text-sm ${V2_INPUT}`;

const DemographicLearnersPage: FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const limit = 25;
  const [searchInput, setSearchInput] = useState("");
  const [searchq, setSearchq] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const debouncedSearch = useCallback(
    debounce((v: string) => {
      setSearchq(v);
      setPage(1);
    }, 400),
    [],
  );

  const district = searchParams.get("district") ?? "";
  const districts = useMemo(() => getAllDistricts().map((d) => d.name).sort(), []);
  const sectors = useMemo(
    () => (district ? getSectorsByDistrict(district).map((s) => s.name.trim()).sort() : []),
    [district],
  );

  const { data: coursesRes } = useQuery({
    queryKey: ["courses", "basic-options"],
    queryFn: async () =>
      (await api.get("/courses/list/all-basic?limit=200")).data as {
        data: { id: string; title: string; shortName?: string | null }[];
      },
    staleTime: 5 * 60 * 1000,
  });
  const courseOptions = coursesRes?.data ?? [];

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "district") next.delete("sector");
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const activeDrilldowns = Object.keys(DRILLDOWN_FILTERS).filter((k) => searchParams.get(k));
  const hasFilters = PAGE_FILTERS.some((k) => searchParams.get(k)) || activeDrilldowns.length > 0;

  const clearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setSearchInput("");
    setSearchq("");
    setPage(1);
  };

  const filterQs = useMemo(() => {
    const p = new URLSearchParams();
    for (const key of [...PAGE_FILTERS, ...Object.keys(DRILLDOWN_FILTERS)]) {
      const v = searchParams.get(key);
      if (v) p.set(key, v);
    }
    if (searchq) p.set("searchq", searchq);
    return p;
  }, [searchParams, searchq]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams(filterQs);
    p.set("page", String(page));
    p.set("limit", String(limit));
    return p.toString();
  }, [filterQs, page]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["demographic-learners", queryString],
    queryFn: () => getDemographicLearners(queryString),
    keepPreviousData: true,
  });

  const learners = data?.data?.learners ?? [];
  const pagination = data?.data?.pagination;
  const summary: IDemographicLearnersSummary | undefined = data?.data?.summary;
  const showAvgScore = !!searchParams.get("performanceBand") || learners.some((l) => l.avgScore != null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.loading("Preparing Excel export…", { id: "learners-export" });
      const blob = await exportDemographicLearners(filterQs.toString());
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Learners_Export_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel exported", { id: "learners-export" });
    } catch (error: unknown) {
      let errMsg = "Failed to export Excel";
      const err = error as { response?: { data?: Blob | { message?: string } } };
      if (err?.response?.data instanceof Blob) {
        try {
          const json = JSON.parse(await err.response.data.text());
          if (json?.message) errMsg = json.message;
        } catch {
          /* ignore */
        }
      } else if (err?.response?.data && typeof err.response.data === "object" && "message" in err.response.data) {
        errMsg = String(err.response.data.message);
      }
      toast.error(errMsg, { id: "learners-export" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={V2_PAGE_CANVAS}>
      <V2PageHeader
        title='Learners'
        subtitle='Learner details by location, gender, age and performance, with Excel export'
      />
      <div className={`${V2_CARD_SHELL} p-3 space-y-3`}>
        <div className='flex flex-col lg:flex-row lg:items-center gap-2'>
          <V2SearchInput
            value={searchInput}
            onChange={(v) => {
              setSearchInput(v);
              debouncedSearch(v);
            }}
            placeholder='Search by name, phone or NID…'
            className='w-full lg:w-72'
          />
          <div className='flex flex-1 flex-wrap items-center gap-2'>
            <select value={district} onChange={(e) => setFilter("district", e.target.value)} className={SELECT}>
              <option value=''>All districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={searchParams.get("sector") ?? ""}
              onChange={(e) => setFilter("sector", e.target.value)}
              disabled={!district}
              className={`${SELECT} disabled:opacity-50`}
              title={district ? undefined : "Choose a district first"}
            >
              <option value=''>All sectors</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select value={searchParams.get("gender") ?? ""} onChange={(e) => setFilter("gender", e.target.value)} className={SELECT}>
              <option value=''>All genders</option>
              <option value='Female'>Female</option>
              <option value='Male'>Male</option>
            </select>
            <select value={searchParams.get("ageGroup") ?? ""} onChange={(e) => setFilter("ageGroup", e.target.value)} className={SELECT}>
              <option value=''>All ages</option>
              {AGE_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a} years
                </option>
              ))}
            </select>
            <select
              value={searchParams.get("courseId") ?? ""}
              onChange={(e) => setFilter("courseId", e.target.value)}
              className={`${SELECT} max-w-[14rem]`}
            >
              <option value=''>All courses</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortName?.trim() || c.title}
                </option>
              ))}
            </select>
            <select
              value={searchParams.get("performanceBand") ?? ""}
              onChange={(e) => setFilter("performanceBand", e.target.value)}
              className={SELECT}
            >
              <option value=''>All scores</option>
              {BAND_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
            <select value={searchParams.get("status") ?? ""} onChange={(e) => setFilter("status", e.target.value)} className={SELECT}>
              <option value=''>All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <button type='button' onClick={handleExport} disabled={isExporting || isLoading} className={`${V2_BTN_SECONDARY} shrink-0`}>
            {isExporting ? <Loader2 className='w-4 h-4 animate-spin' /> : <FileSpreadsheet className='w-4 h-4 text-emerald-600' />}
            Export Excel
          </button>
        </div>

        {hasFilters && (
          <div className='flex flex-wrap items-center gap-2'>
            {activeDrilldowns.map((key) => (
              <span key={key} className={`${V2_PILL} bg-[#EBF0F9] text-[#3363AD] dark:bg-slate-700 dark:text-blue-300`}>
                {DRILLDOWN_FILTERS[key]}: {key === "healthCenterId" ? "selected" : searchParams.get(key)}
                <button type='button' onClick={() => setFilter(key, "")} title='Remove filter'>
                  <X className='w-3 h-3' />
                </button>
              </span>
            ))}
            {data?.data?.filters?.courseName && (
              <span className={`text-xs ${V2_MUTED}`}>Course: {data.data.filters.courseName}</span>
            )}
            <button type='button' onClick={clearFilters} className='text-xs font-bold text-[#3363AD] dark:text-blue-300 hover:underline'>
              Clear all filters
            </button>
            {isFetching && !isLoading && <span className={`text-xs ${V2_MUTED}`}>Updating…</span>}
          </div>
        )}
      </div>

      {isLoading && !summary ? (
        <V2KpiSkeleton count={6} />
      ) : summary ? (
        <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
          <V2KpiCard label='Learners' value={summary.total.toLocaleString()} Icon={Users} sub={`${summary.active.toLocaleString()} active`} />
          <V2KpiCard
            label='Active'
            value={summary.active.toLocaleString()}
            Icon={CheckCircle2}
            accent='text-emerald-600 dark:text-emerald-400'
            sub={`${(summary.inactive + summary.suspended).toLocaleString()} inactive / suspended`}
          />
          <V2KpiCard
            label='Completed'
            value={summary.completed.toLocaleString()}
            Icon={CheckCircle2}
            accent='text-purple-600 dark:text-purple-400'
            sub={`${summary.completionRate}% of learners`}
          />
          <V2KpiCard
            label='Certified'
            value={summary.certified.toLocaleString()}
            Icon={Award}
            accent='text-amber-500 dark:text-amber-400'
            sub={`${summary.certificationRate}% of completed`}
          />
          <V2KpiCard
            label='Female / Male'
            value={`${summary.female.toLocaleString()} / ${summary.male.toLocaleString()}`}
            Icon={Users}
            sub={summary.otherGender > 0 ? `${summary.otherGender} other / unknown` : undefined}
          />
          <V2KpiCard
            label='Avg score'
            value={summary.avgScore != null ? `${summary.avgScore}%` : "—"}
            Icon={Award}
            sub={summary.avgScore != null ? "For the selected score band" : "Choose a score band to see it"}
          />
        </div>
      ) : null}

      <div className={`${V2_CARD_SHELL} overflow-hidden`}>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm min-w-[1300px]'>
            <thead className={V2_TABLE_HEAD}>
              <tr className='text-left'>
                <th className='px-4 py-2.5'>Name</th>
                <th className='px-3 py-2.5'>Phone</th>
                <th className='px-3 py-2.5'>Gender</th>
                <th className='px-3 py-2.5'>Age</th>
                <th className='px-3 py-2.5'>Location</th>
                <th className='px-3 py-2.5'>Health center</th>
                <th className='px-3 py-2.5'>Role</th>
                <th className='px-3 py-2.5'>Status</th>
                <th className='px-3 py-2.5'>NID</th>
                <th className='px-3 py-2.5'>Email</th>
                <th className='px-3 py-2.5 text-right'>Courses</th>
                {showAvgScore && <th className='px-3 py-2.5 text-right'>Avg score</th>}
                <th className='px-3 py-2.5'>Completed</th>
                <th className='px-3 py-2.5 text-right'>Certificates</th>
                <th className='px-3 py-2.5'>Registered</th>
                <th className='px-4 py-2.5'>Last login</th>
              </tr>
            </thead>
            <tbody className={V2_TABLE_BODY}>
              {isLoading ? (
                <tr>
                  <td colSpan={16} className={`px-4 py-12 text-center text-sm ${V2_MUTED}`}>
                    Loading learners…
                  </td>
                </tr>
              ) : learners.length === 0 ? (
                <tr>
                  <td colSpan={16} className={`px-4 py-14 text-center ${V2_MUTED}`}>
                    <Award className='w-10 h-10 mx-auto mb-2 opacity-40' />
                    <p className={`font-bold ${V2_STRONG}`}>No learners found</p>
                    <p className='text-sm mt-1'>Try changing the search or filters</p>
                  </td>
                </tr>
              ) : (
                learners.map((row: IDemographicLearner) => (
                  <tr key={row.id} onClick={() => navigate(`/chw/${row.id}`)} className={`${V2_TABLE_ROW} cursor-pointer`}>
                    <td className='px-4 py-2.5'>
                      <div className='flex items-center gap-2.5 min-w-[150px]'>
                        <img src={row.photo} alt='' className='w-8 h-8 rounded-full object-cover bg-gray-100 shrink-0' />
                        <span className={`font-semibold ${V2_STRONG}`}>{row.fullNames}</span>
                      </div>
                    </td>
                    <td className={`px-3 py-2.5 whitespace-nowrap ${V2_MUTED}`}>{row.phoneNumber}</td>
                    <td className={`px-3 py-2.5 ${V2_MUTED}`}>{row.gender}</td>
                    <td className={`px-3 py-2.5 whitespace-nowrap ${V2_MUTED}`}>
                      {row.age != null ? `${row.age} (${row.ageGroup})` : row.ageGroup}
                    </td>
                    <td className={`px-3 py-2.5 max-w-[200px] ${V2_MUTED}`}>
                      <div className='truncate' title={[row.district, row.sector, row.cell, row.village].filter(Boolean).join(" / ")}>
                        {[row.district, row.sector, row.cell, row.village].filter(Boolean).join(" · ")}
                      </div>
                    </td>
                    <td className={`px-3 py-2.5 max-w-[140px] truncate ${V2_MUTED}`}>{row.healthCenterName || "—"}</td>
                    <td className={`px-3 py-2.5 ${V2_MUTED}`}>{row.role}</td>
                    <td className='px-3 py-2.5'>
                      <span className={`${V2_PILL} ${STATUS_TONE[row.status] ?? STATUS_TONE.INACTIVE}`}>{row.status}</span>
                    </td>
                    <td className={`px-3 py-2.5 whitespace-nowrap ${V2_MUTED}`}>{row.NID || "—"}</td>
                    <td className={`px-3 py-2.5 max-w-[140px] truncate ${V2_MUTED}`}>{row.email || "—"}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${V2_MUTED}`}>{row.enrolledCourses}</td>
                    {showAvgScore && (
                      <td className={`px-3 py-2.5 text-right font-semibold tabular-nums ${V2_STRONG}`}>
                        {row.avgScore != null ? `${row.avgScore}%` : "—"}
                      </td>
                    )}
                    <td className={`px-3 py-2.5 ${V2_MUTED}`}>{row.hasCompletedModule ? "Yes" : "No"}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${V2_MUTED}`}>{row.certificates}</td>
                    <td className={`px-3 py-2.5 whitespace-nowrap ${V2_MUTED}`}>{formatDate(row.registeredAt)}</td>
                    <td className={`px-4 py-2.5 whitespace-nowrap ${V2_MUTED}`}>{formatDate(row.lastLoginAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && (
          <div className='flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[rgba(51,99,173,0.12)] dark:border-slate-700'>
            <p className={`text-sm ${V2_MUTED}`}>
              {pagination.total.toLocaleString()} learner{pagination.total === 1 ? "" : "s"}
              {pagination.totalPages > 1 ? ` · Page ${pagination.page} of ${pagination.totalPages}` : null}
            </p>
            {pagination.totalPages > 1 && (
              <div className='flex gap-2'>
                <button
                  type='button'
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={`${V2_BTN_SECONDARY} px-3 py-1.5 disabled:opacity-40`}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  type='button'
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className={`${V2_BTN_SECONDARY} px-3 py-1.5 disabled:opacity-40`}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DemographicLearnersPage;
