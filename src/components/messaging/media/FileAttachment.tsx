import React from "react";
import { FileText, FileSpreadsheet, Presentation, File, Paperclip } from "lucide-react";
import { IAttachment } from "@/types";

interface FileAttachmentProps {
  attachment: IAttachment;
  variant: "bubble" | "card";
}

const fileMeta = (extension: string): { icon: React.ElementType; color: string; label: string } => {
  switch (extension) {
    case "pdf":
      return { icon: FileText, color: "#ef4444", label: "PDF" };
    case "doc":
    case "docx":
      return { icon: FileText, color: "#2563eb", label: extension.toUpperCase() };
    case "xls":
    case "xlsx":
      return { icon: FileSpreadsheet, color: "#16a34a", label: extension.toUpperCase() };
    case "ppt":
    case "pptx":
      return { icon: Presentation, color: "#ea580c", label: extension.toUpperCase() };
    case "txt":
    case "csv":
      return { icon: File, color: "#6b7280", label: extension.toUpperCase() };
    default:
      return { icon: Paperclip, color: "#6b7280", label: extension ? extension.toUpperCase() : "FILE" };
  }
};

const filenameFromUrl = (url: string): string => {
  try {
    const last = decodeURIComponent(url.split("/").pop() || "file");
    return last.split("?")[0];
  } catch {
    return "file";
  }
};

export const FileAttachment: React.FC<FileAttachmentProps> = ({ attachment, variant }) => {
  const filename = attachment.name || filenameFromUrl(attachment.url);
  const extension = filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";
  const { icon: Icon, color, label } = fileMeta(extension);

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 rounded-2xl bg-gray-50 hover:bg-gray-100 p-2.5 transition-colors ${
        variant === "card" ? "w-full" : "min-w-[180px] max-w-[240px]"
      }`}
    >
      <span
        className="w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${color}1A` }}
      >
        <Icon size={18} style={{ color }} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{filename}</p>
        <p className="text-xs text-gray-500">
          {label} · Tap to open
        </p>
      </div>
    </a>
  );
};
