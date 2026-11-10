import React, { useRef, useCallback, useState, useEffect } from "react";
import { Compass } from "lucide-react";

interface LightAngleDialProps {
  angle: number; // 0° to 360°
  distance: number; // 0 to 64 px
  onChange: (angle: number, distance: number) => void;
}

/**
 * LightAngleDial - 360° radial light source controller with compass markings,
 * draggable sun handle, and distance depth slider.
 */
export const LightAngleDial: React.FC<LightAngleDialProps> = ({
  angle,
  distance,
  onChange,
}) => {
  const dialRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Normalize angle to 0..359
  const normalizedAngle = ((Math.round(angle) % 360) + 360) % 360;

  // Handle pointer rotation calculation
  const calculateAngleFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = clientX - centerX;
      const dy = clientY - centerY;

      let deg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      if (deg < 0) deg += 360;

      // Snap to 45° increments if within 4°
      for (const snap of [0, 45, 90, 135, 180, 225, 270, 315, 360]) {
        if (Math.abs(deg - (snap % 360)) <= 4) {
          deg = snap % 360;
          break;
        }
      }

      onChange(deg, distance);
    },
    [distance, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    calculateAngleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    calculateAngleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Dial geometry constants
  const size = 96;
  const radius = 38;
  const center = size / 2;
  const rad = (normalizedAngle * Math.PI) / 180;
  const handleX = center + radius * Math.cos(rad);
  const handleY = center + radius * Math.sin(rad);

  return (
    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Light Direction</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
          <input
            type="number"
            min={0}
            max={360}
            value={normalizedAngle}
            onChange={(e) => {
              const val = Math.max(0, Math.min(360, Number(e.target.value) || 0));
              onChange(val % 360, distance);
            }}
            className="w-8 text-right bg-transparent outline-none font-bold text-slate-800"
          />
          <span>°</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        {/* Circular SVG 360° Dial */}
        <div className="relative select-none touch-none">
          <svg
            ref={dialRef}
            width={size}
            height={size}
            className="cursor-crosshair overflow-visible"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Outer track ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="white"
              stroke="#cbd5e1"
              strokeWidth="2"
              className="drop-shadow-2xs"
            />

            {/* Inner radial markings (every 45 degrees) */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
              const rMark = (deg * Math.PI) / 180;
              const x1 = center + (radius - 5) * Math.cos(rMark);
              const y1 = center + (radius - 5) * Math.sin(rMark);
              const x2 = center + (radius - 1) * Math.cos(rMark);
              const y2 = center + (radius - 1) * Math.sin(rMark);
              const isMajor = deg % 90 === 0;
              return (
                <line
                  key={deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isMajor ? "#64748b" : "#94a3b8"}
                  strokeWidth={isMajor ? 1.5 : 1}
                />
              );
            })}

            {/* Center origin pivot */}
            <circle cx={center} cy={center} r={3} fill="#94a3b8" />

            {/* Direction Vector Ray */}
            <line
              x1={center}
              y1={center}
              x2={handleX}
              y2={handleY}
              stroke="#2563eb"
              strokeWidth="2"
              strokeDasharray="2 2"
            />

            {/* Draggable Sun Handle */}
            <circle
              cx={handleX}
              cy={handleY}
              r={7}
              fill="#2563eb"
              stroke="white"
              strokeWidth="2.5"
              className="filter drop-shadow-sm hover:scale-110 transition-transform"
            />
          </svg>
        </div>

        {/* Quick Cardinal Direction Buttons */}
        <div className="flex flex-col gap-1 text-[10px]">
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
            Quick Angle
          </span>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => onChange(90, distance)}
              className={`px-1.5 py-1 rounded border text-center font-medium transition ${
                normalizedAngle === 90
                  ? "bg-blue-600 text-white border-blue-600 font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Top (90°)
            </button>
            <button
              type="button"
              onClick={() => onChange(135, distance)}
              className={`px-1.5 py-1 rounded border text-center font-medium transition ${
                normalizedAngle === 135
                  ? "bg-blue-600 text-white border-blue-600 font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Top-L (135°)
            </button>
            <button
              type="button"
              onClick={() => onChange(45, distance)}
              className={`px-1.5 py-1 rounded border text-center font-medium transition ${
                normalizedAngle === 45
                  ? "bg-blue-600 text-white border-blue-600 font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Top-R (45°)
            </button>
            <button
              type="button"
              onClick={() => onChange(270, distance)}
              className={`px-1.5 py-1 rounded border text-center font-medium transition ${
                normalizedAngle === 270
                  ? "bg-blue-600 text-white border-blue-600 font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Bottom (270°)
            </button>
          </div>
        </div>
      </div>

      {/* Light Distance / Elevation Depth Slider */}
      <div className="space-y-1 pt-1 border-t border-slate-200/60">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Light Distance
          </span>
          <span className="font-mono font-semibold text-slate-800 text-[11px]">
            {distance}px
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={48}
          value={distance}
          onChange={(e) => onChange(normalizedAngle, Number(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer"
        />
      </div>
    </div>
  );
};
