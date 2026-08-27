import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface EngagementChartWidgetV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  trendsData?: any[];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  courses?: any[];
}

export const EngagementChartWidgetV2: React.FC<EngagementChartWidgetV2Props> = ({
  trendsData,
  courses = [],
}) => {
  const [timeframe, setTimeframe] = useState("This Year");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Toggle category filter selection matching CHW / CEHO dashboard behavior
  const isCourseActive = (key: string) =>
    selectedKeys.length === 0 || selectedKeys.includes(key);

  const toggleCourse = (key: string) => {
    if (selectedKeys.length === 0) {
      setSelectedKeys([key]);
    } else if (selectedKeys.includes(key)) {
      const next = selectedKeys.filter((k) => k !== key);
      setSelectedKeys(next);
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const resetFilters = () => {
    setSelectedKeys([]);
  };

  // Palette of crisp modern colors for dynamic course bars
  const colorPalette = [
    "#D97706", // Dark Amber
    "#DB2777", // Dark Pink
    "#64748B", // Slate
    "#059669", // Emerald
    "#9333EA", // Purple
    "#2563EB", // Blue
    "#4F46E5", // Indigo
    "#7C3AED", // Violet
  ];

  // Derive dynamic course domains from published courses list with FULL titles (no cut off)
  const domains =
    courses && courses.length > 0
      ? courses.slice(0, 8).map((c, idx) => {
          const fullTitle = c.title || c.name || `Course ${idx + 1}`;
          const realEnrollments = Number(c.totalEnrollments ?? c.enrollmentsCount ?? c.studentsCount ?? (c.isEnrolled ? 1 : 0));
          return {
            key: `course_${idx}`,
            name: fullTitle,
            color: colorPalette[idx % colorPalette.length],
            enrollments: realEnrollments,
          };
        })
      : [];

  const totalAllEnrollments = domains.reduce((sum, d) => sum + d.enrollments, 0);

  // Determine X-Axis ticks and time labels based on selected timeframe
  let timeLabels: string[] = [];

  if (timeframe === "Today") {
    timeLabels = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
  } else if (timeframe === "This Week") {
    timeLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  } else if (timeframe === "This Month") {
    timeLabels = ["Week 1", "Week 2", "Week 3", "Week 4"];
  } else {
    // This Year
    timeLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const monthlyData = timeLabels.map((label, tIdx) => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const row: Record<string, any> = { month: label };

    domains.forEach((domain) => {
      // If course is not selected in active filter mode, value is 0
      if (!isCourseActive(domain.key)) {
        row[domain.key] = 0;
        return;
      }

      const trendItem = trendsData?.[tIdx];
      const monthlyTotal = Number(trendItem?.enrollments ?? trendItem?.count ?? 0);

      if (monthlyTotal > 0 && totalAllEnrollments > 0) {
        // Distribute real backend monthly total by course enrollment ratio
        row[domain.key] = Math.round(monthlyTotal * (domain.enrollments / totalAllEnrollments));
      } else if ((timeframe === "This Year" || timeframe === "This Month") && domain.enrollments > 0) {
        // Real database course enrollment count
        row[domain.key] = domain.enrollments;
      } else {
        // Strictly 0 if no database records exist for this interval
        row[domain.key] = 0;
      }
    });

    return row;
  });

  // Calculate max stacked value for dynamic Y-Axis height based on active visible bars
  const visibleDomains = domains.filter((d) => isCourseActive(d.key));
  const maxStackedValue = Math.max(
    20,
    ...monthlyData.map((row) =>
      visibleDomains.reduce((sum, d) => sum + (Number(row[d.key]) || 0), 0)
    )
  );

  const roundedYMax = Math.ceil(maxStackedValue / 20) * 20 || 50;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-4 h-full">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
          Engagement
        </h3>

        {/* Timeframe Selector Dropdown */}
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer shadow-2xs hover:border-[#3363AD] transition-colors"
        >
          <option>Today</option>
          <option>This Week</option>
          <option>This Month</option>
          <option>This Year</option>
        </select>
      </div>

      {/* Stacked Bar Chart */}
      <div className="h-52 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyData}
            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 600 }}
            />
            <YAxis
              domain={[0, roundedYMax]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 9 }}
            />
            <Tooltip
              cursor={{ fill: "#F8FAFC", radius: 6 }}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                color: "#0F172A",
                fontSize: "11px",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
              }}
            />
            {domains.map((d, idx) =>
              isCourseActive(d.key) ? (
                <Bar
                  key={d.key}
                  dataKey={d.key}
                  name={d.name}
                  stackId="a"
                  fill={d.color}
                  radius={idx === domains.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                  barSize={16}
                />
              ) : null
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Course Indicators / Legend BELOW the graph matching CEHO & CHW 2-column layout */}
      <div className="pt-3 border-t border-gray-100 space-y-2">
        {selectedKeys.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] font-extrabold text-[#3363AD] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={11} />
              Reset Filters (Show All {domains.length})
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-4 text-xs font-semibold">
          {domains.map((d) => {
            const active = isCourseActive(d.key);
            return (
              <div
                key={d.key}
                onClick={() => toggleCourse(d.key)}
                className={`flex items-start gap-2 cursor-pointer select-none transition-opacity ${
                  active ? "opacity-100" : "opacity-35 hover:opacity-60"
                }`}
                title="Click to filter this course in chart"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-xs shrink-0 mt-1 transition-transform ${
                    active ? "scale-100 shadow-2xs" : "scale-75"
                  }`}
                  style={{ backgroundColor: d.color }}
                />
                <span
                  className={`leading-snug text-xs font-extrabold uppercase break-words ${
                    active ? "text-gray-800" : "line-through text-gray-400"
                  }`}
                >
                  {d.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
