import React, { useRef, useState } from "react";
import { Paperclip, Send, Mic, Square, X, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { uploadFileByType, uploadAudio } from "@/services/uploader.api";
import { IAttachment } from "@/types";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next: StagedFile[] = Array.from(files).map((file) => ({
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      status: "pending",
    }));
    setStaged((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeStaged = (index: number) => {
    setStaged((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-note-${Date.now()}.webm`, { type: "audio/webm" });
        setStaged((prev) => [...prev, { file, status: "pending" }]);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSend = async () => {
    if (!value.trim() && staged.length === 0) return;
    if (isUploading) return;

    let attachments: IAttachment[] = [];
    if (staged.length > 0) {
      setIsUploading(true);
      try {
        const uploaded = await Promise.all(
          staged.map(async (s) => {
            const res = s.file.type.startsWith("audio/")
              ? await uploadAudio(s.file, s.file.name)
              : await uploadFileByType(s.file);
            if (!res.data) throw new Error("Upload failed");
            return { url: res.data.url, type: attachmentTypeFor(s.file.type), name: s.file.name };
          })
        );
        attachments = uploaded;
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
      {staged.length > 0 && (
        <div className="flex gap-2 flex-wrap px-4 pt-3">
          {staged.map((s, i) => (
            <div key={i} className="relative">
              {s.previewUrl ? (
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
      <div className="p-4 flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full flex-shrink-0"
          title="Attach file"
        >
          <Paperclip size={20} />
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
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD] min-w-0"
        />
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-2 rounded-full flex-shrink-0 ${
            isRecording ? "text-red-600 bg-red-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
          title={isRecording ? "Stop recording" : "Record voice message"}
        >
          {isRecording ? <Square size={18} /> : <Mic size={20} />}
        </button>
        <button
          onClick={handleSend}
          disabled={isUploading || (!value.trim() && staged.length === 0)}
          className="p-2.5 bg-[#3363AD] text-white rounded-full hover:bg-[#3363ADCF] disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title="Send"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
