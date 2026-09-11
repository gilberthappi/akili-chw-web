import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import { getDashboardV2Kpis } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";
import type { AdminKpiCardModel } from "@/components/dashboard/v2/widgets/admin/AdminKpiCardsV2";

export const useAdminDashboardV2Kpis = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  enabled: boolean = true,
) => {
  const qs = buildDashboardFilterQuery(filters);
  const filterKey = dashboardFilterKey(filters);

  const query = useQuery({
    queryKey: dashboardKeys.v2Kpis(filterKey),
    queryFn: async (): Promise<AdminKpiCardModel[]> => {
      const res = await getDashboardV2Kpis(qs);
      return (res?.data?.cards as AdminKpiCardModel[]) ?? [];
    },
    enabled,
    keepPreviousData: true,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  return {
    cards: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? "Failed to load dashboard KPIs." : null,
    refetch: () => {
      void query.refetch();
    },
  };
};
