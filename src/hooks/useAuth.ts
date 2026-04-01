import { useState, useEffect } from "react";
import { User, UserRole, Permission, UserIndustry } from "../types";
import { decodeJWT, getCookieValue } from "../utils/jwt";
import { broadcastAuthChange } from "../utils/authSync";
import { clearCookiesFromAllDomains } from "../utils/cookieHelper";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get token from localStorage first
    let storedToken = localStorage.getItem("accessToken");
    
    // If no localStorage token, try to read from cookie
    if (!storedToken) {
      storedToken = getCookieValue("accessToken");
      
      // If found in cookie, store in localStorage for stability
      if (storedToken) {
        localStorage.setItem("accessToken", storedToken);
        
        // Also try to extract user info from JWT token
        const tokenPayload = decodeJWT(storedToken);
        if (tokenPayload) {
          const userData: User = {
            id: tokenPayload.id,
            email: tokenPayload.email,
            roles: Array.isArray(tokenPayload.userRoles) 
              ? tokenPayload.userRoles 
              : [tokenPayload.userRoles],
            permissions: [],
            industry: null,
          };
          
          localStorage.setItem("chw", JSON.stringify(userData));
          setUser(userData);
          setLoading(false);
          return;
        }
      }
    }
    
    // Try to get user from localStorage
    const storedUser = localStorage.getItem("chw");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("chw");
      }
    }
    
    setLoading(false);
  }, []);

  const logout = () => {
    setUser(null);
    // Clear all localStorage items
    localStorage.removeItem("chw");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("auth_user");
    
    // Clear cookies from all domains (handles cross-domain cookies)
    clearCookiesFromAllDomains();
    
    // Broadcast logout to other tabs/ports
    broadcastAuthChange('logout');
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.some((role) => user.roles.includes(role));
    }
    return user.roles.includes(roles);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission) || user.permissions.includes("ALL");
  };

  const hasIndustry = (industries: UserIndustry | UserIndustry[]): boolean => {
    if (!user || !user.industry) return false;
    if (Array.isArray(industries)) {
      return industries.includes(user.industry);
    }
    return user.industry === industries;
  };

  const hasRoleAndIndustry = (
    roles: UserRole | UserRole[],
    industries?: UserIndustry | UserIndustry[],
  ): boolean => {
    const hasRequiredRole = hasRole(roles);

    if (!industries) return hasRequiredRole;

    const hasRequiredIndustry = hasIndustry(industries);
    return hasRequiredRole && hasRequiredIndustry;
  };

  return {
    user,
    loading,
    logout,
    hasRole,
    hasPermission,
    hasIndustry,
    hasRoleAndIndustry,
    isAuthenticated: !!user,
  };
};
