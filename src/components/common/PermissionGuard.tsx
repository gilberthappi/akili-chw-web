import { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";
import { UserRole, UserIndustry } from "@/types";
import { AppPermission } from "@/utils/constants/permissions";

interface PermissionGuardProps {
  children: ReactNode;
  // Option A — role/industry list (legacy, still works)
  allowedRoles?: UserRole[];
  allowedIndustries?: UserIndustry[];
  requireAll?: boolean;
  // Option B — single permission key from PERMISSIONS constant
  permission?: AppPermission;
  fallback?: ReactNode;
  hideIfNoPermission?: boolean;
}

/**
 * Conditionally renders children based on the current user's role/permissions.
 *
 * Usage (role list):
 *   <PermissionGuard allowedRoles={["ADMIN", "DEVELOPER"]}>
 *
 * Usage (permission key — preferred for new code):
 *   <PermissionGuard permission={PERMISSIONS.COURSE_CREATE}>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  allowedRoles,
  allowedIndustries,
  requireAll = true,
  permission,
  fallback = null,
  hideIfNoPermission = true,
}) => {
  const { hasPermission, can } = usePermission({
    allowedRoles,
    allowedIndustries,
    requireAll,
  });

  const allowed = permission ? can(permission) : hasPermission;

  if (!allowed) {
    return hideIfNoPermission ? null : <>{fallback}</>;
  }

  return <>{children}</>;
};
