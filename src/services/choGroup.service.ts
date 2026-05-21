import api from "./api";
import {
  ICHOGroup,
  ICHOGroupMember,
  ICHOGroupInvitation,
  ICHOGroupMonitoring,
  IStudentSearchResult,
} from "@/types";

export const getMyGroup = async (): Promise<ICHOGroup> => {
  const res = await api.get("/cho-groups/mine");
  return res.data.data;
};

export const getMyGroupMembers = async (): Promise<ICHOGroupMember[]> => {
  const res = await api.get("/cho-groups/mine/members");
  return res.data.data;
};

export const getGroupMonitoring = async (): Promise<ICHOGroupMonitoring> => {
  const res = await api.get("/cho-groups/mine/monitoring");
  return res.data.data;
};

export const inviteMember = async (targetStudentId: string): Promise<ICHOGroupInvitation> => {
  const res = await api.post("/cho-groups/mine/invitations", { targetStudentId });
  return res.data.data;
};

export const searchStudentsForInvite = async (search?: string): Promise<IStudentSearchResult[]> => {
  const params = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await api.get(`/students${params}`);
  const raw = res.data;
  const items: any[] = raw?.data?.data ?? raw?.data ?? [];
  return items;
};
