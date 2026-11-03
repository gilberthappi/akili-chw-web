import { ArtboardDimensions, StudioAspectRatio } from "./types";

export const ARTBOARD_PRESETS: Record<StudioAspectRatio, ArtboardDimensions> = {
  "16:9": {
    width: 1920,
    height: 1080,
    label: "16:9 Widescreen (1080p)",
    ratio: "16:9",
  },
  "9:16": {
    width: 1080,
    height: 1920,
    label: "9:16 Mobile Story",
    ratio: "9:16",
  },
  "4:3": {
    width: 1440,
    height: 1080,
    label: "4:3 Standard Slide",
    ratio: "4:3",
  },
  custom: {
    width: 1920,
    height: 1080,
    label: "Custom Canvas",
    ratio: "custom",
  },
};

export const CANVAS_LIMITS = {
  MIN_ZOOM: 0.1, // 10%
  MAX_ZOOM: 8.0, // 800%
  ZOOM_STEP: 0.1, // 10% step
  VIEWPORT_PADDING: 48, // 48px padding around artboard
  MAX_HISTORY_SNAPSHOTS: 50,
  HISTORY_DEBOUNCE_MS: 200,
};

export const CUSTOM_CANVAS_PROPERTIES = [
  "id",
  "name",
  "locked",
  "customType",
  "shapeType",
  "blobMetadata",
  "isSvgAsset",
  "svgName",
  "colorChannels",
  "connectorConfig",
  "cornerRadii",
  "lightingState",
  "embeddedImage",
  "curvature",
  "textGradient",
  "charSpacing",
  "lineHeight",
  "textTransform",
  "paintFirst",
  "shadowStack",
  "clipPathId",
  "blendMode",
  "tokenKey",
  "rx",
  "ry",
  "selectable",
  "evented",
];

export const DEFAULT_CANVAS_BG = "#ffffff";
