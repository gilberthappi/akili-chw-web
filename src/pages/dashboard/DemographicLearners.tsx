import { useMemo, useState, useCallback, FC, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Search,
  Users,
  UserCheck,
  UsersRound,
  Gauge,
} from "lucide-react";
import {
  exportDemographicLearners,
  getDemographicLearners,
} from "@/services/analytics.service";
import { formatDate } from "@/utils/formats/formats";
import type {
  IDemographicLearner,
  IDemographicLearnersSummary,
} from "@/types";

const BAND_LABELS: Record<string, string> = {
  excellent: "Excellent (90–100%)",
  good: "Good (80–89%)",
  average: "Average (70–79%)",
  poor: "Poor (60–69%)",
  failing: "Failing (<60%)",
};

const buildTitle = (
  params: URLSearchParams,
  courseName?: string | null,
): string => {
  const parts: string[] = [];
  if (courseName) parts.push(courseName);
  else if (params.get("courseId")) parts.push("Course enrollments");

  const band = params.get("performanceBand");
  if (band) parts.push(BAND_LABELS[band.toLowerCase()] ?? band);

  if (params.get("district")) parts.push(params.get("district")!);
  if (params.get("gender")) parts.push(params.get("gender")!);
  if (params.get("ageGroup")) parts.push(`Age ${params.get("ageGroup")}`);
  if (params.get("province") && !params.get("district")) {
    parts.push(`${params.get("province")} province`);
  }
  if (params.get("role")) parts.push(params.get("role")!);
  return parts.length > 0 ? parts.join(" · ") : "All learners";
};

const FilterChip: FC<{ label: string }> = ({ label }) => (
  <span className='inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium text-[#3C3C43]/80 shadow-sm ring-1 ring-black/5 backdrop-blur'>
    {label}
  </span>
);

const StatCard: FC<{
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accent: string;
}> = ({ label, value, hint, icon, accent }) => (
  <div className='relative overflow-hidden rounded-[22px] bg-white/90 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] backdrop-blur-xl'>
    <div
      className={`absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-[0.12] ${accent}`}
    />
    <div className='flex items-start justify-between gap-3'>
      <div className='min-w-0'>
        <p className='text-[11px] font-semibold uppercase tracking-[0.04em] text-[#8E8E93]'>
          {label}
        </p>
        <p className='mt-1.5 text-[28px] font-semibold leading-none tracking-tight text-[#1C1C1E]'>
          {value}
        </p>
        {hint ? (
          <p className='mt-2 text-[12px] font-medium text-[#8E8E93]'>{hint}</p>
        ) : null}
      </div>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-white shadow-sm ${accent}`}
      >
        {icon}
      </div>
    </div>
  </div>
);

const StatusBadge: FC<{ status: string }> = ({ status }) => {
  const tone =
    status === "ACTIVE"
      ? "bg-[#34C759]/15 text-[#248A3D]"
      : status === "INACTIVE"
        ? "bg-[#8E8E93]/15 text-[#636366]"
        : status === "SUSPENDED"
          ? "bg-[#FF9F0A]/15 text-[#C93400]"
          : "bg-[#007AFF]/15 text-[#0051D4]";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone}`}
    >
      {status}
    </span>
  );
};

const BoolPill: FC<{ yes: boolean }> = ({ yes }) => (
  <span
    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      yes
        ? "bg-[#34C759]/15 text-[#248A3D]"
        : "bg-[#8E8E93]/12 text-[#8E8E93]"
    }`}
  >
    {yes ? "Yes" : "No"}
  </span>
);

const DemographicLearnersPage: FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
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

  const filterQs = useMemo(() => {
    const p = new URLSearchParams();
    for (const key of [
      "district",
      "province",
      "gender",
      "ageGroup",
      "courseId",
      "performanceBand",
      "role",
      "healthCenterId",
      "year",
      "month",
    ]) {
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
  }, [filterQs, page, limit]);

  const exportQs = useMemo(() => filterQs.toString(), [filterQs]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["demographic-learners", queryString],
    queryFn: () => getDemographicLearners(queryString),
  });

  const learners = data?.data?.learners ?? [];
  const pagination = data?.data?.pagination;
  const summary: IDemographicLearnersSummary | undefined = data?.data?.summary;
  const subtitle = buildTitle(searchParams, data?.data?.filters?.courseName);
  const showAvgScore =
    !!searchParams.get("performanceBand") ||
    learners.some((l) => l.avgScore != null);

  const chips = useMemo(() => {
    const list: string[] = [];
    if (data?.data?.filters?.courseName)
      list.push(data.data.filters.courseName);
    const band = searchParams.get("performanceBand");
    if (band) list.push(BAND_LABELS[band.toLowerCase()] ?? band);
    if (searchParams.get("district"))
      list.push(searchParams.get("district")!);
    else if (searchParams.get("province"))
      list.push(`${searchParams.get("province")} province`);
    if (searchParams.get("gender")) list.push(searchParams.get("gender")!);
    if (searchParams.get("ageGroup"))
      list.push(`Age ${searchParams.get("ageGroup")}`);
    if (searchParams.get("role")) list.push(searchParams.get("role")!);
    return list;
  }, [searchParams, data?.data?.filters?.courseName]);

  const openStudent = (row: IDemographicLearner) => {
    navigate(`/students/${row.id}`);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      toast.loading("Preparing Excel export…", { id: "learners-export" });
      const blob = await exportDemographicLearners(exportQs);
      const dateStr = new Date().toISOString().split("T")[0];
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Learners_Export_${dateStr}.xlsx`);
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
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json?.message) errMsg = json.message;
        } catch {
          /* ignore */
        }
      } else if (
        err?.response?.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
      ) {
        errMsg = String(err.response.data.message);
      }
      toast.error(errMsg, { id: "learners-export" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className='min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#F2F2F7] via-[#F2F2F7] to-[#E5E5EA]'>
      <div className='mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8'>
        {/* iOS-style large title header */}
        <div className='mb-5 flex flex-wrap items-start justify-between gap-4'>
          <div className='min-w-0'>
            <button
              type='button'
              onClick={() => navigate(-1)}
              className='mb-2 inline-flex items-center gap-1 text-[15px] font-medium text-[#007AFF] transition active:opacity-60'
            >
              <ArrowLeft size={18} strokeWidth={2.25} />
              Back
            </button>
            <h1 className='text-[34px] font-bold tracking-tight text-[#1C1C1E]'>
              Learners
            </h1>
            <p className='mt-1 max-w-2xl text-[15px] font-medium text-[#8E8E93]'>
              {subtitle}
              {isFetching && !isLoading ? (
                <span className='ml-2 text-[13px] text-[#AEAEB2]'>Updating…</span>
              ) : null}
            </p>
            {chips.length > 0 ? (
              <div className='mt-3 flex flex-wrap gap-2'>
                {chips.map((c) => (
                  <FilterChip key={c} label={c} />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Stats */}
        {isLoading && !summary ? (
          <div className='mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className='h-[108px] animate-pulse rounded-[22px] bg-white/70'
              />
            ))}
          </div>
        ) : summary ? (
          <div className='mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6'>
            <StatCard
              label='Total'
              value={summary.total.toLocaleString()}
              hint={`${summary.active.toLocaleString()} active`}
              icon={<Users size={18} />}
              accent='bg-[#007AFF]'
            />
            <StatCard
              label='Active'
              value={summary.active.toLocaleString()}
              hint={`${summary.inactive + summary.suspended} inactive / suspended`}
              icon={<UserCheck size={18} />}
              accent='bg-[#34C759]'
            />
            <StatCard
              label='Completed'
              value={summary.completed.toLocaleString()}
              hint={`${summary.completionRate}% of total`}
              icon={<CheckCircle2 size={18} />}
              accent='bg-[#5856D6]'
            />
            <StatCard
              label='Certified'
              value={summary.certified.toLocaleString()}
              hint={`${summary.certificationRate}% of completed`}
              icon={<Award size={18} />}
              accent='bg-[#FF9F0A]'
            />
            <StatCard
              label='Gender'
              value={`${summary.female} / ${summary.male}`}
              hint='Female / Male'
              icon={<UsersRound size={18} />}
              accent='bg-[#AF52DE]'
            />
            <StatCard
              label='Avg score'
              value={
                summary.avgScore != null ? `${summary.avgScore}%` : "—"
              }
              hint={
                summary.avgScore != null
                  ? "Band average"
                  : showAvgScore
                    ? "See table"
                    : "Not in this view"
              }
              icon={<Gauge size={18} />}
              accent='bg-[#FF2D55]'
            />
          </div>
        ) : null}

        {/* Table card */}
        <div className='overflow-hidden rounded-[24px] bg-white/95 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04]'>
          <div className='flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-3.5 sm:px-5'>
            <div className='relative min-w-[220px] flex-1 sm:max-w-sm'>
              <Search
                size={15}
                className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]'
              />
              <input
                type='search'
                placeholder='Search name, phone, NID…'
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  debouncedSearch(e.target.value);
                }}
                className='w-full rounded-2xl border-0 bg-[#F2F2F7] py-2.5 pl-10 pr-4 text-[14px] text-[#1C1C1E] placeholder:text-[#8E8E93] outline-none ring-0 transition focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,122,255,0.25)]'
              />
            </div>
            <button
              type='button'
              onClick={handleExport}
              disabled={isExporting || isLoading}
              className='inline-flex items-center gap-2 rounded-2xl bg-[#007AFF] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'
            >
              {isExporting ? (
                <span className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
              ) : (
                <FileSpreadsheet size={16} />
              )}
              Export Excel
            </button>
          </div>

          {isLoading ? (
            <div className='flex h-48 items-center justify-center text-[14px] text-[#8E8E93]'>
              Loading learners…
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full min-w-[1100px] text-left text-[13px]'>
                <thead>
                  <tr className='border-b border-black/[0.06] bg-[#F9F9FB] text-[11px] font-semibold uppercase tracking-[0.05em] text-[#8E8E93]'>
                    <th className='px-5 py-3'>Name</th>
                    <th className='px-3 py-3'>Phone</th>
                    <th className='px-3 py-3'>Gender</th>
                    <th className='px-3 py-3'>Age</th>
                    <th className='px-3 py-3'>Location</th>
                    <th className='px-3 py-3'>Health center</th>
                    <th className='px-3 py-3'>Role</th>
                    <th className='px-3 py-3'>Status</th>
                    <th className='px-3 py-3'>NID</th>
                    <th className='px-3 py-3'>Email</th>
                    <th className='px-3 py-3 text-right'>Courses</th>
                    {showAvgScore ? (
                      <th className='px-3 py-3 text-right'>Avg score</th>
                    ) : null}
                    <th className='px-3 py-3'>Completed</th>
                    <th className='px-3 py-3'>Certified</th>
                    <th className='px-3 py-3 text-right'>Certs</th>
                    <th className='px-3 py-3'>Registered</th>
                    <th className='px-5 py-3'>Last login</th>
                  </tr>
                </thead>
                <tbody>
                  {learners.length === 0 ? (
                    <tr>
                      <td
                        colSpan={showAvgScore ? 17 : 16}
                        className='px-5 py-16 text-center text-[15px] text-[#8E8E93]'
                      >
                        No learners match these filters
                      </td>
                    </tr>
                  ) : (
                    learners.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => openStudent(row)}
                        className='cursor-pointer border-b border-black/[0.04] transition-colors hover:bg-[#007AFF]/[0.04] active:bg-[#007AFF]/[0.08]'
                      >
                        <td className='px-5 py-3'>
                          <div className='flex min-w-[150px] items-center gap-2.5'>
                            <img
                              src={row.photo}
                              alt=''
                              className='h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-black/5'
                            />
                            <span className='font-semibold text-[#1C1C1E]'>
                              {row.fullNames}
                            </span>
                          </div>
                        </td>
                        <td className='whitespace-nowrap px-3 py-3 text-[#3C3C43]/80'>
                          {row.phoneNumber}
                        </td>
                        <td className='px-3 py-3 text-[#3C3C43]/80'>
                          {row.gender}
                        </td>
                        <td className='whitespace-nowrap px-3 py-3 text-[#3C3C43]/80'>
                          {row.age != null
                            ? `${row.age} (${row.ageGroup})`
                            : row.ageGroup}
                        </td>
                        <td className='max-w-[200px] px-3 py-3 text-[#3C3C43]/80'>
                          <div
                            className='truncate'
                            title={`${row.district} / ${row.sector} / ${row.cell} / ${row.village}`}
                          >
                            {[row.district, row.sector, row.cell, row.village]
                              .filter(Boolean)
                              .join(" · ")}
                          </div>
                        </td>
                        <td className='max-w-[140px] truncate px-3 py-3 text-[#3C3C43]/80'>
                          {row.healthCenterName || "—"}
                        </td>
                        <td className='px-3 py-3 text-[#3C3C43]/80'>
                          {row.role}
                        </td>
                        <td className='px-3 py-3'>
                          <StatusBadge status={row.status} />
                        </td>
                        <td className='whitespace-nowrap px-3 py-3 text-[#3C3C43]/80'>
                          {row.NID || "—"}
                        </td>
                        <td className='max-w-[140px] truncate px-3 py-3 text-[#3C3C43]/80'>
                          {row.email || "—"}
                        </td>
                        <td className='px-3 py-3 text-right font-medium text-[#1C1C1E]'>
                          {row.enrolledCourses}
                        </td>
                        {showAvgScore ? (
                          <td className='px-3 py-3 text-right font-semibold text-[#007AFF]'>
                            {row.avgScore != null ? `${row.avgScore}%` : "—"}
                          </td>
                        ) : null}
                        <td className='px-3 py-3'>
                          <BoolPill yes={row.hasCompletedModule} />
                        </td>
                        <td className='px-3 py-3'>
                          <BoolPill yes={row.isCertified} />
                        </td>
                        <td className='px-3 py-3 text-right text-[#3C3C43]/80'>
                          {row.certificates}
                        </td>
                        <td className='whitespace-nowrap px-3 py-3 text-[#3C3C43]/80'>
                          {formatDate(row.registeredAt)}
                        </td>
                        <td className='whitespace-nowrap px-5 py-3 text-[#3C3C43]/80'>
                          {formatDate(row.lastLoginAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {pagination ? (
            <div className='flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] bg-[#F9F9FB]/80 px-4 py-3 sm:px-5'>
              <p className='text-[13px] font-medium text-[#8E8E93]'>
                {pagination.total.toLocaleString()} learner
                {pagination.total === 1 ? "" : "s"}
                {pagination.totalPages > 1
                  ? ` · Page ${pagination.page} of ${pagination.totalPages}`
                  : null}
              </p>
              {pagination.totalPages > 1 ? (
                <div className='flex gap-2'>
                  <button
                    type='button'
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className='inline-flex items-center gap-1 rounded-xl bg-white px-3.5 py-2 text-[13px] font-semibold text-[#007AFF] shadow-sm ring-1 ring-black/5 transition active:scale-[0.98] disabled:opacity-40'
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button
                    type='button'
                    disabled={page >= pagination.totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    className='inline-flex items-center gap-1 rounded-xl bg-white px-3.5 py-2 text-[13px] font-semibold text-[#007AFF] shadow-sm ring-1 ring-black/5 transition active:scale-[0.98] disabled:opacity-40'
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DemographicLearnersPage;
