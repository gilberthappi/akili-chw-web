import { FC, Fragment, useState } from "react";
import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { IStaff } from "@/types";
import { deleteStaff, updateStaffInfo } from "@/services/staff.service";
import EditUserModal, { EditUserFormData } from "@/components/common/EditUserModal";
import {
  V2_BTN_DANGER,
  V2_BTN_SECONDARY,
  V2_CARD_SHELL,
  V2_MUTED,
  V2_STRONG,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

interface StaffTableActionsProps {
  item: IStaff;
  canWrite: boolean;
  roleOptions: { label: string; value: string }[];
  isSelf: boolean;
}

const StaffTableActions: FC<StaffTableActionsProps> = ({ item, canWrite, roleOptions, isSelf }) => {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleSubmit = async (data: EditUserFormData) => {
    try {
      await updateStaffInfo(item.id, { ...data });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success("Staff info updated successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Failed to update staff");
      throw error;
    }
  };

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteStaff(item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success(`${item.user.fullNames} deleted.`);
      setDeleteOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Failed to delete staff.");
    },
  });

  const initialData = {
    fullNames: item.user.fullNames,
    email: item.user.email ?? "",
    phoneNumber: item.user.phoneNumber ?? "",
    gender: item.user.gender ?? "",
    NID: item.user.NID ?? "",
    birthdate: item.user.birthdate ? String(item.user.birthdate) : "",
    district: item.user.district ?? "",
    sector: item.user.sector ?? "",
    cell: item.user.cell ?? "",
    village: item.user.village ?? "",
    role: item.role ?? "",
    healthCenterId: item.user.healthCenterId ?? "",
  };

  if (!canWrite) {
    return <div className={`py-1 px-2 text-xs ${V2_MUTED}`}>View only</div>;
  }

  const editRoleOptions = isSelf
    ? roleOptions.filter((o) => o.value === item.role)
    : roleOptions;

  return (
    <>
      <div className="w-full">
        <div
          className="flex gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="w-4 text-[#3363AD]" /> Edit
        </div>
        {!isSelf && (
          <div
            className="flex gap-2 py-1 px-2 hover:bg-red-50 text-red-600 cursor-pointer"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4" /> Delete
          </div>
        )}
      </div>

      <EditUserModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Staff Info"
        initialData={initialData}
        roleOptions={editRoleOptions}
        onSubmit={handleSubmit}
      />

      <Transition appear show={deleteOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isDeleting && setDeleteOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className={`w-full max-w-sm ${V2_CARD_SHELL} p-6`}>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <Dialog.Title className={`text-lg font-bold ${V2_STRONG}`}>Delete Staff</Dialog.Title>
                  <Dialog.Description className={`text-sm ${V2_MUTED}`}>
                    Delete <span className={`font-semibold ${V2_STRONG}`}>{item.user.fullNames}</span>?
                    Their account is removed permanently. Staff who own courses must have them reassigned first.
                  </Dialog.Description>
                </div>
                <div className="flex gap-3 mt-6">
                  <button type="button" className={`${V2_BTN_SECONDARY} flex-1`} onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
                    Cancel
                  </button>
                  <button type="button" className={`${V2_BTN_DANGER} flex-1`} onClick={() => remove()} disabled={isDeleting}>
                    <Trash2 className="w-3.5 h-3.5" />
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default StaffTableActions;
