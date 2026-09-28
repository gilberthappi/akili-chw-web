/* eslint-disable react-hooks/exhaustive-deps */
import { useState, FC, useCallback, useEffect } from "react";
import { studentKeys } from "@/utils/constants/queryKeys";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash";
import Table from "@/components/table/Table";
import PageContent from "@/components/common/PageContent";
import { formatDate } from "@/utils/formats/formats";
import { getAllStudents, exportStudentsToExcel, IStudent } from "@/services/students.service";
import { getAllCoursesNoPagination } from "@/services/course.service";
import { listAllHospitals } from "@/services/healthCenters.service";
import { getDistrictOptions, getSectorOptions } from "@/hooks/locations";
import StudentTableActions from "./StudentTableActions";
import TableActions from "../table/TableActions";
import { BulkStudentRoleActions } from "./BulkStudentRoleActions";
import { useAuth } from "@/hooks/useAuth";
import { TESTER_WRITE_ROLES } from "@/utils/roles";
import { V2_STRONG } from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import type { ICourse } from "@/types";
import { Download, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";


interface StudentsListProps {
  hideHeader?: boolean;
  filter?: string;
  roleFilter?: "TRAINEE" | "TESTER" | "CEHO";
}

const StudentsList: FC<StudentsListProps> = ({
  hideHeader = false,
  filter,
  roleFilter,
}) => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = hasRole(["ADMIN"]);
  const canChangeLearnerRole = hasRole(TESTER_WRITE_ROLES);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [limit, setLimit] = useState(15);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [selectedStudents, setSelectedStudents] = useState<Map<string, IStudent>>(new Map());

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("");
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [districtFilter, setDistrictFilter] = useState<string>("");
  const [sectorFilter, setSectorFilter] = useState<string>("");
  const [hospitalFilter, setHospitalFilter] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);


  const { data: coursesResponse } = useQuery({
    queryKey: ["all-courses-no-pagination"],
    queryFn: () => getAllCoursesNoPagination(),
  });
  const courses = coursesResponse?.data || [];

  const { data: hospitalsResponse } = useQuery({
    queryKey: ["all-healthCenters-no-pagination"],
    queryFn: () => listAllHospitals(),
  });
  const healthCenters = hospitalsResponse?.data || [];

  const districtOpts = getDistrictOptions();
  const sectorOpts = districtFilter ? getSectorOptions(districtFilter) : [];

  // Build query parameters
  const buildQueryParams = (page: number, keyword?: string) => {
    const params = new URLSearchParams();

    if (page > 1) params.append("page", page.toString());
    if (keyword) params.append("searchq", keyword);

    params.append("limit", limit.toString());
    if (sortBy) params.append("sortBy", sortBy);
    if (order) params.append("order", order);

    // Add filters
    if (statusFilter) {
      params.append("status", statusFilter);
    } else if (filter === "active") {
      params.append("status", "active");
    } else if (filter === "inactive") {
      params.append("status", "inactive");
    }

    if (genderFilter) params.append("gender", genderFilter);
    if (courseFilter) params.append("courseId", courseFilter);
    if (roleFilter) params.append("role", roleFilter);
    if (districtFilter) params.append("district", districtFilter);
    if (sectorFilter) params.append("sector", sectorFilter);
    if (hospitalFilter) params.append("healthCenterId", hospitalFilter);

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  // Main query with all parameters including filter — also hydrates KPI cards.
  const { data, isLoading } = useQuery({
    queryKey: studentKeys.list(
      `${filter}-${roleFilter}-${buildQueryParams(currentPage, searchKeyword)}`,
    ),
    queryFn: async () => {
      const res = await getAllStudents(buildQueryParams(currentPage, searchKeyword));
      if (roleFilter && res.stats) {
        queryClient.setQueryData(studentKeys.stats(roleFilter), {
          message: "Student statistics summary fetched successfully",
          statusCode: 200,
          data: res.stats,
        });
      }
      return res;
    },
  });

  // Debounced search handler
  const handleSearch = useCallback(
    debounce((searchTerm: string) => {
      setSearchKeyword(searchTerm);
      setCurrentPage(1);
    }, 500),
    [filter],
  );

  // Page change handler
  const onChangePage = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (key: string, direction: "asc" | "desc") => {
    setSortBy(key);
    setOrder(direction);
    setCurrentPage(1); // Reset to page 1 on sort change
  };

  // Reset page and search when filter changes
  const resetFilters = () => {
    setCurrentPage(1);
    setSearchKeyword("");
    setSortBy("createdAt");
    setOrder("desc");
    setStatusFilter("");
    setGenderFilter("");
    setCourseFilter("");
    setDistrictFilter("");
    setSectorFilter("");
    setHospitalFilter("");
  };

  // Effect to reset pagination and search when filter changes
  useEffect(() => {
    resetFilters();
    setSelectedStudents(new Map());
  }, [filter, roleFilter]);

  const selectedRowIds = Array.from(selectedStudents.keys());

  const handleSelectionChange = (pageSelectedIds: string[]) => {
    setSelectedStudents((prev) => {
      const next = new Map(prev);
      const pageRows = data?.data ?? [];
      const pageIdSet = new Set(pageRows.map((s) => s.id));

      for (const pageId of pageIdSet) {
        if (!pageSelectedIds.includes(pageId)) {
          next.delete(pageId);
        }
      }

      for (const id of pageSelectedIds) {
        const row = pageRows.find((s) => s.id === id);
        if (row) next.set(id, row);
      }

      return next;
    });
  };

  const clearSelection = () => {
    setSelectedStudents(new Map());
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      toast.loading("Generating Excel file with applied filters...", { id: "excel-export" });
      const queryParams = buildQueryParams(1, searchKeyword);
      const blob = await exportStudentsToExcel(queryParams);

      const roleName =
        roleFilter === "TESTER" ? "Testers" : roleFilter === "CEHO" ? "CEHOs" : "CHWs";
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `${roleName}_Export_${dateStr}.xlsx`;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Excel exported successfully!", { id: "excel-export" });
    } catch (error: any) {
      console.error("Export error:", error);
      let errMsg = "Failed to export Excel spreadsheet";
      if (error?.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          if (json?.message) errMsg = json.message;
        } catch {
          // ignore JSON parse error
        }
      } else if (error?.response?.data?.message) {
        errMsg = error.response.data.message;
      }
      toast.error(errMsg, { id: "excel-export" });
    } finally {
      setIsExporting(false);
    }
  };


  const showBulkActions =
    selectedStudents.size > 0 &&
    roleFilter &&
    ((roleFilter === "TESTER" && canChangeLearnerRole) ||
      (roleFilter === "TRAINEE" && isAdmin) ||
      (roleFilter === "CEHO" && isAdmin));

  const tableContent = (
    <>
      {showBulkActions && roleFilter && (
        <BulkStudentRoleActions
          roleFilter={roleFilter}
          selectedStudents={Array.from(selectedStudents.values())}
          onClear={clearSelection}
        />
      )}
      <Table
        isLoading={isLoading}
        currentPage={data?.currentPage || 1}
        totalItems={data?.totalItems || 0}
        itemsPerPage={limit}
        onChangePage={onChangePage}
        actionBtn={
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {isExporting ? (
              <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>{isExporting ? "Exporting…" : "Export Excel"}</span>
          </button>
        }
        // New features

        selectable={Boolean(roleFilter && ((roleFilter === "TESTER" && canChangeLearnerRole) || isAdmin))}
        selectedRowIds={selectedRowIds}
        onSelectionChange={handleSelectionChange}
        onSort={handleSort}
        currentSortKey={sortBy}
        currentSortOrder={order}
        onRowsPerPageChange={(newLimit) => {
          setLimit(newLimit);
          setCurrentPage(1);
        }}
        filters={[
          {
            key: "district",
            label: "District",
            value: districtFilter,
            onChange: (val) => {
              setDistrictFilter(val);
              setSectorFilter(""); // reset dependent sector
              setCurrentPage(1);
            },
            options: districtOpts.map((d) => ({ label: d.label, value: d.label })),
          },
          {
            key: "sector",
            label: "Sector",
            value: sectorFilter,
            onChange: (val) => {
              setSectorFilter(val);
              setCurrentPage(1);
            },
            options: sectorOpts.map((s) => ({ label: s.label, value: s.label })),
          },
          {
            key: "healthCenter",
            label: "Health Center",
            value: hospitalFilter,
            onChange: (val) => {
              setHospitalFilter(val);
              setCurrentPage(1);
            },
            options: healthCenters.map((h) => ({ label: h.name, value: h.id })),
          },
          {
            key: "course",
            label: "Course",
            value: courseFilter,
            onChange: (val) => {
              setCourseFilter(val);
              setCurrentPage(1);
            },
            options: courses.map((course: ICourse) => ({
              label: course.title,
              value: course.id,
            })),
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
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            onChange: (val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            },
            options: [
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
            ],
          },
        ]}
        onResetFilters={resetFilters}
        columns={[
          {
            title: roleFilter === "TESTER" ? "Tester" : roleFilter === "CEHO" ? "CEHO" : "CHW",
            key: "fullName",
            sortable: true,
            render: (row: IStudent) => {
              const initials = row.fullName?.substring(0, 2).toUpperCase() || "??";
              return (
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 rounded-full bg-[#EBF0F9] dark:bg-slate-700 text-[#3363AD] dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0'>
                    {initials}
                  </div>
                  <span className={`font-semibold ${V2_STRONG}`}>{row.fullName}</span>
                </div>
              );
            },
          },
          {
            title: "Phone Number",
            key: "phoneNumber",
            sortable: true,
          },
          {
            title: "District/Sector",
            key: "location",
            sortable: true,
            render: (row: IStudent) => (
              <div>
                {row.district} / {row.sector}
              </div>
            ),
          },
          {
            title: "Courses",
            key: "courses",
            sortable: true,
            render: (row: IStudent) => (
              <div className={`font-semibold ${V2_STRONG}`}>
                {row.courses.length > 1
                  ? `${row.courses.length} courses`
                  : row.courses[0] || "No courses"}
              </div>
            ),
          },
          {
            title: "Progress",
            key: "progress",
            sortable: true,
            render: (row: IStudent) => (
              <div className='w-32'>
                <div className='flex justify-between text-[11px] mb-1'>
                  <span className='font-semibold text-[#9AA3B2]'>Completion</span>
                  <span className={`font-bold tabular-nums ${V2_STRONG}`}>{row.progress}</span>
                </div>
                <div className='h-2 w-full bg-[#E8EEF4] dark:bg-slate-700 rounded-full overflow-hidden'>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      row.progress === "100%" ? "bg-emerald-500" : "bg-[#3363AD]"
                    }`}
                    style={{ width: row.progress }}
                  ></div>
                </div>
              </div>
            ),
          },
          {
            title: "Created",
            key: "createdAt",
            sortable: true,
            render: (row: IStudent) => (
              <div className='text-xs whitespace-nowrap'>
                {formatDate(row.createdAt)}
              </div>
            ),
          },
          {
            title: "Actions",
            key: "actions",
            render: (row: IStudent) => {
              return (
                <TableActions>
                  <StudentTableActions
                    item={row}
                    learnerRole={roleFilter}
                    showPromote={roleFilter === "TRAINEE"}
                    showDemote={roleFilter === "CEHO"}
                  />
                </TableActions>
              );
            },
          },
        ]}
        data={data?.data || []}
        searchFun={handleSearch}
      />
    </>
  );

  if (hideHeader) {
    return <div className='w-full'>{tableContent}</div>;
  }

  return (
    <PageContent isLoading={isLoading} hasPadding={true} title='CHWs'>
      {tableContent}
    </PageContent>
  );
};

export default StudentsList;
