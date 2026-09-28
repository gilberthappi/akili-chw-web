import { FC, useState } from "react";
import { Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { V2_BTN_PRIMARY } from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import EditUserModal, { EditUserFormData } from "@/components/common/EditUserModal";
import { createStudent } from "@/services/students.service";
import { studentKeys } from "@/utils/constants/queryKeys";

interface CreateLearnerButtonProps {
  role: "TRAINEE" | "TESTER";
}

const LABELS: Record<CreateLearnerButtonProps["role"], string> = {
  TRAINEE: "CHW",
  TESTER: "Tester",
};

const EMPTY_INITIAL: Partial<EditUserFormData> = {};

const CreateLearnerButton: FC<CreateLearnerButtonProps> = ({ role }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const label = LABELS[role];

  const handleSubmit = async (data: EditUserFormData) => {
    try {
      await createStudent({ ...data, role });
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
      toast.success(`${label} created. Default password: Password123!`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? `Failed to create ${label}`);
      throw error;
    }
  };

  return (
    <>
      <button type="button" className={V2_BTN_PRIMARY} onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4" />
        Add {label}
      </button>
      <EditUserModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={`Add ${label}`}
        initialData={EMPTY_INITIAL}
        submitLabel={`Create ${label}`}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default CreateLearnerButton;
