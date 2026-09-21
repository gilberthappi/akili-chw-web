import React, { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TrendPoint {
  month: string;
  score: number;
}

interface PerformanceMeterV2Props {
  score?: number;
  enrolledCoursesCount?: number;
  completedCoursesCount?: number;
  certificatesCount?: number;
  /** Optional real monthly trend points from backend */
  trendPoints?: TrendPoint[];
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const TrendTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-gray-900">{label}</p>
      <p className="text-[#3363AD] font-extrabold mt-0.5">{value}%</p>
    </div>
  );
};

export const PerformanceMeterV2: React.FC<PerformanceMeterV2Props> = ({
  score = 0,
  enrolledCoursesCount = 0,
  completedCoursesCount = 0,
  certificatesCount = 0,
  trendPoints,
}) => {
  const [timeframe, setTimeframe] = useState<"Last 6 Months" | "This Year">(
    "Last 6 Months",
  );
  const displayScore = Math.min(100, Math.max(0, Math.round(score)));
  const s = displayScore;

  const sixMonthsTrend = useMemo(() => {
    if (trendPoints && trendPoints.length > 0) {
      return trendPoints.slice(-6);
    }
    return [
      { month: "Feb", score: Math.max(0, Math.round(s * 0.7)) },
      { month: "Mar", score: Math.max(0, Math.round(s * 0.5)) },
      { month: "Apr", score: Math.max(0, Math.round(s * 0.8)) },
      { month: "May", score: Math.max(0, Math.round(s * 0.65)) },
      { month: "Jun", score: Math.max(0, Math.round(s * 0.9)) },
      { month: "Jul", score: s },
    ];
  }, [trendPoints, s]);

  const fullYearTrend = useMemo(() => {
    if (trendPoints && trendPoints.length >= 12) {
      return trendPoints.slice(-12);
    }
    if (trendPoints && trendPoints.length > 0) {
      return trendPoints;
    }
    return [
      { month: "Jan", score: Math.max(0, Math.round(s * 0.4)) },
      { month: "Feb", score: Math.max(0, Math.round(s * 0.7)) },
      { month: "Mar", score: Math.max(0, Math.round(s * 0.5)) },
      { month: "Apr", score: Math.max(0, Math.round(s * 0.8)) },
      { month: "May", score: Math.max(0, Math.round(s * 0.65)) },
      { month: "Jun", score: Math.max(0, Math.round(s * 0.9)) },
      { month: "Jul", score: s },
      { month: "Aug", score: Math.min(100, Math.round(s * 1.02)) },
      { month: "Sep", score: Math.min(100, Math.round(s * 1.05)) },
      { month: "Oct", score: Math.min(100, Math.round(s * 1.08)) },
      { month: "Nov", score: Math.min(100, Math.round(s * 1.1)) },
      { month: "Dec", score: Math.min(100, Math.round(s * 1.12)) },
    ];
  }, [trendPoints, s]);

  const trendData =
    timeframe === "Last 6 Months" ? sixMonthsTrend : fullYearTrend;

  const growthPct = useMemo(() => {
    if (trendData.length < 2) return null;
    const first = trendData[0]?.score ?? 0;
    const last = trendData[trendData.length - 1]?.score ?? 0;
    if (first <= 0) return last > 0 ? 100 : 0;
    return Math.round(((last - first) / first) * 100);
  }, [trendData]);

  const growthPill =
    growthPct == null
      ? null
      : `${growthPct >= 0 ? "+" : ""}${growthPct}%`;

  const polarToCartesian = (
    cx: number,
    cy: number,
    r: number,
    angleInDegrees: number,
  ) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number,
  ) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M",
      start.x,
      start.y,
      "A",
      r,
      r,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(" ");
  };

  const redArc = describeArc(50, 50, 38, -180, -92);
  const orangeArc = describeArc(50, 50, 38, -88, -56);
  const yellowArc = describeArc(50, 50, 38, -52, -28);
  const greenArc = describeArc(50, 50, 38, -24, 0);

  const knobAngleDeg = -180 + (displayScore / 100) * 180;
  const knobPos = polarToCartesian(50, 50, 38, knobAngleDeg);

  const getKnobColor = (sc: number) => {
    if (sc >= 85) return { fill: "#10B981", shadow: "#10B981" };
    if (sc >= 70) return { fill: "#EAB308", shadow: "#EAB308" };
    if (sc >= 50) return { fill: "#F97316", shadow: "#F97316" };
    return { fill: "#EF4444", shadow: "#EF4444" };
  };

  const knobStyle = getKnobColor(displayScore);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col justify-between h-full space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
          Performance
        </h3>

        <select
          value={timeframe}
          onChange={(e) =>
            setTimeframe(e.target.value as "Last 6 Months" | "This Year")
          }
          className="text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer shadow-2xs hover:border-[#3363AD] transition-colors"
        >
          <option value="Last 6 Months">Last 6 Months</option>
          <option value="This Year">This Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <div className="sm:col-span-6 relative flex flex-col items-center justify-center pt-2">
          <svg className="w-52 h-30 overflow-visible" viewBox="0 0 100 58">
            <defs>
              <filter id="knobGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="3"
                  floodColor={knobStyle.shadow}
                  floodOpacity="0.5"
                />
              </filter>
            </defs>

            <path
              d={describeArc(50, 50, 30, -178, -2)}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeDasharray="2, 3"
            />

            <path d={redArc} fill="none" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" />
            <path d={orangeArc} fill="none" stroke="#F97316" strokeWidth="8" strokeLinecap="round" />
            <path d={yellowArc} fill="none" stroke="#EAB308" strokeWidth="8" strokeLinecap="round" />
            <path d={greenArc} fill="none" stroke="#10B981" strokeWidth="8" strokeLinecap="round" />

            <g
              transform={`rotate(${knobAngleDeg + 90}, ${knobPos.x}, ${knobPos.y})`}
              filter="url(#knobGlow)"
            >
              <rect
                x={knobPos.x - 4.5}
                y={knobPos.y - 9}
                width="9"
                height="18"
                rx="4.5"
                fill={knobStyle.fill}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <circle cx={knobPos.x} cy={knobPos.y} r="2" fill="#FFFFFF" />
            </g>
          </svg>

          <div className="absolute bottom-2 text-center">
            <span className="text-2xl font-black text-gray-900 leading-none">
              {displayScore}%
            </span>
            <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
              Total Score
            </p>
          </div>
        </div>

        <div className="sm:col-span-6 space-y-2 text-xs font-semibold">
          {(
            [
              {
                min: 85,
                max: 100,
                label: "High Mastery (85–100%)",
                dot: "bg-[#10B981]",
                activeClass: "text-emerald-600",
              },
              {
                min: 70,
                max: 84,
                label: "Good Standing (70–85%)",
                dot: "bg-[#EAB308]",
                activeClass: "text-amber-600",
              },
              {
                min: 50,
                max: 69,
                label: "Below Target (50–70%)",
                dot: "bg-[#F97316]",
                activeClass: "text-orange-600",
              },
              {
                min: 0,
                max: 49,
                label: "Needs Work (0–50%)",
                dot: "bg-[#EF4444]",
                activeClass: "text-red-600",
              },
            ] as const
          ).map((zone) => {
            const isActive =
              displayScore >= zone.min && displayScore <= zone.max;
            return (
              <div
                key={zone.label}
                className={`flex items-center justify-between ${
                  isActive ? "opacity-100" : "opacity-55"
                }`}
              >
                <span className="flex items-center gap-1.5 text-gray-700">
                  <span className={`w-2.5 h-2.5 rounded-full ${zone.dot}`} />
                  {zone.label}
                </span>
                {isActive ? (
                  <span className={`font-extrabold ${zone.activeClass}`}>
                    {displayScore}%
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-4 space-y-2">
        <div className="text-center space-y-0.5">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xl font-black text-gray-900">
              {displayScore}%
            </span>
            {growthPill != null && (
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                  (growthPct ?? 0) >= 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {growthPill}
              </span>
            )}
          </div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            {timeframe === "Last 6 Months"
              ? "LAST 6 MONTHS TREND"
              : "THIS YEAR TREND"}
          </p>
          <p className="text-[10px] text-gray-400">
            Hover a month to see its score
          </p>
        </div>

        <div className="h-28 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trendData}
              margin={{ top: 5, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="purpleGradientWave"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#3363AD" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3363AD" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 9, fontWeight: 600 }}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 8, fontWeight: 600 }}
                unit="%"
              />
              <Tooltip
                content={<TrendTooltip />}
                cursor={{
                  stroke: "#3363AD",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#3363AD"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#purpleGradientWave)"
                activeDot={{
                  r: 5,
                  fill: "#3363AD",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="bg-[#EBF0F9] p-2.5 rounded-xl text-center">
            <p className="text-xs font-black text-gray-900">
              {enrolledCoursesCount}
            </p>
            <p className="text-[10px] font-semibold text-gray-500">Enrolled</p>
          </div>
          <div className="bg-[#EBF0F9] p-2.5 rounded-xl text-center">
            <p className="text-xs font-black text-gray-900">
              {completedCoursesCount}
            </p>
            <p className="text-[10px] font-semibold text-gray-500">Completed</p>
          </div>
          <div className="bg-[#EBF0F9] p-2.5 rounded-xl text-center">
            <p className="text-xs font-black text-gray-900">
              {certificatesCount}
            </p>
            <p className="text-[10px] font-semibold text-gray-500">Certified</p>
          </div>
          <div className="bg-[#EBF0F9] p-2.5 rounded-xl text-center">
            <p className="text-xs font-black text-gray-900">{displayScore}%</p>
            <p className="text-[10px] font-semibold text-gray-500">
              Avg progress
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
