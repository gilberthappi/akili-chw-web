import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/services/auth.service";
import { Building2, Phone, MapPin } from "lucide-react";
import { formatRoleLabel } from "@/utils/roles";

export const ProfileCardV2: React.FC = () => {
  const { user: authUser } = useAuth();

  // Fetch full detailed profile from /auth/me
  const { data: profileResponse } = useQuery({
    queryKey: ["userProfileMe"],
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5,
  });

  const fullUser = profileResponse?.data || authUser;

  const fullNames = fullUser?.fullNames || authUser?.fullNames || "User Profile";
  const phone = fullUser?.phoneNumber || authUser?.phoneNumber || "+250700000000";

  // Extract health center name
  const rawHealthCenter =
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (fullUser as any)?.healthCenter ||
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (authUser as any)?.healthCenter;

  const healthCenter =
    typeof rawHealthCenter === "object" && rawHealthCenter !== null
      ? rawHealthCenter.name
      : typeof rawHealthCenter === "string" && rawHealthCenter.trim()
      ? rawHealthCenter
      : "Mwulire CS";

  // Extract location address
  const userObj = (fullUser || authUser) as {
    village?: string;
    cell?: string;
    sector?: string;
    district?: string;
  };

  const locationParts = [
    userObj?.village,
    userObj?.cell,
    userObj?.sector,
    userObj?.district,
  ].filter((part): part is string => Boolean(part && part.trim()));

  const locationAddress =
    locationParts.length > 0
      ? locationParts.join(", ")
      : "Nkira, Ntunga, Mwulire, Rwamagana";

  // Format real enrollment date
  const rawDate =
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (fullUser as any)?.createdAt ||
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (authUser as any)?.createdAt ||
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (fullUser as any)?.created_at ||
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (authUser as any)?.created_at ||
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (fullUser as any)?.joinedDate ||
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (fullUser as any)?.enrollmentDate;

  const getFormattedEnrollmentDate = (dateVal?: string | Date) => {
    if (!dateVal) return null;
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return null;

      const day = d.getDate();
      const month = d.toLocaleDateString("en-US", { month: "long" });
      const year = d.getFullYear();

      const getOrdinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      };

      return `Enrolled on ${getOrdinal(day)}, ${month}, ${year}`;
    } catch (e) {
      return null;
    }
  };

  const formattedDate = getFormattedEnrollmentDate(rawDate);

  const gender =
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (fullUser as any)?.gender || authUser?.gender || "Male";

  // Role display: TRAINEE/TESTER → CHW
  const rawRole = Array.isArray(authUser?.roles)
    ? authUser.roles[0]
    : authUser?.roles || "CHW";

  const roleLabel = formatRoleLabel(rawRole) || "CHW";

  const avatarUrl = fullUser?.photo || authUser?.photo;

  // Fallback initials
  const initials = fullNames
    ? fullNames
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "CHW";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
      {/* Primary Brand Top Banner */}
      <div className="bg-gradient-to-r from-[#285192] via-[#3363AD] to-[#4275C4] h-28 w-full relative rounded-t-2xl" />

      {/* Main Card Content */}
      <div className="px-5 pb-6 pt-0 flex flex-col items-center text-center -mt-14">
        {/* Profile Avatar */}
        <div className="relative mb-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullNames}
              className="w-24 h-24 rounded-full ring-4 ring-white shadow-md object-cover bg-gray-100"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-24 h-24 rounded-full ring-4 ring-white shadow-md bg-[#3363AD] text-white flex items-center justify-center font-extrabold text-2xl">
              {initials}
            </div>
          )}
        </div>

        {/* Status & Role Badges */}
        <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
          <span className="bg-[#FFF0EB] text-[#E06D53] border border-[#FCD8CF] font-extrabold text-[11px] px-3.5 py-0.5 rounded-full uppercase tracking-wider">
            {roleLabel}
          </span>
          <span className="bg-[#E8F8F8] text-[#2FA8A8] border border-[#C5EFEF] font-extrabold text-[11px] px-3.5 py-0.5 rounded-full capitalize">
            {gender}
          </span>
          <span className="bg-[#EBF0F9] text-[#3363AD] border border-[#3363AD]/20 font-extrabold text-[11px] px-3.5 py-0.5 rounded-full capitalize">
            Active
          </span>
        </div>

        {/* User Full Name */}
        <h2 className="text-base font-extrabold text-gray-900 uppercase tracking-tight max-w-[240px] leading-tight">
          {fullNames}
        </h2>

        {/* Enrolled Date */}
        <p className="text-xs font-medium text-gray-400 mt-1 mb-2">
          {formattedDate || "Active CHW Member"}
        </p>

        {/* Horizontal Divider Line */}
        <div className="w-full h-px bg-gray-100 my-4" />

        {/* Metadata Details */}
        <div className="w-full space-y-4 text-left">
          {/* Health Center */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center shrink-0">
              <Building2 size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-400">Health Center</p>
              <p className="text-xs font-extrabold text-gray-900 truncate">{healthCenter}</p>
            </div>
          </div>

          {/* Phone Number */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center shrink-0">
              <Phone size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-400">Phone Number</p>
              <p className="text-xs font-extrabold text-gray-900 truncate">{phone}</p>
            </div>
          </div>

          {/* Location Address */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center shrink-0">
              <MapPin size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-gray-400">Location Address</p>
              <p className="text-xs font-extrabold text-gray-900 truncate">{locationAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
