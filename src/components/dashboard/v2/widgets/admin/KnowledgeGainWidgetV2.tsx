import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import { useAdminDashboardV2KnowledgeGain } from "@/hooks/useAdminDashboardV2KnowledgeGain";
import { ChartSkeleton, TableSkeleton } from "./AdminWidgetSkeleton";
import { V2_CARD_SHELL_PADDED } from "./v2CardStyles";

const formatGain = (gain: number): string => {
  const rounded = Math.round(gain * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}%`;
};

export const KnowledgeGainWidgetV2: React.FC = () => {
  const { filters } = useAdminDashboardFilters();
  const [viewMode, setViewMode] = useState<"Graph" | "Table">("Table");
  const { rows, chart, isLoading } = useAdminDashboardV2KnowledgeGain(filters);

  return (
    <div className={`${V2_CARD_SHELL_PADDED} flex flex-col w-full h-full min-h-0 overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3 shrink-0">
        <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight">
          Knowledge gain
        </h3>

        <div className="inline-flex items-center rounded-lg border border-[#B8CDE0] bg-[#E8F0F8] p-0.5">
          {(["Graph", "Table"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === mode
                  ? "bg-white text-[#1A2332] shadow-sm"
                  : "text-[#5B6575] hover:text-[#1A2332]"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {isLoading && rows.length === 0 && chart.length === 0 ? (
        viewMode === "Table" ? (
          <TableSkeleton rows={7} cols={7} />
        ) : (
          <ChartSkeleton />
        )
      ) : viewMode === "Table" ? (
        <div className="flex-1 min-h-0 overflow-auto rounded-[12px] border border-[#E8EEF4]">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-[#E8F0F8] text-[10px] font-bold text-[#5B6575]">
                <th className="py-2.5 px-2.5">ID NO</th>
                <th className="py-2.5 px-2.5">Name</th>
                <th className="py-2.5 px-2.5">Course / Topic</th>
                <th className="py-2.5 px-2.5">Health Center</th>
                <th className="py-2.5 px-2.5 text-center">Pre-Test</th>
                <th className="py-2.5 px-2.5 text-center">Post-Test</th>
                <th className="py-2.5 px-2.5 text-center">Knowledge Gain</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-10 text-center text-[12px] text-[#9AA3B2]"
                  >
                    No paired Pre/Post results for these filters
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[#E8EEF4] hover:bg-[#F8FBFF] transition-colors"
                  >
                    <td className="py-2.5 px-2.5 text-[11px] font-medium text-[#5B6575] tabular-nums">
                      {row.idNo}
                    </td>
                    <td className="py-2.5 px-2.5 text-[11px] font-semibold text-[#1A2332] whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-2.5 px-2.5 text-[11px] font-medium text-[#5B6575]">
                      {row.course}
                    </td>
                    <td className="py-2.5 px-2.5 text-[11px] font-medium text-[#5B6575] whitespace-nowrap">
                      {row.healthCenter}
                    </td>
                    <td className="py-2.5 px-2.5 text-center text-[11px] font-semibold text-[#5B6575] tabular-nums">
                      {row.preScore}%
                    </td>
                    <td className="py-2.5 px-2.5 text-center text-[11px] font-semibold text-[#3363AD] tabular-nums">
                      {row.postScore}%
                    </td>
                    <td className="py-2.5 px-2.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          row.gain >= 0
                            ? "bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]"
                            : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
                        }`}
                      >
                        {formatGain(row.gain)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : chart.length === 0 ? (
        <div className="flex-1 min-h-0 flex items-center justify-center text-[12px] text-[#9AA3B2]">
          No chart data for these filters
        </div>
      ) : (
        <div className="flex-1 min-h-0 w-full overflow-x-auto">
          <div
            className="h-full min-w-full"
            style={{
              width: Math.max(chart.length * 72, 480),
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chart}
                margin={{ top: 8, right: 8, left: -18, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E8EEF4"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={chart.length > 8 ? -25 : 0}
                  textAnchor={chart.length > 8 ? "end" : "middle"}
                  height={chart.length > 8 ? 48 : 24}
                  tick={{ fill: "#5B6575", fontSize: 9, fontWeight: 600 }}
                />
                <YAxis
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9AA3B2", fontSize: 9 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "10px",
                    border: "1px solid #C8D6E3",
                    fontSize: "11px",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name,
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="preTest"
                  name="Pre-Test"
                  fill="#A8B8C8"
                  radius={[3, 3, 0, 0]}
                  barSize={14}
                />
                <Bar
                  dataKey="postTest"
                  name="Post-Test"
                  fill="#3363AD"
                  radius={[3, 3, 0, 0]}
                  barSize={14}
                />
                <Bar
                  dataKey="gain"
                  name="Knowledge Gain"
                  fill="#059669"
                  radius={[3, 3, 0, 0]}
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGainWidgetV2;
