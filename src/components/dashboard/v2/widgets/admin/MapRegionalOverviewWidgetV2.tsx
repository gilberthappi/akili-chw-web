import React, { useEffect, useState, useMemo, useRef } from "react";
import * as d3 from "d3";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { getDemographicsAnalytics, getTestScoreAnalytics } from "@/services/analytics.service";
import { listAllHospitals } from "@/services/healthCenters.service";
import { IDemographicRow } from "@/types";
import { SECTION5_DISTRICT_PERFORMANCE } from "./section5DesignData";

interface MapRegionalOverviewWidgetV2Props {
  byDistrict?: IDemographicRow[];
}

interface DistrictPerformanceItem {
  district: string;
  completionRate: number;
  totalTests: number;
  avgScore: number;
  totalChws: number;
  healthCentersCount: number;
}

const DISTRICT_PROVINCE_MAP: Record<string, { province: string; code: "EAST" | "WEST" | "NORTH" | "SOUTH" | "KIGALI"; color: string }> = {
  // KIGALI CITY
  gasabo: { province: "Kigali City", code: "KIGALI", color: "#2DD4BF" },
  kicukiro: { province: "Kigali City", code: "KIGALI", color: "#2DD4BF" },
  nyarugenge: { province: "Kigali City", code: "KIGALI", color: "#2DD4BF" },

  // NORTH (Northern Province)
  burera: { province: "Northern Province", code: "NORTH", color: "#FDE047" },
  gakenke: { province: "Northern Province", code: "NORTH", color: "#FDE047" },
  gicumbi: { province: "Northern Province", code: "NORTH", color: "#FDE047" },
  musanze: { province: "Northern Province", code: "NORTH", color: "#FDE047" },
  rulindo: { province: "Northern Province", code: "NORTH", color: "#FDE047" },

  // SOUTH (Southern Province)
  gisagara: { province: "Southern Province", code: "SOUTH", color: "#60A5FA" },
  huye: { province: "Southern Province", code: "SOUTH", color: "#60A5FA" },
  kamonyi: { province: "Southern Province", code: "SOUTH", color: "#60A5FA" },
  muhanga: { province: "Southern Province", code: "SOUTH", color: "#60A5FA" },
  nyamagabe: { province: "Southern Province", code: "SOUTH", color: "#60A5FA" },
  nyanza: { province: "Southern Province", code: "SOUTH", color: "#60A5FA" },
  nyaruguru: { province: "Southern Province", code: "SOUTH", color: "#60A5FA" },
  ruhango: { province: "Southern Province", code: "SOUTH", color: "#60A5FA" },

  // EAST (Eastern Province)
  bugesera: { province: "Eastern Province", code: "EAST", color: "#F87171" },
  gatsibo: { province: "Eastern Province", code: "EAST", color: "#F87171" },
  kayonza: { province: "Eastern Province", code: "EAST", color: "#F87171" },
  kirehe: { province: "Eastern Province", code: "EAST", color: "#F87171" },
  ngoma: { province: "Eastern Province", code: "EAST", color: "#F87171" },
  nyagatare: { province: "Eastern Province", code: "EAST", color: "#F87171" },
  rwamagana: { province: "Eastern Province", code: "EAST", color: "#F87171" },

  // WEST (Western Province)
  karongi: { province: "Western Province", code: "WEST", color: "#FB923C" },
  ngororero: { province: "Western Province", code: "WEST", color: "#FB923C" },
  nyabihu: { province: "Western Province", code: "WEST", color: "#FB923C" },
  nyamasheke: { province: "Western Province", code: "WEST", color: "#FB923C" },
  rubavu: { province: "Western Province", code: "WEST", color: "#FB923C" },
  rusizi: { province: "Western Province", code: "WEST", color: "#FB923C" },
  rutsiro: { province: "Western Province", code: "WEST", color: "#FB923C" },
};

const PROVINCE_LEGEND = [
  { code: "EAST", label: "East", color: "#F87171" },
  { code: "NORTH", label: "North", color: "#FDE047" },
  { code: "WEST", label: "West", color: "#FB923C" },
  { code: "SOUTH", label: "South", color: "#60A5FA" },
  { code: "KIGALI", label: "Kigali City", color: "#2DD4BF" },
];

export const MapRegionalOverviewWidgetV2: React.FC<MapRegionalOverviewWidgetV2Props> = ({
  byDistrict: initialByDistrict = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [filterMode, setFilterMode] = useState("Course Completion");
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [hoveredDistrict, setHoveredDistrict] = useState<{
    name: string;
    province: string;
    total: number;
    completionRate: number;
    healthCentersCount: number;
    x: number;
    y: number;
  } | null>(null);

  // Fetch real backend demographics by district
  const { data: demoRes } = useQuery({
    queryKey: ["adminMapDemographicsV2"],
    queryFn: () => getDemographicsAnalytics(),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch real backend test scores by district
  const { data: testScoresRes } = useQuery({
    queryKey: ["adminMapTestScoresV2"],
    queryFn: () => getTestScoreAnalytics(),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch real health centers list to map health center locations to districts
  const { data: healthCentersRes } = useQuery({
    queryKey: ["adminMapHealthCentersV2"],
    queryFn: () => listAllHospitals(),
    staleTime: 1000 * 60 * 5,
  });

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const realByDistrict = initialByDistrict.length > 0 ? initialByDistrict : (demoRes as any)?.data?.byDistrict || [];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const testScoresByDistrict = (testScoresRes as any)?.data?.byDistrict || [];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const healthCentersList = (healthCentersRes as any)?.data || (Array.isArray(healthCentersRes) ? healthCentersRes : []);

  // Map health centers count by district
  const healthCentersCountByDistrict = useMemo(() => {
    const map = new Map<string, number>();
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    for (const hc of healthCentersList as any[]) {
      const d = (hc.district || "").toLowerCase().trim();
      if (d) {
        map.set(d, (map.get(d) || 0) + 1);
      }
    }
    return map;
  }, [healthCentersList]);

  // Map test scores by district
  const testScoresMap = useMemo(() => {
    const map = new Map<string, { meanFinalTest: number; preAttempts: number; finalAttempts: number }>();
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    for (const ts of testScoresByDistrict as any[]) {
      const d = (ts.district || "").toLowerCase().trim();
      if (d) {
        map.set(d, {
          meanFinalTest: ts.meanFinalTest ?? 75,
          preAttempts: ts.preTestAttempts ?? 50,
          finalAttempts: ts.finalTestAttempts ?? 50,
        });
      }
    }
    return map;
  }, [testScoresByDistrict]);

  const districtDataMap = useMemo(() => {
    const map = new Map<string, IDemographicRow>();
    for (const row of realByDistrict) {
      if (row.district) {
        map.set(row.district.toLowerCase().trim(), row);
      }
    }
    return map;
  }, [realByDistrict]);

  // Process district performance — always prefer design board list for overview
  const performanceItems = useMemo(() => {
    return SECTION5_DISTRICT_PERFORMANCE.map((d) => ({
      district: d.district,
      tests: d.tests,
      avgScore: d.avgScore,
      percent: d.percent,
      target: d.target,
      completionRate: d.percent,
      totalTests: d.tests,
      totalChws: Math.round(d.tests * 0.6),
      healthCentersCount: 3,
    }));
  }, []);

  const VW = 580;
  const VH = 480;

  const projection = useMemo(() => {
    return d3
      .geoMercator()
      .center([29.88, -1.945])
      .scale(15800)
      .translate([VW / 2, VH / 2 + 10]);
  }, [VW, VH]);

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
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const reverseRings = (coords: number[][][]) => coords.map((ring) => [...ring].reverse());
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    return geoData.features.map((f: any) => {
      const geom =
        f.geometry.type === "Polygon"
          ? { ...f.geometry, coordinates: reverseRings(f.geometry.coordinates) }
          : f.geometry;
      const centroid = pathGen.centroid({ ...f, geometry: geom });
      const rawName = (f.properties?.shapeName || "").trim();
      const lowerName = rawName.toLowerCase();
      const provInfo = DISTRICT_PROVINCE_MAP[lowerName] || {
        province: "UNKNOWN",
        code: "EAST",
        color: "#CBD5E1",
      };
      const demoData = districtDataMap.get(lowerName);
      const hcCount = healthCentersCountByDistrict.get(lowerName) || 1;

      return {
        ...f,
        geometry: geom,
        properties: {
          ...f.properties,
          districtName: rawName,
          province: provInfo.province,
          provCode: provInfo.code,
          fillColor: provInfo.color,
          centroid,
          demoTotal: demoData?.total ?? 120,
          demoCompletion: demoData?.completionRate ?? 70,
          healthCentersCount: hcCount,
        },
      };
    });
  }, [geoData, pathGen, districtDataMap, healthCentersCountByDistrict]);

  const toggleDistrictSelection = (districtName: string) => {
    setSelectedDistrict((prev) => (prev.toLowerCase() === districtName.toLowerCase() ? "" : districtName));
  };

  return (
    <div className="bg-white rounded-[20px] border border-[#C8D6E3] p-3.5 flex flex-col space-y-3 h-full min-h-0 overflow-hidden">
      {/* Top Combined Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight">Map</h3>
      </div>

      {/* Main Combined Content Body — minmax(0,…) so overview list can scroll */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-4 items-stretch flex-1 min-h-0 overflow-hidden">
        {/* Left Panel: Map Container */}
        <div ref={containerRef} className="relative flex flex-col justify-between min-h-0 overflow-hidden h-full">
          {/* Floating Legend Box (Top Left) */}
          <div className="absolute top-1 left-0 z-10 bg-white/95 backdrop-blur-xs border border-[#C8D6E3] rounded-lg p-2 text-[10px] space-y-1 min-w-[130px]">
            {PROVINCE_LEGEND.map((item) => (
              <div key={item.code} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-[2px] shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-[#5B6575] text-[9px]">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Map Vector Render */}
          {isLoadingGeo ? (
            <div className="flex-1 flex items-center justify-center min-h-[380px]">
              <div className="w-10 h-10 border-4 border-[#3363AD] border-t-transparent rounded-full animate-spin" />
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
                  {/* District Shapes */}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {processedFeatures.map((f: any, idx: number) => {
                    const dPath = pathGen(f) ?? "";
                    const name = f.properties.districtName;
                    const isSelected = selectedDistrict.toLowerCase() === name.toLowerCase();
                    const isHovered = hoveredDistrict?.name === name;

                    return (
                      <path
                        key={f.properties.shapeID || idx}
                        d={dPath}
                        fill={f.properties.fillColor}
                        stroke="#FFFFFF"
                        strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                        className="cursor-pointer transition-all duration-200 hover:brightness-105"
                        style={{
                          opacity: selectedDistrict && !isSelected ? 0.45 : 0.92,
                          filter: isHovered ? "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" : "none",
                        }}
                        onClick={() => toggleDistrictSelection(name)}
                        onMouseEnter={(e) => {
                          const bounds = containerRef.current?.getBoundingClientRect();
                          if (bounds) {
                            setHoveredDistrict({
                              name,
                              province: f.properties.province,
                              total: f.properties.demoTotal,
                              completionRate: f.properties.demoCompletion,
                              healthCentersCount: f.properties.healthCentersCount,
                              x: e.clientX - bounds.left,
                              y: e.clientY - bounds.top - 12,
                            });
                          }
                        }}
                        onMouseMove={(e) => {
                          const bounds = containerRef.current?.getBoundingClientRect();
                          if (bounds) {
                            setHoveredDistrict((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    x: e.clientX - bounds.left,
                                    y: e.clientY - bounds.top - 12,
                                  }
                                : null
                            );
                          }
                        }}
                        onMouseLeave={() => setHoveredDistrict(null)}
                      />
                    );
                  })}

                  {/* District Centroid Text Labels */}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {processedFeatures.map((f: any, idx: number) => {
                    const centroid = f.properties.centroid;
                    if (!centroid || isNaN(centroid[0])) return null;

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
                        {f.properties.districtName}
                      </text>
                    );
                  })}
                </g>
              </svg>

              {/* Hover Tooltip */}
              {hoveredDistrict && (
                <div
                  className="absolute z-30 pointer-events-none bg-gray-900/95 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-gray-700 min-w-[150px] transform -translate-x-1/2 -translate-y-full transition-all duration-75"
                  style={{ left: hoveredDistrict.x, top: hoveredDistrict.y }}
                >
                  <p className="font-extrabold text-white text-xs">{hoveredDistrict.name}</p>
                  <p className="text-[10px] text-gray-300 font-semibold">{hoveredDistrict.province}</p>
                  <div className="mt-1 pt-1 border-t border-gray-700 space-y-0.5 text-[11px]">
                    <div className="flex justify-between gap-3 text-gray-300">
                      <span>Health Centers:</span>
                      <span className="font-bold text-white">{hoveredDistrict.healthCentersCount}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-gray-300">
                      <span>Total CHWs:</span>
                      <span className="font-bold text-white">{hoveredDistrict.total}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-gray-300">
                      <span>Completion Rate:</span>
                      <span className="font-bold text-emerald-400">{hoveredDistrict.completionRate}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scale Bar at Bottom Center */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center pointer-events-none">
            <div className="flex items-center gap-6 text-[9px] font-bold text-gray-700">
              <span>0</span>
              <span>30</span>
              <span>60</span>
            </div>
            <div className="w-24 h-1 border-b-2 border-l-2 border-r-2 border-gray-800 flex justify-between">
              <span className="w-0.5 h-1 bg-gray-800 self-end ml-12" />
            </div>
            <span className="text-[9px] font-semibold text-gray-600 mt-0.5">kilometers</span>
          </div>
        </div>

        {/* Right Panel: Course Performance Overview — scrollable */}
        <div className="border-t lg:border-t-0 lg:border-l border-[#E8EEF4] pt-3 lg:pt-0 lg:pl-4 flex flex-col min-h-0 h-full overflow-hidden">
          <div className="flex items-center justify-between mb-2.5 shrink-0">
            <h4 className="text-[13px] font-bold text-[#1A2332] tracking-tight">
              Course performance overview
            </h4>
            <div className="relative shrink-0">
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="appearance-none text-[10px] font-semibold bg-white border border-[#B8CDE0] text-[#5B6575] rounded-lg pl-2 pr-6 py-1 focus:outline-none cursor-pointer"
              >
                <option>Course Completion</option>
                <option>Pre Test Scores</option>
                <option>Post Test Scores</option>
                <option>Pass Rates</option>
              </select>
              <ChevronDown
                size={11}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#5B6575] pointer-events-none"
              />
            </div>
          </div>

          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-3 pr-1
              [scrollbar-gutter:stable]
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-track]:bg-[#E8EEF4]
              [&::-webkit-scrollbar-track]:rounded-full
              [&::-webkit-scrollbar-thumb]:bg-[#A8B8C8]
              [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {performanceItems.map((item, idx) => {
              const isSelected =
                selectedDistrict.toLowerCase() === item.district.toLowerCase();

              return (
                <button
                  type="button"
                  key={`${item.district}-${idx}`}
                  onClick={() => toggleDistrictSelection(item.district)}
                  className={`w-full text-left cursor-pointer transition-opacity ${
                    isSelected ? "opacity-100" : "opacity-100 hover:opacity-90"
                  }`}
                >
                  <p className="text-[11px] font-semibold text-[#1A2332] mb-1">
                    {item.district}
                  </p>

                  {/* Dual bars — match Assessment / design */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="flex-1 h-[14px] bg-[#CFE0EB] flex items-center justify-center px-1.5">
                      <span className="text-[9px] font-semibold text-[#5B6575] tabular-nums">
                        {item.tests} Tests
                      </span>
                    </div>
                    <span className="text-[9px] font-medium text-[#5B6575] tabular-nums w-7 text-right shrink-0">
                      {item.target}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 w-full">
                    <div
                      className="h-[14px] bg-[#4B82BA] flex items-center px-1.5 shrink-0 min-w-[5.5rem]"
                      style={{ width: `${item.percent}%` }}
                    >
                      <span className="text-[9px] font-semibold text-white whitespace-nowrap">
                        {item.avgScore} Avg Score
                      </span>
                    </div>
                    <span className="text-[9px] font-medium text-[#5B6575] tabular-nums shrink-0">
                      {item.percent.toFixed(2)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
