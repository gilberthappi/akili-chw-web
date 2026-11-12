import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { House, LayoutDashboard, Sparkles } from "lucide-react";

/** Compact Classic ↔ V2 toggle — sits on the board without a full header bar. */
export const DashboardVersionSwitcher: React.FC<{
  className?: string;
  /** Prefer light styling on the V2 blue canvas */
  onCanvas?: boolean;
}> = ({ className = "", onCanvas = false }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isV2 = pathname !== "/classic";

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
          isV2 ? active : idle
        }`}
      >
        <Sparkles size={12} />
        Beta
      </button>
      <button
        type="button"
        onClick={() => navigate("/classic")}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
          !isV2 ? active : idle
        }`}
      >
        <LayoutDashboard size={12} />
        Classic
      </button>
    </div>
  );
};

export default DashboardVersionSwitcher;

type CehoDashView = "home" | "board" | "classic";

/** Home (default) ↔ previous beta board ↔ classic. CEHO only. */
export const CEHODashboardVersionSwitcher: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const view = new URLSearchParams(search).get("view");
  const mode: CehoDashView =
    pathname === "/classic" ? "classic" : view === "board" ? "board" : "home";

  const go = (next: CehoDashView) => {
    if (next === "classic") navigate("/classic");
    else if (next === "board") navigate("/?view=board");
    else navigate("/");
  };

  const item = (id: CehoDashView, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => go(id)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
        mode === id ? "bg-[#3363AD] text-white shadow-xs" : "text-[#64748B] hover:bg-[#F1F5F9]"
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-full border bg-white/90 border-[#D7E3F0] shadow-sm backdrop-blur-sm ${className}`}
      role="group"
      aria-label="CEHO dashboard version"
    >
      {item("home", "Home", <House size={12} />)}
      {item("board", "Beta", <Sparkles size={12} />)}
      {item("classic", "Classic", <LayoutDashboard size={12} />)}
    </div>
  );
};
