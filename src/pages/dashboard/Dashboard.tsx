import React from "react";
import { Phase3Section } from "@/components/dashboard/Phase3Section";
import { LearnerSection } from "@/components/dashboard/LearnerSection";
import { AdoptionSection } from "@/components/dashboard/AdoptionSection";
import { DeveloperSection } from "@/components/dashboard/DeveloperSection";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const userRoles: string[] = user?.roles
    ? Array.isArray(user.roles)
      ? (user.roles as string[])
      : [user.roles as string]
    : [];

  const needsAnalytics = userRoles.some((r) =>
    ["ADMIN", "TRAINER", "STAFF", "DEVELOPER"].includes(r)
  );

  const { dashboardStats, courseAnalytics, studentAnalytics, isLoading } =
    useDashboardStats({ enabled: needsAnalytics });

  const is = (role: string) => userRoles.includes(role);
  const isAnyOf = (...roles: string[]) => roles.some((r) => userRoles.includes(r));

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3363AD]" />
      </div>
    );
  }

  const isLearner = isAnyOf("TRAINEE", "SUPERVISOR");
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
    <div className="space-y-8 p-1">
      {/* ── Welcome header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isLearner ? `${greeting}, ${user.fullNames}!` : `Welcome, ${user.fullNames}!`}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isLearner
              ? learnerSubtitle
              : "Here's what's happening on the platform"}
          </p>
        </div>

        {/* Filters will be injected here by AdoptionSection */}
        <div id="global-filters-container" className="flex-shrink-0" />
      </div>

      {isAnyOf("ADMIN", "STAFF", "DEVELOPER") && (
        <AdoptionSection />
      )}

      {isAnyOf("ADMIN", "TRAINER", "STAFF", "DEVELOPER") && (
        <Phase3Section
          dashboardStats={dashboardStats}
          courseAnalytics={courseAnalytics}
          studentAnalytics={studentAnalytics}
          isLoading={isLoading}
          isSupervisorView={false}
          hideKpis={isAnyOf("ADMIN", "DEVELOPER")}
        />
      )}

      {is("DEVELOPER") && <DeveloperSection />}

      {isAnyOf("TRAINEE", "SUPERVISOR") && <LearnerSection />}
    </div>
  );
};
