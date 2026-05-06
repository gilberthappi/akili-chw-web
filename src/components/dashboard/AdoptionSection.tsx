import React, { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAdoptionStats } from "@/hooks/useAdoptionStats";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { GlobalFilterBar } from "./GlobalFilterBar";
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

export const AdoptionSection: React.FC = () => {
  const {
    hospitals,
    enrollmentTrends,
    byProvince,
    courseAnalytics,
    testScores,
    communications,
    demographics,
    chwStats,
    courseDuration,
    recentActivity,
    isLoading,
    error,
  } = useAdoptionStats();

  const {
    filters,
    setFilters,
    availableProvinces,
    availableDistricts,
    availableGenders,
    availableYears,
    availableMonths,
    filteredByDistrict,
    filteredByGender,
    filteredEnrollmentTrends,
    filteredCommTrend,
  } = useDashboardFilters({
    byProvince,
    demographics,
    enrollmentTrends,
    communications,
  });

  const handleDistrictClick = useCallback(
    (district: string) => setFilters({ ...filters, district }),
    [filters, setFilters],
  );

  // Portal the filters to the top-level header
  const filterPortal = typeof document !== 'undefined' 
    ? document.getElementById('global-filters-container')
    : null;

  if (isLoading) return <SectionSkeleton cards={5} rows={2} />;

  return (
    <>
      {/* Render filters in the top header via portal */}
      {filterPortal && createPortal(
        <GlobalFilterBar
          filters={filters}
          onChange={setFilters}
          provinces={availableProvinces}
          districts={availableDistricts}
          genders={availableGenders}
          years={availableYears}
          months={availableMonths}
        />,
        filterPortal
      )}

      <div className='space-y-5'>
        {error && (
          <div
            className='text-sm text-red-500 bg-red-50 border border-red-100
            rounded-lg px-4 py-3'
          >
            {error}
          </div>
        )}

      {/* KPI row */}
      <CHWStatsCards data={chwStats} isLoading={isLoading} />

      {/* Course Charts + Recent Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <CourseChartsCard
          courseAnalytics={courseAnalytics}
          testScores={testScores}
          courseDuration={courseDuration}
        />
        <RecentActivityCard data={recentActivity} isLoading={isLoading} />
      </div>

      {/* Course engagement table + Assessment overview */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <CourseEngagementTable
          courseAnalytics={courseAnalytics}
          testScores={testScores}
        />
        <AssessmentOverviewCard chwStats={chwStats} testScores={testScores} />
      </div>

      {/* District map */}
      <RwandaDistrictMap
        byDistrict={demographics?.byDistrict ?? []}
        hospitals={hospitals}
        activeDistrict={filters.district}
        onDistrictClick={handleDistrictClick}
      />

      {/* Communications (filtered trend) + Test scores */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <CommunicationsCard
          data={communications}
          filteredTrend={filteredCommTrend}
        />
        <TestScoreAnalyticsCard data={testScores} />
      </div>

      {/* Demographics (filtered by district and gender) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DemographicsSection
          data={demographics}
          filteredByDistrict={filteredByDistrict}
          filteredByGender={filteredByGender}
        />
        <EnrollmentTrendChart trends={filteredEnrollmentTrends} />
      </div>
    </div>
    </>
  );
};
