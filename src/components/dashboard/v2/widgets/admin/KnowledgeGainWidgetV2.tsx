import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  SECTION5_KNOWLEDGE_CHART,
  SECTION5_KNOWLEDGE_ROWS,
} from "./section5DesignData";

interface KnowledgeGainWidgetV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  courses?: any[];
  useDesignDummy?: boolean;
}

export const KnowledgeGainWidgetV2: React.FC<KnowledgeGainWidgetV2Props> = () => {
  const [viewMode, setViewMode] = useState<"Graph" | "Table">("Table");
  const rows = SECTION5_KNOWLEDGE_ROWS;
  const chartData = [...SECTION5_KNOWLEDGE_CHART];

  return (
    <div className="bg-white rounded-[20px] border border-[#C8D6E3] p-3.5 flex flex-col w-full min-h-[340px] h-[360px] overflow-hidden">
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

      {viewMode === "Table" ? (
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
              {rows.map((row) => (
                <tr
                  key={row.idNo}
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
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                      +{row.gain}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 min-h-0 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8EEF4" vertical={false} />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#5B6575", fontSize: 10, fontWeight: 600 }}
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
              />
              <Bar dataKey="preTest" name="Pre-Test" fill="#A8B8C8" radius={[3, 3, 0, 0]} barSize={16} />
              <Bar dataKey="postTest" name="Post-Test" fill="#3363AD" radius={[3, 3, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGainWidgetV2;
