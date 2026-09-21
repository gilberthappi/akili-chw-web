import React from "react";
import {
  Phone,
  MapPin,
  MessageSquare,
  Award,
  CheckCircle2,
  User as UserIcon,
  PhoneCall,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StudentProfileCardV2Props {
  fullNames: string;
  phone: string;
  photo?: string | null;
  address?: string;
  status?: string;
  enrolledDate?: string;
  studentCode?: string;
  certificatesCount?: number;
  completedCoursesCount?: number;
}

export const StudentProfileCardV2: React.FC<StudentProfileCardV2Props> = ({
  fullNames,
  phone,
  photo,
  address = "—",
  status = "ACTIVE",
  enrolledDate = "—",
  studentCode = "—",
  certificatesCount = 0,
  completedCoursesCount = 0,
}) => {
  const navigate = useNavigate();
  const isActive = String(status).toUpperCase() === "ACTIVE";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
      <div className="relative bg-gradient-to-r from-[#D8B4FE]/30 via-[#E9D5FF]/40 to-[#F3E8FF] pt-8 pb-5 px-6 flex flex-col items-center text-center">
        <div className="relative mb-3">
          <div className="w-24 h-24 rounded-full ring-4 ring-white shadow-md overflow-hidden bg-[#3363AD] flex items-center justify-center text-white text-2xl font-bold">
            {photo ? (
              <img
                src={photo}
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
        </div>

        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="px-2 py-0.5 rounded-md bg-[#3363AD]/10 text-[#3363AD] text-[11px] font-bold tracking-wide">
            {studentCode}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {isActive ? "Active" : String(status)}
          </span>
        </div>

        <h3 className="text-base font-extrabold text-gray-900 truncate max-w-full">
          {fullNames}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Enrolled on {enrolledDate}</p>

        <div className="flex items-center justify-center gap-2 mt-4 w-full">
          {phone !== "—" && (
            <a
              href={`tel:${phone}`}
              className="p-2 rounded-xl bg-white/80 hover:bg-white text-gray-600 shadow-2xs transition-colors border border-purple-100"
              title="Call Student"
            >
              <PhoneCall size={14} />
            </a>
          )}
          <button
            onClick={() => navigate("/messaging")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7E22CE] text-xs font-bold transition-colors"
          >
            <MessageSquare size={14} />
            Chat
          </button>
        </div>
      </div>

      <div className="p-5 border-b border-gray-100 space-y-3">
        <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
          Contact
        </h4>

        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#7E22CE] flex items-center justify-center shrink-0">
              <Phone size={13} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-medium">Phone Number</p>
              <p className="font-semibold text-gray-800">{phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#7E22CE] flex items-center justify-center shrink-0">
              <MapPin size={13} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-medium">Address</p>
              <p className="font-semibold text-gray-800 truncate">{address}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 space-y-3">
        <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
          Learning summary
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2.5 text-gray-600 font-medium">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>
              {completedCoursesCount} course
              {completedCoursesCount === 1 ? "" : "s"} completed
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-600 font-medium">
            <Award size={14} className="text-[#3363AD] shrink-0" />
            <span>
              {certificatesCount} certificate{certificatesCount === 1 ? "" : "s"}{" "}
              earned
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
