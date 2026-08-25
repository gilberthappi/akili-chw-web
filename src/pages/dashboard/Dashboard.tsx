import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { Phase3Section } from "@/components/dashboard/Phase3Section";
import { LearnerSection } from "@/components/dashboard/LearnerSection";
import { AdoptionSection } from "@/components/dashboard/AdoptionSection";
import { DeveloperSection } from "@/components/dashboard/DeveloperSection";
import { CEHOSection } from "@/components/dashboard/CEHOSection";
import { DashboardGlobalFilters } from "@/components/dashboard/DashboardGlobalFilters";
import { useAuth } from "@/hooks/useAuth";
import { IDashboardFilters } from "@/types";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAdoptionStats } from "@/hooks/useAdoptionStats";
import { useIdleReady } from "@/hooks/useIdleReady";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<IDashboardFilters>(DEFAULT_DASHBOARD_FILTERS);
  const idleReady = useIdleReady(2500);

  const userRoles: string[] = user?.roles
    ? Array.isArray(user.roles)
      ? (user.roles as string[])
      : [user.roles as string]
    : [];

  const needsAnalytics = userRoles.some((r) =>
    ["ADMIN", "TRAINER", "STAFF", "DEVELOPER"].includes(r),
  );
  const needsAdoption = userRoles.some((r) =>
    ["ADMIN", "STAFF", "DEVELOPER"].includes(r),
  );

  // TRAINER (no adoption section): fetch course/student here after idle.
  // ADMIN/STAFF/DEVELOPER: course/student come from useAdoptionStats (no duplicate).
  const {
    dashboardStats,
    courseAnalytics: statsCourseAnalytics,
    studentAnalytics: statsStudentAnalytics,
    isLoading: isStatsLoading,
    isFetching: isStatsFetching,
  } = useDashboardStats({
    enabled: needsAnalytics,
    filters,
    includeCourseStudent: !needsAdoption && idleReady,
  });

  const {
    courseAnalytics: adoptionCourseAnalytics,
    studentAnalytics: adoptionStudentAnalytics,
    isLoading: isAdoptionLoading,
    isFetching: isAdoptionFetching,
  } = useAdoptionStats(filters, needsAdoption, {
    deepEnabled: idleReady,
  });

  const courseAnalytics = needsAdoption ? adoptionCourseAnalytics : statsCourseAnalytics;
  const studentAnalytics = needsAdoption ? adoptionStudentAnalytics : statsStudentAnalytics;
  const isLoading = needsAdoption
    ? isAdoptionLoading && isStatsLoading
    : isStatsLoading;
  const isRefetching = isStatsFetching || isAdoptionFetching;

  const is = (role: string) => userRoles.includes(role);
  const isAnyOf = (...roles: string[]) => roles.some((r) => userRoles.includes(r));

  if (!user) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-[#3363AD]' />
      </div>
    );
  }

  const isLearner = isAnyOf("TRAINEE", "TESTER", "CEHO");
  const isCEHO = is("CEHO");
  const showAnalyticsFilters = needsAnalytics;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const learnerSubtitle =
    hour < 12
      ? "Ready to learn something new today?"
      : hour < 17
        ? "Keep up the great progress!"
        : "A great time to review what you've learned.";

  return (
    <div className='space-y-8 p-1'>
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div>
          <h1 className='text-xl font-bold text-gray-900'>
            {isLearner || isCEHO
              ? `${greeting}, ${user.fullNames}!`
              : `Welcome, ${user.fullNames}!`}
          </h1>
          <p className='text-xs text-gray-500 mt-0.5'>
            {isLearner ? learnerSubtitle : "Here's what's happening on the platform"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/v2")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#3363AD] to-[#254b85] hover:from-[#284f8a] hover:to-[#1d3b6a] text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02]"
          >
            <Sparkles size={14} className="text-amber-300 animate-pulse" />
            <span>Try New Dashboard (Beta)</span>
            <ArrowRight size={14} />
          </button>

          {showAnalyticsFilters && (
            <div className='flex items-center gap-3'>
              <DashboardGlobalFilters filters={filters} onChange={setFilters} />
              {isRefetching && (
                <span className='flex items-center gap-1.5 text-xs text-gray-400'>
                  <span className='h-3 w-3 rounded-full border-2 border-gray-300 border-t-[#3363AD] animate-spin' />
                  Updating…
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {isAnyOf("ADMIN", "STAFF", "DEVELOPER") && (
        <AdoptionSection
          filters={filters}
          onFiltersChange={setFilters}
          beforeMap={
            <Phase3Section
              dashboardStats={dashboardStats}
              courseAnalytics={courseAnalytics}
              studentAnalytics={studentAnalytics}
              isLoading={isLoading}
              isFetching={isRefetching}
              isSupervisorView={false}
              hideKpis={isAnyOf("ADMIN", "DEVELOPER")}
              hideRecommendations
              hidePerformance
              filters={filters}
            />
          }
        />
      )}

      {/* TRAINER (no adoption section): training analytics alone */}
      {is("TRAINER") && !isAnyOf("ADMIN", "STAFF", "DEVELOPER") && (
        <Phase3Section
          dashboardStats={dashboardStats}
          courseAnalytics={courseAnalytics}
          studentAnalytics={studentAnalytics}
          isLoading={isLoading}
          isFetching={isRefetching}
          isSupervisorView={false}
          hideKpis={false}
          filters={filters}
        />
      )}

      {is("DEVELOPER") && <DeveloperSection />}

      {isAnyOf("TRAINEE", "TESTER", "CEHO") && <LearnerSection />}

      {isCEHO && <CEHOSection />}
    </div>
  );
};
