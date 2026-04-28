import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { MapPin } from "lucide-react";
import { Card } from "@/components/common/Card";
import { DashboardSectionHeader } from "./shared/DashboardSectionHeader";
import { IDemographicRow } from "@/types";

interface RwandaDistrictMapProps {
  byDistrict: IDemographicRow[];
  activeDistrict: string;
  onDistrictClick: (district: string) => void;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  district: string;
  total: number;
  completionRate: number;
  certificationRate: number;
}

export const RwandaDistrictMap: React.FC<RwandaDistrictMapProps> = ({
  byDistrict,
  activeDistrict,
  onDistrictClick,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0,
    district: "", total: 0, completionRate: 0, certificationRate: 0,
  });
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/rwanda-districts.geojson")
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        setGeoData(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const districtDataMap = React.useMemo(() => {
    const map = new Map<string, IDemographicRow>();
    for (const row of byDistrict) {
      if (row.district) map.set(row.district, row);
    }
    return map;
  }, [byDistrict]);

  const drawMap = useCallback(() => {
    if (!geoData || !svgRef.current) return;

    // Fixed logical viewport — SVG scales itself via viewBox + CSS width:100%
    const VW = 480;
    const VH = 346;
    const PAD = 16;

    const svg = d3.select(svgRef.current);
    svg
      .attr("viewBox", `0 0 ${VW} ${VH}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto")
      .style("display", "block")
      .style("overflow", "hidden");
    svg.selectAll("*").remove();

    // White background so any blue district fill is clearly visible
    svg.append("rect")
      .attr("width", VW)
      .attr("height", VH)
      .attr("fill", "#f8fafc");

    const projection = d3.geoMercator()
      .center([29.88, -1.945])
      .scale(9800)
      .translate([VW / 2, VH / 2]);

    const reverseRings = (coords: number[][][]) => coords.map(ring => [...ring].reverse());
    const rewindFeatures = geoData.features.map(f => ({
      ...f,
      geometry: f.geometry.type === "Polygon"
        ? { ...f.geometry, coordinates: reverseRings((f.geometry as GeoJSON.Polygon).coordinates) }
        : f.geometry,
    }));
    const rewindData: GeoJSON.FeatureCollection = { ...geoData, features: rewindFeatures };

    const pathGen = d3.geoPath().projection(projection);

    const colorScale = d3.scaleSequential()
      .domain([0, 100])
      .interpolator(d3.interpolate("#93c5fd", "#1e3a8a"));

    const g = svg.append("g").attr("class", "districts");

    g.selectAll("path")
      .data((rewindData as GeoJSON.FeatureCollection).features)
      .enter()
      .append("path")
      .attr("d", (d) => pathGen(d as GeoJSON.Feature) ?? "")
      .attr("fill", (d) => {
        const name = (d as GeoJSON.Feature).properties?.shapeName as string;
        const row = districtDataMap.get(name);
        // Bright blue for no-data — clearly visible on white background
        return row ? colorScale(row.completionRate) : "#60a5fa";
      })
      .attr("stroke", (d) => {
        const name = (d as GeoJSON.Feature).properties?.shapeName as string;
        return name === activeDistrict ? "#1d4ed8" : "#ffffff";
      })
      .attr("stroke-width", (d) => {
        const name = (d as GeoJSON.Feature).properties?.shapeName as string;
        return name === activeDistrict ? 2.5 : 1;
      })
      .attr("cursor", "pointer")
      .attr("opacity", (d) => {
        if (!activeDistrict) return 1;
        const name = (d as GeoJSON.Feature).properties?.shapeName as string;
        return name === activeDistrict ? 1 : 0.6;
      })
      .on("mouseenter", function (event: MouseEvent, d) {
        const name = (d as GeoJSON.Feature).properties?.shapeName as string;
        const row = districtDataMap.get(name);
        const cr = containerRef.current!.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: event.clientX - cr.left,
          y: event.clientY - cr.top - 10,
          district: name,
          total: row?.total ?? 0,
          completionRate: row?.completionRate ?? 0,
          certificationRate: row?.certificationRate ?? 0,
        });
        d3.select(this).attr("stroke", "#1d4ed8").attr("stroke-width", 2);
      })
      .on("mousemove", function (event: MouseEvent) {
        const cr = containerRef.current!.getBoundingClientRect();
        setTooltip((p) => ({
          ...p,
          x: event.clientX - cr.left,
          y: event.clientY - cr.top - 10,
        }));
      })
      .on("mouseleave", function (_event: MouseEvent, d) {
        const name = (d as GeoJSON.Feature).properties?.shapeName as string;
        setTooltip((p) => ({ ...p, visible: false }));
        d3.select(this)
          .attr("stroke", name === activeDistrict ? "#1d4ed8" : "#ffffff")
          .attr("stroke-width", name === activeDistrict ? 2.5 : 1);
      })
      .on("click", (_event: MouseEvent, d) => {
        const name = (d as GeoJSON.Feature).properties?.shapeName as string;
        onDistrictClick(name === activeDistrict ? "" : name);
      });
  }, [geoData, districtDataMap, activeDistrict, onDistrictClick]);

  // Draw once when geoData arrives — no layout timing dependency
  useEffect(() => {
    if (!geoData) return;
    drawMap();
  }, [geoData, drawMap]);

  return (
    <Card padding={false}>
      <div className="p-4 pb-2">
        <DashboardSectionHeader
          icon={<MapPin size={16} />}
          title="Service Coverage Map"
        />
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-40 h-40 bg-gray-100 rounded-full animate-pulse" />
        </div>
      ) : !geoData ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">
          Failed to load map
        </div>
      ) : (
        <div ref={containerRef} className="relative w-full">
          {/* SVG has no width/height attrs — viewBox + CSS width:100% handles scaling */}
          <svg ref={svgRef} style={{ width: "100%", height: "auto", display: "block" }} />

          {tooltip.visible && (
            <div
              className="absolute pointer-events-none z-10 bg-white border
                border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs"
              style={{ left: tooltip.x + 12, top: tooltip.y }}
            >
              <p className="font-semibold text-gray-800 mb-1">{tooltip.district}</p>
              <p className="text-gray-600">
                Learners:{" "}
                <span className="font-medium">{tooltip.total.toLocaleString()}</span>
              </p>
              <p className="text-gray-600">
                Completion:{" "}
                <span className={`font-medium ${
                  tooltip.completionRate >= 60 ? "text-green-600"
                  : tooltip.completionRate >= 30 ? "text-amber-600"
                  : "text-red-500"
                }`}>
                  {tooltip.completionRate}%
                </span>
              </p>
              <p className="text-gray-600">
                Certification:{" "}
                <span className="font-medium text-[#3363AD]">
                  {tooltip.certificationRate}%
                </span>
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 pb-1 pt-2">
            <span className="text-xs text-gray-400">0%</span>
            <div
              className="flex-1 h-2 rounded-full"
              style={{
                background: "linear-gradient(to right, #bfdbfe, #1e40af)",
              }}
            />
            <span className="text-xs text-gray-400">100%</span>
            <span className="text-xs text-gray-500 ml-1">Course Completion</span>
          </div>

          {activeDistrict && (
            <div className="px-4 pb-2">
              <span className="inline-flex items-center gap-1.5 bg-blue-50
                text-[#3363AD] text-xs px-2.5 py-1 rounded-full">
                <MapPin size={10} />
                {activeDistrict}
                <button
                  onClick={() => onDistrictClick("")}
                  className="hover:text-red-500 transition-colors ml-0.5"
                >
                  ×
                </button>
              </span>
            </div>
          )}

          <p className="text-xs text-gray-300 px-4 pb-2">
            Map: geoBoundaries (CC BY 4.0)
          </p>
        </div>
      )}
    </Card>
  );
};
