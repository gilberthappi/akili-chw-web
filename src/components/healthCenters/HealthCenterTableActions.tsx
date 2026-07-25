import { IHealthCenter } from "@/types";
import { TrashIcon, PencilIcon, EyeIcon } from "@heroicons/react/24/outline";
import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDelete from "@/components/common/ConfirmDelete";
import { deleteHospital } from "@/services/healthCenters.service";

interface IHealthCenterTableActionsProps {
  item: IHealthCenter;
  onEdit: (healthCenter: IHealthCenter) => void;
  onView?: (healthCenter: IHealthCenter) => void;
}

const HealthCenterTableActions: FC<IHealthCenterTableActionsProps> = ({ item, onEdit, onView }) => {
  const navigate = useNavigate();
  const [toDelete, setToDelete] = useState<string | undefined>();

  const handleView = () => {
    if (onView) {
      onView(item);
    } else {
      navigate(`/dashboard/healthCenters/${item.id}`);
    }
  };

  const handleEdit = () => {
    onEdit(item);
  };

  const deleteHospitalFn = async (id: string): Promise<number> => {
    await deleteHospital(id);
    return 1;
  };

  return (
    <>
      <div className='w-full'>
        <div
          className='flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer font-medium text-gray-700'
          onClick={handleView}
        >
          <EyeIcon className='w-4 h-4 text-[#3363AD]' /> View Details
        </div>
        <div
          className='flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer font-medium text-gray-700'
          onClick={handleEdit}
        >
          <PencilIcon className='w-4 h-4 text-green' /> Edit
        </div>

        {toDelete && (
          <ConfirmDelete
            type='healthCenter'
            id={toDelete}
            fn={deleteHospitalFn}
            queryKey={["healthCenters"]}
            setToDelete={setToDelete}
          />
        )}
        <div
          className='flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer font-medium text-red-600'
          onClick={() => setToDelete(item.id)}
        >
          <TrashIcon className='w-4 h-4 text-red' /> Delete
        </div>
      </div>
    </>
  );
};

export default HealthCenterTableActions;