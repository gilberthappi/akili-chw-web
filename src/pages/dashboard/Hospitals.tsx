import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import Table from "@/components/table/Table";
import { IHospital } from "@/types";
import { getAllHospitals } from "@/services/hospitals.service";
import { formatDate } from "@/utils/formats/formats";
import { LuCirclePlus } from "react-icons/lu";
import TableActions from "@/components/table/TableActions";
import HospitalTableActions from "@/components/hospitals/HospitalTableActions";
import HospitalFormDialog from "@/components/hospitals/HospitalFormDialog";

const Hospitals: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<IHospital | null>(null);

  // Build query parameters for both pagination and search
  const buildQueryParams = (page: number, keyword?: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.append('page', page.toString());
    if (keyword) params.append('searchq', keyword);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  // Fetch all hospitals with pagination and search
  const { data, isLoading } = useQuery({
    queryKey: ["hospitals", currentPage, searchKeyword],
    queryFn: () => getAllHospitals(buildQueryParams(currentPage, searchKeyword)),
  });

  // Debounced search handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(
    debounce((searchTerm: string) => {
      setSearchKeyword(searchTerm);
      setCurrentPage(1);
    }, 500),
    []
  );

  // Page change handler
  const onChangePage = (page: number) => {
    setCurrentPage(page);
  };

  // Dialog handlers
  const handleAddHospital = () => {
    setSelectedHospital(null);
    setIsDialogOpen(true);
  };

  const handleEditHospital = (hospital: IHospital) => {
    setSelectedHospital(hospital);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedHospital(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-[#333333]">
            CHW Hospital Management
          </h2>
          <p className="text-gray-600">Manage hospitals and their associated CHW supervisors</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAddHospital}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium transition-all duration-500 ease-in-out hover:bg-[#073e92]"
          >
            <span className="text-xl">
              <LuCirclePlus />
            </span>
            <span>Add Hospital</span>
          </button>
        </div>
      </div>

      <Table
        isLoading={isLoading}
        currentPage={data?.currentPage || 1}
        totalItems={data?.totalItems || 0}
        itemsPerPage={data?.itemsPerPage || 15}
        onChangePage={onChangePage}
        searchFun={handleSearch}
        columns={[
          {
            title: "Hospital Name",
            key: "name",
            render: (row: IHospital) => {
              const locationParts = [row.district,row.sector].filter(Boolean);
              const locationString = locationParts.join(", ");
              return (
                <div>
                  <div className="font-medium text-gray-900">{row.name}</div>
                  <div className="text-sm text-gray-500">{locationString}</div>
                </div>
              );
            },
          },
          {
            title: "CHW Supervisor",
            key: "chwSupervisor",
            render: (row: IHospital) => (
              <div>
                <div className="font-medium text-gray-900">{row.chwSupervisor}</div>
                <div className="text-sm text-gray-500">{row.chwSupervisorContact}</div>
              </div>
            ),
          },
          {
            title: "CHW Count",
            key: "totalChws",
            render: (row: IHospital) => (
              <div className="text-center">
                <div className="font-medium text-gray-900">{row.activeChws}/{row.totalChws}</div>
                <div className="text-sm text-gray-500">Active/Total</div>
              </div>
            ),
          },
          {
            title: "Catchment Area",
            key: "catchmentArea",
            render: (row: IHospital) => (
              <div className="flex flex-wrap gap-1">
                {row.catchmentArea?.slice(0, 2).map((area, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {area}
                  </span>
                ))}
                {row.catchmentArea?.length > 2 && (
                  <span className="text-xs text-gray-500">+{row.catchmentArea?.length - 2} more</span>
                )}
              </div>
            ),
          },
          {
            title: "Contact",
            key: "contact",
            render: (row: IHospital) => (
              <div className="text-sm text-gray-700">
                {row.contact && <div>{row.contact}</div>}
                {row.email && <div className="text-gray-500">{row.email}</div>}
              </div>
            ),
          },
          {
            title: "Created",
            key: "createdAt",
            render: (row: IHospital) => (
              <div className="text-sm text-gray-600">
                {formatDate(row.createdAt)}
              </div>
            ),
          },
          {
            title: "Actions",
            key: "actions",
            render: (row: IHospital) => {
              return (
                <TableActions>
                  <HospitalTableActions
                    item={row}
                    onEdit={handleEditHospital}
                  />
                </TableActions>
              );
            },
          },
        ]}
        data={data?.data || []}
      />

      {/* Hospital Form Dialog */}
      <HospitalFormDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        hospital={selectedHospital}
      />
    </div>
  );
};

export default Hospitals;