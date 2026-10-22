import { useEffect } from "react";
import { Canvas as FabricCanvas, IText, Textbox } from "fabric";

interface UseCanvasShortcutsProps {
  canvas: FabricCanvas | null;
  onUndo: () => void;
  onRedo: () => void;
  onResetFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected?: () => void;
  isSpacePressedRef: React.MutableRefObject<boolean>;
  setIsPanningMode: (active: boolean) => void;
}

export function useCanvasShortcuts({
  canvas,
  onUndo,
  onRedo,
  onResetFit,
  onZoomIn,
  onZoomOut,
  onDeleteSelected,
  onDuplicateSelected,
  isSpacePressedRef,
  setIsPanningMode,
}: UseCanvasShortcutsProps) {
  useEffect(() => {
    const isTextInputFocused = () => {
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable)
      ) {
        return true;
      }
      if (canvas) {
        const activeObj = canvas.getActiveObject();
        if (
          (activeObj instanceof IText || activeObj instanceof Textbox) &&
          (activeObj as unknown as { isEditing?: boolean }).isEditing
        ) {
          return true;
        }
      }
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Spacebar for hand / pan tool
      if (e.code === "Space" && !e.repeat && !isTextInputFocused()) {
        e.preventDefault();
        isSpacePressedRef.current = true;
        setIsPanningMode(true);
        if (canvas) {
          canvas.defaultCursor = "grab";
          canvas.hoverCursor = "grab";
        }
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl) {
        // Undo: Ctrl+Z
        if (e.key.toLowerCase() === "z" && !e.shiftKey) {
          e.preventDefault();
          onUndo();
          return;
        }

        // Redo: Ctrl+Y or Ctrl+Shift+Z
        if (
          e.key.toLowerCase() === "y" ||
          (e.key.toLowerCase() === "z" && e.shiftKey)
        ) {
          e.preventDefault();
          onRedo();
          return;
        }

        // Duplicate: Ctrl+D
        if (e.key.toLowerCase() === "d") {
          e.preventDefault();
          onDuplicateSelected?.();
          return;
        }


        // Reset Fit: Ctrl+0
        if (e.key === "0") {
          e.preventDefault();
          onResetFit();
          return;
        }

        // Zoom In: Ctrl + / Ctrl =
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          onZoomIn();
          return;
        }

        // Zoom Out: Ctrl -
        if (e.key === "-") {
          e.preventDefault();
          onZoomOut();
          return;
        }
      }

      // Delete / Backspace for removing active object
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !isTextInputFocused()
      ) {
        e.preventDefault();
        onDeleteSelected();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        isSpacePressedRef.current = false;
        setIsPanningMode(false);
        if (canvas) {
          canvas.defaultCursor = "default";
          canvas.hoverCursor = "move";
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    canvas,
    onUndo,
    onRedo,
    onResetFit,
    onZoomIn,
    onZoomOut,
    onDeleteSelected,
    onDuplicateSelected,
    isSpacePressedRef,
    setIsPanningMode,
  ]);
}
