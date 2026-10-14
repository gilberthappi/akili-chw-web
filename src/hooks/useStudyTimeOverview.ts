import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import { getStudyTimeOverview } from "@/services/studyTime.service";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";

export const useStudyTimeOverview = (filters: IDashboardFilters, days: number) => {
  const qs = buildDashboardFilterQuery(filters);
  const query = useQuery({
    queryKey: ["study-time", "overview", ...dashboardFilterKey(filters), days],
    queryFn: async () => (await getStudyTimeOverview(qs, days)).data,
    keepPreviousData: true,
    staleTime: 60_000,
  });
  return { data: query.data, isLoading: query.isLoading, isError: query.isError };
};
