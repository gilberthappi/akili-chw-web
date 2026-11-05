import React, { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getActiveLearnerMap, type AttendanceFilters, type IActiveLearnerPoint } from "@/services/attendance.service";
import { V2_CARD_SHELL, V2_MUTED, V2_SECTION_TITLE } from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));

export const ActiveLearnersMap: React.FC<{ filters?: AttendanceFilters; className?: string }> = ({
  filters = {},
  className = "",
}) => {
  const { t } = useTranslation();
  const frame = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["attendance", "map", filters],
    queryFn: () => getActiveLearnerMap(filters),
  });
  const points = data?.data ?? [];

  useEffect(() => {
    const node = frame.current;
    if (!node || isLoading || isError) return;
    const map = L.map(node, { zoomControl: true }).setView([-1.94, 29.87], 8);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 18,
    }).addTo(map);
    const bounds: L.LatLngExpression[] = [];
    points.forEach((point) => {
      bounds.push([point.latitude, point.longitude]);
      L.circleMarker([point.latitude, point.longitude], {
        radius: 7,
        color: "#047857",
        weight: 2,
        fillColor: "#10b981",
        fillOpacity: 0.9,
      })
        .bindPopup(popup(point))
        .addTo(map);
    });
    if (bounds.length === 1) map.setView(bounds[0], 12);
    else if (bounds.length > 1) map.fitBounds(L.latLngBounds(bounds), { padding: [28, 28], maxZoom: 12 });
    const refresh = () => map.invalidateSize();
    const timer = window.setTimeout(refresh, 200);
    const observer = new ResizeObserver(refresh);
    observer.observe(node);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      map.remove();
    };
  }, [points, isLoading, isError]);

  return (
    <div className={`${V2_CARD_SHELL} overflow-hidden flex flex-col h-full min-h-[480px] ${className}`}>
      <div className="px-4 py-3 shrink-0">
        <h3 className={V2_SECTION_TITLE}>{t("attendance.mapTitle")}</h3>
        <p className={`text-[11px] ${V2_MUTED}`}>
          {t("attendance.mapHint", { count: points.length })}
        </p>
      </div>
      {isError ? (
        <p className="px-4 pb-4 text-xs text-red-500">{t("attendance.loadError")}</p>
      ) : (
        <div ref={frame} className="flex-1 min-h-[360px] w-full bg-[#E8EEF6] dark:bg-slate-800" />
      )}
    </div>
  );
};

function popup(point: IActiveLearnerPoint) {
  const place = [point.healthCenterName, point.district].filter(Boolean).join(" · ");
  return `<strong>${escapeHtml(point.fullNames)}</strong>${
    place ? `<br/>${escapeHtml(place)}` : ""
  }<br/>${escapeHtml(point.lastActiveDay)}`;
}
