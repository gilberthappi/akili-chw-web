import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import { getDashboardV2KnowledgeGain } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

export type KnowledgeGainRow = {
  id: string;
  idNo: string;
  name: string;
  course: string;
  healthCenter: string;
  preScore: number;
  postScore: number;
  gain: number;
};

export type KnowledgeGainChartPoint = {
  label: string;
  courseId: string;
  preTest: number;
  postTest: number;
  gain: number;
  sampleSize: number;
};

export type KnowledgeGainModel = {
  rows: KnowledgeGainRow[];
  chart: KnowledgeGainChartPoint[];
};

export const useAdminDashboardV2KnowledgeGain = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  enabled: boolean = true,
) => {
  const qs = buildDashboardFilterQuery(filters);
  const filterKey = dashboardFilterKey(filters);

  const query = useQuery({
    queryKey: dashboardKeys.v2KnowledgeGain(filterKey),
    queryFn: async (): Promise<KnowledgeGainModel> => {
      const res = await getDashboardV2KnowledgeGain(qs);
      return res?.data ?? { rows: [], chart: [] };
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
    rows: query.data?.rows ?? [],
    chart: query.data?.chart ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? "Failed to load knowledge gain." : null,
    refetch: () => {
      void query.refetch();
    },
  };
};
