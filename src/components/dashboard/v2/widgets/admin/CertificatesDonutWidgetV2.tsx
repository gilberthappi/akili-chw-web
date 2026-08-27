import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface CertificatesDonutWidgetV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  totalCertificates?: any;
}

export const CertificatesDonutWidgetV2: React.FC<CertificatesDonutWidgetV2Props> = ({
  totalCertificates = 2931,
}) => {
  const [timeframe, setTimeframe] = useState("Today");

  // Extract primitive number safely if prop is passed as an object
  const displayTotal =
    typeof totalCertificates === "object" && totalCertificates !== null
      ? totalCertificates.value ?? totalCertificates.count ?? 2931
      : totalCertificates || 2931;

  const categoryData = [
    { name: "ICCM", value: 120, color: "#373449" }, // Dark
    { name: "Malaria", value: 235, color: "#3363AD" }, // Primary Blue
    { name: "MNCH", value: 32, color: "#38BDF8" }, // Light Blue
    { name: "Nutrition", value: 90, color: "#10B981" }, // Green
    { name: "HIV", value: 140, color: "#818CF8" }, // Indigo
    { name: "TB", value: 120, color: "#A855F7" }, // Purple
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-4 h-full">
      {/* Header & Control */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
          Certificates
        </h3>

        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer shadow-2xs hover:border-[#3363AD] transition-colors"
        >
          <option>Today</option>
          <option>This Week</option>
          <option>This Month</option>
        </select>
      </div>

      {/* Donut Chart & Legend Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1">
        {/* Donut Chart with Center Total */}
        <div className="sm:col-span-6 relative h-44 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "10px",
                  border: "1px solid #E2E8F0",
                  fontSize: "11px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="absolute text-center pointer-events-none">
            <span className="text-xl font-black text-gray-900 leading-none">
              {displayTotal}
            </span>
            <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
              Total Certificates
            </p>
          </div>
        </div>

        {/* Breakdown Legend List */}
        <div className="sm:col-span-6 space-y-2 text-xs font-semibold">
          {categoryData.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-600">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </span>
              <span className="font-extrabold text-gray-900">
                {cat.value} Certificates
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
