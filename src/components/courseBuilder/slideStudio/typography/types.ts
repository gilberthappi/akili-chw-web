// Slide Studio - Typography Studio Types & Curated Fonts Catalog

export type FontCategory = "all" | "sans" | "serif" | "display" | "mono";

export interface FontDefinition {
  name: string;
  family: string;
  category: "sans" | "serif" | "display" | "mono";
  weights: number[];
  googleFont: boolean;
  sampleText?: string;
}

export interface CurvedTextSettings {
  enabled: boolean;
  curvature: number; // -180 to +180 degrees (0 = flat horizontal)
  radius?: number;
  reverse?: boolean;
}

export interface TextGradientSettings {
  enabled: boolean;
  type: "linear" | "radial";
  angle: number; // 0 to 360 degrees
  stops: Array<{ offset: number; color: string }>;
}

export interface TextStrokeSettings {
  enabled: boolean;
  color: string;
  width: number; // 0 to 20 px
}

export interface TextGlowSettings {
  enabled: boolean;
  color: string;
  blur: number; // 0 to 40 px
  offsetX: number;
  offsetY: number;
}

export type TextTransformMode = "none" | "uppercase" | "lowercase" | "capitalize";

export interface TextTypographyState {
  fontFamily: string;
  fontSize: number;
  fontWeight: string | number;
  fontStyle: "normal" | "italic";
  underline: boolean;
  linethrough: boolean;
  charSpacing: number; // Fabric uses 1/1000 em (-50 to 800)
  lineHeight: number; // 0.8 to 2.5
  textAlign: "left" | "center" | "right" | "justify";
  textTransform: TextTransformMode;
  fillType: "solid" | "gradient";
  fillColor: string;
  gradient?: TextGradientSettings;
  stroke: TextStrokeSettings;
  glow: TextGlowSettings;
  curved: CurvedTextSettings;
}

// ── Curated Presentation & Graphic Google Fonts ─────────────────────────────
export const CURATED_GOOGLE_FONTS: FontDefinition[] = [
  // Modern Sans-Serif
  {
    name: "Inter",
    family: "Inter",
    category: "sans",
    weights: [400, 500, 600, 700, 800],
    googleFont: true,
  },
  {
    name: "Montserrat",
    family: "Montserrat",
    category: "sans",
    weights: [400, 600, 700, 800, 900],
    googleFont: true,
  },
  {
    name: "Plus Jakarta Sans",
    family: "Plus Jakarta Sans",
    category: "sans",
    weights: [400, 500, 600, 700, 800],
    googleFont: true,
  },
  {
    name: "Outfit",
    family: "Outfit",
    category: "sans",
    weights: [400, 500, 600, 700, 800],
    googleFont: true,
  },
  {
    name: "Poppins",
    family: "Poppins",
    category: "sans",
    weights: [400, 500, 600, 700],
    googleFont: true,
  },
  {
    name: "Roboto",
    family: "Roboto",
    category: "sans",
    weights: [400, 500, 700, 900],
    googleFont: true,
  },
  {
    name: "Arial",
    family: "Arial",
    category: "sans",
    weights: [400, 700],
    googleFont: false,
  },

  // Editorial & Classical Serif
  {
    name: "Playfair Display",
    family: "Playfair Display",
    category: "serif",
    weights: [400, 600, 700, 900],
    googleFont: true,
  },
  {
    name: "Merriweather",
    family: "Merriweather",
    category: "serif",
    weights: [400, 700, 900],
    googleFont: true,
  },
  {
    name: "Lora",
    family: "Lora",
    category: "serif",
    weights: [400, 600, 700],
    googleFont: true,
  },
  {
    name: "Cinzel",
    family: "Cinzel",
    category: "serif",
    weights: [400, 600, 700, 900],
    googleFont: true,
  },
  {
    name: "Georgia",
    family: "Georgia",
    category: "serif",
    weights: [400, 700],
    googleFont: false,
  },

  // Display & Impact
  {
    name: "Bebas Neue",
    family: "Bebas Neue",
    category: "display",
    weights: [400],
    googleFont: true,
  },
  {
    name: "Oswald",
    family: "Oswald",
    category: "display",
    weights: [400, 600, 700],
    googleFont: true,
  },
  {
    name: "Anton",
    family: "Anton",
    category: "display",
    weights: [400],
    googleFont: true,
  },
  {
    name: "Impact",
    family: "Impact",
    category: "display",
    weights: [400],
    googleFont: false,
  },

  // Technical & Monospace
  {
    name: "JetBrains Mono",
    family: "JetBrains Mono",
    category: "mono",
    weights: [400, 500, 700],
    googleFont: true,
  },
  {
    name: "Fira Code",
    family: "Fira Code",
    category: "mono",
    weights: [400, 500, 700],
    googleFont: true,
  },
  {
    name: "Courier New",
    family: "Courier New",
    category: "mono",
    weights: [400, 700],
    googleFont: false,
  },
];

// ── Preset Typography Gradients ─────────────────────────────────────────────
export const PRESET_TEXT_GRADIENTS: Array<{
  id: string;
  name: string;
  stops: Array<{ offset: number; color: string }>;
}> = [
  {
    id: "ocean",
    name: "Ocean Blue",
    stops: [
      { offset: 0, color: "#2563EB" },
      { offset: 1, color: "#06B6D4" },
    ],
  },
  {
    id: "sunset",
    name: "Sunset Coral",
    stops: [
      { offset: 0, color: "#E11D48" },
      { offset: 1, color: "#FB923C" },
    ],
  },
  {
    id: "emerald",
    name: "Clinical Emerald",
    stops: [
      { offset: 0, color: "#059669" },
      { offset: 1, color: "#10B981" },
    ],
  },
  {
    id: "cyber",
    name: "Neon Purple",
    stops: [
      { offset: 0, color: "#7C3AED" },
      { offset: 1, color: "#EC4899" },
    ],
  },
  {
    id: "gold",
    name: "Luxury Gold",
    stops: [
      { offset: 0, color: "#D97706" },
      { offset: 1, color: "#FBBF24" },
    ],
  },
  {
    id: "slate",
    name: "Midnight Slate",
    stops: [
      { offset: 0, color: "#0F172A" },
      { offset: 1, color: "#475569" },
    ],
  },
];

export const DEFAULT_TYPOGRAPHY_STATE: TextTypographyState = {
  fontFamily: "Inter",
  fontSize: 36,
  fontWeight: "normal",
  fontStyle: "normal",
  underline: false,
  linethrough: false,
  charSpacing: 0,
  lineHeight: 1.15,
  textAlign: "left",
  textTransform: "none",
  fillType: "solid",
  fillColor: "#0f172a",
  stroke: {
    enabled: false,
    color: "#2563EB",
    width: 2,
  },
  glow: {
    enabled: false,
    color: "rgba(37, 99, 235, 0.4)",
    blur: 16,
    offsetX: 0,
    offsetY: 4,
  },
  curved: {
    enabled: false,
    curvature: 0,
  },
};

