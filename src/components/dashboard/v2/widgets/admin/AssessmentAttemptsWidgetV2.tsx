import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import { useAdminDashboardV2AssessmentAttempts } from "@/hooks/useAdminDashboardV2AssessmentAttempts";
import { DonutSkeleton } from "./AdminWidgetSkeleton";
import { V2_CARD_SHELL_PADDED } from "./v2CardStyles";

const EMPTY_SEGMENTS = [
  { name: "Pre Test", value: 0, color: "#4A5568" },
  { name: "Mid Test", value: 0, color: "#A8C5D8" },
  { name: "Post Test", value: 0, color: "#4B82BA" },
  { name: "Certificate Test", value: 0, color: "#C5CDD6" },
];

type AssessmentPiePoint = {
  name: string;
  value: number;
  color: string;
  tests: number;
  sharePercent: number;
  avgScore: number;
  variation: number;
  variationPositive: boolean;
};

const AssessmentTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ payload: AssessmentPiePoint }>;
}> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const TrendIcon = d.variationPositive ? ArrowUp : ArrowDown;

  return (
    <div className="rounded-[10px] border border-[#C8D6E3] bg-white px-3 py-2 shadow-md min-w-[170px]">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="w-2.5 h-2.5 rounded-[2px] shrink-0"
          style={{ backgroundColor: d.color }}
        />
        <p className="text-[11px] font-bold text-[#1A2332] leading-snug">
          {d.name}
        </p>
      </div>
      <div className="space-y-1 text-[10px] text-[#5B6575]">
        <div className="flex justify-between gap-4">
          <span>Tests</span>
          <span className="font-semibold text-[#1A2332] tabular-nums">
            {d.tests}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Share</span>
          <span className="font-semibold text-[#1A2332] tabular-nums">
            {d.sharePercent}%
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Avg score</span>
          <span className="font-semibold text-[#1A2332] tabular-nums">
            {d.avgScore}
          </span>
        </div>
        <div className="flex justify-between gap-4 items-center">
          <span>Variation</span>
          <span
            className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${
              d.variationPositive ? "text-[#0F766E]" : "text-[#DC2626]"
            }`}
          >
            <TrendIcon size={10} strokeWidth={3} />
            {Math.abs(d.variation).toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export const AssessmentAttemptsWidgetV2: React.FC = () => {
  const { filters } = useAdminDashboardFilters();
  const { data, isLoading } = useAdminDashboardV2AssessmentAttempts(filters);

  const totalTests = data?.totalTests ?? 0;
  const bars = data?.bars ?? [];
  const segments =
    data?.segments?.length && data.segments.some((s) => s.value > 0)
      ? data.segments
      : EMPTY_SEGMENTS;

  const chartData = useMemo((): AssessmentPiePoint[] => {
    const byName = new Map(bars.map((b) => [b.name, b]));
    return segments.map((s) => {
      const bar = byName.get(s.name);
      return {
        name: s.name,
        value: s.value,
        color: s.color,
        tests: bar?.tests ?? s.value,
        sharePercent: bar?.sharePercent ?? 0,
        avgScore: bar?.avgScore ?? 0,
        variation: bar?.variation ?? 0,
        variationPositive: bar?.variationPositive ?? true,
      };
    });
  }, [segments, bars]);

  return (
    <div
      className={`${V2_CARD_SHELL_PADDED} flex flex-col w-full h-full min-h-0`}
    >
      <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight mb-1.5 shrink-0 leading-snug">
        Assessment Test Attempts
      </h3>

      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        {isLoading && !data ? (
          <DonutSkeleton />
        ) : (
          <div className="relative aspect-square w-full max-w-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius="46%"
                  outerRadius="90%"
                  paddingAngle={1}
                  dataKey="value"
                  nameKey="name"
                  startAngle={90}
                  endAngle={-270}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#FFFFFF"
                      strokeWidth={1}
                      style={{ cursor: "pointer", outline: "none" }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<AssessmentTooltip />}
                  wrapperStyle={{ outline: "none", zIndex: 40 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-1">
              <span className="text-[24px] font-bold text-[#5B6575] leading-none tabular-nums">
                {totalTests}
              </span>
              <p className="text-[10px] font-medium text-[#9AA3B2] mt-1 leading-tight">
                Total Tests taken
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentAttemptsWidgetV2;
