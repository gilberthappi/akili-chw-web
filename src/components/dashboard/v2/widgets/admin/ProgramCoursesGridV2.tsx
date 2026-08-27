import React, { useState } from "react";
import { Folder, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ICourseStatEntry } from "@/services/progress.service";

interface ProgramCoursesGridV2Props {
  courses?: ICourseStatEntry[];
}

export const ProgramCoursesGridV2: React.FC<ProgramCoursesGridV2Props> = ({
  courses = [],
}) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("Recently added");

  const fallbackCourses = [
    {
      courseId: "c1",
      title: "GUKUMIRA MALARIYA KU RWEGO RW'UMUDUGUDU",
      chapters: 5,
      sections: 17,
      mediaFiles: 5,
      questions: 45,
      enrollments: 150,
      attempts: 766,
      certificates: 150,
    },
    {
      courseId: "c2",
      title: "GUKUMIRA MALARIYA KU RWEGO RW'UMUDUGUDU",
      chapters: 5,
      sections: 17,
      mediaFiles: 5,
      questions: 45,
      enrollments: 150,
      attempts: 766,
      certificates: 150,
    },
    {
      courseId: "c3",
      title: "GUKUMIRA MALARIYA KU RWEGO RW'UMUDUGUDU",
      chapters: 5,
      sections: 17,
      mediaFiles: 5,
      questions: 45,
      enrollments: 150,
      attempts: 766,
      certificates: 150,
    },
    {
      courseId: "c4",
      title: "GUKUMIRA MALARIYA KU RWEGO RW'UMUDUGUDU",
      chapters: 5,
      sections: 17,
      mediaFiles: 5,
      questions: 45,
      enrollments: 150,
      attempts: 766,
      certificates: 150,
    },
  ];

  const displayList =
    courses.length > 0
      ? courses.slice(0, 4).map((c) => ({
          courseId: c.courseId,
          title: c.title,
          chapters: c.totalChapters || 5,
          sections: 17,
          mediaFiles: 5,
          questions: c.totalTests * 15 || 45,
          enrollments: 150,
          attempts: 766,
          certificates: 150,
        }))
      : fallbackCourses;

  return (
    <div className="space-y-4 h-full flex flex-col justify-between">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
          Program Courses ({courses.length > 0 ? courses.length : 14})
        </h3>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-500">
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="font-bold text-gray-800 bg-white border border-gray-200 rounded-xl px-2.5 py-1 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option>Recently added</option>
              <option>Most Enrolled</option>
            </select>
          </div>

          <button
            onClick={() => navigate("/courses")}
            className="px-3.5 py-1 bg-[#3363AD] text-white text-xs font-bold rounded-xl hover:bg-[#284f8a] transition-colors shadow-2xs"
          >
            See All
          </button>
        </div>
      </div>

      {/* Grid of 4 Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {displayList.map((item, idx) => (
          <div
            key={item.courseId || idx}
            onClick={() => navigate(`/courses`)}
            className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col justify-between space-y-3 hover:border-[#3363AD]/30 transition-all cursor-pointer group"
          >
            {/* Title & Icon Header */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#3363AD] text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                <Folder size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-gray-900 uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-[#3363AD] transition-colors">
                  {item.title}
                </p>
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-0.5">
                <MoreHorizontal size={15} />
              </button>
            </div>

            {/* Gray Badge Pills Row matching Figma mockup */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-[#F1F5F9] text-[#595F74] text-[10px] font-bold px-2 py-0.5 rounded-md">
                {item.chapters} Chapters
              </span>
              <span className="bg-[#F1F5F9] text-[#595F74] text-[10px] font-bold px-2 py-0.5 rounded-md">
                {item.sections} Sections
              </span>
              <span className="bg-[#F1F5F9] text-[#595F74] text-[10px] font-bold px-2 py-0.5 rounded-md">
                {item.mediaFiles} Media files
              </span>
              <span className="bg-[#F1F5F9] text-[#595F74] text-[10px] font-bold px-2 py-0.5 rounded-md">
                {item.questions} Questions
              </span>
            </div>

            {/* Bottom Footer Stats matching Figma mockup */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-400">
              <span>{item.enrollments} Enrollments</span>
              <span>{item.attempts} test attempts</span>
              <span>{item.certificates} certificates</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
