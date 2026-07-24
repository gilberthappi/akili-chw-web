import { useQuery } from "@tanstack/react-query";
import {
  IHospital,
  ICommunicationsAnalytics,
  ISupervisorResponseRate,
  IRecommendedChapterInsight,
  IStudentRecommendationInsight,
  IDashboardFilters,
} from "@/types";
import { listAllHospitals } from "@/services/hospitals.service";
import {
  getCommunicationsAnalytics,
  getSupervisorResponseRate,
  getDashboardRecommendations,
} from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import { buildDashboardFilterQuery, dashboardFilterKey } from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

const DASHBOARD_CACHE_MS = 1000 * 60 * 30;

/** Hospitals for map / coverage — heavy N+1 backend; load when map is near viewport. */
export const useDashboardHospitals = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  enabled: boolean = true,
) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: dashboardKeys.hospitals(dashboardFilterKey(filters)),
    queryFn: async (): Promise<IHospital[]> => {
      const res = await listAllHospitals();
      return res?.data ?? [];
    },
    enabled,
    keepPreviousData: true,
    staleTime: DASHBOARD_CACHE_MS,
    gcTime: DASHBOARD_CACHE_MS,
  });

  return {
    hospitals: data ?? [],
    isLoading,
    isFetching,
    error: error ? "Failed to load hospitals." : null,
    refetch: () => {
      void refetch();
    },
  };
};

/** Full message-table scan — defer until communications card is visible. */
export const useDashboardCommunications = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  enabled: boolean = true,
) => {
  const qs = buildDashboardFilterQuery(filters);
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: dashboardKeys.communications(dashboardFilterKey(filters)),
    queryFn: async (): Promise<ICommunicationsAnalytics | null> => {
      const res = await getCommunicationsAnalytics(qs);
      return res?.data ?? null;
    },
    enabled,
    keepPreviousData: true,
    staleTime: DASHBOARD_CACHE_MS,
    gcTime: DASHBOARD_CACHE_MS,
  });

  return {
    communications: data ?? null,
    isLoading,
    isFetching,
    error: error ? "Failed to load communications." : null,
    refetch: () => {
      void refetch();
    },
  };
};

/** CHW↔supervisor chat scan — defer until card is visible. */
export const useDashboardSupervisorResponse = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  enabled: boolean = true,
) => {
  const qs = buildDashboardFilterQuery(filters);
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: dashboardKeys.supervisorResponse(dashboardFilterKey(filters)),
    queryFn: async (): Promise<ISupervisorResponseRate | null> => {
      const res = await getSupervisorResponseRate(qs);
      return res?.data ?? null;
    },
    enabled,
    keepPreviousData: true,
    staleTime: DASHBOARD_CACHE_MS,
    gcTime: DASHBOARD_CACHE_MS,
  });

  return {
    supervisorResponseRate: data ?? null,
    isLoading,
    isFetching,
    error: error ? "Failed to load supervisor response rate." : null,
    refetch: () => {
      void refetch();
    },
  };
};

/** Per-pair recommendation recompute — defer until card is visible. */
export const useDashboardRecommendations = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  enabled: boolean = true,
) => {
  const qs = buildDashboardFilterQuery(filters);
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: dashboardKeys.recommendations(dashboardFilterKey(filters)),
    queryFn: async (): Promise<{
      chapters: IRecommendedChapterInsight[];
      students: IStudentRecommendationInsight[];
    }> => {
      const res = await getDashboardRecommendations(qs);
      return {
        chapters: res?.data?.mostRecommendedChapters ?? [],
        students: res?.data?.studentsWithMostRecommendations ?? [],
      };
    },
    enabled,
    keepPreviousData: true,
    staleTime: DASHBOARD_CACHE_MS,
    gcTime: DASHBOARD_CACHE_MS,
  });

  return {
    chapters: data?.chapters ?? [],
    students: data?.students ?? [],
    isLoading,
    isFetching,
    error: error ? "Failed to load recommendations." : null,
    refetch: () => {
      void refetch();
    },
  };
};
