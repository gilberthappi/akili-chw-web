import React from "react";
import { Star, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCourseReviews, getSlideFeedbacks, getSystemReviews } from "@/services/feedback.service";

interface FeedbackDisplayItem {
  id: string;
  title: string;
  author: string;
  rating: number;
  category: string;
}

export const AdminFeedbackWidgetV2: React.FC = () => {
  // Fetch real course reviews
  const { data: reviewsRes } = useQuery({
    queryKey: ["adminFeedbackCourseReviewsV2"],
    queryFn: () => getCourseReviews("?limit=6"),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch real slide feedbacks if course reviews are limited
  const { data: slideFeedbacksRes } = useQuery({
    queryKey: ["adminFeedbackSlideFeedbacksV2"],
    queryFn: () => getSlideFeedbacks("?limit=6"),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch real system reviews
  const { data: systemReviewsRes } = useQuery({
    queryKey: ["adminFeedbackSystemReviewsV2"],
    queryFn: () => getSystemReviews("?limit=6"),
    staleTime: 1000 * 60 * 5,
  });

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const realCourseReviews = reviewsRes?.data || [];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const realSlideFeedbacks = slideFeedbacksRes?.data || [];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const realSystemReviews = systemReviewsRes?.data || [];

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const combinedReal = [
    ...(Array.isArray(realCourseReviews) ? realCourseReviews : []),
    ...(Array.isArray(realSlideFeedbacks) ? realSlideFeedbacks : []),
    ...(Array.isArray(realSystemReviews) ? realSystemReviews : []),
  ];

  const displayItems: FeedbackDisplayItem[] = combinedReal
    .slice(0, 4)
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    .map((r: any, idx: number) => {
      const commentText =
        r.comment || r.feedback || r.message || r.title || r.reviewText || "CHW Training Feedback";
      const authorName =
        r.student?.user?.fullNames || r.user?.fullNames || r.userName || "Active CHW";
      const starRating = Number(r.rating || r.overallRating || 5);
      const categoryLabel =
        r.course?.title || r.slide?.chapter?.title || "Platform Review";

      return {
        id: r.id || `fb_${idx}`,
        title: commentText,
        author: authorName,
        rating: starRating,
        category: categoryLabel,
      };
    });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col justify-between space-y-3 flex-1 min-h-[220px]">
      {/* Card Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
          <span>Feedback</span>
        </h3>
        <span className="text-[10px] font-bold text-[#3363AD] bg-[#EBF3FB] px-2 py-0.5 rounded-full">
          Recent Reviews
        </span>
      </div>

      {/* List of Feedback Cards or Clean Empty State */}
      {displayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 flex-1">
          <div className="w-10 h-10 rounded-full bg-[#EBF3FB] flex items-center justify-center text-[#3363AD]">
            <MessageSquare size={18} className="text-[#3363AD]" />
          </div>
          <p className="text-xs font-bold text-gray-700">No feedback submitted yet</p>
          <p className="text-[10px] text-gray-400 font-semibold max-w-[200px]">
            CHW reviews and ratings will appear here automatically as they complete training modules.
          </p>
        </div>
      ) : (
        <div className="space-y-2 flex-1">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#EBF3FB] hover:bg-[#E1EFFD] transition-colors border border-[#D5E6F8] rounded-xl p-2.5 flex items-center gap-3 cursor-pointer group"
            >
              {/* Orange Badge Icon with White Star */}
              <div className="w-8 h-8 rounded-lg bg-[#FF9F1C] group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 shadow-2xs">
                <Star size={16} className="text-white fill-white" />
              </div>

              {/* Content Text */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-gray-800 truncate leading-snug">
                  {item.title}
                </p>
                <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500 mt-0.5 gap-1">
                  <span className="truncate max-w-[130px]">{item.author}</span>
                  <span className="text-[#D97706] font-bold shrink-0 flex items-center gap-0.5">
                    ★ {item.rating}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

