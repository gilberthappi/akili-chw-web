import React, { useState, useEffect } from "react";
import { Group } from "fabric";
import {
  Palette,
  RotateCcw,
  Sparkles,
  Layers,
  Wand2,
} from "lucide-react";
import { SvgColorChannel } from "../assets/types";
import { SvgAssetEngine } from "../assets/SvgAssetEngine";
import { ColorPickerPopover } from "./ColorPickerPopover";

interface SvgColorInspectorProps {
  svgGroup: Group;
  onModify: () => void;
}

export const SvgColorInspector: React.FC<SvgColorInspectorProps> = ({
  svgGroup,
  onModify,
}) => {
  const [channels, setChannels] = useState<SvgColorChannel[]>(() =>
    SvgAssetEngine.getChannels(svgGroup)
  );

  const assetName = (svgGroup as any).svgName || "Vector Graphic";

  // Sync state whenever selected svgGroup changes
  useEffect(() => {
    if (svgGroup) {
      setChannels([...SvgAssetEngine.getChannels(svgGroup)]);
    }
  }, [svgGroup]);

  const handleRecolor = (channelId: string, newColor: string) => {
    SvgAssetEngine.recolorChannel(svgGroup, channelId, newColor);
    setChannels([...SvgAssetEngine.getChannels(svgGroup)]);
    onModify();
  };

  const handleResetColors = () => {
    SvgAssetEngine.resetColors(svgGroup);
    setChannels([...SvgAssetEngine.getChannels(svgGroup)]);
    onModify();
  };

  const handleThemeHarmonize = (primary: string, secondary?: string) => {
    if (channels.length === 0) return;
    channels.forEach((c, idx) => {
      const col = idx === 0 ? primary : secondary || primary;
      SvgAssetEngine.recolorChannel(svgGroup, c.id, col);
    });
    setChannels([...SvgAssetEngine.getChannels(svgGroup)]);
    onModify();
  };

  return (
    <div className="p-4 space-y-4 border-t border-slate-200">
      {/* ── Section Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <Palette className="w-4 h-4 text-blue-600" />
          <span>SVG Vector Palette</span>
        </div>
        <span className="text-[10px] font-mono text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
          {channels.length} {channels.length === 1 ? "Color" : "Colors"}
        </span>
      </div>

      {/* Asset Info Card */}
      <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100/70 border border-blue-200 flex items-center justify-center text-blue-600">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="block font-semibold text-slate-800">{assetName}</span>
            <span className="block text-[10px] text-slate-400">
              Multi-color vector element
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetColors}
          className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 hover:bg-white px-2 py-1 rounded transition"
          title="Reset to original SVG colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* ── Color Channels List ────────────────────────────────────────── */}
      <div className="space-y-2">
        <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Editable Color Channels
        </span>

        {channels.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            No distinct color fills detected.
          </p>
        ) : (
          <div className="space-y-1.5">
            {channels.map((channel, i) => (
              <div
                key={channel.id}
                className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition"
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                    style={{ backgroundColor: channel.currentColor }}
                  />
                  <div>
                    <span className="block text-xs font-semibold text-slate-800">
                      Layer {i + 1}
                    </span>
                    <span className="block text-[10px] font-mono text-slate-400">
                      {channel.currentColor} • {channel.count} {channel.count === 1 ? "path" : "paths"}
                    </span>
                  </div>
                </div>

                <ColorPickerPopover
                  label=""
                  color={channel.currentColor}
                  onChange={(c) => handleRecolor(channel.id, c)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 1-Click Palette Harmonizer Presets ─────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Wand2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Quick Theme Harmonize</span>
        </div>

        <div className="grid grid-cols-4 gap-1 text-[10px] font-semibold">
          {[
            { label: "Clinical", primary: "#2563EB", secondary: "#06B6D4" },
            { label: "Emerald", primary: "#059669", secondary: "#10B981" },
            { label: "Ruby", primary: "#E11D48", secondary: "#FB923C" },
            { label: "Monochrome", primary: "#0F172A", secondary: "#64748B" },
          ].map((theme) => (
            <button
              key={theme.label}
              type="button"
              onClick={() => handleThemeHarmonize(theme.primary, theme.secondary)}
              className="py-1.5 px-1 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-center transition"
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: theme.primary }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: theme.secondary }}
                />
              </div>
              <span>{theme.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

