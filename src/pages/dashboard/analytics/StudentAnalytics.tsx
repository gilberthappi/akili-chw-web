import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, BookOpen, CheckCircle, Clock, TrendingUp, Users } from "lucide-react";
import { getStudentAnalytics } from "@/services/analytics.service";
import { TrendLineChart } from "./TrendLineChart";
import { V2KpiCard, V2KpiSkeleton } from "@/components/v2/V2Page";
import {
  V2_CARD_SHELL,
  V2_CARD_SHELL_PADDED,
  V2_EMPTY,
  V2_MUTED,
  V2_PILL,
  V2_PILL_BLUE,
  V2_SECTION_TITLE,
  V2_STRONG,
  V2_TABLE_BODY,
  V2_TABLE_HEAD,
  V2_TABLE_ROW,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

const BAND_COLORS: Record<string, string> = {
  excellent: "bg-[#3363AD]",
  good: "bg-[#3363AD]/80",
  average: "bg-[#3363AD]/60",
  poor: "bg-amber-500",
  failing: "bg-red-500",
};

const formatLastActive = (value: string) => {
  const hours = Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const Empty: React.FC<{ Icon: typeof Users; text: string }> = ({ Icon, text }) => (
  <div className={`${V2_EMPTY} py-8 flex flex-col items-center justify-center`}>
    <Icon className='w-9 h-9 mb-2 text-[#C5D3E0]' />
    <p className='text-xs'>{text}</p>
  </div>
);

export const StudentAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "chws"],
    queryFn: () => getStudentAnalytics(),
  });
  const analytics = data?.data;
  const trends = analytics?.engagementTrends ?? [];
  const openChw = (id?: string) => id && navigate(`/chw/${id}`);

  return (
    <>
      {isLoading ? (
        <V2KpiSkeleton count={4} />
      ) : (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <V2KpiCard
            label='Total CHWs'
            value={(analytics?.totalStudents?.value ?? 0).toLocaleString()}
            Icon={Users}
            trend={analytics?.totalStudents?.trend}
            sub='vs last month'
          />
          <V2KpiCard
            label='Active CHWs'
            value={(analytics?.activeStudents?.value ?? 0).toLocaleString()}
            Icon={TrendingUp}
            accent='text-emerald-600 dark:text-emerald-400'
            sub={`${analytics?.activeStudentPercentage ?? 0}% of total`}
          />
          <V2KpiCard
            label='Avg study time'
            value={`${(analytics?.avgStudyTime?.value ?? 0).toFixed(1)}h`}
            Icon={Clock}
            accent='text-purple-600 dark:text-purple-400'
            trend={analytics?.avgStudyTime?.trend}
            sub='vs last month'
          />
          <V2KpiCard
            label='Completion rate'
            value={`${(analytics?.completionRate?.value ?? 0).toFixed(1)}%`}
            Icon={CheckCircle}
            accent='text-amber-500 dark:text-amber-400'
            trend={analytics?.completionRate?.trend}
            sub='vs last month'
          />
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <div className={V2_CARD_SHELL_PADDED}>
          <h3 className={`${V2_SECTION_TITLE} mb-3`}>Engagement trend</h3>
          {trends.length === 0 ? (
            <Empty Icon={TrendingUp} text='No engagement data yet' />
          ) : (
            <TrendLineChart data={trends} xKey='date' yKey='activity' label='Activity' />
          )}
        </div>

        <div className={V2_CARD_SHELL_PADDED}>
          <h3 className={`${V2_SECTION_TITLE} mb-3`}>Score distribution</h3>
          {!analytics?.performanceDistribution ? (
            <Empty Icon={CheckCircle} text='No score data yet' />
          ) : (
            <div className='space-y-3'>
              {Object.entries(analytics.performanceDistribution).map(([key, item]) => (
                <div key={key}>
                  <div className='flex items-center justify-between mb-1'>
                    <span className={`text-xs font-semibold capitalize ${V2_STRONG}`}>
                      {key} <span className={`font-normal ${V2_MUTED}`}>({item.range})</span>
                    </span>
                    <span className={`text-xs tabular-nums ${V2_MUTED}`}>
                      {item.count.toLocaleString()} · {item.percentage}%
                    </span>
                  </div>
                  <div className='w-full bg-[#E8EEF6] dark:bg-slate-700 rounded-full h-1.5'>
                    <div
                      className={`${BAND_COLORS[key] ?? "bg-[#3363AD]"} h-1.5 rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <div className={V2_CARD_SHELL_PADDED}>
          <h3 className={`${V2_SECTION_TITLE} mb-3 flex items-center gap-2`}>
            <Award className='w-4 h-4 text-[#3363AD] dark:text-blue-300' />
            Top performers
          </h3>
          {(analytics?.topPerformers ?? []).length === 0 ? (
            <Empty Icon={Award} text='No top performers yet' />
          ) : (
            <div className='space-y-1'>
              {analytics!.topPerformers.slice(0, 5).map((chw, index) => (
                <button
                  key={chw.id}
                  type='button'
                  onClick={() => openChw(chw.id)}
                  className='w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-colors'
                >
                  <span className='w-7 h-7 shrink-0 rounded-full bg-[#3363AD] text-white text-xs font-bold flex items-center justify-center'>
                    {index + 1}
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className={`block text-xs font-bold truncate ${V2_STRONG}`}>{chw.name}</span>
                    <span className={`block text-[11px] ${V2_MUTED}`}>
                      {chw.completedCourses} completed · avg {chw.avgScore.toFixed(1)}% · {chw.certificates} certificates
                    </span>
                    <span className='block text-[11px] text-[#3363AD] dark:text-blue-300'>
                      {[chw.district, chw.sector].filter(Boolean).join(", ")}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={V2_CARD_SHELL_PADDED}>
          <h3 className={`${V2_SECTION_TITLE} mb-3 flex items-center gap-2`}>
            <BookOpen className='w-4 h-4 text-[#3363AD] dark:text-blue-300' />
            Most active (last 30 days)
          </h3>
          {(analytics?.mostActiveLearners ?? []).length === 0 ? (
            <Empty Icon={BookOpen} text='No recent learner activity' />
          ) : (
            <div className='space-y-1'>
              {analytics!.mostActiveLearners.slice(0, 5).map((chw) => (
                <button
                  key={chw.id}
                  type='button'
                  onClick={() => openChw(chw.id)}
                  className='w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-colors'
                >
                  <span className='min-w-0 flex-1'>
                    <span className={`block text-xs font-bold truncate ${V2_STRONG}`}>{chw.name}</span>
                    <span className={`block text-[11px] ${V2_MUTED}`}>
                      {chw.studyHours.toFixed(1)}h study · {chw.activeCourses} active courses
                    </span>
                    <span className='block text-[11px] text-[#3363AD] dark:text-blue-300'>
                      {[chw.district, chw.sector].filter(Boolean).join(", ")}
                    </span>
                  </span>
                  <span className={`text-[11px] shrink-0 ${V2_MUTED}`}>{formatLastActive(chw.lastActive)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`${V2_CARD_SHELL} overflow-hidden`}>
        <div className='px-4 py-3 flex items-center justify-between gap-3'>
          <h3 className={V2_SECTION_TITLE}>Recent activity (last 24 hours)</h3>
          {analytics && (
            <span className={`text-[11px] ${V2_MUTED}`}>
              {analytics.averageCoursesPerStudent} courses per CHW on average · {analytics.activeStudentPercentage}% active
            </span>
          )}
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className={V2_TABLE_HEAD}>
              <tr>
                <th className='text-left px-4 py-2.5'>CHW</th>
                <th className='text-left px-3 py-2.5'>Course</th>
                <th className='text-left px-3 py-2.5'>Progress</th>
                <th className='text-left px-3 py-2.5'>Last activity</th>
                <th className='text-left px-3 py-2.5'>Status</th>
                <th className='text-left px-4 py-2.5'>Location</th>
              </tr>
            </thead>
            <tbody className={V2_TABLE_BODY}>
              {(analytics?.recentActivity ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-4 py-8 text-center text-xs ${V2_MUTED}`}>
                    {isLoading ? "Loading…" : "No activity in the last 24 hours"}
                  </td>
                </tr>
              ) : (
                analytics!.recentActivity.slice(0, 10).map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => openChw(item.studentId)}
                    className={`${V2_TABLE_ROW} ${item.studentId ? "cursor-pointer" : ""}`}
                  >
                    <td className={`px-4 py-2.5 font-semibold ${V2_STRONG}`}>{item.studentName}</td>
                    <td className={`px-3 py-2.5 max-w-xs truncate ${V2_MUTED}`} title={item.courseName}>
                      {item.courseName}
                    </td>
                    <td className='px-3 py-2.5'>
                      <div className='flex items-center gap-2'>
                        <div className='w-20 bg-[#E8EEF6] dark:bg-slate-700 rounded-full h-1.5'>
                          <div className='bg-[#3363AD] h-1.5 rounded-full' style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className={`text-[11px] tabular-nums ${V2_MUTED}`}>{item.progress}%</span>
                      </div>
                    </td>
                    <td className={`px-3 py-2.5 text-xs ${V2_MUTED}`}>{formatLastActive(item.lastActivity)}</td>
                    <td className='px-3 py-2.5'>
                      <span className={`${V2_PILL} ${V2_PILL_BLUE}`}>{item.status}</span>
                    </td>
                    <td className={`px-4 py-2.5 text-xs ${V2_MUTED}`}>
                      {[item.district, item.sector].filter(Boolean).join(", ")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default StudentAnalytics;
