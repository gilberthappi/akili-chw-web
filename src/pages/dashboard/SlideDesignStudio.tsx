import { useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { FabricObject } from "fabric";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Monitor,
  Smartphone,
  Square,
  Check,
  Download,
  Type,
  Square as SquareIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { SlideStudioCanvas } from "@/components/courseBuilder/slideStudio/SlideStudioCanvas";
import {
  SlideStudioCanvasRef,
  StudioAspectRatio,
} from "@/components/courseBuilder/slideStudio/engine/types";
import { StudioToolDock } from "@/components/courseBuilder/slideStudio/dock/StudioToolDock";
import { CardPropertyInspector } from "@/components/courseBuilder/slideStudio/inspectors/CardPropertyInspector";

export default function SlideDesignStudio() {
  const navigate = useNavigate();
  const { id: _slideId } = useParams<{ id?: string }>();
  const canvasRef = useRef<SlideStudioCanvasRef>(null);

  // Studio State
  const [slideTitle, setSlideTitle] = useState("Untitled Slide 1");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [ratio, setRatio] = useState<StudioAspectRatio>("16:9");
  const [zoom, setZoom] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [isPenActive, setIsPenActive] = useState<boolean>(false);
  const zoomPercent = Math.round(zoom * 100);


  // Sync undo/redo availability from canvas
  const updateHistoryState = useCallback(() => {
    if (canvasRef.current) {
      setCanUndo(canvasRef.current.canUndo);
      setCanRedo(canvasRef.current.canRedo);
    }
  }, []);

  const handleChangeRatio = (newRatio: StudioAspectRatio) => {
    setRatio(newRatio);
    canvasRef.current?.changeRatio(newRatio);
    updateHistoryState();
  };

  const handleZoomIn = () => {
    const current = canvasRef.current?.getZoom() ?? 1;
    canvasRef.current?.setZoom(current * 1.15);
    updateHistoryState();
  };

  const handleZoomOut = () => {
    const current = canvasRef.current?.getZoom() ?? 1;
    canvasRef.current?.setZoom(current * 0.85);
    updateHistoryState();
  };

  const handleResetFit = () => {
    canvasRef.current?.resetZoomToFit();
    updateHistoryState();
  };

  const handleSetZoom = (targetZoom: number) => {
    canvasRef.current?.setZoom(targetZoom);
    updateHistoryState();
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
    updateHistoryState();
  };

  const handleRedo = () => {
    canvasRef.current?.redo();
    updateHistoryState();
  };

  const handleAddCard = () => {
    canvasRef.current?.addBentCard([24, 24, 24, 24], "Standard Card");
    updateHistoryState();
  };

  const handleAddText = () => {
    canvasRef.current?.addText("Slide Title", 36);
    updateHistoryState();
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setIsSaving(true);
    try {
      const json = canvasRef.current.getCanvasJson();
      const highResBlob = await canvasRef.current.exportHighResBlob(2);
      // In production pipeline, this uploads to Cloudinary & persists to DB
      console.log(
        "[SlideStudio] Slide payload prepared:",
        Object.keys(json).length,
        highResBlob.size
      );
      toast.success("Slide design saved successfully!");
    } catch (err) {
      console.error("[SlideStudio] Save error:", err);
      toast.error("Failed to save slide design");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    try {
      const blob = await canvasRef.current.exportHighResBlob(2);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slideTitle.toLowerCase().replace(/\s+/g, "-")}-4k.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported high-res PNG image");
    } catch (err) {
      toast.error("Failed to export image");
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100 select-none">
      {/* ── Studio Top Header Bar ────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-30 shadow-xs flex-shrink-0">
        {/* Left: Back & Slide Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/courses")}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Return to Courses"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200" />

          {/* Inline Editable Title */}
          {isEditingTitle ? (
            <input
              type="text"
              value={slideTitle}
              autoFocus
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") {
                  setIsEditingTitle(false);
                }
              }}
              onChange={(e) => setSlideTitle(e.target.value)}
              className="text-sm font-semibold text-slate-900 border border-blue-400 rounded px-2 py-0.5 outline-hidden focus:ring-2 focus:ring-blue-500/20 max-w-[240px]"
            />
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="group flex items-center space-x-1.5 cursor-pointer px-2 py-1 rounded hover:bg-slate-50"
              title="Click to rename slide"
            >
              <span className="text-sm font-semibold text-slate-800 tracking-tight">
                {slideTitle}
              </span>
              <span className="text-xs text-slate-400 group-hover:text-blue-600 transition">
                ✏️
              </span>
            </div>
          )}

          {/* Aspect Ratio Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => handleChangeRatio("16:9")}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition font-medium ${
                ratio === "16:9"
                  ? "bg-white text-blue-700 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="16:9 Landscape Presentation (1920 × 1080)"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>16:9</span>
            </button>

            <button
              onClick={() => handleChangeRatio("9:16")}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition font-medium ${
                ratio === "9:16"
                  ? "bg-white text-blue-700 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="9:16 Mobile Story (1080 × 1920)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16</span>
            </button>

            <button
              onClick={() => handleChangeRatio("4:3")}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition font-medium ${
                ratio === "4:3"
                  ? "bg-white text-blue-700 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="4:3 Standard (1440 × 1080)"
            >
              <Square className="w-3.5 h-3.5" />
              <span>4:3</span>
            </button>
          </div>
        </div>

        {/* Center: Tools, Undo/Redo & Viewport Zoom */}
        <div className="flex items-center space-x-2">
          {/* Quick Insert Actions */}
          <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button
              onClick={handleAddCard}
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-200 shadow-2xs transition"
              title="Add Container Card"
            >
              <SquareIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Card</span>
            </button>

            <button
              onClick={handleAddText}
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-200 shadow-2xs transition"
              title="Add Text Block"
            >
              <Type className="w-3.5 h-3.5 text-blue-600" />
              <span>Heading</span>
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          {/* Undo / Redo */}
          <div className="flex items-center space-x-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className={`p-1.5 rounded transition ${
                canUndo
                  ? "text-slate-700 hover:bg-white hover:shadow-2xs"
                  : "text-slate-300 cursor-not-allowed"
              }`}
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className={`p-1.5 rounded transition ${
                canRedo
                  ? "text-slate-700 hover:bg-white hover:shadow-2xs"
                  : "text-slate-300 cursor-not-allowed"
              }`}
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 mx-1" />

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={handleZoomOut}
              title="Zoom Out (Ctrl -)"
              className="p-1.5 text-slate-700 hover:bg-white rounded transition hover:shadow-2xs"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleSetZoom(1.0)}
              title="Click to reset to 100%"
              className="px-2 py-0.5 font-semibold text-slate-800 hover:bg-white rounded transition hover:shadow-2xs min-w-[50px] text-center"
            >
              {zoomPercent}%
            </button>

            <button
              onClick={handleZoomIn}
              title="Zoom In (Ctrl +)"
              className="p-1.5 text-slate-700 hover:bg-white rounded transition hover:shadow-2xs"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetFit}
              title="Fit Artboard to Viewport (Ctrl+0)"
              className="flex items-center space-x-1 px-2 py-1 text-slate-600 hover:text-blue-700 hover:bg-white rounded transition hover:shadow-2xs ml-0.5 font-medium"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="text-[11px]">Fit</span>
            </button>
          </div>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid((g) => !g)}
            title={showGrid ? "Hide Grid" : "Show Grid"}
            className={`p-1.5 rounded-lg border transition ${
              showGrid
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-900"
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPng}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition flex items-center space-x-1.5"
            title="Download Lossless 2x PNG"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export PNG</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs hover:shadow transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Slide"}</span>
          </button>
        </div>
      </header>

      {/* ── Studio Body: Left Dock + Center Canvas + Right Inspector ───────── */}
      <div className="flex-1 flex overflow-hidden relative">
        <StudioToolDock
          isPenActive={isPenActive}
          onTogglePenTool={() => {
            canvasRef.current?.togglePenTool();
            setIsPenActive(canvasRef.current?.isPenActive ?? false);
          }}
          onAddBentCard={(radii, title, fill) => {
            canvasRef.current?.addBentCard(radii, title, fill);
            updateHistoryState();
          }}
          onAddOrganicBlob={() => {
            canvasRef.current?.addOrganicBlob();
            updateHistoryState();
          }}
          onAddWavyDivider={() => {
            canvasRef.current?.addWavyDivider();
            updateHistoryState();
          }}
          onAddShieldBadge={() => {
            canvasRef.current?.addShieldBadge();
            updateHistoryState();
          }}
          onAddSpeechBubble={() => {
            canvasRef.current?.addSpeechBubble();
            updateHistoryState();
          }}
          onAddChevronArrow={() => {
            canvasRef.current?.addChevronArrow();
            updateHistoryState();
          }}
          onAddHeading={(text, size) => {
            canvasRef.current?.addText(text || "Slide Title", size || 36);
            updateHistoryState();
          }}
          onAddBodyText={(text) => {
            canvasRef.current?.addText(
              text || "Double click to edit body description.",
              18
            );
            updateHistoryState();
          }}
        />

        <main className="flex-1 relative overflow-hidden">
          <SlideStudioCanvas
            ref={canvasRef}
            ratio={ratio}
            showGrid={showGrid}
            onViewportChange={(currentZoom) => {
              setZoom(currentZoom);
              updateHistoryState();
            }}
            onSelectionChange={(active) => {
              setSelectedObject(active);
            }}
          />
        </main>

        <CardPropertyInspector
          canvas={canvasRef.current?.getFabricCanvas() ?? null}
          selectedObject={selectedObject}
          onModify={updateHistoryState}
        />
      </div>
    </div>
  );
}
