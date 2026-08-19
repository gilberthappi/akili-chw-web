import React from "react";
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Award,
  Edit,
  User as UserIcon,
  PhoneCall,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StudentProfileCardV2Props {
  fullNames: string;
  email: string;
  phone: string;
  photo?: string | null;
  enrolledDate?: string;
  studentCode?: string;
}

export const StudentProfileCardV2: React.FC<StudentProfileCardV2Props> = ({
  fullNames,
  email,
  phone,
  photo,
  enrolledDate = "Jun 30, 2025",
  studentCode = "STU-005",
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Top Banner & Avatar Header */}
      <div className="relative bg-gradient-to-r from-[#D8B4FE]/30 via-[#E9D5FF]/40 to-[#F3E8FF] pt-8 pb-5 px-6 flex flex-col items-center text-center">
        {/* Avatar */}
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

        {/* Student Code & Status Pill */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="px-2 py-0.5 rounded-md bg-[#3363AD]/10 text-[#3363AD] text-[11px] font-bold tracking-wide">
            {studentCode}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 text-[11px] font-bold">
            Active
          </span>
        </div>

        {/* Name & Enrolled Date */}
        <h3 className="text-base font-extrabold text-gray-900 truncate max-w-full">
          {fullNames}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Enrolled on {enrolledDate}</p>

        {/* Quick Contact Action Icons (Phone, Mail, Chat) */}
        <div className="flex items-center justify-center gap-2 mt-4 w-full">
          <a
            href={`tel:${phone}`}
            className="p-2 rounded-xl bg-white/80 hover:bg-white text-gray-600 shadow-2xs transition-colors border border-purple-100"
            title="Call Student"
          >
            <PhoneCall size={14} />
          </a>
          <a
            href={`mailto:${email}`}
            className="p-2 rounded-xl bg-white/80 hover:bg-white text-gray-600 shadow-2xs transition-colors border border-purple-100"
            title="Email Student"
          >
            <Mail size={14} />
          </a>
          <button
            onClick={() => navigate("/messaging")}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7E22CE] text-xs font-bold transition-colors"
          >
            <MessageSquare size={14} />
            Chat
          </button>
        </div>
      </div>

      {/* Contact Section */}
      <div className="p-5 border-b border-gray-100 space-y-3">
        <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
          Contact
        </h4>

        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#7E22CE] flex items-center justify-center shrink-0">
              <Mail size={13} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-medium">Email</p>
              <p className="font-semibold text-gray-800 truncate">{email}</p>
            </div>
          </div>

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
              <p className="font-semibold text-gray-800 truncate">Rwanda</p>
            </div>
          </div>
        </div>
      </div>

      {/* Awards & Recognitions Section */}
      <div className="p-5 flex-1 space-y-3">
        <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
          Awards & Recognitions
        </h4>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2.5 text-gray-600 font-medium">
            <span className="text-sm shrink-0">🥈</span>
            <span className="truncate">2nd position in Health Olympiad</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-600 font-medium">
            <span className="text-sm shrink-0">🥇</span>
            <span className="truncate">10th position in Mathematics Olympiad</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-600 font-medium">
            <span className="text-sm shrink-0">🏆</span>
            <span className="truncate">Student of the Year</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-600 font-medium">
            <span className="text-sm shrink-0">📜</span>
            <span className="truncate">Outstanding Punctuality Award</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-600 font-medium">
            <span className="text-sm shrink-0">⭐</span>
            <span className="truncate">Perfect Attendance Award</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-600 font-medium">
            <span className="text-sm shrink-0">🚀</span>
            <span className="truncate">Most Improved Student</span>
          </div>
          <div className="flex items-center gap-2.5 text-gray-600 font-medium">
            <span className="text-sm shrink-0">💡</span>
            <span className="truncate">Creative Thinker Award</span>
          </div>
        </div>
      </div>

      {/* Footer Edit Button */}
      <div className="p-4 bg-gray-50/50 border-t border-gray-100 mt-auto">
        <button className="w-full py-2.5 px-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 shadow-2xs">
          <Edit size={13} />
          Edit
        </button>
      </div>
    </div>
  );
};
