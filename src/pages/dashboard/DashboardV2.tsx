import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { CHWLearnerDashboardV2 } from "@/components/dashboard/v2/CHWLearnerDashboardV2";
import { AdminDashboardV2 } from "@/components/dashboard/v2/AdminDashboardV2";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";

export const DashboardV2: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userRoles: string[] = user?.roles
    ? Array.isArray(user.roles)
      ? (user.roles as string[])
      : [user.roles as string]
    : [];

  const isLearner = userRoles.some((r) =>
    ["TRAINEE", "TESTER", "CEHO"].includes(r)
  ) && !userRoles.some((r) => ["ADMIN", "STAFF", "DEVELOPER"].includes(r));

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar: Greeting & Switch to Classic Toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center font-bold">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-gray-900">
                {greeting}, {user?.fullNames || "User"}!
              </h1>
              <span className="bg-[#3363AD] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                V2 Dashboard (Beta)
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Welcome to the upgraded modern dashboard experience
            </p>
          </div>
        </div>

        {/* Toggle Switch back to classic view */}
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
        >
          <ArrowLeft size={14} className="text-gray-500" />
          <span>Switch to Classic Dashboard</span>
        </button>
      </div>

      {/* Role-based Dashboard Views */}
      {isLearner ? <CHWLearnerDashboardV2 /> : <AdminDashboardV2 />}
    </div>
  );
};
