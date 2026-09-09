import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Clock3,
  Play,
} from "lucide-react";
import {
  SECTION4_DEMOGRAPHICS_ROWS,
  SECTION4_DEMOGRAPHICS_TABS,
} from "./section4DesignData";

interface ChwDataTableV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  courses?: any[];
  useDesignDummy?: boolean;
}

export const ChwDataTableV2: React.FC<ChwDataTableV2Props> = () => {
  const [sortBy, setSortBy] = useState("Monthly");
  const [viewMode, setViewMode] = useState<"Graph" | "Table">("Table");
  const [activeTab, setActiveTab] = useState(0);
  const rows = SECTION4_DEMOGRAPHICS_ROWS;

  const headers = [
    "Course Name",
    "Enrollment",
    "Completion",
    "Time period",
    "Pre Test",
    "Mid Test",
    "Post Test",
    "Certificates",
  ] as const;

  return (
    <div className="bg-white rounded-[20px] border border-[#C8D6E3] p-3.5 flex flex-col w-full h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3 shrink-0">
        <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight">
          CHW Demographics{" "}
          <span className="font-semibold text-[#5B6575]">Performance analysis</span>
        </h3>

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center gap-1.5 text-[11px] font-semibold text-[#5B6575]">
            <span>Sort by:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none font-semibold text-[#5B6575] bg-white border border-[#B8CDE0] rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none cursor-pointer hover:border-[#4B82BA] transition-colors"
              >
                <option>Monthly</option>
                <option>Weekly</option>
                <option>Yearly</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5B6575] pointer-events-none"
              />
            </div>
          </div>

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
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3 shrink-0">
        {SECTION4_DEMOGRAPHICS_TABS.map((tab, idx) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === idx
                ? "bg-[#E8F0F8] text-[#1A2332]"
                : "text-[#5B6575] hover:bg-[#F1F5F9]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto rounded-[12px] border border-[#E8EEF4]">
        <table className="w-full text-left border-collapse min-w-[920px]">
          <thead>
            <tr className="bg-[#E8F0F8] text-[10px] font-bold text-[#5B6575]">
              {headers.map((label, i) => (
                <th
                  key={`${label}-${i}`}
                  className={`py-2.5 px-2.5 whitespace-nowrap ${
                    i === 0 ? "rounded-tl-[12px]" : ""
                  } ${i === headers.length - 1 ? "rounded-tr-[12px] text-right" : ""}`}
                >
                  <div
                    className={`inline-flex items-center gap-1 ${
                      i === headers.length - 1 ? "justify-end w-full" : ""
                    }`}
                  >
                    <span>{label}</span>
                    <ArrowUpDown size={11} className="text-[#9AA3B2]" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {

              return (
                <tr
                  key={row.id}
                  className="border-t border-[#E8EEF4] hover:bg-[#F8FBFF] transition-colors"
                >
                  <td className="py-2.5 px-2.5">
                    <div className="flex items-center gap-2.5 min-w-[200px]">
                      <div className="w-9 h-9 rounded-md bg-[#D6E4F5] shrink-0 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-[#3363AD]">CHW</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#1A2332] uppercase leading-snug">
                          {row.title}
                        </p>
                        <p className="text-[10px] font-medium text-[#5B6575] mt-0.5">
                          {row.level}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-2.5 text-[11px] font-semibold text-[#1A2332] tabular-nums">
                    {row.enrollment}
                  </td>

                  <td className="py-2.5 px-2.5">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1A2332] tabular-nums whitespace-nowrap">
                      <span>{row.completion}</span>
                      {/* <span
                        className={`w-4 h-4 rounded-full ${trendBg} text-white flex items-center justify-center shrink-0`}
                      >
                        <TrendIcon size={9} strokeWidth={2.5} />
                      </span>
                      <span className="text-[#5B6575]">{row.growth}</span> */}
                    </div>
                  </td>

                  <td className="py-2.5 px-2.5">
                    <div className="inline-flex items-center gap-3 text-[11px] font-semibold text-[#1A2332] tabular-nums whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Play size={12} className="text-[#3363AD] fill-[#3363AD]" />
                        {row.lessons}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={12} className="text-[#3363AD]" />
                        {row.hours}
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-2.5 text-[11px] font-semibold text-[#1A2332] tabular-nums">
                    {row.preTest}
                  </td>
                  <td className="py-2.5 px-2.5 text-[11px] font-semibold text-[#1A2332] tabular-nums">
                    {row.midTest}
                  </td>
                  <td className="py-2.5 px-2.5 text-[11px] font-semibold text-[#1A2332] tabular-nums">
                    {row.postTest}
                  </td>
                  <td className="py-2.5 px-2.5 text-right text-[11px] font-medium text-[#1A2332] whitespace-nowrap">
                    {row.certificate}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChwDataTableV2;
