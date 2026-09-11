import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import { getDashboardV2ProgramCourses } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

export type ProgramCourseItemModel = {
  id: string;
  title: string;
  iconColor: string;
  chapters: number;
  sections: number;
  mediaFiles: number;
  questions: number;
  enrollments: number;
  attempts: number;
  certificates: number;
  growth: string;
  growthPositive: boolean;
  createdAt: string;
};

export type ProgramCoursesModel = {
  totalCount: number;
  items: ProgramCourseItemModel[];
};

const sortToQuery = (label: string): "recent" | "enrolled" => {
  const v = label.trim().toLowerCase();
  if (v.includes("enroll")) return "enrolled";
  return "recent";
};

export const useAdminDashboardV2ProgramCourses = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  sortLabel: string = "Recently added",
  enabled: boolean = true,
) => {
  const sort = sortToQuery(sortLabel);
  const baseQs = buildDashboardFilterQuery(filters);
  const qs = baseQs
    ? `${baseQs}&sort=${encodeURIComponent(sort)}`
    : `sort=${encodeURIComponent(sort)}`;
  const filterKey = [...dashboardFilterKey(filters), sort];

  const query = useQuery({
    queryKey: dashboardKeys.v2ProgramCourses(filterKey),
    queryFn: async (): Promise<ProgramCoursesModel> => {
      const res = await getDashboardV2ProgramCourses(qs);
      return (
        res?.data ?? {
          totalCount: 0,
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
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? "Failed to load program courses." : null,
    refetch: () => {
      void query.refetch();
    },
  };
};
