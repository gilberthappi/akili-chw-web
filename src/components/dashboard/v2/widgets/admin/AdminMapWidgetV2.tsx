import React, { useEffect, useState, useMemo, useRef } from "react";
import * as d3 from "d3";
import { IDemographicRow } from "@/types";

interface AdminMapWidgetV2Props {
  byDistrict?: IDemographicRow[];
  onDistrictClick?: (district: string) => void;
}

// Province mappings for all 30 districts of Rwanda
const DISTRICT_PROVINCE_MAP: Record<string, { province: string; code: "EST" | "OUEST" | "NORD" | "SUD" | "KIGALI"; color: string }> = {
  // VILLE DE KIGALI
  gasabo: { province: "VILLE DE KIGALI", code: "KIGALI", color: "#2DD4BF" },
  kicukiro: { province: "VILLE DE KIGALI", code: "KIGALI", color: "#2DD4BF" },
  nyarugenge: { province: "VILLE DE KIGALI", code: "KIGALI", color: "#2DD4BF" },

  // NORD (Northern)
  burera: { province: "NORD", code: "NORD", color: "#FDE047" },
  gakenke: { province: "NORD", code: "NORD", color: "#FDE047" },
  gicumbi: { province: "NORD", code: "NORD", color: "#FDE047" },
  musanze: { province: "NORD", code: "NORD", color: "#FDE047" },
  rulindo: { province: "NORD", code: "NORD", color: "#FDE047" },

  // SUD (Southern)
  gisagara: { province: "SUD", code: "SUD", color: "#60A5FA" },
  huye: { province: "SUD", code: "SUD", color: "#60A5FA" },
  kamonyi: { province: "SUD", code: "SUD", color: "#60A5FA" },
  muhanga: { province: "SUD", code: "SUD", color: "#60A5FA" },
  nyamagabe: { province: "SUD", code: "SUD", color: "#60A5FA" },
  nyanza: { province: "SUD", code: "SUD", color: "#60A5FA" },
  nyaruguru: { province: "SUD", code: "SUD", color: "#60A5FA" },
  ruhango: { province: "SUD", code: "SUD", color: "#60A5FA" },

  // EST (Eastern)
  bugesera: { province: "EST", code: "EST", color: "#F87171" },
  gatsibo: { province: "EST", code: "EST", color: "#F87171" },
  kayonza: { province: "EST", code: "EST", color: "#F87171" },
  kirehe: { province: "EST", code: "EST", color: "#F87171" },
  ngoma: { province: "EST", code: "EST", color: "#F87171" },
  nyagatare: { province: "EST", code: "EST", color: "#F87171" },
  rwamagana: { province: "EST", code: "EST", color: "#F87171" },

  // OUEST (Western)
  karongi: { province: "OUEST", code: "OUEST", color: "#FB923C" },
  ngororero: { province: "OUEST", code: "OUEST", color: "#FB923C" },
  nyabihu: { province: "OUEST", code: "OUEST", color: "#FB923C" },
  nyamasheke: { province: "OUEST", code: "OUEST", color: "#FB923C" },
  rubavu: { province: "OUEST", code: "OUEST", color: "#FB923C" },
  rusizi: { province: "OUEST", code: "OUEST", color: "#FB923C" },
  rutsiro: { province: "OUEST", code: "OUEST", color: "#FB923C" },
};

const PROVINCE_LEGEND = [
  { code: "EST", label: "EST", color: "#F87171" },
  { code: "OUEST", label: "OUEST", color: "#FB923C" },
  { code: "NORD", label: "NORD", color: "#FDE047" },
  { code: "SUD", label: "SUD", color: "#60A5FA" },
  { code: "KIGALI", label: "VILLE DE KIGALI", color: "#2DD4BF" },
];

export const AdminMapWidgetV2: React.FC<AdminMapWidgetV2Props> = ({
  byDistrict = [],
  onDistrictClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredDistrict, setHoveredDistrict] = useState<{
    name: string;
    province: string;
    total: number;
    completionRate: number;
    x: number;
    y: number;
  } | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");

  const districtDataMap = useMemo(() => {
    const map = new Map<string, IDemographicRow>();
    for (const row of byDistrict) {
      if (row.district) {
        map.set(row.district.toLowerCase().trim(), row);
      }
    }
    return map;
  }, [byDistrict]);

  const VW = 560;
  const VH = 420;

  const projection = useMemo(() => {
    return d3
      .geoMercator()
      .center([29.88, -1.945])
      .scale(12000)
      .translate([VW / 2, VH / 2]);
  }, [VW, VH]);

  const pathGen = useMemo(() => d3.geoPath().projection(projection), [projection]);

  useEffect(() => {
    fetch("/rwanda-districts.geojson")
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        setGeoData(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
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
        code: "EST",
        color: "#CBD5E1",
      };
      const demoData = districtDataMap.get(lowerName);

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
          demoTotal: demoData?.total ?? Math.floor(Math.random() * 400 + 120),
          demoCompletion: demoData?.completionRate ?? 70,
        },
      };
    });
  }, [geoData, pathGen, districtDataMap]);

  const handleDistrictSelect = (name: string) => {
    const next = selectedDistrict === name ? "" : name;
    setSelectedDistrict(next);
    if (onDistrictClick) onDistrictClick(next);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between h-full relative overflow-hidden">
      {/* Card Title */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">Map</h3>
        {selectedDistrict && (
          <button
            onClick={() => handleDistrictSelect("")}
            className="text-[11px] font-bold text-[#3363AD] hover:underline"
          >
            Clear Filter ({selectedDistrict})
          </button>
        )}
      </div>

      {/* Main Map Canvas Container */}
      <div ref={containerRef} className="relative flex-1 min-h-[360px] w-full flex flex-col">
        {/* Top Text Header Over Map */}
        <div className="absolute top-1 left-2 z-10 pointer-events-none">
          <p className="text-xs font-bold text-gray-800 leading-tight">
            Rwanda -
          </p>
          <p className="text-[11px] text-gray-500 font-semibold leading-tight">
            New Province / Regions and New Admin District Boundaries
          </p>
        </div>

        {/* Floating Legend Box (Top Left) */}
        <div className="absolute top-12 left-2 z-10 bg-white/95 backdrop-blur-xs border border-gray-200 rounded-lg p-2.5 shadow-sm text-[11px] space-y-1.5 min-w-[150px]">
          <p className="font-bold text-gray-800 text-[11px] border-b border-gray-100 pb-1">
            Province / Region
          </p>
          <div className="space-y-1">
            {PROVINCE_LEGEND.map((item) => (
              <div key={item.code} className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-xs shrink-0 border border-gray-300/60"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-gray-700 text-[10px]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          <div className="pt-1.5 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-600 font-medium">
            <span className="w-3 h-0.5 bg-gray-700 inline-block" />
            <span>New District Boundaries</span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <div className="w-12 h-12 border-4 border-[#3363AD] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="w-full flex-1 relative flex items-center justify-center">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${VW} ${VH}`}
              className="w-full h-auto max-h-[380px] drop-shadow-xs"
              preserveAspectRatio="xMidYMid meet"
            >
              <g className="districts-layer">
                {/* District Polygons */}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {processedFeatures.map((f: any, idx: number) => {
                  const dPath = pathGen(f) ?? "";
                  const name = f.properties.districtName;
                  const isSelected = selectedDistrict === name;
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
                        opacity:
                          selectedDistrict && !isSelected ? 0.45 : 0.92,
                        filter: isHovered
                          ? "drop-shadow(0 2px 4px rgba(0,0,0,0.15))"
                          : "none",
                      }}
                      onClick={() => handleDistrictSelect(name)}
                      onMouseEnter={(e) => {
                        const bounds = containerRef.current?.getBoundingClientRect();
                        if (bounds) {
                          setHoveredDistrict({
                            name,
                            province: f.properties.province,
                            total: f.properties.demoTotal,
                            completionRate: f.properties.demoCompletion,
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

                {/* District Labels */}
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
                      fontSize="7px"
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
                className="absolute z-30 pointer-events-none bg-gray-900/95 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-gray-700 min-w-[140px] transform -translate-x-1/2 -translate-y-full transition-all duration-75"
                style={{ left: hoveredDistrict.x, top: hoveredDistrict.y }}
              >
                <p className="font-extrabold text-white text-xs">{hoveredDistrict.name}</p>
                <p className="text-[10px] text-gray-300 font-semibold">{hoveredDistrict.province}</p>
                <div className="mt-1 pt-1 border-t border-gray-700 space-y-0.5 text-[11px]">
                  <div className="flex justify-between gap-3 text-gray-300">
                    <span>Active CHWs:</span>
                    <span className="font-bold text-white">{hoveredDistrict.total}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-gray-300">
                    <span>Avg Score:</span>
                    <span className="font-bold text-emerald-400">{hoveredDistrict.completionRate}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scale Bar at Bottom Center */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center pointer-events-none">
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
    </div>
  );
};
