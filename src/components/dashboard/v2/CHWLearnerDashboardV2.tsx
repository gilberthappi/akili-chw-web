import React from "react";
import { useLearnerDashboard } from "@/hooks/useLearnerDashboard";
import { LearnerKpiRowV2 } from "./widgets/LearnerKpiRowV2";
import { LearningActivityV2 } from "./widgets/LearningActivityV2";
import { PerformanceMeterV2 } from "./widgets/PerformanceMeterV2";
import { CertificatesEarnedWidgetV2 } from "./widgets/CertificatesEarnedWidgetV2";
import { EnrolledCoursesTableV2 } from "./widgets/EnrolledCoursesTableV2";
import { SectionSkeleton } from "../shared/SectionSkeleton";
import { Sparkles, PlayCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CHWLearnerDashboardV2: React.FC = () => {
  const navigate = useNavigate();
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
  const completedCoursesCount = courses.filter((c) => c.isCompleted).length;
  const lastViewed = studentStats?.lastViewedLocation ?? null;

  return (
    <div className="space-y-6">
      {error && (
        <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* 1. Continue Learning Hero Bar (If active learning session exists) */}
      {lastViewed && (
        <div
          onClick={() => navigate(`/learn/${lastViewed.courseId}`)}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#3363AD] via-[#2d5899] to-[#1e3f73] p-5 shadow-sm text-white cursor-pointer group"
        >
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-xl" />
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:bg-white/30 transition-colors">
                <PlayCircle size={24} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Sparkles size={11} className="text-amber-300" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    Continue Where You Left Off
                  </span>
                </div>
                <h3 className="text-base font-bold text-white truncate max-w-xl">
                  {lastViewed.courseTitle}
                </h3>
                <p className="text-xs text-white/70 truncate">
                  {lastViewed.chapterTitle}
                </p>
              </div>
            </div>

            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all group-hover:translate-x-0.5">
              Resume Module
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Top 4 KPI Metrics Row */}
      <LearnerKpiRowV2
        enrolledCoursesCount={courses.length || 9}
        completedCoursesCount={completedCoursesCount}
        totalCertificatesCount={totalCertificates}
      />

      {/* 3. Middle Section: Activity Chart & Performance Meter Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <LearningActivityV2 />
        </div>
        <div className="lg:col-span-5">
          <PerformanceMeterV2 />
        </div>
      </div>

      {/* 4. Earned Certificates List Widget */}
      <div>
        <CertificatesEarnedWidgetV2
          certificates={certificates}
          isLoading={isLoading}
        />
      </div>

      {/* 5. Bottom Section: Full-Width Enrolled Courses Table */}
      <div>
        <EnrolledCoursesTableV2 courses={courses} isLoading={isLoading} />
      </div>
    </div>
  );
};
