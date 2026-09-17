import React, { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  MoreHorizontal,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import { useAdminDashboardV2ProgramCourses } from "@/hooks/useAdminDashboardV2ProgramCourses";
import { CardsGridSkeleton } from "./AdminWidgetSkeleton";
import { V2_CARD_SHELL_PADDED } from "./v2CardStyles";

interface ProgramCoursesGridV2Props {
  /** When true, omit outer card chrome (used inside shared Section 3 shell) */
  embedded?: boolean;
}

export const ProgramCoursesGridV2: React.FC<ProgramCoursesGridV2Props> = ({
  embedded = false,
}) => {
  const navigate = useNavigate();
  const { filters } = useAdminDashboardFilters();
  const [sortBy, setSortBy] = useState("Recently added");
  const { data, isLoading } = useAdminDashboardV2ProgramCourses(
    filters,
    sortBy,
  );

  const totalCount = data?.totalCount ?? 0;
  const items = data?.items ?? [];

  const shell = embedded
    ? "flex flex-col w-full h-full min-h-0 p-3.5"
    : `${V2_CARD_SHELL_PADDED} flex flex-col w-full h-full min-h-0`;

  return (
    <div className={shell}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3 shrink-0">
        <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight">
          Program Courses ({totalCount})
        </h3>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center gap-1.5 text-[11px] font-semibold text-[#5B6575]">
            <span>Sort by:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none font-semibold text-[#5B6575] bg-white border border-[#B8CDE0] rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none cursor-pointer hover:border-[#4B82BA] transition-colors"
              >
                <option>Recently added</option>
                <option>Most Enrolled</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5B6575] pointer-events-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/courses")}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#3363AD] text-white text-[11px] font-semibold rounded-lg hover:bg-[#2a5290] transition-colors cursor-pointer"
          >
            See All
          </button>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden overscroll-contain pb-1
          [scrollbar-gutter:stable]
          [&::-webkit-scrollbar]:h-1.5
          [&::-webkit-scrollbar-track]:bg-[#E8EEF4]
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-[#A8B8C8]
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {isLoading && !data ? (
          <CardsGridSkeleton count={4} />
        ) : (
          <div
            className="grid grid-rows-2 grid-flow-col gap-2 content-start h-full"
            style={{ gridAutoColumns: "minmax(320px, 340px)" }}
          >
            {items.map((item) => {
              const TrendIcon = item.growthPositive ? ArrowUp : ArrowDown;
              const trendBg = item.growthPositive
                ? "bg-[#5BA8A0]"
                : "bg-[#E07070]";

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => navigate(`/courses/${item.id}/analysis`)}
                  className="text-left bg-[#E8F0F8] hover:bg-[#DDE8F3] rounded-[10px] px-2.5 py-2 flex flex-col justify-between gap-1 transition-colors cursor-pointer group min-h-[108px] h-full"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className="w-6 h-6 rounded-md text-white flex items-center justify-center shrink-0"
                      style={{ backgroundColor: item.iconColor }}
                    >
                      <BookOpen size={12} />
                    </span>
                    <p className="flex-1 min-w-0 text-[10px] font-bold text-[#1A2332] uppercase tracking-tight leading-snug pt-0.5">
                      {item.title}
                    </p>
                    <span className="text-[#9AA3B2] shrink-0" aria-hidden>
                      <MoreHorizontal size={14} />
                    </span>
                  </div>

                  <p className="text-[10px] font-medium text-[#5B6575] leading-snug">
                    <span>{item.chapters} Chapters</span>
                    <span className="text-[#4B82BA] mx-1">•</span>
                    <span>{item.sections} Sections</span>
                    <span className="text-[#4B82BA] mx-1">•</span>
                    <span>{item.mediaFiles} Media files</span>
                    <span className="text-[#4B82BA] mx-1">•</span>
                    <span>{item.questions} Questions</span>
                  </p>

                  <div className="flex items-center gap-2 whitespace-nowrap overflow-hidden text-[9px] font-semibold text-[#1A2332]">
                    <span className="shrink-0">
                      {item.enrollments} Enrollments
                    </span>
                    <span className="shrink-0">
                      {item.attempts} test attempts
                    </span>
                    <span className="shrink-0">
                      {item.certificates} certificates
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1 shrink-0">
                      <span
                        className={`w-4 h-4 rounded-full ${trendBg} text-white flex items-center justify-center`}
                      >
                        <TrendIcon size={9} strokeWidth={2.5} />
                      </span>
                      <span className="text-[9px] font-semibold text-[#5B6575] tabular-nums">
                        {item.growth}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramCoursesGridV2;
