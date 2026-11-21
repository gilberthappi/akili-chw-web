import { IText, Textbox, Path, Gradient, Shadow } from "fabric";
import {
  TextTypographyState,
  TextGradientSettings,
  CurvedTextSettings,
  TextStrokeSettings,
  TextGlowSettings,
  CURATED_GOOGLE_FONTS,
  DEFAULT_TYPOGRAPHY_STATE,
} from "./types";

/**
 * TypographyEngine - High-performance graphic typography processor for Slide Studio.
 * Handles curved text on vector paths, gradient fills, Google Font on-demand loading,
 * outline stroke joins, and micro-typography spacing.
 */
export class TypographyEngine {
  private static loadedFonts = new Set<string>(["Arial", "Georgia", "Impact", "Courier New"]);
  private static loadingPromises = new Map<string, Promise<boolean>>();

  /**
   * Dynamically loads a Google Font by injecting a preconnected link into document.head
   * and awaiting document.fonts.load(...) to prevent layout shifts.
   */
  static async loadGoogleFont(fontFamily: string): Promise<boolean> {
    if (this.loadedFonts.has(fontFamily)) {
      return true;
    }

    if (this.loadingPromises.has(fontFamily)) {
      return this.loadingPromises.get(fontFamily)!;
    }

    const fontDef = CURATED_GOOGLE_FONTS.find(
      (f) => f.family.toLowerCase() === fontFamily.toLowerCase()
    );

    if (!fontDef || !fontDef.googleFont) {
      this.loadedFonts.add(fontFamily);
      return true;
    }

    const promise = new Promise<boolean>((resolve) => {
      try {
        const fontNameEncoded = fontDef.family.replace(/\s+/g, "+");
        const linkId = `google-font-${fontNameEncoded.toLowerCase()}`;

        if (!document.getElementById(linkId)) {
          // Preconnect to Google Fonts CDN
          if (!document.getElementById("google-fonts-preconnect-api")) {
            const preconnect1 = document.createElement("link");
            preconnect1.id = "google-fonts-preconnect-api";
            preconnect1.rel = "preconnect";
            preconnect1.href = "https://fonts.googleapis.com";
            document.head.appendChild(preconnect1);

            const preconnect2 = document.createElement("link");
            preconnect2.id = "google-fonts-preconnect-gstatic";
            preconnect2.rel = "preconnect";
            preconnect2.href = "https://fonts.gstatic.com";
            preconnect2.crossOrigin = "anonymous";
            document.head.appendChild(preconnect2);
          }

          const link = document.createElement("link");
          link.id = linkId;
          link.rel = "stylesheet";
          link.href = `https://fonts.googleapis.com/css2?family=${fontNameEncoded}:wght@400;500;600;700;800;900&display=swap`;
          document.head.appendChild(link);
        }

        // Use document.fonts API if available
        if ("fonts" in document) {
          document.fonts
            .load(`16px "${fontDef.family}"`)
            .then(() => {
              this.loadedFonts.add(fontDef.family);
              this.loadingPromises.delete(fontFamily);
              resolve(true);
            })
            .catch(() => {
              // Fallback to true after brief delay
              setTimeout(() => {
                this.loadedFonts.add(fontDef.family);
                this.loadingPromises.delete(fontFamily);
                resolve(true);
              }, 400);
            });
        } else {
          setTimeout(() => {
            this.loadedFonts.add(fontDef.family);
            this.loadingPromises.delete(fontFamily);
            resolve(true);
          }, 300);
        }
      } catch (err) {
        console.warn("[SlideStudio] Failed to load font:", fontFamily, err);
        resolve(false);
      }
    });

    this.loadingPromises.set(fontFamily, promise);
    return promise;
  }

  /**
   * Generates a smooth mathematical vector arc path SVG string for text bending.
   * Uses quadratic / circular curvature math based on the curvature angle theta (-180 to +180).
   * Theta > 0: Arches upwards (convex).
   * Theta < 0: Arches downwards (concave).
   */
  static generateArcPath(
    textWidth: number,
    fontSize: number,
    curvatureDeg: number
  ): string | null {
    if (Math.abs(curvatureDeg) < 1) {
      return null; // Flat straight text
    }

    const safeW = Math.max(80, textWidth || fontSize * 6);
    const rad = (Math.abs(curvatureDeg) * Math.PI) / 180;

    // Height / sagitta of the arc
    const sagitta = (safeW / 2) * Math.tan(rad / 4);
    const h = Math.max(10, Math.min(safeW * 1.5, sagitta * 1.8));

    const halfW = safeW / 2;

    if (curvatureDeg > 0) {
      // Convex: Curve arches upwards (control point is at top: -h)
      return `M ${-halfW} ${h / 2} Q 0 ${-h} ${halfW} ${h / 2}`;
    } else {
      // Concave: Curve arches downwards (control point is at bottom: +h)
      return `M ${-halfW} ${-h / 2} Q 0 ${h} ${halfW} ${-h / 2}`;
    }
  }

  /**
   * Applies curvature to an IText/Textbox object using Fabric's native path-based text layout.
   */
  static applyCurvature(textObj: any, curvatureDeg: number): void {
    if (!textObj) return;

    textObj.curvature = curvatureDeg;

    if (Math.abs(curvatureDeg) < 1) {
      // Reset to flat straight text
      textObj.set("path", undefined);
      textObj.set("pathAlign", "center");
      textObj.set("pathSide", "left");
      textObj.setCoords();
      textObj.dirty = true;
      textObj.canvas?.requestRenderAll();
      return;
    }

    const textWidth = textObj.width || (textObj.text?.length || 10) * (textObj.fontSize || 36) * 0.6;
    const pathStr = this.generateArcPath(textWidth, textObj.fontSize || 36, curvatureDeg);

    if (pathStr) {
      const vectorPath = new Path(pathStr, {
        visible: false,
        originX: "center",
        originY: "center",
      });

      textObj.set("path", vectorPath);
      textObj.set("pathAlign", "center");
      textObj.set("pathSide", "left");
      textObj.set("pathStartOffset", 0);
      textObj.setCoords();
      textObj.dirty = true;
      textObj.canvas?.requestRenderAll();
    }
  }

  /**
   * Applies a linear or radial gradient fill to typography.
   */
  static applyTextGradient(textObj: any, settings: TextGradientSettings): void {
    if (!textObj) return;

    if (!settings.enabled || !settings.stops || settings.stops.length === 0) {
      return;
    }

    const angleRad = (settings.angle * Math.PI) / 180;
    const w = textObj.width || 200;
    const h = textObj.height || 60;

    const x1 = (-w / 2) * Math.cos(angleRad);
    const y1 = (-h / 2) * Math.sin(angleRad);
    const x2 = (w / 2) * Math.cos(angleRad);
    const y2 = (h / 2) * Math.sin(angleRad);

    const grad = new Gradient({
      type: settings.type || "linear",
      gradientUnits: "pixels",
      coords: {
        x1,
        y1,
        x2,
        y2,
      },
      colorStops: settings.stops.map((s) => ({
        offset: s.offset,
        color: s.color,
      })),
    });

    textObj.set("fill", grad);
    textObj.textGradient = settings;
    textObj.dirty = true;
    textObj.canvas?.requestRenderAll();
  }

  /**
   * Applies stroke / border outline to typography.
   */
  static applyTextStroke(textObj: any, strokeSettings: TextStrokeSettings): void {
    if (!textObj) return;

    if (strokeSettings.enabled && strokeSettings.width > 0) {
      textObj.set("stroke", strokeSettings.color);
      textObj.set("strokeWidth", strokeSettings.width);
      textObj.set("strokeLineJoin", "round");
      textObj.set("strokeLineCap", "round");
      textObj.set("paintFirst", "stroke"); // Ensures fill renders cleanly over stroke
    } else {
      textObj.set("stroke", undefined);
      textObj.set("strokeWidth", 0);
    }

    textObj.dirty = true;
    textObj.canvas?.requestRenderAll();
  }

  /**
   * Applies atmospheric outline glow / shadow to typography.
   */
  static applyTextGlow(textObj: any, glowSettings: TextGlowSettings): void {
    if (!textObj) return;

    if (glowSettings.enabled && glowSettings.blur > 0) {
      textObj.set(
        "shadow",
        new Shadow({
          color: glowSettings.color,
          blur: glowSettings.blur,
          offsetX: glowSettings.offsetX,
          offsetY: glowSettings.offsetY,
        })
      );
    } else {
      textObj.set("shadow", undefined);
    }

    textObj.dirty = true;
    textObj.canvas?.requestRenderAll();
  }

  /**
   * Applies case transformation directly to the text string.
   */
  static transformCase(text: string, mode: "none" | "uppercase" | "lowercase" | "capitalize"): string {
    if (!text || mode === "none") return text;
    if (mode === "uppercase") return text.toUpperCase();
    if (mode === "lowercase") return text.toLowerCase();
    if (mode === "capitalize") {
      return text.replace(/\b\w/g, (char) => char.toUpperCase());
    }
    return text;
  }

  /**
   * Reads and builds a complete TextTypographyState from a selected Fabric text object.
   */
  static getTypographyState(textObj: any): TextTypographyState {
    if (!textObj) return { ...DEFAULT_TYPOGRAPHY_STATE };

    const isGrad =
      textObj.fill &&
      typeof textObj.fill === "object" &&
      "colorStops" in textObj.fill;

    const fillVal =
      typeof textObj.fill === "string" ? textObj.fill : "#0f172a";

    const hasShadow =
      textObj.shadow &&
      typeof textObj.shadow === "object" &&
      (textObj.shadow.blur > 0 || textObj.shadow.color);

    const hasStroke =
      textObj.stroke &&
      textObj.strokeWidth &&
      textObj.strokeWidth > 0;

    return {
      fontFamily: textObj.fontFamily || "Inter",
      fontSize: textObj.fontSize || 36,
      fontWeight: textObj.fontWeight || "normal",
      fontStyle: textObj.fontStyle || "normal",
      underline: Boolean(textObj.underline),
      linethrough: Boolean(textObj.linethrough),
      charSpacing: textObj.charSpacing || 0,
      lineHeight: textObj.lineHeight || 1.15,
      textAlign: textObj.textAlign || "left",
      textTransform: textObj.textTransform || "none",
      fillType: isGrad || textObj.textGradient?.enabled ? "gradient" : "solid",
      fillColor: fillVal,
      gradient: textObj.textGradient || {
        enabled: isGrad,
        type: "linear",
        angle: 90,
        stops: [
          { offset: 0, color: "#2563EB" },
          { offset: 1, color: "#06B6D4" },
        ],
      },
      stroke: {
        enabled: Boolean(hasStroke),
        color: typeof textObj.stroke === "string" ? textObj.stroke : "#2563EB",
        width: textObj.strokeWidth || 2,
      },
      glow: {
        enabled: Boolean(hasShadow),
        color: textObj.shadow?.color || "rgba(37, 99, 235, 0.4)",
        blur: textObj.shadow?.blur || 16,
        offsetX: textObj.shadow?.offsetX || 0,
        offsetY: textObj.shadow?.offsetY || 4,
      },
      curved: {
        enabled: Boolean(textObj.curvature && Math.abs(textObj.curvature) > 0),
        curvature: textObj.curvature || 0,
      },
    };
  }
}

