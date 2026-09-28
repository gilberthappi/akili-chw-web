import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Loader2, UploadCloud, X, XCircle } from "lucide-react";
import { uploadDocumentFile } from "@/services/course.service";
import { createDocument } from "@/services/document.service";
import {
  V2_BTN_PRIMARY,
  V2_INPUT,
  V2_MUTED,
  V2_STRONG,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import DocumentFileIcon from "./DocumentFileIcon";

const MAX_BYTES = 100 * 1024 * 1024;
export const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv";

type ItemStatus = "ready" | "uploading" | "done" | "error";

interface UploadItem {
  key: string;
  file: File;
  title: string;
  status: ItemStatus;
  progress: number;
  error?: string;
}

export const toMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
const titleFromFile = (name: string) => name.replace(/\.[^.]+$/, "");

export const uploadErrorMessage = (err: unknown) =>
  (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
  (err as Error)?.message ??
  "Upload failed";

interface Props {
  courseId: string;
  onUploaded: () => void;
  onRunningChange?: (running: boolean) => void;
  compact?: boolean;
}

export default function DocumentUploadQueue({ courseId, onUploaded, onRunningChange, compact }: Props) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const setRunningState = (value: boolean) => {
    setRunning(value);
    onRunningChange?.(value);
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next: UploadItem[] = [];
    Array.from(list).forEach((file) => {
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is ${toMb(file.size)}. Max is 100 MB`);
        return;
      }
      next.push({
        key: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        title: titleFromFile(file.name),
        status: "ready",
        progress: 0,
      });
    });
    setItems((prev) => [
      ...prev.filter((p) => p.status !== "done"),
      ...next.filter((n) => !prev.some((p) => p.key === n.key)),
    ]);
  };

  const update = (key: string, patch: Partial<UploadItem>) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const pending = items.filter((i) => i.status === "ready" || i.status === "error");
  const totalBytes = items.reduce((sum, i) => sum + i.file.size, 0);

  const startUpload = async () => {
    if (!courseId) {
      toast.error("Choose a course first");
      return;
    }
    if (pending.some((i) => !i.title.trim())) {
      toast.error("Every document needs a title");
      return;
    }
    setRunningState(true);
    let ok = 0;
    for (const item of pending) {
      update(item.key, { status: "uploading", error: undefined, progress: 0 });
      try {
        const url = await uploadDocumentFile(item.file, (progress) => update(item.key, { progress }));
        await createDocument({ fileName: item.title.trim(), file: url, courseId });
        update(item.key, { status: "done", progress: 100 });
        ok += 1;
      } catch (err) {
        update(item.key, { status: "error", error: uploadErrorMessage(err) });
      }
    }
    setRunningState(false);
    if (ok > 0) {
      toast.success(`${ok} document${ok === 1 ? "" : "s"} uploaded. Embeddings are being generated`);
      onUploaded();
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!running) addFiles(e.dataTransfer.files);
        }}
        onClick={() => !running && inputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors ${
          compact ? "p-4" : "p-6"
        } ${
          dragging
            ? "border-[#3363AD] bg-[#EBF0F9] dark:bg-slate-700/60"
            : "border-[#C8D6E3] dark:border-slate-600 hover:border-[#3363AD]/60 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60"
        }`}
      >
        <div className="w-11 h-11 mx-auto rounded-2xl bg-[#EBF0F9] dark:bg-slate-700 flex items-center justify-center">
          <UploadCloud className="w-5 h-5 text-[#3363AD] dark:text-blue-300" />
        </div>
        <p className={`text-sm font-bold mt-2 ${V2_STRONG}`}>
          Drop files here or <span className="text-[#3363AD] dark:text-blue-300 underline">browse</span>
        </p>
        <p className={`text-xs mt-1 ${V2_MUTED}`}>PDF, Word, PowerPoint, Excel, TXT, CSV · up to 100 MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={DOCUMENT_ACCEPT}
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          <div className={`flex justify-between text-xs ${V2_MUTED}`}>
            <span>
              {items.length} file{items.length === 1 ? "" : "s"} · titles can be edited
            </span>
            <span>Total {toMb(totalBytes)}</span>
          </div>
          <ul className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {items.map((item) => (
              <li
                key={item.key}
                className="flex items-center gap-3 rounded-xl border border-[rgba(51,99,173,0.12)] dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
              >
                <DocumentFileIcon name={item.file.name} />
                <div className="flex-1 min-w-0">
                  <input
                    value={item.title}
                    onChange={(e) => update(item.key, { title: e.target.value })}
                    disabled={running || item.status === "done"}
                    className={`w-full px-2 py-1 text-sm ${V2_INPUT}`}
                    placeholder="Document title"
                  />
                  <p className={`text-xs mt-1 truncate ${V2_MUTED}`} title={item.file.name}>
                    {item.file.name} · {toMb(item.file.size)}
                  </p>
                  {item.status === "uploading" && (
                    <div className="mt-1.5 h-1.5 rounded-full bg-[#EBF0F9] dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-[#3363AD] transition-all" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}
                  {item.error && <p className="text-xs text-red-500 mt-0.5">{item.error}</p>}
                </div>
                {item.status === "uploading" && (
                  <span className="text-xs font-bold tabular-nums text-[#3363AD]">{item.progress}%</span>
                )}
                {item.status === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                {item.status === "error" && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                {!running && item.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
                    className="p-1 rounded-lg text-[#9AA3B2] hover:text-red-500"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {pending.length > 0 && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={startUpload}
                className={V2_BTN_PRIMARY}
                disabled={running || !courseId}
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                {running ? "Uploading..." : `Upload ${pending.length} file${pending.length === 1 ? "" : "s"}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
