import React from "react";
import { BookOpen, AlertCircle } from "lucide-react";
import { ICourseStatEntry } from "@/services/progress.service";
import { useNavigate } from "react-router-dom";

interface RecentCoursesWidgetV2Props {
  courses?: ICourseStatEntry[];
}

export const RecentCoursesWidgetV2: React.FC<RecentCoursesWidgetV2Props> = ({
  courses = [],
}) => {
  const navigate = useNavigate();

  // Filter courses user has enrolled in or started
  const activeCourses = courses.filter((c) => c.isEnrolled || c.isStarted || c.progress > 0);
  const displayCourses = activeCourses.length > 0 ? activeCourses : courses;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-3.5">
      <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
        Recent Courses
      </h3>

      {displayCourses.length === 0 ? (
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 text-center space-y-1.5">
          <AlertCircle size={20} className="mx-auto text-amber-500" />
          <p className="text-xs font-bold text-amber-900">No Recent Courses Found</p>
          <p className="text-[11px] text-amber-700">
            You are not currently enrolled in any training modules.
          </p>
          <button
            onClick={() => navigate("/course-catalog")}
            className="mt-2 text-xs font-bold text-[#3363AD] hover:underline"
          >
            Browse Catalog →
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {displayCourses.slice(0, 5).map((item) => (
            <div
              key={item.courseId}
              onClick={() => navigate(`/learn/${item.courseId}`)}
              className="flex items-center gap-3 p-1 rounded-xl hover:bg-gray-50/80 transition-colors cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-full bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center shrink-0 group-hover:scale-105 transition-all">
                <BookOpen size={13} />
              </div>
              <span className="text-xs font-semibold text-gray-600 group-hover:text-[#3363AD] transition-colors truncate">
                {item.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
