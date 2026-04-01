import { IHospital, IPaged, IResponse } from "@/types";
import api from "./api";

export const getAllHospitals = async (params?: string): Promise<IPaged<IHospital[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/hospitals${queryParams}`)).data;
};

export const getHospitalById = async (id: string): Promise<IResponse<IHospital>> => {
  return (await api.get(`/hospitals/${id}`)).data;
};

export const createHospital = async (
  data: Partial<IHospital>
): Promise<IResponse<IHospital>> => {
  return (await api.post("/hospitals", data)).data;
};

export const updateHospital = async (
  id: string,
  data: Partial<IHospital>
): Promise<IResponse<IHospital>> => {
  return (await api.put(`/hospitals/${id}`, data)).data;
};

export const deleteHospital = async (id: string): Promise<IResponse<null>> => {
  return (await api.delete(`/hospitals/${id}`)).data;
};