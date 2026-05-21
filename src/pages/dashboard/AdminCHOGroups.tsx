import { useState, useCallback, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Search,
  MapPin,
  Phone,
  Trash2,
  UserPlus,
  ChevronRight,
  X,
} from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { debounce } from "lodash";
import toast from "react-hot-toast";
import {
  adminGetAllGroups,
  adminCreateGroup,
  adminGetGroupById,
  adminAddMember,
  adminRemoveMember,
  ICHOGroupDetail,
} from "@/services/choGroup.service";
import { getAllStudentsNoPagination, IStudent } from "@/services/students.service";
import { ICHOGroup } from "@/types";
import { Button } from "@/components/common/Button";

/* ─── Shared avatar ─────────────────────────────────────────────────────── */
const Avatar = ({ name, photo, size = "w-9 h-9" }: { name: string; photo: string | null; size?: string }) => {
  const [failed, setFailed] = useState(false);
  const initials = name?.substring(0, 2).toUpperCase() ?? "??";
  if (photo && !failed) {
    return (
      <img src={photo} alt={name} className={`${size} rounded-full object-cover shrink-0`} onError={() => setFailed(true)} />
    );
  }
  return (
    <div className={`${size} rounded-full bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center text-sm font-bold shrink-0`}>
      {initials}
    </div>
  );
};

/* ─── Student search input used inside both modals ──────────────────────── */
const StudentSearchPicker = ({
  label,
  placeholder,
  onSelect,
}: {
  label: string;
  placeholder: string;
  onSelect: (student: IStudent) => void;
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
    queryKey: ["student-search-admin", debounced],
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
      <label className="text-xs font-semibold text-gray-600">{label}</label>
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
          <button
            type="button"
            onClick={() => { setSelected(null); setTerm(""); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {debounced.length > 1 && results.length > 0 && !selected && (
        <div className="border border-gray-100 rounded-lg shadow-lg bg-white max-h-44 overflow-y-auto">
          {results.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => pick(s)}
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
    mutationFn: () =>
      adminCreateGroup({
        name,
        choStudentId: choStudent!.id,
        sector: sector || undefined,
        description: description || undefined,
      }),
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
                <Dialog.Description className="text-sm text-gray-500 mt-0.5">
                  Assign a CHO and name a new group.
                </Dialog.Description>
              </div>

              {/* Fields */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Group Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kigali North Group"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD]"
                  />
                </div>

                <StudentSearchPicker
                  label="Community Health Officer (CHO) *"
                  placeholder="Search CHO by name…"
                  onSelect={setChoStudent}
                />

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Sector (optional)</label>
                  <input
                    type="text"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="e.g. Nyarugenge"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">Description (optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Brief description of this group's area or purpose…"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD] resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" size="sm" className="flex-1" onClick={onClose} disabled={isPending}>
                  Cancel
                </Button>
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

/* ─── Manage Group Modal ─────────────────────────────────────────────────── */
const ManageGroupModal = ({
  group,
  onClose,
}: {
  group: ICHOGroup | null;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const [addStudent, setAddStudent] = useState<IStudent | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: detail, isLoading } = useQuery<ICHOGroupDetail>({
    queryKey: ["admin-cho-group-detail", group?.id],
    queryFn: () => adminGetGroupById(group!.id),
    enabled: !!group,
  });

  const { mutate: addMember, isPending: isAdding } = useMutation({
    mutationFn: () => adminAddMember(group!.id, addStudent!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cho-group-detail", group?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-cho-groups"] });
      toast.success("CHW added to group.");
      setAddStudent(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Failed to add member.");
    },
  });

  const { mutate: removeMember, isPending: isRemoving } = useMutation({
    mutationFn: (studentId: string) => adminRemoveMember(group!.id, studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cho-group-detail", group?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-cho-groups"] });
      toast.success("CHW removed from group.");
      setRemovingId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Failed to remove member.");
      setRemovingId(null);
    },
  });

  const members = detail?.members ?? [];

  return (
    <Transition appear show={!!group} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <Dialog.Title className="text-lg font-bold text-gray-900">{group?.name}</Dialog.Title>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      {group?.cho?.user && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" /> CHO: {group.cho.user.fullNames}
                        </p>
                      )}
                      {group?.sector && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {group.sector}
                        </p>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body (scrollable) */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                {/* Add CHW */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#3363AD]" /> Add CHW
                  </h3>
                  <StudentSearchPicker
                    label=""
                    placeholder="Search CHW by name…"
                    onSelect={setAddStudent}
                  />
                  {addStudent && (
                    <Button size="sm" onClick={() => addMember()} isLoading={isAdding} disabled={isAdding}>
                      {!isAdding && <UserPlus className="w-3.5 h-3.5 mr-1.5" />}
                      Add {addStudent.fullName}
                    </Button>
                  )}
                </div>

                {/* Members list */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Members{" "}
                    <span className="text-xs font-normal text-gray-400">({members.length})</span>
                  </h3>

                  {isLoading ? (
                    <div className="space-y-2 animate-pulse">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-14 bg-gray-100 rounded-xl" />
                      ))}
                    </div>
                  ) : members.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center gap-2">
                      <Users className="w-8 h-8 text-gray-300" />
                      <p className="text-sm text-gray-400">No members yet</p>
                    </div>
                  ) : (
                    members.map((m) => {
                      const isBeingRemoved = removingId === m.studentId && isRemoving;
                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <Avatar name={m.student.user.fullNames} photo={m.student.user.photo} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{m.student.user.fullNames}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                              {m.student.user.phoneNumber && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />{m.student.user.phoneNumber}
                                </p>
                              )}
                              {m.student.user.district && (
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />{m.student.user.district}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isRemoving}
                            onClick={() => {
                              setRemovingId(m.studentId);
                              removeMember(m.studentId);
                            }}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                            title="Remove from group"
                          >
                            {isBeingRemoved ? (
                              <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

/* ─── Main page ──────────────────────────────────────────────────────────── */
const AdminCHOGroupsPage = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [managingGroup, setManagingGroup] = useState<ICHOGroup | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-cho-groups"],
    queryFn: () => adminGetAllGroups(100, 0),
  });

  const groups = data?.groups ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-[#333333]">CHO Groups</h2>
          <p className="text-sm text-gray-500">
            Create groups, assign CHOs, and manage CHW membership.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          New Group
        </Button>
      </div>

      {/* Groups */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#EBF0F9] flex items-center justify-center">
            <Users className="w-8 h-8 text-[#3363AD]/40" />
          </div>
          <p className="text-gray-600 font-semibold">No CHO groups yet</p>
          <p className="text-gray-400 text-sm">Click "New Group" to create the first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 rounded-xl bg-[#EBF0F9] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#3363AD]" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{group.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                  {group.cho?.user && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      CHO: {group.cho.user.fullNames}
                    </p>
                  )}
                  {group.sector && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {group.sector}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {group._count?.members ?? 0} member{group._count?.members !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setManagingGroup(group)}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#3363AD] hover:underline shrink-0"
              >
                Manage <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateGroupModal open={showCreate} onClose={() => setShowCreate(false)} />
      <ManageGroupModal group={managingGroup} onClose={() => setManagingGroup(null)} />
    </div>
  );
};

export default AdminCHOGroupsPage;
