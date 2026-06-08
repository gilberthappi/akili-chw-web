import { useState, useCallback, Fragment } from "react";
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
  X,
  AlertTriangle,
} from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { debounce } from "lodash";
import toast from "react-hot-toast";
import {
  adminGetAllGroups,
  adminCreateGroup,
  adminDeleteGroup,
} from "@/services/choGroup.service";
import { getAllStudentsNoPagination, IStudent } from "@/services/students.service";
import { ICHOGroup } from "@/types";

import { Button } from "@/components/common/Button";
import StudentsList from "@/components/students/StudentList";
import StudentStatsCards from "@/components/students/StudentStatsCards";
import { useAuth } from "@/hooks/useAuth";

type TabId = "students" | "testers" | "cho" | "cho-group";

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

/* ─── Student search picker ──────────────────────────────────────────────── */
const StudentSearchPicker = ({
  label,
  placeholder,
  onSelect,
  resetKey,
}: {
  label: string;
  placeholder: string;
  onSelect: (student: IStudent) => void;
  resetKey?: number;
}) => {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<IStudent | null>(null);

  const debouncedSet = useCallback(debounce((v: string) => setDebounced(v), 350), []);

  const handleChange = (v: string) => {
    setTerm(v);
    setSelected(null);
    debouncedSet(v);
  };

  const { data: resp, isFetching } = useQuery({
    queryKey: ["student-search-admin", debounced, resetKey],
    queryFn: () => getAllStudentsNoPagination(`?searchq=${encodeURIComponent(debounced)}`),
    enabled: debounced.length > 1,
  });

  const results: IStudent[] = resp?.data ?? [];

  const pick = (s: IStudent) => {
    setSelected(s);
    setTerm(s.fullName);
    setDebounced("");
    onSelect(s);
  };

  return (
    <div className="space-y-1">
      {label && <label className="text-xs font-semibold text-gray-600">{label}</label>}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          value={term}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD]"
        />
        {isFetching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[#3363AD]/30 border-t-[#3363AD] rounded-full animate-spin" />
        )}
        {selected && (
          <button type="button" onClick={() => { setSelected(null); setTerm(""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {debounced.length > 1 && results.length > 0 && !selected && (
        <div className="border border-gray-100 rounded-lg shadow-lg bg-white max-h-44 overflow-y-auto z-10 relative">
          {results.map((s) => (
            <button key={s.id} type="button" onClick={() => pick(s)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors">
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
      )}
      {debounced.length > 1 && results.length === 0 && !isFetching && (
        <p className="text-xs text-gray-400 px-1">No results found.</p>
      )}
    </div>
  );
};

/* ─── Create Group Modal ─────────────────────────────────────────────────── */
const CreateGroupModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [description, setDescription] = useState("");
  const [choStudent, setChoStudent] = useState<IStudent | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => adminCreateGroup({ name, choStudentId: choStudent!.id, sector: sector || undefined, description: description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cho-groups"] });
      toast.success("CHO group created successfully.");
      setName(""); setSector(""); setDescription(""); setChoStudent(null);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Failed to create group.");
    },
  });

  const canSubmit = name.trim() && choStudent && !isPending;

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => !isPending && onClose()}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-5">
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-900">Create CHO Group</Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 mt-0.5">Assign a CHO and name a new group.</Dialog.Description>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Group Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kigali North Group" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD]" />
                </div>
                <StudentSearchPicker label="Community Health Officer (CHO) *" placeholder="Search CHO by name…" onSelect={setChoStudent} />
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Sector (optional)</label>
                  <input type="text" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. Nyarugenge" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD]" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Description (optional)</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief description…" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD] resize-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" className="flex-1" onClick={onClose} disabled={isPending}>Cancel</Button>
                <Button size="sm" className="flex-1" onClick={() => mutate()} disabled={!canSubmit} isLoading={isPending}>
                  {!isPending && <Plus className="w-3.5 h-3.5 mr-1.5" />}
                  Create Group
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

  const allTabs: { id: TabId; label: string; adminOnly: boolean }[] = [
    { id: "students", label: "CHW", adminOnly: false },
    { id: "testers", label: "Testers", adminOnly: false },
    { id: "cho", label: "CHO", adminOnly: true },
    { id: "cho-group", label: "CHO GROUP", adminOnly: true },
  ];

  const visibleTabs = allTabs.filter((t) => !t.adminOnly || isAdminOrStaff);

  const [activeTab, setActiveTab] = useState<TabId>("students");
  const [showCreate, setShowCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ICHOGroup | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-cho-groups"],
    queryFn: () => adminGetAllGroups(100, 0),
    enabled: isAdminOrStaff,
  });

  const groups = data?.groups ?? [];

  const { mutate: deleteGroup, isPending: isDeleting } = useMutation({
    mutationFn: (groupId: string) => adminDeleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cho-groups"] });
      toast.success("Group deleted.");
      setPendingDelete(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Failed to delete group.");
    },
  });

  const skeletons = (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-[#333333]">CHW & CHO</h2>
          <p className="text-sm text-gray-500">
            Manage Community Health Workers, Testers, Officers, and their groups.
          </p>
        </div>
        {activeTab === "cho-group" && isAdminOrStaff && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Group
          </Button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm border border-gray-100">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-[#3363AD] text-white shadow-sm"
                : "text-gray-600 hover:text-[#3363AD]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CHW tab */}
      {activeTab === "students" && (
        <div className="space-y-6">
          <StudentStatsCards roleFilter="TRAINEE" />
          <StudentsList hideHeader={true} roleFilter="TRAINEE" />
        </div>
      )}

      {/* Testers tab */}
      {activeTab === "testers" && (
        <div className="space-y-6">
          <StudentStatsCards roleFilter="TESTER" />
          <StudentsList hideHeader={true} roleFilter="TESTER" />
        </div>
      )}

      {/* CHO tab */}
      {activeTab === "cho" && isAdminOrStaff && (
        <div className="space-y-6">
          <StudentStatsCards roleFilter="CHO" />
          <StudentsList hideHeader={true} roleFilter="CHO" />
        </div>
      )}

      {/* CHO GROUP tab */}
      {activeTab === "cho-group" && isAdminOrStaff && (
        <>
          {isLoading ? (
            skeletons
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#EBF0F9] flex items-center justify-center">
                <Users className="w-8 h-8 text-[#3363AD]/40" />
              </div>
              <p className="text-gray-600 font-semibold">No CHO groups yet</p>
              <p className="text-gray-400 text-sm">Click "New Group" to create the first one, or promote a CHW to CHO.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => (
                <div key={group.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-[#EBF0F9] flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-[#3363AD]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{group.name}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                      {group.cho?.user && (
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Users className="w-3 h-3" />CHO: {group.cho.user.fullNames}</p>
                      )}
                      {group.sector && (
                        <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{group.sector}</p>
                      )}
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {(group._count?.members ?? 0) + (group.cho?.user ? 1 : 0)} member{(group._count?.members ?? 0) + (group.cho?.user ? 1 : 0) !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => navigate(`/admin/cho-groups/${group.id}`)} className="flex items-center gap-1.5 text-sm font-semibold text-[#3363AD] hover:underline">
                      Manage <ChevronRight className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setPendingDelete(group)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete group">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
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
              <Dialog.Panel className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <Dialog.Title className="text-lg font-bold text-gray-900">Delete Group</Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-500 mt-1">
                      Delete <span className="font-semibold text-gray-800">{pendingDelete?.name}</span>?
                      This removes all members and revokes the CHO role. Cannot be undone.
                    </Dialog.Description>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button variant="ghost" size="sm" className="flex-1" onClick={() => setPendingDelete(null)} disabled={isDeleting}>Cancel</Button>
                  <Button size="sm" className="flex-1 !bg-red-500 hover:!bg-red-600" onClick={() => pendingDelete && deleteGroup(pendingDelete.id)} isLoading={isDeleting}>
                    {!isDeleting && <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
                    Delete
                  </Button>
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
