import React from "react";
import { Filter, X } from "lucide-react";
import { IDashboardFilters } from "@/types";
import ComboboxField, { IOptionFieldOption } from "@/components/common/form/ComboboxField";

interface GlobalFilterBarProps {
  filters: IDashboardFilters;
  onChange: (filters: IDashboardFilters) => void;
  provinces: string[];
  districts: string[];
  genders: string[];
  years: string[];
  months: string[];
  hospitals: IOptionFieldOption[];
  onHospitalSearch: (query: string) => void;
}

const EMPTY: IDashboardFilters = {
  province: "", district: "", gender: "", role: "", year: "", month: "", hospitalId: "",
};

const ROLE_LABELS: Record<string, string> = {
  TRAINEE: "CHW",
  TESTER: "Tester",
};

const SELECT_CLS = "text-xs border rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#3363AD] bg-white transition-colors";

const SelectFilter: React.FC<{
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`${SELECT_CLS} min-w-[70px] ${
      value ? "border-[#3363AD] text-[#3363AD] font-medium" : "border-gray-200 text-gray-600"
    }`}
    title={label}
  >
    <option value="">{label}</option>
    {options.map((opt) => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
  </select>
);

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({
  filters,
  onChange,
  provinces,
  districts,
  genders,
  years,
  months,
  hospitals,
  onHospitalSearch,
}) => {
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");
  const set = (key: keyof IDashboardFilters) => (value: string) => {
    if (key === "province") {
      onChange({ ...filters, province: value, district: "" });
    } else {
      onChange({ ...filters, [key]: value });
    }
  };
  const reset = () => onChange(EMPTY);

  return (
    <div className="bg-white border border-gray-100 rounded-lg px-2.5 py-1.5 shadow-sm">
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="flex items-center gap-1 text-xs font-medium text-gray-600 shrink-0">
          <Filter size={12} className="text-[#3363AD]" />
        </div>

        {provinces.length > 0 && (
          <SelectFilter
            label="Province"
            value={filters.province}
            options={provinces}
            onChange={set("province")}
          />
        )}
        {filters.province !== "" && districts.length > 0 && (
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
        <select
          value={filters.role}
          onChange={(e) => set("role")(e.target.value)}
          className={`${SELECT_CLS} min-w-[70px] ${
            filters.role
              ? "border-[#3363AD] text-[#3363AD] font-medium"
              : "border-gray-200 text-gray-600"
          }`}
          title="CHW Role"
        >
          <option value="">CHW Role</option>
          <option value="TRAINEE">CHW</option>
          <option value="TESTER">Tester</option>
        </select>
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

        {/* Hospital combobox — styled to match SelectFilter via arbitrary variant overrides */}
        <div className={`
          w-[140px]
          [&_input]:!py-0.5 [&_input]:!text-xs [&_input]:!leading-4
          [&_.overflow-hidden]:![box-shadow:none]
          [&_.overflow-hidden]:!rounded
          [&_.overflow-hidden]:!border
          ${filters.hospitalId
            ? "[&_.overflow-hidden]:!border-[#3363AD] [&_input]:!text-[#3363AD] [&_input]:!font-medium"
            : "[&_.overflow-hidden]:!border-gray-200 [&_input]:!text-gray-600"
          }
        `}>
          <ComboboxField
            placeholder="Hospital"
            options={hospitals}
            defaultValue={filters.hospitalId}
            margin={false}
            onSearch={onHospitalSearch}
            onChange={(value) =>
              onChange({ ...filters, hospitalId: value, province: "", district: "" })
            }
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-0.5 text-xs text-gray-400
              hover:text-red-500 transition-colors px-1.5 py-0.5 rounded
              hover:bg-red-50"
            title="Clear all filters"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-1 pt-1 border-t border-gray-50">
          <div className="flex items-center gap-1 flex-wrap">
            {Object.entries(filters)
              .filter(([, v]) => v !== "")
              .map(([key, value]) => {
                let label = value;
                if (key === "role") label = ROLE_LABELS[value] ?? value;
                else if (key === "hospitalId")
                  label = hospitals.find((h) => h.value === value)?.label ?? value;
                return (
                  <span
                    key={key}
                    className="flex items-center gap-0.5 bg-[#3363AD]/10 text-[#3363AD]
                      text-[10px] px-1.5 py-0.5 rounded-full"
                  >
                    {label}
                    <button
                      onClick={() => set(key as keyof IDashboardFilters)("")}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={8} />
                    </button>
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
