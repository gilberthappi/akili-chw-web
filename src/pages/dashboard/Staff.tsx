import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import Table from "@/components/table/Table";
import { IStaff } from "@/types";
import { getAllStaff } from "@/services/staff.service";
import { formatDate } from "@/utils/formats/formats";

export const Staff: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Build query parameters for both pagination and search
  const buildQueryParams = (page: number, keyword?: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.append('page', page.toString());
    if (keyword) params.append('searchq', keyword);
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  // Fetch all staff with pagination and search
  const { data, isLoading } = useQuery({
    queryKey: ["staff", currentPage, searchKeyword],
    queryFn: () => getAllStaff(buildQueryParams(currentPage, searchKeyword)),
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-[#333333]">
            Staff Management
          </h2>
          <p className="text-gray-600">Manage all staff members</p>
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
            title: "Staff Member",
            key: "name",
            render: (row: IStaff) => (
              <div className="flex items-center gap-3">
                <img
                  src={row.user.photo}
                  alt={row.user.fullNames}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {row.user.fullNames}
                  </div>
                  <div className="text-sm text-gray-500">{row.user.email}</div>
                </div>
              </div>
            ),
          },
          {
            title: "Phone Number",
            key: "phone",
            render: (row: IStaff) => (
              <div className="text-gray-700">{row.user.phoneNumber}</div>
            ),
          },
          {
            title: "Role",
            key: "role",
            render: (row: IStaff) => (
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  row.role === "ADMIN"
                    ? "bg-purple-100 text-purple-800"
                    : row.role === "DEVELOPER"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {row.role}
              </span>
            ),
          },
          {
            title: "Location",
            key: "location",
            render: (row: IStaff) => (
              <div className="text-sm text-gray-700">
                <div>{row.user.district}</div>
                <div className="text-gray-500">
                  {row.user.sector}, {row.user.cell}
                </div>
              </div>
            ),
          },
          {
            title: "Joined Date",
            key: "createdAt",
            render: (row: IStaff) => (
              <div className="text-sm text-gray-600">
                {formatDate(row.user.createdAt)}
              </div>
            ),
          },
        ]}
        data={data?.data || []}
      />
    </div>
  );
};

export default Staff;
