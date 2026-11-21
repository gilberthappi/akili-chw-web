import { Path, type FabricObjectProps } from "fabric";
import { ConnectorLineStyle, ConnectorArrowHead, ConnectorLineOptions } from "../assets/types";

/**
 * Generates an SVG path string for a workflow connector line with an optional arrowhead.
 */
export function generateConnectorPathString(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  style: ConnectorLineStyle = "bezier",
  arrowHead: ConnectorArrowHead = "triangle"
): string {
  const parts: string[] = [`M ${startX} ${startY}`];

  let endTangentAngle = 0;

  if (style === "straight") {
    parts.push(`L ${endX} ${endY}`);
    endTangentAngle = Math.atan2(endY - startY, endX - startX);
  } else if (style === "elbow") {
    const midX = (startX + endX) / 2;
    parts.push(`L ${midX} ${startY}`);
    parts.push(`L ${midX} ${endY}`);
    parts.push(`L ${endX} ${endY}`);
    endTangentAngle = Math.atan2(0, endX - midX);
  } else {
    // Default: Smooth Cubic Bezier Flow
    const dx = endX - startX;
    const cp1x = startX + dx * 0.5;
    const cp1y = startY;
    const cp2x = startX + dx * 0.5;
    const cp2y = endY;
    parts.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`);
    endTangentAngle = Math.atan2(endY - cp2y, endX - cp2x);
  }

  // Draw Arrowhead if requested
  if (arrowHead === "triangle") {
    const headLength = 12;
    const headAngle = Math.PI / 6; // 30 degrees

    const leftX = endX - headLength * Math.cos(endTangentAngle - headAngle);
    const leftY = endY - headLength * Math.sin(endTangentAngle - headAngle);

    const rightX = endX - headLength * Math.cos(endTangentAngle + headAngle);
    const rightY = endY - headLength * Math.sin(endTangentAngle + headAngle);

    parts.push(`M ${leftX} ${leftY} L ${endX} ${endY} L ${rightX} ${rightY}`);
  } else if (arrowHead === "dot") {
    // A small terminal dot
    const r = 4;
    parts.push(`M ${endX - r} ${endY} A ${r} ${r} 0 1 0 ${endX + r} ${endY} A ${r} ${r} 0 1 0 ${endX - r} ${endY}`);
  }

  return parts.join(" ");
}

/**
 * Creates a smart vector connector line between cards or diagram steps.
 */
export function createConnectorLine(
  options: ConnectorLineOptions & Partial<FabricObjectProps> = {}
): Path {
  const {
    startX = 0,
    startY = 0,
    endX = 240,
    endY = 120,
    style = "bezier",
    arrowHead = "triangle",
    stroke = "#2563EB",
    strokeWidth = 3,
    dashArray,
    ...fabricOptions
  } = options;

  const pathD = generateConnectorPathString(startX, startY, endX, endY, style, arrowHead);

  const path = new Path(pathD, {
    fill: "transparent",
    stroke,
    strokeWidth,
    strokeLineCap: "round",
    strokeLineJoin: "round",
    strokeDashArray: dashArray,
    originX: "center",
    originY: "center",
    ...fabricOptions,
  });

  (path as any).shapeType = "ConnectorLine";
  (path as any).connectorConfig = {
    startX,
    startY,
    endX,
    endY,
    style,
    arrowHead,
  };

  return path;
}

