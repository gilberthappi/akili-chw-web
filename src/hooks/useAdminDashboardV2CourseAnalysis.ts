import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import {
  CourseAnalysisData,
  CourseAnalysisTab,
  getDashboardV2CourseAnalysis,
} from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

export type {
  CourseAnalysisData,
  CourseAnalysisLearner,
  CourseAnalysisTab,
} from "@/services/analytics.service";

type Options = {
  courseId: string;
  tab?: CourseAnalysisTab;
  searchq?: string;
  page?: number;
  limit?: number;
  timeframe?: string;
  filters?: IDashboardFilters;
  enabled?: boolean;
};

export const useAdminDashboardV2CourseAnalysis = ({
  courseId,
  tab = "all",
  searchq = "",
  page = 1,
  limit = 25,
  timeframe = "monthly",
  filters = DEFAULT_DASHBOARD_FILTERS,
  enabled = true,
}: Options) => {
  const baseQs = buildDashboardFilterQuery(filters);
  const params = new URLSearchParams(baseQs ? baseQs.replace(/^\?/, "") : "");
  params.set("courseId", courseId);
  params.set("tab", tab);
  params.set("page", String(page));
  params.set("limit", String(limit));
  params.set("timeframe", timeframe);
  if (searchq.trim()) params.set("searchq", searchq.trim());
  const qs = params.toString();

  const filterKey = [
    courseId,
    tab,
    searchq,
    String(page),
    String(limit),
    timeframe,
    ...dashboardFilterKey(filters),
  ];

  const query = useQuery({
    queryKey: dashboardKeys.v2CourseAnalysis(filterKey),
    queryFn: async (): Promise<CourseAnalysisData | null> => {
      const res = await getDashboardV2CourseAnalysis(qs);
      return res?.data ?? null;
    },
    enabled: enabled && !!courseId,
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
    error: query.error ? "Failed to load course analysis." : null,
    refetch: () => {
      void query.refetch();
    },
  };
};
