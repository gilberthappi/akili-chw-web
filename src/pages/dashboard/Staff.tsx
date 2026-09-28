/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import toast from "react-hot-toast";
import { Activity, Plus, UserPlus, UserX, UsersRound } from "lucide-react";
import Table from "@/components/table/Table";
import TableActions from "@/components/table/TableActions";
import StaffTableActions from "@/components/staff/StaffTableActions";
import EditUserModal, { EditUserFormData } from "@/components/common/EditUserModal";
import { V2KpiCard, V2KpiSkeleton, V2PageHeader } from "@/components/v2/V2Page";
import {
  V2_BTN_PRIMARY,
  V2_MUTED,
  V2_PAGE_CANVAS,
  V2_PILL,
  V2_PILL_AMBER,
  V2_PILL_BLUE,
  V2_PILL_GRAY,
  V2_PILL_GREEN,
  V2_STRONG,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import { IStaff } from "@/types";
import {
  createStaff,
  getAllStaff,
  getStaffStats,
  StaffDepartment,
} from "@/services/staff.service";
import { formatDate } from "@/utils/formats/formats";
import { formatRoleLabel, STAFF_ROLE_OPTIONS } from "@/utils/roles";
import { useAuth } from "@/hooks/useAuth";

const DEPARTMENT_LABEL: Record<StaffDepartment, string> = {
  WELTEL: "WelTel",
  RBC: "RBC",
  SFH: "SFH",
  CIIC_HIN: "CIIC-HIN",
};

const rolePillClass = (role?: string) => {
  if (!role) return V2_PILL_GRAY;
  if (role.startsWith("RBC_")) return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
  if (role.startsWith("WELTEL_") || role === "ADMIN" || role === "DEVELOPER") return V2_PILL_BLUE;
  if (role.startsWith("CIIC_") || role === "TRAINER") return V2_PILL_GREEN;
  if (role.startsWith("SFH_")) return V2_PILL_AMBER;
  return V2_PILL_GRAY;
};

export const Staff = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [limit, setLimit] = useState(15);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [roleFilter, setRoleFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const buildQueryParams = (page: number, keyword?: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.append("page", page.toString());
    if (keyword) params.append("searchq", keyword);
    params.append("limit", limit.toString());
    if (sortBy) params.append("sortBy", sortBy);
    if (order) params.append("order", order);
    if (roleFilter) params.append("role", roleFilter);
    if (genderFilter) params.append("gender", genderFilter);
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  const { data, isLoading } = useQuery({
    queryKey: ["staff", "list", currentPage, searchKeyword, limit, sortBy, order, roleFilter, genderFilter],
    queryFn: () => getAllStaff(buildQueryParams(currentPage, searchKeyword)),
  });

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ["staff", "stats"],
    queryFn: () => getStaffStats(),
  });
  const stats = statsRes?.data;

  const department = data?.department ?? stats?.department ?? null;
  const canWrite = data?.canWrite ?? false;
  const roleOptions = useMemo(
    () =>
      data?.assignableRoles
        ? STAFF_ROLE_OPTIONS.filter((o) => data.assignableRoles.includes(o.value))
        : STAFF_ROLE_OPTIONS,
    [data?.assignableRoles],
  );
  const departmentLabel = department ? DEPARTMENT_LABEL[department] : null;

  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchKeyword(term);
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
    setRoleFilter("");
    setGenderFilter("");
  };

  const handleCreate = async (form: EditUserFormData) => {
    try {
      await createStaff({ ...form });
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      toast.success(`${form.fullNames} added. Default password: Password123!`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? "Failed to create staff");
      throw error;
    }
  };

  const createInitialData = useMemo(
    () => ({ role: roleOptions.length === 1 ? roleOptions[0].value : "" }),
    [roleOptions],
  );

  return (
    <div className={V2_PAGE_CANVAS}>
      <V2PageHeader
        title={departmentLabel ? `${departmentLabel} Staff` : "Staff Management"}
        subtitle={
          departmentLabel
            ? `Manage staff members of the ${departmentLabel} department`
            : "Manage staff members across all departments"
        }
        actions={
          canWrite && (
            <button type="button" className={V2_BTN_PRIMARY} onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          )
        }
      />

      {statsLoading ? (
        <V2KpiSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <V2KpiCard
            label="Total Staff"
            value={stats?.total ?? 0}
            Icon={UsersRound}
            sub={departmentLabel ? `${departmentLabel} department` : "All departments"}
          />
          <V2KpiCard
            label="Active (30 days)"
            value={stats?.activeLast30Days ?? 0}
            Icon={Activity}
            accent="text-emerald-600 dark:text-emerald-400"
            sub="Logged in recently"
          />
          <V2KpiCard
            label="Never Logged In"
            value={stats?.neverLoggedIn ?? 0}
            Icon={UserX}
            accent="text-amber-500 dark:text-amber-400"
            sub="Pending first login"
          />
          <V2KpiCard
            label="Added This Month"
            value={stats?.addedThisMonth ?? 0}
            Icon={UserPlus}
            accent="text-purple-600 dark:text-purple-400"
            sub="New accounts"
          />
        </div>
      )}

      <Table
        isLoading={isLoading}
        currentPage={data?.currentPage || 1}
        totalItems={data?.totalItems || 0}
        itemsPerPage={limit}
        onChangePage={(page) => setCurrentPage(page)}
        onSort={handleSort}
        currentSortKey={sortBy}
        currentSortOrder={order}
        onRowsPerPageChange={(newLimit) => {
          setLimit(newLimit);
          setCurrentPage(1);
        }}
        filters={[
          {
            key: "role",
            label: "Role",
            value: roleFilter,
            onChange: (val) => {
              setRoleFilter(val);
              setCurrentPage(1);
            },
            options: roleOptions,
          },
          {
            key: "gender",
            label: "Gender",
            value: genderFilter,
            onChange: (val) => {
              setGenderFilter(val);
              setCurrentPage(1);
            },
            options: [
              { label: "Male", value: "Male" },
              { label: "Female", value: "Female" },
            ],
          },
        ]}
        onResetFilters={resetFilters}
        columns={[
          {
            title: "Staff Member",
            key: "name",
            sortable: true,
            render: (row: IStaff) => {
              const initials = row.user.fullNames?.substring(0, 2).toUpperCase() || "??";
              return (
                <div className="flex items-center gap-3">
                  {row.user.photo ? (
                    <img
                      src={row.user.photo}
                      alt={row.user.fullNames}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#EBF0F9] dark:bg-slate-700 text-[#3363AD] flex items-center justify-center text-xs font-bold shrink-0">
                      {initials}
                    </div>
                  )}
                  <div>
                    <div className={`font-bold ${V2_STRONG}`}>
                      {row.user.fullNames}
                      {row.userId === user?.id && (
                        <span className={`ml-2 ${V2_PILL} ${V2_PILL_BLUE}`}>You</span>
                      )}
                    </div>
                    <div className={`text-xs ${V2_MUTED}`}>{row.user.email}</div>
                  </div>
                </div>
              );
            },
          },
          {
            title: "Phone Number",
            key: "phone",
            sortable: true,
            render: (row: IStaff) => <div className="text-sm">{row.user.phoneNumber}</div>,
          },
          {
            title: "Role",
            key: "role",
            sortable: true,
            render: (row: IStaff) => (
              <span className={`${V2_PILL} ${rolePillClass(row.role)}`}>
                {formatRoleLabel(row.role)}
              </span>
            ),
          },
          {
            title: "District/Sector",
            key: "location",
            sortable: true,
            render: (row: IStaff) => (
              <div className="text-sm">
                {row.user.district} / {row.user.sector}
              </div>
            ),
          },
          {
            title: "Joined",
            key: "createdAt",
            sortable: true,
            render: (row: IStaff) => (
              <div className="text-xs whitespace-nowrap">{formatDate(row.user.createdAt)}</div>
            ),
          },
          {
            title: "Actions",
            key: "actions",
            render: (row: IStaff) => (
              <TableActions>
                <StaffTableActions
                  item={row}
                  canWrite={canWrite}
                  roleOptions={roleOptions}
                  isSelf={row.userId === user?.id}
                />
              </TableActions>
            ),
          },
        ]}
        data={data?.data || []}
        searchFun={handleSearch}
      />

      <EditUserModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title={departmentLabel ? `Add ${departmentLabel} Staff` : "Add Staff"}
        initialData={createInitialData}
        roleOptions={roleOptions}
        onSubmit={handleCreate}
        submitLabel="Create Staff"
      />
    </div>
  );
};

export default Staff;
