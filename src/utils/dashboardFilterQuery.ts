import { IDashboardFilters } from "@/types";

export const buildDashboardFilterQuery = (filters: IDashboardFilters): string => {
  const qsParams = new URLSearchParams();
  if (filters.district) qsParams.append("district", filters.district);
  if (filters.province) qsParams.append("province", filters.province);
  if (filters.gender) qsParams.append("gender", filters.gender);
  if (filters.role) qsParams.append("role", filters.role);
  if (filters.year) qsParams.append("year", filters.year);
  if (filters.month) qsParams.append("month", filters.month);
  if (filters.hospitalId) qsParams.append("hospitalId", filters.hospitalId);
  const qs = qsParams.toString();
  return qs ? `?${qs}` : "";
};
