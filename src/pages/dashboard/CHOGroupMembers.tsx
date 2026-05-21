import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Users, Search, MapPin, Phone, UserPlus, ChevronLeft, CalendarDays } from "lucide-react";
import { getMyGroupMembers } from "@/services/choGroup.service";
import { ICHOGroupMember } from "@/types";
import { Button } from "@/components/common/Button";

const MemberAvatar = ({ name, photo }: { name: string; photo: string | null }) => {
  const [failed, setFailed] = useState(false);
  const initials = name?.substring(0, 2).toUpperCase() ?? "??";
  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={name}
        className="w-10 h-10 rounded-full object-cover shrink-0"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-[#EBF0F9] text-[#3363AD] flex items-center justify-center text-sm font-bold shrink-0">
      {initials}
    </div>
  );
};

const CHOGroupMembersPage = () => {
  const [search, setSearch] = useState("");

  const { data: members = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["cho-group-members"],
    queryFn: getMyGroupMembers,
  });

  const filtered = members.filter((m: ICHOGroupMember) =>
    m.student.user.fullNames.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/cho-group"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-[#333333]">Group Members</h2>
            <p className="text-sm text-gray-500">
              {isLoading
                ? "Loading…"
                : `${members.length} CHW${members.length !== 1 ? "s" : ""} in your group`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? "Refreshing…" : "Refresh"}
          </Button>
          <Link to="/cho-group/invite">
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite CHW
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search members by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD]"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <Users className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500 font-medium">
            {search ? "No members match your search" : "No members yet"}
          </p>
          {!search && (
            <Link to="/cho-group/invite">
              <Button size="sm">Invite your first CHW</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member: ICHOGroupMember) => {
            const u = member.student.user;
            return (
              <div
                key={member.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <MemberAvatar name={u.fullNames} photo={u.photo} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{u.fullNames}</p>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                      Active
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-gray-50 pt-3">
                  {u.phoneNumber && (
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <Phone className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      <span>{u.phoneNumber}</span>
                    </div>
                  )}
                  {(u.district || u.sector) && (
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      <span className="truncate">
                        {[u.district, u.sector].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    <span>
                      Joined{" "}
                      {new Date(member.joinedAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CHOGroupMembersPage;
