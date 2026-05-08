import api from "./api";
import { IResponse } from "@/types";

export const enrollInCourse = async (courseId: string): Promise<IResponse<unknown>> => {
  return (await api.post(`/progress/enroll/${courseId}`)).data;
};

export const markSlideComplete = async (slideId: string): Promise<IResponse<unknown>> => {
  return (await api.post("/progress/slide/complete", { slideId, isCompleted: true })).data;
};

export const getCourseProgress = async (courseId: string): Promise<IResponse<unknown>> => {
  return (await api.get(`/progress/student/course/${courseId}`)).data;
};

export interface ICourseStatEntry {
  courseId: string;
  title: string;
  coverIcon: string;
  description: string | null;
  totalChapters: number;
  totalTests: number;
  completedTests: number;
  courseDuration: number;
  isEnrolled: boolean;
  isStarted: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  enrollmentDate: string | null;
  progress: number;
}

export interface ILastViewedLocation {
  courseId: string;
  courseTitle: string;
  coverIcon: string;
  chapterId: string;
  chapterTitle: string;
  slideId: string;
  lastViewedAt: string;
}

export interface IStudentStatistics {
  summary: {
    totalCourses: number;
    enrolledCourses: number;
    completedCourses: number;
    startedCourses: number;
  };
  courses: ICourseStatEntry[];
  lastViewedLocation: ILastViewedLocation | null;
}

export const getStudentStatistics = async (): Promise<IStudentStatistics> => {
  const res = await api.get("/progress/student/statistics");
  return res.data?.data as IStudentStatistics;
};
