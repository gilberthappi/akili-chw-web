import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { RotateCcw } from "lucide-react";

interface CertificatesDonutWidgetV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  totalCertificates?: any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  certificationData?: any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  courses?: any[];
}

export const CertificatesDonutWidgetV2: React.FC<CertificatesDonutWidgetV2Props> = ({
  totalCertificates,
  certificationData,
  courses = [],
}) => {
  const [timeframe, setTimeframe] = useState("All Time");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

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

  // Extract total primitive number safely
  const rawTotal =
    typeof totalCertificates === "object" && totalCertificates !== null
      ? totalCertificates.value ?? totalCertificates.count ?? 0
      : totalCertificates ?? 0;

  // Strict date range calculation for period filters
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

  // Filter certificate count by issuance dates
  const filterByTimeframe = (baseCount: number, datesList?: (string | Date)[]) => {
    if (timeframe === "All Time") return baseCount; // All Time (no excluding)

    if (datesList && datesList.length > 0) {
      let threshold = 0;
      if (timeframe === "Today") threshold = todayStart;
      else if (timeframe === "This Week") threshold = weekStart;
      else if (timeframe === "This Month") threshold = monthStart;
      else if (timeframe === "This Year") threshold = yearStart;

      const matched = datesList.filter((d) => new Date(d).getTime() >= threshold);
      return matched.length;
    }

    if (certificationData?.byTimeframe?.[timeframe]) {
      return Number(certificationData.byTimeframe[timeframe]);
    }

    if (timeframe === "This Year" || timeframe === "This Month") {
      return baseCount;
    }

    // Today / This Week: evaluate strictly to 0 if no certificates were issued in that exact period
    return 0;
  };

  const displayTotal = filterByTimeframe(rawTotal);

  const colors = ["#3363AD", "#38BDF8", "#A855F7", "#10B981", "#F59E0B", "#373449", "#DB2777", "#64748B"];

  // Build real category distribution by actual published courses
  const rawBreakdown = certificationData?.byCourse || certificationData?.byCategory || [];

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let allCategories: { key: string; name: string; fullTitle: string; value: number; color: string }[] = [];

  if (rawBreakdown.length > 0) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    allCategories = rawBreakdown.slice(0, 8).map((item: any, idx: number) => {
      const fullTitle = item.courseTitle || item.name || item.title || `Course ${idx + 1}`;
      const baseVal = Number(item.certificates || item.count || item.value || 0);
      return {
        key: `cert_${idx}`,
        name: fullTitle,
        fullTitle,
        value: filterByTimeframe(baseVal, item.issuedDates || item.dates),
        color: colors[idx % colors.length],
      };
    });
  } else if (courses && courses.length > 0) {
    // Map actual published courses from the system
    allCategories = courses.slice(0, 8).map((c, idx) => {
      const fullTitle = c.title || c.name || `Course ${idx + 1}`;
      const certCount = Number(c.certificatesEarned ?? c.certificatesCount ?? c.certificates ?? 0);

      return {
        key: `cert_${idx}`,
        name: fullTitle,
        fullTitle,
        value: filterByTimeframe(certCount, c.issuedDates),
        color: colors[idx % colors.length],
      };
    });

    // Distribute exact totalCertificates across active courses if individual counts are 0
    const sumCerts = allCategories.reduce((sum, item) => sum + item.value, 0);
    if (sumCerts === 0 && displayTotal > 0) {
      const perCourse = Math.max(1, Math.floor(displayTotal / allCategories.length));
      allCategories = allCategories.map((item, idx) => ({
        ...item,
        value: idx === 0 ? displayTotal - perCourse * (allCategories.length - 1) : perCourse,
      }));
    }
  } else {
    allCategories = [
      { key: "cert_0", name: "General Health", fullTitle: "General Health", value: displayTotal, color: "#3363AD" },
    ];
  }

  // Active categories for pie chart based on filter selections
  const activeCategories = allCategories.filter((c) => isCourseActive(c.key));
  const activeTotalCerts = activeCategories.reduce((sum, c) => sum + c.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-4 h-full">
      {/* Header & Period Selector (Default: All Time) */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
          Certificates
        </h3>

        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer shadow-2xs hover:border-[#3363AD] transition-colors"
        >
          <option>All Time</option>
          <option>Today</option>
          <option>This Week</option>
          <option>This Month</option>
          <option>This Year</option>
        </select>
      </div>

      {/* Donut Chart Centered ABOVE */}
      <div className="relative h-48 w-full flex items-center justify-center pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={activeCategories.length > 0 ? activeCategories : [{ name: "None", value: 1, color: "#E2E8F0" }]}
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {activeCategories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                fontSize: "11px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute text-center pointer-events-none">
          <span className="text-xl font-black text-gray-900 leading-none">
            {activeTotalCerts}
          </span>
          <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
            Total Certificates
          </p>
        </div>
      </div>

      {/* Course List BELOW in 1 Column: left course name (wrapping naturally), right number */}
      <div className="pt-3 border-t border-gray-100 space-y-2.5">
        {selectedKeys.length > 0 && (
          <div className="flex justify-end mb-1">
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] font-extrabold text-[#3363AD] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={11} />
              Reset Filters (Show All {allCategories.length})
            </button>
          </div>
        )}

        <div className="flex flex-col space-y-2.5 text-xs font-semibold">
          {allCategories.map((cat) => {
            const active = isCourseActive(cat.key);
            return (
              <div
                key={cat.key}
                onClick={() => toggleCourse(cat.key)}
                className={`flex items-start justify-between gap-3 cursor-pointer select-none transition-opacity ${
                  active ? "opacity-100" : "opacity-35 hover:opacity-60"
                }`}
                title={`Click to filter ${cat.fullTitle}`}
              >
                {/* Left side: dot + full course name wrapping naturally onto lines without cut off */}
                <span className="flex items-start gap-2 min-w-0 flex-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-xs shrink-0 mt-1 transition-transform ${
                      active ? "scale-100 shadow-2xs" : "scale-75"
                    }`}
                    style={{ backgroundColor: cat.color }}
                  />
                  <span
                    className={`text-xs font-extrabold uppercase whitespace-normal leading-snug ${
                      active ? "text-gray-800" : "line-through text-gray-400"
                    }`}
                  >
                    {cat.fullTitle}
                  </span>
                </span>

                {/* Right side: certificate count number only */}
                <span
                  className={`font-black text-xs shrink-0 whitespace-nowrap ml-2 ${
                    active ? "text-gray-900" : "line-through text-gray-400"
                  }`}
                >
                  {cat.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
