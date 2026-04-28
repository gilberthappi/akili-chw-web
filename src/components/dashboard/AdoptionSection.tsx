import React from "react";
import { Users, Activity, Building2, TrendingUp, Clock } from "lucide-react";
import { useAdoptionStats } from "@/hooks/useAdoptionStats";
import { useDashboardFilters } from "@/hooks/useDashboardFilters";
import { GlobalFilterBar } from "./GlobalFilterBar";
import { KpiCard } from "./shared/KpiCard";
import { DashboardSectionHeader } from "./shared/DashboardSectionHeader";
import { SectionSkeleton } from "./shared/SectionSkeleton";
import { EnrollmentTrendChart } from "./EnrollmentTrendChart";
import { CommunicationsCard } from "./CommunicationsCard";
import { TestScoreAnalyticsCard } from "./TestScoreAnalyticsCard";
import { DemographicsSection } from "./DemographicsSection";
import { RwandaDistrictMap } from "./RwandaDistrictMap";

export const AdoptionSection: React.FC = () => {
  const {
    totalChws, activeChws, registrationRate, activeRate,
    hospitals, enrollmentTrends, avgStudyTime,
    byProvince, testScores, communications, demographics,
    isLoading, error,
  } = useAdoptionStats();

  const {
    filters, setFilters,
    availableProvinces, availableDistricts, availableGenders,
    availableYears, availableMonths,
    filteredByDistrict, filteredByGender,
    filteredEnrollmentTrends, filteredCommTrend,
  } = useDashboardFilters({
    byProvince,
    demographics,
    enrollmentTrends,
    communications,
  });

  if (isLoading) return <SectionSkeleton cards={5} rows={2} />;

  return (
    <div className="space-y-5">
      <DashboardSectionHeader
        icon={<TrendingUp size={18} />}
        title="Platform Adoption"
      />

      {error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-100
          rounded-lg px-4 py-3">
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Registered (%)"
          value={`${registrationRate}%`}
          icon={<Users size={20} />}
          iconBg="bg-blue-50"
          iconColor="text-[#3363AD]"
          description={`${totalChws.toLocaleString()} / 58,567`}
        />
        <KpiCard
          title="Active This Month (%)"
          value={`${activeRate}%`}
          icon={<Activity size={20} />}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          description={`${activeChws.toLocaleString()} active`}
        />
        <KpiCard
          title="Total CHWs"
          value={totalChws.toLocaleString()}
          icon={<Users size={20} />}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
        <KpiCard
          title="Hospitals"
          value={hospitals.length}
          icon={<Building2 size={20} />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <KpiCard
          title="Avg Study Time (min)"
          value={avgStudyTime > 0 ? `${Math.round(avgStudyTime)}` : "—"}
          icon={<Clock size={20} />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          description="Per learner"
        />
      </div>

      {/* Enrollment trend (filtered) + District map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnrollmentTrendChart trends={filteredEnrollmentTrends} />
        <RwandaDistrictMap
          byDistrict={demographics?.byDistrict ?? []}
          activeDistrict={filters.district}
          onDistrictClick={(district) => setFilters({ ...filters, district })}
        />
      </div>

      {/* Communications (filtered trend) + Test scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CommunicationsCard
          data={communications}
          filteredTrend={filteredCommTrend}
        />
        <TestScoreAnalyticsCard data={testScores} />
      </div>

      {/* Demographics (filtered by district and gender) */}
      <DemographicsSection
        data={demographics}
        filteredByDistrict={filteredByDistrict}
        filteredByGender={filteredByGender}
      />
    </div>
  );
};
