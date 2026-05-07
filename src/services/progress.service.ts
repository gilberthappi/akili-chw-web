import api from "./api";
import { IResponse } from "@/types";

export const enrollInCourse = async (courseId: string): Promise<IResponse<unknown>> => {
  return (await api.post(`/progress/enroll/${courseId}`)).data;
};

export const markSlideComplete = async (slideId: string): Promise<IResponse<unknown>> => {
  return (await api.post("/progress/slide/complete", { slideId })).data;
};

export const getCourseProgress = async (courseId: string): Promise<IResponse<unknown>> => {
  return (await api.get(`/progress/student/course/${courseId}`)).data;
};
