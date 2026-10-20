import React, { useRef, useState, useCallback } from "react";
import { StudioTopBar } from "./StudioTopBar";
import { SlideStudioCanvas } from "./SlideStudioCanvas";
import { SlideStudioCanvasRef, StudioAspectRatio } from "./engine/types";
import toast from "react-hot-toast";

interface SlideStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (canvasJson: Record<string, unknown>, previewBlob: Blob) => Promise<void> | void;
  initialRatio?: StudioAspectRatio;
  initialCanvasJson?: Record<string, unknown> | null;
}

export const SlideStudioModal: React.FC<SlideStudioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRatio = "16:9",
  initialCanvasJson,
}) => {
  const canvasRef = useRef<SlideStudioCanvasRef>(null);
  const [ratio, setRatio] = useState<StudioAspectRatio>(initialRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Undo/Redo reactivity tick
  const [, setHistoryTick] = useState(0);
  const triggerHistoryUpdate = useCallback(() => {
    setHistoryTick((t) => t + 1);
  }, []);

  if (!isOpen) return null;

  const handleZoomIn = () => {
    const current = canvasRef.current?.getZoom() ?? 1;
    canvasRef.current?.setZoom(current * 1.15);
  };

  const handleZoomOut = () => {
    const current = canvasRef.current?.getZoom() ?? 1;
    canvasRef.current?.setZoom(current * 0.85);
  };

  const handleResetFit = () => {
    canvasRef.current?.resetZoomToFit();
  };

  const handleSetZoom = (targetZoom: number) => {
    canvasRef.current?.setZoom(targetZoom);
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
    triggerHistoryUpdate();
  };

  const handleRedo = () => {
    canvasRef.current?.redo();
    triggerHistoryUpdate();
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    try {
      const json = canvasRef.current.getCanvasJson();
      const blob = await canvasRef.current.exportHighResBlob(2); // 2x supersampled high-res preview
      if (onSave) {
        await onSave(json, blob);
      } else {
        toast.success("Slide canvas design saved successfully!");
      }
      onClose();
    } catch (err) {
      console.error("[SlideStudioModal] Save error:", err);
      toast.error("Failed to export slide design");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSampleCard = () => {
    const container = document.querySelector(".relative.w-full.h-full") as unknown as {
      __addSampleCard?: () => void;
    };
    container?.__addSampleCard?.();
    triggerHistoryUpdate();
  };

  const handleAddSampleText = () => {
    const container = document.querySelector(".relative.w-full.h-full") as unknown as {
      __addSampleText?: () => void;
    };
    container?.__addSampleText?.();
    triggerHistoryUpdate();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full h-full flex flex-col bg-white">
        {/* Top Control Bar */}
        <StudioTopBar
          ratio={ratio}
          onChangeRatio={setRatio}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetFit={handleResetFit}
          onSetZoom={handleSetZoom}
          canUndo={canvasRef.current?.canUndo ?? false}
          canRedo={canvasRef.current?.canRedo ?? false}
          onUndo={handleUndo}
          onRedo={handleRedo}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid((g) => !g)}
          onAddSampleCard={handleAddSampleCard}
          onAddSampleText={handleAddSampleText}
          onClose={onClose}
          onSave={handleSave}
          isSaving={isSaving}
        />

        {/* Viewport Canvas Workspace */}
        <div className="flex-1 relative overflow-hidden">
          <SlideStudioCanvas
            ref={canvasRef}
            initialRatio={ratio}
            showGrid={showGrid}
            onViewportChange={(currentZoom, currentRatio) => {
              setZoom(currentZoom);
              setRatio(currentRatio);
              triggerHistoryUpdate();
            }}
          />
        </div>
      </div>
    </div>
  );
};
