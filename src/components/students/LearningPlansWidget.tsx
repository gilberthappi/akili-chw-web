import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, ChevronRight, Circle, Clock, Flag, Map as MapIcon, Route } from "lucide-react";
import {
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

const PlanDetails: React.FC<{ plan: ILearningPlan }> = ({ plan }) => {
  const [view, setView] = useState<"map" | "sprints">("map");
  const milestones = plan.milestones ?? [];
  const sprints = plan.sprints ?? [];

  return (
    <div className='px-4 pb-4 space-y-4'>
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
          <p className={`font-bold ${V2_STRONG}`}>{fmtDate(plan.targetEndDate)}</p>
        </div>
        <div>
          <p className={V2_MUTED}>{plan.status === "completed" ? "Finished" : "Expected finish"}</p>
          <p className={`font-bold ${plan.status === "behind" ? "text-red-600" : V2_STRONG}`}>
            {fmtDate(plan.projectedEndDate)}
            {plan.status === "behind" && !!plan.daysBehind && <span className='font-normal'> ({plan.daysBehind} days late)</span>}
          </p>
        </div>
      </div>

      <div className='flex gap-1'>
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
                          : "border-[#E8EEF6] text-[#5B6575] dark:border-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {c.done ? <CheckCircle2 className='w-3 h-3' /> : <Circle className='w-3 h-3' />}
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
                <span className={`${V2_PILL} ${ITEM_STATUS[s.status].pill}`}>{ITEM_STATUS[s.status].label}</span>
              </div>
              <p className={`text-[11px] mb-2 flex items-center gap-1 ${V2_MUTED}`}>
                <Clock className='w-3 h-3' />
                {fmtDate(s.startDate)} → {fmtDate(s.dueDate)} · {s.days} day{s.days === 1 ? "" : "s"}
                {s.minutes ? ` · ~${s.minutes} min` : ""}
              </p>
              <ul className='space-y-1'>
                {s.items.map((item) => (
                  <li key={item.id} className='flex items-start gap-1.5 text-xs'>
                    {item.done ? (
                      <CheckCircle2 className='w-3.5 h-3.5 mt-0.5 text-emerald-500 shrink-0' />
                    ) : item.type === "chapter" ? (
                      <Circle className='w-3.5 h-3.5 mt-0.5 text-[#C5D3E0] shrink-0' />
                    ) : (
                      <Flag className='w-3.5 h-3.5 mt-0.5 text-amber-500 shrink-0' />
                    )}
                    <span className={item.done ? `line-through ${V2_MUTED}` : V2_STRONG}>
                      {item.type === "chapter" ? `Ch. ${item.chapterNumber}: ${item.title}` : item.title}
                      {item.type === "chapter" && item.hasQuiz && <span className={V2_MUTED}> + quiz</span>}
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
                {open && <PlanDetails plan={plan} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LearningPlansWidget;
