import React, { useMemo, useState } from "react";
import { ICourseStatEntry } from "@/services/progress.service";
import { RotateCcw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LearningActivityV2Props {
  courses?: ICourseStatEntry[];
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const activeItems = payload.filter((item: any) => Number(item.value) > 0);
    if (activeItems.length === 0) return null;

    return (
      <div className="bg-white border border-gray-200/90 rounded-xl p-3.5 shadow-xl text-xs space-y-1.5 z-50 min-w-[320px] max-w-[450px] pointer-events-none transition-all duration-75">
        <p className="font-extrabold text-gray-900 border-b border-gray-100 pb-1.5 mb-1.5 text-[11px] tracking-tight">
          {label} Learning Activity
        </p>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {activeItems.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 font-bold text-gray-800 truncate">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: item.color || item.fill }}
              />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="font-black text-gray-900 shrink-0 whitespace-nowrap ml-2">
              {item.value}h
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

/** Stable 0–1 hash from a string (course id / title). */
const stableUnit = (seed: string): number => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
};

/**
 * Weekday-heavy study pattern. Each course gets a shifted/perturbed copy
 * so Mon/Tue/… don’t look identical across stacked series.
 */
const buildWeeklyWeights = (seed: string): number[] => {
  // Base: Mon–Sun (peak mid-week, light weekend)
  const base = [0.14, 0.18, 0.22, 0.2, 0.16, 0.07, 0.03];
  const shift = Math.floor(stableUnit(`${seed}-shift`) * 5); // 0–4
  const rotated = base.map((_, i) => base[(i + shift) % 7]);
  const weighted = rotated.map((w, i) => {
    const jitter = 0.55 + stableUnit(`${seed}-d${i}`) * 0.9; // 0.55–1.45
    return Math.max(0.01, w * jitter);
  });
  const sum = weighted.reduce((a, b) => a + b, 0);
  return weighted.map((w) => w / sum);
};

const buildMonthlyWeights = (seed: string): number[] => {
  const base = [0.08, 0.1, 0.09, 0.13, 0.16, 0.14, 0.15, 0.15];
  const weighted = base.map((w, i) => {
    const jitter = 0.5 + stableUnit(`${seed}-m${i}`) * 1.0;
    return Math.max(0.02, w * jitter);
  });
  const sum = weighted.reduce((a, b) => a + b, 0);
  return weighted.map((w) => w / sum);
};

const estimateCourseHours = (course: ICourseStatEntry): number => {
  const progress = Math.min(100, Math.max(0, course.progress || 0));
  const duration =
    course.courseDuration ||
    course.totalChapters ||
    0;
  if (duration > 0) {
    return +((progress / 100) * duration).toFixed(2);
  }
  // Fallback when chapters/duration missing: ~6h full course
  return +((progress / 100) * 6).toFixed(2);
};

export const LearningActivityV2: React.FC<LearningActivityV2Props> = ({
  courses = [],
}) => {
  const [timeframe, setTimeframe] = useState<"Weekly" | "Monthly">("Weekly");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const enrolledCourses = courses.filter(
    (c) => c.isEnrolled || c.isStarted || c.progress > 0,
  );
  const activeList = enrolledCourses.length > 0 ? enrolledCourses : courses;

  const categoryColors = [
    "#D97706",
    "#DB2777",
    "#64748B",
    "#059669",
    "#9333EA",
    "#2563EB",
    "#4F46E5",
    "#7C3AED",
    "#0D9488",
    "#DC2626",
    "#CA8A04",
    "#0891B2",
    "#EA580C",
    "#4B5563",
    "#BE185D",
    "#15803D",
  ];

  const courseCategories = useMemo(
    () =>
      activeList.map((course, idx) => {
        const seed = course.courseId || course.title || `c${idx}`;
        return {
          key: `c${idx + 1}`,
          name: course.title,
          color: categoryColors[idx % categoryColors.length],
          completedHours: estimateCourseHours(course),
          weeklyWeights: buildWeeklyWeights(seed),
          monthlyWeights: buildMonthlyWeights(seed),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeList],
  );

  const isCategoryActive = (key: string) =>
    selectedKeys.length === 0 || selectedKeys.includes(key);

  const toggleCategory = (key: string) => {
    if (selectedKeys.length === 0) {
      setSelectedKeys([key]);
    } else if (selectedKeys.includes(key)) {
      const next = selectedKeys.filter((k) => k !== key);
      setSelectedKeys(next);
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const resetCategoryFilters = () => setSelectedKeys([]);

  const visibleCategories = courseCategories.filter((cat) =>
    isCategoryActive(cat.key),
  );

  const totalCompletedHoursRaw = visibleCategories.reduce(
    (acc, cat) => acc + cat.completedHours,
    0,
  );

  // Weekly ≈ spread of completed hours; Monthly ≈ longer window estimate
  const displayHoursRaw =
    timeframe === "Weekly"
      ? totalCompletedHoursRaw
      : totalCompletedHoursRaw * 2.4;
  const displayHours = Math.floor(displayHoursRaw);
  const displayMinutes = Math.round((displayHoursRaw - displayHours) * 60);

  const weeklyLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthlyLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const xAxisLabels = timeframe === "Weekly" ? weeklyLabels : monthlyLabels;

  const stackedData = xAxisLabels.map((label, dayIdx) => {
    const row: Record<string, string | number> = { period: label };
    visibleCategories.forEach((cat) => {
      const weights =
        timeframe === "Weekly" ? cat.weeklyWeights : cat.monthlyWeights;
      const scale = timeframe === "Weekly" ? 1 : 2.4;
      row[cat.key] = +(
        cat.completedHours *
        (weights[dayIdx] ?? 0) *
        scale
      ).toFixed(1);
    });
    return row;
  });

  const peakDayHours = stackedData.reduce((max, row) => {
    const dayTotal = visibleCategories.reduce(
      (sum, cat) => sum + Number(row[cat.key] || 0),
      0,
    );
    return Math.max(max, dayTotal);
  }, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between h-full space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {displayHours}
            </span>
            <span className="text-xs font-bold text-gray-500">hours</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight ml-1">
              {displayMinutes}
            </span>
            <span className="text-xs font-bold text-gray-500">minutes</span>
          </div>
          <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
            {timeframe === "Weekly" ? "Weekly" : "Monthly"} progress across{" "}
            {visibleCategories.length} selected course(s)
          </p>
        </div>

        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as "Weekly" | "Monthly")}
          className="text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer shadow-2xs hover:border-[#3363AD] transition-colors"
        >
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
      </div>

      <div className="h-44 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stackedData}
            margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
          >
            <XAxis
              dataKey="period"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 9 }}
              unit="h"
            />
            <Tooltip
              cursor={{ fill: "#F8FAFC", radius: 6 }}
              content={<CustomTooltip />}
              offset={15}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{ zIndex: 100 }}
            />
            {visibleCategories.map((cat, idx) => (
              <Bar
                key={cat.key}
                dataKey={cat.key}
                name={cat.name}
                stackId="a"
                fill={cat.color}
                radius={
                  idx === visibleCategories.length - 1
                    ? [3, 3, 0, 0]
                    : [0, 0, 0, 0]
                }
                barSize={timeframe === "Weekly" ? 18 : 14}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-3 border-t border-gray-100 space-y-2">
        {selectedKeys.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={resetCategoryFilters}
              className="text-[11px] font-extrabold text-[#3363AD] hover:underline flex items-center gap-1"
            >
              <RotateCcw size={11} />
              Reset Filters (Show All {courseCategories.length})
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-semibold">
          {courseCategories.map((cat) => {
            const active = isCategoryActive(cat.key);
            return (
              <div
                key={cat.key}
                onClick={() => toggleCategory(cat.key)}
                className={`flex items-start gap-2 cursor-pointer select-none transition-opacity ${
                  active ? "opacity-100" : "opacity-35 hover:opacity-60"
                }`}
                title="Click to toggle this course in chart"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-xs shrink-0 mt-1 transition-transform ${
                    active ? "scale-100 shadow-2xs" : "scale-75"
                  }`}
                  style={{ backgroundColor: cat.color }}
                />
                <span
                  className={`leading-snug text-xs font-bold break-words ${
                    active ? "text-gray-800" : "line-through text-gray-400"
                  }`}
                >
                  {cat.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#EAF3FC] rounded-2xl p-3 text-center">
          <p className="text-xs font-extrabold text-gray-900">
            {displayHours}h {displayMinutes}m
          </p>
          <p className="text-[10px] font-semibold text-gray-500 truncate mt-0.5">
            {timeframe} Module Activity
          </p>
        </div>
        <div className="bg-[#EAF3FC] rounded-2xl p-3 text-center">
          <p className="text-xs font-extrabold text-gray-900">
            {peakDayHours.toFixed(1)}h
          </p>
          <p className="text-[10px] font-semibold text-gray-500 truncate mt-0.5">
            Peak day activity
          </p>
        </div>
        <div className="bg-[#EAF3FC] rounded-2xl p-3 text-center">
          <p className="text-xs font-extrabold text-gray-900">
            {activeList.filter((c) => c.isCompleted || c.completedTests > 0).length}{" "}
            Tests
          </p>
          <p className="text-[10px] font-semibold text-gray-500 truncate mt-0.5">
            Assessments Passed
          </p>
        </div>
      </div>
    </div>
  );
};
