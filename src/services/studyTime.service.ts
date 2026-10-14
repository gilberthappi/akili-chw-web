import api from "./api";

export type StudyPeriod = "morning" | "afternoon" | "evening" | "night";

/** Minutes, split by how the learner studied. `supervised` = `meeting` + `group`. */
export interface StudySplit {
  self: number;
  supervised: number;
  meeting: number;
  group: number;
}

export interface StudyStats {
  range: { from: string; to: string; days: number };
  groupMinLearners: number;
  totals: StudySplit & {
    total: number;
    activeDays: number;
    avgPerActiveDay: number;
    supervisedShare: number;
  };
  byHour: ({ hour: number } & StudySplit)[];
  byWeekday: ({ weekday: string } & StudySplit)[];
  byPeriod: { period: StudyPeriod; label: string; minutes: number; share: number }[];
  daily: ({ date: string } & StudySplit)[];
  preferred: {
    period: StudyPeriod | null;
    periodLabel: string | null;
    hour: number | null;
    weekday: string | null;
  };
}

export interface StudyOverview extends StudyStats {
  learners: { inScope: number; active: number; avgMinutesPerActive: number };
  learnersByPeriod: { period: StudyPeriod; label: string; learners: number }[];
  learnersByMode: { selfPaced: number; supervised: number };
}

export const getStudentStudyTime = async (
  studentId: string,
  days: number,
): Promise<{ data: StudyStats }> =>
  (await api.get(`/study-time/students/${studentId}`, { params: { days } })).data;

/** `filterQs` is the dashboard filter query string without a leading `?`. */
export const getStudyTimeOverview = async (
  filterQs: string,
  days: number,
): Promise<{ data: StudyOverview }> => {
  const qs = filterQs ? `${filterQs}&days=${days}` : `days=${days}`;
  return (await api.get(`/study-time/overview?${qs}`)).data;
};

export const formatStudyMinutes = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

export const formatHourRange = (hour: number | null): string =>
  hour === null ? "—" : `${String(hour).padStart(2, "0")}:00–${String((hour + 1) % 24).padStart(2, "0")}:00`;
