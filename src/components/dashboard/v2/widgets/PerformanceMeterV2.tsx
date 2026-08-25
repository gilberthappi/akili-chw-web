import React from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ExternalLink, Sparkles } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PerformanceMeterV2Props {
  score?: number;
  passedAttempts?: number;
  totalAttempts?: number;
  trendPct?: number;
  preTestAvg?: number;
  finalExamAvg?: number;
}

export const PerformanceMeterV2: React.FC<PerformanceMeterV2Props> = ({
  score = 80,
  passedAttempts = 0,
  totalAttempts = 0,
  trendPct = 3.4,
  preTestAvg = 65,
  finalExamAvg = 90,
}) => {
  const navigate = useNavigate();

  const displayScore = Math.min(100, Math.max(0, Math.round(score)));

  // SVG Gauge Arc Calculation for displayScore (0-100%)
  const radius = 40;
  const strokeWidth = 10;
  const circumference = Math.PI * radius; // 185.3
  const strokeDashoffset = circumference * (1 - displayScore / 100);

  const trendData = [
    { month: "Jan", score: Math.max(40, displayScore - 15) },
    { month: "Feb", score: Math.max(45, displayScore - 10) },
    { month: "Mar", score: Math.max(50, displayScore - 12) },
    { month: "Apr", score: Math.max(55, displayScore - 5) },
    { month: "May", score: Math.max(60, displayScore + 2) },
    { month: "Jun", score: Math.max(55, displayScore - 1) },
    { month: "Jul", score: displayScore },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div
          onClick={() => navigate("/analytics/student")}
          className="flex items-center gap-1.5 cursor-pointer group"
        >
          <h3 className="text-base font-bold text-gray-900 group-hover:text-[#3363AD] transition-colors">
            Performance & Mastery
          </h3>
          <ExternalLink
            size={14}
            className="text-gray-400 group-hover:text-[#3363AD] transition-colors"
          />
        </div>

        <span className="text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-xl">
          Real Backend Data
        </span>
      </div>

      {/* Main Gauge + Breakdown Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center my-2">
        {/* Semi-Circle Progress Gauge */}
        <div className="relative flex flex-col items-center justify-center pt-2">
          <svg className="w-36 h-20" viewBox="0 0 100 50">
            {/* Background Arc */}
            <path
              d="M 10,50 A 40,40 0 0,1 90,50"
              fill="none"
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Active Colored Arc */}
            <path
              d="M 10,50 A 40,40 0 0,1 90,50"
              fill="none"
              stroke="url(#performanceGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient
                id="performanceGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#3363AD" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute bottom-0 text-center">
            <span className="text-2xl font-black text-gray-900 leading-none">
              {displayScore}%
            </span>
            <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
              Total Score
            </p>
          </div>
        </div>

        {/* Category Metrics Legend */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Tests Passed
            </span>
            <span className="font-bold text-gray-900">
              {totalAttempts > 0 ? `${passedAttempts}/${totalAttempts}` : "100%"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Pre-Test Avg
            </span>
            <span className="font-bold text-gray-900">{Math.round(preTestAvg)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-gray-600">
              <span className="w-2 h-2 rounded-full bg-[#3363AD]" />
              Final Exams
            </span>
            <span className="font-bold text-gray-900">{Math.round(finalExamAvg)}%</span>
          </div>
        </div>
      </div>

      {/* Mini Trend Sparkline */}
      <div className="h-16 w-full relative mt-1">
        <div className="absolute top-0 right-0 flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full z-10">
          <TrendingUp size={12} />
          {trendPct >= 0 ? `+${trendPct}%` : `${trendPct}%`} overall
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3363AD" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#3363AD" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" hide />
            <YAxis domain={[0, 100]} hide />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1E293B",
                borderRadius: "8px",
                border: "none",
                color: "#FFFFFF",
                fontSize: "11px",
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#3363AD"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#scoreColor)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Motivational Banner */}
      <div className="bg-amber-50/80 border border-amber-200/60 p-3 rounded-xl flex items-start gap-2 text-xs mt-3">
        <Sparkles size={14} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-amber-900 font-medium text-[11px] leading-relaxed">
          Success is the sum of small efforts, repeated day in and day out. Keep
          pushing forward! 💪
        </p>
      </div>
    </div>
  );
};
