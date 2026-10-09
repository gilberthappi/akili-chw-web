import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Flag,
  Map as MapIcon,
  RotateCcw,
  Route,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  adjustStudentLearningPlan,
  getStudentLearningPlans,
  type ILearningPlan,
  type LearnerLevel,
  type PlanItemStatus,
  type PlanStatus,
} from "@/services/learningPlan.service";
import {
  V2_CARD_SHELL,
  V2_MUTED,
  V2_PILL,
  V2_PILL_AMBER,
  V2_PILL_BLUE,
  V2_PILL_GRAY,
  V2_PILL_GREEN,
  V2_PILL_RED,
  V2_SECTION_TITLE,
  V2_STRONG,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

const LEVEL_META: Record<LearnerLevel, { label: string; pill: string }> = {
  beginner: { label: "Beginner", pill: V2_PILL_AMBER },
  intermediate: { label: "Intermediate", pill: V2_PILL_BLUE },
  advanced: { label: "Advanced", pill: V2_PILL_GREEN },
};

const PLAN_STATUS: Record<PlanStatus, { label: string; pill: string }> = {
  awaiting_pretest: { label: "Pre-test not taken", pill: V2_PILL_GRAY },
  on_track: { label: "On track", pill: V2_PILL_GREEN },
  behind: { label: "Behind plan", pill: V2_PILL_RED },
  completed: { label: "Completed", pill: V2_PILL_BLUE },
};

const ITEM_STATUS: Record<PlanItemStatus, { label: string; pill: string; dot: string }> = {
  done: { label: "Done", pill: V2_PILL_GREEN, dot: "bg-emerald-500 border-emerald-500" },
  in_progress: { label: "In progress", pill: V2_PILL_BLUE, dot: "bg-[#3363AD] border-[#3363AD]" },
  overdue: { label: "Overdue", pill: V2_PILL_RED, dot: "bg-red-500 border-red-500" },
  upcoming: { label: "Upcoming", pill: V2_PILL_GRAY, dot: "bg-white border-[#C5D3E0] dark:bg-slate-800" },
};

const fmtDate = (iso?: string | null) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

const LEVEL_SOURCE: Record<string, string> = { staff: "set by staff", learner: "chosen by learner" };

const AdjustPlanModal: React.FC<{ studentId: string; plan: ILearningPlan; onClose: () => void }> = ({
  studentId,
  plan,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const overridden = plan.levelSource === "staff" || plan.levelSource === "learner";
  const [level, setLevel] = useState<LearnerLevel | "auto">(overridden && plan.level ? plan.level : "auto");
  const [extraDays, setExtraDays] = useState<number>(plan.adjustments?.extraDays ?? 0);
  const [note, setNote] = useState(plan.adjustments?.note ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      adjustStudentLearningPlan(studentId, plan.course.id, {
        level: level === "auto" ? null : level,
        extraDays,
        note: note.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learning-plans", studentId] });
      toast.success("Learning plan updated");
      onClose();
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Could not update the plan");
    },
  });

  const field = "w-full rounded-lg border border-[#E2E8F0] dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm";

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4' onClick={onClose}>
      <div
        className='w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-xl'
        onClick={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
      >
        <div className='flex items-center justify-between px-5 pt-4'>
          <div>
            <h4 className={`text-base font-semibold ${V2_STRONG}`}>Adjust learning plan</h4>
            <p className={`text-xs ${V2_MUTED}`}>{plan.course.shortName?.trim() || plan.course.title}</p>
          </div>
          <button type='button' onClick={onClose} className='p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700'>
            <X className='w-4 h-4 text-[#9AA3B2]' />
          </button>
        </div>
        <div className='px-5 py-4 space-y-4'>
          <label className='block'>
            <span className={`text-xs font-medium ${V2_MUTED}`}>Level</span>
            <select className={`${field} mt-1`} value={level} onChange={(e) => setLevel(e.target.value as LearnerLevel | "auto")}>
              <option value='auto'>
                From pre-test{plan.pretestLevel ? ` (${LEVEL_META[plan.pretestLevel].label})` : ""}
              </option>
              {(Object.keys(LEVEL_META) as LearnerLevel[]).map((l) => (
                <option key={l} value={l}>
                  {LEVEL_META[l].label}
                </option>
              ))}
            </select>
          </label>
          <label className='block'>
            <span className={`text-xs font-medium ${V2_MUTED}`}>Extra days (0–60)</span>
            <input
              type='number'
              min={0}
              max={60}
              className={`${field} mt-1`}
              value={extraDays}
              onChange={(e) => setExtraDays(Math.max(0, Math.min(60, Math.round(Number(e.target.value) || 0))))}
            />
            <span className={`text-[11px] ${V2_MUTED}`}>Moves every sprint later by this many days.</span>
          </label>
          <label className='block'>
            <span className={`text-xs font-medium ${V2_MUTED}`}>Note for the learner (optional)</span>
            <textarea
              rows={3}
              maxLength={500}
              className={`${field} mt-1 resize-none`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='Shown on the learner’s plan, e.g. the reason for the change'
            />
          </label>
        </div>
        <div className='flex justify-end gap-2 px-5 pb-5'>
          <button
            type='button'
            onClick={onClose}
            className='px-4 py-2 rounded-lg text-sm text-[#5B6575] hover:bg-slate-100 dark:hover:bg-slate-700'
          >
            Cancel
          </button>
          <button
            type='button'
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className='px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#3363AD] hover:bg-[#2B5596] disabled:opacity-60'
          >
            {mutation.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

const PlanDetails: React.FC<{ plan: ILearningPlan; studentId: string; canAdjust: boolean }> = ({
  plan,
  studentId,
  canAdjust,
}) => {
  const [view, setView] = useState<"map" | "sprints">("map");
  const [adjusting, setAdjusting] = useState(false);
  const milestones = plan.milestones ?? [];
  const sprints = plan.sprints ?? [];
  const adj = plan.adjustments;
  const adjusted =
    !!adj && (adj.rescheduleCount > 0 || adj.extraDays > 0 || plan.levelSource === "staff" || plan.levelSource === "learner");

  return (
    <div className='px-4 pb-4 space-y-4'>
      {adjusting && <AdjustPlanModal studentId={studentId} plan={plan} onClose={() => setAdjusting(false)} />}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 text-xs'>
        <div>
          <p className={V2_MUTED}>Pre-test (1st attempt)</p>
          <p className={`font-bold ${V2_STRONG}`}>
            {plan.pretest?.score ?? "—"}%
            {plan.pretest && plan.pretest.attempts > 1 && (
              <span className={`font-normal ${V2_MUTED}`}> · {plan.pretest.attempts} attempts, latest {plan.pretest.latestScore}% (not used)</span>
            )}
          </p>
        </div>
        <div>
          <p className={V2_MUTED}>Sprint size</p>
          <p className={`font-bold ${V2_STRONG}`}>
            {plan.rules?.chaptersPerSprint} chapters / {plan.rules?.sprintDays} days
          </p>
        </div>
        <div>
          <p className={V2_MUTED}>Planned finish</p>
          <p className={`font-bold ${V2_STRONG}`}>
            {fmtDate(plan.targetEndDate)}
            {plan.originalTargetEndDate && plan.originalTargetEndDate !== plan.targetEndDate && (
              <span className={`font-normal ${V2_MUTED}`}> · original {fmtDate(plan.originalTargetEndDate)}</span>
            )}
          </p>
        </div>
        <div>
          <p className={V2_MUTED}>{plan.status === "completed" ? "Finished" : "Expected finish"}</p>
          <p className={`font-bold ${plan.status === "behind" ? "text-red-600" : V2_STRONG}`}>
            {fmtDate(plan.projectedEndDate)}
            {plan.status === "behind" && !!plan.daysBehind && <span className='font-normal'> ({plan.daysBehind} days late)</span>}
          </p>
        </div>
      </div>

      {(adjusted || !!plan.focusChapters?.length || (plan.progress?.sprintsDone ?? 0) > 0) && (
        <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs'>
          {(plan.progress?.sprintsDone ?? 0) > 0 && (
            <span className={`inline-flex items-center gap-1 ${V2_MUTED}`}>
              <Award className='w-3.5 h-3.5 text-emerald-600' />
              {plan.progress?.onTimeSprints ?? 0}/{plan.progress?.sprintsDone} sprints on time
            </span>
          )}
          {!!plan.today?.streak && plan.today.streak >= 2 && (
            <span className={V2_MUTED}>{plan.today.streak}-day activity streak</span>
          )}
          {plan.levelSource && LEVEL_SOURCE[plan.levelSource] && (
            <span className={V2_MUTED}>
              Level {LEVEL_SOURCE[plan.levelSource]}
              {plan.pretestLevel && ` (pre-test: ${LEVEL_META[plan.pretestLevel].label})`}
            </span>
          )}
          {!!adj?.rescheduleCount && (
            <span className={V2_MUTED}>
              Rescheduled by learner {adj.rescheduleCount}× (last from {fmtDate(adj.rescheduledFrom)})
            </span>
          )}
          {!!adj?.extraDays && <span className={V2_MUTED}>+{adj.extraDays} days granted</span>}
          {!!adj?.note && <span className={V2_MUTED}>Note: “{adj.note}”</span>}
          {!!plan.focusChapters?.length && (
            <span className='inline-flex items-center gap-1 text-amber-700 dark:text-amber-400'>
              <RotateCcw className='w-3.5 h-3.5' />
              Quiz to retake:{" "}
              {plan.focusChapters
                .map((c) => `Ch. ${c.chapterNumber} (${c.quizBest ?? 0}%/${c.quizPassMark ?? 0}%)`)
                .join(", ")}
            </span>
          )}
        </div>
      )}

      <div className='flex flex-wrap items-center gap-1'>
        {(["map", "sprints"] as const).map((key) => (
          <button
            key={key}
            type='button'
            onClick={() => setView(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 ${
              view === key ? "bg-[#3363AD] text-white" : "text-[#5B6575] hover:bg-[#EEF3FA] dark:text-slate-400"
            }`}
          >
            {key === "map" ? <MapIcon className='w-3.5 h-3.5' /> : <Route className='w-3.5 h-3.5' />}
            {key === "map" ? "Completion map" : `Sprints (${sprints.length})`}
          </button>
        ))}
        {canAdjust && (
          <button
            type='button'
            onClick={() => setAdjusting(true)}
            className='ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border border-[#E2E8F0] text-[#334155] hover:bg-[#F8FAFC] dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'
          >
            <SlidersHorizontal className='w-3.5 h-3.5' />
            Adjust plan
          </button>
        )}
      </div>

      {view === "map" ? (
        <ol className='relative ml-2'>
          {milestones.map((m, i) => (
            <li key={m.key} className='relative pl-7 pb-4 last:pb-0'>
              {i < milestones.length - 1 && <span className='absolute left-[7px] top-4 bottom-0 w-px bg-[#E8EEF6] dark:bg-slate-700' />}
              <span className={`absolute left-0 top-1 w-[15px] h-[15px] rounded-full border-2 ${ITEM_STATUS[m.status].dot}`} />
              <div className='flex flex-wrap items-center gap-2'>
                <span className={`text-sm font-bold ${V2_STRONG}`}>
                  {m.type === "section" ? `Section ${m.sectionNumber}: ` : ""}
                  {m.title}
                </span>
                <span className={`${V2_PILL} ${ITEM_STATUS[m.status].pill}`}>{ITEM_STATUS[m.status].label}</span>
                {m.type === "pretest" && m.score != null && <span className={`text-xs ${V2_MUTED}`}>Score {m.score}%</span>}
              </div>
              <p className={`text-[11px] ${V2_MUTED}`}>
                {m.completedAt ? `Completed ${fmtDate(m.completedAt)}` : `Target ${fmtDate(m.targetDate)}`}
                {m.chaptersTotal ? ` · ${m.chaptersDone}/${m.chaptersTotal} chapters` : ""}
              </p>
              {m.chapters && (
                <div className='flex flex-wrap gap-1.5 mt-1.5'>
                  {m.chapters.map((c) => (
                    <span
                      key={c.id}
                      title={c.title}
                      className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border ${
                        c.done
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800"
                          : c.needsReview
                            ? "border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800"
                            : "border-[#E8EEF6] text-[#5B6575] dark:border-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {c.done ? (
                        <CheckCircle2 className='w-3 h-3' />
                      ) : c.needsReview ? (
                        <RotateCcw className='w-3 h-3' />
                      ) : (
                        <Circle className='w-3 h-3' />
                      )}
                      Ch. {c.chapterNumber}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'>
          {sprints.map((s) => (
            <div
              key={s.number}
              className={`rounded-xl border p-3 ${
                s.number === plan.currentSprint && s.status !== "done"
                  ? "border-[#3363AD] ring-1 ring-[#3363AD]/30"
                  : "border-[#E8EEF6] dark:border-slate-700"
              }`}
            >
              <div className='flex items-center justify-between gap-2 mb-1'>
                <span className={`text-sm font-bold ${V2_STRONG}`}>Sprint {s.number}</span>
                <span className={`${V2_PILL} ${ITEM_STATUS[s.status].pill}`}>
                  {s.status === "done" && s.onTime ? "On time" : ITEM_STATUS[s.status].label}
                </span>
              </div>
              <p className={`text-[11px] mb-2 flex items-center gap-1 ${V2_MUTED}`}>
                <Clock className='w-3 h-3' />
                {fmtDate(s.startDate)} → {fmtDate(s.dueDate)} · {s.days} day{s.days === 1 ? "" : "s"}
                {s.minutes ? ` · ~${s.minutes} min` : ""}
                {s.reviewDays ? ` · +${s.reviewDays} review` : ""}
              </p>
              <ul className='space-y-1'>
                {s.items.map((item) => (
                  <li key={item.id} className='flex items-start gap-1.5 text-xs'>
                    {item.done ? (
                      <CheckCircle2 className='w-3.5 h-3.5 mt-0.5 text-emerald-500 shrink-0' />
                    ) : item.type === "chapter" && item.needsReview ? (
                      <RotateCcw className='w-3.5 h-3.5 mt-0.5 text-amber-500 shrink-0' />
                    ) : item.type === "chapter" ? (
                      <Circle className='w-3.5 h-3.5 mt-0.5 text-[#C5D3E0] shrink-0' />
                    ) : (
                      <Flag className='w-3.5 h-3.5 mt-0.5 text-amber-500 shrink-0' />
                    )}
                    <span className={item.done ? `line-through ${V2_MUTED}` : V2_STRONG}>
                      {item.type === "chapter" ? `Ch. ${item.chapterNumber}: ${item.title}` : item.title}
                      {item.type === "chapter" && item.hasQuiz && (
                        <span className={item.needsReview ? "text-amber-600" : V2_MUTED}>
                          {item.needsReview ? ` · quiz ${item.quizBest ?? 0}% (pass ${item.quizPassMark ?? 0}%)` : " + quiz"}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const LearningPlansWidget: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [openCourse, setOpenCourse] = useState<string | null>(null);
  const { hasRole } = useAuth();
  const canAdjust = hasRole(["ADMIN", "STAFF", "TRAINER"]);
  const { data, isLoading } = useQuery({
    queryKey: ["learning-plans", studentId],
    queryFn: () => getStudentLearningPlans(studentId),
  });
  const plans = data?.data ?? [];

  return (
    <div className={`${V2_CARD_SHELL} overflow-hidden`}>
      <div className='px-4 py-3'>
        <h3 className={V2_SECTION_TITLE}>Learning plans</h3>
        <p className={`text-[11px] ${V2_MUTED}`}>
          Generated from the first pre-test score: 0–{plans[0]?.thresholds.beginnerMax ?? 49}% Beginner,{" "}
          {plans[0]?.thresholds.advancedMin ?? 80}–100% Advanced, otherwise Intermediate.
        </p>
      </div>
      {isLoading ? (
        <p className={`px-4 pb-4 text-xs ${V2_MUTED}`}>Loading…</p>
      ) : plans.length === 0 ? (
        <p className={`px-4 pb-4 text-xs ${V2_MUTED}`}>Not enrolled in any course yet.</p>
      ) : (
        <div className='divide-y divide-[#E8EEF6] dark:divide-slate-700 border-t border-[#E8EEF6] dark:border-slate-700'>
          {plans.map((plan) => {
            const open = openCourse === plan.course.id;
            const expandable = plan.status !== "awaiting_pretest";
            return (
              <div key={plan.course.id}>
                <button
                  type='button'
                  disabled={!expandable}
                  onClick={() => setOpenCourse(open ? null : plan.course.id)}
                  className='w-full px-4 py-3 flex flex-wrap items-center gap-3 text-left hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 disabled:hover:bg-transparent disabled:cursor-default'
                >
                  {expandable ? (
                    open ? <ChevronDown className='w-4 h-4 text-[#9AA3B2]' /> : <ChevronRight className='w-4 h-4 text-[#9AA3B2]' />
                  ) : (
                    <span className='w-4' />
                  )}
                  <span className={`text-sm font-bold flex-1 min-w-[160px] ${V2_STRONG}`}>
                    {plan.course.shortName?.trim() || plan.course.title}
                  </span>
                  {plan.level && <span className={`${V2_PILL} ${LEVEL_META[plan.level].pill}`}>{LEVEL_META[plan.level].label}</span>}
                  <span className={`${V2_PILL} ${PLAN_STATUS[plan.status].pill}`}>{PLAN_STATUS[plan.status].label}</span>
                  {plan.progress && (
                    <span className='flex items-center gap-2 w-40'>
                      <span className='flex-1 bg-[#E8EEF6] dark:bg-slate-700 rounded-full h-1.5'>
                        <span className='block bg-[#3363AD] h-1.5 rounded-full' style={{ width: `${plan.progress.percent}%` }} />
                      </span>
                      <span className={`text-[11px] tabular-nums ${V2_MUTED}`}>
                        {plan.progress.sprintsDone}/{plan.progress.sprintsTotal} sprints
                      </span>
                    </span>
                  )}
                </button>
                {open && <PlanDetails plan={plan} studentId={studentId} canAdjust={canAdjust} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LearningPlansWidget;
