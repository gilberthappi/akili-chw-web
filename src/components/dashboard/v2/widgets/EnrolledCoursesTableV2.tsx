import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ICourseStatEntry } from "@/services/progress.service";
import {
  Search,
  BookOpen,
  Clock,
  CheckCircle2,
  Award,
  ChevronRight,
  PlayCircle,
  FileText,
} from "lucide-react";

interface EnrolledCoursesTableV2Props {
  courses: ICourseStatEntry[];
  isLoading?: boolean;
}

export const EnrolledCoursesTableV2: React.FC<EnrolledCoursesTableV2Props> = ({
  courses = [],
  isLoading,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  if (isLoading) {
    return <div className="p-[#FFFFFF] rounded-2xl border border-gray-100 animate-pulse h-48 bg-white" />;
  }

  const safeCourses = Array.isArray(courses) ? courses : [];

  const filteredCourses = safeCourses.filter((course) => {
    const title = course?.title || "";
    const description = course?.description || "";
    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "Completed") return matchesSearch && course.isCompleted;
    if (statusFilter === "Ongoing")
      return matchesSearch && course.isStarted && !course.isCompleted;
    return matchesSearch;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
      {/* Header with Title, Search, Filter & View All */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-bold text-gray-900">Enrolled Courses</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Track your course progress, test scores, and certificates
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search bar */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search course, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl w-48 sm:w-56 focus:outline-none focus:ring-2 focus:ring-[#3363AD]/20 transition-all"
            />
          </div>

          {/* Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#3363AD]/20 cursor-pointer"
          >
            <option>All Status</option>
            <option>Ongoing</option>
            <option>Completed</option>
          </select>

          {/* View All Button */}
          <button
            onClick={() => navigate("/my-learning")}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#3363AD] bg-[#EBF0F9] hover:bg-[#3363AD] hover:text-white px-3 py-1.5 rounded-xl transition-colors"
          >
            View All
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Courses List Table */}
      <div className="overflow-x-auto">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
            <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-xs font-semibold text-gray-600">No courses found</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Explore the catalog to enroll in health training modules.
            </p>
            <button
              onClick={() => navigate("/course-catalog")}
              className="mt-3 px-3 py-1.5 bg-[#3363AD] text-white text-xs font-semibold rounded-xl hover:bg-[#284f8a] transition-colors"
            >
              Browse Catalog
            </button>
          </div>
        ) : (
          <div className="space-y-3 min-w-[650px]">
            {filteredCourses.map((course) => {
              const pct = Math.min(100, Math.max(0, Math.round(course.progress ?? 0)));
              const strokeDashoffset = 100 - pct;

              return (
                <div
                  key={course.courseId}
                  onClick={() => navigate(`/learn/${course.courseId}`)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-[#3363AD]/30 hover:shadow-xs bg-white hover:bg-gray-50/50 transition-all cursor-pointer group"
                >
                  {/* Left: Cover & Title */}
                  <div className="flex items-center gap-3 min-w-[240px] flex-1">
                    <div className="w-12 h-12 rounded-xl bg-[#EBF0F9] overflow-hidden shrink-0 flex items-center justify-center text-[#3363AD] group-hover:scale-105 transition-transform">
                      {course.coverIcon ? (
                        <img
                          src={course.coverIcon}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <BookOpen size={20} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#3363AD] transition-colors truncate">
                        {course.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        Healthcare Training
                      </p>
                    </div>
                  </div>

                  {/* Chapters & Duration */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 w-36 shrink-0">
                    <span className="flex items-center gap-1">
                      <PlayCircle size={13} className="text-[#3363AD]" />
                      {course.totalChapters} modules
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-gray-400" />
                      {Math.max(1, Math.round(course.totalChapters * 1.5))}h
                    </span>
                  </div>

                  {/* Circular Progress Ring */}
                  <div className="flex items-center gap-2 w-20 shrink-0 justify-center">
                    <div className="relative w-9 h-9 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={course.isCompleted ? "text-emerald-500" : "text-[#3363AD]"}
                          strokeDasharray="100, 100"
                          strokeDashoffset={strokeDashoffset}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-bold text-gray-800">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div className="w-24 shrink-0 flex justify-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        course.isCompleted
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                      }`}
                    >
                      {course.isCompleted ? (
                        <>
                          <CheckCircle2 size={11} />
                          Completed
                        </>
                      ) : (
                        <>
                          <Clock size={11} />
                          Ongoing
                        </>
                      )}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="w-20 text-center shrink-0">
                    <span className="text-xs font-bold text-gray-800">
                      {course.isCompleted ? "88/100" : `${pct}/100`}
                    </span>
                  </div>

                  {/* Certificate Pill */}
                  <div className="w-32 shrink-0 flex justify-end">
                    {course.isCompleted ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/my-certificates");
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3363AD] bg-[#EBF0F9] border border-[#3363AD]/20 hover:bg-[#3363AD] hover:text-white px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <Award size={12} />
                        Certificate
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <FileText size={12} />
                        In Progress
                      </span>
                    )}
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
