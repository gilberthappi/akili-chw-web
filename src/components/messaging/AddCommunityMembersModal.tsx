import React, { useState, useEffect } from "react";
import { X, Search, UserPlus, Check, Loader2, Globe } from "lucide-react";
import toast from "react-hot-toast";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { getAllUsersNopagination } from "@/services/users.api";
import { addCommunityMember } from "@/services/community.service";
import { IUser } from "@/types/common";

interface AddCommunityMembersModalProps {
  isOpen: boolean;
  communityId: string;
  existingMemberUserIds: string[];
  onClose: () => void;
  onMembersAdded: () => void;
}

export const AddCommunityMembersModal: React.FC<AddCommunityMembersModalProps> = ({
  isOpen,
  communityId,
  existingMemberUserIds,
  onClose,
  onMembersAdded,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedUserIds([]);
      fetchUsers();
    }
  }, [isOpen, communityId]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await getAllUsersNopagination();
      const rawUsers: IUser[] = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.data)
        ? (res as any).data
        : [];
      // Filter out users who are already members
      const available = rawUsers.filter((u: IUser) => !existingMemberUserIds.includes(u.id));
      setUsers(available);
    } catch (err) {
      console.error("Failed to load users for community add:", err);
      toast.error("Failed to load available users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user to add");
      return;
    }

    try {
      setIsSubmitting(true);
      await Promise.all(
        selectedUserIds.map((userId) => addCommunityMember(communityId, userId))
      );
      toast.success(`${selectedUserIds.length} member(s) added to community`);
      onMembersAdded();
      onClose();
    } catch (err: any) {
      console.error("Failed to add community members:", err);
      toast.error(err?.response?.data?.message || "Failed to add members to community");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullNames?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.district?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add Community Members</h2>
              <p className="text-xs text-slate-500">Invite health workers to this community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Selected Count */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, district, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/80 border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center justify-between text-xs px-1 text-slate-500">
            <span>{selectedUserIds.length} members selected</span>
            {selectedUserIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedUserIds([])}
                className="text-primary hover:underline font-semibold"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          {loadingUsers ? (
            <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span>Loading contacts...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching health workers found to add.
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isSelected = selectedUserIds.includes(u.id);
              return (
                <div
                  key={u.id}
                  onClick={() => toggleUserSelection(u.id)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-primary/5 border-primary/30"
                      : "hover:bg-slate-50 border-transparent hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <ProfileAvatar photo={u.photo || undefined} name={u.fullNames} className="w-9 h-9 border border-slate-200" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{u.fullNames}</p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {u.district ? `${u.district} • ` : ""}{u.role || "Health Worker"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                      isSelected
                        ? "bg-primary border-primary text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedUserIds.length === 0}
            className="px-5 py-2 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm shadow-primary/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Adding...
              </>
            ) : (
              `Add (${selectedUserIds.length}) Members`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCommunityMembersModal;
