import React, { useState, useEffect } from "react";
import { Canvas as FabricCanvas, IText, Textbox, Path, type FabricObject } from "fabric";
import { BentCard, CornerRadii } from "../shapes/BentCard";
import { regenerateBlobPath } from "../shapes/OrganicBlob";
import { ColorPickerPopover } from "./ColorPickerPopover";
import { CornerRadiusControl } from "./CornerRadiusControl";
import { LightingInspector } from "./LightingInspector";
import { SlideBackgroundInspector } from "./SlideBackgroundInspector";
import { ImageMaskingInspector } from "./ImageMaskingInspector";
import { TypographyInspector } from "./TypographyInspector";
import { ArtboardBackgroundState } from "../media/types";
import {
  Layers,
  Trash2,
  Copy,
  Shuffle,
} from "lucide-react";

interface CardPropertyInspectorProps {
  canvas: FabricCanvas | null;
  selectedObject: FabricObject | null;
  onModify: () => void;
  backgroundState?: ArtboardBackgroundState;
  onBackgroundChange?: (bg: ArtboardBackgroundState) => void;
  aspectRatioLabel?: string;
}

export const CardPropertyInspector: React.FC<CardPropertyInspectorProps> = ({
  canvas,
  selectedObject,
  onModify,
  backgroundState,
  onBackgroundChange,
  aspectRatioLabel,
}) => {
  // Local Inspector States
  const [fillColor, setFillColor] = useState<string>("#ffffff");
  const [opacity, setOpacity] = useState<number>(1);
  const [strokeColor, setStrokeColor] = useState<string>("#e2e8f0");
  const [strokeWidth, setStrokeWidth] = useState<number>(2);
  const [strokeStyle, setStrokeStyle] = useState<"solid" | "dashed" | "dotted">("solid");
  const [strokeLineCap, setStrokeLineCap] = useState<"round" | "square" | "butt">("round");
  const [cornerRadii, setCornerRadii] = useState<CornerRadii>([24, 24, 24, 24]);
  const [fontSize, setFontSize] = useState<number>(32);
  const [fontFamily, setFontFamily] = useState<string>("Arial");
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [posX, setPosX] = useState<number>(0);
  const [posY, setPosY] = useState<number>(0);
  const [angle, setAngle] = useState<number>(0);

  // Sync state whenever selectedObject changes or transforms
  useEffect(() => {
    if (!selectedObject) return;

    // Fill
    const fill = typeof selectedObject.fill === "string" ? selectedObject.fill : "#ffffff";
    setFillColor(fill);

    // Opacity
    setOpacity(selectedObject.opacity ?? 1);

    // Stroke
    const stroke = typeof selectedObject.stroke === "string" ? selectedObject.stroke : "#e2e8f0";
    setStrokeColor(stroke);
    setStrokeWidth(selectedObject.strokeWidth ?? 0);
    setStrokeLineCap((selectedObject.strokeLineCap as "round" | "square" | "butt") || "round");

    // Stroke dash
    if (selectedObject.strokeDashArray && selectedObject.strokeDashArray.length > 0) {
      if (selectedObject.strokeDashArray[0] === 3) {
        setStrokeStyle("dotted");
      } else {
        setStrokeStyle("dashed");
      }
    } else {
      setStrokeStyle("solid");
    }

    // Corner Radii (if BentCard)
    if (selectedObject instanceof BentCard || "cornerRadii" in selectedObject) {
      const radii = (selectedObject as BentCard).cornerRadii;
      if (Array.isArray(radii) && radii.length === 4) {
        setCornerRadii([...radii]);
      }
    }

    // Text properties (if IText or Textbox)
    if (selectedObject instanceof IText || selectedObject instanceof Textbox) {
      setFontSize(selectedObject.fontSize || 32);
      setFontFamily(selectedObject.fontFamily || "Arial");
    }

    // Transform dimensions and coordinates
    const syncTransform = () => {
      setWidth(Math.round(selectedObject.getScaledWidth()));
      setHeight(Math.round(selectedObject.getScaledHeight()));
      setPosX(Math.round(selectedObject.left || 0));
      setPosY(Math.round(selectedObject.top || 0));
      setAngle(Math.round(selectedObject.angle || 0));
    };

    syncTransform();

    if (canvas) {
      canvas.on("object:moving", syncTransform);
      canvas.on("object:scaling", syncTransform);
      canvas.on("object:rotating", syncTransform);
      canvas.on("object:modified", syncTransform);
    }

    return () => {
      if (canvas) {
        canvas.off("object:moving", syncTransform);
        canvas.off("object:scaling", syncTransform);
        canvas.off("object:rotating", syncTransform);
        canvas.off("object:modified", syncTransform);
      }
    };
  }, [selectedObject, canvas]);

  if (!selectedObject || !canvas) {
    if (backgroundState && onBackgroundChange) {
      return (
        <SlideBackgroundInspector
          background={backgroundState}
          onChange={onBackgroundChange}
          aspectRatioLabel={aspectRatioLabel}
        />
      );
    }
    return (
      <aside className="w-72 bg-white border-l border-slate-200 p-5 flex flex-col items-center justify-center text-center select-none flex-shrink-0 z-20">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
          No Element Selected
        </h3>
        <p className="text-xs text-slate-400 max-w-[200px]">
          Click on any card, shape, or heading on the slide to edit its geometry, bending, and colors.
        </p>
      </aside>
    );
  }

  // Type Detection Flags
  const isGroup = selectedObject.type === "activeselection" || selectedObject.type === "group";
  const isCard = selectedObject instanceof BentCard || "cornerRadii" in selectedObject;
  const isText = selectedObject instanceof IText || selectedObject instanceof Textbox || selectedObject.type === "i-text" || selectedObject.type === "textbox";
  const shapeType = (selectedObject as unknown as { shapeType?: string }).shapeType;
  const isBlob = shapeType === "OrganicBlob";
  const isWave = shapeType === "WavyDivider";
  const isShield = shapeType === "ShieldBadge";
  const isBubble = shapeType === "SpeechBubble";
  const isChevron = shapeType === "ChevronArrow";
  const isPath = selectedObject instanceof Path || selectedObject.type === "path";
  const isStrokeable = isCard || isPath || isBlob || isWave || isShield || isBubble || isChevron;

  const getElementTitle = () => {
    if (isGroup) return `Multi-Selection (${(selectedObject as unknown as { _objects?: unknown[] })._objects?.length ?? ""})`;
    if (isCard) return "Container Card";
    if (isBlob) return "Organic Blob";
    if (isWave) return "Wave Divider";
    if (isShield) return "Medical Shield";
    if (isBubble) return "Speech Bubble";
    if (isChevron) return "Process Chevron";
    if (isText) return "Typography";
    if (isPath) return "Vector Path";
    return "Canvas Object";
  };

  // Property Handlers
  const handlePosXChange = (val: number) => {
    const num = isNaN(val) ? 0 : val;
    setPosX(num);
    selectedObject.set("left", num);
    selectedObject.setCoords();
    canvas.requestRenderAll();
    onModify();
  };

  const handlePosYChange = (val: number) => {
    const num = isNaN(val) ? 0 : val;
    setPosY(num);
    selectedObject.set("top", num);
    selectedObject.setCoords();
    canvas.requestRenderAll();
    onModify();
  };

  const handleWidthChange = (val: number) => {
    const num = Math.max(10, isNaN(val) ? 10 : val);
    setWidth(num);
    selectedObject.scaleToWidth(num);
    selectedObject.setCoords();
    canvas.requestRenderAll();
    onModify();
  };

  const handleHeightChange = (val: number) => {
    const num = Math.max(10, isNaN(val) ? 10 : val);
    setHeight(num);
    selectedObject.scaleToHeight(num);
    selectedObject.setCoords();
    canvas.requestRenderAll();
    onModify();
  };

  const handleAngleChange = (val: number) => {
    const num = isNaN(val) ? 0 : val;
    setAngle(num);
    selectedObject.set("angle", num);
    selectedObject.setCoords();
    canvas.requestRenderAll();
    onModify();
  };

  const handleFillChange = (newColor: string) => {
    setFillColor(newColor);
    selectedObject.set("fill", newColor);
    canvas.requestRenderAll();
    onModify();
  };

  const handleOpacityChange = (val: number) => {
    setOpacity(val);
    selectedObject.set("opacity", val);
    canvas.requestRenderAll();
    onModify();
  };

  const handleStrokeColorChange = (newColor: string) => {
    setStrokeColor(newColor);
    selectedObject.set("stroke", newColor);
    canvas.requestRenderAll();
    onModify();
  };

  const handleStrokeWidthChange = (val: number) => {
    setStrokeWidth(val);
    selectedObject.set("strokeWidth", val);
    if (val > 0 && !selectedObject.stroke) {
      selectedObject.set("stroke", strokeColor || "#e2e8f0");
    }
    canvas.requestRenderAll();
    onModify();
  };

  const handleStrokeStyleChange = (style: "solid" | "dashed" | "dotted") => {
    setStrokeStyle(style);
    if (style === "dashed") {
      selectedObject.set("strokeDashArray", [8, 8]);
    } else if (style === "dotted") {
      selectedObject.set("strokeDashArray", [3, 3]);
    } else {
      selectedObject.set("strokeDashArray", undefined);
    }
    canvas.requestRenderAll();
    onModify();
  };

  const handleStrokeLineCapChange = (cap: "round" | "square" | "butt") => {
    setStrokeLineCap(cap);
    selectedObject.set("strokeLineCap", cap);
    canvas.requestRenderAll();
    onModify();
  };

  const handleCornerRadiiChange = (radii: CornerRadii) => {
    setCornerRadii(radii);
    if (selectedObject instanceof BentCard || "setCornerRadii" in selectedObject) {
      (selectedObject as BentCard).setCornerRadii(radii);
    } else if ("rx" in selectedObject && "ry" in selectedObject) {
      (selectedObject as unknown as { rx: number; ry: number }).rx = radii[0];
      (selectedObject as unknown as { rx: number; ry: number }).ry = radii[0];
    }
    canvas.requestRenderAll();
    onModify();
  };

  const handleFontSizeChange = (size: number) => {
    const val = Math.max(8, isNaN(size) ? 16 : size);
    setFontSize(val);
    if (selectedObject instanceof IText || selectedObject instanceof Textbox) {
      selectedObject.set("fontSize", val);
      selectedObject.setCoords();
      canvas.requestRenderAll();
      onModify();
    }
  };

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    if (selectedObject instanceof IText || selectedObject instanceof Textbox) {
      selectedObject.set("fontFamily", family);
      selectedObject.setCoords();
      canvas.requestRenderAll();
      onModify();
    }
  };

  const handleShuffleBlob = () => {
    if (isBlob && selectedObject instanceof Path) {
      regenerateBlobPath(selectedObject);
      canvas.requestRenderAll();
      onModify();
    }
  };

  const handleDelete = () => {
    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    onModify();
  };

  const handleDuplicate = () => {
    selectedObject.clone().then((cloned) => {
      cloned.set({
        left: (cloned.left || 0) + 30,
        top: (cloned.top || 0) + 30,
      });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      canvas.requestRenderAll();
      onModify();
    });
  };

  return (
    <aside className="w-72 bg-white border-l border-slate-200 overflow-y-auto flex flex-col select-none flex-shrink-0 z-20 shadow-xs divide-y divide-slate-100">
      {/* ── Header: Element Title & Quick Actions ────────────────────────── */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <span className="text-xs font-bold text-slate-900 tracking-tight">
            {getElementTitle()}
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handleDuplicate}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition"
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Delete (Delete)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Section: Transform & Dimensions ──────────────────────────────── */}
      <div className="p-4 space-y-2.5">
        <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Transform & Dimensions
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* X */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition">
            <span className="text-slate-400 font-mono text-[10px] w-3">X</span>
            <input
              type="number"
              value={posX}
              onChange={(e) => handlePosXChange(Number(e.target.value))}
              className="w-full bg-transparent outline-hidden font-mono font-semibold text-slate-800 text-right"
            />
          </div>

          {/* Y */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition">
            <span className="text-slate-400 font-mono text-[10px] w-3">Y</span>
            <input
              type="number"
              value={posY}
              onChange={(e) => handlePosYChange(Number(e.target.value))}
              className="w-full bg-transparent outline-hidden font-mono font-semibold text-slate-800 text-right"
            />
          </div>

          {/* W */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition">
            <span className="text-slate-400 font-mono text-[10px] w-3">W</span>
            <input
              type="number"
              min={10}
              value={width}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="w-full bg-transparent outline-hidden font-mono font-semibold text-slate-800 text-right"
            />
          </div>

          {/* H */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition">
            <span className="text-slate-400 font-mono text-[10px] w-3">H</span>
            <input
              type="number"
              min={10}
              value={height}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="w-full bg-transparent outline-hidden font-mono font-semibold text-slate-800 text-right"
            />
          </div>

          {/* Angle / Rotation */}
          <div className="col-span-2 flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 focus-within:border-blue-500 focus-within:bg-white transition">
            <span className="text-slate-400 font-mono text-[10px] w-3">∠</span>
            <input
              type="number"
              value={angle}
              onChange={(e) => handleAngleChange(Number(e.target.value))}
              className="w-full bg-transparent outline-hidden font-mono font-semibold text-slate-800 text-right"
            />
            <span className="text-slate-400 font-mono text-[10px]">deg</span>
          </div>
        </div>
      </div>

      {/* ── Section: Corner Curvature (Only for Bent Cards) ───────────────── */}
      {isCard && (
        <div className="p-4">
          <CornerRadiusControl
            radii={cornerRadii}
            onChange={handleCornerRadiiChange}
          />
        </div>
      )}

      {/* ── Section: Organic Blob Controls ───────────────────────────────── */}
      {isBlob && (
        <div className="p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Organic Spline
            </span>
            <button
              type="button"
              onClick={handleShuffleBlob}
              className="flex items-center space-x-1 px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-semibold transition"
              title="Generate a new randomized organic spline curve"
            >
              <Shuffle className="w-3 h-3" />
              <span>Shuffle Shape</span>
            </button>
          </div>
          <span className="block text-[10px] text-slate-400">
            C1-smooth Catmull-Rom spline with randomized radial anchors.
          </span>
        </div>
      )}

      {/* ── Section: Typography Studio (When Text is selected) ──────────── */}
      {isText && (
        <TypographyInspector
          key={
            (selectedObject as unknown as { id?: string }).id ||
            `text-${(selectedObject as unknown as { text?: string }).text?.slice(0, 10)}`
          }
          textObj={selectedObject}
          canvas={canvas}
          onModify={onModify}
        />
      )}

      {/* ── Section: Fill Color & Opacity (For Shapes & Cards) ───────────── */}
      {!isText && (
        <div className="p-4 space-y-3">
          <ColorPickerPopover
            label="Fill Color"
            color={fillColor}
            onChange={handleFillChange}
          />

          {/* Opacity Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Opacity
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {Math.round(opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={opacity}
              onChange={(e) => handleOpacityChange(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* ── Section: Image & Masking (For Cards & All Vector Shapes) ───── */}
      {isStrokeable && (
        <ImageMaskingInspector
          key={
            (selectedObject as unknown as { id?: string; shapeType?: string }).id ||
            (selectedObject as unknown as { shapeType?: string }).shapeType ||
            `shape-${(selectedObject as unknown as { type?: string }).type}`
          }
          shape={selectedObject}
          canvas={canvas}
          onModify={onModify}
        />
      )}

      {/* ── Section: Border & Stroke Controls ───────────────────────────── */}
      {isStrokeable && (
        <div className="p-4 space-y-3">
          <ColorPickerPopover
            label="Stroke / Border"
            color={strokeColor}
            onChange={handleStrokeColorChange}
          />

          {/* Stroke Width */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Stroke Width
              </span>
              <span className="font-mono font-semibold text-slate-800">
                {strokeWidth}px
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              value={strokeWidth}
              onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Stroke Style Buttons */}
          <div className="space-y-1.5 pt-1">
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Dash Style
            </span>
            <div className="grid grid-cols-3 gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => handleStrokeStyleChange("solid")}
                className={`px-2 py-1 rounded-md border font-medium transition ${
                  strokeStyle === "solid"
                    ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Solid
              </button>
              <button
                type="button"
                onClick={() => handleStrokeStyleChange("dashed")}
                className={`px-2 py-1 rounded-md border font-medium transition ${
                  strokeStyle === "dashed"
                    ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Dashed
              </button>
              <button
                type="button"
                onClick={() => handleStrokeStyleChange("dotted")}
                className={`px-2 py-1 rounded-md border font-medium transition ${
                  strokeStyle === "dotted"
                    ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Dotted
              </button>
            </div>
          </div>

          {/* Line Cap (Only for vector paths and strokes) */}
          {(isPath || isBlob || isWave) && (
            <div className="space-y-1.5 pt-1">
              <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Line End Cap
              </span>
              <div className="grid grid-cols-3 gap-1 text-[11px]">
                {(["round", "square", "butt"] as const).map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => handleStrokeLineCapChange(cap)}
                    className={`px-2 py-1 rounded-md border font-medium capitalize transition ${
                      strokeLineCap === cap
                        ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Section: Lighting Studio & Depth (Shapes only) ───────────────── */}
      {!isText && (
        <LightingInspector
          canvas={canvas}
          selectedObject={selectedObject}
          onModify={onModify}
        />
      )}
    </aside>
  );
};
