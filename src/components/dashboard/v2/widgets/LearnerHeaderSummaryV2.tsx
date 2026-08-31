import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  ShieldCheck,
  Flame,
  MessageSquare,
  Settings,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

interface LearnerHeaderSummaryV2Props {
  customUser?: {
    fullNames?: string;
    email?: string;
    phoneNumber?: string;
    photo?: string | null;
    roleLabel?: string;
  };
  completedCoursesCount?: number;
  totalCertificatesCount?: number;
}

export const LearnerHeaderSummaryV2: React.FC<LearnerHeaderSummaryV2Props> = ({
  customUser,
  completedCoursesCount: _completedCoursesCount = 0,
  totalCertificatesCount: _totalCertificatesCount = 0,
}) => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const fullNames = customUser?.fullNames || authUser?.fullNames || "Community Health Worker";
  const email = customUser?.email || authUser?.email || "chw@akili.org";
  const phone = customUser?.phoneNumber || authUser?.phoneNumber || "+250 788 000 000";
  const location = "Kigali, Rwanda";
  const roleLabel =
    customUser?.roleLabel ||
    (Array.isArray(authUser?.roles) ? authUser.roles[0] : authUser?.roles || "CHW Practitioner");

  const avatarUrl = customUser?.photo !== undefined ? customUser.photo : (authUser?.photo || null);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#3363AD] to-[#254B85] p-6 text-white shadow-md">
      {/* Decorative Glow Elements */}
      <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute right-40 -bottom-16 w-48 h-48 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-6 flex-wrap">
        {/* Left: User Avatar & Persona Details */}
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl ring-4 ring-white/20 shadow-lg overflow-hidden bg-white/10 flex items-center justify-center text-white text-2xl font-bold backdrop-blur-sm">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullNames}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <UserIcon size={36} className="text-white/80" />
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ring-2 ring-white flex items-center gap-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Active
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-md">
                <ShieldCheck size={12} />
                {roleLabel}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                <Flame size={12} className="text-amber-400" />
                7 Day Streak
              </span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">
              {fullNames}
            </h2>

            <div className="flex items-center gap-4 text-xs text-white/80 flex-wrap pt-0.5">
              <span className="flex items-center gap-1">
                <Mail size={13} className="text-white/60" />
                {email}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={13} className="text-white/60" />
                {phone}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-white/60" />
                {location}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/messaging")}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all backdrop-blur-md"
          >
            <MessageSquare size={15} />
            Messages
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-[#3363AD] hover:bg-gray-100 text-xs font-extrabold shadow-sm transition-all hover:scale-[1.02]"
          >
            <Settings size={15} />
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};
