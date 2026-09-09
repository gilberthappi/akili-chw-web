/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuthUser, useIsAuthenticated } from "react-auth-kit";
import { UserRole, UserIndustry, UserDepartment } from "@/types";
import { expandRoles, isLearnerRole } from "@/utils/roles";

interface PermissionConfig {
  allowedRoles?: UserRole[];
  /** @deprecated prefer allowedDepartments */
  allowedIndustries?: UserIndustry[];
  allowedDepartments?: UserDepartment[];
  requireAll?: boolean;
}

const normalizeDepartment = (
  value?: string | null,
): UserDepartment | UserIndustry | undefined => {
  if (!value) return undefined;
  if (value === "CIIC-HIN") return "CIIC_HIN";
  return value as UserDepartment;
};

export const usePermission = (config: PermissionConfig = {}) => {
  const {
    allowedRoles,
    allowedIndustries,
    allowedDepartments,
    requireAll = true,
  } = config;
  const isAuthenticated = useIsAuthenticated();
  const auth = useAuthUser();

  if (!isAuthenticated()) {
    return {
      hasPermission: false,
      isAuthenticated: false,
      userRole: undefined,
      userIndustry: undefined,
      userDepartment: undefined,
    };
  }

  const user = auth() as any;
  const userRoles = (
    user?.roles
      ? Array.isArray(user.roles)
        ? user.roles
        : [user.roles]
      : []
  ) as string[];
  const userDepartment = normalizeDepartment(
    user?.department ?? user?.industry,
  );
  const deptAllowList = (allowedDepartments ?? allowedIndustries)?.map((d) =>
    normalizeDepartment(d),
  );

  if (!allowedRoles && !deptAllowList) {
    return {
      hasPermission: true,
      isAuthenticated: true,
      userRole: userRoles[0] as UserRole,
      userIndustry: userDepartment as UserIndustry,
      userDepartment: userDepartment as UserDepartment,
    };
  }

  const effectiveRoles = expandRoles(userRoles);

  const hasRolePermission = allowedRoles
    ? [...effectiveRoles].some((role) =>
        allowedRoles.some(
          (allowedRole) =>
            allowedRole === role ||
            (isLearnerRole(allowedRole) && isLearnerRole(role as UserRole)),
        ),
      )
    : true;

  const hasDepartmentPermission = deptAllowList
    ? !!userDepartment && deptAllowList.includes(userDepartment)
    : true;

  let hasPermission = false;
  if (allowedRoles && deptAllowList) {
    hasPermission = requireAll
      ? hasRolePermission && hasDepartmentPermission
      : hasRolePermission || hasDepartmentPermission;
  } else if (allowedRoles) {
    hasPermission = hasRolePermission;
  } else if (deptAllowList) {
    hasPermission = hasDepartmentPermission;
  }

  return {
    hasPermission,
    isAuthenticated: true,
    userRole: userRoles[0] as UserRole,
    userIndustry: userDepartment as UserIndustry,
    userDepartment: userDepartment as UserDepartment,
  };
};
