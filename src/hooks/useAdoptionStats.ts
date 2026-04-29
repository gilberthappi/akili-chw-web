import { useState, useEffect, useCallback } from "react";
import { IHospital, IEnrollmentTrend, ITestScoreAnalytics, ICommunicationsAnalytics, IDemographicsAnalytics } from "@/types";
import api from "@/services/api";
import {
  getTestScoreAnalytics,
  getCommunicationsAnalytics,
  getDemographicsAnalytics,
} from "@/services/analytics.service";

interface AdoptionStats {
  hospitals: IHospital[];
  totalChws: number;
  activeChws: number;
  registrationRate: number;
  activeRate: number;
  enrollmentTrends: IEnrollmentTrend[];
  avgStudyTime: number;           // minutes, from studentAnalytics
  byProvince: {
    province: string;
    totalChws: number;
    activeChws: number;
    hospitals: number;
  }[];
  testScores: ITestScoreAnalytics | null;
  communications: ICommunicationsAnalytics | null;
  demographics: IDemographicsAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

const TOTAL_CHWS_NATIONAL = 58567;

export const useAdoptionStats = (): AdoptionStats => {
  const [hospitals, setHospitals] = useState<IHospital[]>([]);
  const [enrollmentTrends, setEnrollmentTrends] = useState<IEnrollmentTrend[]>([]);
  const [avgStudyTime, setAvgStudyTime] = useState(0);
  const [testScores, setTestScores] = useState<ITestScoreAnalytics | null>(null);
  const [communications, setCommunications] = useState<ICommunicationsAnalytics | null>(null);
  const [demographics, setDemographics] = useState<IDemographicsAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [hospitalsRes, analyticsRes, studentRes, testRes, commRes, demoRes] =
        await Promise.allSettled([
          api.get("/hospitals/"),
          api.get("/export/dashboard/course/analytics"),
          api.get("/export/dashboard/student/analytics"),
          getTestScoreAnalytics(),
          getCommunicationsAnalytics(),
          getDemographicsAnalytics(),
        ]);

      let hospitalList: IHospital[] = [];
      if (hospitalsRes.status === "fulfilled") {
        const raw = hospitalsRes.value?.data;
        hospitalList = raw?.data ?? raw ?? [];
        setHospitals(hospitalList);
      }

      if (analyticsRes.status === "fulfilled") {
        const d = analyticsRes.value?.data?.data;
        setEnrollmentTrends(d?.enrollmentTrends ?? []);
      }

      if (studentRes.status === "fulfilled") {
        const d = studentRes.value?.data?.data;
        setAvgStudyTime(d?.avgStudyTime ?? 0);
      }

      if (testRes.status === "fulfilled") {
        setTestScores(testRes.value?.data ?? null);
      }

      if (commRes.status === "fulfilled") {
        setCommunications(commRes.value?.data ?? null);
      }

      if (demoRes.status === "fulfilled") {
        setDemographics(demoRes.value?.data ?? null);
      }
    } catch {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const totalChws = hospitals.reduce((s, h) => s + (h.totalChws ?? 0), 0);
  const activeChws = hospitals.reduce((s, h) => s + (h.activeChws ?? 0), 0);
  const registrationRate = Math.round((totalChws / TOTAL_CHWS_NATIONAL) * 100);
  const activeRate = totalChws > 0 ? Math.round((activeChws / totalChws) * 100) : 0;

  const provinceMap = new Map<string, { totalChws: number; activeChws: number; hospitals: number }>();
  for (const h of hospitals) {
    const prov = h.province ?? "Unknown";
    const ex = provinceMap.get(prov) ?? { totalChws: 0, activeChws: 0, hospitals: 0 };
    provinceMap.set(prov, {
      totalChws: ex.totalChws + (h.totalChws ?? 0),
      activeChws: ex.activeChws + (h.activeChws ?? 0),
      hospitals: ex.hospitals + 1,
    });
  }

  const byProvince = Array.from(provinceMap.entries())
    .map(([province, data]) => ({ province, ...data }))
    .sort((a, b) => b.totalChws - a.totalChws);

  return {
    hospitals, totalChws, activeChws, registrationRate, activeRate,
    enrollmentTrends, avgStudyTime, byProvince,
    testScores, communications, demographics,
    isLoading, error, refetch: fetchAll,
  };
};
