import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          <h3 className={V2_SECTION_TITLE}>{t("studyTime.title")}</h3>
          <p className={`text-[11px] ${V2_MUTED}`}>
            {t("studyTime.subtitleStudent", {
              n: stats?.groupMinLearners ?? 3,
              meters: stats?.nearbyMeters ?? 150,
            })}
          </p>
        </div>
        <StudyRangeSelect value={days} onChange={setDays} />
      </div>

      {isLoading && !stats ? (
        <StudySkeleton />
      ) : isError || !stats ? (
        <div className={`${V2_EMPTY} mx-4 mb-4`}>
          <p className={`text-xs ${V2_MUTED}`}>{t("studyTime.loadError")}</p>
        </div>
      ) : stats.totals.total === 0 ? (
        <div className={`${V2_EMPTY} mx-4 mb-4`}>
          <p className={`text-xs ${V2_MUTED}`}>{t("studyTime.emptyStudent", { days })}</p>
        </div>
      ) : (
        <div className='px-4 pb-4 space-y-4'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
            <StudyKpi
              label={t("studyTime.totalTime")}
              value={formatStudyMinutes(stats.totals.total)}
              hint={t("studyTime.activeDaysHint", {
                active: stats.totals.activeDays,
                days: stats.range.days,
              })}
            />
            <StudyKpi
              label={t("studyTime.avgPerActiveDay")}
              value={formatStudyMinutes(stats.totals.avgPerActiveDay)}
            />
            <StudyKpi
              label={t("studyTime.preferredTime")}
              value={
                stats.preferred.period ? t(`studyTime.periodsShort.${stats.preferred.period}`) : "—"
              }
              hint={t("studyTime.peak", { range: formatHourRange(stats.preferred.hour) })}
            />
            <StudyKpi
              label={t("studyTime.mostActiveDay")}
              value={stats.preferred.weekday ? t(`studyTime.weekdays.${stats.preferred.weekday}`) : "—"}
              hint={t("studyTime.supervisedPct", { pct: stats.totals.supervisedShare })}
            />
          </div>

          <StudySplitBar split={stats.totals} />

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <div>
              <StudyChartTitle>{t("studyTime.hoursOfDay")}</StudyChartTitle>
              <StudyStackedBars data={stats.byHour} xKey='hour' tickFormatter={hourTick} />
            </div>
            <div>
              <StudyChartTitle>{t("studyTime.daysOfWeek")}</StudyChartTitle>
              <StudyStackedBars
                data={stats.byWeekday}
                xKey='weekday'
                tickFormatter={(w) => t(`studyTime.weekdays.${w}`)}
              />
            </div>
          </div>

          <div>
            <StudyChartTitle>{t("studyTime.dailyTrend")}</StudyChartTitle>
            <StudyDailyTrend data={stats.daily} />
          </div>

          <StudyLegend />
        </div>
      )}
    </div>
  );
};

export default StudyTimeWidget;
