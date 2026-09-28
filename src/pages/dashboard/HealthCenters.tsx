import React, { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "lodash";
import toast from "react-hot-toast";
import Table from "@/components/table/Table";
import { IHealthCenter } from "@/types";
import {
  exportHospitalsToExcel,
  getAllHospitals,
  getHealthCenterStats,
} from "@/services/healthCenters.service";
import { formatDate } from "@/utils/formats/formats";
import { Building2, Download, Info, Plus, ShieldCheck, TriangleAlert, Upload, Users } from "lucide-react";
import { V2KpiCard, V2KpiSkeleton, V2PageHeader } from "@/components/v2/V2Page";
import {
  V2_BTN_PRIMARY,
  V2_BTN_SECONDARY,
  V2_MUTED,
  V2_PAGE_CANVAS,
  V2_PILL,
  V2_PILL_BLUE,
  V2_STRONG,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
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
  const [sortBy, setSortBy] = useState<string>("totalChws");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [provinceFilter, setProvinceFilter] = useState<string>("");
  const [, setSelectedIds] = useState<string[]>([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: hospitalKeys.stats(provinceFilter),
    queryFn: () => getHealthCenterStats(provinceFilter || undefined),
  });
  const stats = statsRes?.data;
  const coveragePct =
    stats && stats.totalCenters > 0 ? Math.round((stats.withCeho / stats.totalCenters) * 100) : 0;

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
    setSortBy("totalChws");
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

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      toast.loading("Generating Excel file…", { id: "hc-excel-export" });
      const blob = await exportHospitalsToExcel(
        buildQueryParams(1, searchKeyword),
      );
      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `Health_Centers_Export_${dateStr}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel exported successfully", { id: "hc-excel-export" });
    } catch (error: unknown) {
      console.error("Export error:", error);
      toast.error("Failed to export health centers", { id: "hc-excel-export" });
    } finally {
      setIsExporting(false);
    }
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

    <div className={V2_PAGE_CANVAS}>
      <V2PageHeader
        title="Health centers"
        subtitle="Manage health centers and their associated CHW supervisors"
        actions={
          <>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className={`${V2_BTN_SECONDARY} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isExporting ? (
                <span className="w-4 h-4 border-2 border-[#3363AD] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? "Exporting…" : "Export Excel"}
            </button>
            <button type="button" onClick={() => setIsImportOpen(true)} className={V2_BTN_SECONDARY}>
              <Upload className="w-4 h-4" />
              Import Excel
            </button>
            <button type="button" onClick={handleAddHospital} className={V2_BTN_PRIMARY}>
              <Plus className="w-4 h-4" />
              Add Health Center
            </button>
          </>
        }
      />

      {statsLoading ? (
        <V2KpiSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <V2KpiCard
            label="Health Centers"
            value={stats?.totalCenters ?? 0}
            Icon={Building2}
            sub={provinceFilter ? `${provinceFilter} province` : "All provinces"}
          />
          <V2KpiCard
            label="CHWs Linked"
            value={stats?.totalChws ?? 0}
            Icon={Users}
            accent="text-purple-600 dark:text-purple-400"
            sub="Assigned to a center"
          />
          <V2KpiCard
            label="With CEHO"
            value={stats?.withCeho ?? 0}
            Icon={ShieldCheck}
            accent="text-emerald-600 dark:text-emerald-400"
            sub={`${coveragePct}% supervised`}
          />
          <V2KpiCard
            label="No CHWs Yet"
            value={stats?.withoutChws ?? 0}
            Icon={TriangleAlert}
            accent="text-amber-500 dark:text-amber-400"
            sub="Need CHW assignment"
          />
        </div>
      )}

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
                  <div className={`font-bold ${V2_STRONG}`}>{row.name}</div>
                  <div className={`text-xs ${V2_MUTED}`}>
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
              <div className="text-sm">{row.province || "—"}</div>
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
                  <div className={`font-semibold ${V2_STRONG}`}>{cehoName}</div>
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
              <div className={`text-center font-bold tabular-nums text-base ${V2_STRONG}`}>
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
                      className={`${V2_PILL} ${V2_PILL_BLUE}`}
                    >
                      {area}
                    </span>
                  ))
                ) : (
                  <span className={`text-xs italic ${V2_MUTED}`}>
                    {row.sector} Sector & Cells
                  </span>
                )}
                {row.catchmentArea && row.catchmentArea.length > 2 && (
                  <span className="text-xs text-[#9AA3B2] font-medium">
                    +{row.catchmentArea.length - 2} more
                  </span>
                )}
                <div className="group relative cursor-help ml-1">
                  <Info className="w-3.5 h-3.5 text-[#9AA3B2] hover:text-[#3363AD]" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block w-48 p-2 bg-[#1A2332] text-white text-xs rounded-lg shadow-lg z-30 text-center">
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
              <div className="text-sm">
                {row.contact && <div className={`font-medium ${V2_STRONG}`}>{row.contact}</div>}
                {row.email && (
                  <div className={`text-xs ${V2_MUTED}`}>{row.email}</div>
                )}
                {!row.contact && !row.email && <div className="text-[#9AA3B2]">—</div>}
              </div>
            ),
          },
          {
            title: "Created",
            key: "createdAt",
            sortable: true,
            render: (row: IHealthCenter) => (
              <div className="text-xs whitespace-nowrap">
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
