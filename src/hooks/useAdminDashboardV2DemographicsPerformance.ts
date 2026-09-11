import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { IDashboardFilters } from "@/types";
import { getDashboardV2DemographicsPerformance } from "@/services/analytics.service";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import {
  buildDashboardFilterQuery,
  dashboardFilterKey,
} from "@/utils/dashboardFilterQuery";
import { dashboardKeys } from "@/utils/constants/queryKeys";

export type DemographicsPeriod = "weekly" | "monthly" | "yearly";

export type DemographicsPerformanceRow = {
  id: string;
  title: string;
  level: string;
  coverIcon: string;
  enrollment: number;
  completion: number;
  avgCompletionTime: string;
  preTest: string;
  midTest: string;
  postTest: string;
  certificate: number;
};

export type DemographicsLocalFilters = {
  gender: string;
  ageGroup: string;
  educationLevel: string;
  district: string;
  healthCenterId: string;
};

export type DemographicsPerformanceModel = {
  period: DemographicsPeriod;
  rows: DemographicsPerformanceRow[];
};

const periodToQuery = (label: string): DemographicsPeriod => {
  const v = label.trim().toLowerCase();
  if (v === "weekly") return "weekly";
  if (v === "yearly") return "yearly";
  return "monthly";
};

/** Merge global + local; global gender/district/HC always win when set. */
export const resolveDemographicsFilters = (
  global: IDashboardFilters,
  local: DemographicsLocalFilters,
): IDashboardFilters & DemographicsLocalFilters => ({
  ...global,
  gender: global.gender || local.gender,
  district: global.district || local.district,
  healthCenterId: global.healthCenterId || local.healthCenterId,
  ageGroup: local.ageGroup,
  educationLevel: local.educationLevel,
});

export const useAdminDashboardV2DemographicsPerformance = (
  filters: IDashboardFilters = DEFAULT_DASHBOARD_FILTERS,
  local: DemographicsLocalFilters,
  periodLabel: string = "Monthly",
  enabled: boolean = true,
) => {
  const period = periodToQuery(periodLabel);
  const effective = useMemo(
    () => resolveDemographicsFilters(filters, local),
    [filters, local],
  );

  const baseQs = buildDashboardFilterQuery(effective);
  const extras = new URLSearchParams();
  if (effective.ageGroup) extras.set("ageGroup", effective.ageGroup);
  if (effective.educationLevel) {
    extras.set("educationLevel", effective.educationLevel);
  }
  extras.set("period", period);
  const extraQs = extras.toString();
  const qs = baseQs ? `${baseQs}&${extraQs}` : extraQs;

  const filterKey = [
    ...dashboardFilterKey(effective),
    effective.ageGroup,
    effective.educationLevel,
    period,
  ];

  const query = useQuery({
    queryKey: dashboardKeys.v2DemographicsPerformance(filterKey),
    queryFn: async (): Promise<DemographicsPerformanceModel> => {
      const res = await getDashboardV2DemographicsPerformance(qs);
      return (
        res?.data ?? {
          period,
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
    rows: query.data?.rows ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error
      ? "Failed to load demographics performance."
      : null,
    refetch: () => {
      void query.refetch();
    },
  };
};
