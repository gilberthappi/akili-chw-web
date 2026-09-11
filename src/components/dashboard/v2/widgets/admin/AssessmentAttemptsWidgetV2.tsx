import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import { useAdminDashboardV2AssessmentAttempts } from "@/hooks/useAdminDashboardV2AssessmentAttempts";
import { DonutSkeleton } from "./AdminWidgetSkeleton";

const EMPTY_SEGMENTS = [
  { name: "Pre Test", value: 0, color: "#4A5568" },
  { name: "Mid Test", value: 0, color: "#A8C5D8" },
  { name: "Post Test", value: 0, color: "#4B82BA" },
  { name: "Certificate Test", value: 0, color: "#C5CDD6" },
];

export const AssessmentAttemptsWidgetV2: React.FC = () => {
  const { filters } = useAdminDashboardFilters();
  const { data, isLoading } = useAdminDashboardV2AssessmentAttempts(filters);

  const totalTests = data?.totalTests ?? 0;
  const bars = data?.bars ?? [];
  const segments =
    data?.segments?.length && data.segments.some((s) => s.value > 0)
      ? data.segments
      : EMPTY_SEGMENTS;

  return (
    <div className="bg-white rounded-[20px] border border-[#C8D6E3] p-3.5 flex flex-col w-full h-full min-h-0">
      <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight mb-1.5">
        Assessment Test Attempts
      </h3>

      {isLoading && !data ? (
        <DonutSkeleton />
      ) : (
        <>
          <div className="relative h-44 flex items-center justify-center shrink-0 mb-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[...segments]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  startAngle={90}
                  endAngle={-270}
                >
                  {segments.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      style={{ cursor: "pointer", outline: "none" }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} Tests`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "10px",
                    border: "1px solid #C8D6E3",
                    fontSize: "11px",
                    color: "#1A2332",
                  }}
                  itemStyle={{ color: "#5B6575" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center pointer-events-none px-1">
              <span className="text-[26px] font-bold text-[#5B6575] leading-none tabular-nums">
                {totalTests}
              </span>
              <p className="text-[11px] font-medium text-[#9AA3B2] mt-1 leading-none whitespace-nowrap">
                Total Tests taken
              </p>
            </div>
          </div>

          <div className="space-y-2.5 flex-1 flex flex-col justify-evenly min-h-0">
            {bars.map((bar) => (
              <div key={bar.key}>
                <p className="text-[11px] font-medium text-[#5B6575] mb-1">
                  {bar.name}
                </p>

                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-[18px] rounded-none bg-[#CFE0EB] flex items-center justify-center px-2">
                    <span className="text-[10px] font-semibold text-[#5B6575] tabular-nums">
                      {bar.tests} Tests
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-[#5B6575] tabular-nums w-10 text-right shrink-0">
                    {bar.sharePercent}%
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full">
                  <div
                    className="h-[18px] rounded-none bg-[#4B82BA] flex items-center px-2 shrink-0 min-w-[6.5rem]"
                    style={{
                      width: `${Math.min(100, Math.max(bar.avgScore, 8))}%`,
                    }}
                  >
                    <span className="text-[10px] font-semibold text-white whitespace-nowrap">
                      {bar.avgScore} Avg Score
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-[#5B6575] tabular-nums shrink-0">
                    {bar.variation.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AssessmentAttemptsWidgetV2;
