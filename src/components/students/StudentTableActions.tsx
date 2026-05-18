import { FC, useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { IStudent, getStudentById, updateStudent } from "@/services/students.service";
import { studentKeys } from "@/utils/constants/queryKeys";
import EditUserModal, { EditUserFormData } from "@/components/common/EditUserModal";
import { StudentData } from "@/types";

const STUDENT_ROLE_OPTIONS = [
  { label: "Trainee (CHW)", value: "TRAINEE" },
  { label: "Tester", value: "TESTER" },
];

interface StudentTableActionsProps {
  item: IStudent;
}

const StudentTableActions: FC<StudentTableActionsProps> = ({ item }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

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
      </div>

      <EditUserModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title='Edit Student Info'
        initialData={initialData}
        roleOptions={STUDENT_ROLE_OPTIONS}
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default StudentTableActions;
