import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import {
  IDashboardStats,
  ICourseAnalytics,
  IStudentAnalytics,
  IDashboardFilters,
} from "@/types";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import { buildDashboardFilterQuery } from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

const DASHBOARD_CACHE_MS = 1000 * 60 * 30;

interface DashboardData {
  dashboardStats: IDashboardStats | null;
  courseAnalytics: ICourseAnalytics | null;
  studentAnalytics: IStudentAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface DashboardStatsResult {
  dashboardStats: IDashboardStats | null;
  courseAnalytics: ICourseAnalytics | null;
  studentAnalytics: IStudentAnalytics | null;
}

export const useDashboardStats = ({
  enabled,
  filters,
}: {
  enabled: boolean;
  filters?: IDashboardFilters;
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
  const qs = buildDashboardFilterQuery(activeFilters);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: dashboardKeys.stats(activeFilters),
    queryFn: async (): Promise<DashboardStatsResult> => {
      const [dashRes, courseRes, studentRes] = await Promise.allSettled([
        api.get(`/courses/dashboard/statistics${qs}`),
        isContentManager
          ? api.get(`/export/dashboard/course/analytics${qs}`)
          : Promise.resolve(null),
        isContentManager
          ? api.get(`/export/dashboard/student/analytics${qs}`)
          : Promise.resolve(null),
      ]);

      return {
        dashboardStats:
          dashRes.status === "fulfilled" ? dashRes.value?.data?.data ?? null : null,
        courseAnalytics:
          courseRes.status === "fulfilled" ? courseRes.value?.data?.data ?? null : null,
        studentAnalytics:
          studentRes.status === "fulfilled" ? studentRes.value?.data?.data ?? null : null,
      };
    },
    enabled,
    staleTime: DASHBOARD_CACHE_MS,
    gcTime: DASHBOARD_CACHE_MS,
  });

  return {
    dashboardStats: data?.dashboardStats ?? null,
    courseAnalytics: data?.courseAnalytics ?? null,
    studentAnalytics: data?.studentAnalytics ?? null,
    isLoading,
    error: error ? "Failed to fetch data. Please try again." : null,
    refetch: () => {
      void refetch();
    },
  };
};
