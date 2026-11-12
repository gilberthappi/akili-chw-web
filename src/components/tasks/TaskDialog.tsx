import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CehoTask, dayKey, TASK_KIND_LABEL, TASK_STATUS_LABEL, taskStart, type TaskKind, type TaskStatus } from "./cehoTasks";

const fieldClass =
  "w-full rounded-lg border border-[#D5E0EA] dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-[#2A3138] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3B8BEB]/30";

export const TaskDialog: React.FC<{
  open: boolean;
  task: CehoTask | null;
  onClose: () => void;
  onSave: (task: CehoTask) => void;
}> = ({ open, task, onClose, onSave }) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [kind, setKind] = useState<TaskKind>("meeting");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEditing(!task);
    setTitle(task?.title ?? "");
    setDate(task?.date ?? dayKey(new Date()));
    setTime(task?.time ?? "09:00");
    setKind(task?.kind ?? "meeting");
    setStatus(task?.status ?? "todo");
    setNotes(task?.notes ?? "");
  }, [open, task]);

  if (!open) return null;

  const save = () => {
    if (!title.trim() || !date || !time) return;
    onSave({
      id: task?.id ?? `task-${Date.now()}`,
      title: title.trim(),
      date,
      time,
      kind,
      status,
      notes: notes.trim(),
    });
  };

  const when = task ? taskStart(task) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="mt-16 w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF1F4] dark:border-slate-700">
          <h2 className="text-[15px] font-bold">{editing ? (task ? "Update task" : "Create task") : "Task details"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded-md text-[#8B95A1] hover:bg-[#F3F6F9] dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>
        {task && !editing && when ? (
          <div className="px-5 py-4">
            <h3 className="text-lg font-bold text-[#2A3138] dark:text-slate-100">{task.title}</h3>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-[12px] font-semibold text-[#8B95A1]">Date</dt>
                <dd className="mt-0.5 text-[#2A3138] dark:text-slate-100">
                  {when.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] font-semibold text-[#8B95A1]">Time</dt>
                <dd className="mt-0.5 text-[#2A3138] dark:text-slate-100">
                  {when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] font-semibold text-[#8B95A1]">Type</dt>
                <dd className="mt-0.5 text-[#2A3138] dark:text-slate-100">{TASK_KIND_LABEL[task.kind]}</dd>
              </div>
              <div>
                <dt className="text-[12px] font-semibold text-[#8B95A1]">Status</dt>
                <dd className="mt-0.5 text-[#2A3138] dark:text-slate-100">{TASK_STATUS_LABEL[task.status]}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <p className="text-[12px] font-semibold text-[#8B95A1]">Notes</p>
              <p className="mt-1 text-sm text-[#2A3138] dark:text-slate-100 whitespace-pre-wrap">{task.notes || "No notes."}</p>
            </div>
            {task.source === "system" && (
              <p className="mt-3 text-[12px] font-semibold text-[#1D6FB8]">Created from your group</p>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg text-[13px] font-semibold text-[#5C6770] hover:bg-[#F3F6F9] dark:hover:bg-slate-800">
                Close
              </button>
              <button type="button" onClick={() => setEditing(true)} className="px-3 py-2 rounded-lg bg-primary text-white text-[13px] font-semibold">
                Edit
              </button>
            </div>
          </div>
        ) : (
        <form
          className="px-5 py-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <label className="block text-[12px] font-semibold text-[#5C6770] dark:text-slate-300">
            Title
            <input className={`${fieldClass} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] font-semibold text-[#5C6770] dark:text-slate-300">
              Date
              <input type="date" className={`${fieldClass} mt-1`} value={date} onChange={(event) => setDate(event.target.value)} required />
            </label>
            <label className="block text-[12px] font-semibold text-[#5C6770] dark:text-slate-300">
              Time
              <input type="time" className={`${fieldClass} mt-1`} value={time} onChange={(event) => setTime(event.target.value)} required />
            </label>
          </div>
          <label className="block text-[12px] font-semibold text-[#5C6770] dark:text-slate-300">
            Type
            <select className={`${fieldClass} mt-1`} value={kind} onChange={(event) => setKind(event.target.value as TaskKind)}>
              <option value="meeting">Meeting</option>
              <option value="training">Training</option>
              <option value="field">Field</option>
            </select>
          </label>
          <label className="block text-[12px] font-semibold text-[#5C6770] dark:text-slate-300">
            Status
            <select className={`${fieldClass} mt-1`} value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)}>
              {(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((item) => (
                <option key={item} value={item}>
                  {TASK_STATUS_LABEL[item]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] font-semibold text-[#5C6770] dark:text-slate-300">
            Notes
            <textarea className={`${fieldClass} mt-1 min-h-[88px]`} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg text-[13px] font-semibold text-[#5C6770] hover:bg-[#F3F6F9] dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" className="px-3 py-2 rounded-lg bg-primary text-white text-[13px] font-semibold">
              {task ? "Update" : "Create"}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
