import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  V2_BONE,
  V2_MUTED,
  V2_STRONG,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import { formatStudyMinutes, type StudySplit } from "@/services/studyTime.service";

export const STUDY_COLORS = {
  self: "#3363AD",
  meeting: "#10B981",
  group: "#F59E0B",
};

const SERIES: { key: keyof Pick<StudySplit, "self" | "meeting" | "group">; name: string }[] = [
  { key: "self", name: "Self-paced" },
  { key: "meeting", name: "Meeting" },
  { key: "group", name: "Group study" },
];

export const STUDY_RANGES = [7, 30, 90] as const;

export const StudyRangeSelect: React.FC<{ value: number; onChange: (days: number) => void }> = ({
  value,
  onChange,
}) => (
  <div className='inline-flex rounded-xl border border-[#B8CDE0] dark:border-slate-600 p-0.5'>
    {STUDY_RANGES.map((d) => (
      <button
        key={d}
        type='button'
        onClick={() => onChange(d)}
        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
          value === d
            ? "bg-[#3363AD] text-white"
            : "text-[#5B6575] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-700"
        }`}
      >
        {d}d
      </button>
    ))}
  </div>
);

export const StudyLegend: React.FC = () => (
  <div className={`flex flex-wrap items-center gap-3 text-[11px] ${V2_MUTED}`}>
    {SERIES.map((s) => (
      <span key={s.key} className='inline-flex items-center gap-1.5'>
        <span className='w-2.5 h-2.5 rounded-[3px]' style={{ backgroundColor: STUDY_COLORS[s.key] }} />
        {s.name}
      </span>
    ))}
  </div>
);

export const StudyKpi: React.FC<{ label: string; value: string; hint?: string }> = ({
  label,
  value,
  hint,
}) => (
  <div className='rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 px-3 py-2.5 min-w-0'>
    <p className={`text-[11px] font-semibold ${V2_MUTED}`}>{label}</p>
    <p className={`text-lg font-extrabold leading-tight truncate ${V2_STRONG}`}>{value}</p>
    {hint && <p className={`text-[10px] truncate ${V2_MUTED}`}>{hint}</p>}
  </div>
);

/** Self-paced vs supervised share as a single stacked bar. */
export const StudySplitBar: React.FC<{ split: StudySplit }> = ({ split }) => {
  const total = split.self + split.supervised;
  const pct = (n: number) => (total ? (n / total) * 100 : 0);
  return (
    <div>
      <div className='flex h-2.5 w-full overflow-hidden rounded-full bg-[#E8EEF5] dark:bg-slate-700'>
        {SERIES.map((s) => (
          <div
            key={s.key}
            style={{ width: `${pct(split[s.key])}%`, backgroundColor: STUDY_COLORS[s.key] }}
          />
        ))}
      </div>
      <div className={`mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] ${V2_MUTED}`}>
        {SERIES.map((s) => (
          <span key={s.key}>
            <span className='font-bold' style={{ color: STUDY_COLORS[s.key] }}>
              {Math.round(pct(split[s.key]))}%
            </span>{" "}
            {s.name} · {formatStudyMinutes(split[s.key])}
          </span>
        ))}
      </div>
    </div>
  );
};

const tooltipStyle = {
  backgroundColor: "#FFFFFF",
  borderRadius: "10px",
  border: "1px solid #C8D6E3",
  fontSize: "11px",
};
const axisTick = { fill: "#9AA3B2", fontSize: 10 };
const formatTooltip = (value: number, name: string) => [formatStudyMinutes(value), name];

/** Stacked minutes per category (hour of day, weekday, …). */
export const StudyStackedBars: React.FC<{
  data: StudySplit[];
  xKey: string;
  height?: number;
  tickFormatter?: (v: number | string) => string;
}> = ({ data, xKey, height = 180, tickFormatter }) => (
  <div style={{ height }}>
    <ResponsiveContainer width='100%' height='100%'>
      <BarChart data={data} margin={{ top: 6, right: 4, left: -18, bottom: 0 }} barCategoryGap='14%'>
        <CartesianGrid vertical={false} stroke='#E8EEF5' />
        <XAxis
          dataKey={xKey}
          axisLine={false}
          tickLine={false}
          tick={axisTick}
          interval='preserveStartEnd'
          tickFormatter={tickFormatter}
        />
        <YAxis axisLine={false} tickLine={false} tick={axisTick} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "rgba(200, 214, 227, 0.25)" }}
          contentStyle={tooltipStyle}
          formatter={formatTooltip}
          labelFormatter={(l) => (tickFormatter ? tickFormatter(l) : String(l))}
        />
        {SERIES.map((s, idx) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            stackId='a'
            fill={STUDY_COLORS[s.key]}
            radius={idx === SERIES.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            maxBarSize={22}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  </div>
);

/** Daily self-paced vs supervised minutes. */
export const StudyDailyTrend: React.FC<{ data: ({ date: string } & StudySplit)[]; height?: number }> = ({
  data,
  height = 160,
}) => (
  <div style={{ height }}>
    <ResponsiveContainer width='100%' height='100%'>
      <AreaChart data={data} margin={{ top: 6, right: 4, left: -18, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke='#E8EEF5' />
        <XAxis
          dataKey='date'
          axisLine={false}
          tickLine={false}
          tick={axisTick}
          minTickGap={24}
          tickFormatter={(d: string) => d.slice(5)}
        />
        <YAxis axisLine={false} tickLine={false} tick={axisTick} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={formatTooltip} />
        <Area
          type='monotone'
          dataKey='self'
          name='Self-paced'
          stackId='a'
          stroke={STUDY_COLORS.self}
          fill={STUDY_COLORS.self}
          fillOpacity={0.25}
        />
        <Area
          type='monotone'
          dataKey='supervised'
          name='Supervised'
          stackId='a'
          stroke={STUDY_COLORS.meeting}
          fill={STUDY_COLORS.meeting}
          fillOpacity={0.25}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export const StudyChartTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className={`text-[12px] font-bold mb-1 ${V2_STRONG}`}>{children}</p>
);

export const StudySkeleton: React.FC = () => (
  <div className='space-y-3 p-4'>
    <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${V2_BONE} h-16 animate-pulse`} />
      ))}
    </div>
    <div className={`${V2_BONE} h-40 animate-pulse`} />
  </div>
);

export const hourTick = (h: number | string) => `${String(h).padStart(2, "0")}h`;
