import React, { useState } from "react";
import { ArrowUpDown, BookOpen, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-down";
import { ICourseStatEntry } from "@/services/progress.service";

interface ChwDataTableV2Props {
  courses?: ICourseStatEntry[];
}

export const ChwDataTableV2: React.FC<ChwDataTableV2Props> = ({
  courses = [],
}) => {
  const [sortBy, setSortBy] = useState("Recently added");
  const [activeTab, setActiveTab] = useState(0);

  const fallbackList = [
    {
      courseId: "c1",
      title: "UBUVUZI BW'IBANZE KU MUDUGUDU",
      level: "Beginner",
      duration: "15 • 15h",
      completion: 60,
      status: "In-Progress",
      preTest: "85/100",
      midTest: "85/100",
      postTest: "85/100",
      certificate: "Certificate: None",
    },
    {
      courseId: "c2",
      title: "UBUVUZI BW'IBANZE KU MUDUGUDU",
      level: "Beginner",
      duration: "15 • 15h",
      completion: 60,
      status: "In-Progress",
      preTest: "85/100",
      midTest: "85/100",
      postTest: "85/100",
      certificate: "Certificate: None",
    },
    {
      courseId: "c3",
      title: "UBUVUZI BW'IBANZE KU MUDUGUDU",
      level: "Beginner",
      duration: "15 • 15h",
      completion: 60,
      status: "In-Progress",
      preTest: "85/100",
      midTest: "85/100",
      postTest: "85/100",
      certificate: "Certificate: None",
    },
    {
      courseId: "c4",
      title: "UBUVUZI BW'IBANZE KU MUDUGUDU",
      level: "Beginner",
      duration: "15 • 15h",
      completion: 60,
      status: "In-Progress",
      preTest: "85/100",
      midTest: "85/100",
      postTest: "85/100",
      certificate: "Certificate: None",
    },
  ];

  const displayList =
    courses.length > 0
      ? courses.slice(0, 5).map((c) => ({
          courseId: c.courseId,
          title: c.title,
          level: "Beginner",
          duration: `${c.totalChapters || 15} • ${c.courseDuration || 15}h`,
          completion: Math.round(c.progress || 60),
          status: c.isCompleted ? "Completed" : "In-Progress",
          preTest: "85/100",
          midTest: "85/100",
          postTest: "85/100",
          certificate: c.isCompleted ? "Certificate: Earned" : "Certificate: None",
        }))
      : fallbackList;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
          CHW table
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
              <option>Most Active</option>
            </select>
          </div>

          <button className="px-3.5 py-1 bg-[#3363AD] text-white text-xs font-bold rounded-xl hover:bg-[#284f8a] transition-colors shadow-2xs">
            See All
          </button>
        </div>
      </div>

      {/* Pill Filter Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[0, 1, 2, 3, 4, 5].map((tabIdx) => (
          <button
            key={tabIdx}
            onClick={() => setActiveTab(tabIdx)}
            className={`px-3.5 py-1 rounded-md text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === tabIdx
                ? "bg-[#3363AD] text-white shadow-2xs"
                : "bg-[#F1F5F9] text-gray-600 hover:bg-[#EBF0F9]"
            }`}
          >
            150 Enrollments
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px]">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-3">
                <div className="flex items-center gap-1 cursor-pointer">
                  <span>Course Name</span>
                  <ArrowUpDown size={12} className="text-gray-400" />
                </div>
              </th>
              <th className="py-3 px-3">
                <div className="flex items-center gap-1 cursor-pointer">
                  <span>Time period</span>
                  <ArrowUpDown size={12} className="text-gray-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">
                <div className="flex items-center justify-center gap-1 cursor-pointer">
                  <span>Completion</span>
                  <ArrowUpDown size={12} className="text-gray-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">
                <div className="flex items-center justify-center gap-1 cursor-pointer">
                  <span>Progress status</span>
                  <ArrowUpDown size={12} className="text-gray-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">
                <div className="flex items-center justify-center gap-1 cursor-pointer">
                  <span>Pre Test</span>
                  <ArrowUpDown size={12} className="text-gray-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">
                <div className="flex items-center justify-center gap-1 cursor-pointer">
                  <span>Mid Test</span>
                  <ArrowUpDown size={12} className="text-gray-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-center">
                <div className="flex items-center justify-center gap-1 cursor-pointer">
                  <span>Post Test</span>
                  <ArrowUpDown size={12} className="text-gray-400" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">
                <div className="flex items-center justify-end gap-1 cursor-pointer">
                  <span>Course Name</span>
                  <ArrowUpDown size={12} className="text-gray-400" />
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 text-xs">
            {displayList.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#EBF0F9] text-[#3363AD] font-bold flex items-center justify-center shrink-0">
                      <BookOpen size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-gray-900 uppercase leading-tight truncate max-w-xs">
                        {item.title}
                      </p>
                      <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                        {item.level}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-3 font-semibold text-gray-600 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <PlayCircle size={14} className="text-[#3363AD]" />
                    <span>{item.duration}</span>
                  </div>
                </td>

                <td className="py-3.5 px-3 text-center whitespace-nowrap">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#3363AD] text-white text-[10px] font-black shadow-2xs">
                    {item.completion}%
                  </div>
                </td>

                <td className="py-3.5 px-3 text-center whitespace-nowrap">
                  <span className="inline-block px-3.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FFF4EC] text-[#E06D53] border border-[#FFE4D6]">
                    {item.status}
                  </span>
                </td>

                <td className="py-3.5 px-3 text-center font-bold text-gray-600 whitespace-nowrap">
                  {item.preTest}
                </td>

                <td className="py-3.5 px-3 text-center font-bold text-gray-600 whitespace-nowrap">
                  {item.midTest}
                </td>

                <td className="py-3.5 px-3 text-center font-bold text-gray-600 whitespace-nowrap">
                  {item.postTest}
                </td>

                <td className="py-3.5 px-3 text-right font-semibold text-gray-400 whitespace-nowrap">
                  {item.certificate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
