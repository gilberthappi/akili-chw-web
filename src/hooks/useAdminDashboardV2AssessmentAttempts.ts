import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import { getDashboardV2AssessmentAttempts } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

export type AssessmentAttemptBarModel = {
  key: "pre" | "mid" | "post" | "cert";
  name: string;
  tests: number;
  sharePercent: number;
  avgScore: number;
  variation: number;
  variationPositive: boolean;
};

export type AssessmentAttemptsModel = {
  totalTests: number;
  bars: AssessmentAttemptBarModel[];
  segments: Array<{ name: string; value: number; color: string }>;
};

export const useAdminDashboardV2AssessmentAttempts = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  enabled: boolean = true,
) => {
  const qs = buildDashboardFilterQuery(filters);
  const filterKey = dashboardFilterKey(filters);

  const query = useQuery({
    queryKey: dashboardKeys.v2AssessmentAttempts(filterKey),
    queryFn: async (): Promise<AssessmentAttemptsModel> => {
      const res = await getDashboardV2AssessmentAttempts(qs);
      return (
        res?.data ?? {
          totalTests: 0,
          bars: [],
          segments: [],
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
    error: query.error ? "Failed to load assessment attempts." : null,
    refetch: () => {
      void query.refetch();
    },
  };
};
