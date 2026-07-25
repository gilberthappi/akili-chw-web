import { IHealthCenter } from "@/types";
import { TrashIcon, PencilIcon } from "@heroicons/react/24/outline";
import { FC, useState } from "react";
import ConfirmDelete from "@/components/common/ConfirmDelete";
import { deleteHospital } from "@/services/healthCenters.service";

interface IHealthCenterTableActionsProps {
  item: IHealthCenter;
  onEdit: (healthCenter: IHealthCenter) => void;
}

const HealthCenterTableActions: FC<IHealthCenterTableActionsProps> = ({ item, onEdit }) => {
  const [toDelete, setToDelete] = useState<string | undefined>();

  const handleEdit = () => {
    onEdit(item);
  };

  // Delete function using actual API
  const deleteHospitalFn = async (id: string): Promise<number> => {
    await deleteHospital(id);
    return 1; // Return success indicator
  };

  return (
    <>
      <div className='w-full'>
        <div
          className='flex gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer'
          onClick={handleEdit}
        >
          <PencilIcon className='w-4 text-green' /> Edit
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
          className='flex gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer'
          onClick={() => setToDelete(item.id)}
        >
          <TrashIcon className='w-4 text-red' /> Delete
        </div>
      </div>
    </>
  );
};

export default HealthCenterTableActions;