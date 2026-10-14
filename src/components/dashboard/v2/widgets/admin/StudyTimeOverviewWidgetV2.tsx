import React, { useState } from "react";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import { useStudyTimeOverview } from "@/hooks/useStudyTimeOverview";
import { formatHourRange, formatStudyMinutes } from "@/services/studyTime.service";
import {
  StudyChartTitle,
  StudyDailyTrend,
  StudyKpi,
  StudyLegend,
  StudyRangeSelect,
  StudySkeleton,
  StudySplitBar,
  StudyStackedBars,
  STUDY_COLORS,
  hourTick,
} from "@/components/studyTime/StudyTimeCharts";
import { V2_CARD_SHELL, V2_EMPTY, V2_MUTED, V2_SECTION_TITLE, V2_STRONG } from "./v2CardStyles";

export const StudyTimeOverviewWidgetV2: React.FC = () => {
  const { filters } = useAdminDashboardFilters();
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useStudyTimeOverview(filters, days);
  const periodSelected = Boolean(filters.year || filters.month);
  const maxPeriodLearners = Math.max(1, ...(data?.learnersByPeriod.map((p) => p.learners) ?? [0]));
  const modeTotal = (data?.learnersByMode.selfPaced ?? 0) + (data?.learnersByMode.supervised ?? 0);

  return (
    <div className={`${V2_CARD_SHELL} overflow-hidden`}>
      <div className='px-4 py-3 flex flex-wrap items-start justify-between gap-2'>
        <div>
          <h3 className={V2_SECTION_TITLE}>Study time</h3>
          <p className={`text-[11px] ${V2_MUTED}`}>
            Self-paced vs supervised learning (meetings or {data?.groupMinLearners ?? 3}+ learners of
            the same health center studying together), and when learners prefer to study. Kigali time.
          </p>
        </div>
        {periodSelected ? (
          <span className={`text-[11px] font-semibold ${V2_MUTED}`}>
            {[filters.month, filters.year].filter(Boolean).join(" ")}
          </span>
        ) : (
          <StudyRangeSelect value={days} onChange={setDays} />
        )}
      </div>

      {isLoading && !data ? (
        <StudySkeleton />
      ) : isError || !data ? (
        <div className={`${V2_EMPTY} mx-4 mb-4`}>
          <p className={`text-xs ${V2_MUTED}`}>Could not load study time.</p>
        </div>
      ) : data.totals.total === 0 ? (
        <div className={`${V2_EMPTY} mx-4 mb-4`}>
          <p className={`text-xs ${V2_MUTED}`}>No study activity for the selected filters.</p>
        </div>
      ) : (
        <div className='px-4 pb-4 space-y-4'>
          <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2'>
            <StudyKpi label='Total study time' value={formatStudyMinutes(data.totals.total)} />
            <StudyKpi
              label='Active learners'
              value={`${data.learners.active}`}
              hint={`of ${data.learners.inScope} in scope`}
            />
            <StudyKpi
              label='Average per learner'
              value={formatStudyMinutes(data.learners.avgMinutesPerActive)}
            />
            <StudyKpi
              label='Supervised share'
              value={`${data.totals.supervisedShare}%`}
              hint={`${formatStudyMinutes(data.totals.supervised)} supervised`}
            />
            <StudyKpi
              label='Peak hour'
              value={data.preferred.hour === null ? "—" : hourTick(data.preferred.hour)}
              hint={formatHourRange(data.preferred.hour)}
            />
            <StudyKpi label='Busiest day' value={data.preferred.weekday ?? "—"} />
          </div>

          <StudySplitBar split={data.totals} />

          <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4'>
            <div className='min-w-0'>
              <StudyChartTitle>Hours of the day</StudyChartTitle>
              <StudyStackedBars data={data.byHour} xKey='hour' tickFormatter={hourTick} />
            </div>

            <div className='min-w-0'>
              <StudyChartTitle>Days of the week</StudyChartTitle>
              <StudyStackedBars data={data.byWeekday} xKey='weekday' />
            </div>

            <div className='min-w-0 space-y-3'>
              <div>
                <StudyChartTitle>Learners by preferred time</StudyChartTitle>
                <div className='space-y-1.5'>
                  {data.learnersByPeriod.map((p) => (
                    <div key={p.period}>
                      <div className={`flex justify-between text-[11px] ${V2_MUTED}`}>
                        <span>{p.label}</span>
                        <span className={`font-bold ${V2_STRONG}`}>{p.learners}</span>
                      </div>
                      <div className='h-1.5 rounded-full bg-[#E8EEF5] dark:bg-slate-700 overflow-hidden'>
                        <div
                          className='h-full rounded-full bg-[#3363AD]'
                          style={{ width: `${(p.learners / maxPeriodLearners) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <StudyChartTitle>Learners mostly…</StudyChartTitle>
                <div className={`flex justify-between text-[11px] ${V2_MUTED}`}>
                  <span>
                    <span className='font-bold' style={{ color: STUDY_COLORS.self }}>
                      {data.learnersByMode.selfPaced}
                    </span>{" "}
                    self-paced
                  </span>
                  <span>
                    <span className='font-bold' style={{ color: STUDY_COLORS.meeting }}>
                      {data.learnersByMode.supervised}
                    </span>{" "}
                    supervised
                  </span>
                </div>
                <div className='mt-1 flex h-1.5 rounded-full overflow-hidden bg-[#E8EEF5] dark:bg-slate-700'>
                  <div
                    style={{
                      width: `${modeTotal ? (data.learnersByMode.selfPaced / modeTotal) * 100 : 0}%`,
                      backgroundColor: STUDY_COLORS.self,
                    }}
                  />
                  <div
                    style={{
                      width: `${modeTotal ? (data.learnersByMode.supervised / modeTotal) * 100 : 0}%`,
                      backgroundColor: STUDY_COLORS.meeting,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <StudyChartTitle>Daily trend</StudyChartTitle>
            <StudyDailyTrend data={data.daily} />
          </div>

          <StudyLegend />
        </div>
      )}
    </div>
  );
};

export default StudyTimeOverviewWidgetV2;
