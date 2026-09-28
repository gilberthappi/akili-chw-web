import { IStaff, IPaged, IResponse } from "@/types";
import api from "./api";

export type StaffDepartment = "WELTEL" | "RBC" | "SFH" | "CIIC_HIN";

export type StaffListResponse = IPaged<IStaff[]> & {
  /** null = platform-wide view (legacy ADMIN / DEVELOPER). */
  department: StaffDepartment | null;
  canWrite: boolean;
  assignableRoles: string[];
};

export interface IStaffStats {
  department: StaffDepartment | null;
  total: number;
  activeLast30Days: number;
  neverLoggedIn: number;
  addedThisMonth: number;
}

export const getAllStaff = async (params?: string): Promise<StaffListResponse> => {
  const queryParams = params ?? "";
  return (await api.get(`/auth/staffs${queryParams}`)).data;
};

export const getStaffStats = async (): Promise<IResponse<IStaffStats>> => {
  return (await api.get("/auth/staffs/statistics/summary")).data;
};

export const getStaffById = async (id: string): Promise<IResponse<IStaff>> => {
  return (await api.get(`/auth/staffs/${id}`)).data;
};

export const createStaff = async (
  data: Record<string, unknown>,
): Promise<IResponse<IStaff>> => {
  return (await api.post("/auth/staffs", data)).data;
};

export const updateStaff = async (
  userId: string,
  data: Record<string, unknown>,
): Promise<IResponse<unknown>> => {
  return (await api.put(`/auth/update/${userId}`, data)).data;
};

export const updateStaffInfo = async (
  staffId: string,
  data: Record<string, unknown>,
): Promise<IResponse<unknown>> => {
  return (await api.put(`/auth/staffs/${staffId}`, data)).data;
};

export const deleteStaff = async (id: string): Promise<IResponse<null>> => {
  return (await api.delete(`/auth/staffs/${id}`)).data;
};
