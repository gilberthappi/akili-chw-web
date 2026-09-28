import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import { useAdminDashboardV2Certificates } from "@/hooks/useAdminDashboardV2Certificates";
import { DonutSkeleton } from "./AdminWidgetSkeleton";
import { V2_CARD_SHELL_PADDED } from "./v2CardStyles";

type CertPiePoint = {
  name: string;
  value: number;
  color: string;
  courseId?: string;
  avgAttempts: number;
  downloads: number;
  sharePercent: number;
};

const CERT_SCOPE_LABEL: Record<string, string> = {
  TRAINEE: "CHW Certificates",
  TESTER: "Tester Certificates",
  CEHO: "CEHO Certificates",
};

const CertificatesTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ payload: CertPiePoint }>;
}> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (d.name === "None") return null;

  return (
    <div className="rounded-[10px] border border-[#C8D6E3] bg-white px-3 py-2 shadow-md min-w-[160px]">
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
          <span>Certificates</span>
          <span className="font-semibold text-[#1A2332] tabular-nums">
            {d.value}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Share</span>
          <span className="font-semibold text-[#1A2332] tabular-nums">
            {d.sharePercent}%
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Avg attempts</span>
          <span className="font-semibold text-[#1A2332] tabular-nums">
            {d.avgAttempts}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Downloads</span>
          <span className="font-semibold text-[#1A2332] tabular-nums">
            {d.downloads}
          </span>
        </div>
        <p className="pt-1 text-[9px] text-[#3363AD] font-semibold">
          Click to open analysis
        </p>
      </div>
    </div>
  );
};

export const CertificatesDonutWidgetV2: React.FC = () => {
  const navigate = useNavigate();
  const { filters } = useAdminDashboardFilters();
  const [timeframe, setTimeframe] = useState("All Time");
  const { data, isLoading } = useAdminDashboardV2Certificates(
    filters,
    timeframe,
  );

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  const chartData = useMemo((): CertPiePoint[] => {
    const withCerts = rows.filter((r) => r.certificates > 0);
    if (withCerts.length === 0) {
      return [
        {
          name: "None",
          value: 1,
          color: "#E2E8F0",
          avgAttempts: 0,
          downloads: 0,
          sharePercent: 0,
        },
      ];
    }
    return withCerts.map((r) => ({
      name: r.name,
      value: r.certificates,
      color: r.color,
      courseId: r.courseId,
      avgAttempts: r.avgAttempts,
      downloads: r.downloads,
      sharePercent:
        total > 0
          ? Math.round((r.certificates / total) * 1000) / 10
          : 0,
    }));
  }, [rows, total]);

  const openCourse = (courseId?: string) => {
    if (!courseId) return;
    navigate(`/courses/${courseId}/analysis`);
  };

  return (
    <div
      className={`${V2_CARD_SHELL_PADDED} flex flex-col w-full h-full min-h-0`}
    >
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight min-w-0 truncate">
          Certificates
        </h3>
        <div className="relative shrink-0">
          <CalendarDays
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5B6575] pointer-events-none"
          />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="appearance-none text-[11px] font-semibold bg-white border border-[#B8CDE0] text-[#5B6575] rounded-lg pl-7 pr-7 py-1.5 focus:outline-none cursor-pointer hover:border-[#4B82BA] transition-colors max-w-[7.5rem]"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
            <option>All Time</option>
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5B6575] pointer-events-none"
          />
        </div>
      </div>

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
                  onClick={(data) => {
                    const point = data as CertPiePoint & {
                      payload?: CertPiePoint;
                    };
                    openCourse(point?.courseId ?? point?.payload?.courseId);
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#FFFFFF"
                      strokeWidth={1}
                      style={{
                        cursor: entry.courseId ? "pointer" : "default",
                        outline: "none",
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<CertificatesTooltip />}
                  wrapperStyle={{ outline: "none", zIndex: 40 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-1">
              <span className="text-[24px] font-bold text-[#3D4654] leading-none tabular-nums">
                {total}
              </span>
              <p className="text-[10px] font-medium text-[#9AA3B2] mt-1 leading-tight">
                {CERT_SCOPE_LABEL[filters.role] ?? "All Learners' Certificates"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatesDonutWidgetV2;
