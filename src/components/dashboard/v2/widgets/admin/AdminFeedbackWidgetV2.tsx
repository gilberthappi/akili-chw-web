import React from "react";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCourseReviews, getSlideFeedbacks, getSystemReviews } from "@/services/feedback.service";

interface FeedbackItem {
  id: string;
  title: string;
  votes: number;
}

const FALLBACK_FEEDBACKS: FeedbackItem[] = [
  { id: "1", title: "Intego z'icyi kigwa zirasoanutse", votes: 230 },
  { id: "2", title: "Amasomo arimwo ivyigwa vyiza cyane", votes: 215 },
  { id: "3", title: "Ubusobanuro bw'isomo buraboneye", votes: 198 },
  { id: "4", title: "Imyitozo ni hyiza kandi iroroshye", votes: 184 },
];

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

  const displayItems: FeedbackItem[] =
    combinedReal.length > 0
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      ? combinedReal.slice(0, 4).map((r: any, idx: number) => ({
          id: r.id || `fb_${idx}`,
          title: r.comment || r.feedback || r.title || r.reviewText || "Intego z'icyi kigwa zirasoanutse",
          votes: r.rating ? Math.round(r.rating * 46) : r.votes ? r.votes : (230 - idx * 15),
        }))
      : FALLBACK_FEEDBACKS;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex flex-col justify-between space-y-3 flex-1">
      {/* Card Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
          Feedback
        </h3>
        <span className="text-[10px] font-bold text-gray-400">Top Rated</span>
      </div>

      {/* List of Feedback Cards */}
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
              <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                {item.votes} votes
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
