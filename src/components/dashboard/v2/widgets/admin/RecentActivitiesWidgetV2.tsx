import React from "react";
import { UserCheck, Activity } from "lucide-react";
import { SECTION4_RECENT_ACTIVITIES } from "./section4DesignData";

interface RecentActivitiesWidgetV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  activities?: any[];
  useDesignDummy?: boolean;
}

export const RecentActivitiesWidgetV2: React.FC<RecentActivitiesWidgetV2Props> = () => {
  const { group, items } = SECTION4_RECENT_ACTIVITIES;

  return (
    <div className="bg-white rounded-[20px] border border-[#C8D6E3] p-3.5 flex flex-col w-full h-full min-h-0 overflow-hidden">
      <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight shrink-0 mb-2">
        Recent activities
      </h3>

      <p className="text-[11px] font-semibold text-[#5B6575] mb-2.5 shrink-0">{group}</p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 flex-1">
          <div className="w-10 h-10 rounded-full bg-[#EBF3FB] flex items-center justify-center text-[#3363AD]">
            <Activity size={18} className="text-[#3363AD]" />
          </div>
          <p className="text-xs font-bold text-gray-700">No recent activities</p>
        </div>
      ) : (
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pr-1
            [scrollbar-gutter:stable]
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-[#E8EEF4]
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-[#A8B8C8]
            [&::-webkit-scrollbar-thumb]:rounded-full"
        >
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
  );
};

export default RecentActivitiesWidgetV2;
