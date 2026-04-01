import { IEvent, IResponse } from "@/types";
import api from "./api";

export const getAllEvents = async (): Promise<IResponse<IEvent[]>> => {
  return (await api.get("/calendar/events")).data;
};

export const getEventById = async (id: string): Promise<IResponse<IEvent>> => {
  return (await api.get(`/calendar/events/${id}`)).data;
};

export const createEvent = async (
  data: Partial<IEvent>
): Promise<IResponse<IEvent>> => {
  return (await api.post("/calendar/events", data)).data;
};

export const updateEvent = async (
  id: string,
  data: Partial<IEvent>
): Promise<IResponse<IEvent>> => {
  return (await api.put(`/calendar/events/${id}`, data)).data;
};

export const deleteEvent = async (id: string): Promise<IResponse<null>> => {
  return (await api.delete(`/calendar/events/${id}`)).data;
};