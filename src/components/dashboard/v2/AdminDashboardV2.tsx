import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getRecentActivityFeed } from "@/services/analytics.service";
import { getAllCourses } from "@/services/course.service";
import { AdminKpiCardsV2 } from "./widgets/admin/AdminKpiCardsV2";
import { EngagementChartWidgetV2 } from "./widgets/admin/EngagementChartWidgetV2";
import { CertificatesDonutWidgetV2 } from "./widgets/admin/CertificatesDonutWidgetV2";
import { AssessmentAttemptsWidgetV2 } from "./widgets/admin/AssessmentAttemptsWidgetV2";
import { ProgramCoursesGridV2 } from "./widgets/admin/ProgramCoursesGridV2";
import { AiRecommendationsWidgetV2 } from "./widgets/admin/AiRecommendationsWidgetV2";
import { ScheduleCalendarWidgetV2 } from "./widgets/admin/ScheduleCalendarWidgetV2";
import { ChwDataTableV2 } from "./widgets/admin/ChwDataTableV2";
import { RecentActivitiesWidgetV2 } from "./widgets/admin/RecentActivitiesWidgetV2";
import { SectionSkeleton } from "../shared/SectionSkeleton";
import { ICourseStatEntry } from "@/services/progress.service";

export const AdminDashboardV2: React.FC = () => {
  // Fetch real statistics from backend
  const { data: statsResponse, isLoading: isLoadingStats } = useQuery({
    queryKey: ["adminDashboardStatsV2"],
    queryFn: getDashboardStats,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch real courses list from backend
  const { data: coursesPaged, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["adminCoursesListV2"],
    queryFn: () => getAllCourses(),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch real recent activity feed from backend
  const { data: activityResponse } = useQuery({
    queryKey: ["adminRecentActivityFeedV2"],
    queryFn: () => getRecentActivityFeed(),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoadingStats && isLoadingCourses) {
    return <SectionSkeleton cards={4} rows={3} />;
  }

  const statsData = statsResponse?.data || statsResponse;
  const rawCourses = coursesPaged?.data ?? [];

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const realCourses: ICourseStatEntry[] = rawCourses.map((c: any) => ({
    courseId: c.id || c.courseId,
    title: c.title || "Health Training Course",
    coverIcon: c.coverImage || c.thumbnail || c.coverIcon || "",
    description: c.description || null,
    totalChapters: c.chaptersCount || c.totalChapters || 5,
    totalTests: c.testsCount || 3,
    completedTests: 2,
    courseDuration: c.estimatedHours || 15,
    isEnrolled: true,
    isStarted: true,
    isCompleted: false,
    completedAt: null,
    enrollmentDate: c.createdAt || null,
    progress: c.progress ?? 60,
  }));

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const activityList = activityResponse?.data || (activityResponse as any) || [];

  return (
    <div className="bg-[#E4EFF9] -mx-4 -mb-12 p-4 sm:p-6 min-h-screen space-y-6 text-gray-800 font-sans">
      {/* Row 1: Top 4 KPI Stat Cards */}
      <AdminKpiCardsV2
        totalUsers={statsData?.totalUsers || 390}
        totalCourses={realCourses.length > 0 ? realCourses.length : statsData?.totalCourses || 9}
        totalEnrollments={statsData?.totalEnrollments || 390}
        totalHealthCenters={statsData?.totalHealthCenters || 390}
      />

      {/* Row 2: Analytics Grid (Engagement, Certificates Donut, Assessment Attempts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 xl:col-span-5">
          <EngagementChartWidgetV2 />
        </div>
        <div className="lg:col-span-6 xl:col-span-4">
          <CertificatesDonutWidgetV2
            totalCertificates={statsData?.totalCertificates || 2931}
          />
        </div>
        <div className="lg:col-span-12 xl:col-span-3">
          <AssessmentAttemptsWidgetV2 />
        </div>
      </div>

      {/* Row 3: Program & Management Grid (Program Courses, AI Recommendation, Schedule Calendar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 xl:col-span-6">
          <ProgramCoursesGridV2 courses={realCourses} />
        </div>
        <div className="lg:col-span-6 xl:col-span-3">
          <AiRecommendationsWidgetV2 />
        </div>
        <div className="lg:col-span-12 xl:col-span-3">
          <ScheduleCalendarWidgetV2 />
        </div>
      </div>

      {/* Row 4: Data & Operations Grid (CHW Data Table & Recent Activities) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 xl:col-span-9">
          <ChwDataTableV2 courses={realCourses} />
        </div>
        <div className="lg:col-span-4 xl:col-span-3">
          <RecentActivitiesWidgetV2 activities={Array.isArray(activityList) ? activityList : []} />
        </div>
      </div>
    </div>
  );
};
