import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import { useAdminDashboardV2EnrollmentTrends } from "@/hooks/useAdminDashboardV2EnrollmentTrends";
import { ChartSkeleton } from "./AdminWidgetSkeleton";
import { V2_CARD_SHELL_PADDED } from "./v2CardStyles";

export const EnrollmentTrendsWidgetV2: React.FC = () => {
  const { filters } = useAdminDashboardFilters();
  const [timeframe, setTimeframe] = useState("Monthly");
  const { series, isLoading } = useAdminDashboardV2EnrollmentTrends(
    filters,
    timeframe,
  );

  const chartData = series.map((p) => ({
    month: p.label,
    activeEnrollments: p.activeEnrollments,
    completions: p.completions,
    certifications: p.certifications,
  }));

  return (
    <div className={`${V2_CARD_SHELL_PADDED} flex flex-col w-full h-full min-h-0 overflow-hidden`}>
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight">
          Trends
        </h3>
        <div className="relative shrink-0">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="appearance-none text-[11px] font-semibold bg-white border border-[#B8CDE0] text-[#5B6575] rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none cursor-pointer hover:border-[#4B82BA] transition-colors"
          >
            <option>Monthly</option>
            <option>Weekly</option>
            <option>Quarterly</option>
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5B6575] pointer-events-none"
          />
        </div>
      </div>

      {isLoading && chartData.length === 0 ? (
        <ChartSkeleton />
      ) : chartData.length === 0 ? (
        <div className="flex-1 min-h-0 flex items-center justify-center text-[12px] text-[#9AA3B2]">
          No trend data for these filters
        </div>
      ) : (
        <div className="flex-1 min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E8EEF4"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#5B6575", fontSize: 10, fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9AA3B2", fontSize: 9 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "10px",
                  border: "1px solid #C8D6E3",
                  fontSize: "11px",
                }}
              />
              <Line
                type="monotone"
                dataKey="activeEnrollments"
                name="Active Enrollments"
                stroke="#F97316"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#F97316", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="completions"
                name="Completions"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#059669", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="certifications"
                name="Certifications"
                stroke="#3363AD"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#3363AD", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex items-center justify-center gap-3 flex-wrap text-[10px] font-semibold text-[#5B6575] pt-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-[#F97316] inline-block rounded-full" />
          <span>Active Enrollments</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-[#059669] inline-block rounded-full" />
          <span>Completions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-[#3363AD] inline-block rounded-full" />
          <span>Certifications</span>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentTrendsWidgetV2;
