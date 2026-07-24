import React, { useCallback } from "react";
import { IDashboardFilters } from "@/types";
import { useAdoptionStats } from "@/hooks/useAdoptionStats";
import { useDashboardHospitals } from "@/hooks/useDashboardLazyStats";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { useInView } from "@/hooks/useInView";
import { useIdleReady } from "@/hooks/useIdleReady";
import { SectionSkeleton } from "./shared/SectionSkeleton";
import { EnrollmentTrendChart } from "./EnrollmentTrendChart";
import { CommunicationsCard } from "./CommunicationsCard";
import { TestScoreAnalyticsCard } from "./TestScoreAnalyticsCard";
import { CourseChartsCard } from "./CourseChartsCard";
import { RecentActivityCard } from "./RecentActivityCard";
import { CourseEngagementTable } from "./CourseEngagementTable";
import { AssessmentOverviewCard } from "./AssessmentOverviewCard";
import { DemographicsSection } from "./DemographicsSection";
import { RwandaDistrictMap } from "./RwandaDistrictMap";
import { CHWStatsCards } from "./CHWStatsCards";
import { MonthlyActiveTrendsChart } from "./MonthlyActiveTrendsChart";
import { CertificationRateCard } from "./CertificationRateCard";
import { RecommendationReviewCard } from "./RecommendationReviewCard";
import { SupervisorResponseCard } from "./SupervisorResponseCard";
import { TestScoreCard } from "./TestScoreCard";

interface AdoptionSectionProps {
  filters: IDashboardFilters;
  onFiltersChange: (f: IDashboardFilters) => void;
  /** Rendered after adoption charts and before the bottom activity/map cluster. */
  beforeMap?: React.ReactNode;
}

export const AdoptionSection: React.FC<AdoptionSectionProps> = ({
  filters,
  onFiltersChange,
  beforeMap,
}) => {
  const idleReady = useIdleReady(2500);
  const { ref: deepRef, inView: deepInView } = useInView<HTMLDivElement>({
    rootMargin: "320px 0px",
  });

  const {
    enrollmentTrends,
    courseAnalytics,
    testScores,
    demographics,
    chwStats,
    courseDuration,
    recentActivity,
    monthlyActiveTrends,
    certification,
    communications,
    avgStudyTimeByCourse,
    studentAnalytics,
    isLoading,
    isFetching,
    isDeepLoading,
    error,
  } = useAdoptionStats(filters, true, {
    deepEnabled: idleReady || deepInView,
  });

  const { ref: mapRef, inView: mapInView } = useInView<HTMLDivElement>();

  const { healthCenters, isFetching: isHospitalsFetching } = useDashboardHospitals(
    filters,
    mapInView,
  );

  const {
    filteredByDistrict,
    filteredByGender,
    filteredEnrollmentTrends,
    filteredCommTrend,
  } = useDashboardFilters(
    {
      byProvince: [],
      demographics,
      enrollmentTrends,
      communications,
      healthCenters,
    },
    filters,
    onFiltersChange,
  );

  const handleDistrictClick = useCallback(
    (district: string) => onFiltersChange({ ...filters, district }),
    [filters, onFiltersChange],
  );

  if (isLoading && !chwStats) return <SectionSkeleton cards={5} rows={2} />;

  const sectionBusy = isFetching || isHospitalsFetching;

  return (
    <div
      className={`space-y-5 transition-opacity duration-200 ${
        sectionBusy ? "opacity-60 pointer-events-none" : "opacity-100"
      }`}
    >
      {error && (
        <div
          className='text-sm text-red-500 bg-red-50 border border-red-100
            rounded-lg px-4 py-3'
        >
          {error}
        </div>
      )}

      {/* 1. Snapshot KPIs */}
      <CHWStatsCards data={chwStats} isLoading={isLoading} />

      {/* 2. Activity & growth trends */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <MonthlyActiveTrendsChart data={monthlyActiveTrends} />
        <EnrollmentTrendChart trends={filteredEnrollmentTrends} />
      </div>

      <div ref={deepRef} className='space-y-5'>
        {isDeepLoading && !courseAnalytics && (
          <SectionSkeleton cards={2} rows={2} />
        )}

        {/* 3. Learning & course performance */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <CourseEngagementTable
            courseAnalytics={courseAnalytics}
            testScores={testScores}
            avgStudyTimeByCourse={avgStudyTimeByCourse}
          />
          <CourseChartsCard
            courseAnalytics={courseAnalytics}
            testScores={testScores}
            courseDuration={courseDuration}
          />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch'>
          <TestScoreAnalyticsCard data={testScores} />
          <AssessmentOverviewCard chwStats={chwStats} testScores={testScores} />
        </div>

        {/* 4. Performance + certification outcomes */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch'>
          <TestScoreCard studentAnalytics={studentAnalytics} />
          <CertificationRateCard data={certification} filters={filters} />
        </div>

        {/* 5. Who learners are */}
        <DemographicsSection
          data={demographics}
          filteredByDistrict={filteredByDistrict}
          filteredByGender={filteredByGender}
          filters={filters}
        />
      </div>

      {/* Training deep-dive — before bottom cluster */}
      {beforeMap}

      {/* 6. Communications + supervisor */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch'>
        <CommunicationsCard
          data={communications}
          filteredTrend={filteredCommTrend}
          isLoading={isDeepLoading && !communications}
        />
        <SupervisorResponseCard filters={filters} />
      </div>

      {/* 7. Recent pulse + recommendations */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch'>
        <RecentActivityCard data={recentActivity} isLoading={isLoading} />
        <RecommendationReviewCard filters={filters} />
      </div>

      {/* 8. Geography last */}
      <div ref={mapRef}>
        <RwandaDistrictMap
          byDistrict={demographics?.byDistrict ?? []}
          healthCenters={healthCenters}
          activeDistrict={filters.district}
          healthCenterId={filters.healthCenterId}
          province={filters.province}
          onDistrictClick={handleDistrictClick}
        />
      </div>
    </div>
  );
};
