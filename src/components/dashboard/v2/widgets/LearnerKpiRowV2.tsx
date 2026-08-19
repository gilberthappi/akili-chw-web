import React from "react";
import { BookOpen, CheckCircle2, Clock, Award, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LearnerKpiRowV2Props {
  enrolledCoursesCount?: number;
  completedCoursesCount?: number;
  totalCertificatesCount?: number;
}

export const LearnerKpiRowV2: React.FC<LearnerKpiRowV2Props> = ({
  enrolledCoursesCount = 9,
  completedCoursesCount = 5,
  totalCertificatesCount = 9,
}) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Card 1: Enrolled Courses */}
      <div
        onClick={() => navigate("/my-learning")}
        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-[#3363AD]/30 transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <BookOpen size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Enrolled Courses
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-gray-900 leading-none">
              {enrolledCoursesCount}
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {completedCoursesCount} Completed
            </span>
          </div>
        </div>
      </div>

      {/* Card 2: Overall Score */}
      <div
        onClick={() => navigate("/analytics/student")}
        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Avg Quiz & Exam Score
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-gray-900 leading-none">
              88%
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp size={11} />
              +3.4%
            </span>
          </div>
        </div>
      </div>

      {/* Card 3: Total Learning Time */}
      <div
        onClick={() => navigate("/analytics/student")}
        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Clock size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Total Learning Time
          </p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black text-gray-900 leading-none">
              42.5h
            </span>
            <span className="text-xs font-semibold text-gray-500">
              6.5h this week
            </span>
          </div>
        </div>
      </div>

      {/* Card 4: Certificates */}
      <div
        onClick={() => navigate("/my-certificates")}
        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-amber-200 transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Award size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Certificates Earned
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-black text-gray-900 leading-none">
              {totalCertificatesCount}
            </span>
            <span className="text-xs font-semibold text-amber-600">
              MOH Accredited
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
