import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import Table from "@/components/table/Table";
import { IHealthCenter } from "@/types";
import { getAllHospitals } from "@/services/healthCenters.service";
import { formatDate } from "@/utils/formats/formats";
import { LuCirclePlus } from "react-icons/lu";
import { ArrowUpTrayIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import TableActions from "@/components/table/TableActions";
import HealthCenterTableActions from "@/components/healthCenters/HealthCenterTableActions";
import HealthCenterFormDialog from "@/components/healthCenters/HealthCenterFormDialog";
import ImportHealthCentersDialog from "@/components/healthCenters/ImportHealthCentersDialog";
import HealthCenterDetail from "@/pages/dashboard/HealthCenterDetail";
import { hospitalKeys } from "@/utils/constants/queryKeys";




const PROVINCE_OPTIONS = [
  { label: "Kigali", value: "Kigali" },
  { label: "Eastern", value: "Eastern" },
  { label: "Western", value: "Western" },
  { label: "Northern", value: "Northern" },
  { label: "Southern", value: "Southern" },
];

const HealthCenters: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);

  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [limit, setLimit] = useState(15);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [provinceFilter, setProvinceFilter] = useState<string>("");
  const [, setSelectedIds] = useState<string[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<IHealthCenter | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);


  const buildQueryParams = (page: number, keyword?: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.append("page", page.toString());
    if (keyword) params.append("searchq", keyword);
    params.append("limit", limit.toString());
    if (sortBy) params.append("sortBy", sortBy);
    if (order) params.append("order", order);
    if (provinceFilter) params.append("province", provinceFilter);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  const { data, isLoading } = useQuery({
    queryKey: hospitalKeys.list(
      `${buildQueryParams(currentPage, searchKeyword)}`,
    ),
    queryFn: () => getAllHospitals(buildQueryParams(currentPage, searchKeyword)),
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearch = useCallback(
    debounce((searchTerm: string) => {
      setSearchKeyword(searchTerm);
      setCurrentPage(1);
    }, 500),
    [],
  );

  const handleSort = (key: string, direction: "asc" | "desc") => {
    setSortBy(key);
    setOrder(direction);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setCurrentPage(1);
    setSearchKeyword("");
    setSortBy("createdAt");
    setOrder("desc");
    setProvinceFilter("");
  };

  const handleAddHospital = () => {
    setSelectedHospital(null);
    setIsFormOpen(true);
  };

  const handleEditHospital = (healthCenter: IHealthCenter) => {
    setSelectedHospital(healthCenter);
    setIsFormOpen(true);
  };

  if (selectedDetailId) {
    return (
      <HealthCenterDetail
        healthCenterId={selectedDetailId}
        onBack={() => setSelectedDetailId(null)}
      />
    );
  }

  return (

    <div className="space-y-2">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-[#333333]">
            CHW HealthCenter Management
          </h2>
          <p className="text-gray-600">
            Manage healthCenters and their associated CHW supervisors
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-300 text-gray-700 font-medium transition-all duration-300 hover:bg-gray-50"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span>Import Excel</span>
          </button>
          <button
            onClick={handleAddHospital}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium transition-all duration-500 ease-in-out hover:bg-[#073e92]"
          >
            <LuCirclePlus className="text-xl" />
            <span>Add HealthCenter</span>
          </button>
        </div>
      </div>

      <Table
        isLoading={isLoading}
        currentPage={data?.currentPage || 1}
        totalItems={data?.totalItems || 0}
        itemsPerPage={limit}
        onChangePage={(page) => setCurrentPage(page)}
        searchFun={handleSearch}
        onSort={handleSort}
        currentSortKey={sortBy}
        currentSortOrder={order}
        onRowsPerPageChange={(newLimit) => {
          setLimit(newLimit);
          setCurrentPage(1);
        }}
        filters={[
          {
            key: "province",
            label: "Province",
            value: provinceFilter,
            onChange: (val) => {
              setProvinceFilter(val);
              setCurrentPage(1);
            },
            options: PROVINCE_OPTIONS,
          },
        ]}
        selectable={true}
        onSelectionChange={(ids) => setSelectedIds(ids)}
        onResetFilters={resetFilters}
        columns={[
          {
            title: "HealthCenter Name",
            key: "name",
            sortable: true,
            render: (row: IHealthCenter) => {
              const locationParts = [row.district, row.sector].filter(Boolean);
              return (
                <div>
                  <div className="font-medium text-gray-900">{row.name}</div>
                  <div className="text-sm text-gray-500">
                    {locationParts.join(", ")}
                  </div>
                </div>
              );
            },
          },
          {
            title: "Province",
            key: "province",
            sortable: true,
            render: (row: IHealthCenter) => (
              <div className="text-sm text-gray-700">{row.province || "—"}</div>
            ),
          },
          {
            title: "CEHO",
            key: "cehoName",
            render: (row: IHealthCenter) => {
              const cehoName = row.cehoName || row.chwSupervisor || "—";
              const cehoContact = row.cehoContact || row.chwSupervisorContact;
              return (
                <div>
                  <div className="font-semibold text-gray-900">{cehoName}</div>
                  {cehoContact && (
                    <div className="text-xs text-[#3363AD] font-medium">{cehoContact}</div>
                  )}
                </div>
              );
            },
          },
          {
            title: "Number of CHWs",
            key: "totalChws",
            sortable: true,
            render: (row: IHealthCenter) => (
              <div className="text-center font-bold text-gray-900 text-base">
                {row.totalChws || 0}
              </div>
            ),
          },
          {
            title: "Catchment Area",
            key: "catchmentArea",
            render: (row: IHealthCenter) => (
              <div className="flex items-center gap-1.5 flex-wrap">
                {row.catchmentArea && row.catchmentArea.length > 0 ? (
                  row.catchmentArea.slice(0, 2).map((area, idx) => (
                    <span
                      key={idx}
                      className="bg-[#3363AD]/10 text-[#3363AD] text-xs px-2 py-0.5 rounded-full font-medium"
                    >
                      {area}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 italic">
                    {row.sector} Sector & Cells
                  </span>
                )}
                {row.catchmentArea && row.catchmentArea.length > 2 && (
                  <span className="text-xs text-gray-400 font-medium">
                    +{row.catchmentArea.length - 2} more
                  </span>
                )}
                <div className="group relative cursor-help ml-1">
                  <InformationCircleIcon className="w-3.5 h-3.5 text-gray-400 hover:text-[#3363AD]" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-30 text-center">
                    Geographic sectors/cells served by this facility.
                  </div>
                </div>
              </div>
            ),
          },
          {
            title: "Contact",
            key: "contact",
            render: (row: IHealthCenter) => (
              <div className="text-sm text-gray-700">
                {row.contact && <div className="font-medium text-gray-900">{row.contact}</div>}
                {row.email && (
                  <div className="text-xs text-gray-500">{row.email}</div>
                )}
                {!row.contact && !row.email && <div className="text-gray-400">—</div>}
              </div>
            ),
          },
          {
            title: "Created",
            key: "createdAt",
            sortable: true,
            render: (row: IHealthCenter) => (
              <div className="text-sm text-gray-600 whitespace-nowrap">
                {formatDate(row.createdAt)}
              </div>
            ),
          },
          {
            title: "Actions",
            key: "actions",
            render: (row: IHealthCenter) => (
              <TableActions>
                <HealthCenterTableActions
                  item={row}
                  onEdit={handleEditHospital}
                  onView={(item) => setSelectedDetailId(item.id)}
                />
              </TableActions>

            ),
          },
        ]}
        data={data?.data || []}
      />


      <HealthCenterFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedHospital(null);
        }}
        healthCenter={selectedHospital}
      />

      <ImportHealthCentersDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
    </div>
  );
};

export default HealthCenters;
