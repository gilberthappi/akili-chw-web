import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import { getDashboardV2Certificates } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

export type CertificatesTimeframe =
  | "today"
  | "week"
  | "month"
  | "year"
  | "all";

export type CertificateRowModel = {
  key: string;
  name: string;
  color: string;
  courseId: string;
  avgAttempts: number;
  certificates: number;
  downloads: number;
};

export type CertificatesModel = {
  timeframe: CertificatesTimeframe;
  total: number;
  rows: CertificateRowModel[];
};

const timeframeToQuery = (label: string): CertificatesTimeframe => {
  const v = label.trim().toLowerCase();
  if (v === "today") return "today";
  if (v === "this week") return "week";
  if (v === "this month") return "month";
  if (v === "this year") return "year";
  return "all";
};

export const useAdminDashboardV2Certificates = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  timeframeLabel: string = "All Time",
  enabled: boolean = true,
) => {
  const timeframe = timeframeToQuery(timeframeLabel);
  const baseQs = buildDashboardFilterQuery(filters);
  const qs = baseQs
    ? `${baseQs}&timeframe=${encodeURIComponent(timeframe)}`
    : `timeframe=${encodeURIComponent(timeframe)}`;
  const filterKey = [...dashboardFilterKey(filters), timeframe];

  const query = useQuery({
    queryKey: dashboardKeys.v2Certificates(filterKey),
    queryFn: async (): Promise<CertificatesModel> => {
      const res = await getDashboardV2Certificates(qs);
      return (
        res?.data ?? {
          timeframe,
          total: 0,
          rows: [],
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
    error: query.error ? "Failed to load certificates." : null,
    refetch: () => {
      void query.refetch();
    },
  };
};
