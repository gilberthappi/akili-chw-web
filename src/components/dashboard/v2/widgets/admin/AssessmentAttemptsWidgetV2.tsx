import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export const AssessmentAttemptsWidgetV2: React.FC = () => {
  const totalTests = 400;

  const attemptTypes = [
    { name: "Pre test", value: 400, color: "#38BDF8" }, // Light Blue
    { name: "Post test", value: 400, color: "#3363AD" }, // Primary Blue
    { name: "Check for understanding", value: 400, color: "#373449" }, // Dark Charcoal
    { name: "Certificate exam", value: 400, color: "#10B981" }, // Green
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-4 h-full">
      {/* Header */}
      <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
        Assessment Test Attempts
      </h3>

      {/* Donut Chart with Center Total */}
      <div className="relative h-44 flex items-center justify-center my-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={attemptTypes}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={68}
              paddingAngle={4}
              dataKey="value"
            >
              {attemptTypes.map((entry, index) => (
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
          <span className="text-2xl font-black text-gray-900 leading-none">
            {totalTests}
          </span>
          <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
            Total Tests taken
          </p>
        </div>
      </div>

      {/* Bottom Legend Items Grid matching Figma layout */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 text-[11px] font-semibold text-gray-700">
        {attemptTypes.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-xs shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="truncate">
              {item.value} {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
