import { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, type FabricObject } from "fabric";

export interface SmartSnappingOptions {
  enabled?: boolean;
  threshold?: number;
  artboardWidth: number;
  artboardHeight: number;
}

interface GuideLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

/**
 * Smart Alignment and Snapping Guides Engine
 * Dynamically snaps dragging objects to artboard centers, edges, and other objects.
 */
export function useSmartSnapping(
  canvas: FabricCanvas | null,
  options: SmartSnappingOptions
) {
  const { enabled = true, threshold = 6, artboardWidth, artboardHeight } = options;
  const activeGuidesRef = useRef<GuideLine[]>([]);

  useEffect(() => {
    if (!canvas || !enabled) return;

    const handleObjectMoving = (e: { target?: FabricObject }) => {
      const target = e.target;
      if (!target) return;

      const targetBounds = target.getBoundingRect();
      const targetCenterX = targetBounds.left + targetBounds.width / 2;
      const targetCenterY = targetBounds.top + targetBounds.height / 2;
      const targetRight = targetBounds.left + targetBounds.width;
      const targetBottom = targetBounds.top + targetBounds.height;

      const guides: GuideLine[] = [];
      let snappedDeltaX = 0;
      let snappedDeltaY = 0;
      let hasSnappedX = false;
      let hasSnappedY = false;

      // Candidate X reference coordinates
      const xCandidates: Array<{ x: number; label: string }> = [
        { x: 0, label: "artboard-left" },
        { x: artboardWidth / 2, label: "artboard-center" },
        { x: artboardWidth, label: "artboard-right" },
      ];

      // Candidate Y reference coordinates
      const yCandidates: Array<{ y: number; label: string }> = [
        { y: 0, label: "artboard-top" },
        { y: artboardHeight / 2, label: "artboard-center" },
        { y: artboardHeight, label: "artboard-bottom" },
      ];

      // Query other visible canvas objects
      const otherObjects = canvas.getObjects().filter((obj) => obj !== target && obj.visible);
      for (const obj of otherObjects) {
        const b = obj.getBoundingRect();
        xCandidates.push(
          { x: b.left, label: "object-left" },
          { x: b.left + b.width / 2, label: "object-center" },
          { x: b.left + b.width, label: "object-right" }
        );
        yCandidates.push(
          { y: b.top, label: "object-top" },
          { y: b.top + b.height / 2, label: "object-center" },
          { y: b.top + b.height, label: "object-bottom" }
        );
      }

      // ── Test X Alignment ───────────────────────────────────────────────────
      for (const cand of xCandidates) {
        // Center alignment
        if (!hasSnappedX && Math.abs(targetCenterX - cand.x) <= threshold) {
          snappedDeltaX = cand.x - targetCenterX;
          hasSnappedX = true;
          guides.push({
            x1: cand.x,
            y1: 0,
            x2: cand.x,
            y2: artboardHeight,
            color: cand.label.includes("artboard") ? "#06b6d4" : "#ec4899",
          });
          break;
        }
        // Left edge alignment
        if (!hasSnappedX && Math.abs(targetBounds.left - cand.x) <= threshold) {
          snappedDeltaX = cand.x - targetBounds.left;
          hasSnappedX = true;
          guides.push({
            x1: cand.x,
            y1: 0,
            x2: cand.x,
            y2: artboardHeight,
            color: cand.label.includes("artboard") ? "#06b6d4" : "#ec4899",
          });
          break;
        }
        // Right edge alignment
        if (!hasSnappedX && Math.abs(targetRight - cand.x) <= threshold) {
          snappedDeltaX = cand.x - targetRight;
          hasSnappedX = true;
          guides.push({
            x1: cand.x,
            y1: 0,
            x2: cand.x,
            y2: artboardHeight,
            color: cand.label.includes("artboard") ? "#06b6d4" : "#ec4899",
          });
          break;
        }
      }

      // ── Test Y Alignment ───────────────────────────────────────────────────
      for (const cand of yCandidates) {
        // Center alignment
        if (!hasSnappedY && Math.abs(targetCenterY - cand.y) <= threshold) {
          snappedDeltaY = cand.y - targetCenterY;
          hasSnappedY = true;
          guides.push({
            x1: 0,
            y1: cand.y,
            x2: artboardWidth,
            y2: cand.y,
            color: cand.label.includes("artboard") ? "#06b6d4" : "#ec4899",
          });
          break;
        }
        // Top edge alignment
        if (!hasSnappedY && Math.abs(targetBounds.top - cand.y) <= threshold) {
          snappedDeltaY = cand.y - targetBounds.top;
          hasSnappedY = true;
          guides.push({
            x1: 0,
            y1: cand.y,
            x2: artboardWidth,
            y2: cand.y,
            color: cand.label.includes("artboard") ? "#06b6d4" : "#ec4899",
          });
          break;
        }
        // Bottom edge alignment
        if (!hasSnappedY && Math.abs(targetBottom - cand.y) <= threshold) {
          snappedDeltaY = cand.y - targetBottom;
          hasSnappedY = true;
          guides.push({
            x1: 0,
            y1: cand.y,
            x2: artboardWidth,
            y2: cand.y,
            color: cand.label.includes("artboard") ? "#06b6d4" : "#ec4899",
          });
          break;
        }
      }

      // Apply magnetic snap delta
      if (hasSnappedX) {
        target.set({ left: (target.left || 0) + snappedDeltaX });
      }
      if (hasSnappedY) {
        target.set({ top: (target.top || 0) + snappedDeltaY });
      }

      activeGuidesRef.current = guides;
      canvas.requestRenderAll();
    };

    const clearGuides = () => {
      if (activeGuidesRef.current.length > 0) {
        activeGuidesRef.current = [];
        canvas.requestRenderAll();
      }
    };

    const handleAfterRender = (opt: { ctx: CanvasRenderingContext2D }) => {
      const guides = activeGuidesRef.current;
      if (!guides.length || !opt.ctx) return;

      const ctx = opt.ctx;
      const vpt = canvas.viewportTransform;

      ctx.save();
      if (vpt) {
        ctx.setTransform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);
      }

      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      for (const g of guides) {
        ctx.strokeStyle = g.color;
        ctx.beginPath();
        ctx.moveTo(g.x1, g.y1);
        ctx.lineTo(g.x2, g.y2);
        ctx.stroke();
      }

      ctx.restore();
    };

    canvas.on("object:moving", handleObjectMoving);
    canvas.on("object:modified", clearGuides);
    canvas.on("mouse:up", clearGuides);
    canvas.on("after:render", handleAfterRender);

    return () => {
      canvas.off("object:moving", handleObjectMoving);
      canvas.off("object:modified", clearGuides);
      canvas.off("mouse:up", clearGuides);
      canvas.off("after:render", handleAfterRender);
    };
  }, [canvas, enabled, threshold, artboardWidth, artboardHeight]);
}
