import React from "react";
import {
  EmbeddedImageState,
  ImageFilterSettings,
  ArtboardBackgroundState,
  DEFAULT_IMAGE_FILTERS,
} from "./types";

/**
 * ImageEngine - High-performance image loading, in-frame positioning,
 * and filter processing engine.
 */
export class ImageEngine {
  private static imageCache = new Map<string, HTMLImageElement>();
  private static loadingPromises = new Map<string, Promise<HTMLImageElement>>();

  /**
   * Preloads and caches an HTMLImageElement with cross-origin anonymous support.
   */
  static loadImage(url: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(url)) {
      return Promise.resolve(this.imageCache.get(url)!);
    }
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.imageCache.set(url, img);
        this.loadingPromises.delete(url);
        resolve(img);
      };
      img.onerror = (err) => {
        this.loadingPromises.delete(url);
        reject(err);
      };
      img.src = url;
    });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  /**
   * Synchronously retrieves a cached image if already loaded.
   */
  static getCachedImage(url: string): HTMLImageElement | undefined {
    return this.imageCache.get(url);
  }

  /**
   * Calculates destination coordinates and dimensions for rendering an image inside a frame.
   * Origin is centered at (0, 0) relative to [-cardW / 2, -cardH / 2].
   */
  static computeInFrameRect(
    cardW: number,
    cardH: number,
    imgW: number,
    imgH: number,
    fitMode: "cover" | "contain" | "fill",
    zoom: number,
    panX: number,
    panY: number
  ): { dx: number; dy: number; dw: number; dh: number } {
    const safeZoom = Math.max(0.5, Math.min(5.0, zoom || 1.0));
    let baseScale = 1.0;

    if (fitMode === "contain") {
      baseScale = Math.min(cardW / (imgW || 1), cardH / (imgH || 1));
    } else if (fitMode === "fill") {
      const dw = cardW * safeZoom;
      const dh = cardH * safeZoom;
      return {
        dx: -dw / 2 + (panX || 0),
        dy: -dh / 2 + (panY || 0),
        dw,
        dh,
      };
    } else {
      // Default: "cover"
      baseScale = Math.max(cardW / (imgW || 1), cardH / (imgH || 1));
    }

    const dw = imgW * baseScale * safeZoom;
    const dh = imgH * baseScale * safeZoom;
    const dx = -dw / 2 + (panX || 0);
    const dy = -dh / 2 + (panY || 0);

    return { dx, dy, dw, dh };
  }

  /**
   * Generates standard Canvas 2D / CSS filter string for brightness, contrast, blur, etc.
   */
  static getFilterString(filters: ImageFilterSettings = DEFAULT_IMAGE_FILTERS): string {
    const parts: string[] = [];

    // Brightness (-1 to 1) -> 0% to 200%
    if (filters.brightness !== 0) {
      parts.push(`brightness(${Math.max(0, 1 + filters.brightness)})`);
    }

    // Contrast (-1 to 1) -> 0% to 200%
    if (filters.contrast !== 0) {
      parts.push(`contrast(${Math.max(0, 1 + filters.contrast)})`);
    }

    // Saturation (-1 to 1) -> 0% to 200%
    if (filters.saturation !== 0) {
      parts.push(`saturate(${Math.max(0, 1 + filters.saturation)})`);
    }

    // Blur (0 to 20px)
    if (filters.blur > 0) {
      parts.push(`blur(${filters.blur}px)`);
    }

    // Duotone / Monochrome Color Grading
    if (filters.duotone === "mono") {
      parts.push("grayscale(100%)");
    } else if (filters.duotone === "teal") {
      parts.push("sepia(40%) hue-rotate(130deg) saturate(140%)");
    } else if (filters.duotone === "blue") {
      parts.push("sepia(30%) hue-rotate(180deg) saturate(150%)");
    } else if (filters.duotone === "warm") {
      parts.push("sepia(35%) saturate(130%)");
    }

    return parts.length > 0 ? parts.join(" ") : "none";
  }

  /**
   * Renders an embedded image into a Canvas 2D context with clipping and filters.
   */
  static renderEmbeddedImage(
    ctx: CanvasRenderingContext2D,
    cardW: number,
    cardH: number,
    state: EmbeddedImageState,
    imgElement: HTMLImageElement
  ): void {
    const { dx, dy, dw, dh } = this.computeInFrameRect(
      cardW,
      cardH,
      imgElement.naturalWidth || state.naturalWidth || cardW,
      imgElement.naturalHeight || state.naturalHeight || cardH,
      state.fitMode,
      state.zoom,
      state.panX,
      state.panY
    );

    ctx.save();
    const filterStr = this.getFilterString(state.filters);
    if (filterStr !== "none" && ctx.filter !== undefined) {
      ctx.filter = filterStr;
    }
    if (state.opacity !== undefined && state.opacity < 1) {
      ctx.globalAlpha = Math.max(0, Math.min(1, state.opacity));
    }

    ctx.drawImage(imgElement, dx, dy, dw, dh);
    ctx.restore();
  }

  /**
   * Constructs CSSProperties for live rendering of the slide artboard background.
   */
  static getArtboardBackgroundCss(bg: ArtboardBackgroundState): React.CSSProperties {
    const style: React.CSSProperties = {};

    if (bg.type === "image" && bg.imageUrl) {
      style.backgroundImage = `url("${bg.imageUrl}")`;
      style.backgroundSize = bg.imageMode === "contain" ? "contain" : bg.imageMode === "fill" ? "100% 100%" : "cover";
      style.backgroundPosition = "center";
      style.backgroundRepeat = "no-repeat";
      style.backgroundColor = bg.color || "#0f172a";
    } else if (bg.type === "gradient" && bg.gradient) {
      const g = bg.gradient;
      if (g.type === "radial") {
        const stops = g.stops.map((s) => `${s.color} ${Math.round(s.offset * 100)}%`).join(", ");
        style.backgroundImage = `radial-gradient(circle at center, ${stops})`;
      } else {
        const stops = g.stops.map((s) => `${s.color} ${Math.round(s.offset * 100)}%`).join(", ");
        style.backgroundImage = `linear-gradient(${g.angle}deg, ${stops})`;
      }
    } else {
      style.backgroundColor = bg.color || "#ffffff";
    }

    return style;
  }

  /**
   * Enables image masking capability on any FabricObject (Path, BentCard, Shape).
   */
  static enableShapeMasking(shape: any): void {
    if (!shape || shape._hasImageMasking) return;
    shape._hasImageMasking = true;

    if (!shape.setEmbeddedImage) {
      shape.setEmbeddedImage = function (imgState?: EmbeddedImageState) {
        ImageEngine.setShapeEmbeddedImage(this, imgState);
      };
    }

    const helperDrawPath = (target: any, ctx: CanvasRenderingContext2D, callBegin = true) => {
      if (callBegin) ctx.beginPath();
      if (typeof target._buildPath === "function") {
        target._buildPath(ctx, callBegin);
      } else if (typeof target._renderPathCommands === "function") {
        target._renderPathCommands(ctx);
      } else {
        // Fallback for standard shapes (Rect, etc.)
        const w = target.width || 100;
        const h = target.height || 100;
        ctx.rect(-w / 2, -h / 2, w, h);
      }
    };

    shape._renderPaintInOrder = function (ctx: CanvasRenderingContext2D) {
      // 1. Base Fill
      if (typeof this._renderFill === "function") {
        this._renderFill(ctx);
      }

      // 2. Embedded Masked Image
      if (this.embeddedImage) {
        let imgEl =
          this._cachedImgEl ||
          (this.embeddedImage.url
            ? ImageEngine.getCachedImage(this.embeddedImage.url)
            : undefined);

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
          helperDrawPath(this, ctx, true);
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

      // 3. Inner Shadow (if shape has lightingState)
      if (this.lightingState?.layers) {
        const innerLayer = this.lightingState.layers.find(
          (l: any) => l.enabled && l.type === "inner" && l.opacity > 0
        );
        if (innerLayer) {
          ctx.save();
          ctx.beginPath();
          helperDrawPath(this, ctx, false);
          ctx.clip();

          ctx.shadowColor = innerLayer.color;
          ctx.shadowBlur = innerLayer.blur;
          ctx.shadowOffsetX = innerLayer.offsetX;
          ctx.shadowOffsetY = innerLayer.offsetY;

          const margin = Math.max(this.width, this.height, 400) * 2;
          ctx.beginPath();
          ctx.rect(-margin, -margin, margin * 2, margin * 2);
          helperDrawPath(this, ctx, false);
          ctx.fillStyle = "rgba(0, 0, 0, 1)";
          ctx.fill("evenodd");
          ctx.restore();
        }
      }

      // 4. Border Stroke
      if (this.stroke && this.strokeWidth) {
        helperDrawPath(this, ctx, true);
        if (typeof this._renderStroke === "function") {
          this._renderStroke(ctx);
        }
      }
    };
  }

  /**
   * Sets or clears an embedded image on any FabricObject (BentCard, Path, etc.)
   */
  static setShapeEmbeddedImage(shape: any, imageState?: EmbeddedImageState): void {
    if (!shape) return;
    this.enableShapeMasking(shape);
    shape.embeddedImage = imageState ? { ...imageState } : undefined;
    shape._cachedImgEl = undefined;

    if (shape.embeddedImage?.url) {
      const cached = this.getCachedImage(shape.embeddedImage.url);
      if (cached) {
        shape._cachedImgEl = cached;
      } else {
        this.loadImage(shape.embeddedImage.url)
          .then((loaded) => {
            shape._cachedImgEl = loaded;
            shape.dirty = true;
            shape.canvas?.requestRenderAll();
          })
          .catch(() => {});
      }
    }

    shape.dirty = true;
    if (shape.canvas) {
      shape.canvas.requestRenderAll();
    }
  }
}
