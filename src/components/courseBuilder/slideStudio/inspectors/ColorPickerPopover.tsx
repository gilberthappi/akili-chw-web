import React, { useState, useRef, useEffect } from "react";
import { HexColorPicker } from "react-colorful";

interface ColorPickerPopoverProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}

const PALETTE_SWATCHES = [
  // Clean Neutrals
  "#FFFFFF",
  "#F8FAFC",
  "#F1F5F9",
  "#E2E8F0",
  "#94A3B8",
  "#0F172A",
  // Clinical / Soft Tints
  "#E0F2FE", // Soft Sky
  "#D1FAE5", // Soft Emerald
  "#FEF3C7", // Soft Amber
  "#FEE2E2", // Soft Rose
  "#EDE9FE", // Soft Purple
  // Vibrant Accents
  "#2563EB", // Primary Blue
  "#0D9488", // Medical Teal
  "#10B981", // Success Green
  "#F59E0B", // Warning Amber
  "#EF4444", // Danger Red
  "#7C3AED", // Royal Violet
];

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  color,
  onChange,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const hexValue = (color.startsWith("#") ? color : `#${color}`).toUpperCase();

  return (
    <div className="relative" ref={popoverRef}>
      {label && (
        <span className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          {label}
        </span>
      )}

      {/* Trigger Button with Swatch & Hex */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition text-xs font-mono text-slate-800"
      >
        <div className="flex items-center space-x-2">
          <div
            className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="font-semibold">{hexValue}</span>
        </div>
        <span className="text-[10px] text-slate-400 font-sans">Edit</span>
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 p-3 bg-white border border-slate-200 rounded-xl shadow-xl space-y-3 w-[220px] animate-in fade-in zoom-in-95 duration-100">
          <HexColorPicker
            color={color}
            onChange={onChange}
            className="!w-full !h-[140px]"
          />

          {/* Hex Input */}
          <div className="flex items-center space-x-1.5 border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-xs font-mono">
            <span className="text-slate-400">#</span>
            <input
              type="text"
              value={color.replace("#", "")}
              onChange={(e) => {
                const val = e.target.value.trim();
                onChange(`#${val}`);
              }}
              className="w-full bg-transparent outline-hidden uppercase font-semibold text-slate-800"
              maxLength={6}
            />
          </div>

          {/* Preset Swatches */}
          <div>
            <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Presets
            </span>
            <div className="grid grid-cols-6 gap-1.5">
              {PALETTE_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => {
                    onChange(swatch);
                    setIsOpen(false);
                  }}
                  className={`w-6 h-6 rounded-md border transition hover:scale-110 ${
                    swatch.toLowerCase() === color.toLowerCase()
                      ? "ring-2 ring-blue-500 border-white"
                      : "border-slate-200"
                  }`}
                  style={{ backgroundColor: swatch }}
                  title={swatch}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
