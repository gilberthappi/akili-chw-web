import type { IDashboardFilters } from "@/types";

export type LearnerListSlice = {
  district?: string;
  gender?: string;
  ageGroup?: string;
  courseId?: string;
  /** excellent | good | average | poor | failing */
  performanceBand?: string;
};

/** Build query string for the shared dashboard learners page. */
export function buildLearnerListSearch(
  filters: IDashboardFilters | undefined,
  slice: LearnerListSlice = {},
): string {
  const params = new URLSearchParams();

  const district =
    slice.district ?? (filters?.district ? filters.district : undefined);
  if (district) params.set("district", district);
  else if (filters?.province) params.set("province", filters.province);

  const gender = slice.gender ?? (filters?.gender || undefined);
  if (gender) params.set("gender", gender);

  if (slice.ageGroup) params.set("ageGroup", slice.ageGroup);
  if (slice.courseId) params.set("courseId", slice.courseId);
  if (slice.performanceBand)
    params.set("performanceBand", slice.performanceBand.toLowerCase());

  if (filters?.role) params.set("role", filters.role);
  if (filters?.healthCenterId)
    params.set("healthCenterId", filters.healthCenterId);
  if (filters?.year) params.set("year", filters.year);
  if (filters?.month) params.set("month", filters.month);

  return params.toString();
}

export const LEARNER_LIST_PATH = "/demographics/learners";
