import React from "react";

export const AiRecommendationsWidgetV2: React.FC = () => {
  const recommendations = [
    { score: 76, title: "HIV", info: "8 Chapters • 150 Candidates" },
    { score: 71, title: "HIV", info: "8 Chapters • 150 Candidates" },
    { score: 76, title: "HIV", info: "8 Chapters • 150 Candidates" },
    { score: 71, title: "HIV", info: "8 Chapters • 150 Candidates" },
    { score: 76, title: "HIV", info: "8 Chapters • 150 Candidates" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-3.5 h-full">
      <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
        AI Recommendation
      </h3>

      <div className="space-y-2.5 flex-1">
        {recommendations.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50/80 transition-colors cursor-pointer"
          >
            {/* Circular Progress Score Badge */}
            <div className="w-10 h-10 rounded-full border-2 border-[#3363AD] text-[#3363AD] text-xs font-black flex items-center justify-center shrink-0">
              {item.score}%
            </div>

            <div className="min-w-0">
              <p className="text-xs font-extrabold text-gray-900 uppercase">
                {item.title}
              </p>
              <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                {item.info}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
