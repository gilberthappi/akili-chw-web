import React, { useState, useEffect, useCallback } from "react";
import { Canvas as FabricCanvas, FabricObject } from "fabric";
import {
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  RotateCcw,
  Sparkles,
  Palette,
  Compass,
} from "lucide-react";
import {
  FontCategory,
  CURATED_GOOGLE_FONTS,
  PRESET_TEXT_GRADIENTS,
  TextTypographyState,
  TextTransformMode,
} from "../typography/types";
import { TypographyEngine } from "../typography/TypographyEngine";
import { ColorPickerPopover } from "./ColorPickerPopover";

interface TypographyInspectorProps {
  textObj: FabricObject;
  canvas: FabricCanvas | null;
  onModify: () => void;
}

export const TypographyInspector: React.FC<TypographyInspectorProps> = ({
  textObj,
  canvas: _canvas,
  onModify,
}) => {
  const [typography, setTypography] = useState<TextTypographyState>(() =>
    TypographyEngine.getTypographyState(textObj)
  );

  const [activeCategory, setActiveCategory] = useState<FontCategory>("all");
  const [fontLoading, setFontLoading] = useState(false);

  // Sync state whenever selected text object changes
  useEffect(() => {
    if (textObj) {
      setTypography(TypographyEngine.getTypographyState(textObj));
    }
  }, [textObj]);

  // Synchronize update helper
  const updateTypography = useCallback(
    (patch: Partial<TextTypographyState>) => {
      setTypography((prev) => {
        const next = { ...prev, ...patch };

        // Apply immediately to Fabric textObj
        if (patch.fontFamily !== undefined) {
          textObj.set("fontFamily", patch.fontFamily);
          TypographyEngine.loadGoogleFont(patch.fontFamily).then(() => {
            textObj.dirty = true;
            textObj.canvas?.requestRenderAll();
          });
        }

        if (patch.fontSize !== undefined) {
          textObj.set("fontSize", patch.fontSize);
        }

        if (patch.fontWeight !== undefined) {
          textObj.set("fontWeight", patch.fontWeight);
        }

        if (patch.fontStyle !== undefined) {
          textObj.set("fontStyle", patch.fontStyle);
        }

        if (patch.underline !== undefined) {
          textObj.set("underline", patch.underline);
        }

        if (patch.linethrough !== undefined) {
          textObj.set("linethrough", patch.linethrough);
        }

        if (patch.charSpacing !== undefined) {
          textObj.set("charSpacing", patch.charSpacing);
        }

        if (patch.lineHeight !== undefined) {
          textObj.set("lineHeight", patch.lineHeight);
        }

        if (patch.textAlign !== undefined) {
          textObj.set("textAlign", patch.textAlign);
        }

        if (patch.fillType === "solid" && (patch.fillColor || next.fillColor)) {
          textObj.set("fill", patch.fillColor || next.fillColor);
          (textObj as any).textGradient = undefined;
        } else if (patch.fillType === "gradient" || next.fillType === "gradient") {
          if (next.gradient) {
            TypographyEngine.applyTextGradient(textObj, next.gradient);
          }
        }

        if (patch.stroke) {
          TypographyEngine.applyTextStroke(textObj, patch.stroke);
        }

        if (patch.glow) {
          TypographyEngine.applyTextGlow(textObj, patch.glow);
        }

        if (patch.curved) {
          TypographyEngine.applyCurvature(textObj, patch.curved.curvature);
        }

        textObj.setCoords();
        textObj.dirty = true;
        textObj.canvas?.requestRenderAll();
        onModify();

        return next;
      });
    },
    [textObj, onModify]
  );

  // ── Font Selector Handlers ────────────────────────────────────────────────
  const handleFontChange = async (fontFamily: string) => {
    setFontLoading(true);
    await TypographyEngine.loadGoogleFont(fontFamily);
    setFontLoading(false);
    updateTypography({ fontFamily });
  };

  const filteredFonts = CURATED_GOOGLE_FONTS.filter((f) => {
    if (activeCategory === "all") return true;
    return f.category === activeCategory;
  });

  // ── Curvature Slider Handlers ─────────────────────────────────────────────
  const handleCurvatureChange = (curvature: number) => {
    updateTypography({
      curved: {
        enabled: Math.abs(curvature) > 0,
        curvature,
      },
    });
  };

  // ── Gradient Handlers ─────────────────────────────────────────────────────
  const handleApplyGradientPreset = (preset: (typeof PRESET_TEXT_GRADIENTS)[0]) => {
    const nextGrad = {
      enabled: true,
      type: "linear" as const,
      angle: typography.gradient?.angle || 90,
      stops: preset.stops,
    };
    updateTypography({
      fillType: "gradient",
      gradient: nextGrad,
    });
  };

  const handleGradientAngleChange = (angle: number) => {
    if (!typography.gradient) return;
    const nextGrad = {
      ...typography.gradient,
      angle,
    };
    updateTypography({
      fillType: "gradient",
      gradient: nextGrad,
    });
  };

  // ── Case Transformation Handlers ──────────────────────────────────────────
  const handleTransformCase = (mode: TextTransformMode) => {
    const rawText = (textObj as any).text || "";
    const transformed = TypographyEngine.transformCase(rawText, mode);
    textObj.set("text", transformed);
    (textObj as any).textTransform = mode;
    updateTypography({ textTransform: mode });
  };

  return (
    <div className="p-4 space-y-4 border-t border-slate-200">
      {/* ── Section Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Type className="w-4 h-4 text-blue-600" />
          <span>Typography Studio</span>
        </div>
        {typography.curved.enabled && (
          <span className="text-[10px] font-mono text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
            {typography.curved.curvature > 0 ? "Arched Up" : "Arched Down"}
          </span>
        )}
      </div>

      {/* ── 1. Curated Google Font Picker ───────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Font Family
          </span>
          {fontLoading && (
            <span className="text-[10px] text-blue-600 font-medium animate-pulse">
              Loading glyphs...
            </span>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-medium text-slate-600">
          {(["all", "sans", "serif", "display", "mono"] as FontCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 py-1 rounded text-center capitalize transition ${
                activeCategory === cat
                  ? "bg-white text-blue-600 font-bold shadow-2xs"
                  : "hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Font Select Menu */}
        <select
          value={typography.fontFamily}
          onChange={(e) => handleFontChange(e.target.value)}
          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-hidden focus:border-blue-500 focus:bg-white transition"
          style={{ fontFamily: typography.fontFamily }}
        >
          {filteredFonts.map((f) => (
            <option key={f.family} value={f.family} style={{ fontFamily: f.family }}>
              {f.name} {f.category ? `(${f.category})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* ── 2. Font Size & Quick Styles Toolbar ─────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Size & Styling
          </span>
          <span className="font-mono font-semibold text-slate-800 text-[11px]">
            {typography.fontSize}px
          </span>
        </div>

        <input
          type="range"
          min={12}
          max={140}
          value={typography.fontSize}
          onChange={(e) => updateTypography({ fontSize: Number(e.target.value) })}
          onInput={(e) =>
            updateTypography({ fontSize: Number((e.target as HTMLInputElement).value) })
          }
          className="w-full accent-blue-600 cursor-pointer"
        />

        {/* Style Toggles: Bold, Italic, Underline, Strikethrough */}
        <div className="grid grid-cols-4 gap-1 pt-0.5">
          <button
            type="button"
            onClick={() =>
              updateTypography({
                fontWeight: typography.fontWeight === "bold" ? "normal" : "bold",
              })
            }
            className={`py-1.5 flex items-center justify-center rounded-lg border transition ${
              typography.fontWeight === "bold"
                ? "bg-blue-50 text-blue-700 border-blue-200 font-bold"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() =>
              updateTypography({
                fontStyle: typography.fontStyle === "italic" ? "normal" : "italic",
              })
            }
            className={`py-1.5 flex items-center justify-center rounded-lg border transition ${
              typography.fontStyle === "italic"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => updateTypography({ underline: !typography.underline })}
            className={`py-1.5 flex items-center justify-center rounded-lg border transition ${
              typography.underline
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => updateTypography({ linethrough: !typography.linethrough })}
            className={`py-1.5 flex items-center justify-center rounded-lg border transition ${
              typography.linethrough
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alignment & Casing */}
        <div className="flex items-center justify-between gap-1 pt-1">
          {/* Alignment */}
          <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
            {(["left", "center", "right", "justify"] as const).map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => updateTypography({ textAlign: align })}
                className={`p-1 rounded transition ${
                  typography.textAlign === align
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title={`Align ${align}`}
              >
                {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                {align === "justify" && <AlignJustify className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>

          {/* Casing Buttons */}
          <div className="flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200 text-[10px] font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => handleTransformCase("uppercase")}
              className="px-1.5 py-1 rounded hover:bg-white transition"
              title="UPPERCASE"
            >
              AA
            </button>
            <button
              type="button"
              onClick={() => handleTransformCase("capitalize")}
              className="px-1.5 py-1 rounded hover:bg-white transition"
              title="Title Case"
            >
              Aa
            </button>
            <button
              type="button"
              onClick={() => handleTransformCase("lowercase")}
              className="px-1.5 py-1 rounded hover:bg-white transition"
              title="lowercase"
            >
              aa
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Curved & Arched Text Engine ──────────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>Curved / Arched Text</span>
          </div>
          {typography.curved.curvature !== 0 && (
            <button
              type="button"
              onClick={() => handleCurvatureChange(0)}
              className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 hover:underline"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Flatten (0°)</span>
            </button>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span className="text-[10px]">Arc Curvature</span>
            <span className="font-mono text-[11px] font-semibold text-slate-800">
              {typography.curved.curvature > 0 ? `+${typography.curved.curvature}°` : `${typography.curved.curvature}°`}
            </span>
          </div>
          <input
            type="range"
            min={-180}
            max={180}
            step={2}
            value={typography.curved.curvature}
            onChange={(e) => handleCurvatureChange(Number(e.target.value))}
            onInput={(e) =>
              handleCurvatureChange(Number((e.target as HTMLInputElement).value))
            }
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>-180° Concave</span>
            <span>0° Flat</span>
            <span>+180° Convex</span>
          </div>
        </div>
      </div>

      {/* ── 4. Micro-Typography (Letter Spacing & Line Height) ───────────── */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Micro-Typography Spacing
        </span>

        {/* Letter Spacing */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span className="text-[10px]">Letter Spacing (Kerning)</span>
            <span className="font-mono text-[11px] font-semibold text-slate-800">
              {typography.charSpacing > 0 ? `+${typography.charSpacing}` : typography.charSpacing}
            </span>
          </div>
          <input
            type="range"
            min={-50}
            max={500}
            step={10}
            value={typography.charSpacing}
            onChange={(e) => updateTypography({ charSpacing: Number(e.target.value) })}
            onInput={(e) =>
              updateTypography({
                charSpacing: Number((e.target as HTMLInputElement).value),
              })
            }
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        {/* Line Height */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span className="text-[10px]">Line Height (Leading)</span>
            <span className="font-mono text-[11px] font-semibold text-slate-800">
              {typography.lineHeight.toFixed(2)}×
            </span>
          </div>
          <input
            type="range"
            min={0.8}
            max={2.5}
            step={0.05}
            value={typography.lineHeight}
            onChange={(e) => updateTypography({ lineHeight: Number(e.target.value) })}
            onInput={(e) =>
              updateTypography({
                lineHeight: Number((e.target as HTMLInputElement).value),
              })
            }
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>
      </div>

      {/* ── 5. Fill Mode: Solid Color vs Gradient ────────────────────────── */}
      <div className="space-y-2.5 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Fill & Color Blend
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-[10px] font-semibold">
            <button
              type="button"
              onClick={() => updateTypography({ fillType: "solid" })}
              className={`px-2 py-0.5 rounded transition ${
                typography.fillType === "solid"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600"
              }`}
            >
              Solid
            </button>
            <button
              type="button"
              onClick={() => updateTypography({ fillType: "gradient" })}
              className={`px-2 py-0.5 rounded transition ${
                typography.fillType === "gradient"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600"
              }`}
            >
              Gradient
            </button>
          </div>
        </div>

        {typography.fillType === "solid" ? (
          <ColorPickerPopover
            label="Text Color"
            color={typography.fillColor}
            onChange={(c) => updateTypography({ fillColor: c, fillType: "solid" })}
          />
        ) : (
          <div className="space-y-2">
            {/* Gradient Preset Swatches */}
            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_TEXT_GRADIENTS.map((p) => {
                const bgStyle = `linear-gradient(90deg, ${p.stops[0].color}, ${p.stops[1].color})`;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyGradientPreset(p)}
                    className="h-8 rounded-lg border border-slate-200 overflow-hidden relative shadow-2xs transition hover:scale-105"
                    style={{ background: bgStyle }}
                    title={p.name}
                  />
                );
              })}
            </div>

            {/* Gradient Angle */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span className="text-[10px]">Gradient Angle</span>
                <span className="font-mono text-[11px] font-semibold text-slate-800">
                  {typography.gradient?.angle ?? 90}°
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={typography.gradient?.angle ?? 90}
                onChange={(e) => handleGradientAngleChange(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 6. Text Stroke / Outline ─────────────────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Outline Stroke
          </span>
          <button
            type="button"
            onClick={() =>
              updateTypography({
                stroke: {
                  ...typography.stroke,
                  enabled: !typography.stroke.enabled,
                  width: typography.stroke.enabled ? 0 : 2,
                },
              })
            }
            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
              typography.stroke.enabled ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5 ${
                typography.stroke.enabled ? "translate-x-3.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {typography.stroke.enabled && (
          <div className="space-y-2">
            <ColorPickerPopover
              label="Stroke Color"
              color={typography.stroke.color}
              onChange={(c) =>
                updateTypography({
                  stroke: { ...typography.stroke, color: c, enabled: true },
                })
              }
            />

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span className="text-[10px]">Stroke Width</span>
                <span className="font-mono text-[11px] font-semibold text-slate-800">
                  {typography.stroke.width}px
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={16}
                value={typography.stroke.width}
                onChange={(e) =>
                  updateTypography({
                    stroke: {
                      ...typography.stroke,
                      width: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 7. Text Glow / Atmospheric Shadow ───────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Outline Glow</span>
          </div>
          <button
            type="button"
            onClick={() =>
              updateTypography({
                glow: {
                  ...typography.glow,
                  enabled: !typography.glow.enabled,
                  blur: typography.glow.enabled ? 0 : 16,
                },
              })
            }
            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
              typography.glow.enabled ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5 ${
                typography.glow.enabled ? "translate-x-3.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {typography.glow.enabled && (
          <div className="space-y-2">
            <ColorPickerPopover
              label="Glow Color"
              color={typography.glow.color}
              onChange={(c) =>
                updateTypography({
                  glow: { ...typography.glow, color: c, enabled: true },
                })
              }
            />

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-500">
                <span className="text-[10px]">Glow Radius</span>
                <span className="font-mono text-[11px] font-semibold text-slate-800">
                  {typography.glow.blur}px
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={40}
                value={typography.glow.blur}
                onChange={(e) =>
                  updateTypography({
                    glow: {
                      ...typography.glow,
                      blur: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

