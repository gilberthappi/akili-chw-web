import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, MoreHorizontal } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface LearningActivityV2Props {
  hours?: number;
  minutes?: number;
}

const sampleDailyData = [
  { day: "Mon", health: 3.5, maternal: 2.0, nutrition: 1.0 },
  { day: "Tue", health: 2.0, maternal: 3.0, nutrition: 2.5 },
  { day: "Wed", health: 4.0, maternal: 1.5, nutrition: 1.5 },
  { day: "Thu", health: 2.5, maternal: 3.5, nutrition: 1.0 },
  { day: "Fri", health: 1.5, maternal: 2.0, nutrition: 2.0 },
  { day: "Sat", health: 3.0, maternal: 4.0, nutrition: 1.5 },
  { day: "Sun", health: 1.0, maternal: 2.0, nutrition: 1.0 },
];

export const LearningActivityV2: React.FC<LearningActivityV2Props> = ({
  hours = 42,
  minutes = 30,
}) => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState("This Week");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between h-full">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div>
          <div
            onClick={() => navigate("/analytics/student")}
            className="flex items-center gap-1.5 cursor-pointer group"
          >
            <h3 className="text-base font-bold text-gray-900 group-hover:text-[#3363AD] transition-colors">
              Learning Activity
            </h3>
            <ExternalLink
              size={14}
              className="text-gray-400 group-hover:text-[#3363AD] transition-colors"
            />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {hours}
            </span>
            <span className="text-xs font-semibold text-gray-500">hours</span>
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {minutes}
            </span>
            <span className="text-xs font-semibold text-gray-500">minutes</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3363AD]/20 cursor-pointer"
          >
            <option>This Week</option>
            <option>This Month</option>
            <option>Last 30 Days</option>
          </select>
          <button
            onClick={() => navigate("/analytics/student")}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="More analytics"
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <div className="h-44 w-full my-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sampleDailyData}
            margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
          >
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9CA3AF", fontSize: 10 }}
              unit="h"
            />
            <Tooltip
              cursor={{ fill: "#F3F4F6", radius: 8 }}
              contentStyle={{
                backgroundColor: "#1E293B",
                borderRadius: "12px",
                border: "none",
                color: "#FFFFFF",
                fontSize: "12px",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
            />
            <Bar
              dataKey="health"
              stackId="a"
              fill="#3363AD"
              radius={[0, 0, 4, 4]}
              barSize={20}
            />
            <Bar
              dataKey="maternal"
              stackId="a"
              fill="#818CF8"
              barSize={20}
            />
            <Bar
              dataKey="nutrition"
              stackId="a"
              fill="#F59E0B"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-gray-100 mt-2">
        <div className="bg-pink-50/70 border border-pink-100/70 p-2.5 rounded-xl text-xs">
          <p className="font-bold text-gray-900">{Math.round(hours * 0.4)} Hours</p>
          <p className="text-[11px] text-pink-700 font-medium truncate mt-0.5">
            Maternal & Child Care
          </p>
        </div>
        <div className="bg-amber-50/70 border border-amber-100/70 p-2.5 rounded-xl text-xs">
          <p className="font-bold text-gray-900">{Math.round(hours * 0.35)} Hours</p>
          <p className="text-[11px] text-amber-700 font-medium truncate mt-0.5">
            Disease Prevention
          </p>
        </div>
        <div className="bg-[#EBF0F9] border border-[#3363AD]/20 p-2.5 rounded-xl text-xs">
          <p className="font-bold text-gray-900">{Math.round(hours * 0.25)} Hours</p>
          <p className="text-[11px] text-[#3363AD] font-medium truncate mt-0.5">
            Health & Nutrition
          </p>
        </div>
      </div>
    </div>
  );
};
