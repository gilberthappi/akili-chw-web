/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuthUser, useIsAuthenticated } from "react-auth-kit";
import { UserRole, UserIndustry } from "@/types";
import { AppPermission, ROLE_PERMISSIONS } from "@/utils/constants/permissions";

interface PermissionConfig {
  allowedRoles?: UserRole[];
  allowedIndustries?: UserIndustry[];
  requireAll?: boolean;
}

export const usePermission = (config: PermissionConfig = {}) => {
  const { allowedRoles, allowedIndustries, requireAll = true } = config;
  const isAuthenticated = useIsAuthenticated();
  const auth = useAuthUser();

  if (!isAuthenticated()) {
    return {
      hasPermission: false,
      can: (_: AppPermission) => false,
      isAuthenticated: false,
      userRoles: [] as string[],
      userRole: undefined as string | undefined,
      userIndustry: undefined as UserIndustry | undefined,
    };
  }

  const user = auth();
  const userRoles: string[] = user?.roles
    ? Array.isArray(user.roles) ? user.roles : [user.roles]
    : [];
  const userIndustry: UserIndustry | undefined = user?.industry;

  // Check if any of the user's roles grant the given permission key
  const can = (permission: AppPermission): boolean =>
    userRoles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission) ?? false);

  // Legacy role/industry gate used by ProtectedRoute
  if (!allowedRoles && !allowedIndustries) {
    return {
      hasPermission: true,
      can,
      isAuthenticated: true,
      userRoles,
      userRole: userRoles[0],
      userIndustry,
    };
  }

  const hasRolePermission = allowedRoles
    ? userRoles.some((role: any) => allowedRoles.includes(role))
    : true;

  const hasIndustryPermission = allowedIndustries
    ? userIndustry != null && allowedIndustries.includes(userIndustry)
    : true;

  let hasPermission = false;
  if (allowedRoles && allowedIndustries) {
    hasPermission = requireAll
      ? hasRolePermission && hasIndustryPermission
      : hasRolePermission || hasIndustryPermission;
  } else if (allowedRoles) {
    hasPermission = hasRolePermission;
  } else if (allowedIndustries) {
    hasPermission = hasIndustryPermission;
  }

  return {
    hasPermission,
    can,
    isAuthenticated: true,
    userRoles,
    userRole: userRoles[0],
    userIndustry,
  };
};
