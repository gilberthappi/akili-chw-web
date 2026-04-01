/* eslint-disable @typescript-eslint/no-explicit-any */
import { IAnalytics, IResponse, IDashboardStatsResponse, ICourseAnalyticsResponse, IStudentAnalyticsResponse } from "@/types";
import api from "./api";

export const getDashboardStats = async (): Promise<IDashboardStatsResponse> => {
  return (await api.get("/courses/dashboard/statistics")).data;
};

export const getAnalytics = async (params?: string): Promise<IResponse<IAnalytics>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/analytics${queryParams}`)).data;
};

export const getCourseAnalytics = async (): Promise<ICourseAnalyticsResponse> => {
  return (await api.get("export/dashboard/course/analytics")).data;
};

export const getStudentAnalytics = async (): Promise<IStudentAnalyticsResponse> => {
  return (await api.get("/export/dashboard/student/analytics")).data;
};

export const getTrainerAnalytics = async (trainerId: string): Promise<IResponse<any>> => {
  return (await api.get(`/analytics/trainers/${trainerId}`)).data;
};
