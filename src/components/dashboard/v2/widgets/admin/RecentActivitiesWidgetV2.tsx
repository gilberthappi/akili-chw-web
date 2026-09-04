import React from "react";
import { UserCheck, Activity } from "lucide-react";

interface RecentActivitiesWidgetV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  activities?: any[];
}

export const RecentActivitiesWidgetV2: React.FC<RecentActivitiesWidgetV2Props> = ({
  activities = [],
}) => {
  const now = new Date();

  // Helper to format date and time for left-side display
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const getEventDateAndTime = (rawDate: any) => {
    let dateStr = "Today";
    let timeStr = "12:00 PM";

    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

          const isToday = d.toDateString() === now.toDateString();
          if (isToday) {
            dateStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
          } else {
            const yesterday = new Date(now);
            yesterday.setDate(now.getDate() - 1);
            if (d.toDateString() === yesterday.toDateString()) {
              dateStr = "Yesterday";
            } else {
              dateStr = d.toLocaleDateString([], { month: "short", day: "numeric" });
            }
          }
          return { dateStr, timeStr };
        }
      } catch (err) {
        console.error(err);
      }
    }

    return { dateStr, timeStr };
  };

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const displayList = (activities || []).slice(0, 5).map((item: any, idx: number) => {
    const rawDate = item.lastActivity || item.timestamp || item.createdAt || item.updatedAt;
    const { dateStr, timeStr } = getEventDateAndTime(rawDate);

    const studentName = item.studentName || item.userName || item.fullNames || item.user?.fullNames || item.actorName || "CHW Learner";
    const courseTitle = item.courseName || item.courseTitle || item.title || "Health Training Course";

    let actionText = "";
    if (item.text || item.action || item.message) {
      actionText = item.text || item.action || item.message;
    } else if (item.status === "Completed" || item.progress === 100 || item.isCompleted) {
      actionText = `CHW named ${studentName} has completed course "${courseTitle}"`;
    } else if (item.progress > 0) {
      actionText = `CHW named ${studentName} reached ${item.progress}% progress in "${courseTitle}"`;
    } else {
      actionText = `CHW named ${studentName} enrolled in "${courseTitle}"`;
    }

    return {
      id: item.id || idx,
      text: actionText,
      dateStr,
      timeStr,
    };
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-3.5 h-full min-h-[220px]">
      {/* Header */}
      <div>
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
          Recent activities
        </h3>
      </div>

      {/* Activity Timeline List or Clean Empty State */}
      {displayList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 flex-1">
          <div className="w-10 h-10 rounded-full bg-[#EBF3FB] flex items-center justify-center text-[#3363AD]">
            <Activity size={18} className="text-[#3363AD]" />
          </div>
          <p className="text-xs font-bold text-gray-700">No recent activities</p>
          <p className="text-[10px] text-gray-400 font-semibold max-w-[200px]">
            Live updates will appear here automatically when CHWs register or complete modules.
          </p>
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {displayList.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex items-start gap-2.5 p-1 rounded-xl hover:bg-gray-50/80 transition-colors cursor-pointer group"
            >
              {/* Left side Date & Time */}
              <div className="flex flex-col items-start shrink-0 w-16 pt-0.5 text-left">
                <span className="text-[11px] font-black text-gray-900 leading-none">
                  {item.dateStr}
                </span>
                <span className="text-[9px] font-bold text-gray-400 mt-0.5">
                  {item.timeStr}
                </span>
              </div>

              {/* Avatar Icon */}
              <div className="w-7 h-7 rounded-full bg-[#3363AD] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform mt-0.5">
                <UserCheck size={14} />
              </div>

              {/* Activity Text */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-700 leading-snug line-clamp-2">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

