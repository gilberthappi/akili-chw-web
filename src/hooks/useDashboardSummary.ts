import { useQuery } from "@tanstack/react-query";
import {
  IEnrollmentTrend,
  ICHWStats,
  IRecentActivityFeed,
  IMonthlyActiveTrends,
  ICertificationAnalytics,
  IDashboardStats,
  IDashboardFilters,
} from "@/types";
import { getDashboardSummary } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

const DASHBOARD_CACHE_MS = 0; // always refetch on mount/refresh

export interface DashboardSummaryShell {
  enrollmentTrends: IEnrollmentTrend[];
  chwStats: ICHWStats | null;
  recentActivity: IRecentActivityFeed | null;
  monthlyActiveTrends: IMonthlyActiveTrends | null;
  certification: ICertificationAnalytics | null;
  dashboardStats: IDashboardStats | null;
}

/** Shared first-paint summary query (deduped across dashboard hooks). */
export const useDashboardSummary = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  enabled: boolean = true,
) => {
  const qs = buildDashboardFilterQuery(filters);
  const filterKey = dashboardFilterKey(filters);

  return useQuery({
    queryKey: dashboardKeys.summary(filterKey),
    queryFn: async (): Promise<DashboardSummaryShell> => {
      const res = await getDashboardSummary(qs);
      const data = res?.data;
      return {
        enrollmentTrends: (data?.enrollmentTrends as IEnrollmentTrend[]) ?? [],
        chwStats: data?.chwStats ?? null,
        recentActivity: data?.recentActivity ?? null,
        monthlyActiveTrends: data?.monthlyActiveTrends ?? null,
        certification: data?.certification ?? null,
        dashboardStats: (data?.dashboardStats as IDashboardStats) ?? null,
      };
    },
    enabled,
    keepPreviousData: true,
    staleTime: DASHBOARD_CACHE_MS,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
};
