import { IHealthCenter, IPaged, IResponse } from "@/types";
import api from "./api";

export const getAllHospitals = async (params?: string): Promise<IPaged<IHealthCenter[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/healthCenters${queryParams}`)).data;
};

/** Unpaginated list — use for map/analytics, not the healthCenters table. */
export const listAllHospitals = async (searchq?: string): Promise<IResponse<IHealthCenter[]>> => {
  const qs = searchq ? `?searchq=${encodeURIComponent(searchq)}` : "";
  return (await api.get(`/healthCenters/all${qs}`)).data;
};

export const getPublicHospitals = async (params?: {
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
}): Promise<IHealthCenter[]> => {
  const res = await api.get("/healthCenters/public", { params });
  const body = res.data;
  return Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
};

export const getHospitalById = async (id: string): Promise<IResponse<IHealthCenter>> => {
  return (await api.get(`/healthCenters/${id}`)).data;
};

export const createHospital = async (
  data: Partial<IHealthCenter>
): Promise<IResponse<IHealthCenter>> => {
  return (await api.post("/healthCenters", data)).data;
};

export const updateHospital = async (
  id: string,
  data: Partial<IHealthCenter>
): Promise<IResponse<IHealthCenter>> => {
  return (await api.put(`/healthCenters/${id}`, data)).data;
};

export const deleteHospital = async (id: string): Promise<IResponse<null>> => {
  return (await api.delete(`/healthCenters/${id}`)).data;
};

export const importHospitals = async (
  file: File,
): Promise<{
  statusCode: number;
  message: string;
  data: { total: number; created: number; skipped: number; errors: string[] };
}> => {
  const formData = new FormData();
  formData.append("file", file);
  return (
    await api.post("/healthCenters/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  ).data;
};