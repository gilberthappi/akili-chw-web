import React, { useRef, useState, useCallback, useEffect } from "react";
import { Paperclip, Send, Mic, X, FileText, Smile } from "lucide-react";
import toast from "react-hot-toast";
import { uploadFileByType, uploadAudio } from "@/services/uploader.api";
import { IAttachment } from "@/types";
import { VoiceRecorderBar } from "./VoiceRecorderBar";

interface StagedFile {
  file: File;
  previewUrl?: string;
  status: "pending" | "uploading" | "done" | "error";
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

// ─── Emoji categories with a curated selection ───────────────────────────────
const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "😊 Smileys",
    emojis: [
      "😀","😁","😂","🤣","😃","😄","😅","😆","😉","😊","😋","😎","😍","😘","🥰",
      "😗","😙","😚","🙂","🤗","🤩","🤔","🤨","😐","😑","😶","🙄","😏","😣","😥",
      "😮","🤐","😯","😪","😫","🥱","😴","😌","😛","😜","😝","🤤","😒","😓","😔",
      "😕","🙃","🤑","😲","☹️","🙁","😖","😞","😟","😤","😢","😭","😦","😧","😨",
      "😩","🤯","😬","😰","😱","🥵","🥶","😳","🤪","😵","🥴","😷","🤒","🤕","🤢",
    ],
  },
  {
    label: "👋 Gestures",
    emojis: [
      "👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌","🤞","🤟","🤘","🤙","👈","👉",
      "👆","🖕","👇","☝","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝",
      "🙏","✍","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🫀","🫁","🧠",
    ],
  },
  {
    label: "❤️ Hearts",
    emojis: [
      "❤","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣","💕","💞","💓","💗",
      "💖","💘","💝","💟","☮","✝","☪","🕉","✡","🔯","🪯","☯","☦","🛐","⛎",
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
      "🥑","🥦","🥬","🥒","🌶","🫑","🧄","🧅","🥔","🌽","🍠","🥐","🥯","🍞","🥖",
      "🥨","🧀","🥚","🍳","🧈","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕",
    ],
  },
  {
    label: "🎉 Activity",
    emojis: [
      "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🥍","🏑",
      "🎿","⛷","🏂","🪂","🏋","🤼","🤸","⛹","🤺","🏇","🧘","🏄","🏊","🤽","🚣",
      "🎪","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🪘","🎷","🎺","🎸","🎻","🪕",
      "🎲","♟","🎯","🎳","🎰","🎮","🕹","🎁","🎀","🎊","🎉","🎈","🎏","🎐","🎑",
    ],
  },
  {
    label: "🌍 Travel",
    emojis: [
      "🚗","🚕","🚙","🚌","🚎","🏎","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍",
      "🛵","🚲","🛴","🛹","🛼","🚏","🛣","🛤","⛽","🚨","🚥","🚦","🛑","🚧","🗺",
      "🏔","⛰","🌋","🗻","🏕","🏖","🏜","🏝","🏞","🏟","🏛","🏗","🧱","🪨","🪵",
    ],
  },
];

// ─── Emoji Picker panel ───────────────────────────────────────────────────────
const EmojiPicker: React.FC<{
  onSelect: (emoji: string) => void;
  onClose: () => void;
}> = ({ onSelect, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-slide-in-down"
    >
      {/* Category tabs */}
      <div className="flex gap-0.5 bg-gray-50 px-2 py-1.5 border-b border-gray-100 overflow-x-auto hide-scrollbar">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`flex-shrink-0 text-base px-2 py-1 rounded-lg transition-all ${
              activeTab === i ? "bg-white shadow-sm scale-110" : "hover:bg-gray-100 opacity-60 hover:opacity-100"
            }`}
            title={cat.label}
          >
            {cat.emojis[0]}
          </button>
        ))}
      </div>

      {/* Label */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          {EMOJI_CATEGORIES[activeTab].label}
        </p>
      </div>

      {/* Grid */}
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

// ─── Main Composer ────────────────────────────────────────────────────────────
export const MessageComposer: React.FC<MessageComposerProps> = ({
  value,
  onChange,
  onSend,
  placeholder = "Write your message...",
}) => {
  const [staged, setStaged] = useState<StagedFile[]>([]);
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

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: StagedFile[] = Array.from(files).map((file) => ({
      file,
      previewUrl:
        file.type.startsWith("image/") || file.type.startsWith("video/")
          ? URL.createObjectURL(file)
          : undefined,
      status: "pending",
    }));
    setStaged((prev) => [...prev, ...next]);
    // Reset input so same file can be re-selected
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
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
        setElapsedSeconds(0);
        try {
          const attachment = await uploadAndBuildAttachment(file);
          onSend([attachment]);
        } catch (error) {
          console.error("Voice note upload failed:", error);
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

  const handleSend = async () => {
    if (!value.trim() && staged.length === 0) return;
    if (isUploading) return;

    let attachments: IAttachment[] = [];
    if (staged.length > 0) {
      setIsUploading(true);
      try {
        attachments = await Promise.all(staged.map((s) => uploadAndBuildAttachment(s.file)));
        // Cleanup object URLs
        staged.forEach((s) => { if (s.previewUrl) URL.revokeObjectURL(s.previewUrl); });
      } catch (error) {
        console.error("Attachment upload failed:", error);
        toast.error("Failed to upload attachment");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    setStaged([]);
    onSend(attachments);
  };

  const handleEmojiSelect = (emoji: string) => {
    onChange(value + emoji);
    setShowEmojiPicker(false);
    // Return focus to text input
    setTimeout(() => textInputRef.current?.focus(), 50);
  };

  const canSend = (value.trim().length > 0 || staged.length > 0) && !isUploading;

  return (
    <div className="bg-white border-t border-gray-100 flex-shrink-0 px-4 py-3">
      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Hidden file input — always in DOM so ref is always valid */}
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
              className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200 flex-shrink-0 self-end mb-0.5"
              title="Attach file"
            >
              <Paperclip size={20} />
            </button>

            {/* Input pill — grows to contain text + staged chips + emoji */}
            <div className="flex-1 flex flex-col gap-1.5 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 min-w-0 focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-sm transition-all duration-200">

              {/* Staged file chips (WhatsApp-style inline preview) */}
              {staged.length > 0 && (
                <div className="flex flex-wrap gap-2 pb-1 border-b border-gray-100">
                  {staged.map((s, i) => (
                    <div
                      key={i}
                      className="relative flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2 py-1 shadow-sm group/chip"
                    >
                      {/* Thumbnail or icon */}
                      {s.previewUrl && s.file.type.startsWith("video/") ? (
                        <video
                          src={s.previewUrl}
                          muted
                          className="w-8 h-8 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : s.previewUrl ? (
                        <img
                          src={s.previewUrl}
                          alt={s.file.name}
                          className="w-8 h-8 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                          <FileText size={16} className="text-primary/70" />
                        </div>
                      )}
                      {/* File name */}
                      <span className="text-xs text-gray-600 truncate max-w-[80px]">
                        {s.file.name.length > 12
                          ? s.file.name.slice(0, 10) + "…"
                          : s.file.name}
                      </span>
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => removeStaged(i)}
                        className="w-4 h-4 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-300 hover:bg-red-400 text-white transition-colors ml-0.5"
                      >
                        <X size={9} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Text + emoji row */}
              <div className="flex items-center gap-2">
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
                  placeholder={staged.length > 0 ? "Add a caption..." : placeholder}
                  className="flex-1 min-w-0 bg-transparent border-none focus:outline-none text-sm text-gray-800 placeholder:text-gray-400"
                />

                {/* Emoji / Sticker button */}
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
            </div>

            {/* Mic or Send button */}
            {canSend ? (
              <button
                type="button"
                onClick={handleSend}
                disabled={isUploading}
                className="w-11 h-11 bg-gradient-to-br from-primary to-[#2952a3] text-white rounded-2xl hover:from-primary/90 hover:to-[#2952a3]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 flex-shrink-0 self-end"
                title="Send"
              >
                {isUploading ? (
                  <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="w-11 h-11 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 self-end"
                title="Record voice message"
              >
                <Mic size={20} />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

