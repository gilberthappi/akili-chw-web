/* eslint-disable react-hooks/rules-of-hooks */
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useIsAuthenticated } from "react-auth-kit";
import { usePermission } from "@/hooks/usePermission";
import { UserRole, UserIndustry } from "@/types";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  allowedIndustries?: UserIndustry[];
  requireAll?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  allowedIndustries,
  requireAll = true,
  redirectTo = "/forbidden",
}) => {
  const isAuthenticated = useIsAuthenticated();
  
  // Check authentication first
  if (!isAuthenticated()) {
    return <Navigate to="/auth/login" replace />;
  }

  const { hasPermission } = usePermission({
    allowedRoles,
    allowedIndustries,
    requireAll,
  });

  if (!hasPermission) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
