import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  getDashboardStats,
  getCourseAnalytics,
  getStudentAnalytics,
} from "@/services/analytics.service";
import {
  IDashboardStats,
  ICourseAnalytics,
  IStudentAnalytics,
} from "@/types";

interface DashboardData {
  dashboardStats: IDashboardStats | null;
  courseAnalytics: ICourseAnalytics | null;
  studentAnalytics: IStudentAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDashboardStats = (options?: { enabled?: boolean }): DashboardData => {
  const { user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<IDashboardStats | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<ICourseAnalytics | null>(null);
  const [studentAnalytics, setStudentAnalytics] = useState<IStudentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userRoles = user?.roles
    ? Array.isArray(user.roles) ? user.roles : [user.roles]
    : [];

  const shouldFetch = options?.enabled !== false;

  const isContentManager =
    userRoles.some(r => ["ADMIN", "TRAINER", "SUPERVISOR", "STAFF"].includes(r));

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [dashRes, courseRes, studentRes] = await Promise.allSettled([
        getDashboardStats(),
        isContentManager ? getCourseAnalytics() : Promise.resolve(null),
        isContentManager ? getStudentAnalytics() : Promise.resolve(null),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value?.data) {
        setDashboardStats(dashRes.value.data);
      }

      if (courseRes.status === "fulfilled" && courseRes.value?.data) {
        setCourseAnalytics(courseRes.value.data);
      }

      if (studentRes.status === "fulfilled" && studentRes.value?.data) {
        setStudentAnalytics(studentRes.value.data);
      }
    } catch {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isContentManager]);

  useEffect(() => {
    if (shouldFetch) fetchAll();
  }, [fetchAll, shouldFetch]);

  return { dashboardStats, courseAnalytics, studentAnalytics, isLoading, error, refetch: fetchAll };
};
