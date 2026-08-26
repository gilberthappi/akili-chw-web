import React, { useState } from "react";
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

/* Custom Tooltip with wide width so long course names fit cleanly and follow mouse cursor corner */
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

export const LearningActivityV2: React.FC<LearningActivityV2Props> = ({
  courses = [],
}) => {
  const [timeframe, setTimeframe] = useState<"Weekly" | "Monthly">("Weekly");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Filter courses user has enrolled in or started
  const enrolledCourses = courses.filter((c) => c.isEnrolled || c.isStarted || c.progress > 0);
  const activeList = enrolledCourses.length > 0 ? enrolledCourses : courses;

  // Map enrolled courses to health categories for stacked chart colors
  const categoryColors = [
    { key: "c1", color: "#D97706" }, // Dark Amber
    { key: "c2", color: "#DB2777" }, // Dark Pink
    { key: "c3", color: "#64748B" }, // Slate
    { key: "c4", color: "#059669" }, // Emerald
    { key: "c5", color: "#9333EA" }, // Purple
    { key: "c6", color: "#2563EB" }, // Blue
    { key: "c7", color: "#4F46E5" }, // Indigo
    { key: "c8", color: "#7C3AED" }, // Violet
  ];

  const courseCategories = activeList.slice(0, 8).map((course, idx) => ({
    key: `c${idx + 1}`,
    name: course.title,
    color: categoryColors[idx % categoryColors.length].color,
    completedHours: +(((course.progress || 0) / 100) * (course.courseDuration || course.totalChapters || 1)).toFixed(1),
  }));

  // Toggle single or multiple category selections
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

  const resetCategoryFilters = () => {
    setSelectedKeys([]);
  };

  // Filter visible category bars based on selected legend indicators
  const visibleCategories = courseCategories.filter((cat) => isCategoryActive(cat.key));

  // Calculate real total completed study hours across active/filtered courses
  const totalCompletedHoursRaw = visibleCategories.reduce((acc, cat) => acc + cat.completedHours, 0);

  // Weekly hours vs Monthly cumulative hours
  const displayHoursRaw = timeframe === "Weekly" ? totalCompletedHoursRaw : totalCompletedHoursRaw * 3.5;
  const displayHours = Math.floor(displayHoursRaw);
  const displayMinutes = Math.round((displayHoursRaw - displayHours) * 60);

  // Weekly X-Axis (Days of Week) vs Monthly X-Axis (Months of Year)
  const weeklyLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyRatios = [0.2, 0.15, 0.1, 0.2, 0.1, 0.2, 0.05];

  const monthlyLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
  const monthlyRatios = [0.1, 0.12, 0.08, 0.15, 0.18, 0.14, 0.13, 0.1];

  const xAxisLabels = timeframe === "Weekly" ? weeklyLabels : monthlyLabels;
  const ratios = timeframe === "Weekly" ? weeklyRatios : monthlyRatios;

  const stackedData = xAxisLabels.map((label, idx) => {
    const ratio = ratios[idx % ratios.length];
    const multiplier = timeframe === "Weekly" ? 1 : 3.2;
    const row: Record<string, string | number> = { period: label };
    visibleCategories.forEach((cat) => {
      row[cat.key] = +(cat.completedHours * ratio * multiplier).toFixed(1);
    });
    return row;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between h-full space-y-4">
      {/* Header Row with Toggle Selector */}
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

        {/* Dropdown Select: Weekly vs Monthly */}
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as "Weekly" | "Monthly")}
          className="text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer shadow-2xs hover:border-[#3363AD] transition-colors"
        >
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
        </select>
      </div>

      {/* Stacked Bar Chart */}
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
                radius={idx === visibleCategories.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                barSize={timeframe === "Weekly" ? 18 : 14}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Clean Category Legend (Clickable to Filter, matching clean original design without card borders) */}
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

      {/* 3 Summary Pill Boxes */}
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
            {Math.round(displayHoursRaw * 0.25)}h
          </p>
          <p className="text-[10px] font-semibold text-gray-500 truncate mt-0.5">
            Study Session
          </p>
        </div>
        <div className="bg-[#EAF3FC] rounded-2xl p-3 text-center">
          <p className="text-xs font-extrabold text-gray-900">
            {activeList.filter((c) => c.completedTests > 0).length} Tests
          </p>
          <p className="text-[10px] font-semibold text-gray-500 truncate mt-0.5">
            Assessments Passed
          </p>
        </div>
      </div>
    </div>
  );
};
