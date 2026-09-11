import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import { useAdminDashboardV2AiRecommendations } from "@/hooks/useAdminDashboardV2AiRecommendations";
import { ListSkeleton } from "./AdminWidgetSkeleton";

interface AiRecommendationsWidgetV2Props {
  /** When true, omit outer card chrome (used inside shared Section 3 shell) */
  embedded?: boolean;
}

/** Circular progress ring matching design (score %) */
const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const size = 36;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, score)) / 100) * c;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#D5E0EB"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#3363AD"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[#3363AD] tabular-nums">
        {Math.round(score)}%
      </span>
    </div>
  );
};

export const AiRecommendationsWidgetV2: React.FC<
  AiRecommendationsWidgetV2Props
> = ({ embedded = false }) => {
  const { filters } = useAdminDashboardFilters();
  const { items, isLoading } = useAdminDashboardV2AiRecommendations(filters);
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);

  const shell = embedded
    ? "flex flex-col w-full h-full min-h-0 p-3.5"
    : "bg-white rounded-[20px] border border-[#C8D6E3] p-3.5 flex flex-col w-full h-full min-h-0";

  return (
    <div className={shell}>
      <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight mb-2.5 shrink-0">
        AI Recommendation
      </h3>

      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-1.5 pr-1
          [scrollbar-gutter:stable]
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-[#E8EEF4]
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-[#A8B8C8]
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {isLoading && items.length === 0 ? (
          <ListSkeleton rows={5} />
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-[#9AA3B2]">
            No recommendations for current filters
          </div>
        ) : (
          items.map((item) => {
            const open = openCourseId === item.courseId;
            return (
              <div key={item.courseId} className="rounded-[10px] bg-[#E8F0F8]">
                <button
                  type="button"
                  onClick={() =>
                    setOpenCourseId(open ? null : item.courseId)
                  }
                  className="w-full flex items-center gap-2 p-2 rounded-[10px] hover:bg-[#DDE8F3] transition-colors cursor-pointer text-left"
                >
                  <ScoreRing score={item.score} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-[#1A2332] tracking-tight truncate">
                      {item.title}
                    </p>
                    <p className="text-[9px] font-medium text-[#5B6575] mt-0.5 truncate">
                      {item.chapters} Chapters
                      <span className="text-[#4B82BA] mx-1">•</span>
                      {item.candidates} Candidates
                    </p>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`shrink-0 text-[#5B6575] transition-transform ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {open && item.recommendedChapters.length > 0 && (
                  <div className="px-1 pb-2 pt-0 space-y-1">
                    {item.recommendedChapters.map((ch) => (
                      <div
                        key={ch.chapterId}
                        className="ml-10 rounded-lg bg-white/80 border border-[#D5E0EB] px-2.5 py-1.5"
                      >
                        <p className="text-[10px] font-semibold text-[#1A2332] truncate">
                          {ch.title}
                        </p>
                        <p className="text-[9px] font-medium text-[#5B6575] mt-0.5">
                          {ch.recommendationCount} flags
                          {ch.highSeverityCount > 0 && (
                            <>
                              <span className="text-[#4B82BA] mx-1">•</span>
                              {ch.highSeverityCount} high
                            </>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AiRecommendationsWidgetV2;
