import React, { useState, useEffect } from "react";
import { X, Search, Users, Check, Loader2, Camera, Shield } from "lucide-react";
import toast from "react-hot-toast";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { getAllUsersNopagination } from "@/services/users.api";
import { createGroup } from "@/services/groupChat.service";
import { uploadFileByType } from "@/services/uploader.api";
import { User } from "@/types";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (newGroup: any) => void;
  currentUserId?: string;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
  currentUserId,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setPhotoUrl("");
      setSearchQuery("");
      setSelectedUserIds([]);
      fetchUsers();
    }
  }, [isOpen]);

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
      // Filter out current user from the picker list
      const list = rawUsers.filter((u: User) => u.id !== currentUserId);
      setUsers(list);
    } catch (err) {
      console.error("Failed to load users for group creation:", err);
      toast.error("Failed to load user list");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const url = await uploadFileByType(file, "image");
      setPhotoUrl(url);
      toast.success("Group photo uploaded");
    } catch (err) {
      console.error("Photo upload failed:", err);
      toast.error("Failed to upload group photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    try {
      setIsSubmitting(true);
      const newGroup = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        photo: photoUrl || undefined,
        participantIds: selectedUserIds,
      });

      toast.success(`Group "${newGroup.name}" created successfully`);
      onGroupCreated(newGroup);
      onClose();
    } catch (err: any) {
      console.error("Failed to create group:", err);
      toast.error(err?.response?.data?.message || "Failed to create group");
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
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl flex flex-col overflow-hidden max-h-[90vh] animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Group</h2>
              <p className="text-xs text-slate-500">Set up a collaboration channel for team members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          
          {/* Group Photo & Name Row */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0 group">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt="Group" className="w-full h-full object-cover" />
                ) : (
                  <Users className="h-7 w-7 text-slate-400" />
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-white rounded-xl cursor-pointer shadow-md hover:scale-105 transition-transform">
                <Camera className="h-3.5 w-3.5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Group Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kigali Health Workers"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Group Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe the purpose of this group..."
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary/20 transition-all font-medium resize-none"
            />
          </div>

          {/* Member Selection Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Add Group Members ({selectedUserIds.length})
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {users.length} available users
              </span>
            </div>

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

            {/* User List Picker */}
            <div className="h-48 overflow-y-auto border border-slate-200 rounded-2xl p-2 space-y-1 custom-scrollbar bg-slate-50/40">
              {loadingUsers ? (
                <div className="flex items-center justify-center h-full text-slate-400 space-y-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-4">
                  <p className="text-xs font-medium">No users found</p>
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
          </div>

          {/* Submit Action */}
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
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Create Group
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CreateGroupModal;
