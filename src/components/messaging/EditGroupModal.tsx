import React, { useState, useEffect } from "react";
import { X, Pencil, Users, Loader2, Camera } from "lucide-react";
import toast from "react-hot-toast";
import { updateGroup } from "@/services/groupChat.service";
import { uploadFileByType } from "@/services/uploader.api";

interface EditGroupModalProps {
  isOpen: boolean;
  groupId: string;
  initialName: string;
  initialDescription?: string;
  initialPhoto?: string;
  initialOnlyAdminsCanSend?: boolean;
  onClose: () => void;
  onGroupUpdated: (updatedGroup: any) => void;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  isOpen,
  groupId,
  initialName,
  initialDescription,
  initialPhoto,
  initialOnlyAdminsCanSend = false,
  onClose,
  onGroupUpdated,
}) => {
  const [name, setName] = useState(initialName || "");
  const [description, setDescription] = useState(initialDescription || "");
  const [photoUrl, setPhotoUrl] = useState(initialPhoto || "");
  const [onlyAdminsCanSend, setOnlyAdminsCanSend] = useState(initialOnlyAdminsCanSend);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || "");
      setDescription(initialDescription || "");
      setPhotoUrl(initialPhoto || "");
      setOnlyAdminsCanSend(initialOnlyAdminsCanSend || false);
    }
  }, [isOpen, initialName, initialDescription, initialPhoto, initialOnlyAdminsCanSend]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await updateGroup(groupId, {
        name: name.trim(),
        description: description.trim() || undefined,
        photo: photoUrl || undefined,
        onlyAdminsCanSend,
      });

      toast.success("Group details updated");
      onGroupUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error("Failed to update group:", err);
      toast.error(err?.response?.data?.message || "Failed to update group");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md flex flex-col overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Edit Group Info</h2>
              <p className="text-xs text-slate-500">Update name, description, avatar & permissions</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Photo & Name */}
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
                placeholder="Group Name"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Group Description..."
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium resize-none"
            />
          </div>

          {/* Who Can Send Messages Permission */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Who Can Send Messages
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              <div
                onClick={() => setOnlyAdminsCanSend(false)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center gap-1 ${
                  !onlyAdminsCanSend
                    ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="text-xs">All Members</span>
                <span className="text-[10px] text-slate-400 font-normal">Everyone can post</span>
              </div>

              <div
                onClick={() => setOnlyAdminsCanSend(true)}
                className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center gap-1 ${
                  onlyAdminsCanSend
                    ? "bg-rose-50 border-rose-500 text-rose-700 font-bold shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Pencil className="h-4 w-4" />
                <span className="text-xs">Only Admins</span>
                <span className="text-[10px] text-slate-400 font-normal">Admins only post</span>
              </div>
            </div>
          </div>

          {/* Actions */}
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
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EditGroupModal;
