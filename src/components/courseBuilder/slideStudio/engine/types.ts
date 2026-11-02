import type { Canvas as FabricCanvas } from "fabric";

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
  togglePenTool: () => void;
  isPenActive: boolean;
  getCanvasJson: () => Record<string, unknown>;
  loadCanvasJson: (json: Record<string, unknown>) => Promise<void>;
  exportHighResBlob: (multiplier?: number) => Promise<Blob>;
}
