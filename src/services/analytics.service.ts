/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IAnalytics,
  IResponse,
  IDashboardStatsResponse,
  IDashboardStats,
  ICourseAnalytics,
  ICourseAnalyticsResponse,
  IStudentAnalytics,
  IStudentAnalyticsResponse,
  ITestScoreAnalytics,
  ICommunicationsAnalytics,
  IDemographicsAnalytics,
  IDemographicLearnersResponse,
  ICHWStats,
  ICourseDurationStats,
  IRecentActivityFeed,
  IRecommendationInsightsResponse,
  IMonthlyActiveTrends,
  ICertificationAnalytics,
  ISupervisorResponseRate,
  IAvgStudyTimeByCourse,
} from "@/types";
import api from "./api";

const withQuery = (path: string, qs: string = "") => {
  if (!qs) return path;
  const query = qs.startsWith("?") ? qs.slice(1) : qs;
  return `${path}?${query}`;
};

export const getDashboardStats = async (): Promise<IDashboardStatsResponse> => {
  return (await api.get("/courses/dashboard/statistics")).data;
};

export const getRecommendationInsights = async (): Promise<IRecommendationInsightsResponse> => {
  return (await api.get("/courses/dashboard/recommendations-insights")).data;
};

export const getAnalytics = async (
  params?: string,
): Promise<IResponse<IAnalytics>> => {
  const queryParams = params ? params : "";
  return (await api.get(`/analytics${queryParams}`)).data;
};

export const getCourseAnalytics = async (qs: string = ""): Promise<ICourseAnalyticsResponse> => {
  return (await api.get(withQuery("export/dashboard/course/analytics", qs))).data;
};

export const getStudentAnalytics = async (qs: string = ""): Promise<IStudentAnalyticsResponse> => {
  return (await api.get(withQuery("/export/dashboard/student/analytics", qs))).data;
};

export const getTrainerAnalytics = async (
  trainerId: string,
): Promise<IResponse<any>> => {
  return (await api.get(`/analytics/trainers/${trainerId}`)).data;
};

export const getTestScoreAnalytics = async (qs: string = ""): Promise<
  IResponse<ITestScoreAnalytics>
> => {
  return (await api.get(withQuery("/export/dashboard/test-score/analytics", qs))).data;
};

export const getCommunicationsAnalytics = async (qs: string = ""): Promise<
  IResponse<ICommunicationsAnalytics>
> => {
  return (await api.get(withQuery("/export/dashboard/communications/analytics", qs))).data;
};

export const getDemographicsAnalytics = async (qs: string = ""): Promise<
  IResponse<IDemographicsAnalytics>
> => {
  return (await api.get(withQuery("/export/dashboard/demographics/analytics", qs))).data;
};

export const getDemographicLearners = async (
  qs: string = "",
): Promise<IResponse<IDemographicLearnersResponse>> => {
  return (
    await api.get(withQuery("/export/dashboard/demographics/learners", qs))
  ).data;
};

export const exportDemographicLearners = async (
  qs: string = "",
): Promise<Blob> => {
  const response = await api.get(
    withQuery("/export/dashboard/demographics/learners/export", qs),
    { responseType: "blob" },
  );
  return response.data;
};

export const getCHWDashboardStats = async (qs: string = ""): Promise<IResponse<ICHWStats>> => {
  return (await api.get(withQuery("/export/dashboard/chw-stats", qs))).data;
};

export const getCourseDurationStats = async (qs: string = ""): Promise<
  IResponse<ICourseDurationStats>
> => {
  return (await api.get(withQuery("/export/dashboard/course-duration", qs))).data;
};

export const getRecentActivityFeed = async (qs: string = ""): Promise<
  IResponse<IRecentActivityFeed>
> => {
  return (await api.get(withQuery("/export/dashboard/recent-activity", qs))).data;
};

export const getMonthlyActiveTrends = async (qs: string = ""): Promise<
  IResponse<IMonthlyActiveTrends>
> => {
  return (await api.get(withQuery("/export/dashboard/monthly-active-trends", qs))).data;
};

export const getCertificationAnalytics = async (qs: string = ""): Promise<
  IResponse<ICertificationAnalytics>
> => {
  return (await api.get(withQuery("/export/dashboard/certification-analytics", qs))).data;
};

export const getSupervisorResponseRate = async (qs: string = ""): Promise<
  IResponse<ISupervisorResponseRate>
> => {
  return (await api.get(withQuery("/export/dashboard/supervisor-response-rate", qs))).data;
};

/** First-paint shell: KPIs + small trends (aggregates only). */
export const getDashboardSummary = async (qs: string = ""): Promise<
  IResponse<{
    dashboardStats: IDashboardStats;
    chwStats: ICHWStats;
    monthlyActiveTrends: IMonthlyActiveTrends;
    recentActivity: IRecentActivityFeed;
    enrollmentTrends: { month: string; enrollments: number }[];
    certification: ICertificationAnalytics;
  }>
> => {
  return (await api.get(withQuery("/export/dashboard/summary", qs))).data;
};

/** Admin Dashboard V2 — dedicated KPI cards (filter-aware). */
export const getDashboardV2Kpis = async (
  qs: string = "",
): Promise<
  IResponse<{
    cards: Array<{
      title: string;
      value: number;
      max: number;
      unit: string;
      growth: string;
      growthPositive: boolean;
      icon: "users" | "courses" | "engagement" | "health";
      breakdown: Array<{
        label: string;
        value: number;
        valueMax?: number;
        percent?: string;
      }>;
    }>;
  }>
> => {
  return (await api.get(withQuery("/export/dashboard/v2/kpis", qs))).data;
};

/** Admin Dashboard V2 — Assessment Test Attempts (filter-aware). */
export const getDashboardV2AssessmentAttempts = async (
  qs: string = "",
): Promise<
  IResponse<{
    totalTests: number;
    bars: Array<{
      key: "pre" | "mid" | "post" | "cert";
      name: string;
      tests: number;
      sharePercent: number;
      avgScore: number;
      variation: number;
      variationPositive: boolean;
    }>;
    segments: Array<{ name: string; value: number; color: string }>;
  }>
> => {
  return (
    await api.get(withQuery("/export/dashboard/v2/assessment-attempts", qs))
  ).data;
};

/** Admin Dashboard V2 — Engagement chart by course domain (filter-aware). */
export const getDashboardV2Engagement = async (
  qs: string = "",
): Promise<
  IResponse<{
    timeframe: "today" | "week" | "month" | "year";
    domains: Array<{
      key: string;
      name: string;
      color: string;
      courseId: string;
    }>;
    series: Array<Record<string, string | number>>;
    yMax: number;
  }>
> => {
  return (await api.get(withQuery("/export/dashboard/v2/engagement", qs))).data;
};

/** Admin Dashboard V2 — Certificates donut by course (filter-aware). */
export const getDashboardV2Certificates = async (
  qs: string = "",
): Promise<
  IResponse<{
    timeframe: "today" | "week" | "month" | "year" | "all";
    total: number;
    rows: Array<{
      key: string;
      name: string;
      color: string;
      courseId: string;
      avgAttempts: number;
      certificates: number;
      downloads: number;
    }>;
  }>
> => {
  return (await api.get(withQuery("/export/dashboard/v2/certificates", qs)))
    .data;
};

/** Admin Dashboard V2 — Program Courses grid (filter-aware). */
export const getDashboardV2ProgramCourses = async (
  qs: string = "",
): Promise<
  IResponse<{
    totalCount: number;
    items: Array<{
      id: string;
      title: string;
      iconColor: string;
      chapters: number;
      sections: number;
      mediaFiles: number;
      questions: number;
      enrollments: number;
      attempts: number;
      certificates: number;
      growth: string;
      growthPositive: boolean;
      createdAt: string;
    }>;
  }>
> => {
  return (await api.get(withQuery("/export/dashboard/v2/program-courses", qs)))
    .data;
};

/** Admin Dashboard V2 — AI Recommendations (filter-aware). */
export const getDashboardV2AiRecommendations = async (
  qs: string = "",
): Promise<
  IResponse<{
    items: Array<{
      courseId: string;
      title: string;
      score: number;
      chapters: number;
      candidates: number;
      recommendedChapters: Array<{
        chapterId: string;
        title: string;
        chapterNumber: number;
        recommendationCount: number;
        highSeverityCount: number;
        topReason: string;
      }>;
    }>;
  }>
> => {
  return (
    await api.get(withQuery("/export/dashboard/v2/ai-recommendations", qs))
  ).data;
};

/** Admin Dashboard V2 — Schedule calendar (filter-aware). */
export const getDashboardV2Schedule = async (
  qs: string = "",
): Promise<
  IResponse<{
    timeframe: "today" | "week" | "month" | "year";
    items: Array<{
      id: string;
      time: string;
      badge: string;
      title: string;
      active: boolean;
      startAt: string;
    }>;
  }>
> => {
  return (await api.get(withQuery("/export/dashboard/v2/schedule", qs))).data;
};

/** Admin Dashboard V2 — Recent activities (filter-aware). */
export const getDashboardV2RecentActivities = async (
  qs: string = "",
): Promise<
  IResponse<{
    group: string;
    items: Array<{
      id: string;
      text: string;
      time: string;
      timestamp: string;
    }>;
  }>
> => {
  return (
    await api.get(withQuery("/export/dashboard/v2/recent-activities", qs))
  ).data;
};

/** Admin Dashboard V2 — CHW Demographics performance analysis (filter-aware). */
export const getDashboardV2DemographicsPerformance = async (
  qs: string = "",
): Promise<
  IResponse<{
    period: "weekly" | "monthly" | "yearly";
    rows: Array<{
      id: string;
      title: string;
      level: string;
      coverIcon: string;
      enrollment: number;
      completion: number;
      avgCompletionTime: string;
      preTest: string;
      midTest: string;
      postTest: string;
      certificate: number;
    }>;
  }>
> => {
  return (
    await api.get(
      withQuery("/export/dashboard/v2/demographics-performance", qs),
    )
  ).data;
};

/** Admin Dashboard V2 — Knowledge gain table + chart (filter-aware). */
export const getDashboardV2KnowledgeGain = async (
  qs: string = "",
): Promise<
  IResponse<{
    rows: Array<{
      id: string;
      idNo: string;
      name: string;
      course: string;
      healthCenter: string;
      preScore: number;
      postScore: number;
      gain: number;
    }>;
    chart: Array<{
      label: string;
      courseId: string;
      preTest: number;
      postTest: number;
      gain: number;
      sampleSize: number;
    }>;
  }>
> => {
  return (
    await api.get(withQuery("/export/dashboard/v2/knowledge-gain", qs))
  ).data;
};

/** Admin Dashboard V2 — Enrollment trends (filter-aware). */
export const getDashboardV2EnrollmentTrends = async (
  qs: string = "",
): Promise<
  IResponse<{
    timeframe: "weekly" | "monthly" | "quarterly";
    series: Array<{
      label: string;
      activeEnrollments: number;
      certifications: number;
      enrollments: number;
      completions: number;
    }>;
  }>
> => {
  return (
    await api.get(withQuery("/export/dashboard/v2/enrollment-trends", qs))
  ).data;
};

/** Admin Dashboard V2 — Course ratings (filter-aware). */
export const getDashboardV2CourseRatings = async (
  qs: string = "",
): Promise<
  IResponse<{
    sort: "most" | "least";
    items: Array<{
      id: string;
      title: string;
      coverIcon: string;
      rating: number;
      reviewCount: number;
    }>;
  }>
> => {
  return (
    await api.get(withQuery("/export/dashboard/v2/course-ratings", qs))
  ).data;
};

/** Admin Dashboard V2 — Map regional overview (filter-aware). */
export const getDashboardV2MapOverview = async (
  qs: string = "",
): Promise<
  IResponse<{
    districts: Array<{
      district: string;
      totalChws: number;
      enrollments: number;
      completions: number;
      completionRate: number;
      certifications: number;
      certificationRate: number;
      healthCentersCount: number;
      avgFinalTestScore: number;
      avgFinalExamScore: number;
    }>;
  }>
> => {
  return (
    await api.get(withQuery("/export/dashboard/v2/map-overview", qs))
  ).data;
};

export type CourseAnalysisTab =
  | "all"
  | "in_progress"
  | "completed"
  | "certified"
  | "not_started"
  | "assessments"
  | "at_risk"
  | "reviews";

export type CourseAnalysisLearner = {
  id: string;
  fullNames: string;
  photo: string | null;
  phoneNumber: string | null;
  email: string | null;
  gender: string;
  age: number | null;
  ageGroup: string;
  educationLevel: string | null;
  district: string;
  healthCenterName: string | null;
  status: string;
  enrolledAt: string;
  lastActivityAt: string | null;
  lastLoginAt: string | null;
  progress: number;
  preScore: number | null;
  midScore: number | null;
  postScore: number | null;
  knowledgeGain: number | null;
  avgScore: number | null;
  completed: boolean;
  certified: boolean;
  hasAttempts: boolean;
  hasReview: boolean;
  reviewRating: number | null;
  examAttempts: number | null;
};

export type CourseAnalysisData = {
  course: {
    id: string;
    title: string;
    rawTitle: string;
    shortName: string | null;
    level: string | null;
    coverIcon: string | null;
    isPublished: boolean;
    description: string | null;
    createdAt: string;
    sections: number;
    chapters: number;
    mediaFiles: number;
    questions: number;
  };
  kpis: {
    enrolled: number;
    inProgress: number;
    completed: number;
    certified: number;
    notStarted: number;
    completionRate: number;
    certificationRate: number;
    avgProgress: number;
    avgPre: number;
    avgMid: number;
    avgPost: number;
    knowledgeGain: number;
    avgRating: number;
    reviewCount: number;
    attempts: number;
    avgExamAttempts: number;
  };
  charts: {
    trends: {
      timeframe: string;
      series: Array<{
        label: string;
        enrollments: number;
        completions: number;
        certifications: number;
      }>;
    };
    assessments: Array<{ label: string; value: number }>;
    genderPie: Array<{ label: string; value: number }>;
    statusPie: Array<{ label: string; value: number }>;
    ratingPie: Array<{ label: string; value: number }>;
  };
  tab: CourseAnalysisTab;
  tabCounts: Record<CourseAnalysisTab, number>;
  learners: CourseAnalysisLearner[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

/** Admin Dashboard V2 — single course analysis. */
export const getDashboardV2CourseAnalysis = async (
  qs: string = "",
): Promise<IResponse<CourseAnalysisData | null>> => {
  return (
    await api.get(withQuery("/export/dashboard/v2/course-analysis", qs))
  ).data;
};

/** Deep adoption charts (one filter-aware call). */
export const getDashboardAdoption = async (qs: string = ""): Promise<
  IResponse<{
    courseAnalytics: ICourseAnalytics | null;
    studentAnalytics: IStudentAnalytics | null;
    testScores: ITestScoreAnalytics | null;
    demographics: IDemographicsAnalytics | null;
    courseDuration: ICourseDurationStats | null;
    certification: ICertificationAnalytics | null;
    communications: ICommunicationsAnalytics | null;
    enrollmentTrends: { month: string; enrollments: number }[];
    avgStudyTimeByCourse: IAvgStudyTimeByCourse[];
  }>
> => {
  return (await api.get(withQuery("/export/dashboard/adoption", qs))).data;
};

/** Recommendation insights (lazy section). */
export const getDashboardRecommendations = async (
  qs: string = "",
): Promise<IRecommendationInsightsResponse> => {
  return (await api.get(withQuery("/export/dashboard/recommendations", qs)))
    .data;
};
