import { useState, useCallback, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  UserPlus,
  MapPin,
  Phone,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { debounce } from "lodash";
import toast from "react-hot-toast";
import { searchCHWCandidates, cehoDirectlyAddMember } from "@/services/cehoGroup.service";
import { IStudentSearchResult } from "@/types";
import { Button } from "@/components/common/Button";
import {
  V2_CARD_SHELL_PADDED,
  V2_INPUT,
  V2_MUTED,
  V2_PAGE_CANVAS,
  V2_PAGE_SUBTITLE,
  V2_PAGE_TITLE,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

const StudentAvatar = ({ name, photo }: { name: string; photo: string | null }) => {
  const [failed, setFailed] = useState(false);
  const initials = name?.substring(0, 2).toUpperCase() ?? "??";
  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={name}
        className="w-10 h-10 rounded-full object-cover shrink-0"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center text-sm font-bold shrink-0">
      {initials}
    </div>
  );
};

const CEHOGroupInvitePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pendingStudent, setPendingStudent] = useState<IStudentSearchResult | null>(null);
  const queryClient = useQueryClient();

  const debouncedSetSearch = useCallback(
    debounce((val: string) => setDebouncedSearch(val), 400),
    [],
  );

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    debouncedSetSearch(val);
  };

  const { data: students = [], isLoading, isFetching } = useQuery({
    queryKey: ["ceho-chw-candidates", debouncedSearch],
    queryFn: () => searchCHWCandidates(debouncedSearch || undefined),
  });

  const { mutate: addMember, isPending } = useMutation({
    mutationFn: (studentId: string) => cehoDirectlyAddMember(studentId),
    onSuccess: (_, studentId) => {
      setAddedIds((prev) => new Set([...prev, studentId]));
      setPendingStudent(null);
      queryClient.invalidateQueries({ queryKey: ["ceho-group-members"] });
      queryClient.invalidateQueries({ queryKey: ["ceho-chw-candidates"] });
      toast.success("CHW added to your group successfully.");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? "Failed to add CHW.";
      toast.error(msg);
    },
  });

  const handleAdd = (student: IStudentSearchResult) => {
    if (addedIds.has(student.id)) return;
    setPendingStudent(student);
  };

  const confirmAdd = () => {
    if (pendingStudent) addMember(pendingStudent.id);
  };

  return (
    <div className={V2_PAGE_CANVAS}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/ceho-group"
            className="p-2 rounded-xl hover:bg-[#EBF0F9] dark:hover:bg-slate-700 transition-colors text-[#5B6575] dark:text-slate-400"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-1">
            <h2 className={V2_PAGE_TITLE}>Add CHW</h2>
            <p className={V2_PAGE_SUBTITLE}>
              Suggestions from your area — or search by name/phone to find anyone.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3B2]" />
        <input
          type="text"
          placeholder="Filter by name or phone number…"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className={`w-full pl-10 pr-10 py-2.5 text-sm ${V2_INPUT}`}
        />
        {isFetching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#3363AD]/30 border-t-[#3363AD] rounded-full animate-spin" />
        )}
      </div>

      {/* States */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-[#E8EEF4] dark:bg-slate-700 rounded-[20px]" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className={`${V2_CARD_SHELL_PADDED} flex flex-col items-center justify-center py-16 gap-3 text-center`}>
          <Users className="w-12 h-12 text-[#C5D3E0]" />
          <p className={`font-medium ${V2_MUTED}`}>No available CHWs found</p>
          <p className="text-[#9AA3B2] text-sm">
            {debouncedSearch
              ? "No match — try a different name or phone number"
              : "No unassigned CHWs in your area yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student: IStudentSearchResult) => {
            const alreadyAdded = addedIds.has(student.id);

            return (
              <div
                key={student.id}
                className={`${V2_CARD_SHELL_PADDED} flex items-center gap-4`}
              >
                <StudentAvatar name={student.user.fullNames} photo={student.user.photo} />

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#1A2332] dark:text-slate-100 truncate">{student.user.fullNames}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    {student.user.phoneNumber && (
                      <div className={`flex items-center gap-1.5 text-xs ${V2_MUTED}`}>
                        <Phone className="w-3 h-3" />
                        <span>{student.user.phoneNumber}</span>
                      </div>
                    )}
                    {(student.user.district || student.user.sector) && (
                      <div className={`flex items-center gap-1.5 text-xs ${V2_MUTED}`}>
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {[student.user.district, student.user.sector].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {alreadyAdded ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    Added
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={isPending}
                    onClick={() => handleAdd(student)}
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Add
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add confirmation modal */}
      <Transition appear show={!!pendingStudent} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setPendingStudent(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#EBF0F9] flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5 text-[#3363AD]" />
                  </div>
                  <div>
                    <Dialog.Title className="text-lg font-bold text-gray-900">
                      Add CHW to Group
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-500 mt-1">
                      Add{" "}
                      <span className="font-semibold text-gray-800">
                        {pendingStudent?.user.fullNames}
                      </span>{" "}
                      directly to your group?
                    </Dialog.Description>
                  </div>

                  {pendingStudent && (
                    <div className="w-full bg-gray-50 rounded-xl p-3 text-left flex items-center gap-3">
                      <StudentAvatar
                        name={pendingStudent.user.fullNames}
                        photo={pendingStudent.user.photo}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {pendingStudent.user.fullNames}
                        </p>
                        {pendingStudent.user.phoneNumber && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {pendingStudent.user.phoneNumber}
                          </p>
                        )}
                        {(pendingStudent.user.district || pendingStudent.user.sector) && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {[pendingStudent.user.district, pendingStudent.user.sector]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => setPendingStudent(null)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={confirmAdd}
                    isLoading={isPending}
                  >
                    {!isPending && <UserPlus className="w-3.5 h-3.5 mr-1.5" />}
                    Add
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

export default CEHOGroupInvitePage;
