import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, CheckCheck } from "lucide-react";
import { IAttachment } from "@/types";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";

interface AudioAttachmentProps {
  attachment: IAttachment;
  messageId: string;
  variant: "bubble" | "card";
  isOwn?: boolean;
  senderPhoto?: string;
  senderName?: string;
  formattedTimestamp?: string;
}

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const AudioAttachment: React.FC<AudioAttachmentProps> = ({
  attachment,
  messageId,
  variant,
  isOwn,
  formattedTimestamp,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const { activeAudioId, setActiveAudio } = useAudioPlayer();

  useEffect(() => {
    if (!containerRef.current) return;
    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: isOwn ? "rgba(255,255,255,0.4)" : "#94A3B8",
      progressColor: isOwn ? "#38BDF8" : "#0284C7",
      cursorWidth: 0,
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 24,
      url: attachment.url,
    });
    wavesurferRef.current = wavesurfer;

    wavesurfer.on("ready", () => {
      setIsReady(true);
      setDuration(wavesurfer.getDuration());
    });
    wavesurfer.on("audioprocess", () => setCurrentTime(wavesurfer.getCurrentTime()));
    wavesurfer.on("play", () => setIsPlaying(true));
    wavesurfer.on("pause", () => setIsPlaying(false));
    wavesurfer.on("finish", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      wavesurfer.destroy();
      wavesurferRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attachment.url]);

  useEffect(() => {
    if (activeAudioId !== messageId && wavesurferRef.current?.isPlaying()) {
      wavesurferRef.current.pause();
    }
  }, [activeAudioId, messageId]);

  const togglePlay = () => {
    if (!wavesurferRef.current) return;
    if (!wavesurferRef.current.isPlaying()) {
      setActiveAudio(messageId);
    }
    wavesurferRef.current.playPause();
  };

  return (
    <div
      className={`flex items-center gap-2.5 px-1 py-0.5 min-w-[210px] max-w-[270px] ${
        variant === "card" ? "w-full" : ""
      }`}
    >
      {/* 1. Play / Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={!isReady}
        className={`p-1 rounded-full transition-transform active:scale-95 flex-shrink-0 disabled:opacity-50 ${
          isOwn ? "hover:bg-white/10 text-white" : "hover:bg-slate-100 text-slate-700"
        }`}
        title={isPlaying ? "Pause voice note" : "Play voice note"}
      >
        {isPlaying ? (
          <Pause size={18} className="fill-current" />
        ) : (
          <Play size={18} className="fill-current ml-0.5" />
        )}
      </button>

      {/* 2. Waveform Canvas & Inline Time Info Row */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
        <div ref={containerRef} className="w-full cursor-pointer" />

        <div
          className={`flex items-center justify-between text-[10px] font-medium tracking-wide ${
            isOwn ? "text-white/90" : "text-slate-500"
          }`}
        >
          <span>{formatTime(isPlaying || currentTime > 0 ? currentTime : duration)}</span>

          {formattedTimestamp && (
            <div className={`flex items-center gap-1 ${isOwn ? "text-white/80" : "text-slate-400"}`}>
              <span>{formattedTimestamp}</span>
              {isOwn && <CheckCheck className="h-3 w-3 text-white/80" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

