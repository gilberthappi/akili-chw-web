import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { IOptionFieldOption } from "@/components/common/form/ComboboxField";
import { PROVINCE_DISTRICTS } from "@/utils/constants/provinceDistricts";
import { getAllHospitals } from "@/services/hospitals.service";
import {
  getCourseAnalytics,
  getCommunicationsAnalytics,
  getDemographicsAnalytics,
} from "@/services/analytics.service";
import { IDashboardFilters, IHospital } from "@/types";

const extractYear = (monthStr: string): string => monthStr.split(" ")[1] ?? "";
const extractMonth = (monthStr: string): string => monthStr.split(" ")[0] ?? "";

export const useFilterBarOptions = (filters: IDashboardFilters) => {
  const [availableHospitals, setAvailableHospitals] = useState<IOptionFieldOption[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [trendMonths, setTrendMonths] = useState<string[]>([]);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadOptions = async () => {
      try {
        const [demoRes, courseRes, commRes, hospitalsRes] = await Promise.allSettled([
          getDemographicsAnalytics(),
          getCourseAnalytics(),
          getCommunicationsAnalytics(),
          getAllHospitals("?limit=10"),
        ]);

        if (cancelled) return;

        if (demoRes.status === "fulfilled") {
          const rows = demoRes.value?.data?.byGender ?? [];
          setGenders(
            [...new Set(
              rows
                .map((r) =>
                  r.gender
                    ? r.gender.charAt(0).toUpperCase() + r.gender.slice(1).toLowerCase()
                    : "",
                )
                .filter(Boolean),
            )],
          );
        }

        const months: string[] = [];
        if (courseRes.status === "fulfilled") {
          months.push(...(courseRes.value?.data?.enrollmentTrends ?? []).map((t) => t.month));
        }
        if (commRes.status === "fulfilled") {
          months.push(...(commRes.value?.data?.monthlyTrend ?? []).map((t) => t.month));
        }
        setTrendMonths(months);

        if (hospitalsRes.status === "fulfilled") {
          const list: IHospital[] = hospitalsRes.value?.data ?? [];
          setAvailableHospitals(list.map((h) => ({ value: h.id, label: h.name })));
        }
      } catch {
        // keep defaults on error
      }
    };

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleHospitalSearch = useCallback((query: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (query) params.set("searchq", query);
        const res = await getAllHospitals(`?${params.toString()}`);
        const list: IHospital[] = res?.data ?? [];
        setAvailableHospitals(list.map((h) => ({ value: h.id, label: h.name })));
      } catch {
        // keep existing options on error
      }
    }, 300);
  }, []);

  const availableProvinces = useMemo(
    () => Object.keys(PROVINCE_DISTRICTS).sort(),
    [],
  );

  const availableDistricts = useMemo(() => {
    if (!filters.province) return [];
    return PROVINCE_DISTRICTS[filters.province] ?? [];
  }, [filters.province]);

  const availableYears = useMemo(
    () => [...new Set(trendMonths.map(extractYear).filter(Boolean))].sort(),
    [trendMonths],
  );

  const availableMonths = useMemo(
    () => [...new Set(trendMonths.map(extractMonth).filter(Boolean))],
    [trendMonths],
  );

  return {
    availableProvinces,
    availableDistricts,
    availableGenders: genders,
    availableYears,
    availableMonths,
    availableHospitals,
    handleHospitalSearch,
  };
};
