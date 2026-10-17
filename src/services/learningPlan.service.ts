import api from "./api";

export type LearnerLevel = "beginner" | "intermediate" | "advanced";
export type PlanItemStatus = "done" | "in_progress" | "overdue" | "upcoming";
export type PlanStatus = "awaiting_pretest" | "on_track" | "behind" | "completed";

export type PlanSprintItem =
  | {
      type: "chapter";
      id: string;
      title: string;
      chapterNumber: number;
      minutes: number;
      hasQuiz: boolean;
      done: boolean;
      slidesDone?: boolean;
      quiz?: "none" | "pending" | "passed" | "failed";
      quizBest?: number | null;
      quizPassMark?: number | null;
    }
  | { type: "final_test" | "final_exam"; id: string; title: string; done: boolean };

export interface IPlanMilestone {
  key: string;
  type: "pretest" | "section" | "final_test" | "final_exam";
  title: string;
  status: PlanItemStatus;
  targetDate: string | null;
  completedAt: string | null;
  score?: number | null;
  sectionNumber?: number;
  chaptersDone?: number;
  chaptersTotal?: number;
  chapters?: { id: string; title: string; chapterNumber: number; hasQuiz: boolean; done: boolean }[];
}

export interface IPlanSprint {
  number: number;
  milestoneKey: string;
  startDate: string;
  dueDate: string;
  days: number;
  reviewDays?: number;
  minutes: number;
  status: PlanItemStatus;
  completedAt?: string | null;
  onTime?: boolean | null;
  items: PlanSprintItem[];
}

export interface ILearningPlan {
  course: { id: string; title: string; shortName: string | null };
  status: PlanStatus;
  thresholds: { beginnerMax: number; advancedMin: number };
  level?: LearnerLevel;
  pretestLevel?: LearnerLevel;
  levelSource?: string;
  rules?: { chaptersPerSprint: number; sprintDays: number; finalSprintDays: number };
  pretest?: { score: number | null; takenAt: string; attempts: number; latestScore: number } | null;
  startDate?: string;
  targetEndDate?: string;
  originalTargetEndDate?: string;
  projectedEndDate?: string;
  daysBehind?: number;
  adjustments?: { rescheduleCount: number; rescheduledFrom: string | null; extraDays: number; note: string | null; updatedAt: string | null };
  progress?: {
    chaptersDone: number;
    chaptersTotal: number;
    sprintsDone: number;
    sprintsTotal: number;
    percent: number;
    onTimeSprints?: number;
  };
  today?: { streak: number; activeToday: boolean };
  currentSprint?: number | null;
  milestones?: IPlanMilestone[];
  sprints?: IPlanSprint[];
}

export const getStudentLearningPlans = async (studentId: string): Promise<{ data: ILearningPlan[] }> =>
  (await api.get(`/learning-plan/students/${studentId}`)).data;

export interface PlanAdjustPayload {
  level?: LearnerLevel | null;
  extraDays?: number;
  note?: string | null;
}

export const adjustStudentLearningPlan = async (
  studentId: string,
  courseId: string,
  payload: PlanAdjustPayload,
): Promise<{ data: ILearningPlan }> =>
  (await api.patch(`/learning-plan/students/${studentId}/courses/${courseId}`, payload)).data;
