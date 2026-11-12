import api from "./api";
import type { CehoTask, TaskKind, TaskStatus } from "@/components/tasks/cehoTasks";

export type CehoTaskPayload = {
  title: string;
  date: string;
  time: string;
  kind: TaskKind;
  status: TaskStatus;
  notes: string;
};

export type CehoTaskQuery = {
  search?: string;
  status?: TaskStatus | "open" | "upcoming";
  kind?: TaskKind;
  from?: string;
  to?: string;
  sort?: "upcoming" | "time";
  timing?: "scheduled" | "ongoing" | "completed";
  layout?: "flat" | "board";
  page?: number;
  limit?: number;
};

export type CehoTaskCounts = Record<TaskStatus, number>;

export type CehoTaskDay = {
  date: string;
  kind: TaskKind;
  titles: string[];
};

export type CehoTaskColumns = Record<TaskStatus, CehoTask[]>;

export type CehoTaskList = {
  tasks: CehoTask[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  counts: CehoTaskCounts;
  days: CehoTaskDay[];
  columns?: CehoTaskColumns;
};

const emptyCounts = (): CehoTaskCounts => ({
  todo: 0,
  due: 0,
  in_progress: 0,
  postponed: 0,
  done: 0,
});

const isNewTask = (id: string) => !id || id.startsWith("task-");

export const listCehoTasks = async (query: CehoTaskQuery = {}): Promise<CehoTaskList> => {
  const params = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ""),
  );
  const res = await api.get("/ceho-tasks", { params });
  const meta = res.data.meta ?? {};
  return {
    tasks: res.data.data ?? [],
    total: meta.total ?? 0,
    page: meta.page ?? 1,
    limit: meta.limit ?? 0,
    pages: meta.pages ?? 1,
    counts: meta.counts ?? emptyCounts(),
    days: meta.days ?? [],
    columns: meta.columns,
  };
};

export const saveCehoTask = async (task: CehoTask): Promise<CehoTask> => {
  const body: CehoTaskPayload = {
    title: task.title,
    date: task.date,
    time: task.time,
    kind: task.kind,
    status: task.status,
    notes: task.notes,
  };
  const res = isNewTask(task.id)
    ? await api.post("/ceho-tasks", body)
    : await api.patch(`/ceho-tasks/${task.id}`, body);
  return res.data.data;
};

export const updateCehoTaskStatus = async (id: string, status: TaskStatus): Promise<CehoTask> => {
  const res = await api.patch(`/ceho-tasks/${id}`, { status });
  return res.data.data;
};
