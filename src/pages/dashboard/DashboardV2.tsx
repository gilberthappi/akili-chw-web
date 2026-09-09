import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { CHWLearnerDashboardV2 } from "@/components/dashboard/v2/CHWLearnerDashboardV2";
import { CEHODashboardV2 } from "@/components/dashboard/v2/CEHODashboardV2";
import { AdminDashboardV2 } from "@/components/dashboard/v2/AdminDashboardV2";
import { RoleWorkspaceHome } from "@/components/dashboard/RoleWorkspaceHome";
import { DashboardVersionSwitcher } from "@/components/dashboard/DashboardVersionSwitcher";
import { usesRoleWorkspaceHome } from "@/utils/roles";

export const DashboardV2: React.FC = () => {
  const { user, hasRole } = useAuth();

  const roleWorkspaceHome = usesRoleWorkspaceHome(
    user?.roles as string[] | string | undefined,
  );
  const isStaffLike = hasRole(["ADMIN", "STAFF", "DEVELOPER"]);
  const isCEHO = hasRole(["CEHO"]) && !isStaffLike;
  const isLearner = hasRole(["TRAINEE", "TESTER"]) && !isStaffLike;

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

  // Admin / staff V2 — switcher lives inside AdminDashboardV2 (canvas-safe)
  if (!isCEHO && !isLearner) {
    return <AdminDashboardV2 />;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-end px-1">
        <DashboardVersionSwitcher />
      </div>
      {isCEHO ? <CEHODashboardV2 /> : <CHWLearnerDashboardV2 />}
    </div>
  );
};
