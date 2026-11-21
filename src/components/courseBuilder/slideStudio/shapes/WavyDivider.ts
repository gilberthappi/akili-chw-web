import { Path, type FabricObjectProps } from "fabric";

export interface WaveOptions extends Partial<FabricObjectProps> {
  width?: number;
  height?: number;
  waves?: number;
  amplitude?: number;
  position?: "bottom" | "top";
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface WaveMetadata {
  width: number;
  height: number;
  waves: number;
  amplitude: number;
  position: "bottom" | "top";
}

/**
 * Generates an SVG path string for a smooth continuous cubic Bezier wave ribbon.
 */
export function generateWavePathString(
  width: number = 720,
  height: number = 200,
  waves: number = 2.5,
  amplitude: number = 40,
  position: "bottom" | "top" = "bottom"
): string {
  const segments: string[] = [];
  const baseMidY = position === "bottom" ? amplitude + 10 : height - amplitude - 10;
  const numSteps = Math.round(waves * 4); // 4 bezier segments per full wave cycle
  const stepWidth = width / numSteps;

  segments.push(`M 0 ${baseMidY}`);

  let currentX = 0;
  for (let i = 0; i < numSteps; i++) {
    const nextX = currentX + stepWidth;
    const midX = currentX + stepWidth / 2;

    // Alternating crest and trough
    const isCrest = i % 2 === 0;
    const targetY = isCrest ? baseMidY - amplitude : baseMidY + amplitude;

    // Cubic bezier control points
    const cp1x = Math.round((currentX + (midX - currentX) * 0.55) * 10) / 10;
    const cp1y = Math.round(isCrest ? baseMidY - amplitude * 0.8 : baseMidY + amplitude * 0.8);
    const cp2x = Math.round((midX + (nextX - midX) * 0.45) * 10) / 10;
    const cp2y = Math.round(targetY);
    const endX = Math.round(nextX * 10) / 10;
    const endY = Math.round(targetY);

    segments.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`);
    currentX = nextX;
  }

  // Close the path to form a solid ribbon
  if (position === "bottom") {
    segments.push(`L ${width} ${height} L 0 ${height} Z`);
  } else {
    segments.push(`L ${width} 0 L 0 0 Z`);
  }

  return segments.join(" ");
}

/**
 * Creates an interactive Fabric Path object representing a smooth wavy divider ribbon.
 */
export function createWavyDivider(options: WaveOptions = {}): Path {
  const width = options.width ?? 720;
  const height = options.height ?? 200;
  const waves = options.waves ?? 2;
  const amplitude = options.amplitude ?? 35;
  const position = options.position ?? "bottom";

  const pathString = generateWavePathString(width, height, waves, amplitude, position);

  const path = new Path(pathString, {
    fill: options.fill ?? "#3B82F6",
    stroke: options.stroke ?? "#2563EB",
    strokeWidth: options.strokeWidth ?? 0,
    opacity: options.opacity ?? 0.9,
    originX: "center",
    originY: "center",
    ...options,
  });

  (path as unknown as { waveMetadata: WaveMetadata }).waveMetadata = {
    width,
    height,
    waves,
    amplitude,
    position,
  };
  (path as unknown as { shapeType: string }).shapeType = "WavyDivider";

  return path;
}
