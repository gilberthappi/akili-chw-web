import React from "react";
import { useLearnerDashboard } from "@/hooks/useLearnerDashboard";
import { ProfileCardV2 } from "./widgets/ProfileCardV2";
import { RecentCoursesWidgetV2 } from "./widgets/RecentCoursesWidgetV2";
import { AwardCertificateWidgetV2 } from "./widgets/AwardCertificateWidgetV2";
import { LearningActivityV2 } from "./widgets/LearningActivityV2";
import { PerformanceMeterV2 } from "./widgets/PerformanceMeterV2";
import { EnrolledCoursesTableV2 } from "./widgets/EnrolledCoursesTableV2";
import { SectionSkeleton } from "../shared/SectionSkeleton";

export const CHWLearnerDashboardV2: React.FC = () => {
  const {
    studentStats,
    certificates,
    totalCertificates,
    isLoading,
    error,
  } = useLearnerDashboard();

  if (isLoading) {
    return <SectionSkeleton cards={4} rows={3} />;
  }

  const courses = studentStats?.courses ?? [];
  const completedCoursesCount =
    studentStats?.summary?.completedCourses ??
    courses.filter((c) => c.isCompleted).length;
  const enrolledCoursesCount =
    studentStats?.summary?.enrolledCourses ?? courses.length;

  // Calculate real average progress/score across enrolled courses
  const avgScore =
    courses.length > 0
      ? Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / courses.length)
      : 0;

  return (
    <div className="bg-[#E4EFF9] -mx-4 -mb-12 p-4 sm:p-6 min-h-screen space-y-6 text-gray-800 font-sans">
      {error && (
        <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Main Container Grid: Left Sidebar Column & Right Main Content Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar Column (Profile, Recent Courses, Award & Certificate) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <ProfileCardV2 />
          <RecentCoursesWidgetV2 courses={courses} />
          <AwardCertificateWidgetV2 certificates={certificates} />
        </div>

        {/* Right Main Content Column */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Top Row: Activity Chart & Performance Meter Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LearningActivityV2 courses={courses} />
            <PerformanceMeterV2
              score={avgScore}
              enrolledCoursesCount={enrolledCoursesCount}
              completedCoursesCount={completedCoursesCount}
              certificatesCount={totalCertificates}
            />
          </div>

          {/* Bottom Row: Full-Width Enrolled Courses Table */}
          <div>
            <EnrolledCoursesTableV2 courses={courses} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};
