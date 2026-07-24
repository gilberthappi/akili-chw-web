import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  IDashboardStats,
  ICourseAnalytics,
  IStudentAnalytics,
  IDashboardFilters,
} from "@/types";
import {
  getDashboardAdoption,
} from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";

const DASHBOARD_CACHE_MS = 1000 * 60 * 3;

interface DashboardData {
  dashboardStats: IDashboardStats | null;
  courseAnalytics: ICourseAnalytics | null;
  studentAnalytics: IStudentAnalytics | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDashboardStats = ({
  enabled,
  filters,
  /** When false, skip course/student analytics (provided by useAdoptionStats). */
  includeCourseStudent = true,
}: {
  enabled: boolean;
  filters?: IDashboardFilters;
  includeCourseStudent?: boolean;
}): DashboardData => {
  const { user } = useAuth();

  const userRoles = user?.roles
    ? Array.isArray(user.roles)
      ? user.roles
      : [user.roles]
    : [];

  const isContentManager = userRoles.some((r) =>
    ["ADMIN", "TRAINER", "STAFF"].includes(r),
  );

  const activeFilters = filters ?? DEFAULT_DASHBOARD_FILTERS;
  const fetchCourseStudent = includeCourseStudent && isContentManager;
  const qs = buildDashboardFilterQuery(activeFilters);
  const filterKey = dashboardFilterKey(activeFilters);

  const summaryQuery = useDashboardSummary(activeFilters, enabled);

  const deepQuery = useQuery({
    queryKey: [...dashboardKeys.stats(filterKey), "course-student"],
    queryFn: async () => {
      const res = await getDashboardAdoption(qs);
      return {
        courseAnalytics: res?.data?.courseAnalytics ?? null,
        studentAnalytics: res?.data?.studentAnalytics ?? null,
      };
    },
    enabled: enabled && fetchCourseStudent,
    keepPreviousData: true,
    staleTime: DASHBOARD_CACHE_MS,
    gcTime: DASHBOARD_CACHE_MS,
  });

  return {
    dashboardStats: summaryQuery.data?.dashboardStats ?? null,
    courseAnalytics: deepQuery.data?.courseAnalytics ?? null,
    studentAnalytics: deepQuery.data?.studentAnalytics ?? null,
    isLoading: summaryQuery.isLoading,
    isFetching: summaryQuery.isFetching || deepQuery.isFetching,
    error:
      summaryQuery.error || deepQuery.error
        ? "Failed to fetch data. Please try again."
        : null,
    refetch: () => {
      void summaryQuery.refetch();
      if (fetchCourseStudent) void deepQuery.refetch();
    },
  };
};
