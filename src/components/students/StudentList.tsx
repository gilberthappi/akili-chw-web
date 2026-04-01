/* eslint-disable react-hooks/exhaustive-deps */
import {
  useState,
  FC,
  useCallback,
  useEffect,
} from "react";
import { studentKeys } from "@/utils/constants/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import Table from "@/components/table/Table";
// import TableActions from "@/components/table/TableActions";
// import StudentTableActions from "./StudentTableActions";
import PageContent from "@/components/common/PageContent";
import { formatDate } from "@/utils/formats/formats";
import { getAllStudents, IStudent } from "@/services/students.service";
import StudentTableActions from "./StudentTableActions";
import TableActions from "../table/TableActions";

interface StudentsListProps {
  hideHeader?: boolean;
  filter?: string;
}

const StudentsList: FC<StudentsListProps> = ({ hideHeader = false, filter }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // Build query parameters
  const buildQueryParams = (page: number, keyword?: string) => {
    const params = new URLSearchParams();
    
    if (page > 1) params.append('page', page.toString());
    if (keyword) params.append('searchq', keyword);
    
    // Add filter for status or other filters if needed
    if (filter === "active") {
      params.append('status', 'active');
    } else if (filter === "inactive") {
      params.append('status', 'inactive');
    }
    
    const queryString = params.toString();
    return queryString ? `?${queryString}` : '';
  };

  // Main query with all parameters including filter
  const { data, isLoading } = useQuery({
    queryKey: studentKeys.list(`${filter}-${buildQueryParams(currentPage, searchKeyword)}`),
    queryFn: () => getAllStudents(buildQueryParams(currentPage, searchKeyword)),
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

  // Reset page and search when filter changes
  const resetFilters = () => {
    setCurrentPage(1);
    setSearchKeyword("");
  };

  // Effect to reset pagination and search when filter changes
  useEffect(() => {
    resetFilters();
  }, [filter]);

  const tableContent = (
    <>
      <Table
        isLoading={isLoading}
        currentPage={data?.currentPage || 1}
        totalItems={data?.totalItems || 30}
        itemsPerPage={data?.itemsPerPage || 15}
        onChangePage={onChangePage}
        columns={[
          {
            title: "Student Name",
            key: "fullName",
          },
          {
            title: "Phone Number",
            key: "phoneNumber",
          },
          {
            title: "District/Sector",
            key: "location",
            render: (row: IStudent) => (
              <div>
                {row.district} / {row.sector}
              </div>
            ),
          },
          {
            title: "Courses",
            key: "courses",
            render: (row: IStudent) => (
              <div className="font-medium">
                {row.courses.length > 1
                  ? `${row.courses.length} courses`
                  : row.courses[0] || "No courses"}
              </div>
            ),
          },
          {
            title: "Progress",
            key: "progress",
            render: (row: IStudent) => (
              <div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      row.progress === "100%"
                        ? "bg-green-500"
                        : "bg-[#4d81d2]"
                    }`}
                    style={{ width: row.progress }}
                  ></div>
                </div>
                <span className="text-xs mt-1 block text-gray-500">
                  {row.progress}
                </span>
              </div>
            ),
          },
          {
            title: "Created",
            key: "createdAt",
            render: (row: IStudent) => (
              <div className="text-sm text-gray-600">
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
                  <StudentTableActions item={row} />
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
    <PageContent
      isLoading={isLoading}
      hasPadding={true}
      title='Students'
    >
      {tableContent}
    </PageContent>
  );
};

export default StudentsList;
