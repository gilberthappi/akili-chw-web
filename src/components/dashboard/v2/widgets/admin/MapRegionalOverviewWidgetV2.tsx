import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import * as d3 from "d3";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Activity,
  Award,
  Building2,
  CheckCircle,
  Library,
  Users,
} from "lucide-react";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import {
  MapDistrictOverview,
  useAdminDashboardV2MapOverview,
} from "@/hooks/useAdminDashboardV2MapOverview";
import {
  getActiveLearnerMap,
  type IActiveLearnerPoint,
} from "@/services/attendance.service";
import { V2_CARD_SHELL_PADDED } from "./v2CardStyles";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));

/** Map density metric (classic-style choropleth). */
type MapMetric =
  | "learners"
  | "enrollment"
  | "completion"
  | "certification"
  | "healthCenter";

type OverviewMode = "all" | Exclude<MapMetric, "learners">;

const MAP_METRICS: {
  key: MapMetric;
  label: string;
  unit: "count" | "%";
  Icon: React.FC<{ size?: number; className?: string }>;
}[] = [
  { key: "learners", label: "Learners", unit: "count", Icon: Users },
  { key: "enrollment", label: "Enrollment", unit: "count", Icon: Library },
  { key: "completion", label: "Completion", unit: "%", Icon: CheckCircle },
  { key: "certification", label: "Certification", unit: "%", Icon: Award },
  { key: "healthCenter", label: "Health Centers", unit: "count", Icon: Building2 },
];

const getMetricValue = (
  d: MapDistrictOverview | undefined,
  metric: MapMetric,
): number => {
  if (!d) return 0;
  switch (metric) {
    case "learners":
      return d.totalChws;
    case "enrollment":
      return d.enrollments;
    case "completion":
      return d.completionRate;
    case "certification":
      return d.certificationRate;
    case "healthCenter":
      return d.healthCentersCount;
  }
};

const EMPTY_FILL = "#E2E8F0";

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
    fill: "#B8C0CE",
    fillTrack: "#E8EBF0",
  },
};

type OverviewBar = {
  topLabel: string;
  /** Right of top row — omit to hide */
  topRight?: string;
  /** Top track fill width 0–100 */
  topBarWidth: number;
  /** Blue bar label — omit to hide the blue row entirely */
  bottomLabel?: string;
  /** Right of blue row — omit to hide */
  bottomRight?: string;
  /** Blue bar width 0–100 */
  barWidth: number;
  tone: OverviewBarTone;
};

const pctOf = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 1000) / 10 : 0;

const singleModeBar = (
  d: MapDistrictOverview,
  mode: Exclude<OverviewMode, "all">,
  totalChwsAll: number,
  totalHealthCentersAll: number,
  maxEnrollments: number,
  /** In "All", CHWs only on Health centers — avoid duplicate CHW bars */
  includeChws = true,
): OverviewBar => {
  const tone = BAR_TONES[mode];
  switch (mode) {
    case "enrollment": {
      const enrollPct = pctOf(d.enrollments, maxEnrollments);
      const chwPct = pctOf(d.totalChws, totalChwsAll);
      return includeChws
        ? {
            topLabel: `${d.enrollments} Enrollments`,
            topRight: `${enrollPct}%`,
            topBarWidth: enrollPct,
            bottomLabel: `${d.totalChws} CHWs`,
            bottomRight: `${chwPct}%`,
            barWidth: chwPct,
            tone,
          }
        : {
            topLabel: `${d.enrollments} Enrollments`,
            topRight: `${enrollPct}%`,
            topBarWidth: enrollPct,
            barWidth: 0,
            tone,
          };
    }
    case "completion": {
      const rate = Math.min(100, Math.max(0, d.avgFinalTestScore));
      return {
        topLabel: `${d.completions} Completions`,
        topRight: `${rate}%`,
        topBarWidth: rate,
        barWidth: 0,
        tone,
      };
    }
    case "certification": {
      const rate = Math.min(100, Math.max(0, d.avgFinalExamScore));
      return {
        topLabel: `${d.certifications} Certificates`,
        topRight: `${rate}%`,
        topBarWidth: rate,
        barWidth: 0,
        tone,
      };
    }
    case "healthCenter": {
      const hcPct = pctOf(d.healthCentersCount, totalHealthCentersAll);
      const chwPct = pctOf(d.totalChws, totalChwsAll);
      return includeChws
        ? {
            topLabel: `${d.healthCentersCount} Health centers`,
            topRight: `${hcPct}%`,
            topBarWidth: hcPct,
            bottomLabel: `${d.totalChws} CHWs`,
            bottomRight: `${chwPct}%`,
            barWidth: chwPct,
            tone,
          }
        : {
            topLabel: `${d.healthCentersCount} Health centers`,
            topRight: `${hcPct}%`,
            topBarWidth: hcPct,
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
  maxEnrollments: number,
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
        maxEnrollments,
        m === "healthCenter",
      ),
    );
  }
  return [
    singleModeBar(
      d,
      mode,
      totalChwsAll,
      totalHealthCentersAll,
      maxEnrollments,
      true,
    ),
  ];
};

type DistrictShapeProps = {
  districtName: string;
  province: string;
  fillColor: string;
  metricValue: number;
  demoTotal: number;
  enrollments: number;
  completions: number;
  certifications: number;
  healthCentersCount: number;
};

/** Real latitude and longitude, with zoom. District coloring stays on the shapes. */
function DistrictZoomMap({
  collection,
  selectedDistrict,
  showActive,
  points,
  onSelect,
  onHover,
  onLeave,
}: {
  collection: GeoJSON.FeatureCollection;
  selectedDistrict: string;
  showActive: boolean;
  points: IActiveLearnerPoint[];
  onSelect: (districtName: string) => void;
  onHover: (district: DistrictShapeProps & { x: number; y: number }) => void;
  onLeave: () => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.GeoJSON | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const settled = useRef(false);
  const pointsRef = useRef(points);
  const showActiveRef = useRef(showActive);
  pointsRef.current = points;
  showActiveRef.current = showActive;
  const handlers = useRef({ onSelect, onHover, onLeave });
  handlers.current = { onSelect, onHover, onLeave };

  const paintScale = (map: L.Map) => {
    const line = map.getContainer().querySelector<HTMLElement>(".leaflet-control-scale-line");
    if (!line) return;
    const y = map.getSize().y / 2;
    const meters = map.distance(
      map.containerPointToLatLng([0, y]),
      map.containerPointToLatLng([100, y]),
    );
    line.style.width = "100px";
    line.textContent = `${Math.round(meters / 1000)} km`;
  };

  const applyDefaultView = () => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer || settled.current || !layer.getBounds().isValid()) return;
    map.invalidateSize();
    map.fitBounds(layer.getBounds(), { padding: [16, 16], animate: false });
    const lat = (map.getCenter().lat * Math.PI) / 180;
    const zoom = Math.log2((156543.03392 * Math.cos(lat) * 100) / 33000);
    const snap = map.options.zoomSnap;
    map.options.zoomSnap = 0;
    map.setZoom(zoom, { animate: false });
    map.options.zoomSnap = snap;
    paintScale(map);
  };

  const paintMarkers = () => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current?.remove();
    markersRef.current = null;
    if (!showActiveRef.current) return;
    const group = L.layerGroup();
    pointsRef.current.forEach((point) => {
      const place = [point.healthCenterName, point.district].filter(Boolean).join(" · ");
      L.circleMarker([point.latitude, point.longitude], {
        radius: 6,
        color: "#047857",
        weight: 2,
        fillColor: "#10b981",
        fillOpacity: 0.95,
      })
        .bindPopup(
          `<strong>${escapeHtml(point.fullNames)}</strong>${
            place ? `<br/>${escapeHtml(place)}` : ""
          }<br/>Last active ${escapeHtml(point.lastActiveDay)}`,
        )
        .addTo(group);
    });
    group.addTo(map);
    markersRef.current = group;
  };

  useEffect(() => {
    const node = frame.current;
    if (!node || mapRef.current) return;
    const map = L.map(node, { zoomControl: true, zoomSnap: 0.25 }).setView([-1.94, 29.87], 8);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);
    L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);
    map.on("zoomend moveend", () => paintScale(map));
    map.on("dragstart", () => {
      settled.current = true;
    });
    map.on("zoomstart", (event) => {
      if ((event as L.LeafletEvent & { originalEvent?: Event }).originalEvent) settled.current = true;
    });
    mapRef.current = map;
    const observer = new ResizeObserver(() => applyDefaultView());
    observer.observe(node);
    const timer = window.setTimeout(() => {
      applyDefaultView();
      settled.current = true;
    }, 350);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      settled.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layerRef.current?.remove();
    const selected = selectedDistrict.trim().toLowerCase();
    const layer = L.geoJSON(collection, {
      style: (feature) => {
        const name = String(feature?.properties?.districtName ?? "");
        const isSelected = selected !== "" && selected === name.toLowerCase();
        return {
          color: isSelected ? "#1e3a8a" : "#ffffff",
          weight: isSelected ? 2.5 : 1,
          fillColor: String(feature?.properties?.fillColor ?? EMPTY_FILL),
          fillOpacity: showActiveRef.current
            ? 0.22
            : selected !== "" && !isSelected
              ? 0.35
              : 0.72,
        };
      },
      onEachFeature: (feature, shape) => {
        const props = feature.properties as DistrictShapeProps;
        const point = (event: L.LeafletMouseEvent) => {
          const bounds = frame.current?.getBoundingClientRect();
          if (!bounds) return null;
          return {
            ...props,
            x: event.originalEvent.clientX - bounds.left,
            y: event.originalEvent.clientY - bounds.top - 12,
          };
        };
        shape.on({
          click: () => handlers.current.onSelect(props.districtName),
          mouseover: (event: L.LeafletMouseEvent) => {
            const hover = point(event);
            if (hover) handlers.current.onHover(hover);
          },
          mousemove: (event: L.LeafletMouseEvent) => {
            const hover = point(event);
            if (hover) handlers.current.onHover(hover);
          },
          mouseout: () => handlers.current.onLeave(),
        });
      },
    }).addTo(map);
    layerRef.current = layer;
    paintMarkers();
    applyDefaultView();
  }, [collection, selectedDistrict, showActive]);

  useEffect(() => {
    paintMarkers();
  }, [points, showActive]);

  return <div ref={frame} className="absolute inset-0 z-0" />;
}

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

  /** Choropleth metric, or the Active tab that plots recent CHWs. */
  const [mapView, setMapView] = useState<MapMetric | "active">("learners");
  const showingActive = mapView === "active";
  const mapMetric: MapMetric = showingActive ? "learners" : mapView;
  const filterMode: OverviewMode =
    mapMetric === "learners" ? "all" : mapMetric;
  const activeMetricConfig =
    MAP_METRICS.find((m) => m.key === mapMetric) ?? MAP_METRICS[0];
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  /** Map/overview-only selection — does not write global filters. */
  const [localDistrict, setLocalDistrict] = useState("");
  const globalDistrict = filters.district ?? "";
  /** Global district wins; otherwise use map click selection. */
  const selectedDistrict = globalDistrict || localDistrict;

  const pointFilters = useMemo(
    () => ({
      district: filters.district || undefined,
      healthCenterId: filters.healthCenterId || undefined,
      gender: filters.gender || undefined,
    }),
    [filters.district, filters.healthCenterId, filters.gender],
  );
  const { data: activeMap, isLoading: activeLoading, isError: activeError } = useQuery({
    queryKey: ["attendance", "map", pointFilters],
    queryFn: () => getActiveLearnerMap(pointFilters),
    enabled: showingActive,
    staleTime: 60_000,
  });
  const activePoints = useMemo(() => {
    const rows = activeMap?.data ?? [];
    const district = selectedDistrict.trim().toLowerCase();
    if (!district) return rows;
    return rows.filter((point) => (point.district ?? "").toLowerCase() === district);
  }, [activeMap, selectedDistrict]);
  const [hoveredDistrict, setHoveredDistrict] = useState<{
    name: string;
    province: string;
    totalChws: number;
    enrollments: number;
    completions: number;
    certifications: number;
    healthCentersCount: number;
    metricValue: number;
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
  const maxEnrollments = useMemo(
    () =>
      districts.reduce((max, d) => Math.max(max, d.enrollments), 0),
    [districts],
  );

  const metricDomain = useMemo((): [number, number] => {
    if (activeMetricConfig.unit === "%") return [0, 100];
    let max = 1;
    for (const d of districts) {
      max = Math.max(max, getMetricValue(d, mapMetric));
    }
    return [0, max];
  }, [districts, mapMetric, activeMetricConfig.unit]);

  const colorScale = useMemo(
    () =>
      d3
        .scaleSequential<string>()
        .domain(metricDomain)
        .interpolator(d3.interpolate("#93c5fd", "#1e3a8a")),
    [metricDomain],
  );

  const formatMetricValue = useCallback(
    (value: number): string => {
      if (value <= 0) return "—";
      return activeMetricConfig.unit === "%"
        ? `${Math.round(value * 10) / 10}%`
        : value.toLocaleString();
    },
    [activeMetricConfig.unit],
  );

  const legendMin = activeMetricConfig.unit === "%" ? "0%" : "0";
  const legendMax =
    activeMetricConfig.unit === "%"
      ? "100%"
      : Math.floor(metricDomain[1]).toLocaleString();

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

  useEffect(() => {
    fetch("/rwanda-districts.geojson")
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) => {
        setGeoData(data);
        setIsLoadingGeo(false);
      })
      .catch(() => setIsLoadingGeo(false));
  }, []);

  const styledCollection = useMemo(() => {
    if (!geoData) return null;
    return {
      type: "FeatureCollection" as const,
      features: geoData.features.map((feature) => {
        const rawName = String(
          (feature.properties as { shapeName?: string } | null)?.shapeName || "",
        ).trim();
        const lowerName = rawName.toLowerCase();
        const provInfo = DISTRICT_PROVINCE_MAP[lowerName] || {
          province: "UNKNOWN",
          code: "EAST" as const,
          color: "#CBD5E1",
        };
        const metrics = districtByKey.get(lowerName);
        const value = getMetricValue(metrics, mapMetric);
        return {
          ...feature,
          properties: {
            ...(feature.properties ?? {}),
            districtName: rawName,
            province: provInfo.province,
            fillColor: value <= 0 ? EMPTY_FILL : colorScale(value),
            metricValue: value,
            demoTotal: metrics?.totalChws ?? 0,
            enrollments: metrics?.enrollments ?? 0,
            completions: metrics?.completions ?? 0,
            certifications: metrics?.certifications ?? 0,
            healthCentersCount: metrics?.healthCentersCount ?? 0,
          },
        };
      }),
    } satisfies GeoJSON.FeatureCollection;
  }, [geoData, districtByKey, mapMetric, colorScale]);

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
    <div className={`${V2_CARD_SHELL_PADDED} flex flex-col space-y-3 h-full min-h-0 overflow-hidden`}>
      <div className="flex flex-col gap-2 shrink-0">
        <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight">
          Map
        </h3>
        <div
          className="flex items-center gap-2 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {MAP_METRICS.map((metric) => {
            const Icon = metric.Icon;
            const isActive = mapView === metric.key;
            return (
              <button
                key={metric.key}
                type="button"
                onClick={() => setMapView(metric.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? "bg-[#3363AD] text-white border-[#3363AD] shadow-sm"
                    : "bg-white text-gray-500 border-gray-200 hover:border-[#3363AD] hover:text-[#3363AD]"
                }`}
              >
                <Icon size={11} />
                {metric.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMapView("active")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all border shrink-0 ${
              showingActive
                ? "bg-[#047857] text-white border-[#047857] shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-[#047857] hover:text-[#047857]"
            }`}
          >
            <Activity size={11} />
            Active
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-3 items-stretch flex-1 min-h-0 overflow-hidden">
        <div
          ref={containerRef}
          className="relative flex flex-col justify-between min-h-0 overflow-hidden h-full"
        >
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center min-h-[380px] animate-pulse px-6">
              <div className="w-full max-w-[320px] aspect-square rounded-[40%] bg-[#E8EEF4] relative overflow-hidden">
                <div className="absolute inset-[12%] rounded-[36%] bg-[#D7E3F0]/80" />
                <div className="absolute inset-[28%] rounded-[32%] bg-[#C8D6E3]/70" />
              </div>
            </div>
          ) : styledCollection ? (
            <>
              <DistrictZoomMap
                collection={styledCollection}
                selectedDistrict={selectedDistrict}
                showActive={showingActive}
                points={activePoints}
                onSelect={toggleDistrictSelection}
                onHover={(district) =>
                  setHoveredDistrict({
                    name: district.districtName,
                    province: district.province,
                    totalChws: district.demoTotal,
                    enrollments: district.enrollments,
                    completions: district.completions,
                    certifications: district.certifications,
                    healthCentersCount: district.healthCentersCount,
                    metricValue: district.metricValue,
                    x: district.x,
                    y: district.y,
                  })
                }
                onLeave={() => setHoveredDistrict(null)}
              />

              {hoveredDistrict && (
                <div
                  className="absolute z-[1200] pointer-events-none bg-white border border-gray-200 rounded-lg shadow-xl px-3 py-2.5 text-xs min-w-[168px] max-w-[220px] transform -translate-x-1/2 -translate-y-full transition-all duration-75"
                  style={{ left: hoveredDistrict.x, top: hoveredDistrict.y }}
                >
                  <p className="font-bold text-gray-900 text-[13px]">
                    {hoveredDistrict.name}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {hoveredDistrict.province}
                  </p>
                  {hoveredDistrict.metricValue > 0 && (
                    <p className="text-[#3363AD] font-semibold text-[12px] mt-0.5 mb-2">
                      {activeMetricConfig.label}:{" "}
                      {formatMetricValue(hoveredDistrict.metricValue)}
                    </p>
                  )}
                  <div className="space-y-1 border-t border-gray-100 pt-2 text-[11px]">
                    {mapMetric !== "learners" && (
                      <div className="flex justify-between gap-3 text-gray-500">
                        <span>Learners</span>
                        <span className="font-semibold text-gray-700">
                          {hoveredDistrict.totalChws.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {mapMetric !== "enrollment" && (
                      <div className="flex justify-between gap-3 text-gray-500">
                        <span>Enrollments</span>
                        <span className="font-semibold text-gray-700">
                          {hoveredDistrict.enrollments.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {mapMetric !== "completion" && (
                      <div className="flex justify-between gap-3 text-gray-500">
                        <span>Completions</span>
                        <span className="font-semibold text-gray-700">
                          {hoveredDistrict.completions.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {mapMetric !== "certification" && (
                      <div className="flex justify-between gap-3 text-gray-500">
                        <span>Certificates</span>
                        <span className="font-semibold text-gray-700">
                          {hoveredDistrict.certifications.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {mapMetric !== "healthCenter" && (
                      <div className="flex justify-between gap-3 text-gray-500">
                        <span>Health Centers</span>
                        <span className="font-semibold text-gray-700">
                          {hoveredDistrict.healthCentersCount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* Density legend + scale */}
          <div className="absolute bottom-2 right-2 z-[1000] pointer-events-none">
            <div className="flex items-end justify-end">
              <div className="bg-white/90 rounded-md border border-gray-100 px-2.5 py-1.5 min-w-[140px]">
                {showingActive ? (
                  <p className="text-[10px] font-medium text-gray-600 flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#10b981]" />
                    Active · {activePoints.length}
                  </p>
                ) : (
                <>
                <p className="text-[10px] font-medium text-gray-600 mb-1 truncate">
                  {activeMetricConfig.label}
                </p>
                <div
                  className="h-2 w-full rounded-sm"
                  style={{
                    background:
                      "linear-gradient(to right, #93c5fd, #1e3a8a)",
                  }}
                />
                <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
                  <span>{legendMin}</span>
                  <span>{legendMax}</span>
                </div>
                </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-[#E8EEF4] pt-3 lg:pt-0 lg:pl-4 flex flex-col min-h-0 h-full overflow-hidden min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2.5 shrink-0 min-w-0">
            <h4 className="text-[13px] font-bold text-[#1A2332] tracking-tight truncate">
              Overview
            </h4>
            <span className="text-[10px] font-semibold text-[#5B6575] truncate">
              {showingActive
                ? "Last 7 days"
                : mapMetric === "learners"
                  ? "All metrics"
                  : activeMetricConfig.label}
            </span>
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
            {showingActive ? (
              activeLoading ? (
                <div className="space-y-2 animate-pulse">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="h-8 rounded bg-[#E8EEF4]" />
                  ))}
                </div>
              ) : activeError ? (
                <p className="py-8 text-center text-[12px] text-red-500">
                  Could not load active CHWs
                </p>
              ) : activePoints.length === 0 ? (
                <p className="py-8 text-center text-[12px] text-[#9AA3B2]">
                  No active CHWs with a recent location
                </p>
              ) : (
                activePoints.map((point) => (
                  <div key={point.userId} className="min-w-0">
                    <p className="text-[11px] font-semibold text-[#1A2332] truncate">
                      {point.fullNames}
                    </p>
                    <p className="text-[10px] text-[#5B6575] truncate">
                      {[point.healthCenterName, point.district].filter(Boolean).join(" · ") || "—"}
                    </p>
                    <p className="text-[10px] text-[#047857]">{point.lastActiveDay}</p>
                  </div>
                ))
              )
            ) : isLoadingData && overviewItems.length === 0 ? (
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
                  maxEnrollments,
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
                        const topFill = Math.min(
                          100,
                          Math.max(0, m.topBarWidth),
                        );
                        const bottomFill = Math.min(
                          100,
                          Math.max(0, m.barWidth),
                        );
                        const { tone } = m;

                        return (
                          <div key={`${item.district}-${i}`} className="min-w-0">
                            <div className="flex items-center gap-1 min-w-0">
                              <div
                                className="relative flex-1 min-w-0 h-[16px] overflow-hidden"
                                style={{ backgroundColor: tone.fillTrack }}
                              >
                                <div
                                  className="absolute inset-y-0 left-0"
                                  style={{
                                    width: `${topFill}%`,
                                    backgroundColor: tone.track,
                                  }}
                                />
                                <span
                                  className="relative z-10 block h-full px-1.5 text-[9px] font-semibold tabular-nums truncate leading-[16px]"
                                  style={{ color: tone.trackText }}
                                >
                                  {m.topLabel}
                                </span>
                              </div>
                              {m.topRight != null && (
                                <span
                                  className="text-[9px] font-semibold tabular-nums shrink-0 w-9 text-right"
                                  style={{ color: tone.trackText }}
                                >
                                  {m.topRight}
                                </span>
                              )}
                            </div>

                            {showBlue && (
                              <div className="flex items-center gap-1 w-full min-w-0 mt-1">
                                <div
                                  className="relative flex-1 min-w-0 h-[16px] overflow-hidden"
                                  style={{ backgroundColor: tone.fillTrack }}
                                >
                                  <div
                                    className="absolute inset-y-0 left-0"
                                    style={{
                                      width: `${bottomFill}%`,
                                      backgroundColor: tone.fill,
                                    }}
                                  />
                                  {m.bottomLabel != null && (
                                    <span
                                      className="relative z-10 block h-full px-1.5 text-[9px] font-semibold tabular-nums truncate leading-[16px]"
                                      style={{ color: tone.trackText }}
                                    >
                                      {m.bottomLabel}
                                    </span>
                                  )}
                                </div>
                                {m.bottomRight != null && (
                                  <span
                                    className="text-[9px] font-semibold tabular-nums shrink-0 w-9 text-right"
                                    style={{ color: tone.trackText }}
                                  >
                                    {m.bottomRight}
                                  </span>
                                )}
                              </div>
                            )}
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
