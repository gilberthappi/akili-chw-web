import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import { getDashboardV2EnrollmentTrends } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

export type EnrollmentTrendsTimeframe = "weekly" | "monthly" | "quarterly";

export type EnrollmentTrendPoint = {
  label: string;
  activeEnrollments: number;
  certifications: number;
  enrollments: number;
  completions: number;
};

export type EnrollmentTrendsModel = {
  timeframe: EnrollmentTrendsTimeframe;
  series: EnrollmentTrendPoint[];
};

const timeframeToQuery = (label: string): EnrollmentTrendsTimeframe => {
  const v = label.trim().toLowerCase();
  if (v === "weekly") return "weekly";
  if (v === "quarterly") return "quarterly";
  return "monthly";
};

export const useAdminDashboardV2EnrollmentTrends = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  timeframeLabel: string = "Monthly",
  enabled: boolean = true,
) => {
  const timeframe = timeframeToQuery(timeframeLabel);
  const baseQs = buildDashboardFilterQuery(filters);
  const qs = baseQs
    ? `${baseQs}&timeframe=${encodeURIComponent(timeframe)}`
    : `timeframe=${encodeURIComponent(timeframe)}`;
  const filterKey = [...dashboardFilterKey(filters), timeframe];

  const query = useQuery({
    queryKey: dashboardKeys.v2EnrollmentTrends(filterKey),
    queryFn: async (): Promise<EnrollmentTrendsModel> => {
      const res = await getDashboardV2EnrollmentTrends(qs);
      return res?.data ?? { timeframe, series: [] };
    },
    enabled,
    keepPreviousData: true,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  return {
    data: query.data,
    series: query.data?.series ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? "Failed to load enrollment trends." : null,
    refetch: () => {
      void query.refetch();
    },
  };
};
