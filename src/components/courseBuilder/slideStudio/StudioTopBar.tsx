import React from "react";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Monitor,
  Smartphone,
  Square,
  X,
  Check,
  Plus,
} from "lucide-react";
import { StudioAspectRatio } from "./engine/types";

interface StudioTopBarProps {
  ratio: StudioAspectRatio;
  onChangeRatio: (ratio: StudioAspectRatio) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetFit: () => void;
  onSetZoom: (zoom: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onAddSampleCard?: () => void;
  onAddSampleText?: () => void;
  onClose: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

export const StudioTopBar: React.FC<StudioTopBarProps> = ({
  ratio,
  onChangeRatio,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetFit,
  onSetZoom,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  showGrid,
  onToggleGrid,
  onAddSampleCard,
  onAddSampleText,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between select-none shadow-sm z-30">
      {/* Left: Branding & Ratio Switcher */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 pr-3 border-r border-gray-200">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <span className="font-bold text-gray-900 text-sm tracking-tight">
            Slide Studio
          </span>
          <span className="text-[10px] font-semibold tracking-wider uppercase bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
            Engine v1
          </span>
        </div>

        {/* Aspect Ratio Toggle Pills */}
        <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs">
          <button
            onClick={() => onChangeRatio("16:9")}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition font-medium ${
              ratio === "16:9"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="16:9 Widescreen (1920x1080)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>16:9</span>
          </button>

          <button
            onClick={() => onChangeRatio("9:16")}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition font-medium ${
              ratio === "9:16"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="9:16 Mobile Story (1080x1920)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16</span>
          </button>

          <button
            onClick={() => onChangeRatio("4:3")}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md transition font-medium ${
              ratio === "4:3"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            title="4:3 Standard (1440x1080)"
          >
            <Square className="w-3.5 h-3.5" />
            <span>4:3</span>
          </button>
        </div>

        {/* Quick Add Testing Elements for Day 1 */}
        {(onAddSampleCard || onAddSampleText) && (
          <div className="flex items-center space-x-1.5 pl-2 border-l border-gray-200">
            {onAddSampleCard && (
              <button
                onClick={onAddSampleCard}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition"
              >
                <Plus className="w-3 h-3 text-blue-600" />
                <span>Card</span>
              </button>
            )}
            {onAddSampleText && (
              <button
                onClick={onAddSampleText}
                className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition"
              >
                <Plus className="w-3 h-3 text-blue-600" />
                <span>Heading</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Center: History (Undo/Redo) & Zoom Controls */}
      <div className="flex items-center space-x-2">
        {/* Undo / Redo */}
        <div className="flex items-center space-x-1 bg-gray-50 p-0.5 rounded-lg border border-gray-200">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`p-1.5 rounded transition ${
              canUndo
                ? "text-gray-700 hover:bg-white hover:shadow-xs"
                : "text-gray-300 cursor-not-allowed"
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={`p-1.5 rounded transition ${
              canRedo
                ? "text-gray-700 hover:bg-white hover:shadow-xs"
                : "text-gray-300 cursor-not-allowed"
            }`}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-gray-200 mx-1" />

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1 bg-gray-50 p-0.5 rounded-lg border border-gray-200 text-xs">
          <button
            onClick={onZoomOut}
            title="Zoom Out (Ctrl -)"
            className="p-1.5 text-gray-700 hover:bg-white rounded transition hover:shadow-xs"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onSetZoom(1.0)}
            title="Click to set 100%"
            className="px-2 py-0.5 font-semibold text-gray-800 hover:bg-white rounded transition hover:shadow-xs min-w-[50px] text-center"
          >
            {zoomPercent}%
          </button>

          <button
            onClick={onZoomIn}
            title="Zoom In (Ctrl +)"
            className="p-1.5 text-gray-700 hover:bg-white rounded transition hover:shadow-xs"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onResetFit}
            title="Fit to Screen (Ctrl+0)"
            className="flex items-center space-x-1 px-2 py-1 text-gray-600 hover:text-blue-700 hover:bg-white rounded transition hover:shadow-xs ml-0.5 font-medium"
          >
            <Maximize2 className="w-3 h-3" />
            <span className="text-[11px]">Fit</span>
          </button>
        </div>

        {/* Grid Toggle */}
        <button
          onClick={onToggleGrid}
          title={showGrid ? "Hide Background Grid" : "Show Background Grid"}
          className={`p-1.5 rounded-lg border transition ${
            showGrid
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : "bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-900"
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition flex items-center space-x-1"
        >
          <X className="w-3.5 h-3.5" />
          <span>Close</span>
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{isSaving ? "Saving..." : "Save Slide"}</span>
        </button>
      </div>
    </header>
  );
};
