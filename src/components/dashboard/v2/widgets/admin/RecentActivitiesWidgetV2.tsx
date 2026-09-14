import React from "react";
import { UserCheck, Activity } from "lucide-react";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import { useAdminDashboardV2RecentActivities } from "@/hooks/useAdminDashboardV2RecentActivities";
import { ListSkeleton } from "./AdminWidgetSkeleton";
import { V2_CARD_SHELL_PADDED } from "./v2CardStyles";

export const RecentActivitiesWidgetV2: React.FC = () => {
  const { filters } = useAdminDashboardFilters();
  const { group, items, isLoading } =
    useAdminDashboardV2RecentActivities(filters);

  return (
    <div className={`${V2_CARD_SHELL_PADDED} flex flex-col w-full h-full min-h-0 overflow-hidden shrink-0`}>
      <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight shrink-0 mb-2">
        Recent activities
      </h3>

      <p className="text-[11px] font-semibold text-[#5B6575] mb-2.5 shrink-0">
        {group}
      </p>

      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1
          [scrollbar-gutter:stable]
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-[#E8EEF4]
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-[#A8B8C8]
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {isLoading && items.length === 0 ? (
          <ListSkeleton rows={5} />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#EBF3FB] flex items-center justify-center text-[#3363AD]">
              <Activity size={18} className="text-[#3363AD]" />
            </div>
            <p className="text-xs font-bold text-gray-700">
              No recent activities
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#3363AD] text-white flex items-center justify-center shrink-0">
                  <UserCheck size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-[#1A2332] leading-snug">
                    {item.text}
                  </p>
                  <p className="text-[10px] font-semibold text-[#9AA3B2] mt-1 tabular-nums">
                    {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivitiesWidgetV2;
