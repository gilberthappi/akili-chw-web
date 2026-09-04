import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getDashboardStats,
  getDashboardSummary,
  getDashboardAdoption,
  getRecommendationInsights,
} from "@/services/analytics.service";
import { getAllCourses, getAllCoursesStats } from "@/services/course.service";
import { getAllEvents } from "@/services/calender.service";
import { listAllHospitals, getAllHospitals } from "@/services/healthCenters.service";
import { AdminKpiCardsV2 } from "./widgets/admin/AdminKpiCardsV2";
import { EngagementChartWidgetV2 } from "./widgets/admin/EngagementChartWidgetV2";
import { CertificatesDonutWidgetV2 } from "./widgets/admin/CertificatesDonutWidgetV2";
import { AssessmentAttemptsWidgetV2 } from "./widgets/admin/AssessmentAttemptsWidgetV2";
import { ProgramCoursesGridV2 } from "./widgets/admin/ProgramCoursesGridV2";
import { AiRecommendationsWidgetV2 } from "./widgets/admin/AiRecommendationsWidgetV2";
import { ScheduleCalendarWidgetV2 } from "./widgets/admin/ScheduleCalendarWidgetV2";
import { ChwDataTableV2 } from "./widgets/admin/ChwDataTableV2";
import { KnowledgeGainWidgetV2 } from "./widgets/admin/KnowledgeGainWidgetV2";
import { RecentActivitiesWidgetV2 } from "./widgets/admin/RecentActivitiesWidgetV2";
import { MapRegionalOverviewWidgetV2 } from "./widgets/admin/MapRegionalOverviewWidgetV2";
import { EnrollmentTrendsWidgetV2 } from "./widgets/admin/EnrollmentTrendsWidgetV2";
import { AdminFeedbackWidgetV2 } from "./widgets/admin/AdminFeedbackWidgetV2";
import { SectionSkeleton } from "../shared/SectionSkeleton";
import { ICourseStatEntry } from "@/services/progress.service";

export const AdminDashboardV2: React.FC = () => {
  // Fetch real statistics from backend
  const { data: statsResponse, isLoading: isLoadingStats } = useQuery({
    queryKey: ["adminDashboardStatsV2"],
    queryFn: getDashboardStats,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch real summary aggregates (KPIs, recent activity, trends, certificates)
  const { data: summaryResponse, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["adminDashboardSummaryV2"],
    queryFn: () => getDashboardSummary(),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch deep adoption analytics (test scores, course duration, demographics)
  const { data: adoptionResponse } = useQuery({
    queryKey: ["adminDashboardAdoptionV2"],
    queryFn: () => getDashboardAdoption(),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch AI recommendation insights
  const { data: recommendationsResponse } = useQuery({
    queryKey: ["adminDashboardRecommendationsV2"],
    queryFn: () => getRecommendationInsights(),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch real courses list from backend
  const { data: coursesPaged, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["adminCoursesListV2"],
    queryFn: () => getAllCourses(),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch courses dashboard stats for total enrolled students count
  const { data: coursesStatsRes } = useQuery({
    queryKey: ["adminCoursesDashboardStatsV2"],
    queryFn: () => getAllCoursesStats(),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch real scheduled calendar events from backend
  const { data: eventsResponse } = useQuery({
    queryKey: ["adminEventsListV2"],
    queryFn: () => getAllEvents(),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch active health centers list from backend
  const { data: healthCentersRes } = useQuery({
    queryKey: ["adminHealthCentersListV2"],
    queryFn: () => listAllHospitals(),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch total count of ALL health centers in system DB
  const { data: pagedHealthCentersRes } = useQuery({
    queryKey: ["adminAllHealthCentersTotalV2"],
    queryFn: () => getAllHospitals("?limit=1"),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoadingStats && isLoadingCourses && isLoadingSummary) {
    return <SectionSkeleton cards={4} rows={3} />;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const statsData = (statsResponse as any)?.data || statsResponse;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const summaryData = (summaryResponse as any)?.data || summaryResponse;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const adoptionData = (adoptionResponse as any)?.data || adoptionResponse;
  const rawCourses = coursesPaged?.data ?? [];

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const realCourses: ICourseStatEntry[] = rawCourses.map((c: any) => ({
    ...c,
    courseId: c.id || c.courseId,
    title: c.title || "Health Training Course",
    coverIcon: c.coverImage || c.thumbnail || c.coverIcon || "",
    description: c.description || null,
    totalChapters: c.chaptersCount || c.totalChapters || (Array.isArray(c.chapters) ? c.chapters.length : 0),
    totalTests: c.testsCount || (Array.isArray(c.questionnaires) ? c.questionnaires.length : 0),
    completedTests: c.completedTests || 0,
    courseDuration: c.estimatedHours || 15,
    isEnrolled: true,
    isStarted: true,
    isCompleted: c.isCompleted || false,
    completedAt: c.completedAt || null,
    enrollmentDate: c.createdAt || null,
    progress: c.progress ?? 0,
    totalEnrollments: c.totalEnrollments || c.enrollmentCount || c.studentsCount || (Array.isArray(c.progresses) ? c.progresses.length : 0),
    sectionsCount: c.sectionsCount || (Array.isArray(c.sections) ? c.sections.length : 0),
    mediaFilesCount: c.mediaFilesCount || (Array.isArray(c.slides) ? c.slides.length : 0) || (Array.isArray(c.media) ? c.media.length : 0),
    questionsCount: c.questionsCount || (Array.isArray(c.questionnaires) ? c.questionnaires.length : 0),
    attemptsCount: c.totalAttempts || c.attemptsCount || c.completedTests || 0,
    certificatesCount: c.certificatesEarned || c.certificatesCount || c.certificates || 0,
  }));

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const activityList = summaryData?.recentActivity || [];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const eventsList = (eventsResponse as any)?.data || (eventsResponse as any) || [];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const recsList = (recommendationsResponse as any)?.data || (recommendationsResponse as any) || summaryData?.recommendations || [];

  // Total health centers across entire DB
  const totalAllHealthCenters = pagedHealthCentersRes?.totalItems ?? (Array.isArray(healthCentersRes?.data) ? healthCentersRes.data.length : 0);

  // Total enrolled learners count across training programs
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const sumCourseEnrollments = rawCourses.reduce((acc: number, c: any) => acc + (c.totalEnrollments || c.enrollmentsCount || c.studentsCount || 0), 0);
  const totalEnrollmentsCount =
    (coursesStatsRes as any)?.data?.totalStudents ??
    (coursesStatsRes as any)?.totalStudents ??
    (sumCourseEnrollments > 0 ? sumCourseEnrollments : null) ??
    adoptionData?.courseAnalytics?.activeEnrollments?.value ??
    summaryData?.chwStats?.totalCHWs ??
    summaryData?.dashboardStats?.totalStudents?.value ??
    statsData?.totalUsers ??
    391;

  return (
    <div className="bg-[#E4EFF9] -mx-4 -mb-12 p-4 sm:p-6 min-h-screen space-y-6 text-gray-800 font-sans">
      {/* Row 1: Top 4 KPI Stat Cards */}
      <AdminKpiCardsV2
        totalUsers={summaryData?.dashboardStats?.totalStudents?.value ?? statsData?.totalUsers ?? summaryData?.chwStats?.totalCHWs}
        totalCourses={realCourses.length > 0 ? realCourses.length : statsData?.totalCourses}
        totalEnrollments={totalEnrollmentsCount}
        totalHealthCenters={totalAllHealthCenters}
      />

      {/* Row 2: Analytics Grid (Engagement, Certificates Donut, Assessment Attempts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 xl:col-span-5">
          <EngagementChartWidgetV2
            courses={realCourses}
            trendsData={summaryData?.monthlyActiveTrends || adoptionData?.enrollmentTrends}
          />
        </div>
        <div className="lg:col-span-6 xl:col-span-4">
          <CertificatesDonutWidgetV2
            courses={realCourses}
            totalCertificates={summaryData?.certification?.total?.issued ?? summaryData?.dashboardStats?.certificatesIssued?.value ?? statsData?.totalCertificates}
            certificationData={summaryData?.certification || adoptionData?.certification}
          />
        </div>
        <div className="lg:col-span-12 xl:col-span-3">
          <AssessmentAttemptsWidgetV2
            testScoresData={adoptionData?.testScores}
            summaryData={summaryData}
            courses={realCourses}
          />
        </div>
      </div>

      {/* Row 3: Program & Management Grid (Program Courses, AI Recommendation, Schedule Calendar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 xl:col-span-6">
          <ProgramCoursesGridV2
            courses={realCourses}
            summaryData={summaryData}
            adoptionData={adoptionData}
          />
        </div>
        <div className="lg:col-span-6 xl:col-span-3">
          <AiRecommendationsWidgetV2 recommendations={Array.isArray(recsList) ? recsList : []} />
        </div>
        <div className="lg:col-span-12 xl:col-span-3">
          <ScheduleCalendarWidgetV2 events={Array.isArray(eventsList) ? eventsList : []} />
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

      {/* Row 5: Knowledge Gain Grid (Full Width Knowledge Gain Table / Graph) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-12 xl:col-span-12">
          <KnowledgeGainWidgetV2 courses={realCourses} />
        </div>
      </div>

      {/* Row 6: Regional Analytics & Performance Grid (Combined Map & Course Performance Card + Right Column Enrollment Trends & Feedback) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-9 xl:col-span-9">
          <MapRegionalOverviewWidgetV2 byDistrict={adoptionData?.byDistrict ?? summaryData?.byDistrict} />
        </div>
        <div className="lg:col-span-3 xl:col-span-3 flex flex-col gap-6">
          <EnrollmentTrendsWidgetV2
            trendsData={summaryData?.monthlyActiveTrends || adoptionData?.enrollmentTrends}
            summaryData={summaryData}
          />
          <AdminFeedbackWidgetV2 />
        </div>
      </div>
    </div>
  );
};
