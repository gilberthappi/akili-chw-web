import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import { getDashboardV2CourseRatings } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

export type CourseRatingsSort = "most" | "least";

export type CourseRatingItem = {
  id: string;
  title: string;
  coverIcon: string;
  rating: number;
  reviewCount: number;
};

export type CourseRatingsModel = {
  sort: CourseRatingsSort;
  items: CourseRatingItem[];
};

const sortToQuery = (label: string): CourseRatingsSort => {
  const v = label.trim().toLowerCase();
  if (v.includes("least")) return "least";
  return "most";
};

export const useAdminDashboardV2CourseRatings = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  sortLabel: string = "Most rated",
  enabled: boolean = true,
) => {
  const sort = sortToQuery(sortLabel);
  const baseQs = buildDashboardFilterQuery(filters);
  const qs = baseQs
    ? `${baseQs}&sort=${encodeURIComponent(sort)}`
    : `sort=${encodeURIComponent(sort)}`;
  const filterKey = [...dashboardFilterKey(filters), sort];

  const query = useQuery({
    queryKey: dashboardKeys.v2CourseRatings(filterKey),
    queryFn: async (): Promise<CourseRatingsModel> => {
      const res = await getDashboardV2CourseRatings(qs);
      return res?.data ?? { sort, items: [] };
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
    error: query.error ? "Failed to load course ratings." : null,
    refetch: () => {
      void query.refetch();
    },
  };
};
