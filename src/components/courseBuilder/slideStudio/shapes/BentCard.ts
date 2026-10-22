import {
  FabricObject,
  classRegistry,
  type FabricObjectProps,
  type SerializedObjectProps,
} from "fabric";

export type CornerRadii = [number, number, number, number]; // [TL, TR, BR, BL]

export interface BentCardProps extends Partial<FabricObjectProps> {
  cornerRadii?: CornerRadii;
}

export interface SerializedBentCardProps extends SerializedObjectProps {
  cornerRadii: CornerRadii;
}

const BENT_CARD_PROPS = ["cornerRadii"] as const;

/**
 * BentCard - High-precision vector container card supporting independent 4-corner radii.
 * Corner array order matches CSS standard: [Top-Left, Top-Right, Bottom-Right, Bottom-Left].
 * Uses cubic Bezier arc approximation (k = 1 - 0.5522847498) for smooth, non-distorting curves.
 */
export class BentCard extends FabricObject {
  static type = "BentCard";

  public cornerRadii: CornerRadii = [24, 24, 24, 24];

  constructor(options: BentCardProps = {}) {
    super({
      width: 480,
      height: 280,
      fill: "#ffffff",
      stroke: "#e2e8f0",
      strokeWidth: 2,
      ...options,
    });

    if (options.cornerRadii) {
      this.cornerRadii = [...options.cornerRadii];
    }
  }

  /**
   * Sets all 4 corners uniformly or individually.
   */
  public setCornerRadii(radii: CornerRadii | number) {
    if (typeof radii === "number") {
      this.cornerRadii = [radii, radii, radii, radii];
    } else {
      this.cornerRadii = [...radii];
    }
    this.dirty = true;
  }

  /**
   * Renders the custom 4-corner curved path onto the 2D canvas context.
   */
  _render(ctx: CanvasRenderingContext2D) {
    const w = this.width;
    const h = this.height;
    const x = -w / 2;
    const y = -h / 2;

    const [rawTL, rawTR, rawBR, rawBL] = this.cornerRadii;

    // Proportional clamp factor to prevent corners from intersecting on smaller dimensions
    const clampFactor = Math.min(
      1,
      w / ((rawTL + rawTR) || 1),
      w / ((rawBL + rawBR) || 1),
      h / ((rawTL + rawBL) || 1),
      h / ((rawTR + rawBR) || 1)
    );

    const tl = Math.max(0, rawTL * clampFactor);
    const tr = Math.max(0, rawTR * clampFactor);
    const br = Math.max(0, rawBR * clampFactor);
    const bl = Math.max(0, rawBL * clampFactor);

    // Standard cubic Bezier arc approximation constant
    const k = 0.4477152502; // 1 - 0.5522847498

    ctx.beginPath();

    // Start at top edge after Top-Left curve
    ctx.moveTo(x + tl, y);

    // ── Top Edge & Top-Right Corner ──────────────────────────────────────
    ctx.lineTo(x + w - tr, y);
    if (tr > 0) {
      ctx.bezierCurveTo(
        x + w - tr * k,
        y,
        x + w,
        y + tr * k,
        x + w,
        y + tr
      );
    }

    // ── Right Edge & Bottom-Right Corner ─────────────────────────────────
    ctx.lineTo(x + w, y + h - br);
    if (br > 0) {
      ctx.bezierCurveTo(
        x + w,
        y + h - br * k,
        x + w - br * k,
        y + h,
        x + w - br,
        y + h
      );
    }

    // ── Bottom Edge & Bottom-Left Corner ─────────────────────────────────
    ctx.lineTo(x + bl, y + h);
    if (bl > 0) {
      ctx.bezierCurveTo(
        x + bl * k,
        y + h,
        x,
        y + h - bl * k,
        x,
        y + h - bl
      );
    }

    // ── Left Edge & Top-Left Corner ──────────────────────────────────────
    ctx.lineTo(x, y + tl);
    if (tl > 0) {
      ctx.bezierCurveTo(
        x,
        y + tl * k,
        x + tl * k,
        y,
        x + tl,
        y
      );
    }

    ctx.closePath();

    this._renderPaintInOrder(ctx);
  }

  /**
   * Serializes the object state for persistence to PostgreSQL JSON.
   */
  toObject<
    T extends Record<string, unknown>,
    K extends keyof T = never
  >(propertiesToInclude: K[] = []): T & SerializedBentCardProps {
    return super.toObject([
      ...BENT_CARD_PROPS,
      ...propertiesToInclude,
    ]) as T & SerializedBentCardProps;
  }

  /**
   * Factory method to deserialize from JSON scene tree.
   */
  static async fromObject(object: Record<string, unknown>): Promise<BentCard> {
    return new BentCard(object as BentCardProps);
  }
}

// Register with Fabric v7 ClassRegistry for JSON load/save support
classRegistry.setClass(BentCard, "BentCard");
classRegistry.setClass(BentCard, "bent-card");
