import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import { getDashboardV2AiRecommendations } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

export type AiRecommendedChapter = {
  chapterId: string;
  title: string;
  chapterNumber: number;
  recommendationCount: number;
  highSeverityCount: number;
  topReason: string;
};

export type AiRecommendationItem = {
  courseId: string;
  title: string;
  score: number;
  chapters: number;
  candidates: number;
  recommendedChapters: AiRecommendedChapter[];
};

export const useAdminDashboardV2AiRecommendations = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  enabled: boolean = true,
) => {
  const qs = buildDashboardFilterQuery(filters);
  const filterKey = dashboardFilterKey(filters);

  const query = useQuery({
    queryKey: dashboardKeys.v2AiRecommendations(filterKey),
    queryFn: async (): Promise<AiRecommendationItem[]> => {
      const res = await getDashboardV2AiRecommendations(qs);
      return res?.data?.items ?? [];
    },
    enabled,
    keepPreviousData: true,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? "Failed to load AI recommendations." : null,
    refetch: () => {
      void query.refetch();
    },
  };
};
