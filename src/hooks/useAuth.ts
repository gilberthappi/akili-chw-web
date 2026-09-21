import { useState, useEffect } from "react";
import { User, UserRole, Permission, UserIndustry } from "../types";
import { decodeJWT, getCookieValue } from "../utils/jwt";
import { broadcastAuthChange } from "../utils/authSync";
import { clearCookiesFromAllDomains } from "../utils/cookieHelper";
import { expandRoles, isLearnerRole } from "../utils/roles";

const asRoleArray = (roles: UserRole | UserRole[]): UserRole[] =>
  Array.isArray(roles) ? roles : [roles];

/** Read cached session synchronously so first paint already knows the role. */
function readStoredUser(): User | null {
  try {
    const storedUser = localStorage.getItem("chw");
    if (storedUser) {
      return JSON.parse(storedUser) as User;
    }
  } catch {
    localStorage.removeItem("chw");
  }
  return null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [loading, setLoading] = useState(() => !readStoredUser());

  useEffect(() => {
    let storedToken = localStorage.getItem("accessToken");

    if (!storedToken) {
      storedToken = getCookieValue("accessToken");

      if (storedToken) {
        localStorage.setItem("accessToken", storedToken);

        const tokenPayload = decodeJWT(storedToken);
        if (tokenPayload) {
          const userData: User = {
            id: tokenPayload.id,
            email: tokenPayload.email,
            fullNames: tokenPayload.fullNames ?? "",
            roles: Array.isArray(tokenPayload.userRoles)
              ? tokenPayload.userRoles
              : [tokenPayload.userRoles],
            permissions: [],
            department: undefined,
            industry: undefined,
            isActive: true,
            createdAt: new Date(),
          };

          localStorage.setItem("chw", JSON.stringify(userData));
          setUser(userData);
          setLoading(false);
          return;
        }
      }
    }

    const stored = readStoredUser();
    if (stored) {
      setUser(stored);
    } else if (!storedToken) {
      setUser(null);
    }

    setLoading(false);
  }, []);

  const logout = () => {
    setUser(null);
    localStorage.removeItem("chw");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("auth_user");
    clearCookiesFromAllDomains();
    broadcastAuthChange("logout");
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const userRoles = asRoleArray(user.roles);
    const requestedRoles = asRoleArray(roles);
    const effective = expandRoles(userRoles);

    return requestedRoles.some((role) =>
      [...effective].some(
        (userRole) =>
          userRole === role ||
          (isLearnerRole(role) && isLearnerRole(userRole as UserRole)),
      ),
    );
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.permissions.includes("ALL");
  };

  const userDept = user?.department ?? user?.industry;

  const hasIndustry = (industries: UserIndustry | UserIndustry[]): boolean => {
    if (!user || !userDept) return false;
    const normalized = userDept === "CIIC-HIN" ? "CIIC_HIN" : userDept;
    const list = Array.isArray(industries) ? industries : [industries];
    return list.some((i) => {
      const n = i === "CIIC-HIN" ? "CIIC_HIN" : i;
      return n === normalized;
    });
  };

  const hasDepartment = hasIndustry;

  const hasRoleAndIndustry = (
    roles: UserRole | UserRole[],
    industries?: UserIndustry | UserIndustry[],
  ): boolean => {
    const hasRequiredRole = hasRole(roles);
    if (!industries) return hasRequiredRole;
    return hasRequiredRole && hasIndustry(industries);
  };

  return {
    user,
    loading,
    logout,
    hasRole,
    hasPermission,
    hasIndustry,
    hasDepartment,
    hasRoleAndIndustry,
    isAuthenticated: !!user,
  };
};
