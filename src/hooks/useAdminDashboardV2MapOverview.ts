import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import { getDashboardV2MapOverview } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

export type MapDistrictOverview = {
  district: string;
  totalChws: number;
  enrollments: number;
  completions: number;
  completionRate: number;
  certifications: number;
  certificationRate: number;
  healthCentersCount: number;
  avgFinalTestScore: number;
  avgFinalExamScore: number;
};

export type MapOverviewModel = {
  districts: MapDistrictOverview[];
};

export const useAdminDashboardV2MapOverview = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  enabled: boolean = true,
) => {
  const qs = buildDashboardFilterQuery(filters);
  const filterKey = dashboardFilterKey(filters);

  const query = useQuery({
    queryKey: dashboardKeys.v2MapOverview(filterKey),
    queryFn: async (): Promise<MapOverviewModel> => {
      const res = await getDashboardV2MapOverview(qs);
      return res?.data ?? { districts: [] };
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
    districts: query.data?.districts ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? "Failed to load map overview." : null,
    refetch: () => {
      void query.refetch();
    },
  };
};
