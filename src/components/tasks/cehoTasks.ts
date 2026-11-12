export type TaskKind = "meeting" | "training" | "field";

export type TaskStatus = "todo" | "due" | "in_progress" | "postponed" | "done";

export type CehoTask = {
  id: string;
  title: string;
  date: string;
  time: string;
  kind: TaskKind;
  status: TaskStatus;
  notes: string;
  source?: "manual" | "system";
  startAt?: string;
  endAt?: string;
  calendarType?: "MEETING" | "TRAINING" | "DRILL";
  overdue?: boolean;
};

export const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const taskStart = (task: CehoTask) => {
  const [year, month, day] = task.date.split("-").map(Number);
  const [hour, minute] = task.time.split(":").map(Number);
  return new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0);
};

export const TASK_KIND_LABEL: Record<TaskKind, string> = {
  meeting: "Meeting",
  training: "Training",
  field: "Field",
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  due: "Due",
  in_progress: "In progress",
  postponed: "Postponed",
  done: "Done",
};
