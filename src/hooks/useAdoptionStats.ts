import { useQuery } from "@tanstack/react-query";
import {
  IEnrollmentTrend,
  ITestScoreAnalytics,
  IDemographicsAnalytics,
  ICHWStats,
  ICourseAnalytics,
  IStudentAnalytics,
  ICourseDurationStats,
  IRecentActivityFeed,
  IMonthlyActiveTrends,
  ICertificationAnalytics,
  ICommunicationsAnalytics,
  IAvgStudyTimeByCourse,
  IDashboardFilters,
  IDashboardStats,
} from "@/types";
import { getDashboardAdoption } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import { buildDashboardFilterQuery, dashboardFilterKey } from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";

export type AnalyticsFilters = IDashboardFilters;

/**
 * Adoption section data.
 * Summary (shell KPIs) loads on mount; deep charts wait until `deepEnabled`
 * (section near viewport or idle after first paint).
 */
interface AdoptionStats {
  enrollmentTrends: IEnrollmentTrend[];
  avgStudyTimeByCourse: IAvgStudyTimeByCourse[];
  courseAnalytics: ICourseAnalytics | null;
  studentAnalytics: IStudentAnalytics | null;
  testScores: ITestScoreAnalytics | null;
  demographics: IDemographicsAnalytics | null;
  chwStats: ICHWStats | null;
  courseDuration: ICourseDurationStats | null;
  recentActivity: IRecentActivityFeed | null;
  monthlyActiveTrends: IMonthlyActiveTrends | null;
  certification: ICertificationAnalytics | null;
  communications: ICommunicationsAnalytics | null;
  dashboardStats: IDashboardStats | null;
  isLoading: boolean;
  isFetching: boolean;
  isDeepLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const DEEP_CACHE_MS = 1000 * 60 * 5;

interface DeepAdoption {
  enrollmentTrends: IEnrollmentTrend[];
  avgStudyTimeByCourse: IAvgStudyTimeByCourse[];
  courseAnalytics: ICourseAnalytics | null;
  studentAnalytics: IStudentAnalytics | null;
  testScores: ITestScoreAnalytics | null;
  demographics: IDemographicsAnalytics | null;
  courseDuration: ICourseDurationStats | null;
  certification: ICertificationAnalytics | null;
  communications: ICommunicationsAnalytics | null;
}

export const useAdoptionStats = (
  filters: AnalyticsFilters = DEFAULT_DASHBOARD_FILTERS,
  enabled: boolean = true,
  options?: { deepEnabled?: boolean },
): AdoptionStats => {
  const qs = buildDashboardFilterQuery(filters);
  const filterKey = dashboardFilterKey(filters);
  const deepEnabled = options?.deepEnabled ?? true;

  const summaryQuery = useDashboardSummary(filters, enabled);

  const deepQuery = useQuery({
    queryKey: dashboardKeys.adoption(filterKey),
    queryFn: async (): Promise<DeepAdoption> => {
      const res = await getDashboardAdoption(qs);
      const data = res?.data;
      return {
        enrollmentTrends: (data?.enrollmentTrends as IEnrollmentTrend[]) ?? [],
        avgStudyTimeByCourse:
          (data?.avgStudyTimeByCourse as IAvgStudyTimeByCourse[]) ?? [],
        courseAnalytics: data?.courseAnalytics ?? null,
        studentAnalytics: data?.studentAnalytics ?? null,
        testScores: data?.testScores ?? null,
        demographics: data?.demographics ?? null,
        courseDuration: data?.courseDuration ?? null,
        certification: data?.certification ?? null,
        communications: data?.communications ?? null,
      };
    },
    enabled: enabled && deepEnabled,
    keepPreviousData: true,
    staleTime: DEEP_CACHE_MS,
    gcTime: DEEP_CACHE_MS,
  });

  const shell = summaryQuery.data;
  const deep = deepQuery.data;

  return {
    enrollmentTrends: deep?.enrollmentTrends?.length
      ? deep.enrollmentTrends
      : shell?.enrollmentTrends ?? [],
    avgStudyTimeByCourse: deep?.avgStudyTimeByCourse ?? [],
    courseAnalytics: deep?.courseAnalytics ?? null,
    studentAnalytics: deep?.studentAnalytics ?? null,
    testScores: deep?.testScores ?? null,
    demographics: deep?.demographics ?? null,
    chwStats: shell?.chwStats ?? null,
    courseDuration: deep?.courseDuration ?? null,
    recentActivity: shell?.recentActivity ?? null,
    monthlyActiveTrends: shell?.monthlyActiveTrends ?? null,
    certification: deep?.certification ?? shell?.certification ?? null,
    communications: deep?.communications ?? null,
    dashboardStats: shell?.dashboardStats ?? null,
    isLoading: summaryQuery.isLoading,
    isFetching: summaryQuery.isFetching || deepQuery.isFetching,
    isDeepLoading: deepQuery.isLoading && deepEnabled,
    error:
      summaryQuery.error || deepQuery.error
        ? "Failed to fetch data. Please try again."
        : null,
    refetch: () => {
      void summaryQuery.refetch();
      if (deepEnabled) void deepQuery.refetch();
    },
  };
};
