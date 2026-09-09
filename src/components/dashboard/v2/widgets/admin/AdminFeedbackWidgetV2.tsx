import React from "react";
import { Star } from "lucide-react";
import { SECTION5_FEEDBACK } from "./section5DesignData";

interface AdminFeedbackWidgetV2Props {
  useDesignDummy?: boolean;
}

export const AdminFeedbackWidgetV2: React.FC<AdminFeedbackWidgetV2Props> = () => {
  const items = SECTION5_FEEDBACK;

  return (
    <div className="bg-white rounded-[20px] border border-[#C8D6E3] p-3.5 flex flex-col w-full h-full min-h-0 overflow-hidden">
      <h3 className="text-[14px] font-bold text-[#1A2332] tracking-tight mb-2.5 shrink-0">
        Feedback
      </h3>

      <div
        className="flex-1 min-h-0 h-0 overflow-y-auto overscroll-contain space-y-2 pr-1
          [scrollbar-gutter:stable]
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-[#E8EEF4]
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-[#A8B8C8]
          [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-[#E8EEF4] hover:bg-[#DDE4EC] transition-colors rounded-[12px] px-3 py-2.5 flex items-center gap-3 cursor-pointer"
          >
            {/* <div className="w-9 h-9 rounded-full bg-[#FF9F1C] flex items-center justify-center shrink-0">
              <Star size={16} className="text-[#FDE047] fill-[#FDE047]" />
            </div> */}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-bold text-[#1A2332] leading-snug">
                {item.title}
              </p>
              <p className="text-[11px] font-medium text-[#5B6575] mt-0.5 tabular-nums">
                {item.name}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminFeedbackWidgetV2;
