// Slide Studio - Asset Ecosystem & Multi-Color SVG Recolorizer Types

export type IconCategory = "clinical" | "community" | "education" | "chart" | "all";

export interface SvgColorChannel {
  id: string;
  originalColor: string;
  currentColor: string;
  count: number;
}

export interface SvgAssetMetadata {
  isSvgAsset: boolean;
  name: string;
  colorChannels: SvgColorChannel[];
  originalSvgString?: string;
}

export interface IconDefinition {
  id: string;
  name: string;
  category: "clinical" | "community" | "education" | "chart";
  keywords: string[];
  svg: string; // Valid scalable SVG XML string (viewBox="0 0 24 24")
}

export type ConnectorLineStyle = "straight" | "bezier" | "elbow";
export type ConnectorArrowHead = "triangle" | "none" | "dot";

export interface ConnectorLineOptions {
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  style?: ConnectorLineStyle;
  stroke?: string;
  strokeWidth?: number;
  arrowHead?: ConnectorArrowHead;
  dashArray?: number[];
}

