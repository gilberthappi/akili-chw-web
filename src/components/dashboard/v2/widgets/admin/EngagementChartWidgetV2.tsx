import React, { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  SECTION2_ENGAGEMENT_DOMAINS,
  SECTION2_ENGAGEMENT_MONTHS,
} from "./section2DesignData";

interface EngagementChartWidgetV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  trendsData?: any[];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  courses?: any[];
  useDesignDummy?: boolean;
}

export const EngagementChartWidgetV2: React.FC<EngagementChartWidgetV2Props> = ({
  useDesignDummy = true,
}) => {
  const [timeframe, setTimeframe] = useState("Today");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const domains = [...SECTION2_ENGAGEMENT_DOMAINS];
  const monthlyData = SECTION2_ENGAGEMENT_MONTHS.map((row) => ({ ...row }));

  const isActive = (key: string) =>
    selectedKeys.length === 0 || selectedKeys.includes(key);

  const toggle = (key: string) => {
    if (selectedKeys.length === 0) setSelectedKeys([key]);
    else if (selectedKeys.includes(key)) {
      const next = selectedKeys.filter((k) => k !== key);
      setSelectedKeys(next);
    } else setSelectedKeys([...selectedKeys, key]);
  };

  void useDesignDummy;

  const activeDomains = domains.filter((d) => isActive(d.key));

  return (
    <div className="bg-white rounded-[20px] border border-[#C8D6E3] p-3.5 flex flex-col w-full h-[380px] shrink-0 overflow-hidden">
      {/* Header: title + legend + Today */}
      <div className="flex items-start justify-between gap-3 mb-2 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap">
          <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight shrink-0">
            Engagement
          </h3>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 min-w-0">
            {domains.map((d) => {
              const active = isActive(d.key);
              return (
                <button
                  type="button"
                  key={d.key}
                  onClick={() => toggle(d.key)}
                  className={`inline-flex items-center gap-1 text-[10px] font-medium cursor-pointer transition-opacity ${
                    active ? "opacity-100 text-[#5B6575]" : "opacity-35 text-gray-400"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="max-w-[4.5rem] truncate">{d.name}</span>
                </button>
              );
            })}
          </div>
        </div>

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
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5B6575] pointer-events-none"
          />
        </div>
      </div>

      {/* Fixed chart area — fills rest of fixed card height */}
      <div className="flex-1 min-h-0 w-full bg-[#F8FAFC] rounded-xl px-1 pt-1 pb-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyData}
            margin={{ top: 6, right: 6, left: -14, bottom: 2 }}
            barCategoryGap="12%"
          >
            <CartesianGrid vertical={false} stroke="#E8EEF5" strokeDasharray="0" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9AA3B2", fontSize: 10, fontWeight: 500 }}
            />
            <YAxis
              domain={[0, 300]}
              ticks={[0, 50, 100, 150, 200, 250, 300]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9AA3B2", fontSize: 10, fontWeight: 500 }}
            />
            <Tooltip
              cursor={{ fill: "rgba(200, 214, 227, 0.25)" }}
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                border: "1px solid #C8D6E3",
                fontSize: "11px",
                boxShadow: "0 8px 20px -6px rgba(0,0,0,0.08)",
              }}
            />
            {activeDomains.map((d, idx) => (
              <Bar
                key={d.key}
                dataKey={d.key}
                name={d.name}
                stackId="a"
                fill={d.color}
                radius={
                  idx === activeDomains.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]
                }
                maxBarSize={28}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EngagementChartWidgetV2;
