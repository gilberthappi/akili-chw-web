import React, { useState, useEffect } from "react";
import { X, Search, UserPlus, Check, Loader2, Shield } from "lucide-react";
import toast from "react-hot-toast";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { getAllUsersNopagination } from "@/services/users.api";
import { addGroupParticipant } from "@/services/groupChat.service";
import { User } from "@/types";

interface AddMembersModalProps {
  isOpen: boolean;
  groupId: string;
  existingParticipantUserIds: string[];
  onClose: () => void;
  onMembersAdded: () => void;
}

export const AddMembersModal: React.FC<AddMembersModalProps> = ({
  isOpen,
  groupId,
  existingParticipantUserIds,
  onClose,
  onMembersAdded,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedUserIds([]);
      fetchUsers();
    }
  }, [isOpen, groupId]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await getAllUsersNopagination();
      const rawUsers: User[] = Array.isArray(res)
        ? res
        : Array.isArray((res as any)?.data)
        ? (res as any).data
        : Array.isArray((res as any)?.users)
        ? (res as any).users
        : [];
      // Filter out users who are already participants in this group
      const available = rawUsers.filter((u: User) => !existingParticipantUserIds.includes(u.id));
      setUsers(available);
    } catch (err) {
      console.error("Failed to load users for group add:", err);
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
      await Promise.all(selectedUserIds.map((userId) => addGroupParticipant(groupId, userId)));
      toast.success(`${selectedUserIds.length} member(s) added successfully`);
      onMembersAdded();
      onClose();
    } catch (err: any) {
      console.error("Failed to add group members:", err);
      toast.error(err?.response?.data?.message || "Failed to add members to group");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return u.fullNames?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col overflow-hidden max-h-[85vh] animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add Group Members</h2>
              <p className="text-xs text-slate-500">Select users to add to this conversation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
            />
          </div>

          {/* User List */}
          <div className="h-64 overflow-y-auto border border-slate-200 rounded-2xl p-2 space-y-1 custom-scrollbar bg-slate-50/40">
            {loadingUsers ? (
              <div className="flex items-center justify-center h-full text-slate-400 space-y-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-6">
                <p className="text-xs font-medium">No available users found</p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id);
                const roleName = Array.isArray(user.roles)
                  ? (user.roles[0] as any)?.name || (user.roles[0] as any)
                  : typeof user.roles === "string"
                  ? user.roles
                  : "Member";

                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-slate-100/80 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ProfileAvatar photo={user.photo || undefined} name={user.fullNames} className="w-8 h-8 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{user.fullNames}</p>
                        <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                          <Shield className="h-2.5 w-2.5 text-primary/70" />
                          {String(roleName).toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                        isSelected ? "bg-primary text-white shadow-xs" : "border border-slate-300 bg-white"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedUserIds.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Add ({selectedUserIds.length}) Members
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default AddMembersModal;
