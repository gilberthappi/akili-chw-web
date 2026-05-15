import api from "./api";
import { getBackendURL } from "@/config/api.config";

export interface IRecordingEvent {
  id: string;
  title: string;
  startAt: string;
}

export interface IRecordingUser {
  id: string;
  fullNames: string;
  email: string;
  photo: string;
}

export interface IMeetingRecording {
  id: string;
  eventId: string | null;
  userId: string;
  url: string;
  title: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  event?: IRecordingEvent | null;
  user?: IRecordingUser;
}

export const buildRecordingUrl = (url: string): string => {
  if (url.startsWith("http")) return url;
  return `${getBackendURL()}${url}`;
};

export const getAllRecordings = async (): Promise<{ data: IMeetingRecording[] }> => {
  return (await api.get("/recordings/")).data;
};

export const getPublishedRecordings = async (): Promise<{ data: IMeetingRecording[] }> => {
  return (await api.get("/recordings/published")).data;
};

export const publishRecording = async (id: string): Promise<{ data: IMeetingRecording }> => {
  return (await api.patch(`/recordings/${id}/publish`)).data;
};

export const unpublishRecording = async (id: string): Promise<{ data: IMeetingRecording }> => {
  return (await api.patch(`/recordings/${id}/unpublish`)).data;
};

export const deleteRecording = async (id: string): Promise<void> => {
  await api.delete(`/recordings/${id}`);
};
