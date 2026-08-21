import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/common/Card";
import { IDashboardFilters, IStudentAnalytics } from "@/types";
import { BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { OBLIQUE_BAR_MARGIN, OBLIQUE_X_AXIS } from "./shared/chartAxis";
import {
  buildLearnerListSearch,
  LEARNER_LIST_PATH,
} from "@/utils/dashboardLearnerNav";

interface TestScoreCardProps {
  studentAnalytics: IStudentAnalytics | null;
  filters?: IDashboardFilters;
}

const BAND_BY_NAME: Record<string, string> = {
  Excellent: "excellent",
  Good: "good",
  Average: "average",
  Poor: "poor",
  Failing: "failing",
};

export const TestScoreCard: React.FC<TestScoreCardProps> = ({
  studentAnalytics,
  filters,
}) => {
  const navigate = useNavigate();

  if (!studentAnalytics || !studentAnalytics.performanceDistribution) {
    return (
      <Card>
        <div className='flex items-center gap-2 mb-4'>
          <BarChart2 size={20} className='text-[#3363AD]' />
          <h3 className='text-lg font-semibold text-gray-800'>
            CHW Performance
          </h3>
        </div>
        <div className='flex items-center justify-center h-40'>
          <p className='text-gray-500 text-sm'>No data available</p>
        </div>
      </Card>
    );
  }

  const { performanceDistribution, topPerformers } = studentAnalytics;

  const chartData = [
    { name: "Excellent", range: performanceDistribution.excellent.range, value: performanceDistribution.excellent.count, fill: "#3363AD" },
    { name: "Good",      range: performanceDistribution.good.range,      value: performanceDistribution.good.count,      fill: "#22c55e" },
    { name: "Average",   range: performanceDistribution.average.range,   value: performanceDistribution.average.count,   fill: "#f59e0b" },
    { name: "Poor",      range: performanceDistribution.poor.range,      value: performanceDistribution.poor.count,      fill: "#f97316" },
    { name: "Failing",   range: performanceDistribution.failing.range,   value: performanceDistribution.failing.count,   fill: "#ef4444" },
  ];

  const avgScore =
    topPerformers && topPerformers.length > 0
      ? topPerformers.reduce((sum, p) => sum + p.avgScore, 0) / topPerformers.length
      : 0;

  const openBand = (name: string) => {
    const band = BAND_BY_NAME[name];
    if (!band) return;
    navigate(
      `${LEARNER_LIST_PATH}?${buildLearnerListSearch(filters, {
        performanceBand: band,
      })}`,
    );
  };

  return (
    <Card>
      <div className='flex items-center gap-2 mb-1'>
        <BarChart2 size={20} className='text-[#3363AD]' />
        <h3 className='text-lg font-semibold text-gray-800'>CHW Performance</h3>
      </div>
      <p className='text-[11px] text-gray-400 mb-3'>
        Click a bar to list learners in that score band
      </p>

      <div style={{ height: "240px" }}>
        <ResponsiveContainer width='100%' height={240}>
          <BarChart
            data={chartData}
            margin={OBLIQUE_BAR_MARGIN}
            barSize={40}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
            <XAxis
              dataKey='name'
              {...OBLIQUE_X_AXIS}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "CHW",
                angle: -90,
                position: "insideLeft",
                dx: -12,
                style: { fontSize: 10, fill: "#9ca3af", textAnchor: "middle" },
              }}
            />
            <Tooltip
              formatter={(value: number, _name, props) => {
                const range = (props?.payload as { range?: string } | undefined)?.range;
                return [range ? `${value} (${range})` : value, "CHW"];
              }}
              contentStyle={{ fontSize: 12 }}
            />
            <Bar
              dataKey='value'
              radius={[4, 4, 0, 0]}
              cursor='pointer'
              onClick={(data) => {
                const point = data as {
                  name?: string;
                  payload?: { name?: string };
                };
                const name = point?.name ?? point?.payload?.name;
                if (name) openBand(name);
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className='mt-3 flex items-center gap-2 text-sm text-gray-600'>
        <span>Average Score:</span>
        <span className='font-semibold text-[#3363AD]'>{avgScore.toFixed(1)}%</span>
      </div>
    </Card>
  );
};
