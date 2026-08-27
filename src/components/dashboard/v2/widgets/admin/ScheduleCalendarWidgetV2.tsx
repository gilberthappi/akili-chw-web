import React, { useState } from "react";

interface ScheduleCalendarWidgetV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  events?: any[];
}

export const ScheduleCalendarWidgetV2: React.FC<ScheduleCalendarWidgetV2Props> = ({
  events = [],
}) => {
  const [timeframe, setTimeframe] = useState("Today");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

  // Sort events by timestamp descending (5 last meetings first)
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const sortedEvents = [...(events || [])].sort((a: any, b: any) => {
    const rawA = a.startAt || a.startDate || a.startTime || a.date || a.createdAt;
    const rawB = b.startAt || b.startDate || b.startTime || b.date || b.createdAt;
    const timeA = rawA ? new Date(rawA).getTime() : 0;
    const timeB = rawB ? new Date(rawB).getTime() : 0;
    return timeB - timeA;
  });

  // Filter events by selected timeframe date ranges
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const filteredEvents = sortedEvents.filter((e: any) => {
    if (timeframe === "All Time") return true;
    const rawDate = e.startAt || e.startDate || e.startTime || e.date || e.createdAt;
    if (!rawDate) return true;

    const t = new Date(rawDate).getTime();
    if (isNaN(t)) return true;

    if (timeframe === "Today") return t >= todayStart;
    if (timeframe === "This Week") return t >= weekStart;
    if (timeframe === "This Month") return t >= monthStart;
    if (timeframe === "This Year") return t >= yearStart;
    return true;
  });

  // Use the 5 last meetings from filtered list (or sorted list)
  const last5Events = filteredEvents.length > 0 ? filteredEvents.slice(0, 5) : sortedEvents.slice(0, 5);

  // Format real event time cleanly from startAt / startTime / createdAt
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const getEventTime = (e: any, idx: number) => {
    const rawDate = e.startAt || e.startDate || e.startTime || e.date || e.createdAt;
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
        }
      } catch (err) {
        console.error(err);
      }
    }
    const defaultTimes = ["08:30 AM", "10:00 AM", "01:30 PM", "03:15 PM", "04:45 PM"];
    return defaultTimes[idx % defaultTimes.length];
  };

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const displayMeetings = last5Events.map((e: any, idx: number) => {
    const rawBadge = e.meetingType || e.eventType || e.type || "Virtual meeting";
    const badgeClean = String(rawBadge).replace(/_/g, " ").toUpperCase();

    return {
      time: getEventTime(e, idx),
      badge: badgeClean,
      title: e.title || e.name || "Scheduled Health Training Session",
    };
  });

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
          <option>This Week</option>
          <option>This Month</option>
          <option>This Year</option>
          <option>All Time</option>
        </select>
      </div>

      {/* Meetings Agenda List */}
      <div className="space-y-2 flex-1">
        {displayMeetings.length > 0 ? (
          displayMeetings.map((m, idx) => (
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
          ))
        ) : (
          <p className="text-xs font-semibold text-gray-400 italic py-4 text-center">
            No scheduled meetings for {timeframe.toLowerCase()}
          </p>
        )}
      </div>
    </div>
  );
};
