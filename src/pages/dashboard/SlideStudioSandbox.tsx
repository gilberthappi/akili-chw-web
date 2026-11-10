import React, { useState } from "react";
import { Sparkles, Monitor, Smartphone, Layers, CheckCircle2, Play } from "lucide-react";
import { SlideStudioModal } from "@/components/courseBuilder/slideStudio/SlideStudioModal";

export default function SlideStudioSandbox() {
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [lastExportedInfo, setLastExportedInfo] = useState<{
    sizeKb: number;
    objectsCount: number;
    savedAt: string;
  } | null>(null);

  const handleSave = async (
    canvasJson: Record<string, unknown>,
    previewBlob: Blob
  ) => {
    const objects = (canvasJson.objects as unknown[])?.length || 0;
    const sizeKb = Math.round(previewBlob.size / 1024);
    setLastExportedInfo({
      sizeKb,
      objectsCount: objects,
      savedAt: new Date().toLocaleTimeString(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
                <Sparkles className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Slide Studio Sandbox (Sprint Day 1)
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Isolated testing environment for the new Unrestricted Slide Canvas Engine.
              Existing courses and production builders remain 100% untouched.
            </p>
          </div>

          <button
            onClick={() => setIsStudioOpen(true)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm hover:shadow transition font-medium text-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Slide Studio</span>
          </button>
        </div>

        {/* Status Metrics & Feature Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Coordinate Projection</span>
              <Monitor className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">1920 × 1080</div>
            <p className="text-xs text-slate-500">
              16:9 Full HD & 9:16 Mobile Story viewports with sub-pixel precision.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Zoom & Navigation</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">10% – 800%</div>
            <p className="text-xs text-slate-500">
              Zoom-to-pointer math, Spacebar hand tool pan, and 1-click Auto-Fit.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Persistence & DB</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900">PostgreSQL Json</div>
            <p className="text-xs text-slate-500">
              Nullable canvasJson schema ready with lossless 2x blob export.
            </p>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Day 1 Verified Capabilities:
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Full HD 16:9 & Mobile 9:16 Artboards</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Figma-Style circular white/blue transform handles</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Smooth mouse-wheel zoom anchored to cursor point</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Spacebar + Drag panning with hand cursor</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>50-step snapshot undo/redo stack (Ctrl+Z / Ctrl+Y)</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Card corner bending (rx/ry) preview ready for Day 2</span>
            </div>
          </div>
        </div>

        {/* Last Saved Information if user tested save */}
        {lastExportedInfo && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-sm text-emerald-900">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">
                Last Canvas Export: {lastExportedInfo.objectsCount} vector objects • {lastExportedInfo.sizeKb} KB rendered blob
              </span>
            </div>
            <span className="text-xs text-emerald-600 font-mono">
              Saved at {lastExportedInfo.savedAt}
            </span>
          </div>
        )}
      </div>

      {/* Slide Studio Fullscreen Modal */}
      <SlideStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
