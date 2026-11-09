import { Canvas as FabricCanvas, type FabricObject } from "fabric";
import {
  ElementAnimationConfig,
  AnimationPreset,
  AnimationEasing,
} from "./types";

interface ObjectRestState {
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  angle: number;
  visible: boolean;
}

// Easing Functions
const EASING_MAP: Record<AnimationEasing, (t: number) => number> = {
  linear: (t) => t,
  easeOutQuad: (t) => t * (2 - t),
  easeOutBack: (t) => {
    const s = 1.70158;
    const p = t - 1;
    return p * p * ((s + 1) * p + s) + 1;
  },
  easeInOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};

let activeAnimationReq: number | null = null;
let activeTimelineTimeouts: number[] = [];
let savedRestStates = new Map<FabricObject, ObjectRestState>();

export const AnimationEngine = {
  /**
   * Captures the rest transform state of a fabric object.
   */
  captureRestState: (obj: FabricObject): ObjectRestState => ({
    left: obj.left ?? 0,
    top: obj.top ?? 0,
    scaleX: obj.scaleX ?? 1,
    scaleY: obj.scaleY ?? 1,
    opacity: obj.opacity ?? 1,
    angle: obj.angle ?? 0,
    visible: obj.visible ?? true,
  }),

  /**
   * Restores an object to its exact saved rest state.
   */
  restoreRestState: (obj: FabricObject, rest: ObjectRestState) => {
    obj.set({
      left: rest.left,
      top: rest.top,
      scaleX: rest.scaleX,
      scaleY: rest.scaleY,
      opacity: rest.opacity,
      angle: rest.angle,
      visible: rest.visible,
    });
    obj.setCoords();
  },

  /**
   * Stops any currently running animation loop and restores canvas to design state.
   */
  stopAll: (canvas: FabricCanvas) => {
    if (activeAnimationReq !== null) {
      cancelAnimationFrame(activeAnimationReq);
      activeAnimationReq = null;
    }
    activeTimelineTimeouts.forEach((tid) => clearTimeout(tid));
    activeTimelineTimeouts = [];

    // Restore rest state of all recorded objects
    savedRestStates.forEach((rest, obj) => {
      AnimationEngine.restoreRestState(obj, rest);
    });
    savedRestStates.clear();

    canvas.requestRenderAll();
  },

  /**
   * Previews a single element animation on canvas.
   */
  previewElement: (
    canvas: FabricCanvas,
    target: FabricObject,
    config: ElementAnimationConfig,
    onComplete?: () => void
  ) => {
    AnimationEngine.stopAll(canvas);

    const rest = AnimationEngine.captureRestState(target);
    savedRestStates.set(target, rest);

    const { preset, duration = 500, easing = "easeOutQuad" } = config;
    if (preset === "none") {
      onComplete?.();
      return;
    }

    const easeFn = EASING_MAP[easing] || EASING_MAP.easeOutQuad;

    // Determine initial transform based on preset
    let startLeft = rest.left;
    let startTop = rest.top;
    let startScaleX = rest.scaleX;
    let startScaleY = rest.scaleY;
    let startOpacity = 0;

    switch (preset) {
      case "fade-in":
        startOpacity = 0;
        break;
      case "slide-in-up":
        startTop = rest.top + 80;
        startOpacity = 0;
        break;
      case "slide-in-down":
        startTop = rest.top - 80;
        startOpacity = 0;
        break;
      case "slide-in-left":
        startLeft = rest.left - 100;
        startOpacity = 0;
        break;
      case "slide-in-right":
        startLeft = rest.left + 100;
        startOpacity = 0;
        break;
      case "pop-in":
        startScaleX = rest.scaleX * 0.3;
        startScaleY = rest.scaleY * 0.3;
        startOpacity = 0;
        break;
      case "bounce-in":
        startTop = rest.top + 120;
        startScaleX = rest.scaleX * 0.6;
        startScaleY = rest.scaleY * 0.6;
        startOpacity = 0;
        break;
      case "flip-in":
        startScaleX = 0;
        startOpacity = 0;
        break;
    }

    target.set({
      left: startLeft,
      top: startTop,
      scaleX: startScaleX,
      scaleY: startScaleY,
      opacity: startOpacity,
    });
    target.setCoords();
    canvas.requestRenderAll();

    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeFn(progress);

      const curLeft = startLeft + (rest.left - startLeft) * easedProgress;
      const curTop = startTop + (rest.top - startTop) * easedProgress;
      const curScaleX = startScaleX + (rest.scaleX - startScaleX) * easedProgress;
      const curScaleY = startScaleY + (rest.scaleY - startScaleY) * easedProgress;
      const curOpacity = startOpacity + (rest.opacity - startOpacity) * easedProgress;

      target.set({
        left: curLeft,
        top: curTop,
        scaleX: curScaleX,
        scaleY: curScaleY,
        opacity: curOpacity,
      });
      target.setCoords();
      canvas.requestRenderAll();

      if (progress < 1) {
        activeAnimationReq = requestAnimationFrame(tick);
      } else {
        // Animation completed — restore exact rest state
        AnimationEngine.restoreRestState(target, rest);
        savedRestStates.delete(target);
        canvas.requestRenderAll();
        activeAnimationReq = null;
        onComplete?.();
      }
    };

    activeAnimationReq = requestAnimationFrame(tick);
  },

  /**
   * Plays the complete sequence of animated elements across the slide in stagger order.
   */
  playSlideSequence: (
    canvas: FabricCanvas,
    onProgress?: (progress: number) => void,
    onComplete?: () => void
  ) => {
    AnimationEngine.stopAll(canvas);

    const objects = canvas.getObjects();
    const animatedItems: Array<{
      obj: FabricObject;
      config: ElementAnimationConfig;
      rest: ObjectRestState;
    }> = [];

    // Collect elements with configured animations
    objects.forEach((obj) => {
      const config = (obj as unknown as { animationConfig?: ElementAnimationConfig })
        .animationConfig;
      if (config && config.preset !== "none") {
        const rest = AnimationEngine.captureRestState(obj);
        savedRestStates.set(obj, rest);
        animatedItems.push({ obj, config, rest });
      }
    });

    if (animatedItems.length === 0) {
      onComplete?.();
      return;
    }

    // Sort by sequence order (#1, #2, #3...)
    animatedItems.sort((a, b) => a.config.order - b.config.order);

    // Hide all animated items initially
    animatedItems.forEach(({ obj }) => {
      obj.set("opacity", 0);
      obj.setCoords();
    });
    canvas.requestRenderAll();

    let cumulativeTime = 0;
    const totalItems = animatedItems.length;
    let completedCount = 0;

    animatedItems.forEach(({ obj, config, rest }, index) => {
      const startDelay = cumulativeTime + (config.delay || 0);
      cumulativeTime = startDelay + (config.duration || 500) * 0.4; // Stagger overlap

      const tid = window.setTimeout(() => {
        AnimationEngine.previewElement(canvas, obj, config, () => {
          completedCount++;
          onProgress?.(completedCount / totalItems);
          if (completedCount === totalItems) {
            AnimationEngine.stopAll(canvas);
            onComplete?.();
          }
        });
      }, startDelay);

      activeTimelineTimeouts.push(tid);
    });
  },
};
