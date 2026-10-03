import api from "./api";

export type AttendanceGranularity = "daily" | "weekly" | "monthly";
export type LearnerActivityStatus = "active" | "slowing" | "inactive";

export interface AttendanceFilters {
  district?: string;
  healthCenterId?: string;
  gender?: string;
}

export interface IActivenessWindow {
  active: number;
  total: number;
  ratio: number;
  previousRatio: number;
  change: number;
}

export interface IActivenessSummary {
  asOf: string;
  totalLearners: number;
  daily: IActivenessWindow;
  weekly: IActivenessWindow;
  monthly: IActivenessWindow;
  avgActiveDays30: number;
  statusCounts: Record<LearnerActivityStatus, number>;
  granularity: AttendanceGranularity;
  trend: { start: string; label: string; active: number; total: number; ratio: number; partial: boolean }[];
}

export interface ILearnerActiveness {
  userId: string;
  studentId: string;
  fullNames: string;
  phoneNumber: string | null;
  gender: string | null;
  district: string | null;
  sector: string | null;
  healthCenterName: string | null;
  registeredAt: string;
  lastActiveDay: string | null;
  daysSinceActive: number | null;
  daysActive: number;
  activeRatio: number;
  status: LearnerActivityStatus;
}

export type LearnerListParams = AttendanceFilters & {
  windowDays?: number;
  status?: LearnerActivityStatus;
  searchq?: string;
  page?: number;
  limit?: number;
};

export const getActivenessSummary = async (
  granularity: AttendanceGranularity,
  filters: AttendanceFilters,
): Promise<{ data: IActivenessSummary }> =>
  (await api.get("/attendance/learners/summary", { params: { granularity, ...filters } })).data;

export const getLearnerActiveness = async (
  params: LearnerListParams,
): Promise<{
  data: ILearnerActiveness[];
  windowDays: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> => (await api.get("/attendance/learners", { params })).data;

export const exportLearnerActiveness = async (params: Omit<LearnerListParams, "page" | "limit">) => {
  const res = await api.get("/attendance/learners/export", { params, responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chw-activeness-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
