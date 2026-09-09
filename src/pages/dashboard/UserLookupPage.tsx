/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import Table from "@/components/table/Table";
import { IUser } from "@/types/common";
import { getAllUsers } from "@/services/users.api";
import { formatDate } from "@/utils/formats/formats";
import { formatRoleLabel } from "@/utils/roles";

/**
 * WelTel support/admin user directory — all platform users (not CHW-only /students).
 */
export const UserLookupPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [limit, setLimit] = useState(15);

  const buildQueryParams = (page: number, keyword?: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.append("page", page.toString());
    if (keyword) params.append("searchq", keyword);
    params.append("limit", limit.toString());
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  const { data, isLoading } = useQuery({
    queryKey: ["user-lookup", currentPage, searchKeyword, limit],
    queryFn: () => getAllUsers(buildQueryParams(currentPage, searchKeyword)),
  });

  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchKeyword(term);
      setCurrentPage(1);
    }, 500),
    [],
  );

  useEffect(() => {
    setCurrentPage(1);
    setSearchKeyword("");
  }, []);

  const rows = (data?.data ?? []) as IUser[];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-[#333333]">User lookup</h2>
        <p className="text-sm text-gray-600">
          Search all platform users (CHW, CEHO, staff, testers) to assist access
          and support.
        </p>
      </div>

      <Table
        columns={[
          {
            title: "Name",
            key: "fullNames",
            render: (row: IUser) => (
              <div>
                <div className="font-medium text-gray-900">{row.fullNames}</div>
                <div className="text-xs text-gray-500">{row.email || "—"}</div>
              </div>
            ),
          },
          {
            title: "Phone",
            key: "phoneNumber",
            render: (row: IUser) => (
              <span className="text-gray-700">{row.phoneNumber || "—"}</span>
            ),
          },
          {
            title: "Roles",
            key: "userRoles",
            render: (row: IUser) => (
              <div className="flex flex-wrap gap-1">
                {(row.userRoles ?? []).length === 0 ? (
                  <span className="text-xs text-gray-400">No role</span>
                ) : (
                  row.userRoles.map((r) => (
                    <span
                      key={r.id || r.name}
                      className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-700"
                    >
                      {formatRoleLabel(r.name)}
                    </span>
                  ))
                )}
              </div>
            ),
          },
          {
            title: "Department",
            key: "industry",
            render: (row: IUser) => {
              const dept =
                (row as IUser & { department?: string | null }).department ??
                row.industry;
              return (
                <span className="text-gray-700 text-sm">
                  {dept ? String(dept).replace("_", "-") : "—"}
                </span>
              );
            },
          },
          {
            title: "Location",
            key: "district",
            render: (row: IUser) => (
              <span className="text-xs text-gray-600">
                {[row.district, row.sector].filter(Boolean).join(" · ") || "—"}
              </span>
            ),
          },
          {
            title: "Health center",
            key: "healthCenter",
            render: (row: IUser) => (
              <span className="text-sm text-gray-700">
                {row.healthCenter?.name || "—"}
              </span>
            ),
          },
          {
            title: "Joined",
            key: "createdAt",
            render: (row: IUser) => (
              <span className="text-xs text-gray-500">
                {row.createdAt ? formatDate(row.createdAt) : "—"}
              </span>
            ),
          },
        ]}
        data={rows}
        isLoading={isLoading}
        totalItems={data?.totalItems ?? rows.length}
        currentPage={currentPage}
        itemsPerPage={limit}
        onChangePage={setCurrentPage}
        searchFun={handleSearch}
        paginate
        allowFilter={false}
      />
    </div>
  );
};

export default UserLookupPage;
