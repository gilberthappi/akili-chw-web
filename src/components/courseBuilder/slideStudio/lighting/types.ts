// Slide Studio - Lighting & Shadow Engine Types

export type ShadowLayerType = "contact" | "ambient" | "inner";

export interface ShadowLayer {
  id: string;
  name: string;
  type: ShadowLayerType;
  enabled: boolean;
  color: string;       // Hex (#000000) or RGBA string
  opacity: number;     // 0.0 to 1.0
  blur: number;        // 0 to 128 px
  offsetX: number;     // -100 to 100 px
  offsetY: number;     // -100 to 100 px
  spread?: number;     // expansion factor (0 to 32)
}

export interface LightingState {
  angle: number;       // 0° to 360° (90 = Downward light, casting down shadow)
  distance: number;    // 0 to 100 px
  presetId?: string;   // 'flat' | 'subtle' | 'elevated' | 'floating' | 'glow' | 'inset' | 'custom'
  layers: ShadowLayer[];
}

export interface LightingPreset {
  id: string;
  name: string;
  description: string;
  iconType: "flat" | "subtle" | "elevated" | "floating" | "glow" | "inset";
  state: LightingState;
}

// ── Math & Color Helpers ──────────────────────────────────────────────────

/**
 * Calculates X and Y offsets from light angle and distance.
 * 90° = light directly above, casting shadow straight down (+Y).
 * 0° = light on left, casting shadow to the right (+X).
 * 180° = light on right, casting shadow to the left (-X).
 * 270° = light below, casting shadow up (-Y).
 */
export function computeOffsetsFromAngle(
  angleDeg: number,
  distance: number
): { offsetX: number; offsetY: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    offsetX: Math.round(distance * Math.cos(rad)),
    offsetY: Math.round(distance * Math.sin(rad)),
  };
}

/**
 * Converts Hex string (#RRGGBB or #RGB) + alpha (0..1) to rgba(...) CSS string.
 */
export function hexToRgba(hex: string, alpha: number): string {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (clean.length !== 6) {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/**
 * Parses an RGBA or HEX color string to extract the base Hex and Alpha.
 */
export function parseColorAndAlpha(colorStr: string): { hex: string; alpha: number } {
  if (colorStr.startsWith("rgba")) {
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1], 10).toString(16).padStart(2, "0");
      const g = parseInt(match[2], 10).toString(16).padStart(2, "0");
      const b = parseInt(match[3], 10).toString(16).padStart(2, "0");
      const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
      return { hex: `#${r}${g}${b}`.toUpperCase(), alpha: a };
    }
  }
  return { hex: colorStr.startsWith("#") ? colorStr.toUpperCase() : `#${colorStr}`.toUpperCase(), alpha: 1 };
}

/**
 * Automatically creates a soft, luminous ambient tint based on a card's fill color.
 */
export function autoTintFromFill(fillColor: string): string {
  if (!fillColor || fillColor === "#ffffff" || fillColor === "#000000" || fillColor === "transparent") {
    return "#0f172a"; // fallback to rich deep slate
  }
  return fillColor;
}

// ── Built-in Pro Elevation Presets ────────────────────────────────────────

export const LIGHTING_PRESETS: LightingPreset[] = [
  {
    id: "flat",
    name: "Flat (None)",
    description: "Crisp 2D surface with no elevation",
    iconType: "flat",
    state: {
      angle: 90,
      distance: 0,
      presetId: "flat",
      layers: [],
    },
  },
  {
    id: "subtle",
    name: "Subtle Lift",
    description: "Modern crisp elevation for clean UI cards",
    iconType: "subtle",
    state: {
      angle: 90,
      distance: 3,
      presetId: "subtle",
      layers: [
        {
          id: "contact-1",
          name: "Contact Shadow",
          type: "contact",
          enabled: true,
          color: "#0f172a",
          opacity: 0.08,
          blur: 4,
          offsetX: 0,
          offsetY: 2,
        },
        {
          id: "ambient-1",
          name: "Ambient Glow",
          type: "ambient",
          enabled: true,
          color: "#0f172a",
          opacity: 0.05,
          blur: 14,
          offsetX: 0,
          offsetY: 6,
        },
      ],
    },
  },
  {
    id: "elevated",
    name: "Elevated Card",
    description: "Balanced multi-layer depth for prominent cards",
    iconType: "elevated",
    state: {
      angle: 90,
      distance: 8,
      presetId: "elevated",
      layers: [
        {
          id: "contact-1",
          name: "Contact Shadow",
          type: "contact",
          enabled: true,
          color: "#0f172a",
          opacity: 0.12,
          blur: 6,
          offsetX: 0,
          offsetY: 3,
        },
        {
          id: "ambient-1",
          name: "Ambient Glow",
          type: "ambient",
          enabled: true,
          color: "#0f172a",
          opacity: 0.08,
          blur: 28,
          offsetX: 0,
          offsetY: 12,
        },
      ],
    },
  },
  {
    id: "floating",
    name: "Floating Modal",
    description: "High-altitude elevation for popups and modals",
    iconType: "floating",
    state: {
      angle: 90,
      distance: 18,
      presetId: "floating",
      layers: [
        {
          id: "contact-1",
          name: "Contact Shadow",
          type: "contact",
          enabled: true,
          color: "#0f172a",
          opacity: 0.16,
          blur: 10,
          offsetX: 0,
          offsetY: 4,
        },
        {
          id: "ambient-1",
          name: "Ambient Glow",
          type: "ambient",
          enabled: true,
          color: "#0f172a",
          opacity: 0.12,
          blur: 56,
          offsetX: 0,
          offsetY: 24,
        },
      ],
    },
  },
  {
    id: "glow",
    name: "Luminous Glow",
    description: "Vibrant atmospheric ambient colored backlight",
    iconType: "glow",
    state: {
      angle: 90,
      distance: 4,
      presetId: "glow",
      layers: [
        {
          id: "ambient-1",
          name: "Ambient Backlight",
          type: "ambient",
          enabled: true,
          color: "#3b82f6", // Electric Blue
          opacity: 0.35,
          blur: 38,
          offsetX: 0,
          offsetY: 6,
        },
        {
          id: "contact-1",
          name: "Sharp Halo",
          type: "contact",
          enabled: true,
          color: "#2563eb",
          opacity: 0.18,
          blur: 8,
          offsetX: 0,
          offsetY: 2,
        },
      ],
    },
  },
  {
    id: "inset",
    name: "Debossed Inset",
    description: "Sunken interior well with crisp debossed bevel",
    iconType: "inset",
    state: {
      angle: 90,
      distance: 4,
      presetId: "inset",
      layers: [
        {
          id: "inner-1",
          name: "Interior Well",
          type: "inner",
          enabled: true,
          color: "#0f172a",
          opacity: 0.15,
          blur: 8,
          offsetX: 0,
          offsetY: 3,
        },
      ],
    },
  },
];
