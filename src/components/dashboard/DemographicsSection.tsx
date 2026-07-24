import React, { useState, useMemo } from "react";
import { Users } from "lucide-react";
import { Card } from "@/components/common/Card";
import { DashboardSectionHeader } from "./shared/DashboardSectionHeader";
import {
  IDemographicsAnalytics,
  IDemographicRow,
  IDemographicCombinedRow,
  IDashboardFilters,
} from "@/types";
import { PROVINCE_DISTRICTS } from "@/utils/constants/provinceDistricts";

interface DemographicsSectionProps {
  data: IDemographicsAnalytics | null;
  filteredByDistrict?: IDemographicsAnalytics["byDistrict"];
  filteredByGender?: IDemographicsAnalytics["byGender"];
  filters?: IDashboardFilters;
}

type FilterView = "district" | "gender" | "ageGroup" | "combined";

const AGE_ORDER = ["<30", "30-49", "50-59", "60+", "Ntizwi"];

const ProgressBar: React.FC<{ value: number; color: string }> = ({
  value,
  color,
}) => {
  const safe = Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0;
  return (
    <div className='flex items-center gap-2'>
      <div className='flex-1 bg-gray-100 rounded-full h-1.5'>
        <div
          className='h-1.5 rounded-full transition-all duration-500'
          style={{ width: `${safe}%`, background: color }}
        />
      </div>
      <span className='text-xs font-medium text-gray-600 w-8 text-right shrink-0'>
        {safe}%
      </span>
    </div>
  );
};

export const DemographicsSection: React.FC<DemographicsSectionProps> = ({
  data,
  filteredByDistrict,
  filteredByGender,
  filters,
}) => {
  const [activeView, setActiveView] = useState<FilterView>("district");
  const [searchDistrict, setSearchDistrict] = useState("");

  const rawRows: IDemographicRow[] = useMemo(() => {
    if (!data) return [];
    if (activeView === "district") return filteredByDistrict ?? data.byDistrict;
    if (activeView === "gender") return filteredByGender ?? data.byGender;
    if (activeView === "ageGroup") return data.byAgeGroup;
    return [];
  }, [activeView, data, filteredByDistrict, filteredByGender]);

  const rows = useMemo(() => {
    if (activeView !== "district" || !searchDistrict.trim()) return rawRows;
    const q = searchDistrict.toLowerCase();
    return rawRows.filter((r) =>
      (r.district ?? "").toLowerCase().includes(q),
    );
  }, [rawRows, activeView, searchDistrict]);

  const combinedRows = useMemo(() => {
    let all: IDemographicCombinedRow[] = [...(data?.combined ?? [])];

    if (filters?.district) {
      all = all.filter(
        (r) =>
          (r.district ?? "").toLowerCase() === filters.district.toLowerCase(),
      );
    } else if (filters?.province) {
      const districts = new Set(
        (PROVINCE_DISTRICTS[filters.province] ?? []).map((d) =>
          d.toLowerCase(),
        ),
      );
      all = all.filter((r) =>
        districts.has((r.district ?? "").toLowerCase()),
      );
    }

    if (filters?.gender) {
      all = all.filter(
        (r) =>
          (r.gender ?? "").toLowerCase() === filters.gender.toLowerCase(),
      );
    }

    if (searchDistrict.trim()) {
      const q = searchDistrict.toLowerCase();
      all = all.filter((r) => (r.district ?? "").toLowerCase().includes(q));
    }

    // Group under each district so the name isn't repeated down the list.
    const districtTotals = new Map<string, number>();
    for (const r of all) {
      const d = r.district || "—";
      districtTotals.set(d, (districtTotals.get(d) ?? 0) + (r.total ?? 0));
    }

    all.sort((a, b) => {
      const da = a.district || "—";
      const db = b.district || "—";
      const totalDiff =
        (districtTotals.get(db) ?? 0) - (districtTotals.get(da) ?? 0);
      if (totalDiff !== 0) return totalDiff;
      if (da !== db) return da.localeCompare(db);
      const ga = a.gender || "";
      const gb = b.gender || "";
      if (ga !== gb) return ga.localeCompare(gb);
      const ai = AGE_ORDER.indexOf(a.ageGroup);
      const bi = AGE_ORDER.indexOf(b.ageGroup);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    return all;
  }, [data, searchDistrict, filters]);

  /** Rowspan helpers — show District / Gender only on the first row of each group. */
  const combinedDisplay = useMemo(() => {
    return combinedRows.map((row, i) => {
      const prev = i > 0 ? combinedRows[i - 1] : null;
      const next = i < combinedRows.length - 1 ? combinedRows[i + 1] : null;
      const sameDistrict = !!prev && prev.district === row.district;
      const sameGender =
        sameDistrict && !!prev && prev.gender === row.gender;
      const isLastInDistrict = !next || next.district !== row.district;
      const isLastInGender =
        isLastInDistrict || !next || next.gender !== row.gender;

      let districtRowSpan = 0;
      let genderRowSpan = 0;
      if (!sameDistrict) {
        let span = 1;
        while (
          i + span < combinedRows.length &&
          combinedRows[i + span].district === row.district
        ) {
          span += 1;
        }
        districtRowSpan = span;
      }
      if (!sameGender) {
        let span = 1;
        while (
          i + span < combinedRows.length &&
          combinedRows[i + span].district === row.district &&
          combinedRows[i + span].gender === row.gender
        ) {
          span += 1;
        }
        genderRowSpan = span;
      }

      return {
        row,
        sameDistrict,
        sameGender,
        districtRowSpan,
        genderRowSpan,
        isLastInDistrict,
        isLastInGender,
      };
    });
  }, [combinedRows]);

  const tabs: { key: FilterView; label: string }[] = [
    { key: "district", label: "District" },
    { key: "gender", label: "Gender" },
    { key: "ageGroup", label: "Age Group" },
    { key: "combined", label: "Combined" },
  ];

  const getLabel = (row: IDemographicRow): string => {
    const raw = row.district ?? row.gender ?? row.ageGroup;
    if (!raw) return "—";
    if (row.gender != null)
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    return raw;
  };

  if (!data) {
    return (
      <Card>
        <DashboardSectionHeader
          icon={<Users size={16} />}
          title='Learner Demographics'
        />
        <div className='flex items-center justify-center h-32 text-sm text-gray-400'>
          No data available
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <DashboardSectionHeader
        icon={<Users size={16} />}
        title='Learner Demographics'
      />

      <p className='text-xs text-gray-500 mb-3'>
        Total learners:{" "}
        <span className='font-semibold text-gray-700'>
          {data.totalStudents.toLocaleString()}
        </span>
      </p>

      <div className='flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-4 flex-wrap'>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type='button'
            onClick={() => {
              setActiveView(tab.key);
              setSearchDistrict("");
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === tab.key
                ? "bg-white text-[#3363AD] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(activeView === "district" || activeView === "combined") && (
        <input
          type='text'
          placeholder='Search district...'
          value={searchDistrict}
          onChange={(e) => setSearchDistrict(e.target.value)}
          className='w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5
            mb-3 focus:outline-none focus:ring-1 focus:ring-[#3363AD]'
        />
      )}

      {activeView === "combined" ? (
        combinedRows.length === 0 ? (
          <p className='text-sm text-gray-400 text-center py-6'>
            No data available
          </p>
        ) : (
          <div className='overflow-x-auto max-h-[420px] overflow-y-auto'>
            <p className='text-[11px] text-gray-400 mb-2'>
              Breakdown by district → gender → age (one district shown once per
              group).
            </p>
            <table className='w-full text-xs'>
              <thead className='sticky top-0 bg-white z-10'>
                <tr className='border-b border-gray-100'>
                  <th className='text-left py-2 pr-3 font-medium text-gray-500'>
                    District
                  </th>
                  <th className='text-left py-2 px-2 font-medium text-gray-500'>
                    Gender
                  </th>
                  <th className='text-left py-2 px-2 font-medium text-gray-500'>
                    Age Group
                  </th>
                  <th className='text-right py-2 px-2 font-medium text-gray-500'>
                    Learners
                  </th>
                  <th className='text-left py-2 pl-3 font-medium text-gray-500 min-w-[100px]'>
                    Completion (%)
                  </th>
                  <th className='text-left py-2 pl-3 font-medium text-gray-500 min-w-[100px]'>
                    Certification (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {combinedDisplay.map(
                  (
                    {
                      row,
                      sameDistrict,
                      sameGender,
                      districtRowSpan,
                      genderRowSpan,
                      isLastInDistrict,
                      isLastInGender,
                    },
                    i,
                  ) => {
                    const rowSep = isLastInDistrict
                      ? "border-b-2 border-gray-300"
                      : isLastInGender
                        ? "border-b border-gray-200"
                        : "border-b border-gray-50";

                    const genderEndsDistrict =
                      !sameGender &&
                      (i + genderRowSpan === combinedRows.length ||
                        combinedRows[i + genderRowSpan]?.district !==
                          row.district);

                    return (
                      <tr
                        key={`${row.district}-${row.gender}-${row.ageGroup}-${i}`}
                        className={`${rowSep} hover:bg-gray-50`}
                      >
                        {!sameDistrict && (
                          <td
                            rowSpan={districtRowSpan}
                            className='py-2.5 pr-3 font-medium text-gray-800 align-top border-r border-gray-200 border-b-2 border-b-gray-300'
                          >
                            {row.district || "—"}
                          </td>
                        )}
                        {!sameGender && (
                          <td
                            rowSpan={genderRowSpan}
                            className={`py-2.5 px-2 text-gray-600 align-top border-r border-gray-100 ${
                              genderEndsDistrict
                                ? "border-b-2 border-b-gray-300"
                                : "border-b border-b-gray-200"
                            }`}
                          >
                            {row.gender || "—"}
                          </td>
                        )}
                        <td className='py-2.5 px-2 text-gray-600'>
                          {row.ageGroup || "—"}
                        </td>
                        <td className='py-2.5 px-2 text-right text-gray-600'>
                          {(row.total ?? 0).toLocaleString()}
                        </td>
                        <td className='py-2.5 pl-3'>
                          <ProgressBar
                            value={row.completionRate ?? 0}
                            color='#3363AD'
                          />
                        </td>
                        <td className='py-2.5 pl-3'>
                          <ProgressBar
                            value={row.certificationRate ?? 0}
                            color='#3363AD'
                          />
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )
      ) : rows.length === 0 ? (
        <p className='text-sm text-gray-400 text-center py-6'>
          No data available
        </p>
      ) : (
        <div className='overflow-x-auto max-h-[420px] overflow-y-auto'>
          <table className='w-full text-xs'>
            <thead className='sticky top-0 bg-white z-10'>
              <tr className='border-b border-gray-100'>
                <th className='text-left py-2 pr-3 font-medium text-gray-500'>
                  {activeView === "district"
                    ? "District"
                    : activeView === "gender"
                      ? "Gender"
                      : "Age Group"}
                </th>
                <th className='text-right py-2 px-2 font-medium text-gray-500'>
                  Learners
                </th>
                <th className='text-left py-2 pl-3 font-medium text-gray-500 min-w-[100px]'>
                  Completion (%)
                </th>
                <th className='text-left py-2 pl-3 font-medium text-gray-500 min-w-[100px]'>
                  Certification (%)
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className='border-b border-gray-50 hover:bg-gray-50'
                >
                  <td className='py-2.5 pr-3 font-medium text-gray-800'>
                    {getLabel(row)}
                  </td>
                  <td className='py-2.5 px-2 text-right text-gray-600'>
                    {row.total.toLocaleString()}
                  </td>
                  <td className='py-2.5 pl-3'>
                    <ProgressBar
                      value={row.completionRate}
                      color='#3363AD'
                    />
                  </td>
                  <td className='py-2.5 pl-3'>
                    <ProgressBar
                      value={row.certificationRate}
                      color='#3363AD'
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
