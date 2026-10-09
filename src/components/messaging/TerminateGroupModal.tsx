import React, { useState } from "react";
import { AlertTriangle, X, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { deleteGroup } from "@/services/groupChat.service";

interface TerminateGroupModalProps {
  isOpen: boolean;
  groupId: string;
  groupName: string;
  onClose: () => void;
  onGroupTerminated: () => void;
}

export const TerminateGroupModal: React.FC<TerminateGroupModalProps> = ({
  isOpen,
  groupId,
  groupName,
  onClose,
  onGroupTerminated,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteGroup(groupId);
      toast.success(`Group "${groupName}" terminated and deleted`);
      onGroupTerminated();
      onClose();
    } catch (err: any) {
      console.error("Failed to delete group:", err);
      toast.error(err?.response?.data?.message || "Failed to terminate group");
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
              <h2 className="text-base font-bold text-rose-950">Terminate Group</h2>
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
            Are you sure you want to terminate <strong className="text-slate-900 font-bold">"{groupName}"</strong>?
          </p>
          <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl space-y-1 text-xs text-rose-800">
            <p className="font-bold">⚠️ Warning:</p>
            <p className="text-[11px] leading-normal text-rose-700">
              This action will permanently delete this group, remove all members, and erase message history. This cannot be undone.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Terminating...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Terminate Group
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TerminateGroupModal;
