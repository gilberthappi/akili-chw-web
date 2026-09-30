import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileSpreadsheet,
  Loader2,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import Modal from "@/components/common/Modal";
import ChwRegistryFormModal from "@/components/chwRegistry/ChwRegistryFormModal";
import ChwRegistryImportDialog from "@/components/chwRegistry/ChwRegistryImportDialog";
import { getAllDistricts } from "@/hooks/locations";
import {
  createChwRegistryEntry,
  deleteChwRegistryEntry,
  getChwRegistry,
  updateChwRegistryEntry,
  type ChwRegistryInput,
  type ChwRegistryStatus,
  type IChwRegistryEntry,
} from "@/services/chwRegistry.service";
import { formatDate } from "@/utils/formats/formats";
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
  V2_PILL_GRAY,
  V2_PILL_GREEN,
  V2_STRONG,
  V2_TABLE_BODY,
  V2_TABLE_HEAD,
  V2_TABLE_ROW,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

const PAGE_SIZE = 20;

type StatusFilter = "all" | ChwRegistryStatus;

const STATUS_TABS: V2TabItem<StatusFilter>[] = [
  { key: "all", label: "All" },
  { key: "registered", label: "Signed up" },
  { key: "pending", label: "Not signed up" },
];

type ApiError = { response?: { data?: { message?: string } } };

export default function ChwRegistryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [district, setDistrict] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [noHealthCenter, setNoHealthCenter] = useState(false);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IChwRegistryEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IChwRegistryEntry | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, district, status, noHealthCenter]);

  const params = {
    searchq: debouncedSearch || undefined,
    district: district || undefined,
    status: status === "all" ? undefined : status,
    healthCenterId: noHealthCenter ? "none" : undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["chw-registry", params],
    queryFn: () => getChwRegistry(params),
    keepPreviousData: true,
  });

  const districtNames = useMemo(() => getAllDistricts().map((d) => d.name.trim()).sort(), []);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["chw-registry"] });

  const remove = useMutation({
    mutationFn: deleteChwRegistryEntry,
    onSuccess: () => {
      toast.success("CHW removed from registry");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (err: ApiError) => toast.error(err.response?.data?.message ?? "Failed to delete"),
  });

  const handleSave = async (payload: ChwRegistryInput) => {
    if (editing) {
      await updateChwRegistryEntry(editing.id, payload);
      toast.success("CHW updated");
    } else {
      await createChwRegistryEntry(payload);
      toast.success("CHW added to registry");
    }
    invalidate();
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (entry: IChwRegistryEntry) => {
    setEditing(entry);
    setFormOpen(true);
  };

  const rows = data?.data ?? [];
  const stats = data?.stats;
  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;
  const signupPct = stats && stats.total > 0 ? Math.round((stats.registered / stats.total) * 100) : 0;

  return (
    <div className={V2_PAGE_CANVAS}>
      <V2PageHeader
        title="CHW Registry"
        subtitle="Pre-registered CHWs — used by the mobile app to verify CHWs and fill in their details from their NID"
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={() => setImportOpen(true)} className={V2_BTN_SECONDARY}>
              <FileSpreadsheet className="w-4 h-4" />
              Import Excel
            </button>
            <button type="button" onClick={openCreate} className={V2_BTN_PRIMARY}>
              <Plus className="w-4 h-4" />
              Add CHW
            </button>
          </div>
        }
      />

      {isLoading && !stats ? (
        <V2KpiSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <V2KpiCard
            label="In Registry"
            value={stats?.total ?? 0}
            Icon={ClipboardList}
            sub={`${stats?.districts ?? 0} district${stats?.districts === 1 ? "" : "s"} · ${stats?.healthCenters ?? 0} health centers`}
            onClick={() => {
              setStatus("all");
              setNoHealthCenter(false);
            }}
          />
          <V2KpiCard
            label="Signed Up"
            value={stats?.registered ?? 0}
            Icon={UserCheck}
            accent="text-emerald-600 dark:text-emerald-400"
            sub={`${signupPct}% have a mobile account`}
            onClick={() => setStatus("registered")}
          />
          <V2KpiCard
            label="Not Signed Up"
            value={stats?.pending ?? 0}
            Icon={UserX}
            accent="text-amber-500 dark:text-amber-400"
            sub="Can sign up with their NID"
            onClick={() => setStatus("pending")}
          />
          <V2KpiCard
            label="No Health Center"
            value={stats?.withoutHealthCenter ?? 0}
            Icon={Building2}
            accent="text-red-500 dark:text-red-400"
            sub="Edit to assign one"
            onClick={() => setNoHealthCenter(true)}
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <V2Tabs items={STATUS_TABS} active={status} onChange={setStatus} />
        <V2SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, NID, phone or village..."
          className="flex-1 max-w-md"
        />
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className={`px-3 py-2 text-sm sm:w-56 ${V2_INPUT}`}
        >
          <option value="">All districts</option>
          {districtNames.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {noHealthCenter && (
          <button
            type="button"
            onClick={() => setNoHealthCenter(false)}
            className={`${V2_PILL} ${V2_PILL_AMBER} self-center`}
          >
            No health center ✕
          </button>
        )}
        {isFetching && !isLoading && <Loader2 className="w-4 h-4 animate-spin text-[#9AA3B2] self-center" />}
      </div>

      <div className={`${V2_CARD_SHELL} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={V2_TABLE_HEAD}>
              <tr>
                <th className="px-4 py-3 text-left">CHW</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Sex / Birth</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Health center</th>
                <th className="px-4 py-3 text-left">Mobile account</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={V2_TABLE_BODY}>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className={`${V2_BONE} h-3 w-44`} /></td>
                    <td className="px-4 py-3"><div className={`${V2_BONE} h-3 w-24`} /></td>
                    <td className="px-4 py-3"><div className={`${V2_BONE} h-3 w-20`} /></td>
                    <td className="px-4 py-3"><div className={`${V2_BONE} h-3 w-40`} /></td>
                    <td className="px-4 py-3"><div className={`${V2_BONE} h-3 w-28`} /></td>
                    <td className="px-4 py-3"><div className={`${V2_BONE} h-5 w-20 rounded-full`} /></td>
                    <td className="px-4 py-3"><div className={`${V2_BONE} h-7 w-16 ml-auto rounded-lg`} /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4">
                    <div className={V2_EMPTY}>
                      <ClipboardList size={40} className="mx-auto mb-3 text-[#C5D3E0]" />
                      <p className={`text-sm font-bold ${V2_STRONG}`}>No CHWs found</p>
                      <p className={`text-xs mt-1 ${V2_MUTED}`}>
                        {stats?.total ? "Try adjusting the search or filters" : "Import an Excel list or add CHWs one by one"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className={V2_TABLE_ROW}>
                    <td className="px-4 py-3">
                      <p className={`font-bold ${V2_STRONG}`}>{r.fullNames}</p>
                      <p className={`text-xs font-mono ${V2_MUTED}`}>{r.NID}</p>
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap ${r.phoneNumber ? V2_STRONG : V2_MUTED}`}>
                      {r.phoneNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className={V2_STRONG}>{r.gender ?? "—"}</p>
                      <p className={`text-xs ${V2_MUTED}`}>{r.birthdate ? formatDate(r.birthdate) : "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className={V2_STRONG}>{[r.sector, r.cell, r.village].filter(Boolean).join(" › ") || "—"}</p>
                      <p className={`text-xs ${V2_MUTED}`}>{r.district}</p>
                    </td>
                    <td className="px-4 py-3">
                      {r.healthCenter ? (
                        <span className={V2_STRONG}>{r.healthCenter.name}</span>
                      ) : (
                        <span className={`${V2_PILL} ${V2_PILL_GRAY}`}>Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.hasAccount ? (
                        <span className={`${V2_PILL} ${V2_PILL_GREEN}`}>
                          <Smartphone className="w-3 h-3" />
                          Signed up
                        </span>
                      ) : (
                        <span className={`${V2_PILL} ${V2_PILL_AMBER}`}>Not yet</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className={`${V2_BTN_SECONDARY} px-2.5 py-1.5`}
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(r)}
                          className={`${V2_BTN_SECONDARY} px-2.5 py-1.5 text-red-500 hover:text-red-600`}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(51,99,173,0.12)] dark:border-slate-700 bg-[#F8FAFC] dark:bg-slate-800/60">
            <p className={`text-xs ${V2_MUTED}`}>
              Showing{" "}
              <span className={`font-bold ${V2_STRONG}`}>
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)}
              </span>{" "}
              of <span className={`font-bold ${V2_STRONG}`}>{total.toLocaleString()}</span>
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

      <ChwRegistryFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        entry={editing}
        onSubmit={handleSave}
      />

      <ChwRegistryImportDialog isOpen={importOpen} onClose={() => setImportOpen(false)} onImported={invalidate} />

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => !remove.isLoading && setDeleteTarget(null)}
        title="Remove CHW from registry"
        centered
      >
        <div className="space-y-5">
          <p className={`text-sm ${V2_MUTED}`}>
            Remove <span className={`font-bold ${V2_STRONG}`}>{deleteTarget?.fullNames}</span> ({deleteTarget?.NID})?
            {deleteTarget?.hasAccount
              ? " Their mobile account is not affected."
              : " They will no longer be recognised when signing up with this NID."}
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
              {remove.isLoading ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
