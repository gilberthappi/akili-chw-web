import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const EngagementChartWidgetV2: React.FC = () => {
  const [timeframe, setTimeframe] = useState("Today");

  // Health Domains & Color Tokens matching Figma design
  const domains = [
    { key: "hiv", name: "HIV", color: "#3B82F6" }, // Blue
    { key: "tb", name: "TB", color: "#818CF8" }, // Indigo
    { key: "malaria", name: "Malaria", color: "#A855F7" }, // Purple
    { key: "ncds", name: "NCDs", color: "#373449" }, // Dark Charcoal
  ];

  // 12 Months Engagement Data
  const monthlyData = [
    { month: "Jan", hiv: 50, tb: 40, malaria: 60, ncds: 45 },
    { month: "Feb", hiv: 70, tb: 50, malaria: 80, ncds: 80 },
    { month: "Mar", hiv: 30, tb: 20, malaria: 40, ncds: 30 },
    { month: "Apr", hiv: 60, tb: 45, malaria: 75, ncds: 50 },
    { month: "May", hiv: 45, tb: 35, malaria: 55, ncds: 40 },
    { month: "Jun", hiv: 65, tb: 50, malaria: 60, ncds: 45 },
    { month: "Jul", hiv: 50, tb: 40, malaria: 55, ncds: 40 },
    { month: "Aug", hiv: 40, tb: 30, malaria: 50, ncds: 35 },
    { month: "Sep", hiv: 60, tb: 45, malaria: 70, ncds: 55 },
    { month: "Oct", hiv: 45, tb: 35, malaria: 50, ncds: 40 },
    { month: "Nov", hiv: 35, tb: 25, malaria: 45, ncds: 30 },
    { month: "Dec", hiv: 55, tb: 40, malaria: 65, ncds: 50 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-4 h-full">
      {/* Header & Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
          Engagement
        </h3>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Domain Legend */}
          <div className="flex items-center gap-3 text-xs font-semibold text-gray-600">
            {domains.map((d) => (
              <div key={d.key} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: d.color }}
                />
                <span>{d.name}</span>
              </div>
            ))}
          </div>

          {/* Dropdown Selector */}
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
      </div>

      {/* Stacked Bar Chart */}
      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyData}
            margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
          >
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 600 }}
            />
            <YAxis
              domain={[0, 300]}
              ticks={[0, 50, 100, 150, 200, 250, 300]}
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
            {domains.map((d, idx) => (
              <Bar
                key={d.key}
                dataKey={d.key}
                name={d.name}
                stackId="a"
                fill={d.color}
                radius={idx === domains.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                barSize={16}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
