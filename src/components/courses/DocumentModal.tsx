import { FC, Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import {
  Check,
  Cpu,
  ExternalLink,
  FileUp,
  FolderOpen,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { getProxyUrl } from "@/services/uploader.api";
import { resolveFileUrl, uploadDocumentFile } from "@/services/course.service";
import {
  deleteDocument,
  getDocumentLibrary,
  getAllDocuments,
  updateDocument,
  type ILibraryDocument,
} from "@/services/document.service";
import { formatDate } from "@/utils/formats/formats";
import {
  V2_BONE,
  V2_BTN_DANGER,
  V2_BTN_SECONDARY,
  V2_CARD_SHELL,
  V2_INPUT,
  V2_MUTED,
  V2_PILL,
  V2_PILL_AMBER,
  V2_PILL_BLUE,
  V2_PILL_GRAY,
  V2_PILL_GREEN,
  V2_PILL_RED,
  V2_SECTION_TITLE,
  V2_STRONG,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import DocumentUploadQueue, { DOCUMENT_ACCEPT, uploadErrorMessage } from "@/components/documents/DocumentUploadQueue";
import DocumentFileIcon from "@/components/documents/DocumentFileIcon";

interface DocumentModalProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

type CourseDocument = Pick<ILibraryDocument, "id" | "fileName" | "file" | "courseId" | "createdAt"> &
  Partial<Pick<ILibraryDocument, "ragIngestStatus" | "ragIngestError" | "chunkCount" | "hasEmbeddings" | "course">>;

const openDocument = (doc: CourseDocument) => {
  if (!doc.file) return;
  const isPdf = doc.file.toLowerCase().includes(".pdf") || doc.fileName.toLowerCase().endsWith(".pdf");
  const isCloudinary = doc.file.startsWith("https://res.cloudinary.com/");
  window.open(isPdf && isCloudinary ? getProxyUrl(doc.file) : resolveFileUrl(doc.file), "_blank");
};

const EmbeddingBadge: FC<{ doc: CourseDocument }> = ({ doc }) => {
  if (doc.hasEmbeddings) {
    return (
      <span className={`${V2_PILL} ${V2_PILL_GREEN}`}>
        <Cpu className="w-3 h-3" />
        {doc.chunkCount?.toLocaleString()} chunks
      </span>
    );
  }
  switch (doc.ragIngestStatus) {
    case "processing":
      return (
        <span className={`${V2_PILL} ${V2_PILL_BLUE}`}>
          <Loader2 className="w-3 h-3 animate-spin" />
          Processing
        </span>
      );
    case "failed":
      return (
        <span className={`${V2_PILL} ${V2_PILL_RED}`} title={doc.ragIngestError ?? undefined}>
          Embedding failed
        </span>
      );
    case "pending":
      return <span className={`${V2_PILL} ${V2_PILL_GRAY}`}>Not ingested</span>;
    case undefined:
      return null;
    default:
      return <span className={`${V2_PILL} ${V2_PILL_AMBER}`}>No embeddings</span>;
  }
};

const DocumentModal: FC<DocumentModalProps> = ({ courseId, isOpen, onClose }) => {
  const [documents, setDocuments] = useState<CourseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [replaceProgress, setReplaceProgress] = useState<number | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<CourseDocument | null>(null);

  const fetchDocuments = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await getDocumentLibrary({ courseId, limit: 200 });
        setDocuments(res.data);
      } catch {
        try {
          const res = await getAllDocuments();
          setDocuments((res.data || []).filter((d) => d.courseId === courseId) as CourseDocument[]);
        } catch {
          toast.error("Failed to load documents");
        }
      } finally {
        setLoading(false);
      }
    },
    [courseId],
  );

  useEffect(() => {
    if (isOpen) fetchDocuments();
  }, [isOpen, fetchDocuments]);

  const hasProcessing = documents.some((d) => d.ragIngestStatus === "processing");
  useEffect(() => {
    if (!isOpen || !hasProcessing) return;
    const t = setInterval(() => fetchDocuments(true), 5000);
    return () => clearInterval(t);
  }, [isOpen, hasProcessing, fetchDocuments]);

  const embeddedCount = documents.filter((d) => d.hasEmbeddings).length;
  const courseTitle = documents.find((d) => d.course?.title)?.course?.title;
  const locked = uploading || busyId !== null;

  const startRename = (doc: CourseDocument) => {
    setConfirmDeleteId(null);
    setRenamingId(doc.id);
    setRenameValue(doc.fileName);
  };

  const saveRename = async (doc: CourseDocument) => {
    const title = renameValue.trim();
    if (!title || title === doc.fileName) {
      setRenamingId(null);
      return;
    }
    setBusyId(doc.id);
    try {
      await updateDocument(doc.id, { fileName: title, file: doc.file, courseId: doc.courseId });
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, fileName: title } : d)));
      toast.success("Title updated");
      setRenamingId(null);
    } catch {
      toast.error("Failed to update title");
    } finally {
      setBusyId(null);
    }
  };

  const pickReplacement = (doc: CourseDocument) => {
    replaceTargetRef.current = doc;
    replaceInputRef.current?.click();
  };

  const replaceFile = async (file: File) => {
    const doc = replaceTargetRef.current;
    if (!doc) return;
    setBusyId(doc.id);
    setReplaceProgress(0);
    try {
      const url = await uploadDocumentFile(file, setReplaceProgress);
      await updateDocument(doc.id, { fileName: doc.fileName, file: url, courseId: doc.courseId });
      toast.success("File replaced. Embeddings are being rebuilt");
      await fetchDocuments(true);
    } catch (err) {
      toast.error(uploadErrorMessage(err));
    } finally {
      setBusyId(null);
      setReplaceProgress(null);
      replaceTargetRef.current = null;
    }
  };

  const remove = async (doc: CourseDocument) => {
    setBusyId(doc.id);
    try {
      await deleteDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  const close = () => {
    if (!locked) onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={close}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={`w-full max-w-3xl ${V2_CARD_SHELL} overflow-hidden flex flex-col max-h-[90vh]`}>
                <div className="flex items-start gap-3 px-6 py-5 border-b border-[rgba(51,99,173,0.12)] dark:border-slate-700">
                  <div className="w-11 h-11 rounded-2xl bg-[#EBF0F9] dark:bg-slate-700 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-5 h-5 text-[#3363AD] dark:text-blue-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Dialog.Title className={`text-lg font-bold ${V2_STRONG}`}>Course documents</Dialog.Title>
                    <p className={`text-sm truncate ${V2_MUTED}`}>
                      {courseTitle ? `${courseTitle} · ` : ""}
                      {documents.length} document{documents.length === 1 ? "" : "s"}
                      {documents.length > 0 && ` · ${embeddedCount} searchable by AI`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    disabled={locked}
                    className="p-2 rounded-xl text-[#5B6575] hover:bg-[#F1F5F9] dark:hover:bg-slate-700 disabled:opacity-40"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-[#F8FAFC] dark:bg-slate-900/40">
                  <section className="space-y-2">
                    <h4 className={V2_SECTION_TITLE}>Upload new</h4>
                    {isOpen && (
                      <DocumentUploadQueue
                        courseId={courseId}
                        compact
                        onRunningChange={setUploading}
                        onUploaded={() => fetchDocuments(true)}
                      />
                    )}
                  </section>

                  <section className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className={V2_SECTION_TITLE}>Documents</h4>
                      <button
                        type="button"
                        onClick={() => fetchDocuments(true)}
                        className={`text-xs font-bold flex items-center gap-1 ${V2_MUTED} hover:text-[#3363AD]`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                      </button>
                    </div>

                    {loading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className={`${V2_CARD_SHELL} p-3 flex items-center gap-3 animate-pulse`}>
                            <div className={`${V2_BONE} w-9 h-9 rounded-xl`} />
                            <div className="flex-1 space-y-2">
                              <div className={`${V2_BONE} h-3 w-1/2`} />
                              <div className={`${V2_BONE} h-2.5 w-1/4`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : documents.length === 0 ? (
                      <div className={`${V2_CARD_SHELL} py-10 text-center`}>
                        <FolderOpen className="w-10 h-10 mx-auto text-[#C5D3E0]" />
                        <p className={`text-sm font-bold mt-2 ${V2_STRONG}`}>No documents yet</p>
                        <p className={`text-xs mt-1 ${V2_MUTED}`}>Upload guidelines or source material for this course</p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {documents.map((doc) => {
                          const isBusy = busyId === doc.id;
                          const confirming = confirmDeleteId === doc.id;
                          const renaming = renamingId === doc.id;
                          return (
                            <li
                              key={doc.id}
                              className={`${V2_CARD_SHELL} p-3 flex items-center gap-3 transition-colors ${
                                confirming ? "border-red-300 bg-red-50/60 dark:bg-red-900/20" : ""
                              }`}
                            >
                              <DocumentFileIcon name={doc.file || doc.fileName} />
                              <div className="flex-1 min-w-0">
                                {renaming ? (
                                  <form
                                    className="flex items-center gap-2"
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      saveRename(doc);
                                    }}
                                  >
                                    <input
                                      value={renameValue}
                                      onChange={(e) => setRenameValue(e.target.value)}
                                      onKeyDown={(e) => e.key === "Escape" && setRenamingId(null)}
                                      autoFocus
                                      disabled={isBusy}
                                      className={`flex-1 px-2 py-1 text-sm ${V2_INPUT}`}
                                    />
                                    <button
                                      type="submit"
                                      disabled={isBusy || !renameValue.trim()}
                                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-40"
                                      title="Save"
                                    >
                                      {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRenamingId(null)}
                                      disabled={isBusy}
                                      className="p-1.5 rounded-lg text-[#9AA3B2] hover:bg-[#F1F5F9] dark:hover:bg-slate-700"
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </form>
                                ) : (
                                  <p className={`font-bold truncate ${V2_STRONG}`} title={doc.fileName}>
                                    {doc.fileName}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {doc.createdAt && (
                                    <span className={`text-xs ${V2_MUTED}`}>Uploaded {formatDate(doc.createdAt)}</span>
                                  )}
                                  <EmbeddingBadge doc={doc} />
                                  {isBusy && replaceProgress !== null && (
                                    <span className="text-xs font-bold text-[#3363AD]">Replacing… {replaceProgress}%</span>
                                  )}
                                </div>
                              </div>

                              {confirming ? (
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-xs font-bold text-red-600 dark:text-red-300 hidden sm:inline">
                                    Delete with embeddings?
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    disabled={isBusy}
                                    className={`${V2_BTN_SECONDARY} px-2.5 py-1.5 text-xs`}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => remove(doc)}
                                    disabled={isBusy}
                                    className={`${V2_BTN_DANGER} px-2.5 py-1.5 text-xs`}
                                  >
                                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Delete"}
                                  </button>
                                </div>
                              ) : (
                                !renaming && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <IconButton title="Open" onClick={() => openDocument(doc)} disabled={!doc.file}>
                                      <ExternalLink className="w-4 h-4" />
                                    </IconButton>
                                    <IconButton title="Rename" onClick={() => startRename(doc)} disabled={locked}>
                                      <Pencil className="w-4 h-4" />
                                    </IconButton>
                                    <IconButton title="Replace file" onClick={() => pickReplacement(doc)} disabled={locked}>
                                      {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                                    </IconButton>
                                    <IconButton
                                      title="Delete"
                                      danger
                                      onClick={() => {
                                        setRenamingId(null);
                                        setConfirmDeleteId(doc.id);
                                      }}
                                      disabled={locked}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </IconButton>
                                  </div>
                                )
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                </div>

                <div className="flex items-center justify-between px-6 py-3 border-t border-[rgba(51,99,173,0.12)] dark:border-slate-700">
                  <p className={`text-xs ${V2_MUTED}`}>Uploaded documents are indexed so the AI assistant can answer from them.</p>
                  <button type="button" onClick={close} disabled={locked} className={V2_BTN_SECONDARY}>
                    Done
                  </button>
                </div>

                <input
                  ref={replaceInputRef}
                  type="file"
                  accept={DOCUMENT_ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) replaceFile(file);
                  }}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

const IconButton: FC<{
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, disabled, danger, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
      danger
        ? "text-[#9AA3B2] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
        : "text-[#5B6575] dark:text-slate-300 hover:text-[#3363AD] hover:bg-[#EBF0F9] dark:hover:bg-slate-700"
    }`}
  >
    {children}
  </button>
);

export default DocumentModal;
