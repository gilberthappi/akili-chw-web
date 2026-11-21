import React, { useState, useEffect } from "react";
import { Canvas as FabricCanvas, type FabricObject } from "fabric";
import {
  Play,
  Square as StopIcon,
  Sparkles,
  Ban,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  RotateCw,
  Clock,
  Layers,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import {
  AnimationPreset,
  SlideTransitionType,
  ElementAnimationConfig,
  AnimationEasing,
  CURATED_ANIMATION_PRESETS,
  DEFAULT_ANIMATION_CONFIG,
} from "../animation/types";
import { AnimationEngine } from "../animation/AnimationEngine";

interface AnimationInspectorProps {
  canvas: FabricCanvas | null;
  selectedObject: FabricObject | null;
  onModify: () => void;
  slideTransition?: SlideTransitionType;
  onSlideTransitionChange?: (transition: SlideTransitionType) => void;
}

export const AnimationInspector: React.FC<AnimationInspectorProps> = ({
  canvas,
  selectedObject,
  onModify,
  slideTransition = "fade",
  onSlideTransitionChange,
}) => {
  const [isPlayingSequence, setIsPlayingSequence] = useState<boolean>(false);
  const [currentConfig, setCurrentConfig] = useState<ElementAnimationConfig>(
    DEFAULT_ANIMATION_CONFIG
  );

  // Sync state whenever selectedObject changes
  useEffect(() => {
    if (!selectedObject) return;

    const existing = (
      selectedObject as unknown as { animationConfig?: ElementAnimationConfig }
    ).animationConfig;

    if (existing) {
      setCurrentConfig({ ...existing });
    } else {
      setCurrentConfig({ ...DEFAULT_ANIMATION_CONFIG });
    }
  }, [selectedObject]);

  const updateConfig = (updates: Partial<ElementAnimationConfig>) => {
    if (!selectedObject) return;

    const nextConfig = { ...currentConfig, ...updates };
    setCurrentConfig(nextConfig);

    (selectedObject as unknown as { animationConfig: ElementAnimationConfig }).animationConfig =
      nextConfig;

    onModify();
  };

  const handlePresetSelect = (preset: AnimationPreset) => {
    updateConfig({ preset });
    if (canvas && selectedObject && preset !== "none") {
      AnimationEngine.previewElement(canvas, selectedObject, {
        ...currentConfig,
        preset,
      });
    }
  };

  const handleTestElement = () => {
    if (!canvas || !selectedObject) return;
    AnimationEngine.previewElement(canvas, selectedObject, currentConfig);
  };

  const handleTogglePlaySequence = () => {
    if (!canvas) return;

    if (isPlayingSequence) {
      AnimationEngine.stopAll(canvas);
      setIsPlayingSequence(false);
    } else {
      setIsPlayingSequence(true);
      AnimationEngine.playSlideSequence(
        canvas,
        undefined,
        () => setIsPlayingSequence(false)
      );
    }
  };

  // Render Preset Icon
  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case "Ban":
        return <Ban className="w-4 h-4" />;
      case "Eye":
        return <Eye className="w-4 h-4" />;
      case "ArrowUp":
        return <ArrowUp className="w-4 h-4" />;
      case "ArrowDown":
        return <ArrowDown className="w-4 h-4" />;
      case "ArrowRight":
        return <ArrowRight className="w-4 h-4" />;
      case "ArrowLeft":
        return <ArrowLeft className="w-4 h-4" />;
      case "Maximize2":
        return <Maximize2 className="w-4 h-4" />;
      case "Sparkles":
        return <Sparkles className="w-4 h-4" />;
      case "RotateCw":
        return <RotateCw className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  // Query all animated items on the artboard
  const allAnimatedObjects = React.useMemo(() => {
    if (!canvas) return [];
    return canvas
      .getObjects()
      .filter((obj) => {
        const c = (obj as unknown as { animationConfig?: ElementAnimationConfig })
          .animationConfig;
        return c && c.preset !== "none";
      })
      .map((obj) => ({
        obj,
        config: (obj as unknown as { animationConfig: ElementAnimationConfig })
          .animationConfig,
        name:
          (obj as unknown as { customName?: string }).customName ||
          (obj as unknown as { shapeType?: string }).shapeType ||
          obj.type ||
          "Element",
      }))
      .sort((a, b) => a.config.order - b.config.order);
  }, [canvas, selectedObject, currentConfig]);

  return (
    <div className="flex flex-col h-full bg-white select-none divide-y divide-slate-100 overflow-y-auto">
      {/* ── 1. Sequence Playback Action Bar ───────────────────────────────── */}
      <div className="p-3.5 bg-slate-50/70 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-800">Slide Timeline</span>
          <span className="text-[10px] font-mono text-slate-400">
            {allAnimatedObjects.length} animated elements
          </span>
        </div>

        <button
          type="button"
          onClick={handleTogglePlaySequence}
          disabled={allAnimatedObjects.length === 0}
          className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed ${
            isPlayingSequence
              ? "bg-rose-600 hover:bg-rose-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
          title="Preview animated presentation sequence directly on artboard"
        >
          {isPlayingSequence ? (
            <>
              <StopIcon className="w-3.5 h-3.5 fill-current" />
              <span>Stop Preview</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Slide Animation</span>
            </>
          )}
        </button>
      </div>

      {/* ── 2. Selected Element Entrance Animation ────────────────────────── */}
      {selectedObject ? (
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 tracking-tight uppercase">
              Entrance Animation
            </span>

            {currentConfig.preset !== "none" && (
              <button
                type="button"
                onClick={handleTestElement}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition"
                title="Preview animation for selected element"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Test Effect</span>
              </button>
            )}
          </div>

          {/* Preset Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {CURATED_ANIMATION_PRESETS.map((item) => {
              const isSelected = currentConfig.preset === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePresetSelect(item.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition group ${
                    isSelected
                      ? "bg-blue-50 border-blue-500 text-blue-700 shadow-2xs font-bold"
                      : "bg-white border-slate-200 hover:border-blue-400 text-slate-600 hover:text-slate-900"
                  }`}
                  title={`${item.label} — ${item.description}`}
                >
                  <div
                    className={`transition group-hover:scale-110 mb-1 ${
                      isSelected ? "text-blue-600" : "text-slate-400"
                    }`}
                  >
                    {getPresetIcon(item.iconName)}
                  </div>
                  <span className="text-[10px] leading-tight truncate max-w-full">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Timing & Sequence Parameters (Visible when preset != none) */}
          {currentConfig.preset !== "none" && (
            <div className="space-y-3.5 pt-2 border-t border-slate-100">
              {/* Duration Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-600">
                    Duration
                  </span>
                  <span className="font-mono font-semibold text-slate-800 text-xs">
                    {(currentConfig.duration / 1000).toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={2000}
                  step={100}
                  value={currentConfig.duration}
                  onChange={(e) =>
                    updateConfig({ duration: Number(e.target.value) })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Delay Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-600">
                    Delay
                  </span>
                  <span className="font-mono font-semibold text-slate-800 text-xs">
                    {(currentConfig.delay / 1000).toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3000}
                  step={100}
                  value={currentConfig.delay}
                  onChange={(e) =>
                    updateConfig({ delay: Number(e.target.value) })
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Sequence Order Stepper */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="block text-[11px] font-medium text-slate-700">
                    Reveal Order
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    Step-by-step disclosure sequence
                  </span>
                </div>

                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() =>
                      updateConfig({
                        order: Math.max(1, currentConfig.order - 1),
                      })
                    }
                    className="p-1 rounded hover:bg-white text-slate-600 hover:text-slate-900 transition"
                    title="Move earlier in presentation sequence"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="font-mono font-bold text-xs px-2 text-blue-700 min-w-[28px] text-center">
                    #{currentConfig.order}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      updateConfig({ order: currentConfig.order + 1 })
                    }
                    className="p-1 rounded hover:bg-white text-slate-600 hover:text-slate-900 transition"
                    title="Move later in presentation sequence"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Easing Selector */}
              <div className="space-y-1 pt-1">
                <span className="block text-[11px] font-medium text-slate-600">
                  Motion Easing
                </span>
                <select
                  value={currentConfig.easing || "easeOutQuad"}
                  onChange={(e) =>
                    updateConfig({ easing: e.target.value as AnimationEasing })
                  }
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-hidden focus:border-blue-500 font-medium text-slate-800"
                >
                  <option value="easeOutQuad">Smooth Deceleration (Default)</option>
                  <option value="easeOutBack">Elastic Punch & Bounce</option>
                  <option value="easeInOutCubic">Cinematic S-Curve</option>
                  <option value="linear">Linear Uniform Speed</option>
                </select>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-5 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-700">
            No Element Selected
          </span>
          <p className="text-[11px] text-slate-400 max-w-[200px]">
            Click on any card, text, or vector icon on the slide to configure its entrance motion.
          </p>
        </div>
      )}

      {/* ── 3. Slide-Level Transition ─────────────────────────────────────── */}
      <div className="p-4 space-y-2.5">
        <div>
          <span className="block text-xs font-bold text-slate-900 tracking-tight uppercase">
            Slide Transition
          </span>
          <span className="block text-[10px] text-slate-400">
            Transition effect when switching to the next slide
          </span>
        </div>

        <select
          value={slideTransition}
          onChange={(e) =>
            onSlideTransitionChange?.(e.target.value as SlideTransitionType)
          }
          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 outline-hidden focus:border-blue-500 font-semibold text-slate-800"
        >
          <option value="fade">Smooth Dissolve (Fade)</option>
          <option value="slide-left">Slide Push (Left)</option>
          <option value="slide-up">Slide Push (Up)</option>
          <option value="zoom">Dynamic Zoom In</option>
          <option value="none">Instant (No Transition)</option>
        </select>
      </div>

      {/* ── 4. Sequence Overview ─────────────────────────────────────────── */}
      {allAnimatedObjects.length > 0 && (
        <div className="p-4 space-y-2">
          <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Sequence Stagger Schedule
          </span>

          <div className="space-y-1.5">
            {allAnimatedObjects.map(({ obj, config, name }, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/50 text-xs"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                    #{config.order}
                  </span>
                  <span className="truncate font-medium text-slate-700 text-[11px]">
                    {name}
                  </span>
                </div>

                <span className="text-[10px] text-slate-400 capitalize whitespace-nowrap">
                  {config.preset.replace(/-/g, " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
