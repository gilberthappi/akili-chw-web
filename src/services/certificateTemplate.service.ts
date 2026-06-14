import api from "./api";

export interface CertificateTemplateSummary {
  id: string;
  name: string;
  thumbnail?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CertificateTemplate extends CertificateTemplateSummary {
  canvasJson: unknown;
}

const EMPTY_CANVAS = { version: "6.0.0", objects: [], background: "#ffffff" };

export const listCertificateTemplates = async (): Promise<CertificateTemplateSummary[]> => {
  const res = await api.get("/certificate-templates");
  return (res.data?.data as CertificateTemplateSummary[]) ?? [];
};

export const getCertificateTemplate = async (id: string): Promise<CertificateTemplate> => {
  const res = await api.get(`/certificate-templates/${id}`);
  return res.data?.data as CertificateTemplate;
};

export const createCertificateTemplate = async (name: string): Promise<CertificateTemplate> => {
  const res = await api.post("/certificate-templates", { name, canvasJson: EMPTY_CANVAS });
  return res.data?.data as CertificateTemplate;
};

export const updateCertificateTemplate = async (
  id: string,
  data: { name?: string; canvasJson?: unknown; thumbnail?: string },
): Promise<CertificateTemplate> => {
  const res = await api.put(`/certificate-templates/${id}`, data);
  return res.data?.data as CertificateTemplate;
};

export const deleteCertificateTemplate = async (id: string): Promise<void> => {
  await api.delete(`/certificate-templates/${id}`);
};
