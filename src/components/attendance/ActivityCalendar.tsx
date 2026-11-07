import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatStudyMinutes,
  getAttendanceCalendar,
  type AttendanceDayMark,
  type IAttendanceDay,
} from "@/services/attendance.service";
import {
  V2_CARD_SHELL_PADDED,
  V2_INPUT,
  V2_MUTED,
  V2_SECTION_TITLE,
  V2_STRONG,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MARK_STYLE: Record<AttendanceDayMark, string> = {
  attended: "bg-[#E6F0EA] text-[#3E6B54] dark:bg-[#243830] dark:text-[#C5D9CE]",
  missed: "bg-[#F4E8E6] text-[#8C564F] dark:bg-[#3A2C2A] dark:text-[#E4D0CD]",
  pending: "bg-[#F4EFE4] text-[#7A6844] dark:bg-[#3A3428] dark:text-[#E4D8C0]",
  future: "bg-transparent text-inherit",
  before: "bg-transparent text-[#B8C2D0] dark:text-slate-600",
};

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const shiftMonth = (key: string, delta: number) => {
  const [year, month] = key.split("-").map(Number);
  return monthKey(new Date(year, month - 1 + delta, 1));
};

export const ActivityCalendar: React.FC<{
  userId?: string;
  title?: string;
  allowTeam?: boolean;
}> = ({ userId, title, allowTeam = false }) => {
  const { t } = useTranslation();
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [pickedUserId, setPickedUserId] = useState<string | undefined>(userId);
  const targetId = userId ?? pickedUserId;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["attendance", "calendar", month, targetId ?? "me"],
    queryFn: () => getAttendanceCalendar({ month, userId: targetId }),
  });
  const calendar = data?.data;
  const byDate = useMemo(() => {
    const map = new Map<string, IAttendanceDay>();
    calendar?.days.forEach((day) => map.set(day.date, day));
    return map;
  }, [calendar]);

  const [year, mon] = month.split("-").map(Number);
  const first = new Date(year, mon - 1, 1);
  const count = new Date(year, mon, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ];
  const label = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const markLabel = (mark?: AttendanceDayMark) => {
    if (mark === "attended") return t("attendance.attended");
    if (mark === "missed") return t("attendance.missed");
    if (mark === "pending") return t("attendance.pending");
    return "";
  };

  return (
    <div className={V2_CARD_SHELL_PADDED}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className={V2_SECTION_TITLE}>{title ?? t("attendance.calendarTitle")}</h3>
          {calendar?.tracked && (
            <p className={`text-[11px] ${V2_MUTED}`}>
              {t("attendance.monthSummary", {
                attended: calendar.attended,
                missed: calendar.missed,
                time: formatStudyMinutes(calendar.minutes),
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => setMonth((m) => shiftMonth(m, -1))} className="p-1 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-slate-700" aria-label={t("attendance.previousMonth")}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`text-xs font-bold ${V2_STRONG} w-28 text-center`}>{label}</span>
          <button type="button" onClick={() => setMonth((m) => shiftMonth(m, 1))} className="p-1 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-slate-700" aria-label={t("attendance.nextMonth")}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {allowTeam && (calendar?.team.length ?? 0) > 0 && !userId && (
        <select
          value={pickedUserId ?? ""}
          onChange={(e) => setPickedUserId(e.target.value || undefined)}
          className={`mb-3 w-full px-3 py-2 text-sm ${V2_INPUT}`}
        >
          <option value="">{t("attendance.myself")}</option>
          {calendar?.team.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.fullNames}
            </option>
          ))}
        </select>
      )}

      {isError ? (
        <p className="text-xs text-red-500">{t("attendance.loadError")}</p>
      ) : isLoading ? (
        <p className={`text-xs ${V2_MUTED}`}>{t("attendance.loading")}</p>
      ) : !calendar?.tracked ? (
        <p className={`text-xs ${V2_MUTED}`}>{t("attendance.notTracked")}</p>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((day) => (
              <div key={day} className={`text-[10px] font-bold text-center ${V2_MUTED}`}>
                {day.slice(0, 1)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, index) => {
              if (day === null) return <div key={`empty-${index}`} />;
              const date = `${month}-${String(day).padStart(2, "0")}`;
              const entry = byDate.get(date);
              const mark = entry?.mark ?? "future";
              const titleText = [markLabel(mark), entry?.minutes ? formatStudyMinutes(entry.minutes) : ""]
                .filter(Boolean)
                .join(" · ");
              return (
                <div
                  key={date}
                  title={titleText}
                  className={`h-8 rounded-lg text-xs font-semibold flex items-center justify-center ${MARK_STYLE[mark]}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <div className={`mt-3 flex flex-wrap gap-3 text-[11px] ${V2_MUTED}`}>
            <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#6F9A82]" />{t("attendance.attended")}</span>
            <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#C4A09A]" />{t("attendance.missed")}</span>
            <span className="inline-flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#C4B07A]" />{t("attendance.pending")}</span>
          </div>
        </>
      )}
    </div>
  );
};
