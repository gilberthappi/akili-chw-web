import React, { useState } from "react";
import { ChevronDown, Star } from "lucide-react";
import { useAdminDashboardFilters } from "../../AdminDashboardFiltersContext";
import { useAdminDashboardV2CourseRatings } from "@/hooks/useAdminDashboardV2CourseRatings";
import { ListSkeleton } from "./AdminWidgetSkeleton";
import { V2_CARD_SHELL_PADDED } from "./v2CardStyles";

const StarRow: React.FC<{ rating: number }> = ({ rating }) => {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < full || (i === full && hasHalf);
        return (
          <Star
            key={i}
            size={12}
            className={
              filled
                ? "text-[#F59E0B] fill-[#F59E0B]"
                : "text-[#C8D6E3] fill-none"
            }
          />
        );
      })}
    </div>
  );
};

export const CourseRatingsWidgetV2: React.FC = () => {
  const { filters } = useAdminDashboardFilters();
  const [sortBy, setSortBy] = useState("Most rated");
  const { items, isLoading } = useAdminDashboardV2CourseRatings(filters, sortBy);

  return (
    <div className={`${V2_CARD_SHELL_PADDED} flex flex-col w-full h-full min-h-0 overflow-hidden`}>
      <div className="flex items-center justify-between gap-2 mb-2.5 shrink-0">
        <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight">
          Course ratings
        </h3>
        <div className="relative shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none text-[11px] font-semibold bg-white border border-[#B8CDE0] text-[#5B6575] rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none cursor-pointer hover:border-[#4B82BA] transition-colors"
          >
            <option>Most rated</option>
            <option>Least rated</option>
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5B6575] pointer-events-none"
          />
        </div>
      </div>

      <div
        className="flex-1 min-h-0 h-0 overflow-y-auto overscroll-contain space-y-2 pr-1
          [scrollbar-gutter:stable]
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-[#E8EEF4]
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-[#A8B8C8]
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {isLoading && items.length === 0 ? (
          <ListSkeleton rows={6} />
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-[12px] text-[#9AA3B2]">
            No course ratings for these filters
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="bg-[#E8EEF4] hover:bg-[#DDE4EC] transition-colors rounded-[12px] px-3 py-2.5 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-md bg-[#D6E4F5] shrink-0 flex items-center justify-center overflow-hidden">
                {item.coverIcon ? (
                  <img
                    src={item.coverIcon}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Star size={14} className="text-[#3363AD]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-[#1A2332] leading-snug line-clamp-2">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <StarRow rating={item.rating} />
                  <span className="text-[11px] font-semibold text-[#1A2332] tabular-nums">
                    {item.rating.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-medium text-[#5B6575] tabular-nums">
                    ({item.reviewCount} review{item.reviewCount === 1 ? "" : "s"})
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/** @deprecated Use CourseRatingsWidgetV2 */
export const AdminFeedbackWidgetV2 = CourseRatingsWidgetV2;

export default CourseRatingsWidgetV2;
