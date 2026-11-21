// Slide Studio - Media, Masking & Background Engine Types

export type ImageFitMode = "cover" | "contain" | "fill";

export type DuotonePreset = "none" | "teal" | "blue" | "warm" | "mono";

export interface ImageFilterSettings {
  brightness: number;   // -1.0 to 1.0 (0 = neutral)
  contrast: number;     // -1.0 to 1.0 (0 = neutral)
  saturation: number;   // -1.0 to 1.0 (0 = neutral)
  blur: number;         // 0 to 20 px (0 = sharp)
  duotone?: DuotonePreset;
}

export interface EmbeddedImageState {
  url: string;
  name?: string;
  naturalWidth: number;
  naturalHeight: number;
  fitMode: ImageFitMode;
  zoom: number;         // 1.0 to 3.0 (default 1.0)
  panX: number;         // px offset from center
  panY: number;         // px offset from center
  opacity: number;      // 0.0 to 1.0 (default 1.0)
  filters: ImageFilterSettings;
}

export type BackgroundType = "color" | "gradient" | "image";

export interface BackgroundGradient {
  type: "linear" | "radial";
  angle: number; // 0 to 360 deg
  stops: Array<{ offset: number; color: string }>;
}

export interface ArtboardBackgroundState {
  type: BackgroundType;
  color: string;
  gradient?: BackgroundGradient;
  imageUrl?: string;
  imageMode?: ImageFitMode;
  overlayColor?: string; // e.g. "rgba(15, 23, 42, 0.45)"
  overlayOpacity?: number; // 0.0 to 1.0
  blur?: number; // 0 to 24 px
}

export interface StockMediaItem {
  id: string;
  title: string;
  category: "clinical" | "community" | "training" | "wellness" | "abstract";
  url: string;
  thumbnailUrl: string;
}

// ── Curated High-Resolution Healthcare & Presentation Stock Presets ───────
export const STOCK_HEALTHCARE_PHOTOS: StockMediaItem[] = [
  {
    id: "stock-chw-consult",
    title: "Community Health Worker Visit",
    category: "community",
    url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=300&q=70",
  },
  {
    id: "stock-doctor-stethoscope",
    title: "Clinical Consultation",
    category: "clinical",
    url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1400&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=70",
  },
  {
    id: "stock-health-training",
    title: "Healthcare Training Workshop",
    category: "training",
    url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1400&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=300&q=70",
  },
  {
    id: "stock-patient-care",
    title: "Patient Empathy & Care",
    category: "wellness",
    url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1400&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=300&q=70",
  },
  {
    id: "stock-laboratory",
    title: "Diagnostics & Research",
    category: "clinical",
    url: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1400&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=300&q=70",
  },
  {
    id: "stock-bg-dark-gradient",
    title: "Deep Slate Modern Gradient",
    category: "abstract",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=70",
  },
];

// ── Default Filters ───────────────────────────────────────────────────────
export const DEFAULT_IMAGE_FILTERS: ImageFilterSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  duotone: "none",
};

// ── Default Slide Background ──────────────────────────────────────────────
export const DEFAULT_ARTBOARD_BG: ArtboardBackgroundState = {
  type: "color",
  color: "#ffffff",
  overlayColor: "#0f172a",
  overlayOpacity: 0.35,
  blur: 0,
};
