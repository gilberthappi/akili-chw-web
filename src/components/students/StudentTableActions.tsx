import { FC } from "react";
import { Eye} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { IStudent } from "@/services/students.service";

interface StudentTableActionsProps {
  item: IStudent;
}

const StudentTableActions: FC<StudentTableActionsProps> = ({ item }) => {
  const navigate = useNavigate();

  const handleView = () => {
    navigate(`/students/${item.id}`);
  };


  return (
    <>
        <div className='w-full'>

          <div
            className='flex gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer'
            onClick={handleView}
          >
            <Eye className='w-4 text-green' /> View
          </div>
        </div>
    </>
  );
};

export default StudentTableActions;
