import React from "react";
import { Card } from "@/components/common/Card";
import { IEnrollmentTrend } from "@/types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { DashboardSectionHeader } from "./shared/DashboardSectionHeader";

interface EnrollmentTrendChartProps {
  trends: IEnrollmentTrend[];
}

export const EnrollmentTrendChart: React.FC<EnrollmentTrendChartProps> = ({ trends }) => {
  if (!trends || trends.length === 0) {
    return (
      <Card>
        <DashboardSectionHeader
          icon={<TrendingUp size={16} />}
          title="Enrollment Trends"
        />
        <div className="flex items-center justify-center h-40 text-sm text-gray-400">
          No data available
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <DashboardSectionHeader
        icon={<TrendingUp size={16} />}
        title="Enrollment Trends"
      />
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trends} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                boxShadow: "none",
              }}
              formatter={(v: number) => [v, "Enrollments"]}
            />
            <Line
              type="monotone"
              dataKey="enrollments"
              stroke="#3363AD"
              strokeWidth={2}
              dot={{ r: 3, fill: "#3363AD", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
