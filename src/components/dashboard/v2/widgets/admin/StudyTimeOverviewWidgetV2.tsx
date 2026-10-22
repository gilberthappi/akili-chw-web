import React, { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          <h3 className={V2_SECTION_TITLE}>{t("studyTime.title")}</h3>
          <p className={`text-[11px] ${V2_MUTED}`}>
            {t("studyTime.subtitleOverview", {
              n: data?.groupMinLearners ?? 3,
              meters: data?.nearbyMeters ?? 150,
            })}
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
          <p className={`text-xs ${V2_MUTED}`}>{t("studyTime.loadError")}</p>
        </div>
      ) : data.totals.total === 0 ? (
        <div className={`${V2_EMPTY} mx-4 mb-4`}>
          <p className={`text-xs ${V2_MUTED}`}>{t("studyTime.emptyOverview")}</p>
        </div>
      ) : (
        <div className='px-4 pb-4 space-y-4'>
          <div className='grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2'>
            <StudyKpi label={t("studyTime.totalTime")} value={formatStudyMinutes(data.totals.total)} />
            <StudyKpi
              label={t("studyTime.activeLearners")}
              value={`${data.learners.active}`}
              hint={t("studyTime.ofInScope", { n: data.learners.inScope })}
            />
            <StudyKpi
              label={t("studyTime.avgPerLearner")}
              value={formatStudyMinutes(data.learners.avgMinutesPerActive)}
            />
            <StudyKpi
              label={t("studyTime.supervisedShare")}
              value={`${data.totals.supervisedShare}%`}
              hint={t("studyTime.supervisedTime", { time: formatStudyMinutes(data.totals.supervised) })}
            />
            <StudyKpi
              label={t("studyTime.peakHour")}
              value={data.preferred.hour === null ? "—" : hourTick(data.preferred.hour)}
              hint={formatHourRange(data.preferred.hour)}
            />
            <StudyKpi
              label={t("studyTime.busiestDay")}
              value={data.preferred.weekday ? t(`studyTime.weekdays.${data.preferred.weekday}`) : "—"}
            />
          </div>

          <StudySplitBar split={data.totals} />

          <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4'>
            <div className='min-w-0'>
              <StudyChartTitle>{t("studyTime.hoursOfDay")}</StudyChartTitle>
              <StudyStackedBars data={data.byHour} xKey='hour' tickFormatter={hourTick} />
            </div>

            <div className='min-w-0'>
              <StudyChartTitle>{t("studyTime.daysOfWeek")}</StudyChartTitle>
              <StudyStackedBars
                data={data.byWeekday}
                xKey='weekday'
                tickFormatter={(w) => t(`studyTime.weekdays.${w}`)}
              />
            </div>

            <div className='min-w-0 space-y-3'>
              <div>
                <StudyChartTitle>{t("studyTime.learnersByPeriod")}</StudyChartTitle>
                <div className='space-y-1.5'>
                  {data.learnersByPeriod.map((p) => (
                    <div key={p.period}>
                      <div className={`flex justify-between text-[11px] ${V2_MUTED}`}>
                        <span>{t(`studyTime.periods.${p.period}`)}</span>
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
                <StudyChartTitle>{t("studyTime.learnersMostly")}</StudyChartTitle>
                <div className={`flex justify-between text-[11px] ${V2_MUTED}`}>
                  <span>
                    <span className='font-bold' style={{ color: STUDY_COLORS.self }}>
                      {data.learnersByMode.selfPaced}
                    </span>{" "}
                    {t("studyTime.mostlySelf")}
                  </span>
                  <span>
                    <span className='font-bold' style={{ color: STUDY_COLORS.meeting }}>
                      {data.learnersByMode.supervised}
                    </span>{" "}
                    {t("studyTime.mostlySupervised")}
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
            <StudyChartTitle>{t("studyTime.dailyTrend")}</StudyChartTitle>
            <StudyDailyTrend data={data.daily} />
          </div>

          <StudyLegend />
        </div>
      )}
    </div>
  );
};

export default StudyTimeOverviewWidgetV2;
