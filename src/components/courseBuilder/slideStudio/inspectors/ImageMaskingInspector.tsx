import React, { useRef, useState, useEffect, useCallback } from "react";
import { Canvas as FabricCanvas, FabricObject } from "fabric";
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  RefreshCw,
  ZoomIn,
  Move,
  RotateCcw,
} from "lucide-react";
import {
  EmbeddedImageState,
  STOCK_HEALTHCARE_PHOTOS,
  ImageFitMode,
  DEFAULT_IMAGE_FILTERS,
  DuotonePreset,
} from "../media/types";
import { ImageEngine } from "../media/ImageEngine";

interface ImageMaskingInspectorProps {
  shape: FabricObject;
  canvas: FabricCanvas | null;
  onModify: () => void;
}

export const ImageMaskingInspector: React.FC<ImageMaskingInspectorProps> = ({
  shape,
  canvas: _canvas,
  onModify,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read current shape state
  const getShapeImageState = useCallback((): EmbeddedImageState | undefined => {
    return (shape as unknown as { embeddedImage?: EmbeddedImageState }).embeddedImage;
  }, [shape]);

  const [embedded, setEmbedded] = useState<EmbeddedImageState | undefined>(
    getShapeImageState()
  );

  // Dedicated reactive states for real-time slider responsiveness
  const [zoom, setZoom] = useState<number>(embedded?.zoom ?? 1.0);
  const [panX, setPanX] = useState<number>(embedded?.panX ?? 0);
  const [panY, setPanY] = useState<number>(embedded?.panY ?? 0);
  const [fitMode, setFitMode] = useState<ImageFitMode>(embedded?.fitMode ?? "cover");
  const [brightness, setBrightness] = useState<number>(embedded?.filters?.brightness ?? 0);
  const [contrast, setContrast] = useState<number>(embedded?.filters?.contrast ?? 0);
  const [saturation, setSaturation] = useState<number>(embedded?.filters?.saturation ?? 0);
  const [blur, setBlur] = useState<number>(embedded?.filters?.blur ?? 0);
  const [duotone, setDuotone] = useState<DuotonePreset>(embedded?.filters?.duotone ?? "none");

  // Sync state whenever selected shape or shape.embeddedImage changes
  useEffect(() => {
    const cur = getShapeImageState();
    setEmbedded(cur ? { ...cur } : undefined);
    if (cur) {
      setZoom(cur.zoom ?? 1.0);
      setPanX(cur.panX ?? 0);
      setPanY(cur.panY ?? 0);
      setFitMode(cur.fitMode ?? "cover");
      setBrightness(cur.filters?.brightness ?? 0);
      setContrast(cur.filters?.contrast ?? 0);
      setSaturation(cur.filters?.saturation ?? 0);
      setBlur(cur.filters?.blur ?? 0);
      setDuotone(cur.filters?.duotone ?? "none");
    }
  }, [shape, getShapeImageState]);

  // Determine human-readable shape title for universal vector masking
  const shapeTitle = React.useMemo(() => {
    const sType = (shape as unknown as { shapeType?: string }).shapeType;
    if (sType === "OrganicBlob") return "Organic Blob";
    if (sType === "ShieldBadge") return "Medical Shield";
    if (sType === "SpeechBubble") return "Speech Bubble";
    if (sType === "ChevronArrow") return "Process Chevron";
    if (sType === "WavyDivider") return "Wave Divider";
    if ("cornerRadii" in shape) return "Container Card";
    return "Vector Shape";
  }, [shape]);

  // Core synchronization method applying updates immediately to Fabric shape
  const applyEmbeddedUpdate = useCallback(
    (patch: Partial<EmbeddedImageState>) => {
      const cur = (shape as unknown as { embeddedImage?: EmbeddedImageState }).embeddedImage;
      if (!cur) return;

      const updated: EmbeddedImageState = {
        ...cur,
        ...patch,
        filters: {
          ...cur.filters,
          ...(patch.filters || {}),
        },
      };

      setEmbedded(updated);
      ImageEngine.setShapeEmbeddedImage(shape, updated);
      onModify();
    },
    [shape, onModify]
  );

  const handleSetImage = (url: string, name = "Photo") => {
    const newState: EmbeddedImageState = {
      url,
      name,
      naturalWidth: 800,
      naturalHeight: 600,
      fitMode: "cover",
      zoom: 1.0,
      panX: 0,
      panY: 0,
      opacity: 1.0,
      filters: { ...DEFAULT_IMAGE_FILTERS },
    };
    setEmbedded(newState);
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
    setFitMode("cover");
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setBlur(0);
    setDuotone("none");

    ImageEngine.setShapeEmbeddedImage(shape, newState);
    onModify();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (url) {
        handleSetImage(url, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setEmbedded(undefined);
    ImageEngine.setShapeEmbeddedImage(shape, undefined);
    onModify();
  };

  // ── Real-Time Slider Handlers ──────────────────────────────────────────────
  const handleZoomChange = (val: number) => {
    setZoom(val);
    applyEmbeddedUpdate({ zoom: val });
  };

  const handlePanXChange = (val: number) => {
    setPanX(val);
    applyEmbeddedUpdate({ panX: val });
  };

  const handlePanYChange = (val: number) => {
    setPanY(val);
    applyEmbeddedUpdate({ panY: val });
  };

  const handleCenterPan = () => {
    setPanX(0);
    setPanY(0);
    applyEmbeddedUpdate({ panX: 0, panY: 0 });
  };

  const handleFitModeChange = (mode: ImageFitMode) => {
    setFitMode(mode);
    applyEmbeddedUpdate({ fitMode: mode });
  };

  const handleBrightnessChange = (val: number) => {
    setBrightness(val);
    applyEmbeddedUpdate({
      filters: {
        ...(embedded?.filters ?? DEFAULT_IMAGE_FILTERS),
        brightness: val,
      },
    });
  };

  const handleContrastChange = (val: number) => {
    setContrast(val);
    applyEmbeddedUpdate({
      filters: {
        ...(embedded?.filters ?? DEFAULT_IMAGE_FILTERS),
        contrast: val,
      },
    });
  };

  const handleSaturationChange = (val: number) => {
    setSaturation(val);
    applyEmbeddedUpdate({
      filters: {
        ...(embedded?.filters ?? DEFAULT_IMAGE_FILTERS),
        saturation: val,
      },
    });
  };

  const handleBlurChange = (val: number) => {
    setBlur(val);
    applyEmbeddedUpdate({
      filters: {
        ...(embedded?.filters ?? DEFAULT_IMAGE_FILTERS),
        blur: val,
      },
    });
  };

  const handleDuotoneChange = (preset: DuotonePreset) => {
    setDuotone(preset);
    applyEmbeddedUpdate({
      filters: {
        ...(embedded?.filters ?? DEFAULT_IMAGE_FILTERS),
        duotone: preset,
      },
    });
  };

  const handleResetFilters = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setBlur(0);
    setDuotone("none");
    applyEmbeddedUpdate({
      filters: { ...DEFAULT_IMAGE_FILTERS },
    });
  };

  return (
    <div className="p-4 space-y-3.5 border-t border-slate-200">
      {/* ── Section Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <ImageIcon className="w-4 h-4 text-blue-600" />
          <span>Image & Masking</span>
        </div>
        {embedded && (
          <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            Masked in {shapeTitle}
          </span>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* ── State A: No Image in Shape ─────────────────────────────────── */}
      {!embedded ? (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-400">
            Embed a photo inside this {shapeTitle}. The image will conform to the vector clipping boundaries.
          </p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center space-x-2 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Upload Photo to Mask</span>
          </button>

          {/* Quick Stock Presets */}
          <div className="space-y-1.5 pt-1">
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Or Pick Healthcare Preset
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {STOCK_HEALTHCARE_PHOTOS.slice(0, 3).map((stock) => (
                <button
                  key={stock.id}
                  type="button"
                  onClick={() => handleSetImage(stock.url, stock.title)}
                  title={`Mask ${stock.title} into ${shapeTitle}`}
                  className="h-14 rounded-lg border border-slate-200 overflow-hidden relative transition hover:scale-105"
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
        </div>
      ) : (
        /* ── State B: Image Embedded & Masked in Shape ──────────────────── */
        <div className="space-y-3.5">
          {/* Thumbnail preview and Replace/Detach actions */}
          <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <img
                src={embedded.url}
                alt="Masked preview"
                className="w-9 h-9 rounded object-cover border border-slate-300"
              />
              <div className="truncate max-w-[110px]">
                <span className="block text-xs font-semibold text-slate-800 truncate">
                  {embedded.name || "Embedded Photo"}
                </span>
                <span className="block text-[10px] text-slate-400 uppercase font-mono">
                  {fitMode} • {shapeTitle}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded transition"
                title="Replace Photo"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded transition"
                title="Detach / Remove Photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Fit Mode Switcher */}
          <div className="space-y-1.5">
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              In-Frame Fit Mode
            </span>
            <div className="grid grid-cols-3 gap-1 text-[11px]">
              {(["cover", "contain", "fill"] as ImageFitMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleFitModeChange(mode)}
                  className={`px-2 py-1 rounded-md border font-medium capitalize transition ${
                    fitMode === mode
                      ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* In-Frame Zoom Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <ZoomIn className="w-3 h-3 text-slate-400" />
                <span>In-Frame Zoom</span>
              </div>
              <span className="font-mono font-semibold text-slate-800 text-[11px]">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => handleZoomChange(Number(e.target.value))}
              onInput={(e) => handleZoomChange(Number((e.target as HTMLInputElement).value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* In-Frame Pan X & Y */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                <Move className="w-3 h-3 text-slate-400" />
                <span>Pan Position</span>
              </div>
              <button
                type="button"
                onClick={handleCenterPan}
                className="text-[10px] font-semibold text-blue-600 hover:underline"
              >
                Center
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Pan X</span>
                  <span className="font-mono">{panX}px</span>
                </div>
                <input
                  type="range"
                  min={-200}
                  max={200}
                  value={panX}
                  onChange={(e) => handlePanXChange(Number(e.target.value))}
                  onInput={(e) => handlePanXChange(Number((e.target as HTMLInputElement).value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Pan Y</span>
                  <span className="font-mono">{panY}px</span>
                </div>
                <input
                  type="range"
                  min={-200}
                  max={200}
                  value={panY}
                  onChange={(e) => handlePanYChange(Number(e.target.value))}
                  onInput={(e) => handlePanYChange(Number((e.target as HTMLInputElement).value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* ── Image Filters & Color Grading ───────────────────────────── */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Color Grading / Duotone
              </span>
              {(brightness !== 0 || contrast !== 0 || saturation !== 0 || blur !== 0 || duotone !== "none") && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 hover:text-blue-600 transition"
                  title="Reset Filters to Default"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1 text-[10px] font-semibold">
              {[
                { id: "none", label: "Natural" },
                { id: "teal", label: "Teal" },
                { id: "blue", label: "Blue" },
                { id: "warm", label: "Warm" },
                { id: "mono", label: "B&W" },
              ].map((preset) => {
                const isSelected = duotone === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleDuotoneChange(preset.id as DuotonePreset)}
                    className={`py-1 rounded border text-center transition ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Brightness */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span className="text-[10px] font-medium text-slate-500">Brightness</span>
                <span className="font-mono text-[11px] font-semibold">
                  {Math.round(brightness * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={-0.8}
                max={0.8}
                step={0.05}
                value={brightness}
                onChange={(e) => handleBrightnessChange(Number(e.target.value))}
                onInput={(e) => handleBrightnessChange(Number((e.target as HTMLInputElement).value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span className="text-[10px] font-medium text-slate-500">Contrast</span>
                <span className="font-mono text-[11px] font-semibold">
                  {Math.round(contrast * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={-0.8}
                max={0.8}
                step={0.05}
                value={contrast}
                onChange={(e) => handleContrastChange(Number(e.target.value))}
                onInput={(e) => handleContrastChange(Number((e.target as HTMLInputElement).value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span className="text-[10px] font-medium text-slate-500">Saturation</span>
                <span className="font-mono text-[11px] font-semibold">
                  {Math.round(saturation * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={saturation}
                onChange={(e) => handleSaturationChange(Number(e.target.value))}
                onInput={(e) => handleSaturationChange(Number((e.target as HTMLInputElement).value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            {/* Blur */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-600">
                <span className="text-[10px] font-medium text-slate-500">Blur Filter</span>
                <span className="font-mono text-[11px] font-semibold">
                  {blur}px
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={16}
                value={blur}
                onChange={(e) => handleBlurChange(Number(e.target.value))}
                onInput={(e) => handleBlurChange(Number((e.target as HTMLInputElement).value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
