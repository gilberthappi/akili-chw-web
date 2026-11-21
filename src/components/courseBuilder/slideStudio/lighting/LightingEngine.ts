import { Shadow, FabricObject, Canvas as FabricCanvas } from "fabric";
import {
  LightingState,
  ShadowLayer,
  hexToRgba,
  computeOffsetsFromAngle,
  LIGHTING_PRESETS,
} from "./types";

/**
 * LightingEngine - Core system managing multi-stacked shadows, inset depth,
 * and Fabric.js synchronization.
 */
export class LightingEngine {
  /**
   * Applies a complete LightingState to a FabricObject.
   * Updates native Fabric.Shadow with the primary visual layer for export & bounds,
   * stores the full multi-layer lightingState on the object, and requests a canvas re-render.
   */
  static applyLightingToObject(
    obj: FabricObject,
    state: LightingState,
    canvas?: FabricCanvas | null
  ): void {
    // Attach custom lightingState
    (obj as FabricObject & { lightingState?: LightingState }).lightingState = {
      ...state,
      layers: state.layers.map((l) => ({ ...l })),
    };

    // Find the primary outer shadow layer (contact or ambient) for Fabric's native shadow
    const activeOuterLayer = state.layers.find(
      (l) => l.enabled && (l.type === "contact" || l.type === "ambient")
    );

    if (activeOuterLayer && state.distance >= 0 && activeOuterLayer.opacity > 0) {
      const shadowColor = hexToRgba(activeOuterLayer.color, activeOuterLayer.opacity);
      obj.set(
        "shadow",
        new Shadow({
          color: shadowColor,
          blur: activeOuterLayer.blur,
          offsetX: activeOuterLayer.offsetX,
          offsetY: activeOuterLayer.offsetY,
          affectStroke: false,
          nonScaling: false,
        })
      );
    } else {
      obj.set("shadow", null);
    }

    obj.dirty = true;
    if (canvas) {
      canvas.requestRenderAll();
    }
  }

  /**
   * Recomputes offsets for all active layers when light angle or distance changes.
   */
  static updateLightAngleAndDistance(
    state: LightingState,
    angle: number,
    distance: number
  ): LightingState {
    const updatedLayers = state.layers.map((layer) => {
      let layerDistance = distance;

      // Ambient layer travels slightly further for atmospheric projection
      if (layer.type === "ambient") {
        layerDistance = Math.round(distance * 1.5);
      } else if (layer.type === "inner") {
        layerDistance = Math.max(1, Math.round(distance * 0.75));
      }

      const { offsetX, offsetY } = computeOffsetsFromAngle(angle, layerDistance);

      return {
        ...layer,
        offsetX,
        offsetY,
      };
    });

    return {
      ...state,
      angle,
      distance,
      presetId: "custom",
      layers: updatedLayers,
    };
  }

  /**
   * Applies a built-in lighting preset by ID.
   */
  static applyPreset(
    presetId: string,
    obj: FabricObject,
    canvas?: FabricCanvas | null
  ): LightingState {
    const preset = LIGHTING_PRESETS.find((p) => p.id === presetId) || LIGHTING_PRESETS[0];
    const clonedState: LightingState = {
      ...preset.state,
      layers: preset.state.layers.map((l) => ({ ...l })),
    };

    this.applyLightingToObject(obj, clonedState, canvas);
    return clonedState;
  }

  /**
   * Inverse-clipped inner shadow renderer for Canvas 2D contexts.
   * Uses an even-odd inverted path frame to cast an authentic inner shadow.
   */
  static renderInnerShadow(
    ctx: CanvasRenderingContext2D,
    drawPath: (ctx: CanvasRenderingContext2D, callBeginPath?: boolean) => void,
    width: number,
    height: number,
    layer: ShadowLayer
  ): void {
    if (!layer.enabled || layer.opacity <= 0 || layer.blur <= 0) return;

    ctx.save();

    // Step 1: Clip strictly to the shape boundary
    ctx.beginPath();
    drawPath(ctx, false);
    ctx.clip();

    // Step 2: Configure the drop shadow to cast inward
    ctx.shadowColor = hexToRgba(layer.color, layer.opacity);
    ctx.shadowBlur = layer.blur;
    ctx.shadowOffsetX = layer.offsetX;
    ctx.shadowOffsetY = layer.offsetY;

    // Step 3: Draw compound path (outer rect + inner hole without beginPath)
    const margin = Math.max(width, height, 400) * 2;
    ctx.beginPath();
    // Outer bounding frame
    ctx.rect(-margin, -margin, margin * 2, margin * 2);
    // Inner hole path
    drawPath(ctx, false);

    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.fill("evenodd");

    ctx.restore();
  }

  /**
   * Extracts or initializes the LightingState of a given FabricObject.
   */
  static getLightingState(obj: FabricObject): LightingState {
    const custom = (obj as FabricObject & { lightingState?: LightingState }).lightingState;
    if (custom && Array.isArray(custom.layers)) {
      return custom;
    }

    // If object has a native shadow but no custom lightingState, convert it to a subtle state
    if (obj.shadow && obj.shadow instanceof Shadow) {
      return {
        angle: 90,
        distance: Math.round(obj.shadow.offsetY || 4),
        presetId: "custom",
        layers: [
          {
            id: "contact-1",
            name: "Contact Shadow",
            type: "contact",
            enabled: true,
            color: obj.shadow.color || "#0f172a",
            opacity: 0.12,
            blur: obj.shadow.blur || 6,
            offsetX: obj.shadow.offsetX || 0,
            offsetY: obj.shadow.offsetY || 3,
          },
        ],
      };
    }

    // Default to Flat (None)
    return {
      angle: 90,
      distance: 0,
      presetId: "flat",
      layers: [],
    };
  }
}
