import React, { useRef } from "react";
import {
  Palette,
  Image as ImageIcon,
  Sparkles,
  Upload,
  RotateCcw,
} from "lucide-react";
import {
  ArtboardBackgroundState,
  STOCK_HEALTHCARE_PHOTOS,
  ImageFitMode,
} from "../media/types";
import { ColorPickerPopover } from "./ColorPickerPopover";

interface SlideBackgroundInspectorProps {
  background: ArtboardBackgroundState;
  onChange: (newBackground: ArtboardBackgroundState) => void;
  aspectRatioLabel?: string;
  topSlot?: React.ReactNode;
}

const BG_COLOR_PRESETS = [
  { name: "Pure White", color: "#ffffff" },
  { name: "Clean Slate", color: "#f8fafc" },
  { name: "Soft Sky", color: "#f0f9ff" },
  { name: "Clinical Mint", color: "#f0fdf4" },
  { name: "Warm Cream", color: "#fffbeb" },
  { name: "Dark Navy", color: "#0f172a" },
  { name: "Deep Charcoal", color: "#1e293b" },
  { name: "Clinical Teal", color: "#134e4a" },
];

export const SlideBackgroundInspector: React.FC<SlideBackgroundInspectorProps> = ({
  background,
  onChange,
  aspectRatioLabel = "16:9",
  topSlot,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTypeChange = (type: "color" | "gradient" | "image") => {
    onChange({
      ...background,
      type,
      imageUrl: type === "image" && !background.imageUrl ? STOCK_HEALTHCARE_PHOTOS[5].url : background.imageUrl,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url) {
        onChange({
          ...background,
          type: "image",
          imageUrl: url,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="w-72 bg-white border-l border-slate-200 overflow-y-auto flex flex-col select-none flex-shrink-0 z-20 shadow-xs divide-y divide-slate-100">
      {topSlot}
      {/* ── Section: Header & Canvas Dimensions ─────────────────────────── */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-900 tracking-tight uppercase">
              Slide Background
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600 font-semibold">
            {aspectRatioLabel}
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Global canvas surface color, gradient fills, and background imagery.
        </p>
      </div>

      {/* ── Section: Background Mode Switcher ────────────────────────────── */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => handleTypeChange("color")}
            className={`py-1.5 rounded-md flex items-center justify-center space-x-1.5 transition ${
              background.type === "color"
                ? "bg-white text-slate-900 font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Color</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("gradient")}
            className={`py-1.5 rounded-md flex items-center justify-center space-x-1.5 transition ${
              background.type === "gradient"
                ? "bg-white text-slate-900 font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gradient</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("image")}
            className={`py-1.5 rounded-md flex items-center justify-center space-x-1.5 transition ${
              background.type === "image"
                ? "bg-white text-slate-900 font-semibold shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Photo</span>
          </button>
        </div>

        {/* ── Mode 1: Solid Color ────────────────────────────────────────── */}
        {background.type === "color" && (
          <div className="space-y-3 pt-1">
            <ColorPickerPopover
              label="Canvas Background Color"
              color={background.color}
              onChange={(c) => onChange({ ...background, color: c })}
            />

            <div className="space-y-1.5">
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Preset Palettes
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {BG_COLOR_PRESETS.map((p) => (
                  <button
                    key={p.color}
                    type="button"
                    onClick={() => onChange({ ...background, color: p.color })}
                    title={p.name}
                    className={`h-8 rounded-lg border transition flex items-center justify-center relative ${
                      background.color.toLowerCase() === p.color.toLowerCase()
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:scale-105"
                    }`}
                    style={{ backgroundColor: p.color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Mode 2: Gradients ──────────────────────────────────────────── */}
        {background.type === "gradient" && (
          <div className="space-y-3 pt-1">
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Gradient Presets
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...background,
                    gradient: {
                      type: "linear",
                      angle: 135,
                      stops: [
                        { offset: 0, color: "#1e293b" },
                        { offset: 1, color: "#0f172a" },
                      ],
                    },
                  })
                }
                className="h-12 rounded-lg border border-slate-200 p-2 text-left text-[11px] font-semibold text-white shadow-2xs"
                style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)" }}
              >
                Deep Slate
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...background,
                    gradient: {
                      type: "linear",
                      angle: 135,
                      stops: [
                        { offset: 0, color: "#0284c7" },
                        { offset: 1, color: "#0369a1" },
                      ],
                    },
                  })
                }
                className="h-12 rounded-lg border border-slate-200 p-2 text-left text-[11px] font-semibold text-white shadow-2xs"
                style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
              >
                Clinical Blue
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...background,
                    gradient: {
                      type: "linear",
                      angle: 135,
                      stops: [
                        { offset: 0, color: "#0f766e" },
                        { offset: 1, color: "#134e4a" },
                      ],
                    },
                  })
                }
                className="h-12 rounded-lg border border-slate-200 p-2 text-left text-[11px] font-semibold text-white shadow-2xs"
                style={{ background: "linear-gradient(135deg, #0f766e, #134e4a)" }}
              >
                Emerald Teal
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...background,
                    gradient: {
                      type: "linear",
                      angle: 135,
                      stops: [
                        { offset: 0, color: "#f8fafc" },
                        { offset: 1, color: "#e2e8f0" },
                      ],
                    },
                  })
                }
                className="h-12 rounded-lg border border-slate-200 p-2 text-left text-[11px] font-semibold text-slate-800 shadow-2xs"
                style={{ background: "linear-gradient(135deg, #f8fafc, #e2e8f0)" }}
              >
                Clean Silver
              </button>
            </div>
          </div>
        )}

        {/* ── Mode 3: Background Photo ───────────────────────────────────── */}
        {background.type === "image" && (
          <div className="space-y-3 pt-1">
            {/* Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center space-x-2 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 border-dashed rounded-lg text-xs font-semibold transition"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Upload Custom Photo</span>
            </button>

            {/* Presets Grid */}
            <div className="space-y-1.5">
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Photo Presets
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {STOCK_HEALTHCARE_PHOTOS.map((stock) => (
                  <button
                    key={stock.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...background,
                        type: "image",
                        imageUrl: stock.url,
                      })
                    }
                    title={stock.title}
                    className={`h-14 rounded-lg border overflow-hidden relative transition hover:scale-105 ${
                      background.imageUrl === stock.url
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : "border-slate-200"
                    }`}
                  >
                    <img
                      src={stock.thumbnailUrl}
                      alt={stock.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Fit Mode */}
            <div className="space-y-1.5 pt-1">
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Fit Mode
              </span>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                {(["cover", "contain", "fill"] as ImageFitMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChange({ ...background, imageMode: mode })}
                    className={`px-2 py-1 rounded-md border font-medium capitalize transition ${
                      (background.imageMode || "cover") === mode
                        ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Dimming Overlay Tint Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Text Readability Dimming
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {Math.round((background.overlayOpacity ?? 0.35) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.9}
                step={0.05}
                value={background.overlayOpacity ?? 0.35}
                onChange={(e) =>
                  onChange({
                    ...background,
                    overlayOpacity: Number(e.target.value),
                  })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Background Blur Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Atmospheric Blur
                </span>
                <span className="font-mono font-semibold text-slate-800">
                  {background.blur ?? 0}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={24}
                value={background.blur ?? 0}
                onChange={(e) =>
                  onChange({
                    ...background,
                    blur: Number(e.target.value),
                  })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Footer: Reset to Clean White ────────────────────────────────── */}
      <div className="p-4 mt-auto">
        <button
          type="button"
          onClick={() =>
            onChange({
              type: "color",
              color: "#ffffff",
              overlayColor: "#0f172a",
              overlayOpacity: 0.35,
              blur: 0,
            })
          }
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Clean White</span>
        </button>
      </div>
    </aside>
  );
};
