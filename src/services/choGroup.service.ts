import api from "./api";
import {
  ICHOGroup,
  ICHOGroupMember,
  ICHOGroupInvitation,
  ICHOGroupMonitoring,
  IStudentSearchResult,
} from "@/types";

export interface ICHOGroupDetail extends ICHOGroup {
  members: ICHOGroupMember[];
}

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
  const res = await api.get(`/cho-groups/mine/invite-candidates${params}`);
  return res.data.data ?? [];
};

// ─── Admin functions ─────────────────────────────────────────────────────────

export const adminGetAllGroups = async (
  limit = 20,
  offset = 0,
): Promise<{ groups: ICHOGroup[]; total: number }> => {
  const res = await api.get(`/cho-groups/?limit=${limit}&offset=${offset}`);
  return res.data.data;
};

export const adminCreateGroup = async (data: {
  name: string;
  choStudentId: string;
  sector?: string;
  description?: string;
}): Promise<ICHOGroup> => {
  const res = await api.post("/cho-groups/", data);
  return res.data.data;
};

export const adminGetGroupById = async (groupId: string): Promise<ICHOGroupDetail> => {
  const res = await api.get(`/cho-groups/${groupId}`);
  return res.data.data;
};

export const adminAddMember = async (
  groupId: string,
  studentId: string,
): Promise<ICHOGroupMember> => {
  const res = await api.post(`/cho-groups/${groupId}/members`, { studentId });
  return res.data.data;
};

export const adminRemoveMember = async (
  groupId: string,
  studentId: string,
): Promise<void> => {
  await api.delete(`/cho-groups/${groupId}/members/${studentId}`);
};

// ─── CHW invitation functions ─────────────────────────────────────────────────

export const getMyInvitations = async (): Promise<ICHOGroupInvitation[]> => {
  const res = await api.get("/cho-groups/invitations/mine");
  return res.data.data ?? [];
};

export const respondToInvitation = async (
  invitationId: string,
  accept: boolean,
): Promise<ICHOGroupInvitation> => {
  const res = await api.patch(`/cho-groups/invitations/${invitationId}`, { accept });
  return res.data.data;
};
