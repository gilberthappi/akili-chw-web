import api from "./api";

export interface IDocument {
  id: string;
  fileName: string;
  file: string;
  courseId: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getAllDocuments = async (): Promise<{ data: IDocument[] }> => {
  const res = await api.get('/documents');
  return res.data;
};

export const createDocument = async (payload: { fileName: string; file: string; courseId: string; }) => {
  const res = await api.post('/documents', payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  return res.data;
};

export const updateDocument = async (id: string, payload: { fileName: string; file: string; courseId: string; }) => {
  const res = await api.put(`/documents/${id}`, payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  return res.data;
};

export type RagIngestStatus = "pending" | "processing" | "completed" | "failed";

export interface ILibraryDocument extends IDocument {
  ragIngestStatus: RagIngestStatus | null;
  ragIngestError: string | null;
  ragIngestedAt: string | null;
  course: { id: string; title: string; isPublished: boolean };
  ragDocumentCount: number;
  chunkCount: number;
  hasEmbeddings: boolean;
}

export interface IDocumentLibraryStats {
  total: number;
  embedded: number;
  missing: number;
  failed: number;
  inProgress: number;
  coursesCovered: number;
}

export interface IDocumentLibraryResponse {
  data: ILibraryDocument[];
  stats: IDocumentLibraryStats;
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
}

export const getDocumentLibrary = async (params: {
  searchq?: string;
  courseId?: string;
  embedding?: string;
  page?: number;
  limit?: number;
}): Promise<IDocumentLibraryResponse> => {
  const res = await api.get('/documents/library', { params });
  return res.data;
};

export const reingestDocument = async (id: string) => {
  const res = await api.post(`/documents/${id}/reingest`);
  return res.data;
};

export const deleteDocument = async (id: string) => {
  const res = await api.delete(`/documents/${id}`);
  return res.data;
};
