import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import { getDashboardV2Schedule } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

export type ScheduleTimeframe = "today" | "week" | "month" | "year";

export type ScheduleMeetingItem = {
  id: string;
  time: string;
  badge: string;
  title: string;
  active: boolean;
  startAt: string;
};

export type ScheduleCalendarModel = {
  timeframe: ScheduleTimeframe;
  items: ScheduleMeetingItem[];
};

const timeframeToQuery = (label: string): ScheduleTimeframe => {
  const v = label.trim().toLowerCase();
  if (v === "today") return "today";
  if (v === "this week") return "week";
  if (v === "this month") return "month";
  return "year";
};

export const useAdminDashboardV2Schedule = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  timeframeLabel: string = "Today",
  enabled: boolean = true,
) => {
  const timeframe = timeframeToQuery(timeframeLabel);
  const baseQs = buildDashboardFilterQuery(filters);
  const qs = baseQs
    ? `${baseQs}&timeframe=${encodeURIComponent(timeframe)}`
    : `timeframe=${encodeURIComponent(timeframe)}`;
  const filterKey = [...dashboardFilterKey(filters), timeframe];

  const query = useQuery({
    queryKey: dashboardKeys.v2Schedule(filterKey),
    queryFn: async (): Promise<ScheduleCalendarModel> => {
      const res = await getDashboardV2Schedule(qs);
      return (
        res?.data ?? {
          timeframe,
          items: [],
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
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? "Failed to load schedule." : null,
    refetch: () => {
      void query.refetch();
    },
  };
};
