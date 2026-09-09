import React from "react";
import { AdminKpiCardsV2, SECTION1_DESIGN_DUMMY } from "./widgets/admin/AdminKpiCardsV2";
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
import { DashboardVersionSwitcher } from "@/components/dashboard/DashboardVersionSwitcher";

export const AdminDashboardV2: React.FC = () => {
  return (
    <div className="relative bg-white -mx-4 -mt-4 -mb-12 px-3 sm:px-4 lg:px-5 pt-3 sm:pt-4 lg:pt-5 pb-8 min-h-[calc(100vh-4rem)] space-y-4 text-gray-800 font-sans">
      <div className="flex justify-end -mb-1">
        <DashboardVersionSwitcher onCanvas />
      </div>

      {/*
        Shared columns: left = Eng+Cert width, right = Assessment width.
        Rows stay aligned without separate flex math drifting.
      */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_300px] gap-4 xl:items-stretch">
        <div className="min-w-0 flex flex-col gap-2">
          <AdminKpiCardsV2 cards={SECTION1_DESIGN_DUMMY} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EngagementChartWidgetV2 />
            <CertificatesDonutWidgetV2 />
          </div>
        </div>

        <div className="min-w-0 flex">
          <AssessmentAttemptsWidgetV2 />
        </div>

        {/* Same left column width as Engagement + Certificates — two separate cards */}
        <div className="min-w-0 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_240px] 2xl:grid-cols-[minmax(0,1fr)_260px] gap-4 items-stretch min-h-[380px] h-[400px]">
          <ProgramCoursesGridV2 />
          <AiRecommendationsWidgetV2 />
        </div>

        <div className="min-w-0 h-[400px] flex">
          <ScheduleCalendarWidgetV2 />
        </div>
      </div>

      {/* Section 4: CHW Demographics + Recent activities — same columns as board above */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_300px] gap-4 xl:items-stretch min-h-[360px] h-[380px]">
        <div className="min-w-0 h-full">
          <ChwDataTableV2 />
        </div>
        <div className="min-w-0 h-full">
          <RecentActivitiesWidgetV2 />
        </div>
      </div>

      {/* Section 5: Knowledge Gain (full) */}
      <KnowledgeGainWidgetV2 />

      {/* Section 5b: Map | Enrollment trends + Feedback — same board columns */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_300px] gap-4 xl:items-stretch min-h-[480px] h-[520px]">
        <div className="min-w-0 h-full min-h-0 overflow-hidden">
          <MapRegionalOverviewWidgetV2 />
        </div>
        <div className="min-w-0 h-full min-h-0 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <EnrollmentTrendsWidgetV2 />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <AdminFeedbackWidgetV2 />
          </div>
        </div>
      </div>
    </div>
  );
};
