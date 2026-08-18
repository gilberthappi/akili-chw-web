/** Shared Recharts X-axis props: rotate tick labels so they stay readable. */
export const OBLIQUE_X_AXIS = {
  angle: -45,
  textAnchor: "end" as const,
  interval: 0 as const,
  height: 72,
  tick: { fontSize: 10, fill: "#6b7280" },
  axisLine: false,
  tickLine: false,
};

export const OBLIQUE_BAR_MARGIN = {
  top: 8,
  right: 12,
  left: 20,
  bottom: 8,
};
