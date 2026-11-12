import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Award,
  CheckCircle2,
  Search,
  Activity,
  BookOpen,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
} from "lucide-react";
import { getMyGroup, getGroupMonitoring } from "@/services/cehoGroup.service";
import { SectionSkeleton } from "../shared/SectionSkeleton";
import { CEHODashboardVersionSwitcher } from "@/components/dashboard/DashboardVersionSwitcher";
import { uniqueCourseCertificateCount } from "@/utils/certificates";
import {
  V2_BTN_PRIMARY,
  V2_CARD_SHELL_PADDED,
  V2_EMPTY,
  V2_INPUT,
  V2_KPI_ICON_CHIP,
  V2_MUTED,
  V2_PAGE_CANVAS,
  V2_PAGE_SUBTITLE,
  V2_PAGE_TITLE,
  V2_SECTION_TITLE,
} from "./widgets/admin/v2CardStyles";
import { ActivityCalendar } from "@/components/attendance/ActivityCalendar";

type FilterStatus = "ALL" | "HIGH" | "NEEDS_HELP";

const MEMBERS_PAGE_SIZE = 7;

const memberAvgProgress = (m: {
  courseProgress: Array<{ progress: number }>;
}): number => {
  if (!m.courseProgress.length) return 0;
  return (
    m.courseProgress.reduce((s, c) => s + c.progress, 0) / m.courseProgress.length
  );
};

export const CEHODashboardV2: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("ALL");
  const [memberPage, setMemberPage] = useState(1);

  const { data: myGroup, isLoading: loadingGroup } = useQuery({
    queryKey: ["ceho-group-mine"],
    queryFn: getMyGroup,
    retry: false,
  });

  const { data: monitoring, isLoading: loadingMonitoring } = useQuery({
    queryKey: ["ceho-group-monitoring"],
    queryFn: getGroupMonitoring,
    retry: false,
  });

  const members = useMemo(
    () => (monitoring?.members ?? []).filter((m) => !(m as { isLeader?: boolean }).isLeader),
    [monitoring?.members],
  );

  const stats = useMemo(() => {
    const totalCertificates = members.reduce(
      (acc, m) => acc + uniqueCourseCertificateCount(m.certificates),
      0,
    );
    const avgGroupProgress =
      members.length > 0
        ? Math.round(
            members.reduce((acc, m) => acc + memberAvgProgress(m), 0) /
              members.length,
          )
        : 0;
    const activeMembersCount = members.filter(
      (m) =>
        m.activityStatus === "TODAY" || m.activityStatus === "THIS_WEEK",
    ).length;

    const activityBuckets = [
      {
        key: "TODAY",
        label: "Active ≤48h",
        count: members.filter((m) => m.activityStatus === "TODAY").length,
        color: "#3363AD",
      },
      {
        key: "THIS_WEEK",
        label: "This week",
        count: members.filter((m) => m.activityStatus === "THIS_WEEK").length,
        color: "#7DD3FC",
      },
      {
        key: "INACTIVE",
        label: "Inactive(7d+)",
        count: members.filter(
          (m) =>
            m.activityStatus !== "TODAY" && m.activityStatus !== "THIS_WEEK",
        ).length,
        color: "#C5CDD6",
      },
    ];

    const topPerformers = [...members]
      .map((m) => ({
        ...m,
        avg: Math.round(memberAvgProgress(m)),
      }))
      .sort((a, b) => {
        const certDiff =
          uniqueCourseCertificateCount(b.certificates) -
          uniqueCourseCertificateCount(a.certificates);
        if (certDiff !== 0) return certDiff;
        return b.avg - a.avg;
      })
      .slice(0, 3);

    // Lowest progress first — members who need CEHO attention
    const needsAttention = [...members]
      .map((m) => ({
        ...m,
        avg: Math.round(memberAvgProgress(m)),
      }))
      .sort((a, b) => {
        if (a.avg !== b.avg) return a.avg - b.avg;
        const aInactive = a.activityStatus === "INACTIVE" ? 1 : 0;
        const bInactive = b.activityStatus === "INACTIVE" ? 1 : 0;
        if (bInactive !== aInactive) return bInactive - aInactive;
        return (
          uniqueCourseCertificateCount(a.certificates) -
          uniqueCourseCertificateCount(b.certificates)
        );
      })
      .slice(0, 3);

    return {
      totalCertificates,
      avgGroupProgress,
      activeMembersCount,
      activityBuckets,
      topPerformers,
      needsAttention,
    };
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const name = m.user?.fullNames || "";
      const phone = m.user?.phoneNumber || "";
      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      const avg = memberAvgProgress(m);
      if (filterStatus === "HIGH") return avg >= 75;
      if (filterStatus === "NEEDS_HELP") return avg < 50;
      return true;
    });
  }, [members, searchQuery, filterStatus]);

  // Reset to first page when search/filter changes
  useEffect(() => {
    setMemberPage(1);
  }, [searchQuery, filterStatus]);

  const memberPageCount = Math.max(
    1,
    Math.ceil(filteredMembers.length / MEMBERS_PAGE_SIZE),
  );

  useEffect(() => {
    if (memberPage > memberPageCount) {
      setMemberPage(memberPageCount);
    }
  }, [memberPage, memberPageCount]);

  const pagedMembers = useMemo(() => {
    const start = (memberPage - 1) * MEMBERS_PAGE_SIZE;
    return filteredMembers.slice(start, start + MEMBERS_PAGE_SIZE);
  }, [filteredMembers, memberPage]);

  const pageFrom =
    filteredMembers.length === 0
      ? 0
      : (memberPage - 1) * MEMBERS_PAGE_SIZE + 1;
  const pageTo = Math.min(
    memberPage * MEMBERS_PAGE_SIZE,
    filteredMembers.length,
  );

  if (loadingGroup || loadingMonitoring) {
    return (
      <div className={V2_PAGE_CANVAS}>
        <SectionSkeleton cards={4} rows={3} />
      </div>
    );
  }

  const maxBucket = Math.max(
    1,
    ...stats.activityBuckets.map((b) => b.count),
  );

  return (
    <div className={V2_PAGE_CANVAS}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <h1
              className={`${V2_PAGE_TITLE} mb-0 cursor-pointer hover:text-[#3363AD] dark:hover:text-blue-300 transition-colors`}
              onClick={() => navigate("/ceho-group")}
            >
              {myGroup?.name || "My CHW Group"}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF0F9] dark:bg-slate-700/80 text-[11px] font-semibold text-[#3363AD] dark:text-blue-300 shrink-0">
              <ShieldCheck size={12} />
              CEHO supervision
            </div>
          </div>
          <p className={V2_PAGE_SUBTITLE}>
            Monitor assigned health workers, learning progress, and certificates
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/ceho-group")}
            className={V2_BTN_PRIMARY}
          >
            <UserPlus size={15} />
            Manage Group
          </button>
          <CEHODashboardVersionSwitcher />
        </div>
      </div>

      <ActivityCalendar allowTeam />

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Group CHWs",
            value: members.length,
            hint: "Members",
            Icon: Users,
            chip: "text-[#3363AD]",
            href: "/ceho-group?tab=members",
          },
          {
            label: "Avg Completion",
            value: `${stats.avgGroupProgress}%`,
            hint: "Target 80%",
            Icon: CheckCircle2,
            chip: "text-emerald-600 dark:text-emerald-400",
            href: "/ceho-group?tab=learning",
          },
          {
            label: "Certificates",
            value: stats.totalCertificates,
            hint: "Issued",
            Icon: Award,
            chip: "text-amber-600 dark:text-amber-400",
            href: "/ceho-group?tab=learning&cert=has_cert",
          },
          {
            label: "Active This Week",
            value: stats.activeMembersCount,
            hint: `/ ${members.length}`,
            Icon: Activity,
            chip: "text-indigo-600 dark:text-indigo-400",
            href: "/ceho-group?tab=members",
          },
        ].map(({ label, value, hint, Icon, chip, href }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(href)}
            className={`${V2_CARD_SHELL_PADDED} flex items-center gap-4 min-h-[96px] w-full text-left cursor-pointer hover:border-[rgba(51,99,173,0.40)] hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50 transition-colors`}
          >
            <div
              className={`w-11 h-11 rounded-[12px] ${V2_KPI_ICON_CHIP} flex items-center justify-center shrink-0`}
            >
              <Icon size={20} className={chip} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B6575] dark:text-slate-400">
                {label}
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-[22px] font-bold tabular-nums text-[#5B6575] dark:text-slate-100">
                  {value}
                </span>
                <span className="text-[11px] font-semibold text-[#9AA3B2] dark:text-slate-500">
                  {hint}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Members */}
        <div
          className={`lg:col-span-8 ${V2_CARD_SHELL_PADDED} flex flex-col min-h-[380px]`}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[rgba(51,99,173,0.12)] dark:border-slate-700 pb-3 mb-3 shrink-0">
            <button
              type="button"
              onClick={() => navigate("/ceho-group?tab=members")}
              className="text-left hover:opacity-80 transition-opacity"
            >
              <h3 className={V2_SECTION_TITLE}>Member Learning Progress</h3>
              <p className={`text-[11px] mt-0.5 ${V2_MUTED}`}>
                Open a health worker for full activity detail
              </p>
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA3B2]"
                />
                <input
                  type="text"
                  placeholder="Search member…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${V2_INPUT} pl-8 pr-3 py-1.5 text-xs w-44 sm:w-52`}
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as FilterStatus)
                }
                className={`${V2_INPUT} text-xs font-medium px-3 py-1.5 cursor-pointer`}
              >
                <option value="ALL">All performers</option>
                <option value="HIGH">High (≥75%)</option>
                <option value="NEEDS_HELP">Needs help (&lt;50%)</option>
              </select>
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <div className={V2_EMPTY}>
              <Users size={36} className="mx-auto text-[#C5D3E0] mb-2" />
              <p className="text-xs font-bold text-[#1A2332] dark:text-slate-200">
                No group members found
              </p>
              <p className={`text-[11px] mt-0.5 ${V2_MUTED}`}>
                Adjust search, or invite CHWs from Manage Group.
              </p>
              <button
                type="button"
                onClick={() => navigate("/ceho-group/invite")}
                className={`${V2_BTN_PRIMARY} mt-4`}
              >
                <UserPlus size={14} />
                Add CHW
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2 flex-1 overflow-y-auto min-h-0 pr-0.5">
                {pagedMembers.map((member) => {
                const memberName = member.user?.fullNames || "Health Worker";
                const memberPhone = member.user?.phoneNumber || "—";
                const avgProgress = Math.round(memberAvgProgress(member));
                const completedCount = member.courseProgress.filter(
                  (c) => c.isCompleted,
                ).length;
                const certsCount = uniqueCourseCertificateCount(member.certificates);
                const progressColor =
                  avgProgress >= 80
                    ? "bg-emerald-500"
                    : avgProgress >= 50
                      ? "bg-[#3363AD]"
                      : "bg-amber-500";

                return (
                  <button
                    key={member.studentId}
                    type="button"
                    onClick={() => navigate(`/chw/${member.studentId}`)}
                    className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[rgba(51,99,173,0.10)] dark:border-slate-700 hover:border-[rgba(51,99,173,0.35)] hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0 w-[200px] sm:w-[220px]">
                      <div className="w-10 h-10 rounded-full bg-[#EBF0F9] dark:bg-slate-700 text-[#3363AD] dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden">
                        {member.user?.photo ? (
                          <img
                            src={member.user.photo}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          memberName.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#1A2332] dark:text-slate-100 truncate group-hover:text-[#3363AD] dark:group-hover:text-blue-300">
                          {memberName}
                        </h4>
                        <p className="text-[11px] text-[#9AA3B2] truncate">
                          {memberPhone}
                        </p>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4 text-xs text-[#5B6575] dark:text-slate-400">
                      <span className="flex items-center gap-1 font-medium">
                        <BookOpen size={13} className="text-[#3363AD]" />
                        {completedCount}/{member.courseProgress.length} courses
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Award size={13} className="text-amber-500" />
                        {certsCount} certs
                      </span>
                    </div>

                    <div className="flex items-center gap-3 w-36 sm:w-44 shrink-0">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-[#9AA3B2]">
                            Progress
                          </span>
                          <span className="font-bold text-[#1A2332] dark:text-slate-100 tabular-nums">
                            {avgProgress}%
                          </span>
                        </div>
                        <div className="h-2 bg-[#E8EEF4] dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progressColor}`}
                            style={{ width: `${avgProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <span className="hidden sm:inline-flex items-center gap-0.5 text-xs font-bold text-[#3363AD] dark:text-blue-300 shrink-0 group-hover:translate-x-0.5 transition-transform">
                      Details
                      <ChevronRight size={15} />
                    </span>
                  </button>
                );
              })}
              </div>

              {filteredMembers.length > MEMBERS_PAGE_SIZE && (
                <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-[rgba(51,99,173,0.12)] dark:border-slate-700 shrink-0">
                  <p className={`text-[11px] font-semibold ${V2_MUTED}`}>
                    Showing {pageFrom}–{pageTo} of {filteredMembers.length}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={memberPage <= 1}
                      onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[rgba(51,99,173,0.20)] dark:border-slate-600 text-[#3363AD] dark:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF0F9] dark:hover:bg-slate-700 transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-[11px] font-bold tabular-nums text-[#1A2332] dark:text-slate-100 px-1.5">
                      {memberPage} / {memberPageCount}
                    </span>
                    <button
                      type="button"
                      disabled={memberPage >= memberPageCount}
                      onClick={() =>
                        setMemberPage((p) => Math.min(memberPageCount, p + 1))
                      }
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[rgba(51,99,173,0.20)] dark:border-slate-600 text-[#3363AD] dark:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBF0F9] dark:hover:bg-slate-700 transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right rail */}
        <div className="lg:col-span-4 space-y-4">
          <div className={`${V2_CARD_SHELL_PADDED} space-y-3`}>
            <button
              type="button"
              onClick={() => navigate("/ceho-group?tab=members")}
              className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity"
            >
              <h4 className={`${V2_SECTION_TITLE} flex items-center gap-1.5`}>
                <TrendingUp size={16} className="text-[#3363AD]" />
                Member activity
              </h4>
              <span className={`text-[11px] font-semibold ${V2_MUTED}`}>
                Live status
              </span>
            </button>

            <div className="space-y-2.5 pt-1">
              {stats.activityBuckets.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() =>
                    navigate(`/ceho-group?tab=members&status=${b.key}`)
                  }
                  className="w-full text-left rounded-lg p-1 -m-1 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-[#5B6575] dark:text-slate-400">
                      {b.label}
                    </span>
                    <span className="font-bold tabular-nums text-[#1A2332] dark:text-slate-100">
                      {b.count}
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#E8EEF4] dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(b.count / maxBucket) * 100}%`,
                        backgroundColor: b.color,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={`${V2_CARD_SHELL_PADDED} space-y-3`}>
            <button
              type="button"
              onClick={() => navigate("/ceho-group?tab=learning")}
              className="w-full text-left hover:opacity-80 transition-opacity"
            >
              <h4 className={V2_SECTION_TITLE}>Top performing CHWs</h4>
            </button>
            {stats.topPerformers.length === 0 ? (
              <p className={`text-xs py-4 text-center ${V2_MUTED}`}>
                No members to rank yet
              </p>
            ) : (
              <div className="space-y-2">
                {stats.topPerformers.map((m, idx) => {
                  const name = m.user?.fullNames || "Health Worker";
                  const rank = idx + 1;
                  return (
                    <button
                      key={m.studentId}
                      type="button"
                      onClick={() => navigate(`/chw/${m.studentId}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFC] dark:bg-slate-800/60 hover:bg-[#EBF0F9] dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-[#C5D3E0] dark:bg-slate-600 text-[11px] font-bold text-[#1A2332] dark:text-slate-100 flex items-center justify-center shrink-0">
                          {rank}
                        </span>
                        <span className="font-bold text-xs text-[#1A2332] dark:text-slate-100 truncate">
                          {name}
                        </span>
                      </div>
                      <span className="font-bold text-xs text-[#3363AD] dark:text-blue-300 tabular-nums shrink-0">
                        {m.avg}%
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className={`${V2_CARD_SHELL_PADDED} space-y-3`}>
            <button
              type="button"
              onClick={() => navigate("/ceho-group?tab=members&status=INACTIVE")}
              className="flex items-center justify-between gap-2 w-full text-left hover:opacity-80 transition-opacity"
            >
              <h4 className={`${V2_SECTION_TITLE} flex items-center gap-1.5`}>
                <TrendingDown size={16} className="text-amber-500" />
                Needs attention
              </h4>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                Weakest 3
              </span>
            </button>
            {stats.needsAttention.length === 0 ? (
              <p className={`text-xs py-4 text-center ${V2_MUTED}`}>
                No members to review yet
              </p>
            ) : (
              <div className="space-y-2">
                {stats.needsAttention.map((m, idx) => {
                  const name = m.user?.fullNames || "Health Worker";
                  const statusLabel =
                    m.activityStatus === "TODAY"
                      ? "Active"
                      : m.activityStatus === "THIS_WEEK"
                        ? "This week"
                        : "Inactive";
                  return (
                    <button
                      key={m.studentId}
                      type="button"
                      onClick={() => navigate(`/chw/${m.studentId}`)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-50 dark:hover:bg-amber-900/40 border border-amber-100/80 dark:border-amber-800/40 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-amber-200/80 dark:bg-amber-800/60 text-[11px] font-bold text-amber-900 dark:text-amber-100 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-[#1A2332] dark:text-slate-100 truncate block">
                            {name}
                          </span>
                          <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-xs text-amber-600 dark:text-amber-400 tabular-nums shrink-0">
                        {m.avg}%
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
