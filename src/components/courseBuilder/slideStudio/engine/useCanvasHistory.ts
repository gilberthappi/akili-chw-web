import { useState, useCallback, useRef } from "react";
import { Canvas as FabricCanvas } from "fabric";
import { CANVAS_LIMITS, CUSTOM_CANVAS_PROPERTIES } from "./constants";
import { applyFigmaControlsStyle } from "./figmaControls";

export function useCanvasHistory() {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef<number>(-1);
  const historyLock = useRef<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateState = useCallback(() => {
    const idx = historyIdxRef.current;
    const len = historyRef.current.length;
    setCanUndo(idx > 0);
    setCanRedo(idx >= 0 && idx < len - 1);
  }, []);

  /**
   * Captures a snapshot of the current canvas state.
   */
  const saveSnapshot = useCallback(
    (canvas: FabricCanvas | null, immediate = false) => {
      if (!canvas || historyLock.current) return;

      const performSave = () => {
        try {
          const jsonString = JSON.stringify(
            canvas.toObject(CUSTOM_CANVAS_PROPERTIES)
          );

          // Avoid duplicate identical consecutive snapshots
          const currentIdx = historyIdxRef.current;
          if (
            currentIdx >= 0 &&
            historyRef.current[currentIdx] === jsonString
          ) {
            return;
          }

          // Slice off any redo history
          const nextHistory = historyRef.current.slice(0, currentIdx + 1);
          nextHistory.push(jsonString);

          // Bound by MAX_HISTORY_SNAPSHOTS
          if (nextHistory.length > CANVAS_LIMITS.MAX_HISTORY_SNAPSHOTS) {
            nextHistory.shift();
          }

          historyRef.current = nextHistory;
          historyIdxRef.current = nextHistory.length - 1;
          updateState();
        } catch (err) {
          console.warn("[SlideStudio] Failed to save history snapshot:", err);
        }
      };

      if (immediate) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        performSave();
      } else {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(
          performSave,
          CANVAS_LIMITS.HISTORY_DEBOUNCE_MS
        );
      }
    },
    [updateState]
  );

  /**
   * Applies a snapshot from history at index.
   */
  const applySnapshot = useCallback(
    async (canvas: FabricCanvas | null, index: number) => {
      if (
        !canvas ||
        index < 0 ||
        index >= historyRef.current.length ||
        historyLock.current
      ) {
        return;
      }

      historyLock.current = true;
      try {
        const rawJson = JSON.parse(historyRef.current[index]);
        await canvas.loadFromJSON(rawJson);

        // Re-apply Figma controls styling to all restored objects
        canvas.getObjects().forEach((obj) => {
          applyFigmaControlsStyle(obj);
        });

        canvas.requestRenderAll();
        historyIdxRef.current = index;
        updateState();
      } catch (err) {
        console.error("[SlideStudio] Failed to restore history snapshot:", err);
      } finally {
        historyLock.current = false;
      }
    },
    [updateState]
  );

  const undo = useCallback(
    (canvas: FabricCanvas | null) => {
      if (historyIdxRef.current > 0) {
        applySnapshot(canvas, historyIdxRef.current - 1);
      }
    },
    [applySnapshot]
  );

  const redo = useCallback(
    (canvas: FabricCanvas | null) => {
      if (historyIdxRef.current < historyRef.current.length - 1) {
        applySnapshot(canvas, historyIdxRef.current + 1);
      }
    },
    [applySnapshot]
  );

  const initHistory = useCallback((canvas: FabricCanvas | null) => {
    if (!canvas) return;
    try {
      const initialJson = JSON.stringify(
        canvas.toObject(CUSTOM_CANVAS_PROPERTIES)
      );
      historyRef.current = [initialJson];
      historyIdxRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    } catch (err) {
      console.warn("[SlideStudio] Failed to initialize history:", err);
    }
  }, []);

  return {
    canUndo,
    canRedo,
    saveSnapshot,
    undo,
    redo,
    initHistory,
    historyLock,
  };
}
