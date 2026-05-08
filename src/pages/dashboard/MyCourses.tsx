import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  PlayCircle,
  Star,
} from "lucide-react";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Badge } from "@/components/common/Badge";
import { getCoursesWithProgress } from "@/services/course.service";
import { ICourse } from "@/types";

interface ProgressRecord {
  id: string;
  progress?: number;
  isCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const MyCourses: React.FC = () => {
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState<ICourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const all = await getCoursesWithProgress();
      // Only show courses the student has enrolled in (has a progress record)
      setEnrolledCourses(all.filter((c) => (c.progresses?.length ?? 0) > 0));
    } catch {
      setError("Failed to load your courses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#3363AD] mx-auto" size={32} />
          <p className="mt-3 text-sm text-gray-500">Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-3">
        <p className="text-red-500 text-sm">{error}</p>
        <Button size="sm" onClick={loadCourses}>Retry</Button>
      </div>
    );
  }

  const completed = enrolledCourses.filter((c) => {
    const p = c.progresses?.[0] as unknown as ProgressRecord | undefined;
    return p?.isCompleted === true;
  });
  const inProgress = enrolledCourses.length - completed.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Learning</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your enrolled courses and continue where you left off.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/course-catalog")}
          className="flex items-center gap-1"
        >
          <BookOpen size={14} />
          Browse Catalog
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3363AD]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen className="text-[#3363AD]" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Enrolled</p>
              <p className="text-xl font-bold text-gray-900">{enrolledCourses.length}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-xl font-bold text-gray-900">{completed.length}</p>
            </div>
          </div>
        </Card>
        <Card padding={false} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="text-orange-500" size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">In Progress</p>
              <p className="text-xl font-bold text-gray-900">{inProgress}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Course list */}
      {enrolledCourses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <PlayCircle size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No courses yet</p>
          <p className="text-xs mt-1">
            Head to the{" "}
            <button
              onClick={() => navigate("/course-catalog")}
              className="text-[#3363AD] underline"
            >
              Course Catalog
            </button>{" "}
            to enroll in your first course.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {enrolledCourses.map((course) => {
            const prog = course.progresses?.[0] as unknown as ProgressRecord | undefined;
            const pct = Math.round(prog?.progress ?? 0);
            const isDone = prog?.isCompleted === true;
            const sectionCount = course.sections?.length ?? 0;

            return (
              <Card key={course.id} padding={false} hover className="flex flex-col">
                {/* Cover */}
                <div className="relative h-40 bg-gradient-to-br from-[#3363AD] to-[#1a3d7c] rounded-t-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {course.intro?.bannerImage ? (
                    <img
                      src={course.intro.bannerImage}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : course.coverIcon ? (
                    <img
                      src={course.coverIcon}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <BookOpen className="text-white opacity-60" size={40} />
                  )}
                  <Badge
                    variant={isDone ? "success" : "warning"}
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    {isDone ? "Completed" : "In Progress"}
                  </Badge>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col flex-1 gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                      {course.title}
                    </h3>
                    {(course.intro?.summary || course.description) && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {course.intro?.summary ?? course.description}
                      </p>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {course.rating != null && (
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        {Number(course.rating).toFixed(1)}
                      </span>
                    )}
                    {sectionCount > 0 && (
                      <span>{sectionCount} section{sectionCount !== 1 ? "s" : ""}</span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isDone ? "bg-green-500" : "bg-[#3363AD]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-auto">
                    <Button
                      size="sm"
                      className="w-full flex items-center justify-center gap-1"
                      onClick={() => navigate(`/learn/${course.id}`)}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 size={14} />
                          Review Course
                        </>
                      ) : (
                        <>
                          <PlayCircle size={14} />
                          Continue Learning
                          <ChevronRight size={14} />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
