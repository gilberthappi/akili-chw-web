import type { Canvas as FabricCanvas, FabricObject } from "fabric";
import type { ElementAnimationConfig } from "../animation/types";

// Slide Studio Engine TypeScript Contracts

export type StudioAspectRatio = "16:9" | "9:16" | "4:3" | "custom";

export interface ArtboardDimensions {
  width: number;
  height: number;
  label: string;
  ratio: StudioAspectRatio;
}

export interface StudioViewportState {
  zoom: number; // 0.1 to 8.0 (10% to 800%)
  panX: number;
  panY: number;
  isPanning: boolean;
  showGrid: boolean;
  ratio: StudioAspectRatio;
}

export interface StudioHistorySnapshot {
  json: string;
  timestamp: number;
}

export interface CoordinatePoint {
  x: number;
  y: number;
}

export interface ViewportTransformMatrix {
  scale: number;
  panX: number;
  panY: number;
}

export interface SlideStudioCanvasRef {
  getZoom: () => number;
  setZoom: (zoom: number) => void;
  resetZoomToFit: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  changeRatio: (ratio: StudioAspectRatio) => void;
  getFabricCanvas: () => FabricCanvas | null;
  addBentCard: (radii?: [number, number, number, number], title?: string, fill?: string) => void;
  addText: (text: string, fontSize?: number) => void;
  addCurvedText: (
    text: string,
    curvature?: number,
    fontSize?: number,
    options?: Record<string, unknown>
  ) => void;
  addOrganicBlob: () => void;
  addWavyDivider: () => void;
  addShieldBadge: () => void;
  addSpeechBubble: () => void;
  addChevronArrow: () => void;
  addPhotoCard: (url: string, title?: string) => void;
  addSvgAsset: (
    svgString: string,
    name?: string,
    options?: Record<string, unknown>
  ) => Promise<void>;
  addConnectorLine: (options?: Record<string, unknown>) => void;
  togglePenTool: () => void;
  isPenActive: boolean;
  getCanvasJson: () => Record<string, unknown>;
  loadCanvasJson: (json: Record<string, unknown>) => Promise<void>;
  groupSelected: () => void;
  ungroupSelected: () => void;
  clearCanvas: () => void;
  previewElementAnimation: (target: FabricObject, config: ElementAnimationConfig) => void;
  playSlideAnimation: (onProgress?: (progress: number) => void, onComplete?: () => void) => void;
  stopSlideAnimation: () => void;
  exportHighResBlob: (multiplier?: number) => Promise<Blob>;
}
