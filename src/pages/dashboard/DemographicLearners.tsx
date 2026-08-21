import { useMemo, useState, useCallback, FC } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import toast from "react-hot-toast";
import {
  Award,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Search,
  Users,
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

const buildSubtitle = (
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
  return parts.length > 0
    ? `Filtered by ${parts.join(" · ")}`
    : "Learners matching the selected dashboard filters";
};

function StatCard({
  label,
  value,
  color = "text-gray-900",
  sub,
}: {
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
}) {
  return (
    <div className='bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-0.5'>
      <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>
        {label}
      </p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub ? <p className='text-xs text-gray-400'>{sub}</p> : null}
    </div>
  );
}

const StatusBadge: FC<{ status: string }> = ({ status }) => {
  const tone =
    status === "ACTIVE"
      ? "bg-green-50 text-green-700"
      : status === "INACTIVE"
        ? "bg-gray-100 text-gray-600"
        : status === "SUSPENDED"
          ? "bg-amber-50 text-amber-700"
          : "bg-blue-50 text-blue-700";
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${tone}`}
    >
      {status}
    </span>
  );
};

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
  const subtitle = buildSubtitle(
    searchParams,
    data?.data?.filters?.courseName,
  );
  const showAvgScore =
    !!searchParams.get("performanceBand") ||
    learners.some((l) => l.avgScore != null);

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
      const err = error as {
        response?: { data?: Blob | { message?: string } };
      };
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
    <div className='w-full min-h-full bg-gray-50 p-6'>
      {/* Header */}
      <div className='mb-6 flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
            <Users className='w-6 h-6 text-blue-600' />
            Learners
          </h1>
          <p className='text-sm text-gray-500 mt-0.5'>
            {subtitle}
            {isFetching && !isLoading ? (
              <span className='ml-2 text-gray-400'>Updating…</span>
            ) : null}
          </p>
        </div>
        <button
          type='button'
          onClick={handleExport}
          disabled={isExporting || isLoading}
          className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0'
        >
          {isExporting ? (
            <span className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' />
          ) : (
            <FileSpreadsheet className='w-4 h-4 text-green-600' />
          )}
          Export Excel
        </button>
      </div>

      {/* Stats */}
      {isLoading && !summary ? (
        <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className='h-[96px] bg-white rounded-xl border border-gray-200 animate-pulse'
            />
          ))}
        </div>
      ) : summary ? (
        <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6'>
          <StatCard
            label='Total'
            value={summary.total.toLocaleString()}
            color='text-gray-900'
            sub={`${summary.active.toLocaleString()} active`}
          />
          <StatCard
            label='Active'
            value={summary.active.toLocaleString()}
            color='text-green-600'
            sub={`${summary.inactive + summary.suspended} inactive / suspended`}
          />
          <StatCard
            label='Completed'
            value={summary.completed.toLocaleString()}
            color='text-primary'
            sub={`${summary.completionRate}% of total`}
          />
          <StatCard
            label='Certified'
            value={summary.certified.toLocaleString()}
            color='text-primary'
            sub={`${summary.certificationRate}% of completed`}
          />
          <StatCard
            label='Female / Male'
            value={`${summary.female} / ${summary.male}`}
            color='text-gray-900'
            sub={
              summary.otherGender > 0
                ? `${summary.otherGender} other / unknown`
                : undefined
            }
          />
          <StatCard
            label='Avg score'
            value={
              summary.avgScore != null ? `${summary.avgScore}%` : "—"
            }
            color='text-gray-900'
            sub={
              summary.avgScore != null
                ? "Performance band average"
                : showAvgScore
                  ? "See table for scores"
                  : undefined
            }
          />
        </div>
      ) : null}

      {/* Search */}
      <div className='flex gap-3 mb-5'>
        <div className='relative flex-1 max-w-md'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
          <input
            type='search'
            placeholder='Search by name, phone, or NID…'
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              debouncedSearch(e.target.value);
            }}
            className='w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
          />
        </div>
      </div>

      {/* Table */}
      <div className='bg-white border border-gray-200 rounded-xl overflow-hidden'>
        {isLoading ? (
          <div className='flex items-center justify-center h-48 text-sm text-gray-400'>
            Loading learners…
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm min-w-[1100px]'>
              <thead>
                <tr className='border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500'>
                  <th className='px-4 py-3'>Name</th>
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
                  <th className='px-4 py-3'>Last login</th>
                </tr>
              </thead>
              <tbody>
                {learners.length === 0 ? (
                  <tr>
                    <td
                      colSpan={showAvgScore ? 17 : 16}
                      className='px-4 py-16 text-center text-gray-400'
                    >
                      <Award className='w-10 h-10 mx-auto mb-2 opacity-40' />
                      <p className='font-medium text-gray-500'>
                        No learners found
                      </p>
                      <p className='text-sm mt-1'>
                        Try adjusting search or dashboard filters
                      </p>
                    </td>
                  </tr>
                ) : (
                  learners.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => openStudent(row)}
                      className='border-b border-gray-100 hover:bg-blue-50/40 cursor-pointer transition-colors last:border-0'
                    >
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-2.5 min-w-[150px]'>
                          <img
                            src={row.photo}
                            alt=''
                            className='w-8 h-8 rounded-full object-cover bg-gray-100 shrink-0'
                          />
                          <span className='font-medium text-gray-900'>
                            {row.fullNames}
                          </span>
                        </div>
                      </td>
                      <td className='px-3 py-3 text-gray-600 whitespace-nowrap'>
                        {row.phoneNumber}
                      </td>
                      <td className='px-3 py-3 text-gray-600'>{row.gender}</td>
                      <td className='px-3 py-3 text-gray-600 whitespace-nowrap'>
                        {row.age != null
                          ? `${row.age} (${row.ageGroup})`
                          : row.ageGroup}
                      </td>
                      <td className='px-3 py-3 text-gray-600 max-w-[200px]'>
                        <div
                          className='truncate'
                          title={`${row.district} / ${row.sector} / ${row.cell} / ${row.village}`}
                        >
                          {[row.district, row.sector, row.cell, row.village]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      </td>
                      <td className='px-3 py-3 text-gray-600 max-w-[140px] truncate'>
                        {row.healthCenterName || "—"}
                      </td>
                      <td className='px-3 py-3 text-gray-600'>{row.role}</td>
                      <td className='px-3 py-3'>
                        <StatusBadge status={row.status} />
                      </td>
                      <td className='px-3 py-3 text-gray-600 whitespace-nowrap'>
                        {row.NID || "—"}
                      </td>
                      <td className='px-3 py-3 text-gray-600 max-w-[140px] truncate'>
                        {row.email || "—"}
                      </td>
                      <td className='px-3 py-3 text-right text-gray-700'>
                        {row.enrolledCourses}
                      </td>
                      {showAvgScore ? (
                        <td className='px-3 py-3 text-right font-medium text-gray-800'>
                          {row.avgScore != null ? `${row.avgScore}%` : "—"}
                        </td>
                      ) : null}
                      <td className='px-3 py-3 text-gray-600'>
                        {row.hasCompletedModule ? "Yes" : "No"}
                      </td>
                      <td className='px-3 py-3 text-gray-600'>
                        {row.isCertified ? "Yes" : "No"}
                      </td>
                      <td className='px-3 py-3 text-right text-gray-600'>
                        {row.certificates}
                      </td>
                      <td className='px-3 py-3 text-gray-600 whitespace-nowrap'>
                        {formatDate(row.registeredAt)}
                      </td>
                      <td className='px-4 py-3 text-gray-600 whitespace-nowrap'>
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
          <div className='flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50'>
            <p className='text-sm text-gray-500'>
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
                  className='inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40'
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  type='button'
                  disabled={page >= pagination.totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  className='inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40'
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DemographicLearnersPage;
