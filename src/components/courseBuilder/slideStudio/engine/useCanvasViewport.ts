import { useState, useCallback, useRef } from "react";
import { Canvas as FabricCanvas } from "fabric";
import {
  StudioAspectRatio,
  CoordinatePoint,
  ViewportTransformMatrix,
} from "./types";
import { ARTBOARD_PRESETS, CANVAS_LIMITS } from "./constants";

export function useCanvasViewport(initialRatio: StudioAspectRatio = "16:9") {
  const [ratio, setRatio] = useState<StudioAspectRatio>(initialRatio);
  const [zoom, setZoomState] = useState<number>(1);
  const [pan, setPanState] = useState<CoordinatePoint>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Synchronous refs to avoid stale closures in high-frequency event handlers (wheel, drag)
  const zoomRef = useRef<number>(1);
  const panRef = useRef<CoordinatePoint>({ x: 0, y: 0 });
  const ratioRef = useRef<StudioAspectRatio>(initialRatio);

  const artboard = ARTBOARD_PRESETS[ratio];

  /**
   * Calculates the optimal scale to fit the artboard inside the container
   * with uniform padding.
   */
  const calculateFitMatrix = useCallback(
    (containerW: number, containerH: number): ViewportTransformMatrix => {
      if (containerW <= 0 || containerH <= 0) {
        return { scale: 1, panX: 0, panY: 0 };
      }
      const pad = CANVAS_LIMITS.VIEWPORT_PADDING * 2;
      const availableW = Math.max(100, containerW - pad);
      const availableH = Math.max(100, containerH - pad);

      const currentArtboard = ARTBOARD_PRESETS[ratioRef.current];
      const scaleX = availableW / currentArtboard.width;
      const scaleY = availableH / currentArtboard.height;
      const fitScale = Math.min(scaleX, scaleY);

      // Clamp between limits
      const clampedScale = Math.max(
        CANVAS_LIMITS.MIN_ZOOM,
        Math.min(CANVAS_LIMITS.MAX_ZOOM, fitScale)
      );

      // Center in container
      const panX = (containerW - currentArtboard.width * clampedScale) / 2;
      const panY = (containerH - currentArtboard.height * clampedScale) / 2;

      return {
        scale: clampedScale,
        panX,
        panY,
      };
    },
    []
  );

  /**
   * Applies viewport transform directly onto the Fabric.js canvas instance.
   */
  const applyTransformToCanvas = useCallback(
    (canvas: FabricCanvas, scale: number, panX: number, panY: number) => {
      // Fabric v7 viewportTransform: [scaleX, skewY, skewX, scaleY, transX, transY]
      canvas.setViewportTransform([scale, 0, 0, scale, panX, panY]);
      canvas.requestRenderAll();
    },
    []
  );

  /**
   * Updates zoom and pan together synchronously and commits to React state.
   */
  const setViewport = useCallback(
    (canvas: FabricCanvas | null, newZoom: number, newPan: CoordinatePoint) => {
      const clampedZoom = Math.max(
        CANVAS_LIMITS.MIN_ZOOM,
        Math.min(CANVAS_LIMITS.MAX_ZOOM, newZoom)
      );

      zoomRef.current = clampedZoom;
      panRef.current = newPan;
      setZoomState(clampedZoom);
      setPanState(newPan);

      if (canvas) {
        applyTransformToCanvas(canvas, clampedZoom, newPan.x, newPan.y);
      }
    },
    [applyTransformToCanvas]
  );

  /**
   * Zooms toward a specific screen point (zoom-to-cursor math).
   */
  const zoomToScreenPoint = useCallback(
    (
      canvas: FabricCanvas | null,
      screenPoint: CoordinatePoint,
      nextZoom: number
    ) => {
      const clamped = Math.max(
        CANVAS_LIMITS.MIN_ZOOM,
        Math.min(CANVAS_LIMITS.MAX_ZOOM, nextZoom)
      );
      const currentZoom = zoomRef.current;
      const currentPan = panRef.current;

      // Mathematical anchor calculation:
      // newPan = point - (point - oldPan) * (newZoom / oldZoom)
      const ratioScale = clamped / currentZoom;
      const newPanX = screenPoint.x - (screenPoint.x - currentPan.x) * ratioScale;
      const newPanY = screenPoint.y - (screenPoint.y - currentPan.y) * ratioScale;

      setViewport(canvas, clamped, { x: newPanX, y: newPanY });
    },
    [setViewport]
  );

  /**
   * Converts a screen client point to artboard world coordinate.
   */
  const screenToArtboard = useCallback((point: CoordinatePoint): CoordinatePoint => {
    const z = zoomRef.current;
    const p = panRef.current;
    return {
      x: (point.x - p.x) / z,
      y: (point.y - p.y) / z,
    };
  }, []);

  /**
   * Converts an artboard world coordinate to screen client point.
   */
  const artboardToScreen = useCallback((point: CoordinatePoint): CoordinatePoint => {
    const z = zoomRef.current;
    const p = panRef.current;
    return {
      x: point.x * z + p.x,
      y: point.y * z + p.y,
    };
  }, []);

  /**
   * Switches aspect ratio and auto-repositions.
   */
  const changeRatio = useCallback(
    (
      canvas: FabricCanvas | null,
      newRatio: StudioAspectRatio,
      containerW: number,
      containerH: number
    ) => {
      ratioRef.current = newRatio;
      setRatio(newRatio);

      if (containerW > 0 && containerH > 0) {
        const matrix = calculateFitMatrix(containerW, containerH);
        setViewport(canvas, matrix.scale, { x: matrix.panX, y: matrix.panY });
      }
    },
    [calculateFitMatrix, setViewport]
  );

  return {
    ratio,
    artboard,
    zoom,
    pan,
    isPanning,
    showGrid,
    zoomRef,
    panRef,
    ratioRef,
    setIsPanning,
    setShowGrid,
    setViewport,
    zoomToScreenPoint,
    calculateFitMatrix,
    screenToArtboard,
    artboardToScreen,
    changeRatio,
  };
}
