import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CehoTask, TaskStatus } from "@/components/tasks/cehoTasks";
import {
  CehoTaskColumns,
  CehoTaskList,
  CehoTaskQuery,
  listCehoTasks,
  saveCehoTask,
  updateCehoTaskStatus,
} from "@/services/cehoTask.service";

export const CEHO_TASKS_KEY = ["ceho-tasks"] as const;

const emptyColumns = (): CehoTaskColumns => ({
  todo: [],
  due: [],
  in_progress: [],
  postponed: [],
  done: [],
});

const withStatus = (list: CehoTaskList, id: string, status: TaskStatus): CehoTaskList => {
  const tasks = list.tasks.map((task) => (task.id === id ? { ...task, status } : task));
  if (!list.columns) return { ...list, tasks };
  const columns = emptyColumns();
  (Object.values(list.columns) as CehoTask[][]).flat().forEach((task) => {
    const next = task.id === id ? { ...task, status } : task;
    columns[next.status].push(next);
  });
  return { ...list, tasks, columns };
};

export const useCehoTasks = (options?: { enabled?: boolean; query?: CehoTaskQuery }) => {
  const enabled = options?.enabled ?? true;
  const params = options?.query ?? {};
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [...CEHO_TASKS_KEY, params],
    queryFn: () => listCehoTasks(params),
    enabled,
  });

  const save = useMutation({
    mutationFn: (task: CehoTask) => saveCehoTask(task),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CEHO_TASKS_KEY }),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => updateCehoTaskStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: CEHO_TASKS_KEY });
      const snapshots = queryClient.getQueriesData<CehoTaskList>({ queryKey: CEHO_TASKS_KEY });
      snapshots.forEach(([key, current]) => {
        if (!current?.tasks) return;
        queryClient.setQueryData(key, withStatus(current, id, status));
      });
      return { snapshots };
    },
    onError: (_error, _vars, context) => {
      context?.snapshots.forEach(([key, current]) => queryClient.setQueryData(key, current));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CEHO_TASKS_KEY }),
  });

  const data = query.data;

  return {
    tasks: data?.tasks ?? [],
    days: data?.days ?? [],
    columns: data?.columns,
    counts: data?.counts ?? { todo: 0, due: 0, in_progress: 0, postponed: 0, done: 0 },
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pages: data?.pages ?? 1,
    limit: data?.limit ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    saveTask: save.mutate,
    setStatus: setStatus.mutate,
  };
};
