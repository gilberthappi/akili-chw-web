import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Cpu,
  ExternalLink,
  FileText,
  FolderOpen,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  deleteDocument,
  getDocumentLibrary,
  reingestDocument,
  updateDocument,
  type ILibraryDocument,
} from "@/services/document.service";
import UploadDocumentsDialog from "@/components/documents/UploadDocumentsDialog";
import { getAllCoursesNoPagination, resolveFileUrl } from "@/services/course.service";
import { formatDate } from "@/utils/formats/formats";
import Modal from "@/components/common/Modal";
import {
  V2KpiCard,
  V2KpiSkeleton,
  V2PageHeader,
  V2SearchInput,
  V2Tabs,
  type V2TabItem,
} from "@/components/v2/V2Page";
import {
  V2_BONE,
  V2_BTN_DANGER,
  V2_BTN_PRIMARY,
  V2_BTN_SECONDARY,
  V2_CARD_SHELL,
  V2_EMPTY,
  V2_INPUT,
  V2_MUTED,
  V2_PAGE_CANVAS,
  V2_PILL,
  V2_PILL_AMBER,
  V2_PILL_BLUE,
  V2_PILL_GRAY,
  V2_PILL_GREEN,
  V2_PILL_RED,
  V2_STRONG,
  V2_TABLE_BODY,
  V2_TABLE_HEAD,
  V2_TABLE_ROW,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

const PAGE_SIZE = 15;

type EmbeddingFilter = "all" | "embedded" | "missing" | "processing" | "failed";

const EMBEDDING_TABS: V2TabItem<EmbeddingFilter>[] = [
  { key: "all", label: "All" },
  { key: "embedded", label: "Embedded" },
  { key: "missing", label: "No embeddings" },
  { key: "processing", label: "Processing" },
  { key: "failed", label: "Failed" },
];

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: V2_PILL_GREEN },
  processing: { label: "Processing", className: V2_PILL_BLUE },
  pending: { label: "Not ingested", className: V2_PILL_GRAY },
  failed: { label: "Failed", className: V2_PILL_RED },
};

const fileExtension = (name: string) => name.split(".").pop()?.toUpperCase() ?? "FILE";

export default function DocumentsLibrary() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [courseId, setCourseId] = useState("");
  const [embedding, setEmbedding] = useState<EmbeddingFilter>("all");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ILibraryDocument | null>(null);
  const [renameTarget, setRenameTarget] = useState<ILibraryDocument | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, courseId, embedding]);

  const params = {
    searchq: debouncedSearch || undefined,
    courseId: courseId || undefined,
    embedding: embedding === "all" ? undefined : embedding,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["documents", "library", params],
    queryFn: () => getDocumentLibrary(params),
    keepPreviousData: true,
    refetchInterval: (res) =>
      res?.data.some((d) => d.ragIngestStatus === "processing")
        ? 5000
        : false,
  });

  const { data: coursesRes } = useQuery({
    queryKey: ["courses", "all-no-pagination"],
    queryFn: () => getAllCoursesNoPagination(),
  });
  const courses = coursesRes?.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["documents", "library"] });

  const reingest = useMutation({
    mutationFn: reingestDocument,
    onSuccess: () => {
      toast.success("Re-ingestion started");
      invalidate();
    },
    onError: (err: { response?: { data?: { message?: string } } }) =>
      toast.error(err.response?.data?.message ?? "Failed to start re-ingestion"),
  });

  const remove = useMutation({
    mutationFn: deleteDocument,
    onSuccess: (res: { data?: { chunksDeleted?: number } }) => {
      const chunks = res?.data?.chunksDeleted ?? 0;
      toast.success(
        chunks > 0
          ? `Document deleted with ${chunks.toLocaleString()} embedding chunk${chunks === 1 ? "" : "s"}`
          : "Document deleted",
      );
      setDeleteTarget(null);
      invalidate();
    },
    onError: () => toast.error("Failed to delete document"),
  });

  const rename = useMutation({
    mutationFn: (doc: ILibraryDocument) =>
      updateDocument(doc.id, { fileName: renameValue.trim(), file: doc.file, courseId: doc.courseId }),
    onSuccess: () => {
      toast.success("Title updated");
      setRenameTarget(null);
      invalidate();
    },
    onError: () => toast.error("Failed to update title"),
  });

  const openRename = (doc: ILibraryDocument) => {
    setRenameTarget(doc);
    setRenameValue(doc.fileName);
  };

  const docs = data?.data ?? [];
  const stats = data?.stats;
  const totalItems = data?.totalItems ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const coveragePct = stats && stats.total > 0 ? Math.round((stats.embedded / stats.total) * 100) : 0;

  return (
    <div className={V2_PAGE_CANVAS}>
      <V2PageHeader
        title="Documents library"
        subtitle="Course source documents and their AI embedding status"
        actions={
          <button type="button" onClick={() => setUploadOpen(true)} className={V2_BTN_PRIMARY}>
            <UploadCloud className="w-4 h-4" />
            Upload documents
          </button>
        }
      />

      {isLoading && !stats ? (
        <V2KpiSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <V2KpiCard label="Documents" value={stats?.total ?? 0} Icon={FolderOpen} sub="Uploaded to courses" />
          <V2KpiCard
            label="With Embeddings"
            value={stats?.embedded ?? 0}
            Icon={Cpu}
            accent="text-emerald-600 dark:text-emerald-400"
            sub={`${coveragePct}% searchable by AI`}
            onClick={() => setEmbedding("embedded")}
          />
          <V2KpiCard
            label="No Embeddings"
            value={stats?.missing ?? 0}
            Icon={AlertTriangle}
            accent="text-amber-500 dark:text-amber-400"
            sub={`${stats?.failed ?? 0} failed · ${stats?.inProgress ?? 0} in progress`}
            onClick={() => setEmbedding("missing")}
          />
          <V2KpiCard label="Courses Covered" value={stats?.coursesCovered ?? 0} Icon={BookOpen} sub="Have at least one document" />
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <V2Tabs items={EMBEDDING_TABS} active={embedding} onChange={setEmbedding} />
        <V2SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by file name or course..."
          className="flex-1 max-w-md"
        />
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className={`px-3 py-2 text-sm sm:w-72 ${V2_INPUT}`}
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        {isFetching && !isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#9AA3B2] self-center" />}
      </div>

      <div className={`${V2_CARD_SHELL} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={V2_TABLE_HEAD}>
              <tr>
                <th className="px-4 py-3 text-left">Document</th>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Embeddings</th>
                <th className="px-4 py-3 text-left">Ingestion</th>
                <th className="px-4 py-3 text-left">Uploaded</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={V2_TABLE_BODY}>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className={`${V2_BONE} h-3 w-48`} /></td>
                    <td className="px-4 py-3"><div className={`${V2_BONE} h-3 w-40`} /></td>
                    <td className="px-4 py-3"><div className={`${V2_BONE} h-5 w-24 rounded-full`} /></td>
                    <td className="px-4 py-3"><div className={`${V2_BONE} h-5 w-20 rounded-full`} /></td>
                    <td className="px-4 py-3"><div className={`${V2_BONE} h-3 w-20`} /></td>
                    <td className="px-4 py-3"><div className={`${V2_BONE} h-7 w-24 ml-auto rounded-lg`} /></td>
                  </tr>
                ))
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4">
                    <div className={V2_EMPTY}>
                      <FolderOpen size={40} className="mx-auto mb-3 text-[#C5D3E0]" />
                      <p className={`text-sm font-bold ${V2_STRONG}`}>No documents found</p>
                      <p className={`text-xs mt-1 ${V2_MUTED}`}>Try adjusting the search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                docs.map((doc) => {
                  const status = STATUS_PILL[doc.ragIngestStatus ?? ""];
                  const busy = doc.ragIngestStatus === "processing";
                  return (
                    <tr key={doc.id} className={V2_TABLE_ROW}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#EBF0F9] dark:bg-slate-700 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-[#3363AD] dark:text-blue-300" />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-bold truncate max-w-[18rem] ${V2_STRONG}`} title={doc.fileName}>
                              {doc.fileName}
                            </p>
                            <p className={`text-xs ${V2_MUTED}`}>{fileExtension(doc.file)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/courses/${doc.course.id}/analysis`}
                          className={`font-semibold hover:text-[#3363AD] hover:underline line-clamp-2 ${V2_STRONG}`}
                        >
                          {doc.course.title}
                        </Link>
                        {!doc.course.isPublished && (
                          <span className={`${V2_PILL} ${V2_PILL_GRAY} mt-1`}>Draft course</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {doc.hasEmbeddings ? (
                          <div>
                            <span className={`${V2_PILL} ${V2_PILL_GREEN}`}>Yes</span>
                            <p className={`text-xs mt-1 ${V2_MUTED}`}>
                              {doc.chunkCount.toLocaleString()} chunk{doc.chunkCount === 1 ? "" : "s"}
                            </p>
                          </div>
                        ) : (
                          <span className={`${V2_PILL} ${V2_PILL_AMBER}`}>No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {status ? (
                          <span className={`${V2_PILL} ${status.className}`} title={doc.ragIngestError ?? undefined}>
                            {busy && <Loader2 className="w-3 h-3 animate-spin" />}
                            {status.label}
                          </span>
                        ) : (
                          <span className={`${V2_PILL} ${V2_PILL_GRAY}`}>Unknown</span>
                        )}
                        {doc.ragIngestStatus === "failed" && doc.ragIngestError && (
                          <p className="text-xs mt-1 text-red-500 dark:text-red-400 line-clamp-2 max-w-[14rem]" title={doc.ragIngestError}>
                            {doc.ragIngestError}
                          </p>
                        )}
                        {doc.ragIngestedAt && doc.ragIngestStatus === "completed" && (
                          <p className={`text-xs mt-1 ${V2_MUTED}`}>{formatDate(doc.ragIngestedAt)}</p>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-xs whitespace-nowrap ${V2_MUTED}`}>{formatDate(doc.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={resolveFileUrl(doc.file)}
                            target="_blank"
                            rel="noreferrer"
                            className={`${V2_BTN_SECONDARY} px-2.5 py-1.5`}
                            title="Open file"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => openRename(doc)}
                            className={`${V2_BTN_SECONDARY} px-2.5 py-1.5`}
                            title="Edit title"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => reingest.mutate(doc.id)}
                            disabled={busy || (reingest.isLoading && reingest.variables === doc.id)}
                            className={`${V2_BTN_SECONDARY} px-2.5 py-1.5 disabled:opacity-40`}
                            title={doc.hasEmbeddings ? "Rebuild embeddings" : "Generate embeddings"}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(doc)}
                            className={`${V2_BTN_SECONDARY} px-2.5 py-1.5 text-red-500 hover:text-red-600`}
                            title="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(51,99,173,0.12)] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/60">
            <p className={`text-xs ${V2_MUTED}`}>
              Showing{" "}
              <span className={`font-bold ${V2_STRONG}`}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalItems)}
              </span>{" "}
              of <span className={`font-bold ${V2_STRONG}`}>{totalItems}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-xl text-[#5B6575] hover:bg-[#F1F5F9] dark:hover:bg-slate-700 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className={`text-xs font-bold ${V2_STRONG}`}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-xl text-[#5B6575] hover:bg-[#F1F5F9] dark:hover:bg-slate-700 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => !remove.isLoading && setDeleteTarget(null)}
        title="Delete document"
        centered
      >
        <div className="space-y-5">
          <p className={`text-sm ${V2_MUTED}`}>
            Delete <span className={`font-bold ${V2_STRONG}`}>{deleteTarget?.fileName}</span>?
            {deleteTarget?.hasEmbeddings
              ? ` Its ${deleteTarget.chunkCount.toLocaleString()} embedding chunk${deleteTarget.chunkCount === 1 ? "" : "s"} will also be deleted and the AI assistant will no longer use it.`
              : " This cannot be undone."}
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteTarget(null)} className={V2_BTN_SECONDARY} disabled={remove.isLoading}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteTarget && remove.mutate(deleteTarget.id)}
              className={V2_BTN_DANGER}
              disabled={remove.isLoading}
            >
              {remove.isLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={renameTarget !== null}
        onClose={() => !rename.isLoading && setRenameTarget(null)}
        title="Edit document title"
        centered
      >
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (renameTarget && renameValue.trim()) rename.mutate(renameTarget);
          }}
        >
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
            className={`w-full px-3 py-2 text-sm ${V2_INPUT}`}
            placeholder="Document title"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRenameTarget(null)} className={V2_BTN_SECONDARY} disabled={rename.isLoading}>
              Cancel
            </button>
            <button
              type="submit"
              className={V2_BTN_PRIMARY}
              disabled={rename.isLoading || !renameValue.trim() || renameValue.trim() === renameTarget?.fileName}
            >
              {rename.isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>

      <UploadDocumentsDialog
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={invalidate}
        courses={courses}
        defaultCourseId={courseId || undefined}
      />
    </div>
  );
}
