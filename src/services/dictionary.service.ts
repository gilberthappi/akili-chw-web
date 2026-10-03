import api from "./api";

export interface DictionaryTermInput {
  term: string;
  termRw?: string | null;
  abbreviation?: string | null;
  definition: string;
  definitionRw?: string | null;
  category?: string | null;
}

export interface IDictionaryTerm {
  id: string;
  term: string;
  termRw: string | null;
  abbreviation: string | null;
  definition: string;
  definitionRw: string | null;
  category: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IDictionaryTermsResponse {
  data: IDictionaryTerm[];
  categories: { name: string; count: number }[];
  totalTerms: number;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface IDictionaryImportResult {
  received: number;
  created: number;
  updated: number;
  skipped: number;
  errors: { index: number; term: string; message: string }[];
}

export interface DictionaryResourceInput {
  name: string;
  url: string;
  searchUrl?: string | null;
  description?: string | null;
  language?: string | null;
  category?: string | null;
}

export interface IDictionaryResource extends Required<DictionaryResourceInput> {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const getDictionaryTerms = async (params: {
  searchq?: string;
  category?: string;
  page?: number;
  limit?: number;
}): Promise<IDictionaryTermsResponse> => {
  const res = await api.get("/dictionary/terms", { params });
  return res.data;
};

export const createDictionaryTerm = async (payload: DictionaryTermInput) =>
  (await api.post("/dictionary/terms", payload)).data;

export const updateDictionaryTerm = async (id: string, payload: DictionaryTermInput) =>
  (await api.put(`/dictionary/terms/${id}`, payload)).data;

export const deleteDictionaryTerm = async (id: string) =>
  (await api.delete(`/dictionary/terms/${id}`)).data;

export const importDictionaryTerms = async (
  rows: DictionaryTermInput[],
  updateExisting: boolean,
): Promise<{ data: IDictionaryImportResult }> =>
  (await api.post("/dictionary/terms/import", { rows, updateExisting })).data;

export const exportDictionaryTerms = async (params: { searchq?: string; category?: string }) => {
  const res = await api.get("/dictionary/terms/export", { params, responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `system-glossary-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const getDictionaryResources = async (
  searchq?: string,
): Promise<{ data: IDictionaryResource[] }> =>
  (await api.get("/dictionary/resources", { params: { searchq } })).data;

export const createDictionaryResource = async (payload: DictionaryResourceInput) =>
  (await api.post("/dictionary/resources", payload)).data;

export const updateDictionaryResource = async (id: string, payload: DictionaryResourceInput) =>
  (await api.put(`/dictionary/resources/${id}`, payload)).data;

export const deleteDictionaryResource = async (id: string) =>
  (await api.delete(`/dictionary/resources/${id}`)).data;

export const resourceSearchLink = (resource: Pick<IDictionaryResource, "searchUrl">, query: string) =>
  resource.searchUrl ? resource.searchUrl.replace("{q}", encodeURIComponent(query.trim())) : null;
