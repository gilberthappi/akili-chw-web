import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  BookA,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Globe,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Modal from "@/components/common/Modal";
import TermFormModal from "@/components/dictionary/TermFormModal";
import ResourceFormModal from "@/components/dictionary/ResourceFormModal";
import TermImportDialog from "@/components/dictionary/TermImportDialog";
import { useAuth } from "@/hooks/useAuth";
import { expandRoles } from "@/utils/roles";
import { formatDate } from "@/utils/formats/formats";
import {
  createDictionaryResource,
  createDictionaryTerm,
  deleteDictionaryResource,
  deleteDictionaryTerm,
  exportDictionaryTerms,
  getDictionaryResources,
  getDictionaryTerms,
  resourceSearchLink,
  updateDictionaryResource,
  updateDictionaryTerm,
  type DictionaryResourceInput,
  type DictionaryTermInput,
  type IDictionaryResource,
  type IDictionaryTerm,
} from "@/services/dictionary.service";
import { V2PageHeader, V2SearchInput, V2Tabs, type V2TabItem } from "@/components/v2/V2Page";
import {
  V2_BTN_DANGER,
  V2_BTN_PRIMARY,
  V2_BTN_SECONDARY,
  V2_CARD_SHELL,
  V2_CARD_SHELL_PADDED,
  V2_EMPTY,
  V2_INPUT,
  V2_MUTED,
  V2_PAGE_CANVAS,
  V2_PILL,
  V2_PILL_BLUE,
  V2_PILL_GRAY,
  V2_SECTION_TITLE,
  V2_STRONG,
  V2_TABLE_BODY,
  V2_TABLE_HEAD,
  V2_TABLE_ROW,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

type DictionaryTab = "glossary" | "external";
type ApiError = { response?: { data?: { message?: string } } };
type DeleteTarget = { kind: "term"; item: IDictionaryTerm } | { kind: "resource"; item: IDictionaryResource };

const PAGE_SIZE = 25;
/** CIIC_CONTENT_LEAD inherits ADMIN. */
const EDIT_ROLES = ["ADMIN", "CIIC_EDITOR"];

const ICON_BTN =
  "p-1.5 rounded-lg text-[#5B6575] hover:bg-[#EEF3FA] hover:text-[#3363AD] dark:text-slate-400 dark:hover:bg-slate-800 transition-colors";

export default function DictionaryPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: DictionaryTab = searchParams.get("tab") === "external" ? "external" : "glossary";

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search.trim());
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [termForm, setTermForm] = useState<{ open: boolean; term: IDictionaryTerm | null }>({ open: false, term: null });
  const [resourceForm, setResourceForm] = useState<{ open: boolean; resource: IDictionaryResource | null }>({
    open: false,
    resource: null,
  });
  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [exporting, setExporting] = useState(false);

  const canEdit = useMemo(() => {
    const roles = (Array.isArray(user?.roles) ? user.roles : user?.roles ? [user.roles] : []) as string[];
    const effective = expandRoles(roles);
    return EDIT_ROLES.some((r) => effective.has(r));
  }, [user?.roles]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category]);

  const changeTab = (key: DictionaryTab) => {
    const next = new URLSearchParams(searchParams);
    if (key === "glossary") next.delete("tab");
    else next.set("tab", key);
    setSearchParams(next, { replace: true });
  };

  const termParams = { searchq: debouncedSearch || undefined, category: category || undefined, page, limit: PAGE_SIZE };
  const { data: termsData, isLoading: termsLoading, isFetching: termsFetching } = useQuery({
    queryKey: ["dictionary", "terms", termParams],
    queryFn: () => getDictionaryTerms(termParams),
    keepPreviousData: true,
  });
  const { data: resourcesData, isLoading: resourcesLoading } = useQuery({
    queryKey: ["dictionary", "resources"],
    queryFn: () => getDictionaryResources(),
  });

  const terms = termsData?.data ?? [];
  const categories = termsData?.categories ?? [];
  const resources = resourcesData?.data ?? [];
  const searchable = resources.filter((r) => r.searchUrl);
  const shownResources = debouncedSearch
    ? resources.filter((r) =>
        [r.name, r.description, r.category].some((v) => v?.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        !!r.searchUrl,
      )
    : resources;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["dictionary"] });

  const remove = useMutation({
    mutationFn: (target: DeleteTarget) =>
      target.kind === "term" ? deleteDictionaryTerm(target.item.id) : deleteDictionaryResource(target.item.id),
    onSuccess: (_res, target) => {
      toast.success(target.kind === "term" ? "Term deleted" : "Resource deleted");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message ?? "Failed to delete"),
  });

  const saveTerm = async (payload: DictionaryTermInput) => {
    if (termForm.term) {
      await updateDictionaryTerm(termForm.term.id, payload);
      toast.success("Term updated");
    } else {
      await createDictionaryTerm(payload);
      toast.success("Term added");
    }
    invalidate();
  };

  const saveResource = async (payload: DictionaryResourceInput) => {
    if (resourceForm.resource) {
      await updateDictionaryResource(resourceForm.resource.id, payload);
      toast.success("Resource updated");
    } else {
      await createDictionaryResource(payload);
      toast.success("Resource added");
    }
    invalidate();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportDictionaryTerms({ searchq: debouncedSearch || undefined, category: category || undefined });
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const tabs: V2TabItem<DictionaryTab>[] = [
    { key: "glossary", label: "System glossary", Icon: BookA, count: termsData?.totalTerms },
    { key: "external", label: "External resources", Icon: Globe, count: resources.length },
  ];

  const lookupLinks = debouncedSearch && searchable.length > 0 && (
    <div className='flex flex-wrap items-center gap-2'>
      <span className={`text-xs ${V2_MUTED}`}>Look up “{debouncedSearch}” in:</span>
      {searchable.map((r) => (
        <a
          key={r.id}
          href={resourceSearchLink(r, debouncedSearch)!}
          target='_blank'
          rel='noopener noreferrer'
          className={`${V2_PILL} ${V2_PILL_BLUE} hover:underline inline-flex items-center gap-1`}
        >
          {r.name}
          <ExternalLink className='w-3 h-3' />
        </a>
      ))}
    </div>
  );

  const totalPages = termsData?.pagination.totalPages ?? 1;
  const total = termsData?.pagination.total ?? 0;

  return (
    <div className={V2_PAGE_CANVAS}>
      <V2PageHeader
        title='Dictionary'
        subtitle='Approved clinical terms in English and Kinyarwanda, plus trusted external dictionaries'
        actions={<V2Tabs items={tabs} active={tab} onChange={changeTab} />}
      />

      <div className={`${V2_CARD_SHELL} p-3 space-y-3`}>
        <div className='flex flex-col lg:flex-row lg:items-center gap-2'>
          <V2SearchInput
            value={search}
            onChange={setSearch}
            placeholder={tab === "glossary" ? "Search a term, abbreviation or definition…" : "Search resources…"}
            className='w-full lg:max-w-md'
          />
          {tab === "glossary" && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`px-3 py-2 text-sm ${V2_INPUT} lg:w-56`}
            >
              <option value=''>All categories</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.count})
                </option>
              ))}
            </select>
          )}
          <div className='flex flex-wrap gap-2 lg:ml-auto'>
            {tab === "glossary" ? (
              <>
                <button type='button' onClick={handleExport} disabled={exporting} className={V2_BTN_SECONDARY}>
                  {exporting ? <Loader2 className='w-4 h-4 animate-spin' /> : <Download className='w-4 h-4' />}
                  Export Excel
                </button>
                {canEdit && (
                  <>
                    <button type='button' onClick={() => setImportOpen(true)} className={V2_BTN_SECONDARY}>
                      <FileSpreadsheet className='w-4 h-4' />
                      Import
                    </button>
                    <button
                      type='button'
                      onClick={() => setTermForm({ open: true, term: null })}
                      className={V2_BTN_PRIMARY}
                    >
                      <Plus className='w-4 h-4' />
                      Add term
                    </button>
                  </>
                )}
              </>
            ) : (
              canEdit && (
                <button
                  type='button'
                  onClick={() => setResourceForm({ open: true, resource: null })}
                  className={V2_BTN_PRIMARY}
                >
                  <Plus className='w-4 h-4' />
                  Add resource
                </button>
              )
            )}
          </div>
        </div>
        {lookupLinks}
      </div>

      {tab === "glossary" ? (
        <div className={`${V2_CARD_SHELL} overflow-hidden`}>
          <div className='px-4 py-3 flex items-center justify-between'>
            <h3 className={V2_SECTION_TITLE}>
              Terms{" "}
              <span className={`text-[11px] font-semibold ${V2_MUTED}`}>
                ({total.toLocaleString()}
                {debouncedSearch || category ? " matching" : ""})
              </span>
            </h3>
            {termsFetching && !termsLoading && <Loader2 className='w-4 h-4 animate-spin text-[#3363AD]' />}
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className={V2_TABLE_HEAD}>
                <tr>
                  <th className='text-left px-4 py-2.5 w-64'>Term</th>
                  <th className='text-left px-3 py-2.5'>Definition</th>
                  <th className='text-left px-3 py-2.5 w-40'>Category</th>
                  <th className='text-left px-3 py-2.5 w-40'>Last updated</th>
                  {canEdit && <th className='w-20' />}
                </tr>
              </thead>
              <tbody className={V2_TABLE_BODY}>
                {termsLoading ? (
                  <tr>
                    <td colSpan={5} className={`px-4 py-10 text-center text-xs ${V2_MUTED}`}>
                      Loading…
                    </td>
                  </tr>
                ) : terms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`${V2_EMPTY} px-4 py-10`}>
                      <div className='flex flex-col items-center gap-2'>
                        <Search className='w-8 h-8 text-[#C5D3E0]' />
                        <p className='text-xs'>
                          {debouncedSearch
                            ? `“${debouncedSearch}” is not in the system glossary yet.`
                            : "No terms yet."}{" "}
                          {canEdit && "Add it, or import a list from Excel."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  terms.map((t) => (
                    <tr key={t.id} className={`${V2_TABLE_ROW} align-top`}>
                      <td className='px-4 py-3'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <span className={`font-bold ${V2_STRONG}`}>{t.term}</span>
                          {t.abbreviation && <span className={`${V2_PILL} ${V2_PILL_GRAY}`}>{t.abbreviation}</span>}
                        </div>
                        {t.termRw && <p className='text-xs text-[#3363AD] dark:text-blue-300 mt-0.5'>{t.termRw}</p>}
                      </td>
                      <td className='px-3 py-3'>
                        <p className={`text-[13px] ${V2_STRONG}`}>{t.definition}</p>
                        {t.definitionRw && <p className={`text-xs mt-1 italic ${V2_MUTED}`}>{t.definitionRw}</p>}
                      </td>
                      <td className='px-3 py-3'>
                        {t.category ? (
                          <button
                            type='button'
                            onClick={() => setCategory(t.category!)}
                            className={`${V2_PILL} ${V2_PILL_BLUE} hover:underline`}
                          >
                            {t.category}
                          </button>
                        ) : (
                          <span className={`text-xs ${V2_MUTED}`}>—</span>
                        )}
                      </td>
                      <td className={`px-3 py-3 text-xs ${V2_MUTED}`}>
                        {formatDate(t.updatedAt)}
                        {(t.updatedByName || t.createdByName) && (
                          <p className='truncate'>by {t.updatedByName ?? t.createdByName}</p>
                        )}
                      </td>
                      {canEdit && (
                        <td className='pr-3 py-2.5'>
                          <div className='flex justify-end gap-1'>
                            <button
                              type='button'
                              title='Edit'
                              onClick={() => setTermForm({ open: true, term: t })}
                              className={ICON_BTN}
                            >
                              <Pencil className='w-4 h-4' />
                            </button>
                            <button
                              type='button'
                              title='Delete'
                              onClick={() => setDeleteTarget({ kind: "term", item: t })}
                              className={`${ICON_BTN} hover:!text-red-600`}
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className='px-4 py-3 flex items-center justify-between border-t border-[rgba(51,99,173,0.08)] dark:border-slate-700'>
              <span className={`text-xs ${V2_MUTED}`}>
                Page {page} of {totalPages}
              </span>
              <div className='flex gap-2'>
                <button
                  type='button'
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className={`${V2_BTN_SECONDARY} px-3 py-1.5 disabled:opacity-40`}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  type='button'
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className={`${V2_BTN_SECONDARY} px-3 py-1.5 disabled:opacity-40`}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : resourcesLoading ? (
        <div className={`${V2_CARD_SHELL_PADDED} text-center text-xs ${V2_MUTED}`}>Loading…</div>
      ) : shownResources.length === 0 ? (
        <div className={`${V2_CARD_SHELL_PADDED} ${V2_EMPTY} flex flex-col items-center gap-2 py-10`}>
          <Globe className='w-8 h-8 text-[#C5D3E0]' />
          <p className='text-xs'>No external resources yet.</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
          {shownResources.map((r) => {
            const searchLink = debouncedSearch ? resourceSearchLink(r, debouncedSearch) : null;
            return (
              <div key={r.id} className={`${V2_CARD_SHELL_PADDED} flex flex-col gap-3`}>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <h3 className={`font-bold text-sm ${V2_STRONG}`}>{r.name}</h3>
                    <div className='flex flex-wrap gap-1.5 mt-1'>
                      {r.category && <span className={`${V2_PILL} ${V2_PILL_BLUE}`}>{r.category}</span>}
                      {r.language && <span className={`${V2_PILL} ${V2_PILL_GRAY}`}>{r.language}</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className='flex gap-1 shrink-0'>
                      <button
                        type='button'
                        title='Edit'
                        onClick={() => setResourceForm({ open: true, resource: r })}
                        className={ICON_BTN}
                      >
                        <Pencil className='w-4 h-4' />
                      </button>
                      <button
                        type='button'
                        title='Delete'
                        onClick={() => setDeleteTarget({ kind: "resource", item: r })}
                        className={`${ICON_BTN} hover:!text-red-600`}
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  )}
                </div>
                {r.description && <p className={`text-xs ${V2_MUTED}`}>{r.description}</p>}
                <div className='mt-auto flex flex-wrap gap-2'>
                  <a href={r.url} target='_blank' rel='noopener noreferrer' className={V2_BTN_SECONDARY}>
                    <ExternalLink className='w-4 h-4' />
                    Open website
                  </a>
                  {searchLink && (
                    <a href={searchLink} target='_blank' rel='noopener noreferrer' className={V2_BTN_PRIMARY}>
                      <Search className='w-4 h-4' />
                      Search “{debouncedSearch}”
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TermFormModal
        isOpen={termForm.open}
        onClose={() => setTermForm({ open: false, term: null })}
        term={termForm.term}
        categories={categories.map((c) => c.name)}
        onSubmit={saveTerm}
      />
      <ResourceFormModal
        isOpen={resourceForm.open}
        onClose={() => setResourceForm({ open: false, resource: null })}
        resource={resourceForm.resource}
        onSubmit={saveResource}
      />
      <TermImportDialog isOpen={importOpen} onClose={() => setImportOpen(false)} onImported={invalidate} />

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => !remove.isLoading && setDeleteTarget(null)}
        title={deleteTarget?.kind === "resource" ? "Delete external resource" : "Delete term"}
        centered
      >
        <div className='space-y-5'>
          <p className={`text-sm ${V2_MUTED}`}>
            Delete{" "}
            <span className={`font-bold ${V2_STRONG}`}>
              {deleteTarget?.kind === "term" ? deleteTarget.item.term : deleteTarget?.item.name}
            </span>
            ? This cannot be undone.
          </p>
          <div className='flex justify-end gap-2'>
            <button
              type='button'
              onClick={() => setDeleteTarget(null)}
              className={V2_BTN_SECONDARY}
              disabled={remove.isLoading}
            >
              Cancel
            </button>
            <button
              type='button'
              onClick={() => deleteTarget && remove.mutate(deleteTarget)}
              className={V2_BTN_DANGER}
              disabled={remove.isLoading}
            >
              {remove.isLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
