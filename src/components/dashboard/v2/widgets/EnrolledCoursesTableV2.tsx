import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ICourseStatEntry } from "@/services/progress.service";
import { ArrowUpDown, BookOpen } from "lucide-react";

interface EnrolledCoursesTableV2Props {
  courses: ICourseStatEntry[];
  isLoading?: boolean;
  /** When viewing another student, hide learner catalog CTA */
  readOnly?: boolean;
}

export const EnrolledCoursesTableV2: React.FC<EnrolledCoursesTableV2Props> = ({
  courses = [],
  isLoading,
  readOnly = false,
}) => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs animate-pulse h-64" />
    );
  }

  const safeCourses = Array.isArray(courses) ? courses : [];

  const filteredCourses = safeCourses.filter((c) => {
    if (selectedFilter === "COMPLETED") return c.isCompleted;
    if (selectedFilter === "CERTIFIED") return Boolean(c.isCertified);
    if (selectedFilter === "ONGOING") return c.isStarted && !c.isCompleted;
    return true;
  });

  const totalEnrollmentsCount = safeCourses.length;
  const ongoingCount = safeCourses.filter(
    (c) => c.isStarted && !c.isCompleted,
  ).length;
  const completedCount = safeCourses.filter((c) => c.isCompleted).length;
  const certifiedCount = safeCourses.filter((c) => c.isCertified).length;

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
            Enrolled courses
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Progress from Final Test / Final Exam (backend)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedFilter("ALL")}
          className={`px-3.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
            selectedFilter === "ALL"
              ? "bg-[#3363AD] text-white shadow-2xs"
              : "bg-[#F1F5F9] text-gray-600 hover:bg-[#EBF0F9] hover:text-[#3363AD]"
          }`}
        >
          {totalEnrollmentsCount} Enrollments (All)
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter("ONGOING")}
          className={`px-3.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
            selectedFilter === "ONGOING"
              ? "bg-[#3363AD] text-white shadow-2xs"
              : "bg-[#F1F5F9] text-gray-600 hover:bg-[#EBF0F9] hover:text-[#3363AD]"
          }`}
        >
          Ongoing ({ongoingCount})
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter("COMPLETED")}
          className={`px-3.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
            selectedFilter === "COMPLETED"
              ? "bg-[#3363AD] text-white shadow-2xs"
              : "bg-[#F1F5F9] text-gray-600 hover:bg-[#EBF0F9] hover:text-[#3363AD]"
          }`}
        >
          Completed ({completedCount})
        </button>

        <button
          type="button"
          onClick={() => setSelectedFilter("CERTIFIED")}
          className={`px-3.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
            selectedFilter === "CERTIFIED"
              ? "bg-[#3363AD] text-white shadow-2xs"
              : "bg-[#F1F5F9] text-gray-600 hover:bg-[#EBF0F9] hover:text-[#3363AD]"
          }`}
        >
          Certified ({certifiedCount})
        </button>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl space-y-3 bg-gray-50/50">
          <BookOpen size={36} className="mx-auto text-gray-300" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-800">No courses found</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              No enrollments match this filter.
            </p>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={() => navigate("/course-catalog")}
              className="px-4 py-2 bg-[#3363AD] hover:bg-[#284f8a] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              Browse Course Catalog
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-3">
                  <div className="flex items-center gap-1">
                    <span>Course Name</span>
                    <ArrowUpDown size={12} className="text-gray-400" />
                  </div>
                </th>
                <th className="py-3 px-3 whitespace-nowrap">Enrolled</th>
                <th className="py-3 px-3 text-center">Progress</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Certificate</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredCourses.map((course) => {
                const pct = Math.min(
                  100,
                  Math.max(0, Math.round(course.progress ?? 0)),
                );
                const coverImg = course.coverIcon;

                return (
                  <tr
                    key={course.courseId}
                    className="hover:bg-gray-50/70 transition-colors group"
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        {coverImg ? (
                          <img
                            src={coverImg}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shrink-0 bg-gray-100"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[#EBF0F9] text-[#3363AD] font-bold flex items-center justify-center shrink-0">
                            <BookOpen size={18} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-extrabold text-gray-900 group-hover:text-[#3363AD] transition-colors leading-tight truncate max-w-xs">
                            {course.title}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-gray-600 whitespace-nowrap">
                      {formatDate(course.enrollmentDate)}
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <div
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-[10px] font-black shadow-2xs ${
                          pct === 100 ? "bg-emerald-500" : "bg-[#3363AD]"
                        }`}
                      >
                        {pct}%
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-3.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                          course.isCompleted
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : course.isStarted
                              ? "bg-[#FFF4EC] text-[#E06D53] border border-[#FFE4D6]"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {course.isCompleted
                          ? "Completed"
                          : course.isStarted
                            ? "In progress"
                            : "Not started"}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-semibold whitespace-nowrap">
                      {course.isCertified ? (
                        <span className="text-[#3363AD] font-extrabold">
                          Earned
                        </span>
                      ) : (
                        <span className="text-gray-400">Not earned</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
