import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import { getDashboardV2Engagement } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

export type EngagementTimeframe = "today" | "week" | "month" | "year";

export type EngagementDomainModel = {
  key: string;
  name: string;
  color: string;
};

export type EngagementChartModel = {
  timeframe: EngagementTimeframe;
  domains: EngagementDomainModel[];
  series: Array<Record<string, string | number>>;
  yMax: number;
};

const timeframeToQuery = (label: string): EngagementTimeframe => {
  const v = label.trim().toLowerCase();
  if (v === "today") return "today";
  if (v === "this week") return "week";
  if (v === "this month") return "month";
  return "year";
};

export const useAdminDashboardV2Engagement = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  timeframeLabel: string = "This Year",
  enabled: boolean = true,
) => {
  const timeframe = timeframeToQuery(timeframeLabel);
  const baseQs = buildDashboardFilterQuery(filters);
  const qs = baseQs
    ? `${baseQs}&timeframe=${encodeURIComponent(timeframe)}`
    : `timeframe=${encodeURIComponent(timeframe)}`;
  const filterKey = [...dashboardFilterKey(filters), timeframe];

  const query = useQuery({
    queryKey: dashboardKeys.v2Engagement(filterKey),
    queryFn: async (): Promise<EngagementChartModel> => {
      const res = await getDashboardV2Engagement(qs);
      return (
        res?.data ?? {
          timeframe,
          domains: [],
          series: [],
          yMax: 50,
        }
      );
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
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? "Failed to load engagement chart." : null,
    refetch: () => {
      void query.refetch();
    },
  };
};
