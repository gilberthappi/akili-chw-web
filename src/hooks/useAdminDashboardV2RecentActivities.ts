import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import { getDashboardV2RecentActivities } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

export type RecentActivityItem = {
  id: string;
  text: string;
  time: string;
  timestamp: string;
};

export type RecentActivitiesModel = {
  group: string;
  items: RecentActivityItem[];
};

export const useAdminDashboardV2RecentActivities = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  enabled: boolean = true,
) => {
  const qs = buildDashboardFilterQuery(filters);
  const filterKey = dashboardFilterKey(filters);

  const query = useQuery({
    queryKey: dashboardKeys.v2RecentActivities(filterKey),
    queryFn: async (): Promise<RecentActivitiesModel> => {
      const res = await getDashboardV2RecentActivities(qs);
      return (
        res?.data ?? {
          group: "Recent",
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
    group: query.data?.group ?? "Recent",
    items: query.data?.items ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? "Failed to load recent activities." : null,
    refetch: () => {
      void query.refetch();
    },
  };
};
