import api from "./api";

export type ChwRegistryStatus = "registered" | "pending";

export interface ChwRegistryInput {
  NID: string;
  fullNames: string;
  phoneNumber?: string | null;
  gender?: string | null;
  birthdate?: string | null;
  district: string;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  healthCenterId?: string | null;
}

export interface IChwRegistryEntry {
  id: string;
  NID: string;
  fullNames: string;
  phoneNumber: string | null;
  gender: string | null;
  birthdate: string | null;
  district: string;
  sector: string | null;
  cell: string | null;
  village: string | null;
  healthCenterId: string | null;
  healthCenter: { id: string; name: string } | null;
  hasAccount: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IChwRegistryStats {
  total: number;
  registered: number;
  pending: number;
  withoutHealthCenter: number;
  districts: number;
  healthCenters: number;
}

export interface IChwRegistryListResponse {
  data: IChwRegistryEntry[];
  stats: IChwRegistryStats;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface IChwRegistryImportResult {
  received: number;
  created: number;
  updated: number;
  skipped: number;
  errors: { index: number; NID: string; message: string }[];
}

export const getChwRegistry = async (params: {
  searchq?: string;
  district?: string;
  healthCenterId?: string;
  status?: ChwRegistryStatus;
  page?: number;
  limit?: number;
}): Promise<IChwRegistryListResponse> => {
  const res = await api.get("/chw-registry", { params });
  return res.data;
};

export const createChwRegistryEntry = async (payload: ChwRegistryInput) => {
  const res = await api.post("/chw-registry", payload);
  return res.data;
};

export const updateChwRegistryEntry = async (id: string, payload: ChwRegistryInput) => {
  const res = await api.put(`/chw-registry/${id}`, payload);
  return res.data;
};

export const deleteChwRegistryEntry = async (id: string) => {
  const res = await api.delete(`/chw-registry/${id}`);
  return res.data;
};

export const importChwRegistry = async (
  rows: ChwRegistryInput[],
  updateExisting: boolean,
): Promise<{ data: IChwRegistryImportResult }> => {
  const res = await api.post("/chw-registry/import", { rows, updateExisting });
  return res.data;
};
