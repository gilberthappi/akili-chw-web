import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Award,
  Edit3,
  User as UserIcon,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

interface ProfileCardV2Props {
  completedCoursesCount?: number;
  totalCertificatesCount?: number;
  customUser?: {
    fullNames?: string;
    email?: string;
    phoneNumber?: string;
    photo?: string | null;
    roleLabel?: string;
  };
}

export const ProfileCardV2: React.FC<ProfileCardV2Props> = ({
  completedCoursesCount = 0,
  totalCertificatesCount = 0,
  customUser,
}) => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const fullNames = customUser?.fullNames || authUser?.fullNames || "Community Health Worker";
  const email = customUser?.email || authUser?.email || "chw@akili.org";
  const phone = customUser?.phoneNumber || authUser?.phoneNumber || "+250 788 000 000";
  const location = "Kigali, Rwanda";
  const roleLabel =
    customUser?.roleLabel ||
    (Array.isArray(authUser?.roles) ? authUser.roles[0] : authUser?.roles || "CHW");

  const avatarUrl = customUser?.photo !== undefined ? customUser.photo : (authUser?.photo || null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Top Banner & Avatar Header */}
      <div className="relative bg-gradient-to-r from-[#3363AD]/20 via-[#3363AD]/10 to-[#EBF0F9] pt-8 pb-4 px-6 flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-[#3363AD] flex items-center justify-center text-white text-2xl font-bold">
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
              <UserIcon size={40} className="text-white/80" />
            )}
          </div>
          <span className="absolute bottom-0 right-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white flex items-center gap-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Active
          </span>
        </div>

        {/* User Code / Role pill */}
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#3363AD]/10 text-[#3363AD] text-[11px] font-bold tracking-wide uppercase mb-1">
          <ShieldCheck size={12} />
          {roleLabel}
        </div>

        <h3 className="text-base font-bold text-gray-900 truncate max-w-full">
          {fullNames}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Member since {new Date().getFullYear()}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-4 w-full">
          <button
            onClick={() => navigate("/messaging")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#3363AD]/10 hover:bg-[#3363AD]/20 text-[#3363AD] text-xs font-semibold transition-colors"
          >
            <MessageSquare size={14} />
            Messages
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="inline-flex items-center justify-center p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-semibold transition-colors"
            title="Edit Profile"
          >
            <Edit3 size={14} />
          </button>
        </div>
      </div>

      {/* Contact Details */}
      <div className="p-5 border-b border-gray-100 space-y-3">
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
          Contact Details
        </h4>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-center gap-2.5 text-gray-600">
            <div className="w-7 h-7 rounded-lg bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center shrink-0">
              <Mail size={13} />
            </div>
            <span className="truncate">{email}</span>
          </div>

          <div className="flex items-center gap-2.5 text-gray-600">
            <div className="w-7 h-7 rounded-lg bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center shrink-0">
              <Phone size={13} />
            </div>
            <span>{phone}</span>
          </div>

          <div className="flex items-center gap-2.5 text-gray-600">
            <div className="w-7 h-7 rounded-lg bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center shrink-0">
              <MapPin size={13} />
            </div>
            <span className="truncate">{location}</span>
          </div>
        </div>
      </div>

      {/* Awards & Recognitions */}
      <div className="p-5 flex-1 space-y-3">
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
          <span>Awards & Milestones</span>
          <Award size={14} className="text-[#3363AD]" />
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-amber-50/60 border border-amber-100/60">
            <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              🏆
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {totalCertificatesCount > 0
                  ? `${totalCertificatesCount} Certificates Earned`
                  : "Certified Health Practitioner"}
              </p>
              <p className="text-[11px] text-gray-500">
                Official Ministry & Partner Accreditation
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-emerald-50/60 border border-emerald-100/60">
            <div className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 size={13} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {completedCoursesCount} Courses Completed
              </p>
              <p className="text-[11px] text-gray-500">
                100% Modules Passed Successfully
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Edit Link */}
      <div className="p-4 bg-gray-50/50 border-t border-gray-100 mt-auto">
        <button
          onClick={() => navigate("/settings")}
          className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
        >
          <Edit3 size={13} />
          Edit Profile Information
        </button>
      </div>
    </div>
  );
};
