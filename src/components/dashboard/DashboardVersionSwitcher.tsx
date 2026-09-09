import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Sparkles } from "lucide-react";

/** Compact Classic ↔ V2 toggle — sits on the board without a full header bar. */
export const DashboardVersionSwitcher: React.FC<{
  className?: string;
  /** Prefer light styling on the V2 blue canvas */
  onCanvas?: boolean;
}> = ({ className = "", onCanvas = false }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isV2 = pathname === "/v2" || pathname === "/new";

  const shell = onCanvas
    ? "bg-white/90 border-[#D7E3F0] shadow-sm backdrop-blur-sm"
    : "bg-white border-gray-200 shadow-xs";

  const idle = onCanvas
    ? "text-[#64748B] hover:bg-[#F1F5F9]"
    : "text-gray-500 hover:bg-gray-50";
  const active = "bg-[#3363AD] text-white shadow-xs";

  return (
    <div
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-full border ${shell} ${className}`}
      role="group"
      aria-label="Dashboard version"
    >
      <button
        type="button"
        onClick={() => navigate("/")}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
          !isV2 ? active : idle
        }`}
      >
        <LayoutDashboard size={12} />
        Classic
      </button>
      <button
        type="button"
        onClick={() => navigate("/v2")}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
          isV2 ? active : idle
        }`}
      >
        <Sparkles size={12} />
        New
      </button>
    </div>
  );
};

export default DashboardVersionSwitcher;
