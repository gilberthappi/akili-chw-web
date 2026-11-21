import { useState, useEffect, useRef, useCallback } from "react";
import {
  Canvas as FabricCanvas,
  Path,
  Circle,
  Line,
  type TPointerEventInfo,
  type TPointerEvent,
} from "fabric";
import { applyFigmaControlsStyle } from "./figmaControls";

interface Point {
  x: number;
  y: number;
}

interface UseVectorPenToolProps {
  canvas: FabricCanvas | null;
  onPathCreated: () => void;
}

export function useVectorPenTool({ canvas, onPathCreated }: UseVectorPenToolProps) {
  const [isPenActive, setIsPenActive] = useState<boolean>(false);
  const [pointsCount, setPointsCount] = useState<number>(0);

  const pointsRef = useRef<Point[]>([]);
  const previewLineRef = useRef<Line | null>(null);
  const anchorDotsRef = useRef<Circle[]>([]);
  const isPenActiveRef = useRef<boolean>(false);

  isPenActiveRef.current = isPenActive;

  // Cleanup temporary helper objects from canvas
  const cleanupHelpers = useCallback(() => {
    if (!canvas) return;

    if (previewLineRef.current) {
      canvas.remove(previewLineRef.current);
      previewLineRef.current = null;
    }

    anchorDotsRef.current.forEach((dot) => {
      canvas.remove(dot);
    });
    anchorDotsRef.current = [];
    pointsRef.current = [];
    setPointsCount(0);
    canvas.requestRenderAll();
  }, [canvas]);

  // Finish path and add to canvas as a permanent Fabric Path
  const commitPath = useCallback(
    (close: boolean = false) => {
      if (!canvas || pointsRef.current.length < 2) {
        cleanupHelpers();
        setIsPenActive(false);
        return;
      }

      const pts = pointsRef.current;
      const commands: string[] = [`M ${pts[0].x} ${pts[0].y}`];

      for (let i = 1; i < pts.length; i++) {
        commands.push(`L ${pts[i].x} ${pts[i].y}`);
      }

      if (close) {
        commands.push("Z");
      }

      const pathString = commands.join(" ");

      const newPath = new Path(pathString, {
        fill: close ? "#3B82F6" : "",
        stroke: "#2563EB",
        strokeWidth: 3,
        strokeLineCap: "round",
        strokeLineJoin: "round",
        opacity: close ? 0.9 : 1,
      });

      applyFigmaControlsStyle(newPath);
      cleanupHelpers();
      setIsPenActive(false);

      canvas.add(newPath);
      canvas.setActiveObject(newPath);
      canvas.requestRenderAll();
      onPathCreated();
    },
    [canvas, cleanupHelpers, onPathCreated]
  );

  // Toggle or cancel Pen Tool
  const togglePen = useCallback(() => {
    setIsPenActive((prev) => {
      if (prev) {
        cleanupHelpers();
      }
      return !prev;
    });
  }, [cleanupHelpers]);

  const cancelPen = useCallback(() => {
    cleanupHelpers();
    setIsPenActive(false);
  }, [cleanupHelpers]);

  // Setup / teardown Pen Tool mode on canvas
  useEffect(() => {
    if (!canvas) return;

    if (isPenActive) {
      canvas.defaultCursor = "crosshair";
      canvas.hoverCursor = "crosshair";
      canvas.selection = false;
      canvas.discardActiveObject();
      canvas.forEachObject((o) => {
        o.selectable = false;
        o.evented = false;
      });
      canvas.requestRenderAll();
    } else {
      canvas.defaultCursor = "default";
      canvas.hoverCursor = "move";
      canvas.selection = true;
      canvas.forEachObject((o) => {
        o.selectable = true;
        o.evented = true;
      });
      cleanupHelpers();
      canvas.requestRenderAll();
    }

    return () => {
      if (canvas) {
        canvas.defaultCursor = "default";
        canvas.hoverCursor = "move";
        canvas.selection = true;
        canvas.forEachObject((o) => {
          o.selectable = true;
          o.evented = true;
        });
      }
    };
  }, [canvas, isPenActive, cleanupHelpers]);

  // Event handlers for interactive drawing
  useEffect(() => {
    if (!canvas || !isPenActive) return;

    const handleMouseDown = (opt: TPointerEventInfo<TPointerEvent>) => {
      if (!isPenActiveRef.current) return;
      const scenePoint = canvas.getScenePoint(opt.e);
      const x = Math.round(scenePoint.x);
      const y = Math.round(scenePoint.y);

      const pts = pointsRef.current;

      // If clicking close to the first anchor point and we have at least 3 points, close it!
      if (pts.length >= 3) {
        const dx = x - pts[0].x;
        const dy = y - pts[0].y;
        if (Math.hypot(dx, dy) <= 16) {
          commitPath(true);
          return;
        }
      }

      // Add new anchor point
      pts.push({ x, y });
      setPointsCount(pts.length);

      // Create an anchor dot visualization
      const dot = new Circle({
        left: x,
        top: y,
        radius: 4,
        fill: pts.length === 1 ? "#2563EB" : "#ffffff",
        stroke: "#2563EB",
        strokeWidth: 2,
        originX: "center",
        originY: "center",
        selectable: false,
        evented: false,
      });

      anchorDotsRef.current.push(dot);
      canvas.add(dot);

      canvas.requestRenderAll();
    };

    const handleMouseMove = (opt: TPointerEventInfo<TPointerEvent>) => {
      if (!isPenActiveRef.current || pointsRef.current.length === 0) return;
      const scenePoint = canvas.getScenePoint(opt.e);
      const lastPoint = pointsRef.current[pointsRef.current.length - 1];

      if (!previewLineRef.current) {
        previewLineRef.current = new Line(
          [lastPoint.x, lastPoint.y, scenePoint.x, scenePoint.y],
          {
            stroke: "#3B82F6",
            strokeWidth: 2,
            strokeDashArray: [4, 4],
            selectable: false,
            evented: false,
          }
        );
        canvas.add(previewLineRef.current);
      } else {
        previewLineRef.current.set({
          x1: lastPoint.x,
          y1: lastPoint.y,
          x2: scenePoint.x,
          y2: scenePoint.y,
        });
      }

      canvas.requestRenderAll();
    };

    const handleDblClick = () => {
      if (!isPenActiveRef.current) return;
      if (pointsRef.current.length >= 2) {
        commitPath(false);
      } else {
        cancelPen();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPenActiveRef.current) return;

      if (e.key === "Enter") {
        e.preventDefault();
        commitPath(false);
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelPen();
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:dblclick", handleDblClick);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:dblclick", handleDblClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canvas, isPenActive, commitPath, cancelPen]);

  return {
    isPenActive,
    pointsCount,
    togglePen,
    commitPath,
    cancelPen,
  };
}
