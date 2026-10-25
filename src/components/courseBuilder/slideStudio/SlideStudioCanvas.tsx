import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from "react";
import {
  Canvas as FabricCanvas,
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
import { LightingEngine } from "./lighting/LightingEngine";
import { BentCard, CornerRadii } from "./shapes/BentCard";
import { createOrganicBlob } from "./shapes/OrganicBlob";
import { createWavyDivider } from "./shapes/WavyDivider";
import {
  createShieldBadge,
  createSpeechBubble,
  createChevronArrow,
} from "./shapes/PresetVectorShapes";
import { useVectorPenTool } from "./engine/useVectorPenTool";

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
      getFabricCanvas: () => fabricRef.current,
      addBentCard: (radii?: [number, number, number, number], title?: string, fill?: string) => {
        addBentCard(radii, title, fill);
      },
      addText: (content: string, fontSize?: number) => {
        addText(content, fontSize);
      },
      addOrganicBlob: () => addOrganicBlob(),
      addWavyDivider: () => addWavyDivider(),
      addShieldBadge: () => addShieldBadge(),
      addSpeechBubble: () => addSpeechBubble(),
      addChevronArrow: () => addChevronArrow(),
      togglePenTool: () => penTool.togglePen(),
      get isPenActive() {
        return penTool.isPenActive;
      },
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
      onDuplicateSelected: () => {
        const canvas = fabricRef.current;
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (!active) return;
        active.clone().then((cloned: FabricObject) => {
          cloned.set({
            left: (cloned.left || 0) + 30,
            top: (cloned.top || 0) + 30,
          });
          applyFigmaControlsStyle(cloned);
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          canvas.requestRenderAll();
          history.saveSnapshot(canvas, true);
        });
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

    // ── Helper: Add Bent Card ──────────────────────────────────────────────
    const addBentCard = useCallback((radii: CornerRadii = [24, 24, 24, 24], _title?: string, fill = "#ffffff") => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const artboard = viewport.artboard;
      const card = new BentCard({
        left: artboard.width / 2 - 240,
        top: artboard.height / 2 - 140,
        width: 480,
        height: 280,
        fill,
        stroke: "#e2e8f0",
        strokeWidth: 2,
        cornerRadii: [...radii],
      });

      LightingEngine.applyPreset("elevated", card);

      applyFigmaControlsStyle(card);
      canvas.add(card);
      canvas.setActiveObject(card);
      canvas.requestRenderAll();
      history.saveSnapshot(canvas, true);
    }, [viewport.artboard, history]);

    // ── Helper: Add Text ────────────────────────────────────────────────────
    const addText = useCallback((content: string, fontSize = 32) => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const artboard = viewport.artboard;
      const text = new IText(content, {
        left: artboard.width / 2 - 200,
        top: artboard.height / 2 - 30,
        fontSize,
        fontFamily: "Arial",
        fontWeight: fontSize > 24 ? "bold" : "normal",
        fill: "#0f172a",
      });

      applyFigmaControlsStyle(text);
      canvas.add(text);
      canvas.setActiveObject(text);
      canvas.requestRenderAll();
      history.saveSnapshot(canvas, true);
    }, [viewport.artboard, history]);

    // ── Helper: Add Organic Blob ───────────────────────────────────────────
    const addOrganicBlob = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const artboard = viewport.artboard;
      const blob = createOrganicBlob({
        left: artboard.width / 2,
        top: artboard.height / 2,
        fill: "#3B82F6",
        stroke: "#2563EB",
        strokeWidth: 2,
        opacity: 0.85,
        shadow: new Shadow({
          color: "rgba(59, 130, 246, 0.25)",
          blur: 24,
          offsetX: 0,
          offsetY: 8,
        }),
      });

      applyFigmaControlsStyle(blob);
      canvas.add(blob);
      canvas.setActiveObject(blob);
      canvas.requestRenderAll();
      history.saveSnapshot(canvas, true);
    }, [viewport.artboard, history]);

    // ── Helper: Add Wavy Divider ───────────────────────────────────────────
    const addWavyDivider = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const artboard = viewport.artboard;
      const wave = createWavyDivider({
        left: artboard.width / 2,
        top: artboard.height - 100,
        width: artboard.width,
        height: 180,
        fill: "#2563EB",
        stroke: "#1D4ED8",
        strokeWidth: 0,
        opacity: 0.9,
      });

      applyFigmaControlsStyle(wave);
      canvas.add(wave);
      canvas.setActiveObject(wave);
      canvas.requestRenderAll();
      history.saveSnapshot(canvas, true);
    }, [viewport.artboard, history]);

    // ── Helper: Add Shield Badge ───────────────────────────────────────────
    const addShieldBadge = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const artboard = viewport.artboard;
      const shield = createShieldBadge({
        left: artboard.width / 2,
        top: artboard.height / 2,
        shadow: new Shadow({
          color: "rgba(16, 185, 129, 0.25)",
          blur: 20,
          offsetX: 0,
          offsetY: 8,
        }),
      });

      applyFigmaControlsStyle(shield);
      canvas.add(shield);
      canvas.setActiveObject(shield);
      canvas.requestRenderAll();
      history.saveSnapshot(canvas, true);
    }, [viewport.artboard, history]);

    // ── Helper: Add Speech Bubble ──────────────────────────────────────────
    const addSpeechBubble = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const artboard = viewport.artboard;
      const bubble = createSpeechBubble({
        left: artboard.width / 2,
        top: artboard.height / 2,
        shadow: new Shadow({
          color: "rgba(139, 92, 246, 0.25)",
          blur: 20,
          offsetX: 0,
          offsetY: 8,
        }),
      });

      applyFigmaControlsStyle(bubble);
      canvas.add(bubble);
      canvas.setActiveObject(bubble);
      canvas.requestRenderAll();
      history.saveSnapshot(canvas, true);
    }, [viewport.artboard, history]);

    // ── Helper: Add Chevron Arrow ──────────────────────────────────────────
    const addChevronArrow = useCallback(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      const artboard = viewport.artboard;
      const chevron = createChevronArrow({
        left: artboard.width / 2,
        top: artboard.height / 2,
        shadow: new Shadow({
          color: "rgba(2, 132, 199, 0.25)",
          blur: 20,
          offsetX: 0,
          offsetY: 8,
        }),
      });

      applyFigmaControlsStyle(chevron);
      canvas.add(chevron);
      canvas.setActiveObject(chevron);
      canvas.requestRenderAll();
      history.saveSnapshot(canvas, true);
    }, [viewport.artboard, history]);

    // ── Vector Pen Tool Integration ────────────────────────────────────────
    const penTool = useVectorPenTool({
      canvas: fabricRef.current,
      onPathCreated: () => {
        if (fabricRef.current) {
          history.saveSnapshot(fabricRef.current, true);
        }
      },
    });

    // ── Helper: Add Sample Card (Backward compatible) ────────────────────────
    const addSampleCard = useCallback(() => {
      addBentCard([24, 24, 24, 24]);
    }, [addBentCard]);

    // ── Helper: Add Sample Text (Backward compatible) ────────────────────────
    const addSampleText = useCallback(() => {
      addText("Design Slide Without Limits", 32);
    }, [addText]);

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

        {/* Interactive Pen Tool Banner */}
        {penTool.isPenActive && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-3 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>Pen Tool Active: Click to add points • Double-click or click start point to close</span>
            <button
              type="button"
              onClick={() => penTool.cancelPen()}
              className="bg-blue-700 hover:bg-blue-800 text-[11px] px-2.5 py-0.5 rounded-full font-medium transition"
            >
              Cancel (Esc)
            </button>
          </div>
        )}

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
