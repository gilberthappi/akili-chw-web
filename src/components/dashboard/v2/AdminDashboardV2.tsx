import React from "react";
import { AdminKpiCardsV2 } from "./widgets/admin/AdminKpiCardsV2";
import { EngagementChartWidgetV2 } from "./widgets/admin/EngagementChartWidgetV2";
import { CertificatesDonutWidgetV2 } from "./widgets/admin/CertificatesDonutWidgetV2";
import { AssessmentAttemptsWidgetV2 } from "./widgets/admin/AssessmentAttemptsWidgetV2";
import { AiRecommendationsWidgetV2 } from "./widgets/admin/AiRecommendationsWidgetV2";
import { ChwDataTableV2 } from "./widgets/admin/ChwDataTableV2";
import { RecentActivitiesWidgetV2 } from "./widgets/admin/RecentActivitiesWidgetV2";
import { MapRegionalOverviewWidgetV2 } from "./widgets/admin/MapRegionalOverviewWidgetV2";
import { EnrollmentTrendsWidgetV2 } from "./widgets/admin/EnrollmentTrendsWidgetV2";
import { CourseRatingsWidgetV2 } from "./widgets/admin/CourseRatingsWidgetV2";
import { StudyTimeOverviewWidgetV2 } from "./widgets/admin/StudyTimeOverviewWidgetV2";
import { DashboardVersionSwitcher } from "@/components/dashboard/DashboardVersionSwitcher";
import { DashboardGlobalFilters } from "@/components/dashboard/DashboardGlobalFilters";
import { useAuth } from "@/hooks/useAuth";
import { useAdminDashboardV2Kpis } from "@/hooks/useAdminDashboardV2Kpis";
import {
  AdminDashboardFiltersProvider,
  useAdminDashboardFilters,
} from "./AdminDashboardFiltersContext";

const AdminDashboardV2Board: React.FC = () => {
  const { user } = useAuth();
  const { filters, setFilters } = useAdminDashboardFilters();
  const { cards, isLoading, isFetching } = useAdminDashboardV2Kpis(filters);
  const displayName = user?.fullNames?.trim() || "Admin";

  return (
    <div className="relative bg-white -mx-4 -mt-4 -mb-12 px-3 sm:px-4 lg:px-5 pt-3 sm:pt-4 lg:pt-5 pb-8 min-h-[calc(100vh-4rem)] space-y-4 text-gray-800 font-sans">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">
            Welcome, {displayName}!
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Here&apos;s what&apos;s happening on the platform
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <DashboardGlobalFilters filters={filters} onChange={setFilters} />
          {isFetching && !isLoading && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className="h-3 w-3 rounded-full border-2 border-gray-300 border-t-[#3363AD] animate-spin" />
              Updating…
            </span>
          )}
          <DashboardVersionSwitcher onCanvas />
        </div>
      </div>

      <AdminKpiCardsV2 cards={cards} isLoading={isLoading} />

      {/* Engagement (2 KPIs wide) | Certificates | Assessment | AI Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 xl:items-stretch h-[400px]">
        <div className="min-w-0 min-h-0 h-full md:col-span-2 xl:col-span-2">
          <EngagementChartWidgetV2 />
        </div>
        <div className="min-w-0 min-h-0 h-full">
          <CertificatesDonutWidgetV2 />
        </div>
        <div className="min-w-0 min-h-0 h-full flex">
          <AssessmentAttemptsWidgetV2 />
        </div>
        <div className="min-w-0 min-h-0 h-full flex">
          <AiRecommendationsWidgetV2 />
        </div>
      </div>

      {/* Section 4: CHW Demographics */}
<div className="min-h-[380px] h-[400px]">
          <ChwDataTableV2 />
      </div>

      {/* Section 5:Enrollment trends (2/5) +recent  activities */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 xl:items-stretch min-h-[340px] h-[360px]">
        <div className="min-w-0 h-full min-h-0">
        <EnrollmentTrendsWidgetV2 />
        </div>
        <div className="min-w-0 h-full min-h-0">
        <RecentActivitiesWidgetV2 />
        </div>
      </div>

      {/* Section 5b: Map | Course ratings */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_300px] gap-4 xl:items-stretch min-h-[480px] h-[520px]">
        <div className="min-w-0 h-full min-h-0">
          <MapRegionalOverviewWidgetV2 />
        </div>
        <div className="min-w-0 h-full min-h-0">
          <CourseRatingsWidgetV2 />
        </div>
      </div>

      <StudyTimeOverviewWidgetV2 />
    </div>
  );
};

export const AdminDashboardV2: React.FC = () => (
  <AdminDashboardFiltersProvider>
    <AdminDashboardV2Board />
  </AdminDashboardFiltersProvider>
);
