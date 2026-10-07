import React, { useRef, useState, useCallback, useEffect } from "react";
import { Paperclip, Send, Mic, X, FileText, Smile, Plus, FileVideo, FileAudio, File } from "lucide-react";
import toast from "react-hot-toast";
import { uploadFileByType, uploadAudio } from "@/services/uploader.api";
import { IAttachment } from "@/types";
import { VoiceRecorderBar } from "./VoiceRecorderBar";

interface StagedFile {
  file: File;
  previewUrl?: string;
}

interface MessageComposerProps {
  value: string;
  onChange: (text: string) => void;
  onSend: (attachments: IAttachment[]) => void;
  placeholder?: string;
}

const attachmentTypeFor = (mime: string): IAttachment["type"] => {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const fileExt = (name: string): string =>
  name.split(".").pop()?.toUpperCase() ?? "FILE";

// ─── File type icon helper ────────────────────────────────────────────────────
const DocIcon: React.FC<{ file: File; size?: number }> = ({ file, size = 40 }) => {
  const ext = fileExt(file.name);
  const isDoc = ["DOC", "DOCX"].includes(ext);
  const isPpt = ["PPT", "PPTX"].includes(ext);
  const isPdf = ext === "PDF";
  const isXls = ["XLS", "XLSX"].includes(ext);
  const isAudio = file.type.startsWith("audio/");
  const isVideo = file.type.startsWith("video/");

  if (isAudio) return <FileAudio size={size} className="text-amber-400" />;
  if (isVideo) return <FileVideo size={size} className="text-blue-400" />;

  const color = isPdf
    ? "text-red-400"
    : isDoc
    ? "text-blue-400"
    : isPpt
    ? "text-orange-400"
    : isXls
    ? "text-emerald-400"
    : "text-gray-300";

  return <FileText size={size} className={color} />;
};

// ─── Emoji categories ─────────────────────────────────────────────────────────
const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "😊 Smileys",
    emojis: [
      "😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","😘","🥰",
      "😗","😙","😚","🙂","🤗","🤩","🤔","🤨","😐","😑","😶","🙄","😏","😣","😥",
      "😮","🤐","😯","😪","😫","🥱","😴","😌","😛","😜","😝","🤤","😒","😓","😔",
      "😕","🙃","🤑","😲","🙁","😖","😞","😟","😤","😢","😭","😦","😧","😨","😩",
      "🤯","😬","😰","😱","🥵","🥶","😳","🤪","😵","🥴","😷","🤒","🤕","🤢","😷",
    ],
  },
  {
    label: "👋 Gestures",
    emojis: [
      "👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌","🤞","🤟","🤘","🤙","👈","👉",
      "👆","👇","☝","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏",
      "✍","💅","🤳","💪","🦾","🦵","🦶","👂","🦻","👃","🧠","👁","👅","👄","🫦",
    ],
  },
  {
    label: "❤️ Hearts",
    emojis: [
      "❤","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣","💕","💞","💓","💗",
      "💖","💘","💝","💟","❤‍🔥","❤‍🩹","🫀","💌","💋","😻","💑","💏","👨‍❤‍👨","👩‍❤‍👩",
    ],
  },
  {
    label: "🐶 Animals",
    emojis: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵",
      "🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄",
    ],
  },
  {
    label: "🍕 Food",
    emojis: [
      "🍎","🍊","🍋","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆",
      "🥑","🥦","🥬","🥒","🌶","🧄","🧅","🥔","🌽","🍠","🥐","🥯","🍞","🥖","🥨",
      "🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🌮",
    ],
  },
  {
    label: "🎉 Activity",
    emojis: [
      "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🥍","🏑",
      "🎿","⛷","🏂","🪂","🏋","🤼","🤸","⛹","🤺","🏇","🧘","🏄","🏊","🤽","🚣",
      "🎪","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🎸","🎻","🎲",
    ],
  },
  {
    label: "🌍 Travel",
    emojis: [
      "🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍",
      "🛵","🚲","🛴","🛹","✈","🚀","🛸","🚁","⛵","🚢","🗺","🏔","⛰","🌋","🗻",
      "🏕","🏖","🏜","🏝","🏞","🏟","🏛","🗼","🗽","🗿","🏯","🏰","🛕","⛩","🕌",
    ],
  },
];

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
const EmojiPicker: React.FC<{
  onSelect: (emoji: string) => void;
  onClose: () => void;
  dark?: boolean;
}> = ({ onSelect, onClose, dark }) => {
  const [activeTab, setActiveTab] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const bg = dark ? "bg-[#1f2c34] border-[#2a3942]" : "bg-white border-gray-100";
  const tabBg = dark ? "bg-[#111b21]" : "bg-gray-50";
  const activeBg = dark ? "bg-[#2a3942]" : "bg-white";
  const textColor = dark ? "text-white/40" : "text-gray-400";

  return (
    <div
      ref={ref}
      className={`absolute bottom-full right-0 mb-2 w-80 ${bg} rounded-2xl shadow-2xl border overflow-hidden z-50 animate-slide-in-down`}
    >
      <div className={`flex gap-0.5 ${tabBg} px-2 py-1.5 border-b ${dark ? "border-[#2a3942]" : "border-gray-100"} overflow-x-auto hide-scrollbar`}>
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`flex-shrink-0 text-base px-2 py-1 rounded-lg transition-all ${
              activeTab === i ? `${activeBg} shadow-sm scale-110` : "opacity-60 hover:opacity-100"
            }`}
          >
            {cat.emojis[0]}
          </button>
        ))}
      </div>
      <div className="px-3 pt-2 pb-1">
        <p className={`text-[11px] font-semibold uppercase tracking-wider ${textColor}`}>
          {EMOJI_CATEGORIES[activeTab].label}
        </p>
      </div>
      <div className="px-2 pb-2 h-52 overflow-y-auto hide-scrollbar">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_CATEGORIES[activeTab].emojis.map((emoji, i) => (
            <button
              key={i}
              onClick={() => onSelect(emoji)}
              className="text-xl p-1.5 rounded-lg hover:bg-primary/10 transition-colors hover:scale-125 transform duration-100"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── WhatsApp-style Attachment Preview Overlay ───────────────────────────────
const AttachmentPreviewOverlay: React.FC<{
  staged: StagedFile[];
  activeIdx: number;
  caption: string;
  isSending: boolean;
  onSetActive: (i: number) => void;
  onRemove: (i: number) => void;
  onAddMore: () => void;
  onCaptionChange: (text: string) => void;
  onSend: () => void;
  onClose: () => void;
}> = ({
  staged,
  activeIdx,
  caption,
  isSending,
  onSetActive,
  onRemove,
  onAddMore,
  onCaptionChange,
  onSend,
  onClose,
}) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const captionRef = useRef<HTMLInputElement>(null);
  const active = staged[Math.min(activeIdx, staged.length - 1)];
  if (!active) return null;

  const isImage = active.file.type.startsWith("image/");
  const isVideo = active.file.type.startsWith("video/");
  const isPdf = active.file.type === "application/pdf" || active.file.name.toLowerCase().endsWith(".pdf");

  return (
    /* absolute inset-0 → scoped to the relative wrapper in Messaging.tsx,
       covering only the messages + composer pane (not the sidebar or header) */
    <div className="absolute inset-0 z-50 flex flex-col bg-gray-50">

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 bg-white border-b border-gray-100 shadow-sm">
        <button
          type="button"
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
        >
          <X size={20} />
        </button>
        <span className="flex-1 text-sm text-gray-800 font-semibold truncate">
          {active.file.name}
        </span>
        <span className="text-xs text-gray-400 flex-shrink-0">
          {formatBytes(active.file.size)} · {fileExt(active.file.name)}
        </span>
      </div>

      {/* ── Preview area ── */}
      <div className="flex-1 flex items-center justify-center overflow-hidden px-8 py-6">
        {isImage && active.previewUrl ? (
          <img
            src={active.previewUrl}
            alt={active.file.name}
            className="max-h-full max-w-full object-contain rounded-2xl shadow-lg border border-gray-100"
          />
        ) : isVideo && active.previewUrl ? (
          <video
            src={active.previewUrl}
            controls
            className="max-h-full max-w-full rounded-2xl shadow-lg"
          />
        ) : isPdf && active.previewUrl ? (
          <iframe
            src={active.previewUrl}
            title={active.file.name}
            className="w-full max-w-2xl h-[46vh] rounded-2xl shadow-lg border border-slate-200 bg-white overflow-hidden"
          />
        ) : (
          /* Document / audio / other */
          <div className="flex flex-col items-center justify-center gap-5">
            <div className="w-52 h-52 rounded-3xl bg-white border border-gray-100 shadow-md flex flex-col items-center justify-center gap-4">
              <DocIcon file={active.file} size={52} />
              <div className="text-center space-y-1 px-4">
                <p className="text-gray-500 text-sm font-medium">No preview available</p>
                <p className="text-gray-400 text-xs">
                  {formatBytes(active.file.size)} · {fileExt(active.file.name)}
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-xs text-center max-w-xs truncate px-4">
              {active.file.name}
            </p>
          </div>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <div className="flex-shrink-0 px-4 pb-4 pt-3 space-y-3 bg-white border-t border-gray-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.06)]">
        {/* Thumbnail strip */}
        {staged.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
            {staged.map((s, i) => (
              <div
                key={i}
                className="relative flex-shrink-0 cursor-pointer"
                onClick={() => onSetActive(i)}
              >
                <div
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                    activeIdx === i
                      ? "border-primary scale-110 shadow-md"
                      : "border-gray-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  {s.previewUrl ? (
                    s.file.type.startsWith("video/") ? (
                      <video src={s.previewUrl} muted className="w-full h-full object-cover" />
                    ) : (
                      <img src={s.previewUrl} className="w-full h-full object-cover" alt="" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <DocIcon file={s.file} size={22} />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow transition-colors"
                >
                  <X size={8} />
                </button>
              </div>
            ))}
            {/* Add more */}
            <button
              type="button"
              onClick={onAddMore}
              className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-colors"
              title="Add more files"
            >
              <Plus size={22} className="text-gray-400" />
            </button>
          </div>
        )}

        {/* Caption input + Send */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-sm transition-all">
            {/* Emoji */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowEmoji((v) => !v)}
                className={`p-0.5 transition-colors ${showEmoji ? "text-amber-400" : "text-gray-300 hover:text-amber-400"}`}
              >
                <Smile size={18} />
              </button>
              {showEmoji && (
                <EmojiPicker
                  onSelect={(emoji) => {
                    onCaptionChange(caption + emoji);
                    setShowEmoji(false);
                    setTimeout(() => captionRef.current?.focus(), 50);
                  }}
                  onClose={() => setShowEmoji(false)}
                />
              )}
            </div>

            <input
              ref={captionRef}
              type="text"
              value={caption}
              onChange={(e) => onCaptionChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
                if (e.key === "Escape") onClose();
              }}
              placeholder="Add a caption..."
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder:text-gray-400"
            />
          </div>

          {/* Send button — app primary color */}
          <button
            type="button"
            onClick={onSend}
            disabled={isSending}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0 bg-gradient-to-br from-primary to-[#2952a3]"
            title="Send"
          >
            {isSending ? (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={20} className="text-white ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


// ─── Main Composer ────────────────────────────────────────────────────────────
export const MessageComposer: React.FC<MessageComposerProps> = ({
  value,
  onChange,
  onSend,
  placeholder = "Write your message...",
}) => {
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const discardRef = useRef(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Caption for the preview overlay is sourced from `value` (the controlled input)
  // so the parent's state stays in sync.

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: StagedFile[] = Array.from(files).map((file) => ({
      file,
      previewUrl:
        file.type.startsWith("image/") || file.type.startsWith("video/")
          ? URL.createObjectURL(file)
          : undefined,
    }));
    setStaged((prev) => {
      const merged = [...prev, ...next];
      setActiveIdx(prev.length); // focus the first new file
      return merged;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeStaged = (index: number) => {
    setStaged((prev) => {
      const copy = [...prev];
      if (copy[index]?.previewUrl) URL.revokeObjectURL(copy[index].previewUrl!);
      copy.splice(index, 1);
      setActiveIdx((ai) => Math.min(ai, Math.max(0, copy.length - 1)));
      return copy;
    });
  };

  const uploadAndBuildAttachment = async (file: File): Promise<IAttachment> => {
    const res = file.type.startsWith("audio/")
      ? await uploadAudio(file, file.name)
      : await uploadFileByType(file);
    if (!res.data) throw new Error("Upload failed");
    return { url: res.data.url, type: attachmentTypeFor(file.type), name: file.name };
  };

  const clearTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        clearTimer();
        setIsRecording(false);
        setIsPaused(false);
        if (discardRef.current) {
          setElapsedSeconds(0);
          recordedChunksRef.current = [];
          return;
        }
        const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        const file = new (File as any)([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" }) as File;
        setElapsedSeconds(0);
        try {
          const attachment = await uploadAndBuildAttachment(file);
          onSend([attachment]);
        } catch {
          toast.error("Failed to send voice message");
        }
      };
      mediaRecorderRef.current = recorder;
      discardRef.current = false;
      recorder.start();
      setIsRecording(true);
      setIsPaused(false);
      setElapsedSeconds(0);
      clearTimer();
      timerIntervalRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const handleCancelRecording = () => {
    discardRef.current = true;
    mediaRecorderRef.current?.stop();
  };

  const handleTogglePause = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === "recording") {
      recorder.pause();
      setIsPaused(true);
      clearTimer();
    } else if (recorder.state === "paused") {
      recorder.resume();
      setIsPaused(false);
      timerIntervalRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
  };

  const handleSendRecording = () => {
    discardRef.current = false;
    mediaRecorderRef.current?.stop();
  };

  // Called both from normal send and from overlay send
  const handleSend = async () => {
    if (!value.trim() && staged.length === 0) return;
    if (isUploading) return;

    let attachments: IAttachment[] = [];
    if (staged.length > 0) {
      setIsUploading(true);
      try {
        attachments = await Promise.all(staged.map((s) => uploadAndBuildAttachment(s.file)));
        staged.forEach((s) => { if (s.previewUrl) URL.revokeObjectURL(s.previewUrl); });
      } catch {
        toast.error("Failed to upload attachment");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    setStaged([]);
    setActiveIdx(0);
    onSend(attachments);
  };

  const handleEmojiSelect = (emoji: string) => {
    onChange(value + emoji);
    setShowEmojiPicker(false);
    setTimeout(() => textInputRef.current?.focus(), 50);
  };

  const canSend = value.trim().length > 0 && !isUploading;

  return (
    <>
      {/* ── WhatsApp-style Attachment Preview Overlay ── */}
      {staged.length > 0 && (
        <AttachmentPreviewOverlay
          staged={staged}
          activeIdx={activeIdx}
          caption={value}
          isSending={isUploading}
          onSetActive={setActiveIdx}
          onRemove={removeStaged}
          onAddMore={handleAttachClick}
          onCaptionChange={onChange}
          onSend={handleSend}
          onClose={() => {
            staged.forEach((s) => { if (s.previewUrl) URL.revokeObjectURL(s.previewUrl); });
            setStaged([]);
            setActiveIdx(0);
            onChange("");
          }}
        />
      )}

      {/* ── Normal composer bar ── */}
      <div className="bg-white border-t border-gray-100 flex-shrink-0 px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.xls,.xlsx,.zip,.rar"
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          {isRecording && streamRef.current ? (
            <VoiceRecorderBar
              stream={streamRef.current}
              elapsedSeconds={elapsedSeconds}
              isPaused={isPaused}
              onCancel={handleCancelRecording}
              onTogglePause={handleTogglePause}
              onSend={handleSendRecording}
            />
          ) : (
            <>
              {/* Attach file button */}
              <button
                type="button"
                onClick={handleAttachClick}
                className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200 flex-shrink-0"
                title="Attach file"
              >
                <Paperclip size={20} />
              </button>

              {/* Text input pill */}
              <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 min-w-0 focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-sm transition-all duration-200">
                <input
                  ref={textInputRef}
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={placeholder}
                  className="flex-1 min-w-0 bg-transparent border-none focus:outline-none text-sm text-gray-800 placeholder:text-gray-400"
                />

                {/* Emoji button */}
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker((v) => !v)}
                    className={`p-0.5 transition-colors ${
                      showEmojiPicker ? "text-amber-400" : "text-gray-300 hover:text-amber-400"
                    }`}
                    title="Emoji & Stickers"
                  >
                    <Smile size={18} />
                  </button>
                  {showEmojiPicker && (
                    <EmojiPicker
                      onSelect={handleEmojiSelect}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  )}
                </div>
              </div>

              {/* Mic or Send */}
              {canSend ? (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isUploading}
                  className="w-11 h-11 bg-gradient-to-br from-primary to-[#2952a3] text-white rounded-2xl hover:from-primary/90 hover:to-[#2952a3]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex-shrink-0"
                  title="Send"
                >
                  <Send size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-11 h-11 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0"
                  title="Record voice message"
                >
                  <Mic size={20} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};
