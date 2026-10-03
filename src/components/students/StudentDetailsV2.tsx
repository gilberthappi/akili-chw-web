import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStudentById } from "@/services/students.service";
import { StudentProfileCardV2 } from "./StudentProfileCardV2";
import { LearningActivityV2 } from "../dashboard/v2/widgets/LearningActivityV2";
import { PerformanceMeterV2 } from "../dashboard/v2/widgets/PerformanceMeterV2";
import { EnrolledCoursesTableV2 } from "../dashboard/v2/widgets/EnrolledCoursesTableV2";
import { CertificatesEarnedWidgetV2 } from "../dashboard/v2/widgets/CertificatesEarnedWidgetV2";
import { XCircle } from "lucide-react";
import { LearningPlansWidget } from "./LearningPlansWidget";
import { SectionSkeleton } from "../dashboard/shared/SectionSkeleton";
import { ICourseStatEntry } from "@/services/progress.service";
import { IMyCertificate } from "@/services/certificates.service";
import { EnrolledCourse, StudentData } from "@/types";

const parseProgress = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = parseFloat(value.replace("%", "").trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Build monthly avg accuracy from graded test attempts (backend). */
const buildTrendFromAttempts = (
  detailedAttempts: Array<{
    attemptDate?: string;
    accuracyPercentage?: number;
    totalMarks?: number;
    testType?: string;
  }> = [],
): { month: string; score: number }[] => {
  const graded = detailedAttempts.filter(
    (a) => a.testType !== "Mid-Test" && a.attemptDate,
  );
  if (graded.length === 0) return [];

  const byMonth = new Map<string, number[]>();
  for (const a of graded) {
    const d = new Date(a.attemptDate!);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    const score =
      typeof a.accuracyPercentage === "number"
        ? a.accuracyPercentage
        : typeof a.totalMarks === "number"
          ? a.totalMarks
          : null;
    if (score == null) continue;
    const list = byMonth.get(key) ?? [];
    list.push(score);
    byMonth.set(key, list);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, scores]) => {
      const monthIdx = Number(key.split("-")[1]);
      return {
        month: MONTH_LABELS[monthIdx] ?? key,
        score: Math.round(
          scores.reduce((sum, n) => sum + n, 0) / scores.length,
        ),
      };
    });
};

export const StudentDetailsV2: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: studentResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["student", id],
    queryFn: () => getStudentById(id!),
    enabled: !!id,
    retry: 1,
  });

  if (isLoading) return <SectionSkeleton cards={4} rows={3} />;

  const rawData = (studentResponse?.data ?? studentResponse) as
    | StudentData
    | undefined;

  if (error || !rawData?.studentInfo) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xs p-8 text-center max-w-sm w-full">
          <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 mb-1">
            Student Data Not Found
          </h3>
          <p className="text-xs text-gray-500 mb-5">
            Failed to load health worker information.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-[#3363AD] text-white text-xs font-bold"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate("/chw")}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  const studentInfo = rawData.studentInfo;
  const fullNames = studentInfo.fullName?.trim() || "—";
  const phone = studentInfo.phoneNumber?.trim() || "—";
  const photo = studentInfo.photo || null;
  const status = studentInfo.status || "ACTIVE";

  const address =
    [
      studentInfo.village,
      studentInfo.cell,
      studentInfo.sector,
      studentInfo.district,
    ]
      .map((p) => p?.trim())
      .filter(Boolean)
      .join(", ") || "—";

  const enrolledAt = studentInfo.createdAt
    ? new Date(studentInfo.createdAt)
    : null;
  const enrolledDateStr =
    enrolledAt && !isNaN(enrolledAt.getTime())
      ? enrolledAt.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "—";

  const studentCode = studentInfo.NID
    ? `CHW-${String(studentInfo.NID).substring(0, 5)}`
    : id
      ? `CHW-${id.substring(0, 5)}`
      : "—";

  const enrolledCourses: EnrolledCourse[] =
    rawData.courseProgress?.enrolledCourses ?? [];

  const coursesList: ICourseStatEntry[] = enrolledCourses.map((course) => {
    const progress = parseProgress(course.progress);
    return {
      courseId: course.courseId,
      title: course.courseTitle || "Untitled course",
      coverIcon: course.courseCoverIcon || "",
      description: course.courseDescription || null,
      totalChapters: 0,
      totalTests: 0,
      completedTests: 0,
      courseDuration: 0,
      isEnrolled: true,
      isStarted: progress > 0 || course.isCompleted,
      isCompleted: Boolean(course.isCompleted),
      isCertified: Boolean(course.isCertified),
      completedAt: course.isCompleted ? course.lastUpdated || null : null,
      enrollmentDate: course.enrollmentDate || null,
      progress,
    };
  });

  const certificatesList: IMyCertificate[] = (rawData.certificates ?? []).map(
    (cert) => ({
      id: cert.id,
      courseId: cert.courseId || cert.id,
      title: cert.courseTitle || "Certificate",
      image: "",
      progress: 100,
      enrollmentDate: "",
      completedAt: cert.createdAt || "",
      completedAtRaw: cert.createdAt,
      slides: 0,
      attempt: 1,
      test: 0,
      finalExamMarks: null,
      pdf: cert.pdfUrl || cert.pdf || "",
    }),
  );

  // Backend source of truth — do not derive certs from completed courses
  const enrolledCoursesCount =
    rawData.courseProgress?.totalCoursesEnrolled ?? coursesList.length;
  const completedCoursesCount = rawData.courseProgress?.completedCourses ?? 0;
  const certificatesCount =
    rawData.courseProgress?.certifiedCourses ?? certificatesList.length;

  const avgProgressScore =
    coursesList.length > 0
      ? Math.round(
          coursesList.reduce((sum, c) => sum + c.progress, 0) /
            coursesList.length,
        )
      : Math.round(rawData.testAttempts?.successRate ?? 0);

  const trendPoints = buildTrendFromAttempts(
    rawData.testAttempts?.detailedAttempts ?? [],
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4 xl:col-span-3 relative">
          <div className="lg:sticky lg:top-4 z-10">
            <StudentProfileCardV2
              fullNames={fullNames}
              phone={phone}
              photo={photo}
              address={address}
              status={status}
              enrolledDate={enrolledDateStr}
              studentCode={studentCode}
              certificatesCount={certificatesCount}
              completedCoursesCount={completedCoursesCount}
            />
          </div>
        </aside>

        <div className="lg:col-span-8 xl:col-span-9 space-y-6 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7">
              <LearningActivityV2 courses={coursesList} />
            </div>
            <div className="md:col-span-5">
              <PerformanceMeterV2
                score={avgProgressScore}
                enrolledCoursesCount={enrolledCoursesCount}
                completedCoursesCount={completedCoursesCount}
                certificatesCount={certificatesCount}
                trendPoints={trendPoints.length > 0 ? trendPoints : undefined}
              />
            </div>
          </div>

          <CertificatesEarnedWidgetV2
            certificates={certificatesList}
            isLoading={isLoading}
            expandInPlace
          />

          <EnrolledCoursesTableV2 courses={coursesList} readOnly />

          {id && <LearningPlansWidget studentId={id} />}
        </div>
      </div>
    </div>
  );
};
