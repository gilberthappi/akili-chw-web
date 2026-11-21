import React, { useState, useEffect } from "react";
import { CornerRadii } from "../shapes/BentCard";
import { SlidersHorizontal } from "lucide-react";

interface CornerRadiusControlProps {
  radii: CornerRadii;
  onChange: (radii: CornerRadii) => void;
}

export const CornerRadiusControl: React.FC<CornerRadiusControlProps> = ({
  radii,
  onChange,
}) => {
  const [isIndependent, setIsIndependent] = useState(
    !(radii[0] === radii[1] && radii[1] === radii[2] && radii[2] === radii[3])
  );

  useEffect(() => {
    const isUniform =
      radii[0] === radii[1] && radii[1] === radii[2] && radii[2] === radii[3];
    if (!isUniform) {
      setIsIndependent(true);
    }
  }, [radii]);

  const [tl, tr, br, bl] = radii;
  const uniformValue = Math.round(tl);

  const handleUniformChange = (val: number) => {
    const num = isNaN(val) ? 0 : val;
    const clamped = Math.max(0, Math.min(500, num));
    onChange([clamped, clamped, clamped, clamped]);
  };

  const handleCornerChange = (index: number, val: number) => {
    const num = isNaN(val) ? 0 : val;
    const clamped = Math.max(0, Math.min(500, num));
    const next: CornerRadii = [...radii];
    next[index] = clamped;
    onChange(next);
  };


  return (
    <div className="space-y-3">
      {/* Header with Mode Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Corner Bending
        </span>
        <button
          type="button"
          onClick={() => setIsIndependent((prev) => !prev)}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
            isIndependent
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
          title="Toggle independent 4-corner mode"
        >
          <SlidersHorizontal className="w-3 h-3" />
          <span>{isIndependent ? "4-Corners" : "Uniform"}</span>
        </button>
      </div>

      {/* Uniform Slider & Manual Input Mode */}
      {!isIndependent ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Radius</span>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                min={0}
                max={999}
                value={Math.round(uniformValue)}
                onChange={(e) => handleUniformChange(Number(e.target.value))}
                className="w-16 px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-semibold text-slate-800 text-right outline-hidden focus:border-blue-500 focus:bg-white transition"
              />
              <span className="text-[11px] text-slate-400">px</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={200}
            value={Math.min(200, uniformValue)}
            onChange={(e) => handleUniformChange(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>
      ) : (
        /* Independent 4-Corner Grid */
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
          {/* Top-Left */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Top-Left
            </span>
            <input
              type="number"
              min={0}
              max={500}
              value={Math.round(tl)}
              onChange={(e) => handleCornerChange(0, Number(e.target.value))}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 text-center outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Top-Right */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Top-Right
            </span>
            <input
              type="number"
              min={0}
              max={500}
              value={Math.round(tr)}
              onChange={(e) => handleCornerChange(1, Number(e.target.value))}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 text-center outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Bottom-Left */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Bottom-Left
            </span>
            <input
              type="number"
              min={0}
              max={500}
              value={Math.round(bl)}
              onChange={(e) => handleCornerChange(3, Number(e.target.value))}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 text-center outline-hidden focus:border-blue-500"
            />
          </div>

          {/* Bottom-Right */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">
              Bottom-Right
            </span>
            <input
              type="number"
              min={0}
              max={500}
              value={Math.round(br)}
              onChange={(e) => handleCornerChange(2, Number(e.target.value))}
              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 text-center outline-hidden focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* 1-Click Corner Presets */}
      <div className="space-y-1.5 pt-1">
        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Presets
        </span>
        <div className="grid grid-cols-3 gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => {
              setIsIndependent(false);
              onChange([20, 20, 20, 20]);
            }}
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 transition"
          >
            Card (20)
          </button>

          <button
            type="button"
            onClick={() => {
              setIsIndependent(true);
              onChange([48, 0, 48, 0]);
            }}
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 transition"
          >
            Leaf
          </button>

          <button
            type="button"
            onClick={() => {
              setIsIndependent(true);
              onChange([24, 24, 0, 0]);
            }}
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 transition"
          >
            Tab Top
          </button>

          <button
            type="button"
            onClick={() => {
              setIsIndependent(false);
              onChange([0, 0, 0, 0]);
            }}
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 transition"
          >
            Sharp (0)
          </button>

          <button
            type="button"
            onClick={() => {
              setIsIndependent(false);
              onChange([999, 999, 999, 999]);
            }}
            className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700 transition"
          >
            Pill
          </button>
        </div>
      </div>
    </div>
  );
};
