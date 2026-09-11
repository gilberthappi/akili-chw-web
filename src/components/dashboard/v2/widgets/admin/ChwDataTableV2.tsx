import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, ChevronDown, Clock3 } from "lucide-react";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import {
  DemographicsLocalFilters,
  useAdminDashboardV2DemographicsPerformance,
} from "@/hooks/useAdminDashboardV2DemographicsPerformance";
import { PROVINCE_DISTRICTS } from "@/utils/constants/provinceDistricts";
import { useFilterBarOptions } from "@/hooks/useFilterBarOptions";
import {
  getPublicHospitals,
  listAllHospitals,
} from "@/services/healthCenters.service";
import {
  DEMOGRAPHICS_AGE_GROUPS,
  DEMOGRAPHICS_EDUCATION_LEVELS,
  DEMOGRAPHICS_GENDERS,
} from "./section4DesignData";
import { TableSkeleton } from "./AdminWidgetSkeleton";

const EMPTY_LOCAL: DemographicsLocalFilters = {
  gender: "",
  ageGroup: "",
  educationLevel: "",
  district: "",
  healthCenterId: "",
};

const FilterSelect: React.FC<{
  label: string;
  value: string;
  locked?: boolean;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}> = ({ label, value, locked = false, onChange, options }) => (
  <div className="relative flex items-center gap-1.5 text-[11px] font-semibold text-[#5B6575]">
    <span className="whitespace-nowrap">{label}</span>
    <div className="relative">
      <select
        value={value}
        disabled={locked}
        title={
          locked
            ? `Locked by global filter (${value || "—"})`
            : undefined
        }
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none font-semibold rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none transition-colors border ${
          locked
            ? "bg-[#E8EEF4] text-[#5B6575] border-[#C8D6E3] cursor-not-allowed"
            : "bg-white text-[#5B6575] border-[#B8CDE0] cursor-pointer hover:border-[#4B82BA]"
        }`}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5B6575] pointer-events-none"
      />
    </div>
  </div>
);

export const ChwDataTableV2: React.FC = () => {
  const { filters } = useAdminDashboardFilters();
  const { availableGenders } = useFilterBarOptions(filters);
  const [local, setLocal] = useState<DemographicsLocalFilters>(EMPTY_LOCAL);

  // Global gender / district / HC win — clear contradicting local values.
  useEffect(() => {
    setLocal((prev) => ({
      ...prev,
      gender: filters.gender ? "" : prev.gender,
      district: filters.district ? "" : prev.district,
      healthCenterId: filters.healthCenterId ? "" : prev.healthCenterId,
    }));
  }, [filters.gender, filters.district, filters.healthCenterId]);

  const genderLocked = Boolean(filters.gender);
  const districtLocked = Boolean(filters.district);
  const hcLocked = Boolean(filters.healthCenterId);

  const genderValue = filters.gender || local.gender;
  const districtValue = filters.district || local.district;
  const hcValue = filters.healthCenterId || local.healthCenterId;

  const genderOptions = useMemo(() => {
    const fromApi = availableGenders.length
      ? availableGenders
      : [...DEMOGRAPHICS_GENDERS];
    return fromApi.map((g) => ({ value: g, label: g }));
  }, [availableGenders]);

  const districtOptions = useMemo(() => {
    const list = filters.province
      ? (PROVINCE_DISTRICTS[filters.province] ?? [])
      : Object.values(PROVINCE_DISTRICTS).flat();
    return [...new Set(list)].sort().map((d) => ({ value: d, label: d }));
  }, [filters.province]);

  // Full HC list for native <select> (global bar only seeds 10 + search).
  const { data: loadedHcOptions = [] } = useQuery({
    queryKey: ["admin-v2-demographics-health-centers", districtValue],
    queryFn: async () => {
      if (districtValue) {
        const list = await getPublicHospitals({ district: districtValue });
        return list
          .map((h) => ({ value: h.id, label: h.name }))
          .sort((a, b) => a.label.localeCompare(b.label));
      }
      const res = await listAllHospitals();
      const list = res?.data ?? [];
      return list
        .map((h) => ({ value: h.id, label: h.name }))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    staleTime: 1000 * 60 * 10,
  });

  const hcOptions = useMemo(() => {
    if (!hcValue) return loadedHcOptions;
    if (loadedHcOptions.some((h) => h.value === hcValue)) return loadedHcOptions;
    return [
      { value: hcValue, label: "Selected health center" },
      ...loadedHcOptions,
    ];
  }, [hcValue, loadedHcOptions]);

  // Drop local HC if it is outside the current district list.
  useEffect(() => {
    if (hcLocked || !local.healthCenterId || loadedHcOptions.length === 0) return;
    const stillValid = loadedHcOptions.some(
      (h) => h.value === local.healthCenterId,
    );
    if (!stillValid) {
      setLocal((prev) => ({ ...prev, healthCenterId: "" }));
    }
  }, [hcLocked, loadedHcOptions, local.healthCenterId]);

  const { rows, isLoading } = useAdminDashboardV2DemographicsPerformance(
    filters,
    local,
    "Yearly",
  );

  const headers = [
    "Course Name",
    "Enrollment",
    "Completion",
    "Time period",
    "Pre Test",
    "Mid Test",
    "Post Test",
    "Certificates",
  ] as const;

  const setLocalField = (key: keyof DemographicsLocalFilters, value: string) => {
    setLocal((prev) => {
      // Changing district invalidates a facility from another district.
      if (key === "district") {
        return { ...prev, district: value, healthCenterId: "" };
      }
      return { ...prev, [key]: value };
    });
  };

  return (
    <div className="bg-white rounded-[20px] border border-[#C8D6E3] p-3.5 flex flex-col w-full h-full min-h-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3 shrink-0">
        <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight">
          CHW Demographics{" "}
          <span className="font-semibold text-[#5B6575]">
            Performance analysis
          </span>
        </h3>

        <div className="relative flex items-center gap-1.5 text-[11px] font-semibold text-[#5B6575]">
        <FilterSelect
          label="Gender"
          value={genderValue}
          locked={genderLocked}
          onChange={(v) => setLocalField("gender", v)}
          options={genderOptions}
        />
        <FilterSelect
          label="Age Group"
          value={local.ageGroup}
          onChange={(v) => setLocalField("ageGroup", v)}
          options={DEMOGRAPHICS_AGE_GROUPS.map((a) => ({
            value: a,
            label: a,
          }))}
        />
        <FilterSelect
          label="Education"
          value={local.educationLevel}
          onChange={(v) => setLocalField("educationLevel", v)}
          options={[...DEMOGRAPHICS_EDUCATION_LEVELS]}
        />
        <FilterSelect
          label="District"
          value={districtValue}
          locked={districtLocked}
          onChange={(v) => setLocalField("district", v)}
          options={districtOptions}
        />
        <FilterSelect
          label="Health center"
          value={hcValue}
          locked={hcLocked}
          onChange={(v) => setLocalField("healthCenterId", v)}
          options={hcOptions}
        />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto rounded-[12px] border border-[#E8EEF4]">
        <table className="w-full text-left border-collapse min-w-[920px]">
          <thead>
            <tr className="bg-[#E8F0F8] text-[10px] font-bold text-[#5B6575]">
              {headers.map((label, i) => (
                <th
                  key={`${label}-${i}`}
                  className={`py-2.5 px-2.5 whitespace-nowrap ${
                    i === 0 ? "rounded-tl-[12px] text-left" : "text-center"
                  } ${i === headers.length - 1 ? "rounded-tr-[12px]" : ""}`}
                >
                  <div
                    className={`inline-flex items-center gap-1 ${
                      i === 0 ? "" : "justify-center w-full"
                    }`}
                  >
                    <span>{label}</span>
                    <ArrowUpDown size={11} className="text-[#9AA3B2]" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="p-2">
                  <TableSkeleton rows={8} cols={headers.length} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="py-10 text-center text-[12px] text-[#9AA3B2]"
                >
                  No courses match these filters
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-[#E8EEF4] hover:bg-[#F8FBFF] transition-colors"
                >
                  <td className="py-2.5 px-2.5">
                    <div className="flex items-center gap-2.5 min-w-[200px]">
                      <div className="w-9 h-9 rounded-md bg-[#D6E4F5] shrink-0 flex items-center justify-center overflow-hidden">
                        {row.coverIcon ? (
                          <img
                            src={row.coverIcon}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] font-bold text-[#3363AD]">
                            CHW
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#1A2332] uppercase leading-snug">
                          {row.title}
                        </p>
                        <p className="text-[10px] font-medium text-[#5B6575] mt-0.5">
                          {row.level}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-2.5 text-center text-[11px] font-semibold text-[#1A2332] tabular-nums">
                    {row.enrollment}
                  </td>

                  <td className="py-2.5 px-2.5 text-center text-[11px] font-semibold text-[#1A2332] tabular-nums">
                    {row.completion}
                  </td>

                  <td className="py-2.5 px-2.5 text-center">
                    <div className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-[#1A2332] tabular-nums whitespace-nowrap">
                      <Clock3 size={12} className="text-[#3363AD]" />
                      {row.avgCompletionTime}
                    </div>
                  </td>

                  <td className="py-2.5 px-2.5 text-center text-[11px] font-semibold text-[#1A2332] tabular-nums">
                    {row.preTest}
                  </td>
                  <td className="py-2.5 px-2.5 text-center text-[11px] font-semibold text-[#1A2332] tabular-nums">
                    {row.midTest}
                  </td>
                  <td className="py-2.5 px-2.5 text-center text-[11px] font-semibold text-[#1A2332] tabular-nums">
                    {row.postTest}
                  </td>
                  <td className="py-2.5 px-2.5 text-center text-[11px] font-medium text-[#1A2332] whitespace-nowrap">
                    {row.certificate}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChwDataTableV2;
