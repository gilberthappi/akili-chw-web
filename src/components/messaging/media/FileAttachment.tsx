import React, { useState } from "react";
import { FileText, FileSpreadsheet, Presentation, File, Paperclip, ExternalLink, Download } from "lucide-react";
import toast from "react-hot-toast";
import { IAttachment } from "@/types";
import { getProxyUrl } from "@/services/uploader.api";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface FileAttachmentProps {
  attachment: IAttachment;
  variant: "bubble" | "card";
  isOwn?: boolean;
}

const fileBadgeInfo = (extension: string): { bg: string; text: string; label: string; icon: React.ElementType } => {
  switch (extension) {
    case "pdf":
      return { bg: "bg-rose-500", text: "text-white", label: "PDF", icon: FileText };
    case "doc":
    case "docx":
      return { bg: "bg-blue-600", text: "text-white", label: "DOC", icon: FileText };
    case "xls":
    case "xlsx":
      return { bg: "bg-emerald-600", text: "text-white", label: "XLS", icon: FileSpreadsheet };
    case "ppt":
    case "pptx":
      return { bg: "bg-amber-600", text: "text-white", label: "PPT", icon: Presentation };
    case "txt":
    case "csv":
      return { bg: "bg-slate-600", text: "text-white", label: extension.toUpperCase(), icon: File };
    default:
      return { bg: "bg-indigo-600", text: "text-white", label: extension ? extension.toUpperCase().slice(0, 4) : "FILE", icon: Paperclip };
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

export const FileAttachment: React.FC<FileAttachmentProps> = ({ attachment, variant, isOwn }) => {
  const filename = attachment.name || filenameFromUrl(attachment.url);
  const extension = filename.includes(".") ? filename.split(".").pop()!.toLowerCase() : "";
  const { bg: badgeBg, label: badgeLabel, icon: Icon } = fileBadgeInfo(extension);

  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const handleOpenView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(attachment.url, "_blank", "noopener,noreferrer");
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    setProgress(0);
    try {
      let response = await fetch(attachment.url).catch(() => null);
      if (!response || !response.ok) {
        const token = localStorage.getItem("accessToken") || "";
        response = await fetch(getProxyUrl(attachment.url), {
          headers: token ? { Authorization: token } : undefined,
        });
      }
      if (!response?.ok) throw new Error("File couldn't be downloaded.");
      if (!response.body) throw new Error("Browser doesn't support streaming download.");

      const total = Number(response.headers.get("Content-Length")) || 0;
      const reader = response.body.getReader();
      const chunks: BlobPart[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        setProgress(total ? Math.round((received / total) * 100) : null);
      }

      setProgress(100);
      await wait(300);

      const blob = new Blob(chunks);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      const reason = error instanceof Error ? error.message : "Download failed.";
      toast.error(`Couldn't download "${filename}" — ${reason}`);
    } finally {
      setDownloading(false);
      setProgress(null);
    }
  };

  return (
    <div
      className={`rounded-xl overflow-hidden border transition-all ${
        variant === "card" ? "w-full" : "w-full min-w-[240px] max-w-[300px]"
      } ${
        isOwn
          ? "bg-primary/20 border-white/20 text-white"
          : "bg-slate-50 border-slate-200/90 text-slate-900"
      }`}
    >
      {/* 1. Top Document Header Page Preview */}
      <div
        className="h-28 bg-white p-3.5 flex flex-col justify-between relative overflow-hidden border-b border-slate-100 cursor-pointer group"
        onClick={handleOpenView}
      >
        <div className="space-y-2 opacity-80">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <div className="h-2.5 w-2/3 bg-slate-800/90 rounded" />
          </div>
          <div className="h-2 w-full bg-slate-200 rounded" />
          <div className="h-2 w-5/6 bg-slate-200 rounded" />
          <div className="h-2 w-3/4 bg-slate-200 rounded" />
          <div className="h-2 w-4/5 bg-slate-200 rounded" />
        </div>

        <div className="absolute right-3 bottom-2 text-slate-200 group-hover:text-primary/30 transition-colors">
          <Icon size={42} strokeWidth={1.2} />
        </div>
      </div>

      {/* 2. File Info Row */}
      <div className="p-3 flex items-center gap-3">
        <div className={`w-10 h-10 ${badgeBg} rounded-lg flex flex-col items-center justify-center flex-shrink-0 shadow-2xs text-white`}>
          <Icon size={16} className="mb-0.5" />
          <span className="text-[8px] font-black uppercase tracking-wider leading-none">{badgeLabel}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-xs font-bold truncate leading-snug ${isOwn ? "text-white" : "text-slate-900"}`} title={filename}>
            {filename}
          </p>
          <p className={`text-[10px] mt-0.5 truncate font-medium ${isOwn ? "text-white/80" : "text-slate-500"}`}>
            {badgeLabel} Document
          </p>
        </div>
      </div>

      {/* 3. Bottom Action Footer */}
      <div
        className={`flex items-center justify-between px-3.5 py-2 text-xs font-semibold border-t ${
          isOwn
            ? "border-white/20 bg-black/10 text-white"
            : "border-slate-200/80 bg-slate-100/70 text-slate-700"
        }`}
      >
        <button
          type="button"
          onClick={handleOpenView}
          className={`hover:underline flex items-center gap-1.5 transition-colors ${
            isOwn ? "text-white hover:text-white/90" : "text-primary hover:text-primary/80"
          }`}
        >
          <ExternalLink size={13} /> View
        </button>

        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className={`hover:underline flex items-center gap-1.5 transition-colors ${
            isOwn ? "text-white hover:text-white/90" : "text-primary hover:text-primary/80"
          }`}
        >
          {downloading ? (
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {progress !== null ? `${progress}%` : "Downloading..."}
            </span>
          ) : (
            <>
              <Download size={13} /> Save as...
            </>
          )}
        </button>
      </div>
    </div>
  );
};


