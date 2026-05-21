import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  Send,
  MapPin,
  Phone,
  CheckCircle2,
  Users,
} from "lucide-react";
import { debounce } from "lodash";
import toast from "react-hot-toast";
import { searchStudentsForInvite, inviteMember } from "@/services/choGroup.service";
import { IStudentSearchResult } from "@/types";
import { Button } from "@/components/common/Button";

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

const CHOGroupInvitePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
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
    queryKey: ["students-for-invite", debouncedSearch],
    queryFn: () => searchStudentsForInvite(debouncedSearch),
  });

  const { mutate: sendInvite, isPending } = useMutation({
    mutationFn: (studentId: string) => inviteMember(studentId),
    onSuccess: (_, studentId) => {
      setInvitedIds((prev) => new Set([...prev, studentId]));
      queryClient.invalidateQueries({ queryKey: ["cho-group-members"] });
      toast.success("Invitation sent successfully.");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? "Failed to send invitation.";
      toast.error(msg);
    },
  });

  const handleInvite = (student: IStudentSearchResult) => {
    if (invitedIds.has(student.id) || student.groupMembership) return;
    if (window.confirm(`Send invitation to ${student.user.fullNames}?`)) {
      sendInvite(student.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/cho-group"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-[#333333]">Invite CHW</h2>
            <p className="text-sm text-gray-500">
              Search for CHWs and send them an invitation to join your group.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or phone number…"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD]"
        />
        {isFetching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#3363AD]/30 border-t-[#3363AD] rounded-full animate-spin" />
        )}
      </div>

      {/* States */}
      {isLoading && !isFetching ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : !debouncedSearch ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Search className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500 font-medium">Search to find CHWs</p>
          <p className="text-gray-400 text-sm">Type a name or phone number above</p>
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Users className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500 font-medium">No CHWs found</p>
          <p className="text-gray-400 text-sm">Try a different name or phone number</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student: IStudentSearchResult) => {
            const alreadyInGroup = !!student.groupMembership;
            const alreadyInvited = invitedIds.has(student.id);
            const disabled = alreadyInGroup || alreadyInvited || isPending;

            return (
              <div
                key={student.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <StudentAvatar name={student.user.fullNames} photo={student.user.photo} />

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{student.user.fullNames}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    {student.user.phoneNumber && (
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <Phone className="w-3 h-3" />
                        <span>{student.user.phoneNumber}</span>
                      </div>
                    )}
                    {(student.user.district || student.user.sector) && (
                      <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {[student.user.district, student.user.sector].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                  {alreadyInGroup && (
                    <span className="inline-block mt-1.5 text-[10px] font-semibold text-orange-600 bg-orange-50 rounded-full px-2 py-0.5">
                      Already in a group
                    </span>
                  )}
                </div>

                {alreadyInvited ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    Invited
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant={alreadyInGroup ? "ghost" : "primary"}
                    disabled={disabled}
                    onClick={() => handleInvite(student)}
                    isLoading={isPending}
                  >
                    {!isPending && <Send className="w-3.5 h-3.5 mr-1.5" />}
                    {alreadyInGroup ? "N/A" : "Invite"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CHOGroupInvitePage;
