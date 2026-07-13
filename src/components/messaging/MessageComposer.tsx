import React, { useRef, useState } from "react";
import { Plus, Send, Mic, X, FileText } from "lucide-react";
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

export const MessageComposer: React.FC<MessageComposerProps> = ({
  value,
  onChange,
  onSend,
  placeholder = "Type a message...",
}) => {
  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeStaged = (index: number) => {
    setStaged((prev) => prev.filter((_, i) => i !== index));
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

  return (
    <div className="border-t border-gray-200 flex-shrink-0">
      {!isRecording && staged.length > 0 && (
        <div className="flex gap-2 flex-wrap px-4 pt-3">
          {staged.map((s, i) => (
            <div key={i} className="relative">
              {s.previewUrl && s.file.type.startsWith("video/") ? (
                <video src={s.previewUrl} muted className="w-16 h-16 object-cover rounded-lg border" />
              ) : s.previewUrl ? (
                <img src={s.previewUrl} alt={s.file.name} className="w-16 h-16 object-cover rounded-lg border" />
              ) : (
                <div className="w-16 h-16 flex flex-col items-center justify-center gap-1 rounded-lg border bg-gray-50 text-gray-500 px-1">
                  <FileText size={18} />
                  <span className="text-[9px] truncate max-w-full">{s.file.name}</span>
                </div>
              )}
              <button
                onClick={() => removeStaged(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-700 text-white rounded-full flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="p-4 flex items-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
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
          <div className="flex-1 flex items-center gap-1 bg-gray-100 border border-gray-300 rounded-full pl-2 pr-1 py-1 min-w-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-gray-500 hover:text-gray-700 flex-shrink-0"
              title="Attach file"
            >
              <Plus size={20} />
            </button>
            <input
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
              className="flex-1 min-w-0 bg-transparent border-none focus:outline-none text-sm"
            />
            <button
              onClick={startRecording}
              className="p-1.5 rounded-full flex-shrink-0 text-gray-500 hover:text-gray-700"
              title="Record voice message"
            >
              <Mic size={18} />
            </button>
            <button
              onClick={handleSend}
              disabled={isUploading || (!value.trim() && staged.length === 0)}
              className="p-2 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="Send"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
