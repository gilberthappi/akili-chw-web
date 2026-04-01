import { ICourse, IPaged, IResponse, TDashboardStatisticsResponse } from "@/types";
import api from "./api";

export const getAllCourses = async (params?: string): Promise<IPaged<ICourse[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/courses${queryParams}`)).data;
};

export const getAllCoursesStats = async (): Promise<TDashboardStatisticsResponse> => {
  return (await api.get('/courses/dashboard/statistics')).data;
};

export const getAllCoursesNoPagination = async (params?: string): Promise<IResponse<ICourse[]>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/courses/all${queryParams}`)).data;
};

export const getCourseById = async (id: string): Promise<IResponse<ICourse>> => {
  return (await api.get(`/courses/${id}`)).data;
};

export const createCourse = async (
  data: Record<string, unknown>
): Promise<unknown> => {
  return (await api.post("/courses/super", data, {
    headers: {
      'Content-Type': 'application/json',
    },
  })).data;
};

export const updateCourse = async (
  id: string,
  data: Record<string, unknown>,
): Promise<unknown> => {
  return (await api.put(`/courses/super/${id}`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  })).data;
};

export const deleteCourse = async (id: string): Promise<number> => {
  return (await api.delete(`/courses/${id}`)).data;
};