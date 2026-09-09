import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CalendarDays, ChevronDown } from "lucide-react";
import { SECTION2_CERTIFICATES } from "./section2DesignData";

interface CertificatesDonutWidgetV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  totalCertificates?: any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  certificationData?: any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  courses?: any[];
  useDesignDummy?: boolean;
}

export const CertificatesDonutWidgetV2: React.FC<CertificatesDonutWidgetV2Props> = () => {
  const [timeframe, setTimeframe] = useState("Today");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const rows = [...SECTION2_CERTIFICATES.rows];
  const total = SECTION2_CERTIFICATES.total;

  const isActive = (key: string) =>
    selectedKeys.length === 0 || selectedKeys.includes(key);

  const toggle = (key: string) => {
    if (selectedKeys.length === 0) setSelectedKeys([key]);
    else if (selectedKeys.includes(key)) {
      const next = selectedKeys.filter((k) => k !== key);
      setSelectedKeys(next);
    } else setSelectedKeys([...selectedKeys, key]);
  };

  const activeRows = rows.filter((r) => isActive(r.key));
  const pieData = activeRows.map((r) => ({
    name: r.name,
    value: r.certificates,
    color: r.color,
  }));

  return (
    <div className="bg-white rounded-[20px] border border-[#C8D6E3] p-3.5 flex flex-col w-full h-[380px] shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-2 shrink-0">
        <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight">
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
            className="appearance-none text-[11px] font-semibold bg-white border border-[#B8CDE0] text-[#5B6575] rounded-lg pl-7 pr-7 py-1.5 focus:outline-none cursor-pointer hover:border-[#4B82BA] transition-colors"
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

      {/* Donut + scrollable list — fills fixed card */}
      <div className="flex gap-3 flex-1 min-h-0 items-center overflow-hidden">
        <div className="relative h-full w-[42%] shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={
                  pieData.length > 0
                    ? pieData
                    : [{ name: "None", value: 1, color: "#E2E8F0" }]
                }
                cx="50%"
                cy="50%"
                innerRadius={46}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "10px",
                  border: "1px solid #C8D6E3",
                  fontSize: "11px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute text-center pointer-events-none px-1">
            <span className="text-[22px] font-bold text-[#3D4654] leading-none tabular-nums">
              {total}
            </span>
            <p className="text-[10px] font-medium text-[#9AA3B2] mt-1 leading-tight">
              Total Certificates
            </p>
          </div>
        </div>

        <div className="flex-1 min-w-0 h-full overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-[#E8EEF4] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#A8B8C8] [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="space-y-0">
            {rows.map((row) => {
              const active = isActive(row.key);
              return (
                <button
                  type="button"
                  key={row.key}
                  onClick={() => toggle(row.key)}
                  className={`w-full grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] items-center gap-x-2 py-2 text-left cursor-pointer transition-opacity border-b border-[#F1F5F9] last:border-0 ${
                    active ? "opacity-100" : "opacity-35"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="text-[12px] font-semibold text-[#1A2332] truncate">
                    {row.name}
                  </span>
                  <span className="text-[11px] font-medium text-[#5B6575] tabular-nums whitespace-nowrap">
                    {row.avgAttempts} Avg attempts
                  </span>
                  <span className="text-[11px] font-medium text-[#5B6575] tabular-nums whitespace-nowrap">
                    {row.certificates} Certificates
                  </span>
                  {/* <span className="text-[11px] font-medium text-[#5B6575] tabular-nums whitespace-nowrap">
                    {row.downloads} Downloads
                  </span> */}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatesDonutWidgetV2;
