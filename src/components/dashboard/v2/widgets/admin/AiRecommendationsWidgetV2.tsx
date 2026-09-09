import React from "react";
import { SECTION3_AI_RECOMMENDATIONS } from "./section3DesignData";

interface AiRecommendationsWidgetV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  recommendations?: any[];
  useDesignDummy?: boolean;
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
        {score}%
      </span>
    </div>
  );
};

export const AiRecommendationsWidgetV2: React.FC<AiRecommendationsWidgetV2Props> = ({
  embedded = false,
}) => {
  const list = SECTION3_AI_RECOMMENDATIONS;

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
        {list.map((item, idx) => (
          <div
            key={`${item.title}-${idx}`}
            className="flex items-center gap-2 p-2 rounded-[10px] bg-[#E8F0F8] hover:bg-[#DDE8F3] transition-colors cursor-pointer"
          >
            <ScoreRing score={item.score} />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-[#1A2332] tracking-tight truncate">
                {item.title}
              </p>
              <p className="text-[9px] font-medium text-[#5B6575] mt-0.5 truncate">
                {item.chapters} Chapters
                <span className="text-[#4B82BA] mx-1">•</span>
                {item.candidates} Candidates
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AiRecommendationsWidgetV2;
