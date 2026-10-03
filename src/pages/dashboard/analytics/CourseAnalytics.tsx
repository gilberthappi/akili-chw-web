import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Award, BarChart3, BookOpen, ChevronRight, TrendingUp, Users } from "lucide-react";
import { getCourseAnalytics } from "@/services/analytics.service";
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

const Empty: React.FC<{ Icon: typeof BookOpen; text: string }> = ({ Icon, text }) => (
  <div className={`${V2_EMPTY} h-56 flex flex-col items-center justify-center`}>
    <Icon className='w-9 h-9 mb-2 text-[#C5D3E0]' />
    <p className='text-xs'>{text}</p>
  </div>
);

export const CourseAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "courses"],
    queryFn: () => getCourseAnalytics(),
  });
  const analytics = data?.data;
  const trends = analytics?.enrollmentTrends ?? [];
  const openCourse = (id: string) => id && navigate(`/courses/${id}/analysis`);

  return (
    <>
      {isLoading ? (
        <V2KpiSkeleton count={4} />
      ) : (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <V2KpiCard
            label='Total courses'
            value={analytics?.totalCourses?.value ?? 0}
            Icon={BookOpen}
            trend={analytics?.totalCourses?.trend}
            sub='vs last month'
          />
          <V2KpiCard
            label='Active enrolments'
            value={(analytics?.activeEnrollments?.value ?? 0).toLocaleString()}
            Icon={Users}
            accent='text-purple-600 dark:text-purple-400'
            trend={analytics?.activeEnrollments?.trend}
            sub='vs last month'
          />
          <V2KpiCard
            label='Avg completion rate'
            value={`${analytics?.avgCompletionRate?.value ?? 0}%`}
            Icon={TrendingUp}
            accent='text-emerald-600 dark:text-emerald-400'
            trend={analytics?.avgCompletionRate?.trend}
            sub='vs last month'
          />
          <V2KpiCard
            label='Certificates issued'
            value={(analytics?.certificatesIssued?.value ?? 0).toLocaleString()}
            Icon={Award}
            accent='text-amber-500 dark:text-amber-400'
            trend={analytics?.certificatesIssued?.trend}
            sub='vs last month'
          />
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <div className={V2_CARD_SHELL_PADDED}>
          <h3 className={`${V2_SECTION_TITLE} mb-3`}>Enrolment trend</h3>
          {trends.length === 0 ? (
            <Empty Icon={BarChart3} text='No enrolment trend data yet' />
          ) : (
            <TrendLineChart data={trends} xKey='month' yKey='enrollments' label='Enrolments' />
          )}
        </div>

        <div className={V2_CARD_SHELL_PADDED}>
          <h3 className={`${V2_SECTION_TITLE} mb-3`}>Top courses by completion</h3>
          {(analytics?.topPerformingCourses ?? []).length === 0 ? (
            <Empty Icon={BookOpen} text='No course completion data yet' />
          ) : (
            <div className='space-y-2'>
              {analytics!.topPerformingCourses.slice(0, 3).map((course) => (
                <button
                  key={course.id}
                  type='button'
                  onClick={() => openCourse(course.id)}
                  className='w-full text-left p-2 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-colors'
                >
                  <div className='flex items-center justify-between mb-1 gap-3'>
                    <span className={`text-xs font-bold truncate ${V2_STRONG}`}>{course.name}</span>
                    <span className={`text-xs font-bold tabular-nums ${V2_STRONG}`}>{course.completion}%</span>
                  </div>
                  <div className='w-full bg-[#E8EEF6] dark:bg-slate-700 rounded-full h-1.5'>
                    <div className='bg-[#3363AD] h-1.5 rounded-full' style={{ width: `${course.completion}%` }} />
                  </div>
                  <span className={`text-[11px] ${V2_MUTED}`}>{course.students.toLocaleString()} CHWs</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={`${V2_CARD_SHELL} overflow-hidden`}>
        <div className='px-4 py-3 flex items-center justify-between'>
          <h3 className={V2_SECTION_TITLE}>
            Course performance{" "}
            <span className={`text-[11px] font-semibold ${V2_MUTED}`}>
              ({(analytics?.coursePerformanceMetrics ?? []).length} courses)
            </span>
          </h3>
          <span className={`text-[11px] ${V2_MUTED}`}>Click a course for its full analysis</span>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className={V2_TABLE_HEAD}>
              <tr>
                <th className='text-left px-4 py-2.5'>Course</th>
                <th className='text-right px-3 py-2.5'>Enrolled</th>
                <th className='text-right px-3 py-2.5'>In progress</th>
                <th className='text-right px-3 py-2.5'>Completed</th>
                <th className='text-right px-3 py-2.5'>Certificates</th>
                <th className='text-right px-3 py-2.5'>Completion rate</th>
                <th className='w-8' />
              </tr>
            </thead>
            <tbody className={V2_TABLE_BODY}>
              {(analytics?.coursePerformanceMetrics ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-4 py-8 text-center text-xs ${V2_MUTED}`}>
                    {isLoading ? "Loading…" : "No course performance data yet"}
                  </td>
                </tr>
              ) : (
                analytics!.coursePerformanceMetrics.map((course) => (
                  <tr
                    key={course.id}
                    onClick={() => openCourse(course.id)}
                    className={`${V2_TABLE_ROW} cursor-pointer`}
                  >
                    <td className={`px-4 py-2.5 font-semibold ${V2_STRONG}`}>{course.name}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${V2_MUTED}`}>{course.enrolled}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${V2_MUTED}`}>{course.inProgress}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${V2_MUTED}`}>{course.completed}</td>
                    <td className={`px-3 py-2.5 text-right tabular-nums ${V2_MUTED}`}>{course.certified}</td>
                    <td className='px-3 py-2.5 text-right'>
                      {course.hasFinalTest === false ? (
                        <span className={`text-[11px] ${V2_MUTED}`}>No final test</span>
                      ) : (
                        <span className={`${V2_PILL} ${V2_PILL_BLUE}`}>{course.rate}%</span>
                      )}
                    </td>
                    <td className='pr-3'>
                      <ChevronRight className='w-4 h-4 text-[#9AA3B2]' />
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

export default CourseAnalytics;
