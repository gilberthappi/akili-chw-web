import { useState, useCallback, Fragment, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Search,
  MapPin,
  Phone,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  AlertTriangle,
  ArrowUpDown,
  Calendar,
  UserCheck,
  Network,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { V2PageHeader, V2Tabs, V2SearchInput } from "@/components/v2/V2Page";
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
  V2_STRONG,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import { Dialog, Transition } from "@headlessui/react";
import { debounce } from "lodash";
import toast from "react-hot-toast";
import {
  adminGetAllGroups,
  adminPromoteToCEHO,
  adminCheckHospitalConflict,
  adminUpdateGroup,
  adminDeleteGroup,
  PromoteToCEHOResult,
} from "@/services/cehoGroup.service";
import { getAllStudentsNoPagination, IStudent } from "@/services/students.service";
import {
  getDistrictOptions,
  getSectorOptions,
  getCellOptions,
  getVillageOptions,
} from "@/hooks/locations";
import { ICEHOGroup } from "@/types";

import { Button } from "@/components/common/Button";
import StudentsList from "@/components/students/StudentList";
import StudentStatsCards from "@/components/students/StudentStatsCards";
import CreateLearnerButton from "@/components/students/CreateLearnerButton";
import { useAuth } from "@/hooks/useAuth";
import { CHW_WRITE_ROLES } from "@/utils/roles";
import { StudyTimeOverviewWidgetV2 } from "@/components/dashboard/v2/widgets/admin/StudyTimeOverviewWidgetV2";

type TabId = "students" | "ceho" | "ceho-group" | "learning-time";

const TAB_ICONS: Record<TabId, LucideIcon> = {
  students: Users,
  ceho: UserCheck,
  "ceho-group": Network,
  "learning-time": Clock,
};

/* ─── Avatar ─────────────────────────────────────────────────────────────── */
const Avatar = ({ name, photo, size = "w-9 h-9" }: { name: string; photo: string | null; size?: string }) => {
  const [failed, setFailed] = useState(false);
  const initials = name?.substring(0, 2).toUpperCase() ?? "??";
  if (photo && !failed) {
    return <img src={photo} alt={name} className={`${size} rounded-full object-cover shrink-0`} onError={() => setFailed(true)} />;
  }
  return (
    <div className={`${size} rounded-full bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center text-sm font-bold shrink-0`}>
      {initials}
    </div>
  );
};

/* ─── CHW combobox picker ────────────────────────────────────────────────── */
const CHWCombobox = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: IStudent | null;
  onChange: (student: IStudent | null) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  const debouncedSet = useCallback(debounce((v: string) => setDebounced(v), 350), []);

  const { data: resp, isFetching } = useQuery({
    queryKey: ["chw-picker", debounced],
    queryFn: () =>
      getAllStudentsNoPagination(
        debounced
          ? `?role=TRAINEE&searchq=${encodeURIComponent(debounced)}`
          : "?role=TRAINEE",
      ),
    enabled: isOpen,
  });

  const all: IStudent[] = resp?.data ?? [];
  const students = search ? all : all.slice(0, 10);

  const handleContainerBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // Close only when focus leaves this container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-1" onBlur={handleContainerBlur}>
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <div className="relative">
        {isOpen ? (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            {isFetching && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-[#3363AD]/30 border-t-[#3363AD] rounded-full animate-spin" />
            )}
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); debouncedSet(e.target.value); }}
              placeholder="Search CHW by name…"
              className="w-full pl-8 pr-8 py-2 border border-[#3363AD] ring-2 ring-[#3363AD]/30 rounded-lg text-sm focus:outline-none bg-white"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 hover:border-gray-300 rounded-lg text-sm focus:outline-none bg-white text-left transition-colors"
          >
            {value ? (
              <span className="flex items-center gap-2 min-w-0">
                <Avatar name={value.fullName} photo={null} size="w-6 h-6" />
                <span className="truncate font-medium text-gray-800">{value.fullName}</span>
              </span>
            ) : (
              <span className="text-gray-400">Select a CHW…</span>
            )}
            <span className="flex items-center gap-1 shrink-0 ml-2">
              {value && (
                <span
                  role="button"
                  tabIndex={0}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => { e.stopPropagation(); onChange(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange(null); } }}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </span>
          </button>
        )}

        {isOpen && (
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
            <div className="max-h-48 overflow-y-auto">
              {!isFetching && students.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-5">
                  {search ? "No CHWs match your search." : "No CHWs available."}
                </p>
              )}
              {isFetching && students.length === 0 && (
                <div className="flex justify-center py-5">
                  <div className="w-5 h-5 border-2 border-[#3363AD]/30 border-t-[#3363AD] rounded-full animate-spin" />
                </div>
              )}
              {students.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(s);
                    setIsOpen(false);
                    setSearch("");
                    setDebounced("");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors"
                >
                  <Avatar name={s.fullName} photo={null} size="w-8 h-8" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{s.fullName}</p>
                    {s.phoneNumber && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />{s.phoneNumber}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Create Group Modal ─────────────────────────────────────────────────── */
const selectCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD] bg-white disabled:bg-gray-50 disabled:text-gray-400";

const CreateGroupModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [cell, setCell] = useState("");
  const [village, setVillage] = useState("");
  const [description, setDescription] = useState("");
  const [cehoStudent, setCehoStudent] = useState<IStudent | null>(null);

  // Checked as soon as a CHW is picked, so the modal shows the right state
  // (plain create vs. replace-warning) before the admin clicks anything.
  const { data: conflictCheck, isFetching: isCheckingConflict } = useQuery({
    queryKey: ["promote-conflict-check", cehoStudent?.userId],
    queryFn: () => adminCheckHospitalConflict(cehoStudent!.userId),
    enabled: !!cehoStudent,
    staleTime: 0,
  });
  const existingCeho = conflictCheck?.existingCeho ?? null;

  const districtOpts = getDistrictOptions();
  const sectorOpts = district ? getSectorOptions(district) : [];
  const cellOpts = sector ? getCellOptions(sector) : [];
  const villageOpts = cell ? getVillageOptions(cell) : [];

  const handleDistrictChange = (v: string) => { setDistrict(v); setSector(""); setCell(""); setVillage(""); };
  const handleSectorChange = (v: string) => { setSector(v); setCell(""); setVillage(""); };
  const handleCellChange = (v: string) => { setCell(v); setVillage(""); };

  const handleCHWSelect = (s: IStudent | null) => {
    setCehoStudent(s);
    if (s) {
      setDistrict(s.district ?? "");
      setSector(s.sector ?? "");
      setCell(s.cell ?? "");
      setVillage(s.village ?? "");
    } else {
      setDistrict(""); setSector(""); setCell(""); setVillage("");
    }
  };

  const resetForm = () => {
    setDistrict(""); setSector(""); setCell(""); setVillage("");
    setDescription(""); setCehoStudent(null);
  };

  const { mutate, isPending } = useMutation<PromoteToCEHOResult, unknown, boolean | undefined>({
    mutationFn: (confirmReplace = false) => adminPromoteToCEHO(cehoStudent!.userId, confirmReplace),
    onSuccess: async (result) => {
      if (result.conflict) {
        // The pre-check was stale — refresh it and let the admin re-click.
        queryClient.invalidateQueries({ queryKey: ["promote-conflict-check", cehoStudent?.userId] });
        toast.error(`${result.existingCeho.fullNames} is now the CEHO here — please try again.`);
        return;
      }

      const hasLocation = district || sector || cell || village;
      if (hasLocation || description.trim()) {
        await adminUpdateGroup(result.group.id, {
          district: district || undefined,
          sectors: sector ? [sector] : undefined,
          cells: cell ? [cell] : undefined,
          villages: village ? [village] : undefined,
          cell: cell || undefined,
          village: village || undefined,
          description: description.trim() || undefined,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-ceho-groups"] });
      toast.success("CEHO group created successfully.");
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Failed to create group.");
    },
  });

  const canSubmit = cehoStudent && !isPending && !isCheckingConflict;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => { if (!isPending) { onClose(); resetForm(); } }}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-5 my-auto">
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-900">Create CEHO Group</Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 mt-0.5">
                  The selected CHW will be promoted to CEHO and assigned to lead the group.
                  The group is automatically named after the CHW's healthCenter.
                </Dialog.Description>
              </div>

              {existingCeho && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">{existingCeho.fullNames}</span> is already the CEHO
                    at this healthCenter. Continuing will demote them to CHW and hand them this same team.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {/* CHW combobox */}
                <CHWCombobox
                  label="Community Health Worker (CHW) *"
                  value={cehoStudent}
                  onChange={handleCHWSelect}
                />

                {/* Location cascade */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Area (optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select value={district} onChange={(e) => handleDistrictChange(e.target.value)} className={selectCls}>
                      <option value="">District</option>
                      {districtOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                    <select value={sector} onChange={(e) => handleSectorChange(e.target.value)} disabled={!district} className={selectCls}>
                      <option value="">Sector</option>
                      {sectorOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                    <select value={cell} onChange={(e) => handleCellChange(e.target.value)} disabled={!sector} className={selectCls}>
                      <option value="">Cell</option>
                      {cellOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                    <select value={village} onChange={(e) => setVillage(e.target.value)} disabled={!cell} className={selectCls}>
                      <option value="">Village</option>
                      {villageOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Description (optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Brief description…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD] resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => { resetForm(); onClose(); }} disabled={isPending}>Cancel</Button>
                <Button
                  size="sm"
                  className={`flex-1 ${existingCeho ? "!bg-amber-500 hover:!bg-amber-600" : ""}`}
                  onClick={() => mutate(!!existingCeho)}
                  disabled={!canSubmit}
                  isLoading={isPending}
                >
                  {!isPending && !existingCeho && <Plus className="w-3.5 h-3.5 mr-1.5" />}
                  {existingCeho ? "Replace CEHO" : "Create Group"}
                </Button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

/* ─── Main page ──────────────────────────────────────────────────────────── */
const StudentsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();

  const isAdminOrStaff = hasRole(["ADMIN", "STAFF"]);
  const canManageCHWs = hasRole(CHW_WRITE_ROLES);

  const allTabs: { id: TabId; label: string; adminOnly: boolean }[] = [
    { id: "students", label: "CHW", adminOnly: false },
    { id: "ceho", label: "CEHO", adminOnly: true },
    { id: "ceho-group", label: "CEHO Groups", adminOnly: true },
    { id: "learning-time", label: "Learning time", adminOnly: false },
  ];

  const visibleTabs = allTabs.filter((t) => !t.adminOnly || isAdminOrStaff);

  const [activeTab, setActiveTab] = useState<TabId>("students");
  const [showCreate, setShowCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ICEHOGroup | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ceho-groups"],
    queryFn: () => adminGetAllGroups(100, 0),
    enabled: isAdminOrStaff && activeTab === "ceho-group",
  });

  const groups = data?.groups ?? [];

  // ── Group list filters / sorting / pagination ────────────────────────────
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSort, setGroupSort] = useState<"newest" | "oldest" | "a-z" | "z-a" | "date-range">("newest");
  const [groupDateFrom, setGroupDateFrom] = useState("");
  const [groupDateTo, setGroupDateTo] = useState("");
  const [groupPage, setGroupPage] = useState(1);
  const GROUP_PAGE_SIZE = 7;

  const filteredGroups = useMemo(() => {
    let result = [...groups];
    if (groupSearch.trim()) {
      const q = groupSearch.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.ceho?.user?.fullNames ?? "").toLowerCase().includes(q) ||
          (g.sectors ?? []).some((s) => s.toLowerCase().includes(q)),
      );
    }
    if (groupSort === "date-range") {
      if (groupDateFrom) result = result.filter((g) => new Date(g.createdAt) >= new Date(groupDateFrom));
      if (groupDateTo) {
        const to = new Date(groupDateTo);
        to.setHours(23, 59, 59, 999);
        result = result.filter((g) => new Date(g.createdAt) <= to);
      }
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      result.sort((a, b) => {
        if (groupSort === "a-z") return a.name.localeCompare(b.name);
        if (groupSort === "z-a") return b.name.localeCompare(a.name);
        if (groupSort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    return result;
  }, [groups, groupSearch, groupSort, groupDateFrom, groupDateTo]);

  const groupTotalPages = Math.max(1, Math.ceil(filteredGroups.length / GROUP_PAGE_SIZE));
  const pagedGroups = filteredGroups.slice((groupPage - 1) * GROUP_PAGE_SIZE, groupPage * GROUP_PAGE_SIZE);

  const groupPaginationRange = (): (number | "...")[] => {
    if (groupTotalPages <= 7) return Array.from({ length: groupTotalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (groupPage > 3) pages.push("...");
    for (let i = Math.max(2, groupPage - 1); i <= Math.min(groupTotalPages - 1, groupPage + 1); i++) pages.push(i);
    if (groupPage < groupTotalPages - 2) pages.push("...");
    pages.push(groupTotalPages);
    return pages;
  };

  const { mutate: deleteGroup, isPending: isDeleting } = useMutation({
    mutationFn: (groupId: string) => adminDeleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ceho-groups"] });
      toast.success("Group deleted.");
      setPendingDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Failed to delete group.");
    },
  });

  const skeletons = (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className={`${V2_CARD_SHELL} h-40 p-4`}>
          <div className={`${V2_BONE} h-full w-full rounded-xl`} />
        </div>
      ))}
    </div>
  );

  return (
    <div className={V2_PAGE_CANVAS}>
      <V2PageHeader
        title="CHW & CEHO"
        subtitle="Manage Community Health Workers, Officers, and their groups"
        actions={
          <>
            <V2Tabs
              items={visibleTabs.map((t) => ({ key: t.id, label: t.label, Icon: TAB_ICONS[t.id] }))}
              active={activeTab}
              onChange={setActiveTab}
            />
            {activeTab === "students" && canManageCHWs && <CreateLearnerButton role="TRAINEE" />}
            {activeTab === "ceho-group" && isAdminOrStaff && (
              <button type="button" className={V2_BTN_PRIMARY} onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" />
                New Group
              </button>
            )}
          </>
        }
      />

      {/* CHW tab */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <StudentStatsCards roleFilter="TRAINEE" />
          <StudentsList hideHeader={true} roleFilter="TRAINEE" />
        </div>
      )}

      {/* CEHO tab */}
      {activeTab === "ceho" && isAdminOrStaff && (
        <div className="space-y-4">
          <StudentStatsCards roleFilter="CEHO" />
          <StudentsList hideHeader={true} roleFilter="CEHO" />
        </div>
      )}

      {activeTab === "learning-time" && <StudyTimeOverviewWidgetV2 />}

      {/* CEHO GROUP tab */}
      {activeTab === "ceho-group" && isAdminOrStaff && (
        <>
          {isLoading ? (
            skeletons
          ) : groups.length === 0 ? (
            <div className={`${V2_CARD_SHELL} flex flex-col items-center justify-center py-20 gap-3 text-center`}>
              <div className="w-16 h-16 rounded-2xl bg-[#EBF0F9] dark:bg-slate-700 flex items-center justify-center">
                <Users className="w-8 h-8 text-[#3363AD]/40" />
              </div>
              <p className={`font-bold ${V2_STRONG}`}>No CEHO groups yet</p>
              <p className={`text-sm ${V2_MUTED}`}>Click "New Group" to create the first one, or promote a CHW to CEHO.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* ── Toolbar ─────────────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row gap-3">
                <V2SearchInput
                  className="flex-1"
                  value={groupSearch}
                  onChange={(v) => { setGroupSearch(v); setGroupPage(1); }}
                  placeholder="Search groups, CEHO name, or location…"
                />
                {/* Sort */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <ArrowUpDown className="w-4 h-4 text-[#9AA3B2] shrink-0" />
                  <select
                    value={groupSort}
                    onChange={(e) => { setGroupSort(e.target.value as typeof groupSort); setGroupPage(1); }}
                    className={`text-sm px-3 py-2 ${V2_INPUT}`}
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="a-z">Name A → Z</option>
                    <option value="z-a">Name Z → A</option>
                    <option value="date-range">Date range</option>
                  </select>
                  {groupSort === "date-range" && (
                    <>
                      <input
                        type="date"
                        value={groupDateFrom}
                        onChange={(e) => { setGroupDateFrom(e.target.value); setGroupPage(1); }}
                        className={`text-sm px-3 py-2 ${V2_INPUT}`}
                      />
                      <span className={`text-sm ${V2_MUTED}`}>to</span>
                      <input
                        type="date"
                        value={groupDateTo}
                        onChange={(e) => { setGroupDateTo(e.target.value); setGroupPage(1); }}
                        className={`text-sm px-3 py-2 ${V2_INPUT}`}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Result count */}
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#9AA3B2]">
                {filteredGroups.length} group{filteredGroups.length !== 1 ? "s" : ""}{groupSearch.trim() ? " found" : " total"}
              </p>

              {filteredGroups.length === 0 ? (
                <div className={`${V2_EMPTY} flex flex-col items-center gap-3`}>
                  <div className="w-12 h-12 rounded-xl bg-[#EBF0F9] dark:bg-slate-700 flex items-center justify-center">
                    <Search className="w-5 h-5 text-[#3363AD]/50" />
                  </div>
                  <p className={`font-medium text-sm ${V2_MUTED}`}>No groups match your search</p>
                </div>
              ) : (
                <>
                  {/* ── Grid ──────────────────────────────────────────────── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pagedGroups.map((group) => {
                      const memberCount = (group._count?.members ?? 0) + (group.ceho?.user ? 1 : 0);
                      return (
                        <div
                          key={group.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/admin/ceho-groups/${group.id}`)}
                          onKeyDown={(e) => e.key === "Enter" && navigate(`/admin/ceho-groups/${group.id}`)}
                          className={`group ${V2_CARD_SHELL} p-5 flex flex-col gap-4 hover:border-[#3363AD]/50 transition-colors cursor-pointer`}
                        >
                          {/* Icon + name */}
                          <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-[12px] bg-[#EBF0F9] dark:bg-slate-700 flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5 text-[#3363AD] dark:text-blue-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold truncate group-hover:text-[#3363AD] transition-colors ${V2_STRONG}`}>{group.name}</p>
                              {group.ceho?.user && (
                                <p className={`text-xs mt-0.5 truncate ${V2_MUTED}`}>CEHO: {group.ceho.user.fullNames}</p>
                              )}
                            </div>
                          </div>

                          {/* Meta */}
                          <div className={`flex flex-col gap-1.5 text-xs ${V2_MUTED}`}>
                            {(group.sectors?.length ?? 0) > 0 && (
                              <p className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 shrink-0 text-[#9AA3B2]" />
                                {group.sectors!.join(", ")}
                              </p>
                            )}
                            <p className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 shrink-0 text-[#9AA3B2]" />
                              {memberCount} member{memberCount !== 1 ? "s" : ""}
                            </p>
                            <p className="flex items-center gap-1.5 text-[#9AA3B2]">
                              <Calendar className="w-3.5 h-3.5 shrink-0" />
                              {new Date(group.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-3 border-t border-[#E8EEF4] dark:border-slate-700">
                            <span className="text-xs font-semibold text-[#3363AD] flex items-center gap-1">
                              Manage <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setPendingDelete(group); }}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete group"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Pagination ─────────────────────────────────────────── */}
                  {groupTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setGroupPage((p) => Math.max(1, p - 1))}
                        disabled={groupPage === 1}
                        className="p-2 rounded-lg border border-[#B8CDE0] dark:border-slate-600 text-[#5B6575] dark:text-slate-300 hover:bg-[#EBF0F9] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {groupPaginationRange().map((p, i) =>
                        p === "..." ? (
                          <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm select-none">…</span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setGroupPage(p as number)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                              groupPage === p
                                ? "bg-[#3363AD] text-white"
                                : "border border-[#B8CDE0] dark:border-slate-600 text-[#5B6575] dark:text-slate-300 hover:bg-[#EBF0F9] dark:hover:bg-slate-700"
                            }`}
                          >
                            {p}
                          </button>
                        ),
                      )}
                      <button
                        type="button"
                        onClick={() => setGroupPage((p) => Math.min(groupTotalPages, p + 1))}
                        disabled={groupPage === groupTotalPages}
                        className="p-2 rounded-lg border border-[#B8CDE0] dark:border-slate-600 text-[#5B6575] dark:text-slate-300 hover:bg-[#EBF0F9] dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} />

      {/* Delete confirmation */}
      <Transition appear show={!!pendingDelete} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isDeleting && setPendingDelete(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className={`w-full max-w-sm ${V2_CARD_SHELL} p-6`}>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <Dialog.Title className={`text-lg font-bold ${V2_STRONG}`}>Delete Group</Dialog.Title>
                    <Dialog.Description className={`text-sm mt-1 ${V2_MUTED}`}>
                      Delete <span className={`font-semibold ${V2_STRONG}`}>{pendingDelete?.name}</span>?
                      This removes all members and revokes the CEHO role. Cannot be undone.
                    </Dialog.Description>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button type="button" className={`${V2_BTN_SECONDARY} flex-1`} onClick={() => setPendingDelete(null)} disabled={isDeleting}>Cancel</button>
                  <button type="button" className={`${V2_BTN_DANGER} flex-1`} onClick={() => pendingDelete && deleteGroup(pendingDelete.id)} disabled={isDeleting}>
                    <Trash2 className="w-3.5 h-3.5" />
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default StudentsPage;
