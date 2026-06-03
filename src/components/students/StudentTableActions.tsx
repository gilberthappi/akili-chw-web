import { FC, Fragment, useState } from "react";
import { Eye, Pencil, ArrowUpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Dialog, Transition } from "@headlessui/react";
import { IStudent, getStudentById, updateStudent } from "@/services/students.service";
import { adminPromoteToCHO } from "@/services/choGroup.service";
import { studentKeys } from "@/utils/constants/queryKeys";
import EditUserModal, { EditUserFormData } from "@/components/common/EditUserModal";
import { StudentData } from "@/types";
import { Button } from "@/components/common/Button";

const STUDENT_ROLE_OPTIONS = [
  { label: "Trainee (CHW)", value: "TRAINEE" },
  { label: "Tester", value: "TESTER" },
];

interface StudentTableActionsProps {
  item: IStudent;
  showPromote?: boolean;
}

const StudentTableActions: FC<StudentTableActionsProps> = ({ item, showPromote = false }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [groupName, setGroupName] = useState("");

  const handleView = () => {
    navigate(`/students/${item.id}`);
  };

  const handleEditClick = async () => {
    setLoadingEdit(true);
    try {
      const res = await getStudentById(item.id);
      setStudentData(res.data ?? null);
      setEditOpen(true);
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleSubmit = async (data: EditUserFormData) => {
    await updateStudent(item.id, { ...data });
    queryClient.invalidateQueries({ queryKey: studentKeys.all });
    toast.success("Student info updated successfully");
  };

  const { mutate: promote, isPending: isPromoting } = useMutation({
    mutationFn: () => adminPromoteToCHO(item.userId, groupName.trim() || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-cho-groups"] });
      toast.success(`${item.fullName} promoted to CHO successfully.`);
      setPromoteOpen(false);
      setGroupName("");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Failed to promote user.");
    },
  });

  const initialData = studentData
    ? {
        fullNames: studentData.studentInfo.fullName,
        email: "",
        phoneNumber: studentData.studentInfo.phoneNumber,
        gender: studentData.studentInfo.gender ?? "",
        NID: studentData.studentInfo.NID ?? "",
        birthdate: "",
        district: studentData.studentInfo.district,
        sector: studentData.studentInfo.sector,
        cell: studentData.studentInfo.cell,
        village: studentData.studentInfo.village,
        role: studentData.studentInfo.role ?? "",
      }
    : {
        fullNames: item.fullName,
        phoneNumber: item.phoneNumber,
        district: item.district,
        sector: item.sector,
      };

  return (
    <>
      <div className='w-full'>
        <div
          className='flex gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer'
          onClick={handleView}
        >
          <Eye className='w-4 text-green-600' /> View
        </div>
        <div
          className='flex gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer'
          onClick={handleEditClick}
        >
          <Pencil className='w-4 text-[#3363AD]' />
          {loadingEdit ? "Loading..." : "Edit"}
        </div>
        {showPromote && (
          <div
            className='flex gap-2 py-1 px-2 hover:bg-amber-50 cursor-pointer text-amber-600'
            onClick={() => setPromoteOpen(true)}
          >
            <ArrowUpCircle className='w-4' />
            Promote to CHO
          </div>
        )}
      </div>

      <EditUserModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title='Edit Student Info'
        initialData={initialData}
        roleOptions={STUDENT_ROLE_OPTIONS}
        onSubmit={handleSubmit}
      />

      {/* Promote to CHO modal */}
      <Transition appear show={promoteOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isPromoting && setPromoteOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <ArrowUpCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <Dialog.Title className="text-lg font-bold text-gray-900">Promote to CHO</Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-500 mt-0.5">
                      Promote <span className="font-semibold text-gray-700">{item.fullName}</span> to
                      Community Health Officer. A CHO group will be created automatically.
                    </Dialog.Description>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">
                    Group Name{" "}
                    <span className="font-normal text-gray-400">
                      (optional — defaults to "{item.fullName}'s Group")
                    </span>
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder={`${item.fullName}'s Group`}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setPromoteOpen(false); setGroupName(""); }}
                    disabled={isPromoting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 !bg-amber-500 hover:!bg-amber-600"
                    onClick={() => promote()}
                    isLoading={isPromoting}
                  >
                    {!isPromoting && <ArrowUpCircle className="w-3.5 h-3.5 mr-1.5" />}
                    Promote
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default StudentTableActions;
