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
import { SECTION5_ENROLLMENT_TRENDS } from "./section5DesignData";

interface EnrollmentTrendsWidgetV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  trendsData?: any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  summaryData?: any;
  useDesignDummy?: boolean;
}

export const EnrollmentTrendsWidgetV2: React.FC<EnrollmentTrendsWidgetV2Props> = () => {
  const [timeframe, setTimeframe] = useState("Monthly");
  const chartData = [...SECTION5_ENROLLMENT_TRENDS];

  return (
    <div className="bg-white rounded-[20px] border border-[#C8D6E3] p-3.5 flex flex-col w-full h-full min-h-0 overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight">
          Enrollment trends
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

      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF4" vertical={false} />
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
              dataKey="testAttempts"
              name="Test Attempts"
              stroke="#3363AD"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#3363AD", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 text-[10px] font-semibold text-[#5B6575] pt-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-[#F97316] inline-block rounded-full" />
          <span>Active Enrollments</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-[#3363AD] inline-block rounded-full" />
          <span>Test Attempts</span>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentTrendsWidgetV2;
