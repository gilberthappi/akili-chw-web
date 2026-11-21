import { IconDefinition } from "./types";

/**
 * Curated Vector Icon Catalog for Healthcare, Clinical Training & Slide Presentation.
 * Normalized to standard scalable 24x24 vector paths with multi-path structure.
 */
export const CURATED_ICON_CATALOG: IconDefinition[] = [
  // ── 1. Clinical & Diagnostics ─────────────────────────────────────────────
  {
    id: "stethoscope",
    name: "Stethoscope",
    category: "clinical",
    keywords: ["doctor", "exam", "clinical", "heart", "health"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4.5 3v5a4.5 4.5 0 0 0 9 0V3"/>
      <path d="M6 3h-3"/>
      <path d="M15 3h-3"/>
      <path d="M9 12.5v3a3.5 3.5 0 0 0 7 0v-2"/>
      <circle cx="16" cy="11.5" r="2.5" fill="#3B82F6" stroke="#1D4ED8"/>
    </svg>`,
  },
  {
    id: "heart-pulse",
    name: "Heart Pulse",
    category: "clinical",
    keywords: ["vital", "cardio", "rate", "pulse", "emergency"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h4.28" stroke="#FFFFFF" stroke-width="1.8"/>
    </svg>`,
  },
  {
    id: "syringe",
    name: "Syringe & Vaccine",
    category: "clinical",
    keywords: ["vaccine", "injection", "dose", "immunization"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m18 2 4 4"/>
      <path d="m17 7 3-3"/>
      <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5"/>
      <path d="m9 11 4 4"/>
      <path d="m5 19-3 3"/>
      <path d="m14 4 6 6"/>
    </svg>`,
  },
  {
    id: "pill",
    name: "Pill & Medication",
    category: "clinical",
    keywords: ["pharmacy", "medicine", "prescription", "capsule", "drug"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
      <path d="m8.5 8.5 7 7"/>
      <path d="M14 6l4 4" stroke="#A78BFA"/>
    </svg>`,
  },
  {
    id: "thermometer",
    name: "Thermometer",
    category: "clinical",
    keywords: ["fever", "temperature", "vitals", "infection"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
      <path d="M12 9v5"/>
      <circle cx="12" cy="17" r="1.5" fill="#F59E0B"/>
    </svg>`,
  },
  {
    id: "dna",
    name: "DNA Genetics",
    category: "clinical",
    keywords: ["genetics", "biology", "research", "lab"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 15c6.667-6 13.333 0 20-6"/>
      <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/>
      <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/>
      <path d="m17 6-2.5-2.5"/>
      <path d="m14 8-1-1"/>
      <path d="m7 18 2.5 2.5"/>
      <path d="m3.5 14.5.5.5"/>
      <path d="m20 9 .5.5"/>
      <path d="m6.5 12.5 1 1"/>
      <path d="m16.5 10.5 1 1"/>
      <path d="M10 16 7.5 18.5"/>
    </svg>`,
  },
  {
    id: "hospital",
    name: "Clinic & Hospital",
    category: "clinical",
    keywords: ["facility", "center", "clinic", "ward"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 6v4"/>
      <path d="M14 8h-4"/>
      <path d="M18 20V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16"/>
      <path d="M2 20h20"/>
      <path d="M10 14h4"/>
      <path d="M12 12v4"/>
    </svg>`,
  },
  {
    id: "first-aid",
    name: "First Aid Kit",
    category: "clinical",
    keywords: ["emergency", "kit", "safety", "treatment"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <rect width="20" height="14" x="2" y="7" rx="2" fill="#FEE2E2"/>
      <path d="M12 11v6" stroke="#DC2626"/>
      <path d="M9 14h6" stroke="#DC2626"/>
    </svg>`,
  },

  // ── 2. Community & Care ───────────────────────────────────────────────────
  {
    id: "users-care",
    name: "Community Health Team",
    category: "community",
    keywords: ["team", "community", "workers", "chw", "staff"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4" fill="#A7F3D0"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`,
  },
  {
    id: "baby-care",
    name: "Maternal & Child Health",
    category: "community",
    keywords: ["child", "pediatric", "baby", "infant", "maternal"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 12h.01"/>
      <path d="M15 12h.01"/>
      <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/>
      <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/>
    </svg>`,
  },
  {
    id: "home-visit",
    name: "Household Visit",
    category: "community",
    keywords: ["household", "home", "family", "visit", "field"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>`,
  },
  {
    id: "shield-check",
    name: "Safety & Prevention",
    category: "community",
    keywords: ["protection", "safe", "verified", "compliance", "shield"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" fill="#D1FAE5"/>
      <path d="m9 12 2 2 4-4" stroke="#059669" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: "phone-call",
    name: "Consultation Call",
    category: "community",
    keywords: ["phone", "telemedicine", "call", "hotline", "advisory"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#0891B2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>`,
  },

  // ── 3. Education & Training ───────────────────────────────────────────────
  {
    id: "graduation-cap",
    name: "Training & Course",
    category: "education",
    keywords: ["certificate", "module", "learn", "study", "diploma"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/>
      <path d="M22 10v6"/>
      <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>
    </svg>`,
  },
  {
    id: "lightbulb",
    name: "Clinical Insight",
    category: "education",
    keywords: ["idea", "tip", "insight", "solution", "creative"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
      <circle cx="12" cy="8" r="3" fill="#FEF3C7"/>
    </svg>`,
  },
  {
    id: "book-open",
    name: "Protocol Guidebook",
    category: "education",
    keywords: ["handbook", "manual", "guide", "protocol", "curriculum"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>`,
  },
  {
    id: "clipboard-check",
    name: "Checklist Assessment",
    category: "education",
    keywords: ["audit", "test", "quiz", "verification", "assessment"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="m9 14 2 2 4-4" stroke="#059669" stroke-width="2.5"/>
    </svg>`,
  },
  {
    id: "award-badge",
    name: "Achievement Badge",
    category: "education",
    keywords: ["badge", "honor", "certificate", "success", "milestone"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="8" r="6" fill="#FEF3C7"/>
      <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/>
      <circle cx="12" cy="8" r="2" fill="#F59E0B"/>
    </svg>`,
  },

  // ── 4. Charts, Metrics & Infographics ─────────────────────────────────────
  {
    id: "trending-up",
    name: "Progress Metric",
    category: "chart",
    keywords: ["growth", "increase", "performance", "trend", "analytics"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>`,
  },
  {
    id: "bar-chart",
    name: "Comparison Chart",
    category: "chart",
    keywords: ["histogram", "stats", "data", "benchmark", "quantities"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" x2="12" y1="20" y2="10"/>
      <line x1="18" x2="18" y1="20" y2="4"/>
      <line x1="6" x2="6" y1="20" y2="16"/>
    </svg>`,
  },
  {
    id: "pie-chart",
    name: "Demographics Pie",
    category: "chart",
    keywords: ["distribution", "share", "ratio", "breakdown", "segment"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
      <path d="M22 12A10 10 0 0 0 12 2v10z" fill="#DDD6FE"/>
    </svg>`,
  },
  {
    id: "target-goal",
    name: "Clinical Objective",
    category: "chart",
    keywords: ["goal", "target", "focus", "aim", "outcome"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6" fill="#FFE4E6"/>
      <circle cx="12" cy="12" r="2" fill="#E11D48"/>
    </svg>`,
  },
  {
    id: "alert-triangle",
    name: "Warning & Caution",
    category: "chart",
    keywords: ["warning", "caution", "danger", "alert", "notice"],
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" fill="#FEF3C7"/>
      <line x1="12" x2="12" y1="9" y2="13" stroke="#B45309" stroke-width="2.5"/>
      <line x1="12" x2="12.01" y1="17" y2="17" stroke="#B45309" stroke-width="3"/>
    </svg>`,
  },
];

