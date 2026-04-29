import { useState, useEffect, useCallback } from "react";
import { IMyCertificate, IDashboardStats } from "@/types";
import api from "@/services/api";

interface LearnerDashboardData {
  dashboardStats: IDashboardStats | null;
  certificates: IMyCertificate[];
  totalCertificates: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useLearnerDashboard = (): LearnerDashboardData => {
  const [dashboardStats, setDashboardStats] = useState<IDashboardStats | null>(null);
  const [certificates, setCertificates] = useState<IMyCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // GET /courses/dashboard/statistics — works for TRAINEE token
      const statsRes = await api.get("/courses/dashboard/statistics");
      setDashboardStats(statsRes.data?.data ?? null);

      // Certificates: TRAINEE has no bulk endpoint.
      // We leave it empty on the dashboard — the full list is on the
      // My Certificates dedicated page.
      setCertificates([]);
    } catch {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    dashboardStats,
    certificates,
    totalCertificates: certificates.length,
    isLoading,
    error,
    refetch: fetchAll,
  };
};
