import React from "react";
import { Filter, X } from "lucide-react";
import { IDashboardFilters } from "@/types";

interface GlobalFilterBarProps {
  filters: IDashboardFilters;
  onChange: (filters: IDashboardFilters) => void;
  provinces: string[];
  districts: string[];
  genders: string[];
  years: string[];
  months: string[];
}

const EMPTY: IDashboardFilters = {
  province: "", district: "", gender: "", year: "", month: "",
};

const SelectFilter: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-0.5">
    <label className="text-xs text-gray-400 font-medium">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-sm border rounded-lg px-2.5 py-1.5 focus:outline-none
        focus:ring-1 focus:ring-[#3363AD] bg-white transition-colors ${
        value
          ? "border-[#3363AD] text-[#3363AD] font-medium"
          : "border-gray-200 text-gray-600"
      }`}
    >
      <option value="">All</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  filters,
  onChange,
  provinces,
  districts,
  genders,
  years,
  months,
}) => {
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");
  const set = (key: keyof IDashboardFilters) => (value: string) =>
    onChange({ ...filters, [key]: value });
  const reset = () => onChange(EMPTY);

  return (
    <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Label — left side */}
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 shrink-0">
          <Filter size={14} className="text-[#3363AD]" />
          Filters
        </div>

        {/* Dropdowns + Clear — right side */}
        <div className="flex items-end gap-3 flex-wrap ml-auto">
          {provinces.length > 0 && (
            <SelectFilter
              label="Province"
              value={filters.province}
              options={provinces}
              onChange={set("province")}
            />
          )}
          {districts.length > 0 && (
            <SelectFilter
              label="District"
              value={filters.district}
              options={districts}
              onChange={set("district")}
            />
          )}
          {genders.length > 0 && (
            <SelectFilter
              label="Gender"
              value={filters.gender}
              options={genders}
              onChange={set("gender")}
            />
          )}
          {years.length > 0 && (
            <SelectFilter
              label="Year"
              value={filters.year}
              options={years}
              onChange={set("year")}
            />
          )}
          {months.length > 0 && (
            <SelectFilter
              label="Month"
              value={filters.month}
              options={months}
              onChange={set("month")}
            />
          )}
          {hasActiveFilters && (
            <button
              onClick={reset}
              className="flex items-center gap-1 text-xs text-gray-400
                hover:text-red-500 transition-colors self-end pb-1.5"
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap mt-2.5 pt-2.5 border-t border-gray-50">
          <span className="text-xs text-gray-400">Active filters:</span>
          {Object.entries(filters)
            .filter(([, v]) => v !== "")
            .map(([key, value]) => {
              const labels: Record<string, string> = {
                province: "Province",
                district: "District",
                gender: "Gender",
                year: "Year",
                month: "Month",
              };
              return (
                <span
                  key={key}
                  className="flex items-center gap-1 bg-[#3363AD]/10 text-[#3363AD]
                    text-xs px-2 py-0.5 rounded-full"
                >
                  {labels[key]}: {value}
                  <button
                    onClick={() => set(key as keyof IDashboardFilters)("")}
                    className="hover:text-red-500 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
};
