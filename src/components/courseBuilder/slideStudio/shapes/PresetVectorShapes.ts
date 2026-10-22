import { Path, type FabricObjectProps } from "fabric";

/**
 * Creates a Clinical Shield / Medical Badge vector shape.
 */
export function createShieldBadge(options: Partial<FabricObjectProps> = {}): Path {
  // SVG path definition for a symmetrical clinical crest shield (normalized to 240x280)
  const d = [
    "M 120 0",
    "C 170 0, 220 15, 240 40",
    "C 240 140, 200 220, 120 280",
    "C 40 220, 0 140, 0 40",
    "C 20 15, 70 0, 120 0",
    "Z",
  ].join(" ");

  const path = new Path(d, {
    fill: "#10B981", // Clinical emerald
    stroke: "#059669",
    strokeWidth: 2,
    originX: "center",
    originY: "center",
    ...options,
  });

  (path as unknown as { shapeType: string }).shapeType = "ShieldBadge";
  return path;
}

/**
 * Creates a Speech / Callout Bubble vector shape with pointer tail.
 */
export function createSpeechBubble(options: Partial<FabricObjectProps> = {}): Path {
  // Rounded bubble with pointer tail at bottom-left (normalized to 320x220)
  const d = [
    "M 30 0",
    "L 290 0",
    "C 306 0, 320 14, 320 30",
    "L 320 150",
    "C 320 166, 306 180, 290 180",
    "L 90 180",
    "L 40 220",
    "L 55 180",
    "L 30 180",
    "C 14 180, 0 166, 0 150",
    "L 0 30",
    "C 0 14, 14 0, 30 0",
    "Z",
  ].join(" ");

  const path = new Path(d, {
    fill: "#8B5CF6", // Purple accent
    stroke: "#7C3AED",
    strokeWidth: 2,
    originX: "center",
    originY: "center",
    ...options,
  });

  (path as unknown as { shapeType: string }).shapeType = "SpeechBubble";
  return path;
}

/**
 * Creates a Process Chevron Arrow vector shape for clinical workflows.
 */
export function createChevronArrow(options: Partial<FabricObjectProps> = {}): Path {
  // Horizontal arrow chevron pointing right (normalized to 300x120)
  const d = [
    "M 0 0",
    "L 240 0",
    "L 300 60",
    "L 240 120",
    "L 0 120",
    "L 60 60",
    "Z",
  ].join(" ");

  const path = new Path(d, {
    fill: "#0284C7", // Medical Sky Blue
    stroke: "#0369A1",
    strokeWidth: 2,
    originX: "center",
    originY: "center",
    ...options,
  });

  (path as unknown as { shapeType: string }).shapeType = "ChevronArrow";
  return path;
}
