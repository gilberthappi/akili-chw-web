import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import {
  Canvas as FabricCanvas,
  Rect,
  IText,
  Shadow,
  type FabricObject,
} from "fabric";
import {
  SlideStudioCanvasRef,
  StudioAspectRatio,
} from "./engine/types";
import { DEFAULT_CANVAS_BG } from "./engine/constants";
import { useCanvasViewport } from "./engine/useCanvasViewport";
import { useCanvasHistory } from "./engine/useCanvasHistory";
import { useCanvasShortcuts } from "./engine/useCanvasShortcuts";
import { applyFigmaControlsStyle } from "./engine/figmaControls";

interface SlideStudioCanvasProps {
  ratio?: StudioAspectRatio;
  initialRatio?: StudioAspectRatio;
  showGrid?: boolean;
  onViewportChange?: (zoom: number, ratio: StudioAspectRatio) => void;
  onSelectionChange?: (activeObject: FabricObject | null) => void;
}

export const SlideStudioCanvas = forwardRef<
  SlideStudioCanvasRef,
  SlideStudioCanvasProps
>(
  (
    {
      ratio: propRatio,
      initialRatio = "16:9",
      showGrid = true,
      onViewportChange,
      onSelectionChange,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<FabricCanvas | null>(null);

    // Viewport and history engines
    const viewport = useCanvasViewport(propRatio || initialRatio);
    const history = useCanvasHistory();

    // Panning state refs
    const isSpacePressedRef = useRef<boolean>(false);
    const isMouseDownRef = useRef<boolean>(false);
    const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    // ── Notify Parent of Viewport Change ─────────────────────────────────────
    useEffect(() => {
      onViewportChange?.(viewport.zoom, viewport.ratio);
    }, [viewport.zoom, viewport.ratio, onViewportChange]);

    // ── Sync with External Ratio Prop Changes ────────────────────────────────
    useEffect(() => {
      if (propRatio && propRatio !== viewport.ratioRef.current) {
        const container = containerRef.current;
        if (!container || !fabricRef.current) return;
        viewport.changeRatio(
          fabricRef.current,
          propRatio,
          container.clientWidth,
          container.clientHeight
        );
      }
    }, [propRatio, viewport]);

    // ── Imperative Ref Methods ──────────────────────────────────────────────
    useImperativeHandle(ref, () => ({
      getZoom: () => viewport.zoomRef.current,
      setZoom: (newZoom: number) => {
        const container = containerRef.current;
        if (!container) return;
        const centerPoint = {
          x: container.clientWidth / 2,
          y: container.clientHeight / 2,
        };
        viewport.zoomToScreenPoint(fabricRef.current, centerPoint, newZoom);
      },
      resetZoomToFit: () => {
        const container = containerRef.current;
        if (!container) return;
        const matrix = viewport.calculateFitMatrix(
          container.clientWidth,
          container.clientHeight
        );
        viewport.setViewport(fabricRef.current, matrix.scale, {
          x: matrix.panX,
          y: matrix.panY,
        });
      },
      changeRatio: (newRatio: StudioAspectRatio) => {
        const container = containerRef.current;
        if (!container || !fabricRef.current) return;
        viewport.changeRatio(
          fabricRef.current,
          newRatio,
          container.clientWidth,
          container.clientHeight
        );
      },
      undo: () => history.undo(fabricRef.current),
      redo: () => history.redo(fabricRef.current),
      canUndo: history.canUndo,
      canRedo: history.canRedo,
      getCanvasJson: () => {
        if (!fabricRef.current) return {};
        return fabricRef.current.toObject();
      },
      loadCanvasJson: async (json: Record<string, unknown>) => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        await canvas.loadFromJSON(json);
        canvas.getObjects().forEach(applyFigmaControlsStyle);
        canvas.requestRenderAll();
        history.initHistory(canvas);
      },
      exportHighResBlob: async (multiplier = 2): Promise<Blob> => {
        const canvas = fabricRef.current;
        if (!canvas) throw new Error("Canvas is not ready");

        const currentVpt = canvas.viewportTransform
          ? [...canvas.viewportTransform]
          : [1, 0, 0, 1, 0, 0];

        // Temporarily reset viewport to 1:1 world artboard for pure lossless export
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

        const dataUrl = canvas.toDataURL({
          format: "png",
          multiplier,
          width: viewport.artboard.width,
          height: viewport.artboard.height,
          left: 0,
          top: 0,
        });

        // Restore user viewport transform
        canvas.setViewportTransform(
          currentVpt as [number, number, number, number, number, number]
        );
        canvas.requestRenderAll();

        const res = await fetch(dataUrl);
        return await res.blob();
      },
    }));

    // ── Keyboard Shortcuts Engine ───────────────────────────────────────────
    useCanvasShortcuts({
      canvas: fabricRef.current,
      onUndo: () => history.undo(fabricRef.current),
      onRedo: () => history.redo(fabricRef.current),
      onResetFit: () => {
        const container = containerRef.current;
        if (!container || !fabricRef.current) return;
        const matrix = viewport.calculateFitMatrix(
          container.clientWidth,
          container.clientHeight
        );
        viewport.setViewport(fabricRef.current, matrix.scale, {
          x: matrix.panX,
          y: matrix.panY,
        });
      },
      onZoomIn: () => {
        const container = containerRef.current;
        if (!container || !fabricRef.current) return;
        const center = {
          x: container.clientWidth / 2,
          y: container.clientHeight / 2,
        };
        viewport.zoomToScreenPoint(
          fabricRef.current,
          center,
          viewport.zoomRef.current * 1.15
        );
      },
      onZoomOut: () => {
        const container = containerRef.current;
        if (!container || !fabricRef.current) return;
        const center = {
          x: container.clientWidth / 2,
          y: container.clientHeight / 2,
        };
        viewport.zoomToScreenPoint(
          fabricRef.current,
          center,
          viewport.zoomRef.current * 0.85
        );
      },
      onDeleteSelected: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const active = canvas.getActiveObjects();
        if (active && active.length > 0) {
          canvas.discardActiveObject();
          active.forEach((obj) => canvas.remove(obj));
          canvas.requestRenderAll();
          history.saveSnapshot(canvas, true);
        }
      },
      isSpacePressedRef,
      setIsPanningMode: (active) => {
        viewport.setIsPanning(active);
        const canvas = fabricRef.current;
        if (canvas) {
          canvas.defaultCursor = active ? "grab" : "default";
          canvas.setCursor(canvas.defaultCursor);
        }
      },
    });

    // ── Fabric Canvas Initialization ────────────────────────────────────────
    useEffect(() => {
      const el = canvasElRef.current;
      const container = containerRef.current;
      if (!el || !container || fabricRef.current) return;

      const canvas = new FabricCanvas(el, {
        width: container.clientWidth,
        height: container.clientHeight,
        backgroundColor: "transparent",
        preserveObjectStacking: true,
        selectionColor: "rgba(59, 130, 246, 0.08)",
        selectionBorderColor: "#3b82f6",
        selectionLineWidth: 1.5,
        enableRetinaScaling: true,
      });
      fabricRef.current = canvas;

      // Selection listeners
      const handleSelection = () => {
        const active = canvas.getActiveObject() ?? null;
        onSelectionChange?.(active);
      };
      canvas.on("selection:created", handleSelection);
      canvas.on("selection:updated", handleSelection);
      canvas.on("selection:cleared", () => onSelectionChange?.(null));

      // History tracking listeners
      canvas.on("object:added", (e) => {
        if (e.target) applyFigmaControlsStyle(e.target);
        history.saveSnapshot(canvas);
      });
      canvas.on("object:modified", () => history.saveSnapshot(canvas));
      canvas.on("object:removed", () => history.saveSnapshot(canvas));

      // ── Native Fabric Panning Listeners ─────────────────────────────────
      canvas.on("mouse:down", (opt) => {
        const evt = opt.e as MouseEvent;
        // Spacebar + Left click OR Middle mouse button
        if (evt.button === 1 || (evt.button === 0 && isSpacePressedRef.current)) {
          isMouseDownRef.current = true;
          lastMousePosRef.current = { x: evt.clientX, y: evt.clientY };
          viewport.setIsPanning(true);
          canvas.selection = false;
          canvas.defaultCursor = "grabbing";
          canvas.setCursor("grabbing");
        }
      });

      canvas.on("mouse:move", (opt) => {
        if (!isMouseDownRef.current) return;
        const evt = opt.e as MouseEvent;
        const dx = evt.clientX - lastMousePosRef.current.x;
        const dy = evt.clientY - lastMousePosRef.current.y;
        lastMousePosRef.current = { x: evt.clientX, y: evt.clientY };

        const currentPan = viewport.panRef.current;
        const nextPan = {
          x: currentPan.x + dx,
          y: currentPan.y + dy,
        };

        viewport.setViewport(canvas, viewport.zoomRef.current, nextPan);
      });

      const handleGlobalMouseUp = () => {
        if (isMouseDownRef.current) {
          isMouseDownRef.current = false;
          viewport.setIsPanning(false);
          canvas.selection = true;
          canvas.defaultCursor = isSpacePressedRef.current ? "grab" : "default";
          canvas.setCursor(canvas.defaultCursor);
        }
      };

      canvas.on("mouse:up", handleGlobalMouseUp);
      window.addEventListener("mouseup", handleGlobalMouseUp);

      // ── Native Fabric Mouse Wheel Zoom ──────────────────────────────────
      canvas.on("mouse:wheel", (opt) => {
        opt.e.preventDefault();
        opt.e.stopPropagation();

        const rect = container.getBoundingClientRect();
        const pointer = {
          x: opt.e.clientX - rect.left,
          y: opt.e.clientY - rect.top,
        };

        const zoomFactor = opt.e.deltaY < 0 ? 1.08 : 0.92;
        const targetZoom = viewport.zoomRef.current * zoomFactor;

        viewport.zoomToScreenPoint(canvas, pointer, targetZoom);
      });

      // Initialize viewport centering
      const matrix = viewport.calculateFitMatrix(
        container.clientWidth,
        container.clientHeight
      );
      viewport.setViewport(canvas, matrix.scale, {
        x: matrix.panX,
        y: matrix.panY,
      });

      history.initHistory(canvas);

      // Resize Observer for responsive viewport auto-adjust
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            canvas.setDimensions({ width, height });
            canvas.requestRenderAll();
          }
        }
      });
      resizeObserver.observe(container);

      return () => {
        window.removeEventListener("mouseup", handleGlobalMouseUp);
        resizeObserver.disconnect();
        canvas.dispose();
        fabricRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    // ── Helper: Add Sample Card (For Day 1 Verification) ────────────────────
    const addSampleCard = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const artboard = viewport.artboard;
      const card = new Rect({
        left: artboard.width / 2 - 250,
        top: artboard.height / 2 - 150,
        width: 500,
        height: 300,
        fill: "#ffffff",
        stroke: "#e2e8f0",
        strokeWidth: 2,
        rx: 24, // 24px rounded corners (bending preview)
        ry: 24,
        shadow: new Shadow({
          color: "rgba(15, 23, 42, 0.12)",
          blur: 32,
          offsetX: 0,
          offsetY: 12,
        }),
      });

      applyFigmaControlsStyle(card);
      canvas.add(card);
      canvas.setActiveObject(card);
      canvas.requestRenderAll();
    }, [viewport.artboard]);

    // ── Helper: Add Sample Text (For Day 1 Verification) ────────────────────
    const addSampleText = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const artboard = viewport.artboard;
      const text = new IText("Design Slide Without Limits", {
        left: artboard.width / 2 - 220,
        top: artboard.height / 2 - 40,
        fontSize: 32,
        fontFamily: "Arial",
        fontWeight: "bold",
        fill: "#0f172a",
      });

      applyFigmaControlsStyle(text);
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.requestRenderAll();
    }, [viewport.artboard]);

    // Expose test helper callbacks on the DOM element
    useEffect(() => {
      if (containerRef.current) {
        (containerRef.current as unknown as Record<string, unknown>).__addSampleCard =
          addSampleCard;
        (containerRef.current as unknown as Record<string, unknown>).__addSampleText =
          addSampleText;
      }
    }, [addSampleCard, addSampleText]);

    // Visual artboard screen position
    const artboardScreenLeft = viewport.pan.x;
    const artboardScreenTop = viewport.pan.y;
    const artboardScreenWidth = viewport.artboard.width * viewport.zoom;
    const artboardScreenHeight = viewport.artboard.height * viewport.zoom;

    return (
      <div
        ref={containerRef}
        className={`relative w-full h-full overflow-hidden select-none bg-[#f8fafc] ${
          viewport.isPanning ? "cursor-grabbing" : ""
        }`}
        style={{
          backgroundImage: showGrid
            ? "radial-gradient(#cbd5e1 1.2px, transparent 1.2px)"
            : undefined,
          backgroundSize: showGrid ? "24px 24px" : undefined,
        }}
      >
        {/* Visual Artboard Elevated Canvas Background */}
        <div
          className="absolute pointer-events-none transition-all duration-75"
          style={{
            left: artboardScreenLeft,
            top: artboardScreenTop,
            width: artboardScreenWidth,
            height: artboardScreenHeight,
            backgroundColor: DEFAULT_CANVAS_BG,
            boxShadow:
              "0 20px 45px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
            borderRadius: 4,
          }}
        >
          {/* Subtle artboard tag */}
          <div className="absolute -top-6 left-0 flex items-center space-x-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            <span>{viewport.artboard.label}</span>
            <span>•</span>
            <span>
              {viewport.artboard.width} × {viewport.artboard.height}
            </span>
          </div>
        </div>

        {/* Main Fabric.js Canvas */}
        <canvas ref={canvasElRef} className="absolute inset-0 z-10" />

        {/* Bottom Info Status Pill */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center space-x-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gray-200/80 shadow-xs text-xs text-gray-600">
          <span className="font-semibold text-gray-800">
            {viewport.artboard.ratio}
          </span>
          <span className="text-gray-300">|</span>
          <span>{Math.round(viewport.zoom * 100)}% Zoom</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-400">
            Hold Space to Pan • Scroll to Zoom • Ctrl+Z / Ctrl+Y
          </span>
        </div>
      </div>
    );
  }
);

SlideStudioCanvas.displayName = "SlideStudioCanvas";
