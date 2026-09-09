/**
 * Section 2 design dummies — locked to admin board colors & copy.
 */

/** Design palette from Engagement board */
export const SECTION2_ENGAGEMENT_DOMAINS = [
  { key: "hiv", name: "HIV", color: "#1E40AF" },
  { key: "tb", name: "TB", color: "#7DD3FC" },
  { key: "malaria", name: "Malaria", color: "#5B21B6" },
  { key: "ncds", name: "NCDs", color: "#D1D5DB" },
  { key: "mnch", name: "MNCH", color: "#F97316" },
  { key: "iccm", name: "ICCM", color: "#EAB308" },
  { key: "mental", name: "Mental health", color: "#6B2D5B" },
  { key: "family", name: "Family", color: "#9CA3AF" },
] as const;

/** Stacked monthly values (design: Jan–Dec, Y ~0–300; Feb peak) */
export const SECTION2_ENGAGEMENT_MONTHS = [
  { month: "Jan", hiv: 18, tb: 14, malaria: 20, ncds: 12, mnch: 16, iccm: 14, mental: 10, family: 10 },
  { month: "Feb", hiv: 40, tb: 32, malaria: 44, ncds: 28, mnch: 36, iccm: 34, mental: 24, family: 22 },
  { month: "Mar", hiv: 20, tb: 16, malaria: 22, ncds: 14, mnch: 18, iccm: 16, mental: 12, family: 12 },
  { month: "Apr", hiv: 14, tb: 12, malaria: 16, ncds: 10, mnch: 14, iccm: 12, mental: 8, family: 8 },
  { month: "May", hiv: 26, tb: 20, malaria: 30, ncds: 16, mnch: 22, iccm: 20, mental: 14, family: 14 },
  { month: "Jun", hiv: 32, tb: 26, malaria: 36, ncds: 20, mnch: 28, iccm: 26, mental: 18, family: 16 },
  { month: "Jul", hiv: 12, tb: 10, malaria: 14, ncds: 8, mnch: 10, iccm: 10, mental: 6, family: 6 },
  { month: "Aug", hiv: 22, tb: 16, malaria: 24, ncds: 14, mnch: 18, iccm: 16, mental: 12, family: 12 },
  { month: "Sep", hiv: 36, tb: 28, malaria: 40, ncds: 22, mnch: 30, iccm: 28, mental: 20, family: 18 },
  { month: "Oct", hiv: 16, tb: 14, malaria: 18, ncds: 12, mnch: 14, iccm: 14, mental: 10, family: 10 },
  { month: "Nov", hiv: 24, tb: 18, malaria: 26, ncds: 14, mnch: 20, iccm: 18, mental: 12, family: 12 },
  { month: "Dec", hiv: 18, tb: 14, malaria: 20, ncds: 12, mnch: 16, iccm: 14, mental: 10, family: 10 },
] as const;

export const SECTION2_CERTIFICATES = {
  total: 2931,
  rows: [
    { key: "iccm", name: "ICCM", color: "#EAB308", avgAttempts: 6, certificates: 120, downloads: 120 },
    { key: "malaria", name: "Malaria", color: "#7C3AED", avgAttempts: 1, certificates: 235, downloads: 235 },
    { key: "mnch", name: "MNCH", color: "#F97316", avgAttempts: 10, certificates: 32, downloads: 32 },
    { key: "nutrition", name: "Nutrition", color: "#4B5563", avgAttempts: 3, certificates: 90, downloads: 90 },
    { key: "hiv", name: "HIV", color: "#2563EB", avgAttempts: 4, certificates: 140, downloads: 140 },
    { key: "tb", name: "TB", color: "#7DD3FC", avgAttempts: 6, certificates: 120, downloads: 120 },
    { key: "ncds", name: "NCDs", color: "#EF4444", avgAttempts: 5, certificates: 480, downloads: 480 },
    { key: "mental", name: "Mental health", color: "#6B2D5B", avgAttempts: 2, certificates: 310, downloads: 310 },
    { key: "family", name: "Family Planning", color: "#9CA3AF", avgAttempts: 7, certificates: 520, downloads: 520 },
    { key: "immunization", name: "Immunization", color: "#14B8A6", avgAttempts: 3, certificates: 884, downloads: 884 },
  ],
} as const;

export const SECTION2_ASSESSMENT = {
  totalTests: 400,
  bars: [
    { key: "pre", name: "Pre Test", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
    { key: "mid", name: "Mid Test", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
    { key: "post", name: "Post Test", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
    { key: "cert", name: "Certificate Test", tests: 159, avgScore: 23.7, percent: 34.67, target: 70 },
  ],
  /** Design: 4-segment donut (charcoal / light blue / medium blue / silver) */
  segments: [
    { name: "A", value: 30, color: "#4A5568" },
    { name: "B", value: 20, color: "#A8C5D8" },
    { name: "C", value: 35, color: "#4B82BA" },
    { name: "D", value: 15, color: "#C5CDD6" },
  ],
} as const;
