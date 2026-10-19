import React, { useState } from "react";
import { AlertTriangle, X, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { deleteCommunity } from "@/services/community.service";

interface TerminateCommunityModalProps {
  isOpen: boolean;
  communityId: string;
  communityName: string;
  onClose: () => void;
  onCommunityTerminated: () => void;
}

export const TerminateCommunityModal: React.FC<TerminateCommunityModalProps> = ({
  isOpen,
  communityId,
  communityName,
  onClose,
  onCommunityTerminated,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCommunity(communityId);
      toast.success(`Community "${communityName}" has been deleted`);
      onCommunityTerminated();
      onClose();
    } catch (err: any) {
      console.error("Failed to delete community:", err);
      toast.error(err?.response?.data?.message || "Failed to delete community");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/60">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-rose-950">Delete Community</h2>
              <p className="text-xs text-rose-600/80">Permanent destructive action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-rose-400 hover:text-rose-700 hover:bg-rose-100/80 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to permanently delete{" "}
            <strong className="text-slate-900 font-bold font-mono">"{communityName}"</strong>?
          </p>

          <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-2 text-xs text-rose-800">
            <p className="font-bold flex items-center gap-1.5 text-rose-900">
              <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              What will be deleted:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-700">
              <li>All community posts and shared attachments</li>
              <li>All discussion comments and replies</li>
              <li>All member associations and saved posts</li>
            </ul>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            This action cannot be undone. Only community creators and administrators can perform this.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm shadow-rose-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" /> Permanently Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TerminateCommunityModal;
