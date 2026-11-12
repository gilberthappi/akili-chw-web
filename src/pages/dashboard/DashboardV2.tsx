import React from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { CHWLearnerDashboardV2 } from "@/components/dashboard/v2/CHWLearnerDashboardV2";
import { CEHODashboardHome } from "@/components/dashboard/v2/CEHODashboardHome";
import { CEHODashboardV2 } from "@/components/dashboard/v2/CEHODashboardV2";
import { AdminDashboardV2 } from "@/components/dashboard/v2/AdminDashboardV2";
import { RoleWorkspaceHome } from "@/components/dashboard/RoleWorkspaceHome";
import { DashboardVersionSwitcher } from "@/components/dashboard/DashboardVersionSwitcher";
import { resolveDepartmentStaffRole, usesRoleWorkspaceHome } from "@/utils/roles";
import { CiicAnalyticsDashboard } from "@/pages/dashboard/analytics/CiicAnalyticsDashboard";
import { V2_PAGE_CANVAS } from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import { SectionSkeleton } from "@/components/dashboard/shared/SectionSkeleton";

export const DashboardV2: React.FC = () => {
  const { user, loading, hasRole } = useAuth();
  const [searchParams] = useSearchParams();

  // Before roles resolve, never fall through to Admin — that caused a CEHO flash of admin widgets.
  if (loading || !user) {
    return (
      <div className={V2_PAGE_CANVAS}>
        <SectionSkeleton cards={4} rows={3} />
      </div>
    );
  }

  const roleWorkspaceHome = usesRoleWorkspaceHome(
    user?.roles as string[] | string | undefined,
  );
  const isStaffLike = hasRole(["ADMIN", "STAFF", "DEVELOPER"]);
  const isCEHO = hasRole(["CEHO"]) && !isStaffLike;
  const isLearner = hasRole(["TRAINEE", "TESTER"]) && !isStaffLike;

  const deptRole = resolveDepartmentStaffRole(user?.roles as string[] | string | undefined);
  if (deptRole?.startsWith("CIIC_")) {
    return <CiicAnalyticsDashboard />;
  }

  if (roleWorkspaceHome) {
    return (
      <div className="space-y-4 pb-12">
        <div className="flex justify-end">
          <DashboardVersionSwitcher />
        </div>
        <RoleWorkspaceHome />
      </div>
    );
  }

  if (isCEHO) {
    if (searchParams.get("view") === "board") return <CEHODashboardV2 />;
    return <CEHODashboardHome />;
  }

  if (isLearner) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex justify-end px-1">
          <DashboardVersionSwitcher />
        </div>
        <CHWLearnerDashboardV2 />
      </div>
    );
  }

  // Admin / staff V2 — only after we know the user is not CEHO/learner
  return <AdminDashboardV2 />;
};
