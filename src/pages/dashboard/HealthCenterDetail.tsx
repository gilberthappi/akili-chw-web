import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  Users,
  Award,
  Calendar,
  HelpCircle,
  TrendingUp,
  Shield,
  BookOpen,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { getHospitalById } from "@/services/healthCenters.service";
import { getAllStudents, IStudent } from "@/services/students.service";

import Table from "@/components/table/Table";
import TableActions from "@/components/table/TableActions";
import StudentTableActions from "@/components/students/StudentTableActions";
import { formatDate } from "@/utils/formats/formats";
import SyncLoader from "react-spinners/SyncLoader";

interface HealthCenterDetailProps {
  healthCenterId?: string;
  onBack?: () => void;
}

export const HealthCenterDetail: React.FC<HealthCenterDetailProps> = ({
  healthCenterId: propId,
  onBack,
}) => {
  const routeParams = useParams<{ id: string }>();
  const id = propId || routeParams.id;
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/dashboard/healthCenters");
    }
  };

  const [activeTab, setActiveTab] = useState<"chws" | "events" | "performance">("chws");


  // Search & Filter state for CHWs table inside detail page
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // Query Health Center Details
  const { data: hcResponse, isLoading: isHcLoading } = useQuery({
    queryKey: ["healthCenter", id],
    queryFn: () => getHospitalById(id!),
    enabled: Boolean(id),
  });

  const healthCenter = hcResponse?.data;

  // Query CHWs for this Health Center
  const buildChwQuery = () => {
    const params = new URLSearchParams();
    if (id) params.append("healthCenterId", id);
    if (currentPage > 1) params.append("page", currentPage.toString());
    if (searchQuery) params.append("searchq", searchQuery);
    params.append("limit", limit.toString());
    if (sortBy) params.append("sortBy", sortBy);
    if (order) params.append("order", order);
    if (statusFilter) params.append("status", statusFilter);
    return `?${params.toString()}`;
  };

  const { data: chwResponse, isLoading: isChwLoading } = useQuery({
    queryKey: ["healthCenter-chws", id, buildChwQuery()],
    queryFn: () => getAllStudents(buildChwQuery()),
    enabled: Boolean(id),
  });

  const chwsList: IStudent[] = chwResponse?.data || [];

  // Calculate Average Progress of CHWs
  const avgProgress = useMemo(() => {
    if (!chwsList || chwsList.length === 0) return 0;
    const sum = chwsList.reduce((acc, student) => {
      const numericVal = parseFloat(student.progress?.replace("%", "") || "0") || 0;
      return acc + numericVal;
    }, 0);
    return Math.round(sum / chwsList.length);
  }, [chwsList]);

  // Aggregate Overall Performance by Course for this Health Center
  const coursePerformanceStats = useMemo(() => {
    if (!chwsList || chwsList.length === 0) return [];
    const map = new Map<
      string,
      { courseName: string; enrolledCount: number; progressSum: number; completedCount: number }
    >();

    chwsList.forEach((student) => {
      const studentProgress = parseFloat(student.progress?.replace("%", "") || "0") || 0;
      student.courses?.forEach((cName) => {
        if (!map.has(cName)) {
          map.set(cName, {
            courseName: cName,
            enrolledCount: 0,
            progressSum: 0,
            completedCount: 0,
          });
        }
        const entry = map.get(cName)!;
        entry.enrolledCount += 1;
        entry.progressSum += studentProgress;
        if (studentProgress >= 100) {
          entry.completedCount += 1;
        }
      });
    });

    return Array.from(map.values()).map((item) => ({
      courseName: item.courseName,
      enrolledCount: item.enrolledCount,
      avgProgress: Math.round(item.progressSum / (item.enrolledCount || 1)),
      completedCount: item.completedCount,
      completionRate: Math.round((item.completedCount / (item.enrolledCount || 1)) * 100),
    }));
  }, [chwsList]);


  if (isHcLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <SyncLoader color="#3363AD" size={12} />
        <p className="text-sm font-medium text-gray-500">Loading Health Center details…</p>
      </div>
    );
  }

  if (!healthCenter) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h3 className="text-xl font-bold text-gray-800">Health Center Not Found</h3>
        <p className="text-sm text-gray-500">The requested Health Center record does not exist or has been removed.</p>
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3363AD] rounded-xl hover:bg-[#284e88] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Health Centers</span>
        </button>
      </div>
    );
  }

  const cehoDisplayName = healthCenter.cehoName || healthCenter.chwSupervisor || "Not Assigned";
  const cehoContactPhone = healthCenter.cehoContact || healthCenter.chwSupervisorContact || "—";

  return (
    <div className="space-y-6">
      {/* ── Hero Card ── */}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#3363AD]/5 to-transparent rounded-bl-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#3363AD]/10 text-[#3363AD] flex items-center justify-center text-2xl font-bold shrink-0">
              <Building2 className="w-7 h-7 text-[#3363AD]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{healthCenter.name}</h1>
                {healthCenter.province && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md">
                    {healthCenter.province} Province
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#3363AD]" />
                  <span>{healthCenter.district} / {healthCenter.sector} {healthCenter.cell ? `/ ${healthCenter.cell}` : ""}</span>
                </div>
                {healthCenter.contact && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{healthCenter.contact}</span>
                  </div>
                )}
                {healthCenter.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{healthCenter.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CEHO Officer Badge Card */}
          <div className="bg-[#EFF1F8] border border-[#D1D8ED] rounded-xl p-4 min-w-[260px] shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold text-[#3363AD] uppercase tracking-wider mb-2">
              <Shield className="w-4 h-4 text-[#3363AD]" />
              <span>CEHO (Supervisor)</span>
            </div>
            <div className="text-base font-bold text-gray-900">{cehoDisplayName}</div>
            <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>{cehoContactPhone}</span>
            </div>
          </div>
        </div>

        {/* Catchment Area Banner */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Catchment Area</span>
            <div className="group relative cursor-help">
              <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-[#3363AD] transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-30 text-center">
                Geographical sectors, cells, or villages served by this Health Center.
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {healthCenter.catchmentArea && healthCenter.catchmentArea.length > 0 ? (
              healthCenter.catchmentArea.map((area, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 text-xs font-medium bg-[#3363AD]/10 text-[#3363AD] rounded-full border border-[#3363AD]/20"
                >
                  {area}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-500 italic">
                {healthCenter.sector} Sector & surrounding cells
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Cards (3 Clean Cards - Duplicate CEHO Card Removed) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total CHWs */}
        <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total CHWs</p>
            <h3 className="text-2xl font-bold text-gray-900">{healthCenter.totalChws || chwsList.length || 0}</h3>
            <p className="text-xs text-gray-500">Registered in facility</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#3363AD] flex items-center justify-center text-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active CHWs */}
        <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active CHWs</p>
            <h3 className="text-2xl font-bold text-emerald-600">{healthCenter.activeChws || 0}</h3>
            <p className="text-xs text-emerald-600 font-medium">Platform active users</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Overall CHW Progress */}
        <div className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Progress</p>
            <h3 className="text-2xl font-bold text-[#3363AD]">{avgProgress}%</h3>
            <p className="text-xs text-gray-500">Course completion rate</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#3363AD]/10 text-[#3363AD] flex items-center justify-center text-xl shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>


      {/* ── Tabs Navigation ── */}
      <div className="border-b border-gray-200 flex items-center gap-6">
        <button
          onClick={() => setActiveTab("chws")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "chws"
              ? "border-[#3363AD] text-[#3363AD]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>CHWs Roster ({healthCenter.totalChws || chwsList.length || 0})</span>
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "events"
              ? "border-[#3363AD] text-[#3363AD]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Events & Meetings</span>
        </button>
        <button
          onClick={() => setActiveTab("performance")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "performance"
              ? "border-[#3363AD] text-[#3363AD]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Performance & Analytics</span>
        </button>
      </div>

      {/* ── Tab Contents ── */}
      {activeTab === "chws" && (
        <div className="space-y-4">
          <Table
            isLoading={isChwLoading}
            currentPage={chwResponse?.currentPage || 1}
            totalItems={chwResponse?.totalItems || chwsList.length}
            itemsPerPage={limit}
            onChangePage={(page) => setCurrentPage(page)}
            searchFun={(term) => {
              setSearchQuery(term);
              setCurrentPage(1);
            }}
            onSort={(key, dir) => {
              setSortBy(key);
              setOrder(dir);
              setCurrentPage(1);
            }}
            currentSortKey={sortBy}
            currentSortOrder={order}
            onRowsPerPageChange={(newLimit) => {
              setLimit(newLimit);
              setCurrentPage(1);
            }}
            filters={[
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
            onResetFilters={() => {
              setSearchQuery("");
              setStatusFilter("");
              setSortBy("createdAt");
              setOrder("desc");
              setCurrentPage(1);
            }}
            columns={[
              {
                title: "CHW Name",
                key: "fullName",
                sortable: true,
                render: (row: IStudent) => {
                  const initials = row.fullName?.substring(0, 2).toUpperCase() || "??";
                  return (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#3363AD]/10 text-[#3363AD] flex items-center justify-center text-xs font-bold shrink-0">
                        {initials}
                      </div>
                      <span className="font-medium text-gray-900">{row.fullName}</span>
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
                title: "District / Sector",
                key: "location",
                render: (row: IStudent) => (
                  <div className="text-gray-600">
                    {row.district} / {row.sector} {row.cell ? `(${row.cell})` : ""}
                  </div>
                ),
              },
              {
                title: "Courses",
                key: "courses",
                render: (row: IStudent) => (
                  <div className="font-medium text-gray-700">
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
                  <div className="w-32">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500 font-medium">Completion</span>
                      <span className="text-gray-700 font-bold">{row.progress}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          row.progress === "100%" ? "bg-emerald-500" : "bg-[#3363AD]"
                        }`}
                        style={{ width: row.progress }}
                      />
                    </div>
                  </div>
                ),
              },
              {
                title: "Registration",
                key: "createdAt",
                sortable: true,
                render: (row: IStudent) => (
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(row.createdAt)}
                  </div>
                ),
              },
              {
                title: "Actions",
                key: "actions",
                render: (row: IStudent) => (
                  <TableActions>
                    <StudentTableActions item={row} showPromote={true} />
                  </TableActions>
                ),
              },
            ]}
            data={chwsList}
          />
        </div>
      )}

      {activeTab === "events" && (
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <Calendar className="w-10 h-10 text-[#3363AD] mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">Health Center Virtual Meetings & Events</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            View training webinars, supervisor meetings, and virtual sessions scheduled for Community Health Workers at {healthCenter.name}.
          </p>
        </div>
      )}

      {activeTab === "performance" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#3363AD]" />
                  <span>Overall CHW Progress by Course</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Detailed performance breakdown across courses taken by Community Health Workers at {healthCenter.name}.
                </p>
              </div>
              <div className="px-3 py-1.5 bg-[#3363AD]/10 text-[#3363AD] rounded-lg text-xs font-bold shrink-0">
                Facility Avg: {avgProgress}%
              </div>
            </div>

            {coursePerformanceStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-500 bg-gray-50 uppercase tracking-wider border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3">Course Title</th>
                      <th className="px-6 py-3 text-center">Enrolled CHWs</th>
                      <th className="px-6 py-3 text-center">Avg Completion Progress</th>
                      <th className="px-6 py-3 text-center">Passed / Certified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {coursePerformanceStats.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#3363AD] flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <span>{item.courseName}</span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-gray-800">
                          {item.enrolledCount} CHWs
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-[200px] mx-auto space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-gray-600">Average</span>
                              <span className="text-[#3363AD]">{item.avgProgress}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  item.avgProgress >= 100 ? "bg-emerald-500" : "bg-[#3363AD]"
                                }`}
                                style={{ width: `${item.avgProgress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {item.completedCount} / {item.enrolledCount} passed ({item.completionRate}%)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-xl text-gray-500 text-sm">
                No course progress data recorded yet for CHWs at this Health Center.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default HealthCenterDetail;
