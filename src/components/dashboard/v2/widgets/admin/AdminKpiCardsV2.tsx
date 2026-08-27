import React from "react";
import { MoreHorizontal, TrendingUp } from "lucide-react";

interface AdminKpiCardsV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  totalUsers?: any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  totalCourses?: any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  totalEnrollments?: any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  totalHealthCenters?: any;
}

export const AdminKpiCardsV2: React.FC<AdminKpiCardsV2Props> = ({
  totalUsers,
  totalCourses,
  totalEnrollments,
  totalHealthCenters,
}) => {
  // Helper to extract primitive number/string value from potential object responses
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const getValue = (val: any, fallback: number = 0): number | string => {
    if (val === 0) return 0;
    if (val === null || val === undefined) return fallback;
    if (typeof val === "number" || typeof val === "string") return val;
    if (typeof val === "object" && val !== null) {
      if (val.value !== undefined) return val.value;
      if (val.count !== undefined) return val.count;
      if (val.total !== undefined) return val.total;
    }
    return fallback;
  };

  // Helper to extract trend/growth percentage string cleanly without [object Object]
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const getGrowth = (val: any, fallback: string = "Active"): string => {
    if (typeof val === "object" && val !== null) {
      if (val.trend && typeof val.trend === "object" && val.trend.value !== undefined) {
        return `${val.trend.value >= 0 ? "+" : ""}${val.trend.value}%`;
      }
      if (typeof val.trend === "number" || typeof val.trend === "string") return `${val.trend}%`;
      if (typeof val.growth === "number" || typeof val.growth === "string") return `${val.growth}%`;
      if (typeof val.percentage === "number" || typeof val.percentage === "string") return `${val.percentage}%`;
    }
    if (typeof val === "string" && val.endsWith("%")) return val;
    return fallback;
  };

  const cards = [
    {
      title: "TOTAL USERS",
      value: getValue(totalUsers, 0),
      subtext: "Registrations",
      growth: getGrowth(totalUsers, "+0%"),
    },
    {
      title: "TOTAL COURSES",
      value: getValue(totalCourses, 0),
      subtext: "Active Modules",
      growth: getGrowth(totalCourses, "+0%"),
    },
    {
      title: "ENROLLMENT",
      value: getValue(totalEnrollments, 0),
      subtext: "Total Registrations",
      growth: getGrowth(totalEnrollments, "+0%"),
    },
    {
      title: "HEALTH CENTERS",
      value: getValue(totalHealthCenters, 0),
      subtext: "Registered Centers",
      growth: getGrowth(totalHealthCenters, "+0%"),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
              {card.title}
            </h4>
            <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
              <MoreHorizontal size={16} />
            </button>
          </div>

          {/* Main Stat Value & Growth Pill */}
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900 tracking-tight">
                  {card.value}
                </span>
                {card.max && (
                  <span className="text-xs font-bold text-gray-400">
                    /{card.max}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-semibold text-gray-400 mt-0.5">
                {card.subtext}
              </p>
            </div>

            {/* Growth Pill Badge */}
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full text-[11px] font-bold">
              <TrendingUp size={11} />
              <span>{card.growth}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
