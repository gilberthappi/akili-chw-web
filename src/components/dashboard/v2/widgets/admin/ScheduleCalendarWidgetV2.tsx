import React, { useState } from "react";

export const ScheduleCalendarWidgetV2: React.FC = () => {
  const [timeframe, setTimeframe] = useState("Today");

  const meetings = [
    {
      time: "01:30 PM",
      badge: "Virtual meeting",
      title: "Kumenya Ibiranga byindwara zitandura",
    },
    {
      time: "01:30 PM",
      badge: "Virtual meeting",
      title: "Kumenya Ibiranga byindwara zitandura",
    },
    {
      time: "03:30 PM",
      badge: "Virtual meeting",
      title: "Kumenya Ibiranga byindwara zitandura",
    },
    {
      time: "01:30 PM",
      badge: "Virtual meeting",
      title: "Kumenya Ibiranga byindwara zitandura",
    },
    {
      time: "01:30 PM",
      badge: "Virtual meeting",
      title: "Kumenya Ibiranga byindwara zitandura",
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-3.5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
          Schedule calendar
        </h3>

        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer shadow-2xs hover:border-[#3363AD] transition-colors"
        >
          <option>Today</option>
          <option>Tomorrow</option>
          <option>This Week</option>
        </select>
      </div>

      {/* Meetings Agenda List */}
      <div className="space-y-2 flex-1">
        {meetings.map((m, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-2 rounded-xl bg-[#EBF0F9]/60 hover:bg-[#EBF0F9] transition-colors cursor-pointer"
          >
            <span className="text-xs font-black text-gray-700 w-16 shrink-0 text-center">
              {m.time}
            </span>

            <div className="min-w-0 flex-1">
              <span className="bg-[#3363AD]/10 text-[#3363AD] text-[9px] font-extrabold px-2 py-0.5 rounded-md inline-block mb-0.5">
                {m.badge}
              </span>
              <p className="text-xs font-bold text-gray-800 truncate">
                {m.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
