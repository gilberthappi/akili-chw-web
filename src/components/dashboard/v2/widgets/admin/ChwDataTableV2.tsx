import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Clock3,
} from "lucide-react";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import {
  DemographicsLocalFilters,
  DemographicsPerformanceRow,
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
import { V2_CARD_SHELL_PADDED } from "./v2CardStyles";

const EMPTY_LOCAL: DemographicsLocalFilters = {
  gender: "",
  ageGroup: "",
  educationLevel: "",
  district: "",
  healthCenterId: "",
};

type SortKey =
  | "title"
  | "chapters"
  | "sections"
  | "mediaFiles"
  | "questions"
  | "enrollment"
  | "completion"
  | "avgCompletionTime"
  | "preTest"
  | "midTest"
  | "postTest"
  | "knowledgeGain"
  | "certificate";

type SortDir = "asc" | "desc";

const HEADERS: { label: string; key: SortKey }[] = [
  { label: "Course Name", key: "title" },
  { label: "Chapters", key: "chapters" },
  { label: "Sections", key: "sections" },
  { label: "Media", key: "mediaFiles" },
  { label: "Questions", key: "questions" },
  { label: "Enrollment", key: "enrollment" },
  { label: "Completion", key: "completion" },
  { label: "Time period", key: "avgCompletionTime" },
  { label: "Pre Test", key: "preTest" },
  { label: "Mid Test", key: "midTest" },
  { label: "Post Test", key: "postTest" },
  { label: "Knowledge Gain", key: "knowledgeGain" },
  { label: "Certificates", key: "certificate" },
];

/** Parse "74%", "9d", "12 days", plain numbers → comparable float. */
const toSortNumber = (value: string | number): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = value.replace(/,/g, "").trim();
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const compareRows = (
  a: DemographicsPerformanceRow,
  b: DemographicsPerformanceRow,
  key: SortKey,
  dir: SortDir,
): number => {
  const mul = dir === "asc" ? 1 : -1;
  if (key === "title") {
    return (
      mul *
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
    );
  }
  const av = toSortNumber(a[key] ?? 0);
  const bv = toSortNumber(b[key] ?? 0);
  if (av === bv) {
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  }
  return mul * (av - bv);
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
  const navigate = useNavigate();
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

  const [sortKey, setSortKey] = useState<SortKey>("enrollment");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sortedRows = useMemo(() => {
    const next = [...rows];
    next.sort((a, b) => compareRows(a, b, sortKey, sortDir));
    return next;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    // Metrics default to high→low; course name to A→Z.
    setSortDir(key === "title" ? "asc" : "desc");
  };

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
    <div className={`${V2_CARD_SHELL_PADDED} flex flex-col w-full h-full min-h-0 overflow-hidden`}>
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
              {HEADERS.map(({ label, key }, i) => {
                const active = sortKey === key;
                const SortIcon = !active
                  ? ArrowUpDown
                  : sortDir === "asc"
                    ? ArrowUp
                    : ArrowDown;
                return (
                  <th
                    key={key}
                    className={`py-2.5 px-2.5 whitespace-nowrap ${
                      i === 0 ? "rounded-tl-[12px] text-left" : "text-center"
                    } ${i === HEADERS.length - 1 ? "rounded-tr-[12px]" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(key)}
                      className={`inline-flex items-center gap-1 cursor-pointer select-none hover:text-[#1A2332] transition-colors ${
                        i === 0 ? "" : "justify-center w-full"
                      } ${active ? "text-[#3363AD]" : ""}`}
                      aria-label={`Sort by ${label} ${
                        active
                          ? sortDir === "asc"
                            ? "descending"
                            : "ascending"
                          : "descending"
                      }`}
                    >
                      <span>{label}</span>
                      <SortIcon
                        size={11}
                        className={active ? "text-[#3363AD]" : "text-[#9AA3B2]"}
                      />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length} className="p-2">
                  <TableSkeleton rows={8} cols={HEADERS.length} />
                </td>
              </tr>
            ) : sortedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={HEADERS.length}
                  className="py-10 text-center text-[12px] text-[#9AA3B2]"
                >
                  No courses match these filters
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-[#E8EEF4] hover:bg-[#F8FBFF] transition-colors cursor-pointer"
                  onClick={() => navigate(`/courses/${row.id}/analysis`)}
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
                        <p className="text-[11px] font-bold text-[#1A2332] uppercase leading-snug hover:text-[#3363AD]">
                          {row.title}
                        </p>
                        <p className="text-[10px] font-medium text-[#5B6575] mt-0.5">
                          {row.level}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-2.5 text-center text-[11px] font-medium text-[#1A2332] tabular-nums">
                    {row.chapters ?? 0}
                  </td>
                  <td className="py-2.5 px-2.5 text-center text-[11px] font-medium text-[#1A2332] tabular-nums">
                    {row.sections ?? 0}
                  </td>
                  <td className="py-2.5 px-2.5 text-center text-[11px] font-medium text-[#1A2332] tabular-nums">
                    {row.mediaFiles ?? 0}
                  </td>
                  <td className="py-2.5 px-2.5 text-center text-[11px] font-medium text-[#1A2332] tabular-nums">
                    {row.questions ?? 0}
                  </td>

                  <td className="py-2.5 px-2.5 text-center">
                    <div className="inline-flex items-center justify-center gap-1.5 text-[11px] font-medium text-[#1A2332] tabular-nums whitespace-nowrap">
                      <span>{row.enrollment}</span>
                      ({row.enrollmentVariation ? (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                            row.enrollmentVariationPositive !== false
                              ? "text-[#0F766E]"
                              : "text-[#DC2626]"
                          }`}
                        >
                          {row.enrollmentVariationPositive !== false ? (
                            <ArrowUp size={10} strokeWidth={3} />
                          ) : (
                            <ArrowDown size={10} strokeWidth={3} />
                          )}
                          {row.enrollmentVariation}
                        </span>
                      ) : null})
                    </div>
                  </td>

                  <td className="py-2.5 px-2.5 text-center text-[11px] font-medium text-[#1A2332] tabular-nums">
                    {row.completion}
                  </td>

                  <td className="py-2.5 px-2.5 text-center">
                    <div className="inline-flex items-center justify-center gap-1 text-[11px] font-medium text-[#1A2332] tabular-nums whitespace-nowrap">
                      <Clock3 size={12} className="text-[#3363AD]" />
                      {row.avgCompletionTime}
                    </div>
                  </td>

                  <td className="py-2.5 px-2.5 text-center text-[11px] font-medium text-[#1A2332] tabular-nums">
                    {row.preTest}
                  </td>
                  <td className="py-2.5 px-2.5 text-center text-[11px] font-medium text-[#1A2332] tabular-nums">
                    {row.midTest}
                  </td>
                  <td className="py-2.5 px-2.5 text-center text-[11px] font-medium text-[#1A2332] tabular-nums">
                    {row.postTest}
                  </td>
                  <td
                    className={`py-2.5 px-2.5 text-center text-[11px] font-semibold tabular-nums ${
                      (row.knowledgeGain ?? "").startsWith("+")
                        ? "text-[#0F766E]"
                        : (row.knowledgeGain ?? "").startsWith("-")
                          ? "text-[#DC2626]"
                          : "text-[#1A2332]"
                    }`}
                  >
                    {row.knowledgeGain ?? "—"}
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
