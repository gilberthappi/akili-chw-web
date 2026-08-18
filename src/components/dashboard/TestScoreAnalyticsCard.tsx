import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "@/components/common/Card";
import { DashboardSectionHeader } from "./shared/DashboardSectionHeader";
import { ITestScoreAnalytics } from "@/types";
import { BookOpen } from "lucide-react";
import { OBLIQUE_BAR_MARGIN, OBLIQUE_X_AXIS } from "./shared/chartAxis";

interface TestScoreAnalyticsCardProps {
  data: ITestScoreAnalytics | null;
}

type ViewMode = "course" | "district";

export const TestScoreAnalyticsCard: React.FC<TestScoreAnalyticsCardProps> = ({
  data,
}) => {
  const [view, setView] = useState<ViewMode>("course");

  if (!data || data.byCourse.length === 0) {
    return (
      <Card>
        <DashboardSectionHeader icon={<BookOpen size={16} />} title='Test Scores' />
        <div className='flex items-center justify-center h-40 text-sm text-gray-400'>
          No data available
        </div>
      </Card>
    );
  }

  // Build chart data — only rows with at least one score, switchable by course/district
  const chartData =
    view === "course"
      ? data.byCourse
          .filter((c) => c.meanPreTest !== null || c.meanFinalTest !== null)
          .map((c) => {
            const label = c.shortName?.trim() || c.courseTitle;
            return {
              name: label.length > 16 ? label.slice(0, 16) + "…" : label,
              fullLabel: label,
              "Pre-test": c.meanPreTest ?? 0,
              "Final test": c.meanFinalTest ?? 0,
            };
          })
      : (data.byDistrict ?? [])
          .filter((d) => d.meanPreTest !== null || d.meanFinalTest !== null)
          .map((d) => ({
            name: d.district,
            fullLabel: d.district,
            "Pre-test": d.meanPreTest ?? 0,
            "Final test": d.meanFinalTest ?? 0,
          }));

  const gain = data.overallKnowledgeGain;
  const GainIcon = gain > 0 ? TrendingUp : gain < 0 ? TrendingDown : Minus;
  const gainColor =
    gain > 0 ? "text-green-600" : gain < 0 ? "text-red-500" : "text-gray-400";

  return (
    <Card>
      <DashboardSectionHeader icon={<BookOpen size={16} />} title='Test Scores' />

      {/* Overall KPIs */}
      <div className='grid grid-cols-3 gap-3 mb-4'>
        <div className='bg-gray-50 rounded-lg p-3 text-center'>
          <p className='text-xs text-gray-500 mb-1'>Pre-training</p>
          <p className='text-xl font-bold text-gray-700'>
            {data.overallMeanPreTest > 0 ? `${data.overallMeanPreTest}%` : "—"}
          </p>
        </div>
        <div className='bg-gray-50 rounded-lg p-3 text-center'>
          <p className='text-xs text-gray-500 mb-1'>Post-training</p>
          <p className='text-xl font-bold text-[#3363AD]'>
            {data.overallMeanFinalTest > 0 ? `${data.overallMeanFinalTest}%` : "—"}
          </p>
        </div>
        <div className='bg-gray-50 rounded-lg p-3 text-center'>
          <p className='text-xs text-gray-500 mb-1'>Knowledge Gain</p>
          <div className={`flex items-center justify-center gap-1 ${gainColor}`}>
            <GainIcon size={14} />
            <p className='text-xl font-bold'>
              {gain !== 0 ? `${gain > 0 ? "+" : ""}${gain}%` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div className='flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-3'>
        {([
          { key: "course", label: "By Course" },
          { key: "district", label: "By District" },
        ] as { key: ViewMode; label: string }[]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              view === tab.key
                ? "bg-white text-[#3363AD] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div style={{ height: 260 }}>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart
              data={chartData}
              margin={OBLIQUE_BAR_MARGIN}
              barSize={28}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                stroke='#f0f0f0'
                vertical={false}
              />
              <XAxis
                dataKey='name'
                {...OBLIQUE_X_AXIS}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Score (%)",
                  angle: -90,
                  position: "insideLeft",
                  dx: -12,
                  style: { fontSize: 10, fill: "#9ca3af", textAnchor: "middle" },
                }}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
                labelFormatter={(_label, payload) =>
                  (payload?.[0]?.payload as { fullLabel?: string } | undefined)
                    ?.fullLabel ?? _label
                }
                formatter={(value: number, name: string) => [`${value}%`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey='Pre-test' fill='#6E95CB' radius={[3, 3, 0, 0]} />
              <Bar dataKey='Final test' fill='#3363AD' radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.byCourse.filter(
        (c) => c.meanPreTest !== null && c.meanFinalTest === null,
      ).length > 0 && (
        <p className='text-xs text-amber-600 mt-2'>
          * Some courses have no final test data yet
        </p>
      )}
    </Card>
  );
};
