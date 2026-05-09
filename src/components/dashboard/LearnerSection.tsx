import React from "react";
import { GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLearnerDashboard } from "@/hooks/useLearnerDashboard";
import { DashboardSectionHeader } from "./shared/DashboardSectionHeader";
import { LearnerStatsRow } from "./LearnerStatsRow";
import { MyCertificatesList } from "./MyCertificatesList";

export const LearnerSection: React.FC = () => {
  const navigate = useNavigate();
  const {
    studentStats,
    certificates,
    totalCertificates,
    isLoading,
    error,
  } = useLearnerDashboard();

  return (
    <div className="space-y-6">
      <DashboardSectionHeader
        icon={<GraduationCap size={18} />}
        title="My Learning"
        action={{ label: "View all", onClick: () => navigate("/my-learning") }}
      />

      {error && (
        <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Stats row */}
      <LearnerStatsRow
        summary={studentStats?.summary ?? null}
        totalCertificates={totalCertificates}
        isLoading={isLoading}
      />

      {/* Certificates — full width since no course list for TRAINEE on dashboard */}
      <MyCertificatesList
        certificates={certificates}
        isLoading={isLoading}
      />

      {/* CTA card pointing to the courses page */}
      {!isLoading && (
        <div
          className="rounded-xl border border-dashed border-[#3363AD]/30 bg-[#3363AD]/5 p-5
            flex items-center justify-between cursor-pointer
            hover:bg-[#3363AD]/10 transition-colors"
          onClick={() => navigate("/my-learning")}
        >
          <div>
            <p className="text-sm font-semibold text-[#3363AD]">Continue Learning</p>
            <p className="text-xs text-gray-500 mt-0.5">
              View your courses and continue where you left off
            </p>
          </div>
          <GraduationCap size={18} className="text-[#3363AD] shrink-0" />
        </div>
      )}
    </div>
  );
};
