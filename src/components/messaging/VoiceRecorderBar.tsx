import React, { useEffect, useState } from "react";
import { Trash2, Pause, Play, Send } from "lucide-react";

interface VoiceRecorderBarProps {
  stream: MediaStream;
  elapsedSeconds: number;
  isPaused: boolean;
  onCancel: () => void;
  onTogglePause: () => void;
  onSend: () => void;
}

const BAR_COUNT = 24;

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const VoiceRecorderBar: React.FC<VoiceRecorderBarProps> = ({
  stream,
  elapsedSeconds,
  isPaused,
  onCancel,
  onTogglePause,
  onSend,
}) => {
  const [levels, setLevels] = useState<number[]>(() =>
    new Array(BAR_COUNT).fill(0.15)
  );

  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let rafId: number;

    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      let frameCount = 0;

      const tick = () => {
        rafId = requestAnimationFrame(tick);
        frameCount += 1;
        if (frameCount % 2 !== 0) return;

        if (isPaused) return;

        analyser?.getByteTimeDomainData(data);
        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
          const normalized = (data[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const amplitude = Math.min(1, Math.sqrt(sumSquares / data.length) * 4.5);
        const nextVal = Math.max(0.12, amplitude);

        setLevels((prev) => [...prev.slice(1), nextVal]);
      };

      rafId = requestAnimationFrame(tick);
    } catch {
      // AudioContext fallback
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      source?.disconnect();
      audioContext?.close().catch(() => {});
    };
  }, [stream, isPaused]);

  return (
    <div className="ml-auto w-full max-w-[380px] sm:max-w-[400px] flex items-center justify-between gap-2.5 bg-primary/10 border border-primary/20 rounded-full px-3.5 py-1.5 min-w-0 shadow-xs text-slate-800 transition-all">
      {/* 1. Discard / Trash Button */}
      <button
        type="button"
        onClick={onCancel}
        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 rounded-full flex-shrink-0 transition-colors"
        title="Discard recording"
      >
        <Trash2 size={18} />
      </button>

      {/* 2. Recording Pulse Dot & Timer */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className={`w-2.5 h-2.5 rounded-full bg-rose-500 ${
            isPaused ? "opacity-40" : "animate-pulse shadow-xs shadow-rose-500/50"
          }`}
        />
        <span className="font-mono text-xs font-bold text-slate-900 tabular-nums tracking-wide">
          {formatTime(elapsedSeconds)}
        </span>
      </div>

      {/* 3. Compact Dynamic Waveform Bars */}
      <div className="flex-1 min-w-0 flex items-center justify-center gap-[2.5px] h-7 px-1 overflow-hidden">
        {levels.map((level, i) => {
          const heightPx = Math.max(3, Math.round(level * 22));
          const isHigh = level > 0.3;
          return (
            <span
              key={i}
              className={`w-[2.5px] rounded-full transition-all duration-75 ${
                isPaused
                  ? "bg-primary/30"
                  : isHigh
                  ? "bg-primary"
                  : "bg-primary/70"
              }`}
              style={{ height: `${heightPx}px` }}
            />
          );
        })}
      </div>

      {/* 4. Pause / Play Button */}
      <button
        type="button"
        onClick={onTogglePause}
        className="p-1.5 text-primary hover:text-primary/80 hover:bg-primary/10 rounded-full flex-shrink-0 transition-colors"
        title={isPaused ? "Resume recording" : "Pause recording"}
      >
        {isPaused ? (
          <Play size={18} className="fill-current" />
        ) : (
          <Pause size={18} className="fill-current" />
        )}
      </button>

      {/* 5. Application Primary Brand Send Button */}
      <button
        type="button"
        onClick={onSend}
        className="w-8 h-8 bg-gradient-to-br from-primary to-[#2952a3] hover:from-primary/95 hover:to-[#2952a3]/95 text-white rounded-full flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/25 transition-all hover:scale-105 active:scale-95 font-bold"
        title="Send voice message"
      >
        <Send size={15} className="ml-0.5 fill-current" />
      </button>
    </div>
  );
};



