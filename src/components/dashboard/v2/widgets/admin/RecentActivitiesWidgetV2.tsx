import React from "react";
import { UserCheck } from "lucide-react";

interface RecentActivitiesWidgetV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  activities?: any[];
}

export const RecentActivitiesWidgetV2: React.FC<RecentActivitiesWidgetV2Props> = ({
  activities = [],
}) => {
  const fallbackActivities = [
    {
      id: "a1",
      text: "CHW named KAMANA Jean-Baptiste has finished certificate exam with five trials",
      time: "10:45 PM",
    },
    {
      id: "a2",
      text: "CHW named KAMANA Jean-Baptiste has finished certificate exam with five trials",
      time: "10:45 PM",
    },
    {
      id: "a3",
      text: "CHW named KAMANA Jean-Baptiste has finished certificate exam with five trials",
      time: "10:45 PM",
    },
    {
      id: "a4",
      text: "CHW named KAMANA Jean-Baptiste has finished certificate exam with five trials",
      time: "10:45 PM",
    },
    {
      id: "a5",
      text: "CHW named KAMANA Jean-Baptiste has finished certificate exam with five trials",
      time: "10:45 PM",
    },
  ];

  const displayList =
    activities && activities.length > 0
      ? activities.slice(0, 5).map((item, idx) => ({
          id: item.id || idx,
          text:
            item.text ||
            item.action ||
            item.description ||
            "CHW named KAMANA Jean-Baptiste has finished certificate exam with five trials",
          time: item.time || item.createdAt || "10:45 PM",
        }))
      : fallbackActivities;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-3.5 h-full">
      {/* Header */}
      <div>
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
          Recent activities
        </h3>
        <p className="text-[11px] font-semibold text-gray-400 mt-0.5">Today</p>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3 flex-1">
        {displayList.map((item, idx) => (
          <div
            key={item.id || idx}
            className="flex items-start gap-3 p-1 rounded-xl hover:bg-gray-50/80 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#3363AD] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform mt-0.5">
              <UserCheck size={15} />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="text-xs font-semibold text-gray-700 leading-snug line-clamp-2">
                {item.text}
              </p>
              <p className="text-[10px] font-bold text-gray-400">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
