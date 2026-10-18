import React, { useState, useEffect } from "react";
import { X, Pencil, Globe, Lock, Loader2, Camera } from "lucide-react";
import toast from "react-hot-toast";
import { updateCommunity } from "@/services/community.service";
import { uploadFileByType } from "@/services/uploader.api";

interface EditCommunityModalProps {
  isOpen: boolean;
  communityId: string;
  initialName: string;
  initialDescription?: string;
  initialPhoto?: string;
  initialIsPublic?: boolean;
  onClose: () => void;
  onCommunityUpdated: (updatedCommunity: any) => void;
}

export const EditCommunityModal: React.FC<EditCommunityModalProps> = ({
  isOpen,
  communityId,
  initialName,
  initialDescription,
  initialPhoto,
  initialIsPublic = true,
  onClose,
  onCommunityUpdated,
}) => {
  const [name, setName] = useState(initialName || "");
  const [description, setDescription] = useState(initialDescription || "");
  const [photoUrl, setPhotoUrl] = useState(initialPhoto || "");
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || "");
      setDescription(initialDescription || "");
      setPhotoUrl(initialPhoto || "");
      setIsPublic(initialIsPublic ?? true);
    }
  }, [isOpen, initialName, initialDescription, initialPhoto, initialIsPublic]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPhoto(true);
      const url = await uploadFileByType(file, "image");
      setPhotoUrl(url);
      toast.success("Community photo uploaded");
    } catch (err) {
      console.error("Photo upload failed:", err);
      toast.error("Failed to upload community photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Community name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      const updated = await updateCommunity(communityId, {
        name: name.trim(),
        description: description.trim() || undefined,
        photo: photoUrl || undefined,
        isPublic,
      });
      toast.success("Community updated successfully");
      onCommunityUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error("Failed to update community:", err);
      toast.error(err?.response?.data?.message || "Failed to update community");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Edit Community</h2>
              <p className="text-xs text-slate-500">Update community settings & details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Photo Picker */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center text-slate-400">
                {photoUrl ? (
                  <img src={photoUrl} alt="Community avatar" className="w-full h-full object-cover" />
                ) : (
                  <Globe className="h-8 w-8 text-slate-400" />
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              <label
                htmlFor="community-photo-upload"
                className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-white rounded-xl shadow-md hover:bg-primary/90 cursor-pointer transition-transform hover:scale-105"
                title="Change photo"
              >
                <Camera className="h-3.5 w-3.5" />
                <input
                  id="community-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="text-xs text-slate-500">
              <p className="font-semibold text-slate-800">Community Icon</p>
              <p>JPG, PNG or GIF. 1:1 ratio recommended.</p>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Community Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maternal Health Knowledge Hub"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
              required
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose, topics, or guidelines of this community..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Public / Private Community Toggle */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Public Community</p>
                <p className="text-[10px] text-slate-500">
                  {isPublic
                    ? "Anyone can discover and participate"
                    : "Only invited members can view and post"}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm shadow-primary/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCommunityModal;
