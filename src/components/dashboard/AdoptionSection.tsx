import React, { useCallback } from "react";
import { TrendingUp } from "lucide-react";
import { useAdoptionStats } from "@/hooks/useAdoptionStats";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { GlobalFilterBar } from "./GlobalFilterBar";
import { DashboardSectionHeader } from "./shared/DashboardSectionHeader";
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

  if (isLoading) return <SectionSkeleton cards={5} rows={2} />;

  return (
    <div className='space-y-5'>
      <DashboardSectionHeader
        icon={<TrendingUp size={18} />}
        title='Platform Adoption'
      />

      {error && (
        <div
          className='text-sm text-red-500 bg-red-50 border border-red-100
          rounded-lg px-4 py-3'
        >
          {error}
        </div>
      )}

      {/* Global filter bar */}
      <GlobalFilterBar
        filters={filters}
        onChange={setFilters}
        provinces={availableProvinces}
        districts={availableDistricts}
        genders={availableGenders}
        years={availableYears}
        months={availableMonths}
      />

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
      <div className='max-w-4xl mx-auto w-full'>
        <RwandaDistrictMap
          byDistrict={demographics?.byDistrict ?? []}
          hospitals={hospitals}
          activeDistrict={filters.district}
          onDistrictClick={handleDistrictClick}
        />
      </div>

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
  );
};
