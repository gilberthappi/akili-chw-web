import React, { useEffect, useState, useMemo, useRef } from "react";
import * as d3 from "d3";
import { ChevronDown } from "lucide-react";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import {
  MapDistrictOverview,
  useAdminDashboardV2MapOverview,
} from "@/hooks/useAdminDashboardV2MapOverview";

type OverviewMode =
  | "all"
  | "enrollment"
  | "completion"
  | "certification"
  | "healthCenter";

const DISTRICT_PROVINCE_MAP: Record<
  string,
  { province: string; code: "EAST" | "WEST" | "NORTH" | "SOUTH" | "KIGALI"; color: string }
> = {
  gasabo: { province: "Kigali City", code: "KIGALI", color: "#14B8A6" },
  kicukiro: { province: "Kigali City", code: "KIGALI", color: "#14B8A6" },
  nyarugenge: { province: "Kigali City", code: "KIGALI", color: "#14B8A6" },
  burera: { province: "Northern Province", code: "NORTH", color: "#EAB308" },
  gakenke: { province: "Northern Province", code: "NORTH", color: "#EAB308" },
  gicumbi: { province: "Northern Province", code: "NORTH", color: "#EAB308" },
  musanze: { province: "Northern Province", code: "NORTH", color: "#EAB308" },
  rulindo: { province: "Northern Province", code: "NORTH", color: "#EAB308" },
  gisagara: { province: "Southern Province", code: "SOUTH", color: "#3B82F6" },
  huye: { province: "Southern Province", code: "SOUTH", color: "#3B82F6" },
  kamonyi: { province: "Southern Province", code: "SOUTH", color: "#3B82F6" },
  muhanga: { province: "Southern Province", code: "SOUTH", color: "#3B82F6" },
  nyamagabe: { province: "Southern Province", code: "SOUTH", color: "#3B82F6" },
  nyanza: { province: "Southern Province", code: "SOUTH", color: "#3B82F6" },
  nyaruguru: { province: "Southern Province", code: "SOUTH", color: "#3B82F6" },
  ruhango: { province: "Southern Province", code: "SOUTH", color: "#3B82F6" },
  bugesera: { province: "Eastern Province", code: "EAST", color: "#EF4444" },
  gatsibo: { province: "Eastern Province", code: "EAST", color: "#EF4444" },
  kayonza: { province: "Eastern Province", code: "EAST", color: "#EF4444" },
  kirehe: { province: "Eastern Province", code: "EAST", color: "#EF4444" },
  ngoma: { province: "Eastern Province", code: "EAST", color: "#EF4444" },
  nyagatare: { province: "Eastern Province", code: "EAST", color: "#EF4444" },
  rwamagana: { province: "Eastern Province", code: "EAST", color: "#EF4444" },
  karongi: { province: "Western Province", code: "WEST", color: "#F97316" },
  ngororero: { province: "Western Province", code: "WEST", color: "#F97316" },
  nyabihu: { province: "Western Province", code: "WEST", color: "#F97316" },
  nyamasheke: { province: "Western Province", code: "WEST", color: "#F97316" },
  rubavu: { province: "Western Province", code: "WEST", color: "#F97316" },
  rusizi: { province: "Western Province", code: "WEST", color: "#F97316" },
  rutsiro: { province: "Western Province", code: "WEST", color: "#F97316" },
};

const PROVINCE_LEGEND = [
  { code: "EAST", label: "East", color: "#EF4444" },
  { code: "NORTH", label: "North", color: "#EAB308" },
  { code: "WEST", label: "West", color: "#F97316" },
  { code: "SOUTH", label: "South", color: "#3B82F6" },
  { code: "KIGALI", label: "Kigali City", color: "#14B8A6" },
];

type OverviewBarTone = {
  /** Light track / primary single bar */
  track: string;
  /** Text on light track */
  trackText: string;
  /** Filled (secondary) bar */
  fill: string;
  /** Track behind fill */
  fillTrack: string;
};

/** Higher-contrast tones so labels stay readable on every metric. */
const BAR_TONES: Record<Exclude<OverviewMode, "all">, OverviewBarTone> = {
  enrollment: {
    track: "#8BB4D9",
    trackText: "#1A2F45",
    fill: "#3363AD",
    fillTrack: "#D6E4F2",
  },
  completion: {
    track: "#7BC4A0",
    trackText: "#143828",
    fill: "#1F7A4D",
    fillTrack: "#D5EDE1",
  },
  certification: {
    track: "#D4B15C",
    trackText: "#3D2E0A",
    fill: "#A67C1A",
    fillTrack: "#F0E6C8",
  },
  healthCenter: {
    track: "#9AA3B5",
    trackText: "#1A2332",
    fill: "#4A5568",
    fillTrack: "#E2E5EC",
  },
};

type OverviewBar = {
  topLabel: string;
  /** Right of top row — omit to hide */
  topRight?: string;
  /** Blue bar label — omit to hide the blue row entirely */
  bottomLabel?: string;
  /** Right of blue row — omit to hide */
  bottomRight?: string;
  /** Blue bar width 0–100 */
  barWidth: number;
  tone: OverviewBarTone;
};

const singleModeBar = (
  d: MapDistrictOverview,
  mode: Exclude<OverviewMode, "all">,
  totalChwsAll: number,
  totalHealthCentersAll: number,
  /** In "All", CHWs only on Health centers — avoid duplicate CHW bars */
  includeChws = true,
): OverviewBar => {
  const tone = BAR_TONES[mode];
  switch (mode) {
    case "enrollment":
      return includeChws
        ? {
            topLabel: `${d.enrollments} Enrollments`,
            bottomLabel: `${d.totalChws} CHWs`,
            barWidth: 100,
            tone,
          }
        : {
            topLabel: `${d.enrollments} Enrollments`,
            barWidth: 0,
            tone,
          };
    case "completion":
      return {
        topLabel: `${d.completions} Completions`,
        topRight: `${d.avgFinalTestScore}%`,
        barWidth: Math.min(100, Math.max(0, d.avgFinalTestScore)),
        tone,
      };
    case "certification":
      return {
        topLabel: `${d.certifications} Certificates`,
        topRight: `${d.avgFinalExamScore}%`,
        barWidth: Math.min(100, Math.max(0, d.avgFinalExamScore)),
        tone,
      };
    case "healthCenter": {
      const hcPct =
        totalHealthCentersAll > 0
          ? Math.round(
              (d.healthCentersCount / totalHealthCentersAll) * 1000,
            ) / 10
          : 0;
      const chwPct =
        totalChwsAll > 0
          ? Math.round((d.totalChws / totalChwsAll) * 1000) / 10
          : 0;
      return includeChws
        ? {
            topLabel: `${d.healthCentersCount} Health centers`,
            topRight: `${hcPct}%`,
            bottomLabel: `${d.totalChws} CHWs`,
            bottomRight: `${chwPct}%`,
            barWidth: Math.min(100, Math.max(chwPct > 0 ? 8 : 0, chwPct)),
            tone,
          }
        : {
            topLabel: `${d.healthCentersCount} Health centers`,
            topRight: `${hcPct}%`,
            barWidth: 0,
            tone,
          };
    }
  }
};

const overviewBars = (
  d: MapDistrictOverview,
  mode: OverviewMode,
  totalChwsAll: number,
  totalHealthCentersAll: number,
): OverviewBar[] => {
  if (mode === "all") {
    return (
      [
        "enrollment",
        "completion",
        "certification",
        "healthCenter",
      ] as const
    ).map((m) =>
      // CHWs only once under Health centers when showing All
      singleModeBar(
        d,
        m,
        totalChwsAll,
        totalHealthCentersAll,
        m === "healthCenter",
      ),
    );
  }
  return [singleModeBar(d, mode, totalChwsAll, totalHealthCentersAll, true)];
};

export const MapRegionalOverviewWidgetV2: React.FC = () => {
  const { filters } = useAdminDashboardFilters();

  // Always load all districts for the map; global/local district only affects highlight + overview.
  const mapFilters = useMemo(
    () => ({ ...filters, district: "" }),
    [filters],
  );
  const { districts, isLoading: isLoadingData } =
    useAdminDashboardV2MapOverview(mapFilters);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [filterMode, setFilterMode] = useState<OverviewMode>("all");
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  /** Map/overview-only selection — does not write global filters. */
  const [localDistrict, setLocalDistrict] = useState("");
  const globalDistrict = filters.district ?? "";
  /** Global district wins; otherwise use map click selection. */
  const selectedDistrict = globalDistrict || localDistrict;
  const [hoveredDistrict, setHoveredDistrict] = useState<{
    name: string;
    province: string;
    totalChws: number;
    enrollments: number;
    completions: number;
    certifications: number;
    healthCentersCount: number;
    x: number;
    y: number;
  } | null>(null);

  // When global district changes, drop local map selection so global drives the map.
  useEffect(() => {
    setLocalDistrict("");
  }, [globalDistrict]);

  const districtByKey = useMemo(() => {
    const map = new Map<string, MapDistrictOverview>();
    for (const d of districts) {
      map.set(d.district.toLowerCase().trim(), d);
    }
    return map;
  }, [districts]);

  const totalChwsAll = useMemo(
    () => districts.reduce((sum, d) => sum + d.totalChws, 0),
    [districts],
  );
  const totalHealthCentersAll = useMemo(
    () => districts.reduce((sum, d) => sum + d.healthCentersCount, 0),
    [districts],
  );

  const overviewItems = useMemo(() => {
    let items = [...districts];
    if (selectedDistrict) {
      items = items.filter(
        (d) => d.district.toLowerCase() === selectedDistrict.toLowerCase(),
      );
    }
    switch (filterMode) {
      case "enrollment":
        items.sort((a, b) => b.enrollments - a.enrollments);
        break;
      case "completion":
        items.sort((a, b) => b.completionRate - a.completionRate);
        break;
      case "certification":
        items.sort((a, b) => b.certificationRate - a.certificationRate);
        break;
      case "healthCenter":
        items.sort((a, b) => b.healthCentersCount - a.healthCentersCount);
        break;
      default:
        items.sort((a, b) => b.totalChws - a.totalChws);
    }
    return items;
  }, [districts, filterMode, selectedDistrict]);

  const VW = 580;
  const VH = 480;

  const projection = useMemo(
    () =>
      d3
        .geoMercator()
        .center([29.88, -1.945])
        .scale(15800)
        .translate([VW / 2, VH / 2 + 10]),
    [],
  );

  const pathGen = useMemo(() => d3.geoPath().projection(projection), [projection]);

  useEffect(() => {
    fetch("/rwanda-districts.geojson")
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        setGeoData(data);
        setIsLoadingGeo(false);
      })
      .catch(() => setIsLoadingGeo(false));
  }, []);

  const processedFeatures = useMemo(() => {
    if (!geoData) return [];
    const reverseRings = (coords: number[][][]) =>
      coords.map((ring) => [...ring].reverse());
    return geoData.features.map((f: GeoJSON.Feature) => {
      const geom =
        f.geometry.type === "Polygon"
          ? {
              ...f.geometry,
              coordinates: reverseRings(
                f.geometry.coordinates as number[][][],
              ),
            }
          : f.geometry;
      const feature = { ...f, geometry: geom } as GeoJSON.Feature;
      const centroid = pathGen.centroid(feature);
      const rawName = String(
        (f.properties as { shapeName?: string } | null)?.shapeName || "",
      ).trim();
      const lowerName = rawName.toLowerCase();
      const provInfo = DISTRICT_PROVINCE_MAP[lowerName] || {
        province: "UNKNOWN",
        code: "EAST" as const,
        color: "#CBD5E1",
      };
      const metrics = districtByKey.get(lowerName);

      return {
        ...feature,
        properties: {
          ...(f.properties ?? {}),
          districtName: rawName,
          province: provInfo.province,
          provCode: provInfo.code,
          fillColor: provInfo.color,
          centroid,
          demoTotal: metrics?.totalChws ?? 0,
          enrollments: metrics?.enrollments ?? 0,
          completions: metrics?.completions ?? 0,
          certifications: metrics?.certifications ?? 0,
          demoCompletion: metrics?.completionRate ?? 0,
          healthCentersCount: metrics?.healthCentersCount ?? 0,
        },
      };
    });
  }, [geoData, pathGen, districtByKey]);

  const toggleDistrictSelection = (districtName: string) => {
    // Global district filter owns selection — map click must not change globals.
    if (globalDistrict.trim()) return;

    const canonical =
      districtByKey.get(districtName.toLowerCase().trim())?.district ??
      districtName;
    const isSame =
      localDistrict.trim().toLowerCase() === canonical.toLowerCase();
    setLocalDistrict(isSame ? "" : canonical);
  };

  const isLoading = isLoadingGeo || (isLoadingData && districts.length === 0);

  return (
    <div className="bg-white rounded-[20px] border border-[#C8D6E3] p-3.5 flex flex-col space-y-3 h-full min-h-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight">
          Map
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 items-stretch flex-1 min-h-0 overflow-hidden">
        <div
          ref={containerRef}
          className="relative flex flex-col justify-between min-h-0 overflow-hidden h-full"
        >
          <div className="absolute top-1 left-0 z-10 bg-white/95 backdrop-blur-xs border border-[#C8D6E3] rounded-lg p-2 text-[10px] space-y-1 min-w-[130px]">
            {PROVINCE_LEGEND.map((item) => (
              <div key={item.code} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-[#5B6575] text-[9px]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center min-h-[380px] animate-pulse px-6">
              <div className="w-full max-w-[320px] aspect-square rounded-[40%] bg-[#E8EEF4] relative overflow-hidden">
                <div className="absolute inset-[12%] rounded-[36%] bg-[#D7E3F0]/80" />
                <div className="absolute inset-[28%] rounded-[32%] bg-[#C8D6E3]/70" />
              </div>
            </div>
          ) : (
            <div className="w-full flex-1 relative flex items-center justify-center my-auto">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${VW} ${VH}`}
                className="w-full h-auto max-h-[400px] drop-shadow-xs"
                preserveAspectRatio="xMidYMid meet"
              >
                <g className="districts-layer">
                  {processedFeatures.map((f, idx) => {
                    const dPath = pathGen(f) ?? "";
                    const name = f.properties.districtName as string;
                    const isSelected =
                      selectedDistrict.toLowerCase() === name.toLowerCase();
                    const isHovered = hoveredDistrict?.name === name;

                    return (
                      <path
                        key={String(
                          (f.properties as { shapeID?: string }).shapeID || idx,
                        )}
                        d={dPath}
                        fill={f.properties.fillColor as string}
                        stroke="#FFFFFF"
                        strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                        className="cursor-pointer transition-all duration-200 hover:brightness-105"
                        style={{
                          opacity: selectedDistrict && !isSelected ? 0.45 : 0.92,
                          filter: isHovered
                            ? "drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                            : "none",
                        }}
                        onClick={() => toggleDistrictSelection(name)}
                        onMouseEnter={(e) => {
                          const bounds =
                            containerRef.current?.getBoundingClientRect();
                          if (bounds) {
                            setHoveredDistrict({
                              name,
                              province: f.properties.province as string,
                              totalChws: f.properties.demoTotal as number,
                              enrollments: f.properties.enrollments as number,
                              completions: f.properties.completions as number,
                              certifications: f.properties
                                .certifications as number,
                              healthCentersCount: f.properties
                                .healthCentersCount as number,
                              x: e.clientX - bounds.left,
                              y: e.clientY - bounds.top - 12,
                            });
                          }
                        }}
                        onMouseMove={(e) => {
                          const bounds =
                            containerRef.current?.getBoundingClientRect();
                          if (bounds) {
                            setHoveredDistrict((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    x: e.clientX - bounds.left,
                                    y: e.clientY - bounds.top - 12,
                                  }
                                : null,
                            );
                          }
                        }}
                        onMouseLeave={() => setHoveredDistrict(null)}
                      />
                    );
                  })}

                  {processedFeatures.map((f, idx) => {
                    const centroid = f.properties.centroid as
                      | [number, number]
                      | undefined;
                    if (!centroid || Number.isNaN(centroid[0])) return null;

                    return (
                      <text
                        key={`label-${idx}`}
                        x={centroid[0]}
                        y={centroid[1]}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="7.5px"
                        fontWeight="800"
                        fill="#1E293B"
                        stroke="#FFFFFF"
                        strokeWidth="1.8px"
                        paintOrder="stroke"
                        className="pointer-events-none uppercase tracking-tighter"
                      >
                        {f.properties.districtName as string}
                      </text>
                    );
                  })}
                </g>
              </svg>

              {hoveredDistrict && (
                <div
                  className="absolute z-30 pointer-events-none bg-gray-900/95 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-gray-700 min-w-[170px] max-w-[220px] transform -translate-x-1/2 -translate-y-full transition-all duration-75"
                  style={{ left: hoveredDistrict.x, top: hoveredDistrict.y }}
                >
                  <p className="font-extrabold text-white text-xs">
                    {hoveredDistrict.name}
                  </p>
                  <p className="text-[10px] text-gray-300 font-semibold">
                    {hoveredDistrict.province}
                  </p>
                  <div className="mt-1 pt-1 border-t border-gray-700 space-y-0.5 text-[11px]">
                    <div className="flex justify-between gap-3 text-gray-300">
                      <span>CHWs:</span>
                      <span className="font-bold text-white">
                        {hoveredDistrict.totalChws}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-gray-300">
                      <span>Enrollments:</span>
                      <span className="font-bold text-white">
                        {hoveredDistrict.enrollments}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-gray-300">
                      <span>Completion:</span>
                      <span className="font-bold text-white">
                        {hoveredDistrict.completions}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-gray-300">
                      <span>Certification:</span>
                      <span className="font-bold text-white">
                        {hoveredDistrict.certifications}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3 text-gray-300">
                      <span>Health Centers:</span>
                      <span className="font-bold text-white">
                        {hoveredDistrict.healthCentersCount}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center pointer-events-none">
            <div className="flex items-center gap-6 text-[9px] font-bold text-gray-700">
              <span>0</span>
              <span>30</span>
              <span>60</span>
            </div>
            <div className="w-24 h-1 border-b-2 border-l-2 border-r-2 border-gray-800 flex justify-between">
              <span className="w-0.5 h-1 bg-gray-800 self-end ml-12" />
            </div>
            <span className="text-[9px] font-semibold text-gray-600 mt-0.5">
              kilometers
            </span>
          </div>
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-[#E8EEF4] pt-3 lg:pt-0 lg:pl-4 flex flex-col min-h-0 h-full overflow-hidden min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2.5 shrink-0 min-w-0">
            <h4 className="text-[13px] font-bold text-[#1A2332] tracking-tight truncate">
              Overview
            </h4>
            <div className="relative shrink-0">
              <select
                value={filterMode}
                onChange={(e) =>
                  setFilterMode(e.target.value as OverviewMode)
                }
                className="appearance-none text-[10px] font-semibold bg-white border border-[#B8CDE0] text-[#5B6575] rounded-lg pl-2 pr-6 py-1 focus:outline-none cursor-pointer max-w-[120px]"
              >
                <option value="all">All</option>
                <option value="enrollment">Enrollment</option>
                <option value="completion">Completion</option>
                <option value="certification">Certification</option>
                <option value="healthCenter">Health Center</option>
              </select>
              <ChevronDown
                size={11}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#5B6575] pointer-events-none"
              />
            </div>
          </div>

          <div
            className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain space-y-3 pr-1
              [scrollbar-gutter:stable]
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-track]:bg-[#E8EEF4]
              [&::-webkit-scrollbar-track]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-[#A8B8C8]
              [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {isLoadingData && overviewItems.length === 0 ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-2.5 w-20 rounded bg-[#D7E3F0]" />
                    <div className="h-[14px] w-full rounded bg-[#D7E3F0]" />
                    <div className="h-[14px] w-[70%] rounded bg-[#E8EEF4]" />
                    <div className="h-[14px] w-full rounded bg-[#D7E3F0]" />
                    <div className="h-[14px] w-[85%] rounded bg-[#E8EEF4]" />
                  </div>
                ))}
              </div>
            ) : overviewItems.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-[#9AA3B2]">
                No district data for these filters
              </p>
            ) : (
              overviewItems.map((item) => {
                const isSelected =
                  selectedDistrict.toLowerCase() ===
                  item.district.toLowerCase();
                const bars = overviewBars(
                  item,
                  filterMode,
                  totalChwsAll,
                  totalHealthCentersAll,
                );

                return (
                  <button
                    type="button"
                    key={item.district}
                    onClick={() => toggleDistrictSelection(item.district)}
                    className={`w-full min-w-0 text-left cursor-pointer transition-opacity ${
                      isSelected ? "opacity-100" : "opacity-100 hover:opacity-90"
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-[#1A2332] mb-1 truncate">
                      {item.district}
                    </p>

                    <div className="space-y-1.5 min-w-0">
                      {bars.map((m, i) => {
                        const showBlue =
                          m.bottomLabel != null || m.bottomRight != null;
                        const fillPct = Math.min(
                          100,
                          Math.max(m.barWidth > 0 ? 12 : 0, m.barWidth),
                        );
                        const { tone } = m;

                        // Single bar: count left + % right (completion / certification / solo rows)
                        if (!showBlue) {
                          return (
                            <div
                              key={`${item.district}-${i}`}
                              className="flex items-center gap-1 min-w-0"
                            >
                              <div
                                className="flex-1 min-w-0 h-[14px] flex items-center px-1.5 overflow-hidden"
                                style={{ backgroundColor: tone.track }}
                              >
                                <span
                                  className="text-[9px] font-semibold tabular-nums truncate"
                                  style={{ color: tone.trackText }}
                                >
                                  {m.topLabel}
                                </span>
                              </div>
                              {m.topRight != null && (
                                <span
                                  className="text-[9px] font-medium tabular-nums shrink-0 w-9 text-right"
                                  style={{ color: tone.trackText }}
                                >
                                  {m.topRight}
                                </span>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div key={`${item.district}-${i}`} className="min-w-0">
                            <div className="flex items-center gap-1 mb-1 min-w-0">
                              <div
                                className="flex-1 min-w-0 h-[14px] flex items-center px-1.5 overflow-hidden"
                                style={{ backgroundColor: tone.track }}
                              >
                                <span
                                  className="text-[9px] font-semibold tabular-nums truncate"
                                  style={{ color: tone.trackText }}
                                >
                                  {m.topLabel}
                                </span>
                              </div>
                              {m.topRight != null && (
                                <span
                                  className="text-[9px] font-medium tabular-nums shrink-0 w-9 text-right"
                                  style={{ color: tone.trackText }}
                                >
                                  {m.topRight}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 w-full min-w-0">
                              <div
                                className="flex-1 min-w-0 h-[14px] overflow-hidden"
                                style={{ backgroundColor: tone.fillTrack }}
                              >
                                <div
                                  className="h-full flex items-center px-1.5 overflow-hidden"
                                  style={{
                                    width: `${fillPct}%`,
                                    backgroundColor: tone.fill,
                                  }}
                                >
                                  {m.bottomLabel != null && (
                                    <span className="text-[9px] font-semibold text-white whitespace-nowrap truncate">
                                      {m.bottomLabel}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {m.bottomRight != null && (
                                <span
                                  className="text-[9px] font-medium tabular-nums shrink-0 w-9 text-right"
                                  style={{ color: tone.trackText }}
                                >
                                  {m.bottomRight}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapRegionalOverviewWidgetV2;
