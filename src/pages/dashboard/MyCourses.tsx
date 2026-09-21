import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  PlayCircle,
  ClipboardList,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import {
  getStudentStatistics,
  IStudentStatistics,
  ICourseStatEntry,
} from "@/services/progress.service";
import {
  V2_BTN_PRIMARY,
  V2_BTN_SECONDARY,
  V2_CARD_SHELL,
  V2_CARD_SHELL_PADDED,
  V2_EMPTY,
  V2_KPI_ICON_CHIP,
  V2_MUTED,
  V2_PAGE_CANVAS,
  V2_PAGE_SUBTITLE,
  V2_PAGE_TITLE,
  V2_SECTION_TITLE,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

const bone = "rounded bg-[#D7E3F0] dark:bg-slate-700";

const MyLearningSkeleton: React.FC = () => (
  <div className={`${V2_PAGE_CANVAS} animate-pulse`}>
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="space-y-2">
        <div className={`${bone} h-6 w-40`} />
        <div className={`${bone} h-3 w-64`} />
      </div>
      <div className={`${bone} h-9 w-32 rounded-xl`} />
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className={`${V2_CARD_SHELL_PADDED} flex items-center gap-3 min-h-[88px]`}
        >
          <div className={`${bone} w-10 h-10 rounded-[12px] shrink-0`} />
          <div className="flex-1 space-y-2">
            <div className={`${bone} h-2.5 w-14`} />
            <div className={`${bone} h-5 w-10`} />
          </div>
        </div>
      ))}
    </div>

    <div className={`${V2_CARD_SHELL} h-[72px] p-4 flex items-center gap-4`}>
      <div className={`${bone} w-11 h-11 rounded-[12px] shrink-0`} />
      <div className="flex-1 space-y-2">
        <div className={`${bone} h-2.5 w-40`} />
        <div className={`${bone} h-3.5 w-56`} />
      </div>
    </div>

    <div className="space-y-3">
      <div className={`${bone} h-4 w-36`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={`${V2_CARD_SHELL} overflow-hidden`}>
            <div className={`${bone} h-36 w-full rounded-none`} />
            <div className="p-4 space-y-3">
              <div className={`${bone} h-3.5 w-[90%]`} />
              <div className={`${bone} h-2.5 w-[70%]`} />
              <div className={`${bone} h-2 w-full`} />
              <div className={`${bone} h-9 w-full rounded-xl`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const MyCourses: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<IStudentStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setStats(await getStudentStatistics());
    } catch {
      setError("Failed to load your courses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading) {
    return <MyLearningSkeleton />;
  }

  if (error) {
    return (
      <div className={V2_PAGE_CANVAS}>
        <div className="flex flex-col items-center justify-center min-h-64 gap-3">
          <p className="text-red-500 text-sm">{error}</p>
          <button type="button" onClick={loadStats} className={V2_BTN_PRIMARY}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const summary = stats?.summary;
  const enrolledCourses = (stats?.courses ?? []).filter((c) => c.isEnrolled);
  const lastViewed = stats?.lastViewedLocation ?? null;

  const kpiCards = [
    {
      label: "Enrolled",
      value: summary?.enrolledCourses ?? 0,
      Icon: BookOpen,
      accent: "text-[#3363AD] dark:text-blue-300",
    },
    {
      label: "Completed",
      value: summary?.completedCourses ?? 0,
      Icon: CheckCircle2,
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "In Progress",
      value: summary?.startedCourses ?? 0,
      Icon: TrendingUp,
      accent: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Available",
      value: summary?.totalCourses ?? 0,
      Icon: Clock,
      accent: "text-indigo-600 dark:text-indigo-400",
    },
  ];

  return (
    <div className={V2_PAGE_CANVAS}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className={V2_PAGE_TITLE}>My Learning</h1>
          <p className={V2_PAGE_SUBTITLE}>
            Track your enrolled courses and continue where you left off
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/course-catalog")}
          className={V2_BTN_SECONDARY}
        >
          <BookOpen size={14} />
          Browse Catalog
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, Icon, accent }) => (
          <div
            key={label}
            className={`${V2_CARD_SHELL_PADDED} flex items-center gap-3 min-h-[88px]`}
          >
            <div
              className={`w-10 h-10 rounded-[12px] ${V2_KPI_ICON_CHIP} flex items-center justify-center shrink-0`}
            >
              <Icon size={20} className={accent} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B6575] dark:text-slate-400">
                {label}
              </p>
              <p className="text-[22px] font-bold tabular-nums text-[#5B6575] dark:text-slate-100 leading-tight mt-0.5">
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Continue where you left off */}
      {lastViewed && (
        <button
          type="button"
          onClick={() => navigate(`/learn/${lastViewed.courseId}`)}
          className="w-full flex items-center gap-4 bg-[#3363AD] hover:bg-[#2a52a0] text-white rounded-[20px] p-4 transition-colors text-left
            [box-shadow:3px_4px_0_0_rgba(51,99,173,0.35),6px_9px_18px_rgba(51,99,173,0.25)]"
        >
          <div className="w-11 h-11 bg-white/20 rounded-[12px] flex items-center justify-center shrink-0">
            <PlayCircle size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-white/70 font-semibold uppercase tracking-wide">
              Continue where you left off
            </p>
            <p className="text-sm font-bold truncate mt-0.5">
              {lastViewed.courseTitle}
            </p>
            <p className="text-xs text-white/60 truncate">
              {lastViewed.chapterTitle}
            </p>
          </div>
          <ArrowRight size={18} className="shrink-0 text-white/70" />
        </button>
      )}

      {/* Course list */}
      <div className="space-y-3">
        <h2 className={V2_SECTION_TITLE}>Enrolled courses</h2>

        {enrolledCourses.length === 0 ? (
          <div className={V2_EMPTY}>
            <PlayCircle size={40} className="mx-auto mb-3 text-[#C5D3E0]" />
            <p className="text-sm font-bold text-[#1A2332] dark:text-slate-200">
              No courses yet
            </p>
            <p className={`text-xs mt-1 ${V2_MUTED}`}>
              Browse the catalog to enroll in your first course.
            </p>
            <button
              type="button"
              onClick={() => navigate("/course-catalog")}
              className={`${V2_BTN_PRIMARY} mt-4`}
            >
              <BookOpen size={14} />
              Course Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {enrolledCourses.map((course: ICourseStatEntry) => {
              const pct = Math.round(course.progress ?? 0);
              const isDone = course.isCompleted;
              const statusLabel = isDone
                ? "Completed"
                : course.isStarted
                  ? "In Progress"
                  : "Not Started";
              const statusClass = isDone
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                : course.isStarted
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-[#EBF0F9] text-[#3363AD] dark:bg-slate-700 dark:text-blue-300";

              return (
                <div
                  key={course.courseId}
                  className={`${V2_CARD_SHELL} flex flex-col overflow-hidden`}
                >
                  {/* Cover */}
                  <div className="relative h-36 bg-gradient-to-br from-[#3363AD] to-[#1a3d7c] flex items-center justify-center overflow-hidden shrink-0">
                    {course.coverIcon ? (
                      <img
                        src={course.coverIcon}
                        alt={course.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <BookOpen className="text-white opacity-60" size={40} />
                    )}
                    <span
                      className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${statusClass}`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1 gap-3">
                    <div>
                      <h3 className="font-bold text-sm leading-snug line-clamp-2 text-[#1A2332] dark:text-slate-100">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className={`text-xs mt-1 line-clamp-2 ${V2_MUTED}`}>
                          {course.description}
                        </p>
                      )}
                    </div>

                    <div className={`flex items-center gap-3 text-[11px] flex-wrap ${V2_MUTED}`}>
                      {course.totalChapters > 0 && (
                        <span className="flex items-center gap-1 font-medium">
                          <BookOpen size={11} />
                          {course.totalChapters} chapter
                          {course.totalChapters !== 1 ? "s" : ""}
                        </span>
                      )}
                      {course.totalTests > 0 && (
                        <span className="flex items-center gap-1 font-medium">
                          <ClipboardList size={11} />
                          {course.completedTests}/{course.totalTests} tests
                        </span>
                      )}
                      {course.courseDuration > 0 && (
                        <span className="flex items-center gap-1 font-medium">
                          <Clock size={11} />
                          {course.courseDuration.toFixed(1)}h
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-[#9AA3B2]">Progress</span>
                        <span
                          className={`font-bold tabular-nums ${
                            isDone
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-[#1A2332] dark:text-slate-100"
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-[#E8EEF4] dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isDone ? "bg-emerald-500" : "bg-[#3363AD]"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-auto pt-1">
                      <button
                        type="button"
                        className={`${V2_BTN_PRIMARY} w-full`}
                        onClick={() => navigate(`/learn/${course.courseId}`)}
                      >
                        {isDone ? (
                          <>
                            <CheckCircle2 size={14} />
                            Review Course
                          </>
                        ) : (
                          <>
                            <PlayCircle size={14} />
                            {course.isStarted ? "Continue Learning" : "Start Course"}
                            <ChevronRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
