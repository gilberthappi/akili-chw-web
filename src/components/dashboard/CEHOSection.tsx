import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BarChart2,
  UserPlus,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Activity,
  MapPin,
} from "lucide-react";
import { getMyGroup, getGroupMonitoring } from "@/services/cehoGroup.service";
import { ICEHOGroupMonitoringMember } from "@/types";
import { SectionSkeleton } from "./shared/SectionSkeleton";
import {
  V2_BTN_PRIMARY,
  V2_BTN_SECONDARY,
  V2_CARD_SHELL_PADDED,
  V2_KPI_ICON_CHIP,
  V2_MUTED,
  V2_PAGE_STACK,
  V2_SECTION_TITLE,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

const Avatar: React.FC<{ name: string; photo: string | null; size?: string }> = ({
  name,
  photo,
  size = "w-9 h-9",
}) => {
  const [failed, setFailed] = React.useState(false);
  const initials = name?.substring(0, 2).toUpperCase() ?? "??";
  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${size} rounded-full object-cover shrink-0`}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      className={`${size} rounded-full bg-[#EBF0F9] dark:bg-slate-700 text-[#3363AD] dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0`}
    >
      {initials}
    </div>
  );
};

const MemberRow: React.FC<{ member: ICEHOGroupMonitoringMember }> = ({
  member,
}) => {
  const navigate = useNavigate();
  const avgProgress =
    member.courseProgress.length > 0
      ? Math.round(
          member.courseProgress.reduce((s, c) => s + c.progress, 0) /
            member.courseProgress.length,
        )
      : 0;
  const completed = member.courseProgress.filter((c) => c.isCompleted).length;
  const total = member.courseProgress.length;

  const barColor =
    avgProgress === 100
      ? "bg-emerald-500"
      : avgProgress > 50
        ? "bg-[#3363AD]"
        : "bg-amber-400";

  return (
    <button
      type="button"
      onClick={() => navigate(`/students/${member.studentId}`)}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-colors group text-left"
    >
      <Avatar name={member.user.fullNames} photo={member.user.photo} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-sm font-medium text-[#1A2332] dark:text-slate-100 truncate group-hover:text-[#3363AD] dark:group-hover:text-blue-300 transition-colors">
            {member.user.fullNames}
          </p>
          <span className="text-xs font-semibold text-[#5B6575] dark:text-slate-400 ml-2 shrink-0 tabular-nums">
            {avgProgress}%
          </span>
        </div>
        <div className="h-1.5 bg-[#E8EEF4] dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${avgProgress}%` }}
          />
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[10px] text-[#9AA3B2]">
            {completed}/{total} course{total !== 1 ? "s" : ""} completed
          </span>
        </div>
      </div>

      {avgProgress === 100 && (
        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
      )}
    </button>
  );
};

const StatCard: React.FC<{
  value: string | number;
  label: string;
  Icon: React.ElementType;
  accent: string;
  isLoading?: boolean;
}> = ({ value, label, Icon, accent, isLoading }) => (
  <div className={`${V2_CARD_SHELL_PADDED} flex items-center gap-4`}>
    <div
      className={`w-11 h-11 rounded-[12px] ${V2_KPI_ICON_CHIP} flex items-center justify-center shrink-0`}
    >
      <Icon size={20} className={accent} />
    </div>
    <div>
      <p
        className={`text-[22px] font-bold tabular-nums ${
          isLoading
            ? "text-gray-200 animate-pulse"
            : "text-[#5B6575] dark:text-slate-100"
        }`}
      >
        {isLoading ? "—" : value}
      </p>
      <p className={`text-xs mt-0.5 ${V2_MUTED}`}>{label}</p>
    </div>
  </div>
);

export const CEHOSection: React.FC = () => {
  const navigate = useNavigate();

  const { data: group, isLoading: isGroupLoading } = useQuery({
    queryKey: ["ceho-group-mine"],
    queryFn: getMyGroup,
    retry: false,
  });

  const { data: monitoring, isLoading: isMonitoringLoading } = useQuery({
    queryKey: ["ceho-group-monitoring"],
    queryFn: getGroupMonitoring,
    retry: false,
  });

  const isLoading = isGroupLoading || isMonitoringLoading;

  if (isLoading) return <SectionSkeleton cards={4} rows={2} />;

  const members = (monitoring?.members ?? []).filter((m) => !m.isLeader);

  const avgGroupProgress =
    members.length > 0
      ? Math.round(
          members.reduce((s, m) => {
            const avg =
              m.courseProgress.length > 0
                ? m.courseProgress.reduce((a, c) => a + c.progress, 0) /
                  m.courseProgress.length
                : 0;
            return s + avg;
          }, 0) / members.length,
        )
      : 0;

  const completedCount = members.filter((m) =>
    m.courseProgress.some((c) => c.isCompleted),
  ).length;

  const activeCount = members.filter(
    (m) =>
      m.activityStatus === "TODAY" || m.activityStatus === "THIS_WEEK",
  ).length;

  return (
    <div className={V2_PAGE_STACK}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-[10px] ${V2_KPI_ICON_CHIP} flex items-center justify-center`}
          >
            <Users size={14} />
          </div>
          <div>
            <h2 className={V2_SECTION_TITLE}>
              {group ? group.name : "My CHW Group"}
            </h2>
            {(group?.sectors?.length ?? 0) > 0 && (
              <p className={`text-xs flex items-center gap-1 mt-0.5 ${V2_MUTED}`}>
                <MapPin size={10} /> {group!.sectors!.join(", ")}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/ceho-group")}
          className="text-xs font-semibold text-[#3363AD] dark:text-blue-300 hover:underline flex items-center gap-0.5"
        >
          View group <ChevronRight size={12} />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={members.length}
          label="Total CHWs"
          Icon={Users}
          accent="text-[#3363AD] dark:text-blue-300"
          isLoading={isLoading}
        />
        <StatCard
          value={activeCount}
          label="Active this week"
          Icon={Activity}
          accent="text-amber-500"
          isLoading={isLoading}
        />
        <StatCard
          value={completedCount}
          label="Completed a course"
          Icon={CheckCircle2}
          accent="text-emerald-500"
          isLoading={isLoading}
        />
        <StatCard
          value={`${avgGroupProgress}%`}
          label="Avg group progress"
          Icon={TrendingUp}
          accent="text-purple-500"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`lg:col-span-2 ${V2_CARD_SHELL_PADDED}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-[8px] ${V2_KPI_ICON_CHIP} flex items-center justify-center`}
              >
                <BarChart2 size={14} />
              </div>
              <h3 className={V2_SECTION_TITLE}>Member Progress</h3>
              {members.length > 0 && (
                <span className="text-xs bg-[#EBF0F9] dark:bg-slate-700 text-[#3363AD] dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full">
                  {members.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate("/ceho-group")}
              className="text-xs font-semibold text-[#3363AD] dark:text-blue-300 hover:underline flex items-center gap-0.5"
            >
              View all <ChevronRight size={12} />
            </button>
          </div>

          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div
                className={`w-12 h-12 rounded-xl ${V2_KPI_ICON_CHIP} flex items-center justify-center mb-3`}
              >
                <Users size={20} className="opacity-50" />
              </div>
              <p className="text-sm font-medium text-[#5B6575] dark:text-slate-300">
                No members yet
              </p>
              <p className={`text-xs mt-1 ${V2_MUTED}`}>
                Invite CHW members to your group
              </p>
              <button
                type="button"
                onClick={() => navigate("/ceho-group/invite")}
                className={`${V2_BTN_PRIMARY} mt-4`}
              >
                Invite CHW
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {members.slice(0, 6).map((m) => (
                <MemberRow key={m.studentId} member={m} />
              ))}
              {members.length > 6 && (
                <button
                  type="button"
                  onClick={() => navigate("/ceho-group")}
                  className="w-full text-xs font-semibold text-[#3363AD] dark:text-blue-300 hover:underline pt-2 pb-1 text-center"
                >
                  +{members.length - 6} more members
                </button>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-1 space-y-3">
          {[
            {
              label: "My Group",
              desc: "View and manage CHWs",
              Icon: Users,
              path: "/ceho-group",
              primary: true,
            },
            {
              label: "Add CHW",
              desc: "Add new members",
              Icon: UserPlus,
              path: "/ceho-group/invite",
              primary: false,
            },
          ].map(({ label, desc, Icon, path, primary }) => (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={`w-full ${V2_CARD_SHELL_PADDED} text-left hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40 transition-colors flex items-center gap-3 group`}
            >
              <div
                className={`w-10 h-10 rounded-[12px] ${V2_KPI_ICON_CHIP} flex items-center justify-center shrink-0`}
              >
                <Icon
                  size={17}
                  className={
                    primary
                      ? "text-[#3363AD] dark:text-blue-300"
                      : "text-amber-600 dark:text-amber-400"
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A2332] dark:text-slate-100 group-hover:text-[#3363AD] dark:group-hover:text-blue-300 transition-colors">
                  {label}
                </p>
                <p className={`text-xs ${V2_MUTED}`}>{desc}</p>
              </div>
              <ChevronRight
                size={14}
                className="text-[#C5D3E0] group-hover:text-[#3363AD] dark:group-hover:text-blue-300 transition-colors shrink-0"
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => navigate("/ceho-group")}
            className={`${V2_BTN_SECONDARY} w-full`}
          >
            Open full group workspace
          </button>
        </div>
      </div>
    </div>
  );
};
