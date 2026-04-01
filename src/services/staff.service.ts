import { IStaff, IPaged, IResponse } from "@/types";
import api from "./api";

export const getAllStaff = async (params?: string): Promise<IPaged<IStaff[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/auth/staffs${queryParams}`)).data;
};

export const getStaffById = async (id: string): Promise<IResponse<IStaff>> => {
  return (await api.get(`/staff/${id}`)).data;
};

export const createStaff = async (
  data: Partial<IStaff>
): Promise<IResponse<IStaff>> => {
  return (await api.post("/staff", data)).data;
};

export const updateStaff = async (
  id: string,
  data: Partial<IStaff>
): Promise<IResponse<IStaff>> => {
  return (await api.put(`/staff/${id}`, data)).data;
};

export const deleteStaff = async (id: string): Promise<IResponse<null>> => {
  return (await api.delete(`/staff/${id}`)).data;
};
