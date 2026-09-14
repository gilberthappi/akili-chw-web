import React, { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import { useAdminDashboardV2Schedule } from "@/hooks/useAdminDashboardV2Schedule";
import { ListSkeleton } from "./AdminWidgetSkeleton";
import { V2_CARD_SHELL_PADDED } from "./v2CardStyles";

export const ScheduleCalendarWidgetV2: React.FC = () => {
  const { filters } = useAdminDashboardFilters();
  const [timeframe, setTimeframe] = useState("Today");
  const { items, isLoading } = useAdminDashboardV2Schedule(filters, timeframe);

  return (
    <div className={`${V2_CARD_SHELL_PADDED} flex flex-col w-full h-full shrink-0 overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 mb-3 shrink-0">
        <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight">
          Schedule calendar
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
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5B6575] pointer-events-none"
          />
        </div>
      </div>

      <div
        className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5
          [scrollbar-gutter:stable]
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-[#E8EEF4]
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-[#A8B8C8]
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        <div
          className="absolute left-[4.35rem] top-3 bottom-3 w-0 border-l border-dashed border-[#7BA3D4]"
          aria-hidden
        />

        {isLoading && items.length === 0 ? (
          <ListSkeleton rows={5} />
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-[12px] text-[#9AA3B2]">
            No meetings in this period
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((m) => {
              const isActive = Boolean(m.active);

              return (
                <div key={m.id} className="flex items-center gap-2.5">
                  <span className="w-[3.5rem] shrink-0 text-[10px] font-semibold text-[#5B6575] tabular-nums text-right leading-none">
                    {m.time}
                  </span>

                  <div className="relative shrink-0 w-3 flex items-center justify-center z-10">
                    <span
                      className={`rounded-full bg-[#3363AD] ${
                        isActive
                          ? "w-3.5 h-3.5 ring-2 ring-[#3363AD]/25"
                          : "w-2 h-2"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0 rounded-[10px] bg-[#E8F0F8] hover:bg-[#DDE8F3] px-2.5 py-2 transition-colors cursor-pointer">
                    <p className="text-[11px] font-bold text-[#1A2332] leading-tight">
                      {m.badge}
                    </p>
                    <p className="text-[10px] font-medium text-[#5B6575] leading-snug mt-0.5">
                      {m.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleCalendarWidgetV2;
