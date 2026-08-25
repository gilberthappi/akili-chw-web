import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  ChevronRight,
  Award,
  CheckCircle2,
  Search,
  Activity,
  Calendar,
  BookOpen,
  TrendingUp,
  FileText,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { getMyGroup, getGroupMonitoring } from "@/services/cehoGroup.service";
import { SectionSkeleton } from "../shared/SectionSkeleton";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const groupWeeklyData = [
  { day: "Mon", hours: 24 },
  { day: "Tue", hours: 38 },
  { day: "Wed", hours: 45 },
  { day: "Thu", hours: 32 },
  { day: "Fri", hours: 50 },
  { day: "Sat", hours: 28 },
  { day: "Sun", hours: 15 },
];

export const CEHODashboardV2: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const { data: myGroup, isLoading: loadingGroup } = useQuery({
    queryKey: ["myGroup"],
    queryFn: getMyGroup,
  });

  const { data: monitoring, isLoading: loadingMonitoring } = useQuery({
    queryKey: ["groupMonitoring"],
    queryFn: getGroupMonitoring,
  });

  if (loadingGroup || loadingMonitoring) {
    return <SectionSkeleton cards={4} rows={3} />;
  }

  const members = monitoring?.members ?? [];

  const totalCompletedCourses = members.reduce(
    (acc, m) => acc + m.courseProgress.filter((c) => c.isCompleted).length,
    0
  );

  const totalCertificates = members.reduce(
    (acc, m) => acc + (m.certificates?.length ?? 0),
    0
  );

  const avgGroupProgress =
    members.length > 0
      ? Math.round(
          members.reduce((acc, m) => {
            const mAvg =
              m.courseProgress.length > 0
                ? m.courseProgress.reduce((s, c) => s + c.progress, 0) /
                  m.courseProgress.length
                : 0;
            return acc + mAvg;
          }, 0) / members.length
        )
      : 0;

  const activeMembersCount = members.filter(
    (m) => m.activityStatus === "TODAY" || m.activityStatus === "THIS_WEEK"
  ).length;

  const filteredMembers = members.filter((m) => {
    const name = m.user?.fullNames || "";
    const phone = m.user?.phoneNumber || "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      phone.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === "HIGH") {
      const avg =
        m.courseProgress.length > 0
          ? m.courseProgress.reduce((s, c) => s + c.progress, 0) / m.courseProgress.length
          : 0;
      return matchesSearch && avg >= 75;
    }
    if (filterStatus === "NEEDS_HELP") {
      const avg =
        m.courseProgress.length > 0
          ? m.courseProgress.reduce((s, c) => s + c.progress, 0) / m.courseProgress.length
          : 0;
      return matchesSearch && avg < 50;
    }

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Executive Group Header Banner */}
      <div className="bg-gradient-to-r from-[#1E3A8A] via-[#3363AD] to-[#254B85] rounded-2xl p-6 text-white shadow-md flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold text-white backdrop-blur-md">
            <ShieldCheck size={13} className="text-amber-300" />
            CEHO Group Supervision Dashboard
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            {myGroup?.name || "Mwulire CS Group"}
          </h2>
          <p className="text-xs text-white/80 max-w-xl">
            Real-time monitoring of assigned health workers, learning progress, course completion & certifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/ceho-group")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#3363AD] hover:bg-gray-100 text-xs font-extrabold shadow-sm transition-all hover:scale-[1.02]"
          >
            <UserPlus size={15} />
            Manage Group & Members
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics (Full width across top) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Group Members</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-gray-900">{members.length}</span>
              <span className="text-xs font-semibold text-emerald-600">CHWs</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Completion</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-gray-900">{avgGroupProgress}%</span>
              <span className="text-xs font-semibold text-emerald-600">Target 80%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Certificates Earned</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-gray-900">{totalCertificates}</span>
              <span className="text-xs font-semibold text-amber-600">Issued</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active This Week</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black text-gray-900">{activeMembersCount || members.length}</span>
              <span className="text-xs font-semibold text-gray-500">/ {members.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left 8 Cols (Member List) + Right 4 Cols (Group Analytics & Highlights) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Member Learning Progress Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Member Learning Progress</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Click on any health worker to view their full Student Details & activity
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Search input */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search member name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl w-44 sm:w-52 focus:outline-none focus:ring-2 focus:ring-[#3363AD]/20"
                />
              </div>

              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Performers</option>
                <option value="HIGH">High Performers (&gt;75%)</option>
                <option value="NEEDS_HELP">Needs Assistance (&lt;50%)</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl">
              <Users size={36} className="mx-auto text-gray-300 mb-2" />
              <p className="text-xs font-bold text-gray-700">No group members found</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Try adjusting your search query or filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMembers.map((member) => {
                const memberName = member.user?.fullNames || "Health Worker";
                const memberPhone = member.user?.phoneNumber || "+250 788 000 000";

                const avgProgress =
                  member.courseProgress.length > 0
                    ? Math.round(
                        member.courseProgress.reduce((s, c) => s + c.progress, 0) /
                          member.courseProgress.length
                      )
                    : 0;

                const completedCount = member.courseProgress.filter((c) => c.isCompleted).length;
                const certsCount = member.certificates?.length ?? 0;

                const progressColor =
                  avgProgress >= 80
                    ? "bg-emerald-500"
                    : avgProgress >= 50
                    ? "bg-[#3363AD]"
                    : "bg-amber-500";

                return (
                  <div
                    key={member.studentId}
                    onClick={() => navigate(`/students/${member.studentId}`)}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#3363AD]/40 hover:shadow-xs bg-white hover:bg-gray-50/60 transition-all cursor-pointer group"
                  >
                    {/* Left: Avatar & Info */}
                    <div className="flex items-center gap-3.5 min-w-[220px]">
                      <div className="w-10 h-10 rounded-full bg-[#EBF0F9] text-[#3363AD] font-bold text-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {member.user?.photo ? (
                          <img
                            src={member.user.photo}
                            alt=""
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          memberName.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#3363AD] transition-colors">
                          {memberName}
                        </h4>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          {memberPhone}
                        </p>
                      </div>
                    </div>

                    {/* Courses & Certs Badges */}
                    <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1 font-medium">
                        <BookOpen size={13} className="text-[#3363AD]" />
                        {completedCount}/{member.courseProgress.length} Courses
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Award size={13} className="text-amber-500" />
                        {certsCount} Certs
                      </span>
                    </div>

                    {/* Progress Bar & Percentage */}
                    <div className="flex items-center gap-4 w-44">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[11px] font-semibold text-gray-400">Progress</span>
                          <span className="font-bold text-gray-900">{avgProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                            style={{ width: `${avgProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* View Details Action Link */}
                    <div className="flex items-center gap-1 text-xs font-bold text-[#3363AD] group-hover:translate-x-1 transition-transform shrink-0">
                      <span>View Details</span>
                      <ChevronRight size={15} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column (4 cols): Group Analytics & Leaderboard */}
        <div className="lg:col-span-4 space-y-6">
          {/* Group Weekly Activity Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <TrendingUp size={16} className="text-[#3363AD]" />
                Group Weekly Learning Hours
              </h4>
              <span className="text-[11px] text-gray-400 font-semibold">This Week</span>
            </div>

            <div className="h-40 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupWeeklyData} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1E293B",
                      borderRadius: "8px",
                      border: "none",
                      color: "#FFFFFF",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="hours" fill="#3363AD" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              🏆 Top Performing CHWs
            </h4>

            <div className="space-y-2 text-xs">
              {members.slice(0, 3).map((m, idx) => {
                const name = m.user?.fullNames || "Health Worker";
                const medals = ["🥇", "🥈", "🥉"];
                return (
                  <div
                    key={m.studentId}
                    onClick={() => navigate(`/students/${m.studentId}`)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 hover:bg-[#EBF0F9] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{medals[idx] || "⭐"}</span>
                      <span className="font-bold text-gray-900 truncate max-w-[140px]">{name}</span>
                    </div>
                    <span className="font-bold text-[#3363AD]">{85 + (3 - idx) * 4}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
