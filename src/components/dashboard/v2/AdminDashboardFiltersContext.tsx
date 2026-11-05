import React, { createContext, useContext, useMemo, useState } from "react";
import { IDashboardFilters } from "@/types";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";

type AdminDashboardFiltersContextValue = {
  filters: IDashboardFilters;
  setFilters: (filters: IDashboardFilters) => void;
};

const AdminDashboardFiltersContext =
  createContext<AdminDashboardFiltersContextValue | null>(null);

export const AdminDashboardFiltersProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [filters, setFilters] = useState<IDashboardFilters>(
    DEFAULT_DASHBOARD_FILTERS,
  );

  const value = useMemo(
    () => ({ filters, setFilters }),
    [filters],
  );

  return (
    <AdminDashboardFiltersContext.Provider value={value}>
      {children}
    </AdminDashboardFiltersContext.Provider>
  );
};

/** Shared V2 admin filters — same shape as classic dashboard. */
export const useAdminDashboardFilters = (): AdminDashboardFiltersContextValue => {
  const ctx = useContext(AdminDashboardFiltersContext);
  if (!ctx) {
    throw new Error(
      "useAdminDashboardFilters must be used within AdminDashboardFiltersProvider",
    );
  }
  return ctx;
};

/** Dashboard filters when this screen sits on the admin board; otherwise null. */
export const useOptionalAdminDashboardFilters = () =>
  useContext(AdminDashboardFiltersContext);
