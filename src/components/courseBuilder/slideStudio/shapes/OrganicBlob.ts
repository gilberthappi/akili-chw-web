import { Path, type FabricObjectProps } from "fabric";

export interface BlobOptions extends Partial<FabricObjectProps> {
  radius?: number;
  pointsCount?: number;
  variance?: number;
  seed?: number;
  tension?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface BlobMetadata {
  radius: number;
  pointsCount: number;
  variance: number;
  seed: number;
  tension: number;
}

/**
 * Deterministic pseudo-random number generator for reproducible blob shapes.
 */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9999 + 1) * 10000;
  return x - Math.floor(x);
}

/**
 * Generates an SVG path string for a continuous C1-smooth closed organic blob
 * using Catmull-Rom to Cubic Bezier spline interpolation.
 */
export function generateBlobPathString(
  radius: number = 140,
  pointsCount: number = 6,
  variance: number = 0.3,
  seed: number = 42,
  tension: number = 1.0
): string {
  const count = Math.max(4, Math.min(12, pointsCount));
  const points: { x: number; y: number }[] = [];

  // Generate radial points
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const rnd = pseudoRandom(seed + i * 17);
    const r = radius * (1 + (rnd * 2 - 1) * variance);
    points.push({
      x: Math.round(r * Math.cos(angle) * 100) / 100,
      y: Math.round(r * Math.sin(angle) * 100) / 100,
    });
  }

  // Calculate tangents and cubic bezier control points
  const segments: string[] = [];
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const pPrev = points[(i - 1 + n) % n];
    const pCurr = points[i];
    const pNext = points[(i + 1) % n];
    const pNextNext = points[(i + 2) % n];

    // Catmull-Rom tangent vectors scaled by tension
    const t1x = ((pNext.x - pPrev.x) / 6) * tension;
    const t1y = ((pNext.y - pPrev.y) / 6) * tension;
    const t2x = ((pNextNext.x - pCurr.x) / 6) * tension;
    const t2y = ((pNextNext.y - pCurr.y) / 6) * tension;

    const cp1x = Math.round((pCurr.x + t1x) * 100) / 100;
    const cp1y = Math.round((pCurr.y + t1y) * 100) / 100;
    const cp2x = Math.round((pNext.x - t2x) * 100) / 100;
    const cp2y = Math.round((pNext.y - t2y) * 100) / 100;

    if (i === 0) {
      segments.push(`M ${pCurr.x} ${pCurr.y}`);
    }
    segments.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pNext.x} ${pNext.y}`);
  }

  segments.push("Z");
  return segments.join(" ");
}

/**
 * Creates an interactive Fabric Path object representing a smooth organic liquid blob.
 */
export function createOrganicBlob(options: BlobOptions = {}): Path {
  const radius = options.radius ?? 140;
  const pointsCount = options.pointsCount ?? 6;
  const variance = options.variance ?? 0.32;
  const seed = options.seed ?? Math.floor(Math.random() * 100000);
  const tension = options.tension ?? 1.0;

  const pathString = generateBlobPathString(
    radius,
    pointsCount,
    variance,
    seed,
    tension
  );

  const path = new Path(pathString, {
    fill: options.fill ?? "#3B82F6",
    stroke: options.stroke ?? "#2563EB",
    strokeWidth: options.strokeWidth ?? 0,
    opacity: options.opacity ?? 0.85,
    originX: "center",
    originY: "center",
    ...options,
  });

  // Store metadata directly on the Fabric object
  (path as unknown as { blobMetadata: BlobMetadata }).blobMetadata = {
    radius,
    pointsCount,
    variance,
    seed,
    tension,
  };
  (path as unknown as { shapeType: string }).shapeType = "OrganicBlob";

  return path;
}

/**
 * Regenerates an existing organic blob Path with a new seed or updated parameters.
 */
export function regenerateBlobPath(
  blobPath: Path,
  updates?: Partial<BlobMetadata>
): void {
  const meta = (blobPath as unknown as { blobMetadata?: BlobMetadata }).blobMetadata;
  if (!meta) return;

  const nextMeta: BlobMetadata = {
    ...meta,
    ...updates,
    seed: updates?.seed ?? Math.floor(Math.random() * 100000),
  };

  const newD = generateBlobPathString(
    nextMeta.radius,
    nextMeta.pointsCount,
    nextMeta.variance,
    nextMeta.seed,
    nextMeta.tension
  );

  (blobPath as unknown as { blobMetadata: BlobMetadata }).blobMetadata = nextMeta;

  // Fabric Path allows setting its path data and recalculating dimensions
  blobPath.set("path", new Path(newD).path);
  blobPath.setCoords();
}
