import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  V2_CARD_SHELL,
  V2_EMPTY,
  V2_MUTED,
  V2_SECTION_TITLE,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import {
  formatHourRange,
  formatStudyMinutes,
  getStudentStudyTime,
} from "@/services/studyTime.service";
import {
  StudyChartTitle,
  StudyDailyTrend,
  StudyKpi,
  StudyLegend,
  StudyRangeSelect,
  StudySkeleton,
  StudySplitBar,
  StudyStackedBars,
  hourTick,
} from "@/components/studyTime/StudyTimeCharts";

export const StudyTimeWidget: React.FC<{ studentId: string }> = ({ studentId }) => {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["study-time", "student", studentId, days],
    queryFn: () => getStudentStudyTime(studentId, days),
    keepPreviousData: true,
  });
  const stats = data?.data;

  return (
    <div className={`${V2_CARD_SHELL} overflow-hidden`}>
      <div className='px-4 py-3 flex flex-wrap items-start justify-between gap-2'>
        <div>
          <h3 className={V2_SECTION_TITLE}>Study time</h3>
          <p className={`text-[11px] ${V2_MUTED}`}>
            When this learner studies alone (self-paced) or with others (supervised: meetings or
            studying with {stats?.groupMinLearners ?? 3}+ learners of the same health center).
            Times are Kigali time.
          </p>
        </div>
        <StudyRangeSelect value={days} onChange={setDays} />
      </div>

      {isLoading && !stats ? (
        <StudySkeleton />
      ) : isError || !stats ? (
        <div className={`${V2_EMPTY} mx-4 mb-4`}>
          <p className={`text-xs ${V2_MUTED}`}>Could not load study time.</p>
        </div>
      ) : stats.totals.total === 0 ? (
        <div className={`${V2_EMPTY} mx-4 mb-4`}>
          <p className={`text-xs ${V2_MUTED}`}>No study activity in the last {days} days.</p>
        </div>
      ) : (
        <div className='px-4 pb-4 space-y-4'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
            <StudyKpi
              label='Total study time'
              value={formatStudyMinutes(stats.totals.total)}
              hint={`${stats.totals.activeDays} of ${stats.range.days} days active`}
            />
            <StudyKpi
              label='Average per active day'
              value={formatStudyMinutes(stats.totals.avgPerActiveDay)}
            />
            <StudyKpi
              label='Preferred time'
              value={stats.preferred.period ? stats.preferred.periodLabel!.split(" ")[0] : "—"}
              hint={`Peak ${formatHourRange(stats.preferred.hour)}`}
            />
            <StudyKpi
              label='Most active day'
              value={stats.preferred.weekday ?? "—"}
              hint={`${stats.totals.supervisedShare}% supervised`}
            />
          </div>

          <StudySplitBar split={stats.totals} />

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <div>
              <StudyChartTitle>Hours of the day</StudyChartTitle>
              <StudyStackedBars data={stats.byHour} xKey='hour' tickFormatter={hourTick} />
            </div>
            <div>
              <StudyChartTitle>Days of the week</StudyChartTitle>
              <StudyStackedBars data={stats.byWeekday} xKey='weekday' />
            </div>
          </div>

          <div>
            <StudyChartTitle>Daily trend</StudyChartTitle>
            <StudyDailyTrend data={stats.daily} />
          </div>

          <StudyLegend />
        </div>
      )}
    </div>
  );
};

export default StudyTimeWidget;
