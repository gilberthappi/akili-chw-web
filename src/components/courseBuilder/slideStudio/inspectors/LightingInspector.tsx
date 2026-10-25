import React, { useState } from "react";
import { FabricObject, Canvas as FabricCanvas } from "fabric";
import {
  Sun,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Layers,
  ArrowDownLeft,
} from "lucide-react";
import {
  LightingState,
  ShadowLayer,
  LIGHTING_PRESETS,
  autoTintFromFill,
} from "../lighting/types";
import { LightingEngine } from "../lighting/LightingEngine";
import { LightAngleDial } from "./LightAngleDial";
import { ColorPickerPopover } from "./ColorPickerPopover";

interface LightingInspectorProps {
  canvas: FabricCanvas | null;
  selectedObject: FabricObject | null;
  onModify: () => void;
}

export const LightingInspector: React.FC<LightingInspectorProps> = ({
  canvas,
  selectedObject,
  onModify,
}) => {
  if (!selectedObject) return null;

  const currentLightingState = LightingEngine.getLightingState(selectedObject);
  const [lighting, setLighting] = useState<LightingState>(currentLightingState);

  // Accordion expansion states
  const [openContact, setOpenContact] = useState(true);
  const [openAmbient, setOpenAmbient] = useState(false);
  const [openInner, setOpenInner] = useState(false);

  // Sync whenever selectedObject changes
  React.useEffect(() => {
    if (selectedObject) {
      setLighting(LightingEngine.getLightingState(selectedObject));
    }
  }, [selectedObject]);

  const updateStateAndApply = (newState: LightingState) => {
    setLighting(newState);
    LightingEngine.applyLightingToObject(selectedObject, newState, canvas);
    onModify();
  };

  // ── Preset Selection ──────────────────────────────────────────────────
  const handleSelectPreset = (presetId: string) => {
    const updated = LightingEngine.applyPreset(presetId, selectedObject, canvas);
    setLighting(updated);
    onModify();
  };

  // ── Light Angle & Distance ───────────────────────────────────────────
  const handleLightChange = (newAngle: number, newDistance: number) => {
    const updated = LightingEngine.updateLightAngleAndDistance(lighting, newAngle, newDistance);
    updateStateAndApply(updated);
  };

  // ── Layer Attribute Updates ──────────────────────────────────────────
  const updateLayer = (layerId: string, patch: Partial<ShadowLayer>) => {
    const updatedLayers = lighting.layers.map((layer) => {
      if (layer.id === layerId) {
        return { ...layer, ...patch };
      }
      return layer;
    });

    const updatedState: LightingState = {
      ...lighting,
      presetId: "custom",
      layers: updatedLayers,
    };
    updateStateAndApply(updatedState);
  };

  // Ensure contact layer exists
  const getOrCreateLayer = (
    type: "contact" | "ambient" | "inner",
    defaultName: string,
    defaultBlur: number,
    defaultOpacity: number
  ): ShadowLayer => {
    const found = lighting.layers.find((l) => l.type === type);
    if (found) return found;

    return {
      id: `${type}-${Date.now()}`,
      name: defaultName,
      type,
      enabled: false,
      color: "#0f172a",
      opacity: defaultOpacity,
      blur: defaultBlur,
      offsetX: 0,
      offsetY: type === "inner" ? 3 : 4,
    };
  };

  const contactLayer = getOrCreateLayer("contact", "Contact Shadow", 4, 0.12);
  const ambientLayer = getOrCreateLayer("ambient", "Ambient Glow", 24, 0.08);
  const innerLayer = getOrCreateLayer("inner", "Inner Shadow (Inset)", 8, 0.15);

  const toggleLayerEnabled = (type: "contact" | "ambient" | "inner", defaultLayer: ShadowLayer) => {
    const exists = lighting.layers.some((l) => l.type === type);
    let updatedLayers: ShadowLayer[];

    if (!exists) {
      updatedLayers = [...lighting.layers, { ...defaultLayer, enabled: true }];
    } else {
      updatedLayers = lighting.layers.map((l) =>
        l.type === type ? { ...l, enabled: !l.enabled } : l
      );
    }

    const updatedState: LightingState = {
      ...lighting,
      presetId: "custom",
      layers: updatedLayers,
    };
    updateStateAndApply(updatedState);
  };

  // ── Auto-Tint from Fill ──────────────────────────────────────────────
  const handleAutoTintAmbient = () => {
    const objFill = typeof selectedObject.fill === "string" ? selectedObject.fill : "#2563eb";
    const tinted = autoTintFromFill(objFill);

    const exists = lighting.layers.some((l) => l.type === "ambient");
    let updatedLayers: ShadowLayer[];

    if (!exists) {
      updatedLayers = [
        ...lighting.layers,
        {
          id: `ambient-${Date.now()}`,
          name: "Ambient Glow",
          type: "ambient",
          enabled: true,
          color: tinted,
          opacity: 0.28,
          blur: 32,
          offsetX: 0,
          offsetY: 8,
        },
      ];
    } else {
      updatedLayers = lighting.layers.map((l) =>
        l.type === "ambient" ? { ...l, enabled: true, color: tinted, opacity: 0.28 } : l
      );
    }

    const updatedState: LightingState = {
      ...lighting,
      presetId: "custom",
      layers: updatedLayers,
    };
    updateStateAndApply(updatedState);
  };

  return (
    <div className="p-4 space-y-4 border-t border-slate-200">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Sun className="w-4 h-4 text-amber-500" />
          <span>Lighting & Depth</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 capitalize">
          {lighting.presetId || "Custom"}
        </span>
      </div>

      {/* ── 1-Click Pro Elevation Presets ───────────────────────────────── */}
      <div className="space-y-1.5">
        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Elevation Presets
        </span>
        <div className="grid grid-cols-3 gap-1.5 text-[11px]">
          {LIGHTING_PRESETS.map((p) => {
            const isSelected = lighting.presetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p.id)}
                title={p.description}
                className={`px-2 py-1.5 rounded-lg border text-center font-medium transition ${
                  isSelected
                    ? "bg-blue-50 text-blue-700 border-blue-300 font-semibold shadow-2xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {p.name.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 360° Light Direction Dial ───────────────────────────────────── */}
      <LightAngleDial
        angle={lighting.angle}
        distance={lighting.distance}
        onChange={handleLightChange}
      />

      {/* ── Shadow Layers Accordions ────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          <span>Depth Layers</span>
          <span className="font-mono text-slate-500">
            {lighting.layers.filter((l) => l.enabled).length} Active
          </span>
        </div>

        {/* 1. Contact Shadow Accordion */}
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div className="flex items-center justify-between p-2.5 bg-slate-50/70 text-xs">
            <button
              type="button"
              onClick={() => {
                if (!openContact) {
                  setOpenContact(true);
                  if (!contactLayer.enabled) {
                    toggleLayerEnabled("contact", contactLayer);
                  }
                } else {
                  setOpenContact(false);
                }
              }}
              className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-slate-900 flex-1 text-left"
            >
              {openContact ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Contact Shadow</span>
            </button>
            <button
              type="button"
              onClick={() => toggleLayerEnabled("contact", contactLayer)}
              className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                contactLayer.enabled ? "bg-blue-600" : "bg-slate-300"
              }`}
              title={contactLayer.enabled ? "Disable Contact Shadow" : "Enable Contact Shadow"}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5 ${
                  contactLayer.enabled ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {openContact && (
            <div className="p-3 space-y-3 border-t border-slate-100">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
                <span className="font-medium text-slate-600 text-[11px]">Layer Status</span>
                <span className={`font-semibold text-[11px] ${contactLayer.enabled ? "text-blue-600" : "text-slate-400"}`}>
                  {contactLayer.enabled ? "Active" : "Disabled (Drag slider to enable)"}
                </span>
              </div>

              <ColorPickerPopover
                label="Shadow Color"
                color={contactLayer.color}
                onChange={(c) => updateLayer(contactLayer.id, { color: c, enabled: true })}
              />

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="text-[10px] font-medium text-slate-500">Blur Radius</span>
                  <span className="font-mono text-[11px] font-semibold">{contactLayer.blur}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={contactLayer.blur}
                  onChange={(e) => updateLayer(contactLayer.id, { blur: Number(e.target.value), enabled: true })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="text-[10px] font-medium text-slate-500">Opacity</span>
                  <span className="font-mono text-[11px] font-semibold">
                    {Math.round(contactLayer.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={contactLayer.opacity}
                  onChange={(e) => updateLayer(contactLayer.id, { opacity: Number(e.target.value), enabled: true })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. Ambient Elevation Glow Accordion */}
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div className="flex items-center justify-between p-2.5 bg-slate-50/70 text-xs">
            <button
              type="button"
              onClick={() => {
                if (!openAmbient) {
                  setOpenAmbient(true);
                  if (!ambientLayer.enabled) {
                    toggleLayerEnabled("ambient", ambientLayer);
                  }
                } else {
                  setOpenAmbient(false);
                }
              }}
              className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-slate-900 flex-1 text-left"
            >
              {openAmbient ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Ambient Glow</span>
            </button>
            <button
              type="button"
              onClick={() => toggleLayerEnabled("ambient", ambientLayer)}
              className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                ambientLayer.enabled ? "bg-blue-600" : "bg-slate-300"
              }`}
              title={ambientLayer.enabled ? "Disable Ambient Glow" : "Enable Ambient Glow"}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5 ${
                  ambientLayer.enabled ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {openAmbient && (
            <div className="p-3 space-y-3 border-t border-slate-100">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
                <span className="font-medium text-slate-600 text-[11px]">Layer Status</span>
                <span className={`font-semibold text-[11px] ${ambientLayer.enabled ? "text-blue-600" : "text-slate-400"}`}>
                  {ambientLayer.enabled ? "Active" : "Disabled (Drag slider to enable)"}
                </span>
              </div>

              <div className="flex items-end justify-between gap-2">
                <div className="flex-1">
                  <ColorPickerPopover
                    label="Ambient Tint"
                    color={ambientLayer.color}
                    onChange={(c) => updateLayer(ambientLayer.id, { color: c, enabled: true })}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAutoTintAmbient}
                  title="Sample card fill color into ambient glow"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-semibold transition"
                >
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  <span>Auto-Tint</span>
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="text-[10px] font-medium text-slate-500">Glow Blur</span>
                  <span className="font-mono text-[11px] font-semibold">{ambientLayer.blur}px</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={64}
                  value={ambientLayer.blur}
                  onChange={(e) => updateLayer(ambientLayer.id, { blur: Number(e.target.value), enabled: true })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="text-[10px] font-medium text-slate-500">Glow Opacity</span>
                  <span className="font-mono text-[11px] font-semibold">
                    {Math.round(ambientLayer.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={ambientLayer.opacity}
                  onChange={(e) => updateLayer(ambientLayer.id, { opacity: Number(e.target.value), enabled: true })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Inset / Inner Shadow Accordion */}
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
          <div className="flex items-center justify-between p-2.5 bg-slate-50/70 text-xs">
            <button
              type="button"
              onClick={() => {
                if (!openInner) {
                  setOpenInner(true);
                  if (!innerLayer.enabled) {
                    toggleLayerEnabled("inner", innerLayer);
                  }
                } else {
                  setOpenInner(false);
                }
              }}
              className="flex items-center gap-1.5 font-semibold text-slate-700 hover:text-slate-900 flex-1 text-left"
            >
              {openInner ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Inner Shadow (Inset)</span>
            </button>
            <button
              type="button"
              onClick={() => toggleLayerEnabled("inner", innerLayer)}
              className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                innerLayer.enabled ? "bg-blue-600" : "bg-slate-300"
              }`}
              title={innerLayer.enabled ? "Disable Inner Shadow" : "Enable Inner Shadow"}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out mt-0.5 ${
                  innerLayer.enabled ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {openInner && (
            <div className="p-3 space-y-3 border-t border-slate-100">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs">
                <span className="font-medium text-slate-600 text-[11px]">Layer Status</span>
                <span className={`font-semibold text-[11px] ${innerLayer.enabled ? "text-blue-600" : "text-slate-400"}`}>
                  {innerLayer.enabled ? "Active" : "Disabled (Drag slider to enable)"}
                </span>
              </div>

              <ColorPickerPopover
                label="Inner Shadow Color"
                color={innerLayer.color}
                onChange={(c) => updateLayer(innerLayer.id, { color: c, enabled: true })}
              />

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="text-[10px] font-medium text-slate-500">Inset Depth (Offset)</span>
                  <span className="font-mono text-[11px] font-semibold">{innerLayer.offsetY}px</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={24}
                  value={innerLayer.offsetY}
                  onChange={(e) => {
                    const depth = Number(e.target.value);
                    updateLayer(innerLayer.id, {
                      offsetY: depth,
                      offsetX: Math.round(depth * 0.3),
                      enabled: true,
                    });
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="text-[10px] font-medium text-slate-500">Inner Blur</span>
                  <span className="font-mono text-[11px] font-semibold">{innerLayer.blur}px</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={32}
                  value={innerLayer.blur}
                  onChange={(e) => updateLayer(innerLayer.id, { blur: Number(e.target.value), enabled: true })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span className="text-[10px] font-medium text-slate-500">Inner Opacity</span>
                  <span className="font-mono text-[11px] font-semibold">
                    {Math.round(innerLayer.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={innerLayer.opacity}
                  onChange={(e) => updateLayer(innerLayer.id, { opacity: Number(e.target.value), enabled: true })}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
