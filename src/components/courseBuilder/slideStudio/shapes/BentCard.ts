import {
  FabricObject,
  classRegistry,
  type FabricObjectProps,
  type SerializedObjectProps,
} from "fabric";
import { LightingState, hexToRgba } from "../lighting/types";
import { LightingEngine } from "../lighting/LightingEngine";
import { EmbeddedImageState } from "../media/types";
import { ImageEngine } from "../media/ImageEngine";

export type CornerRadii = [number, number, number, number]; // [TL, TR, BR, BL]

export interface BentCardProps extends Partial<FabricObjectProps> {
  cornerRadii?: CornerRadii;
  lightingState?: LightingState;
  embeddedImage?: EmbeddedImageState;
}

export interface SerializedBentCardProps extends SerializedObjectProps {
  cornerRadii: CornerRadii;
  lightingState?: LightingState;
  embeddedImage?: EmbeddedImageState;
}

const BENT_CARD_PROPS = ["cornerRadii", "lightingState", "embeddedImage"] as const;

/**
 * BentCard - High-precision vector container card supporting independent 4-corner radii,
 * vector clipping masks (embedded image conforms to Bezier curvature), and multi-pass lighting.
 * Corner array order matches CSS standard: [Top-Left, Top-Right, Bottom-Right, Bottom-Left].
 * Uses cubic Bezier arc approximation (k = 0.4477152502) for smooth, non-distorting curves.
 */
export class BentCard extends FabricObject {
  static type = "BentCard";

  public cornerRadii: CornerRadii = [24, 24, 24, 24];
  public lightingState?: LightingState;
  public embeddedImage?: EmbeddedImageState;
  private _cachedImgEl?: HTMLImageElement;

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
    if (options.lightingState) {
      this.lightingState = options.lightingState;
    }
    if (options.embeddedImage) {
      this.setEmbeddedImage(options.embeddedImage);
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
   * Embeds or updates an image inside the card, clipped by the card's 4-corner curves.
   */
  public setEmbeddedImage(imageState?: EmbeddedImageState) {
    this.embeddedImage = imageState ? { ...imageState } : undefined;
    this._cachedImgEl = undefined;

    if (this.embeddedImage?.url) {
      const cached = ImageEngine.getCachedImage(this.embeddedImage.url);
      if (cached) {
        this._cachedImgEl = cached;
      } else {
        ImageEngine.loadImage(this.embeddedImage.url)
          .then((loaded) => {
            this._cachedImgEl = loaded;
            this.dirty = true;
            this.canvas?.requestRenderAll();
          })
          .catch(() => {});
      }
    }

    this.dirty = true;
    this.canvas?.requestRenderAll();
  }

  /**
   * Constructs the 4-corner cubic Bezier closed path on any Canvas 2D context.
   */
  public _buildPath(ctx: CanvasRenderingContext2D, callBeginPath = true) {
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

    if (callBeginPath) {
      ctx.beginPath();
    }

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
  }

  /**
   * Renders the custom 4-corner curved path and multi-pass shadows onto the 2D canvas context.
   */
  _render(ctx: CanvasRenderingContext2D) {
    // 1. Extra Ambient Shadow Pass (if stacked ambient + contact shadows exist)
    const ambientLayer = this.lightingState?.layers.find(
      (l) => l.enabled && l.type === "ambient" && l.opacity > 0
    );
    const contactLayer = this.lightingState?.layers.find(
      (l) => l.enabled && l.type === "contact" && l.opacity > 0
    );

    // If both exist, render the soft ambient layer behind
    if (ambientLayer && contactLayer) {
      ctx.save();
      ctx.shadowColor = hexToRgba(ambientLayer.color, ambientLayer.opacity);
      ctx.shadowBlur = ambientLayer.blur;
      ctx.shadowOffsetX = ambientLayer.offsetX;
      ctx.shadowOffsetY = ambientLayer.offsetY;
      ctx.fillStyle = typeof this.fill === "string" ? this.fill : "#ffffff";
      this._buildPath(ctx, true);
      ctx.fill();
      ctx.restore();
    }

    // 2. Main Shape Path & Rendering
    this._buildPath(ctx, true);
    this._renderPaintInOrder(ctx);
  }

  /**
   * Paints fill, embedded image, inner shadow, and stroke in optimal depth order.
   */
  _renderPaintInOrder(ctx: CanvasRenderingContext2D) {
    // A. Paint Base Fill
    this._renderFill(ctx);

    // B. Paint Embedded Image (Clipped to the card's 4-corner Bezier curves)
    if (this.embeddedImage) {
      const imgEl = this._cachedImgEl || (this.embeddedImage.url ? ImageEngine.getCachedImage(this.embeddedImage.url) : undefined);
      if (!imgEl && this.embeddedImage.url) {
        ImageEngine.loadImage(this.embeddedImage.url)
          .then((loaded) => {
            this._cachedImgEl = loaded;
            this.dirty = true;
            this.canvas?.requestRenderAll();
          })
          .catch(() => {});
      }

      if (imgEl) {
        ctx.save();
        this._buildPath(ctx, true);
        ctx.clip();

        ImageEngine.renderEmbeddedImage(
          ctx,
          this.width,
          this.height,
          this.embeddedImage,
          imgEl
        );

        ctx.restore();
      }
    }

    // C. Paint Inset / Inner Shadow (if enabled, casts over image edges)
    const innerLayer = this.lightingState?.layers.find(
      (l) => l.enabled && l.type === "inner" && l.opacity > 0
    );
    if (innerLayer) {
      LightingEngine.renderInnerShadow(
        ctx,
        (c, callBegin) => this._buildPath(c, callBegin),
        this.width,
        this.height,
        innerLayer
      );
    }

    // D. Re-establish path for Stroke (framed on top of image and shadow)
    if (this.stroke && this.strokeWidth) {
      this._buildPath(ctx, true);
      this._renderStroke(ctx);
    }
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
