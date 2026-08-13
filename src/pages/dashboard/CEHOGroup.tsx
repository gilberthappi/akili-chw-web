import { useState, useCallback, useMemo, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  MapPin,
  UserPlus,
  Activity,
  TrendingUp,
  UserMinus,
  Pencil,
  Check,
  X,
  FileSpreadsheet,
  Award,
  MessageSquare,
  Bell,
  Send,
  Crown,
  Calendar,
  Megaphone,
  Plus,
} from "lucide-react";
import { getDistrictOptions, getSectorOptions, getCellOptions, getVillageOptions } from "@/hooks/locations";
import { Dialog, Transition } from "@headlessui/react";
import { debounce } from "lodash";
import toast from "react-hot-toast";
import {
  getMyGroup,
  getMyGroupMembers,
  getGroupMonitoring,
  cehoRemoveMyMember,
  cehoUpdateMyGroup,
  searchCHWCandidates,
  cehoDirectlyAddMember,
  exportGroupProgressExcel,
  cehoSendLearningNudge,
  postGroupAnnouncement,
} from "@/services/cehoGroup.service";
import { getOrCreateDirectChat } from "@/services/directChat.service";
import api from "@/services/api";
import { ICEHOGroupMember } from "@/types";
import { MetricCard } from "@/components/common/MetricCard";
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

type TabType = "members" | "learning" | "meetings";
type StatusFilterType = "ALL" | "TODAY" | "THIS_WEEK" | "INACTIVE";

const CEHOGroupPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<TabType>("members");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");
  const [selectedCertFilter, setSelectedCertFilter] = useState<"all" | "has_cert" | "no_cert">("all");

  // Nudge individual modal
  const [nudgeModalTarget, setNudgeModalTarget] = useState<{
    studentId: string;
    fullName: string;
    progress?: number;
  } | null>(null);
  const [nudgeMessage, setNudgeMessage] = useState("");
  const [isSendingNudge, setIsSendingNudge] = useState(false);

  // Group Announcement modal state
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);

  // Quick Schedule Meeting modal state
  const [showScheduleMeetingModal, setShowScheduleMeetingModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingDescription, setMeetingDescription] = useState("");
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);

  const [pendingRemove, setPendingRemove] = useState<ICEHOGroupMember | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  type LocationRow = { sector: string; cell: string; village: string };
  const [editLocations, setEditLocations] = useState<LocationRow[]>([{ sector: "", cell: "", village: "" }]);

  const updateLocation = (idx: number, field: keyof LocationRow, value: string) =>
    setEditLocations((prev) =>
      prev.map((loc, i) => {
        if (i !== idx) return loc;
        if (field === "sector") return { ...loc, sector: value, cell: "", village: "" };
        if (field === "cell") return { ...loc, cell: value, village: "" };
        return { ...loc, [field]: value };
      }),
    );
  const addLocation = () => setEditLocations((prev) => [...prev, { sector: "", cell: "", village: "" }]);
  const removeLocation = (idx: number) => setEditLocations((prev) => prev.filter((_, i) => i !== idx));

  // Add CHW modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearchTerm, setAddSearchTerm] = useState("");
  const [addDebouncedSearch, setAddDebouncedSearch] = useState("");
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const debouncedSetAddSearch = useCallback(
    debounce((val: string) => setAddDebouncedSearch(val), 400),
    [],
  );

  const handleAddSearchChange = (val: string) => {
    setAddSearchTerm(val);
    debouncedSetAddSearch(val);
  };

  const openAddModal = () => {
    setAddSearchTerm("");
    setAddDebouncedSearch("");
    setShowAddModal(true);
  };

  // Queries
  const { data: group, isLoading, isError } = useQuery({
    queryKey: ["ceho-group-mine"],
    queryFn: getMyGroup,
    retry: false,
  });

  const { data: members = [], isLoading: membersLoading, refetch, isRefetching } = useQuery({
    queryKey: ["ceho-group-members"],
    queryFn: getMyGroupMembers,
  });

  const { data: monitoring } = useQuery({
    queryKey: ["ceho-group-monitoring"],
    queryFn: getGroupMonitoring,
    retry: false,
  });

  // Meetings Query for Tab 3 (Meetings)
  const { data: meetingsData, isLoading: meetingsLoading, refetch: refetchMeetings } = useQuery({
    queryKey: ["ceho-group-meetings"],
    queryFn: async () => {
      const res = await api.get("/attendance/meetings");
      return res.data?.data as { meetings: any[]; stats: any };
    },
    enabled: activeTab === "meetings",
  });

  const { mutate: removeMember, isPending: isRemoving } = useMutation({
    mutationFn: (studentId: string) => cehoRemoveMyMember(studentId),
    onSuccess: () => {
      setPendingRemove(null);
      queryClient.invalidateQueries({ queryKey: ["ceho-group-members"] });
      queryClient.invalidateQueries({ queryKey: ["ceho-chw-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["ceho-group-monitoring"] });
      toast.success("Member removed from your group.");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message ?? "Failed to remove member.";
      toast.error(msg);
    },
  });

  const { mutate: updateGroup, isPending: isUpdating } = useMutation({
    mutationFn: () => {
      const filled = editLocations.filter((l) => l.sector);
      return cehoUpdateMyGroup({
        name: editName || undefined,
        district: editDistrict || undefined,
        sectors: filled.map((l) => l.sector),
        cells: filled.map((l) => l.cell),
        villages: filled.map((l) => l.village),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ceho-group-mine"] });
      toast.success("Group updated.");
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Failed to update group.");
    },
  });

  const { data: chwCandidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ["ceho-chw-candidates", addDebouncedSearch],
    queryFn: () => searchCHWCandidates(addDebouncedSearch || undefined),
    enabled: showAddModal,
  });

  const { mutate: addMember, isPending: isAdding } = useMutation({
    mutationFn: (studentId: string) => cehoDirectlyAddMember(studentId),
    onSuccess: (_, studentId) => {
      setAddedIds((prev) => new Set([...prev, studentId]));
      queryClient.invalidateQueries({ queryKey: ["ceho-group-members"] });
      queryClient.invalidateQueries({ queryKey: ["ceho-chw-candidates"] });
      queryClient.invalidateQueries({ queryKey: ["ceho-group-mine"] });
      toast.success("CHW added to your group successfully.");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "Failed to add CHW.");
    },
  });

  const openEdit = () => {
    setEditName(group?.name ?? "");
    setEditDistrict(group?.district ?? "");
    const sectors = group?.sectors ?? [];
    const cells = group?.cells ?? [];
    const villages = group?.villages ?? [];
    setEditLocations(
      sectors.length > 0
        ? sectors.map((s, i) => ({ sector: s, cell: cells[i] ?? "", village: villages[i] ?? "" }))
        : [{ sector: "", cell: "", village: "" }],
    );
    setIsEditing(true);
  };

  const monitoringMembers = monitoring?.members ?? [];
  const ceho = group?.ceho;
  const memberCount = (group?._count?.members ?? 0) + 1;

  // Top 3 CHW Performers sorting (excluding diagnostic pre-tests from average score tie-breaker)
  const topPerformers = useMemo(() => {
    if (!monitoringMembers || monitoringMembers.length === 0) return [];
    const sorted = [...monitoringMembers].sort((a: any, b: any) => {
      const aCerts = a.certificates?.length || 0;
      const bCerts = b.certificates?.length || 0;
      if (bCerts !== aCerts) return bCerts - aCerts;

      const aAttempts = (a.recentTestAttempts || []).filter((x: any) => x.preTestId == null);
      const bAttempts = (b.recentTestAttempts || []).filter((x: any) => x.preTestId == null);
      const aAvg = aAttempts.length > 0 ? aAttempts.reduce((s: number, x: any) => s + (x.marks || 0), 0) / aAttempts.length : 0;
      const bAvg = bAttempts.length > 0 ? bAttempts.reduce((s: number, x: any) => s + (x.marks || 0), 0) / bAttempts.length : 0;
      if (bAvg !== aAvg) return bAvg - aAvg;

      const aProg = a.courseProgress?.length ? a.courseProgress.reduce((s: number, x: any) => s + (x.progress || 0), 0) / a.courseProgress.length : 0;
      const bProg = b.courseProgress?.length ? b.courseProgress.reduce((s: number, x: any) => s + (x.progress || 0), 0) / b.courseProgress.length : 0;
      return bProg - aProg;
    });
    return sorted.slice(0, 3);
  }, [monitoringMembers]);

  // Activity Status Counts for Filter Pills
  const statusCounts = useMemo(() => {
    let today = 0;
    let thisWeek = 0;
    let inactive = 0;

    monitoringMembers.forEach((m: any) => {
      if (m.activityStatus === "TODAY") today += 1;
      else if (m.activityStatus === "THIS_WEEK") thisWeek += 1;
      else inactive += 1;
    });

    return {
      all: members.length,
      today,
      thisWeek,
      inactive,
    };
  }, [monitoringMembers, members]);

  const certCounts = useMemo(() => {
    let hasCertCount = 0;
    let noCertCount = 0;

    monitoringMembers.forEach((m: any) => {
      let hasCert = false;
      if (selectedCourseFilter !== "all") {
        hasCert = (m.certificates || []).some((c: any) => c.courseId === selectedCourseFilter);
      } else {
        hasCert = (m.certificates?.length || 0) > 0;
      }

      if (hasCert) {
        hasCertCount += 1;
      } else {
        noCertCount += 1;
      }
    });

    return {
      all: monitoringMembers.length,
      hasCert: hasCertCount,
      noCert: noCertCount,
    };
  }, [monitoringMembers, selectedCourseFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3363AD]" />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-center">
        <Users className="w-12 h-12 text-gray-300" />
        <p className="text-gray-600 font-semibold">No group assigned yet</p>
        <p className="text-gray-400 text-sm max-w-xs">
          You don't have a CEHO group yet. Contact an administrator to set one up.
        </p>
      </div>
    );
  }

  const avgProgress =
    monitoringMembers.length > 0
      ? Math.round(
          monitoringMembers.reduce((s, m) => {
            const a = m.courseProgress.length
              ? m.courseProgress.reduce((x, c) => x + c.progress, 0) / m.courseProgress.length
              : 0;
            return s + a;
          }, 0) / monitoringMembers.length,
        )
      : 0;

  const activeCount = monitoringMembers.filter((m) =>
    m.courseProgress.some((c) => c.progress > 0 && !c.isCompleted),
  ).length;

  const allCourses = Array.from(
    new Map(
      monitoringMembers
        .flatMap((m) => m.courseProgress || [])
        .map((c) => [c.courseId, { id: c.courseId, title: c.courseTitle }]),
    ).values(),
  );

  // Filter CHW regular members list for Bose tab (EXCLUDING CEHO to prevent duplicate leader card display!)
  const filteredCHWs = members.filter((m: ICEHOGroupMember) => {
    // 1. Prevent CEHO duplication: Exclude CEHO from regular CHW members list
    if (ceho && (m.student.user.id === ceho.user.id || m.student.id === ceho.id)) {
      return false;
    }

    // 2. Name search
    const nameMatch = m.student.user.fullNames.toLowerCase().includes(search.toLowerCase());
    if (!nameMatch) return false;

    // 3. Status filter (Active, Moderately Active, Inactive)
    const mon = monitoringMembers.find(
      (x: any) => x.studentId === m.student.id || x.user?.id === m.student.user.id,
    );

    const actStatus = mon?.activityStatus || "INACTIVE";
    if (statusFilter !== "ALL" && actStatus !== statusFilter) return false;

    return true;
  });

  const cehoMon = monitoringMembers.find(
    (x: any) => x.studentId === ceho?.id || x.user?.id === ceho?.user?.id,
  );
  const cehoActStatus = cehoMon?.activityStatus || "TODAY";

  const cehoMatchesSearch =
    !!ceho &&
    (!search || ceho.user.fullNames.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "ALL" || cehoActStatus === statusFilter);

  const isCHWListEmpty = filteredCHWs.length === 0 && !cehoMatchesSearch;

  // Event Handlers
  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      toast.loading("Preparing Excel export...", { id: "excel-export" });
      const blob = await exportGroupProgressExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const groupName = group?.name ? group.name.replace(/[^a-zA-Z0-9_\-]/g, "_") : "Group";
      a.download = `Group_${groupName}_Progress.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel progress report downloaded!", { id: "excel-export" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to export Excel report", { id: "excel-export" });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleStartChat = async (targetUserId: string) => {
    try {
      toast.loading("Opening direct chat...", { id: "chat-toast" });
      const chat = await getOrCreateDirectChat(targetUserId);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.dismiss("chat-toast");
      navigate(`/messaging?chatId=${chat.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to open direct chat", { id: "chat-toast" });
    }
  };

  const handleSendIndividualNudge = async () => {
    if (!nudgeModalTarget) return;
    try {
      setIsSendingNudge(true);
      toast.loading("Sending learning nudge notification...", { id: "send-nudge" });
      await cehoSendLearningNudge([nudgeModalTarget.studentId], nudgeMessage || undefined);
      toast.success(`Learning nudge sent to ${nudgeModalTarget.fullName}!`, { id: "send-nudge" });
      setNudgeModalTarget(null);
      setNudgeMessage("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send learning nudge", { id: "send-nudge" });
    } finally {
      setIsSendingNudge(false);
    }
  };

  const handleNudgeAll = async () => {
    try {
      toast.loading("Sending learning nudges to all members...", { id: "nudge-all" });
      await cehoSendLearningNudge([]);
      toast.success("Learning nudges sent to all members!", { id: "nudge-all" });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send nudges", { id: "nudge-all" });
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcementText.trim()) return;
    try {
      setIsPostingAnnouncement(true);
      toast.loading("Posting announcement to group chat...", { id: "post-announcement" });
      await postGroupAnnouncement(announcementText.trim());
      toast.success("Announcement posted to group chat successfully!", { id: "post-announcement" });
      setAnnouncementText("");
      setShowAnnouncementModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to post announcement", { id: "post-announcement" });
    } finally {
      setIsPostingAnnouncement(false);
    }
  };

  const handleScheduleGroupMeeting = async () => {
    if (!meetingTitle.trim() || !meetingDate || !meetingTime) {
      toast.error("Please enter title, date, and start time.");
      return;
    }
    try {
      setIsCreatingMeeting(true);
      toast.loading("Scheduling group meeting and adding to Calendar...", { id: "create-meeting" });
      const startIso = new Date(`${meetingDate}T${meetingTime}`).toISOString();
      const endIso = new Date(new Date(startIso).getTime() + 60 * 60 * 1000).toISOString();

      await api.post("/calendar/events", {
        title: meetingTitle.trim(),
        description: meetingDescription.trim() || undefined,
        type: "TRAINING",
        startAt: startIso,
        endAt: endIso,
        meetingType: "EBUMENYI_MEETING",
        participants: members.map((m: ICEHOGroupMember) => ({ userId: m.student.user.id })),
      });

      toast.success(
        (t) => (
          <span className="flex items-center gap-2">
            New meeting scheduled and added to Calendar!
            <button onClick={() => { navigate("/calendar"); toast.dismiss(t.id); }} className="text-xs bg-white text-[#3363AD] px-2 py-1 rounded hover:bg-gray-50 font-medium">Go to Calendar</button>
          </span>
        ),
        { id: "create-meeting" }
      );
      queryClient.invalidateQueries({ queryKey: ["ceho-group-meetings"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      refetchMeetings();
      setMeetingTitle("");
      setMeetingDate("");
      setMeetingTime("");
      setMeetingDescription("");
      setShowScheduleMeetingModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to schedule meeting", { id: "create-meeting" });
    } finally {
      setIsCreatingMeeting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold text-[#333333]">{group.name}</h2>
            <button
              onClick={openEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#3363AD] hover:bg-[#EBF0F9] transition-colors"
              title="Edit group"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          {(group.district || (group.sectors && group.sectors.length > 0)) && (
            <div className="flex items-center gap-1.5 text-gray-500 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {[group.district, ...(group.sectors ?? [])].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { refetch(); if (activeTab === "meetings") refetchMeetings(); }}
            disabled={isRefetching}
          >
            {isRefetching ? "Refreshing…" : "Refresh"}
          </Button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            {isExportingExcel ? "Exporting…" : "Export Excel"}
          </button>
          <Button size="sm" onClick={openAddModal}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add CHW
          </Button>
        </div>
      </div>

      {/* Inline edit form */}
      {isEditing && (
        <div className="bg-white rounded-xl border border-[#3363AD]/20 shadow-sm p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Edit Group</p>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500">Group Name *</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500">District</label>
            <select
              value={editDistrict}
              onChange={(e) => {
                setEditDistrict(e.target.value);
                setEditLocations([{ sector: "", cell: "", village: "" }]);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD] bg-white"
            >
              <option value="">Select District</option>
              {getDistrictOptions().map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {editLocations.map((loc, idx) => (
              <div key={idx} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  {idx === 0 && <label className="text-xs font-semibold text-gray-500">Sector</label>}
                  <select
                    value={loc.sector}
                    onChange={(e) => updateLocation(idx, "sector", e.target.value)}
                    disabled={!editDistrict}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD] bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Sector</option>
                    {getSectorOptions(editDistrict).map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  {idx === 0 && <label className="text-xs font-semibold text-gray-500">Cell</label>}
                  <select
                    value={loc.cell}
                    onChange={(e) => updateLocation(idx, "cell", e.target.value)}
                    disabled={!loc.sector}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD] bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Cell</option>
                    {loc.sector && getCellOptions(loc.sector).map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  {idx === 0 && <label className="text-xs font-semibold text-gray-500">Village</label>}
                  <select
                    value={loc.village}
                    onChange={(e) => updateLocation(idx, "village", e.target.value)}
                    disabled={!loc.cell}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD] bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Village</option>
                    {loc.cell && getVillageOptions(loc.cell).map((v) => (
                      <option key={v.id} value={v.id}>{v.label}</option>
                    ))}
                  </select>
                </div>
                {editLocations.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLocation(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    title="Remove this sector"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addLocation}
              disabled={!editDistrict}
              className="flex items-center gap-1 text-sm font-medium text-[#3363AD] hover:text-[#2252a0] disabled:text-gray-300 disabled:cursor-not-allowed transition-colors mt-1"
            >
              <span className="text-base leading-none">+</span> Add Sector
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isUpdating}
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <Button
              size="sm"
              onClick={() => updateGroup()}
              isLoading={isUpdating}
              disabled={!editName.trim() || isUpdating}
            >
              {!isUpdating && <Check className="w-3.5 h-3.5 mr-1" />}
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Segmented Top Navigation Tab Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "members"
              ? "bg-[#3363AD] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Users className="w-4 h-4" />
          All Members ({memberCount})
        </button>

        <button
          onClick={() => setActiveTab("learning")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "learning"
              ? "bg-[#3363AD] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Learning & Progress
        </button>

        <button
          onClick={() => setActiveTab("meetings")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "meetings"
              ? "bg-[#3363AD] text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Meetings
        </button>
      </div>

      {/* ── TAB 1: ALL MEMBERS ── */}
      {activeTab === "members" && (
        <div className="space-y-6">
          {/* Single Row: Search Input Box + Status Filter Button Pills Side-by-Side */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 focus:border-[#3363AD] bg-white shadow-sm"
              />
            </div>

            {/* Horizontal Status Filter Button Pills Beside Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  statusFilter === "ALL"
                    ? "bg-[#3363AD] text-white border-[#3363AD]"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                All ({statusCounts.all})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("TODAY")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  statusFilter === "TODAY"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active ({statusCounts.today})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("THIS_WEEK")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  statusFilter === "THIS_WEEK"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Moderately Active ({statusCounts.thisWeek})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("INACTIVE")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  statusFilter === "INACTIVE"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-red-600 border-red-200 hover:bg-red-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Inactive ({statusCounts.inactive})
              </button>
            </div>
          </div>

          {/* Members Grid */}
          {membersLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-xl" />
              ))}
            </div>
          ) : isCHWListEmpty ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Users className="w-12 h-12 text-gray-300" />
              <p className="text-gray-500 font-medium">
                {search ? "No members match your search" : "No members yet"}
              </p>
              {!search && (
                <Button size="sm" onClick={openAddModal}>Add your first CHW</Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Dedicated CEHO leader card (Displayed ONLY once) */}
              {cehoMatchesSearch && ceho && (
                <div
                  onClick={() => navigate(`/students/${ceho.id}`)}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-[#3363AD] flex flex-col justify-between min-h-[110px]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <MemberAvatar name={ceho.user.fullNames} photo={ceho.user.photo} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-bold text-gray-900 text-base truncate leading-tight">{ceho.user.fullNames}</p>
                        <span className="inline-flex items-center text-xs font-bold text-purple-700 bg-purple-100 rounded-full px-2.5 py-0.5">
                          Leader (CEHO)
                        </span>
                        {(ceho.user.district || ceho.user.sector) && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 pt-0.5">
                            <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
                            <span className="truncate">{[ceho.user.district, ceho.user.sector].filter(Boolean).join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Top Right Activity Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                        cehoActStatus === "TODAY"
                          ? "bg-emerald-100 text-emerald-700"
                          : cehoActStatus === "THIS_WEEK"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cehoActStatus === "TODAY"
                            ? "bg-emerald-500 animate-pulse"
                            : cehoActStatus === "THIS_WEEK"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                      />
                      {cehoActStatus === "TODAY"
                        ? "Active"
                        : cehoActStatus === "THIS_WEEK"
                        ? "Moderately Active"
                        : "Inactive (7d+)"}
                    </span>
                  </div>
                </div>
              )}

              {/* CHW Member Cards (Filtered to EXCLUDE CEHO so leader is never duplicated!) */}
              {filteredCHWs.map((member: ICEHOGroupMember) => {
                const u = member.student.user;
                const mon = monitoringMembers.find(
                  (m: any) => m.studentId === member.student.id || m.user?.id === u.id,
                );
                const actStatus = mon?.activityStatus || "INACTIVE";

                let actBg = "bg-red-100 text-red-700";
                let actDot = "bg-red-500";
                let actLabel = "Inactive (7d+)";
                if (actStatus === "TODAY") {
                  actBg = "bg-emerald-100 text-emerald-700";
                  actDot = "bg-emerald-500 animate-pulse";
                  actLabel = "Active";
                } else if (actStatus === "THIS_WEEK") {
                  actBg = "bg-amber-100 text-amber-800";
                  actDot = "bg-amber-500";
                  actLabel = "Moderately Active";
                }

                return (
                  <div
                    key={member.id}
                    onClick={() => navigate(`/students/${member.student.id}`)}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between min-h-[110px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <MemberAvatar name={u.fullNames} photo={u.photo} />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-bold text-gray-900 text-base truncate leading-tight">{u.fullNames}</p>
                          <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-0.5">
                            CHW
                          </span>
                          {(u.district || u.sector) && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 pt-0.5">
                              <MapPin className="w-3 h-3 shrink-0 text-gray-400" />
                              <span className="truncate">{[u.district, u.sector].filter(Boolean).join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Top Right Activity Status Badge */}
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${actBg}`}>
                        <span className={`w-2 h-2 rounded-full ${actDot}`} />
                        {actLabel}
                      </span>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-end gap-1.5 border-t border-gray-100 pt-2.5 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChat(u.id);
                        }}
                        className="p-2 rounded-xl text-[#3363AD] bg-[#EBF0F9] hover:bg-[#3363AD] hover:text-white transition-colors"
                        title="Direct Chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingRemove(member);
                        }}
                        className="p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-colors"
                        title="Remove Member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: LEARNING & PROGRESS ── */}
      {activeTab === "learning" && (
        <div className="space-y-6">
          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Total Members"
              value={memberCount}
              icon={<Users size={18} />}
              iconBg="bg-[#EBF0F9]"
              iconColor="text-[#3363AD]"
            />
            <MetricCard
              title="Avg Progress"
              value={`${avgProgress}%`}
              icon={<TrendingUp size={18} />}
              iconBg="bg-purple-50"
              iconColor="text-purple-600"
            />
            <MetricCard
              title="Actively Learning"
              value={activeCount}
              icon={<Activity size={18} />}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
          </div>

          {/* CEHO Quick Action Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleNudgeAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-sm"
            >
              <Bell className="w-4 h-4" />
              Nudge All Members
            </button>

            <button
              type="button"
              onClick={() => setShowAnnouncementModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#3363AD] hover:bg-[#264d88] transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
              Post Announcement
            </button>
          </div>

          {/* Top 3 Performers Leaderboard (Redesigned with Premium Cards) */}
          {topPerformers.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className="font-bold text-lg text-gray-900">Top 3 Performers</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {topPerformers.map((tp: any, idx: number) => {
                  const rankBadges = ["🥇 1st", "🥈 2nd", "🥉 3rd"];
                  const rankCardStyles = [
                    "bg-gradient-to-br from-amber-50/80 to-amber-100/30 border-amber-200/90",
                    "bg-gradient-to-br from-slate-50/90 to-slate-100/40 border-slate-200/90",
                    "bg-gradient-to-br from-orange-50/80 to-orange-100/30 border-orange-200/90",
                  ];
                  const rankBadgeStyles = [
                    "text-amber-800 bg-amber-200/80 border-amber-300",
                    "text-slate-700 bg-slate-200/80 border-slate-300",
                    "text-orange-800 bg-orange-200/80 border-orange-300",
                  ];

                  const gradedAttempts = (tp.recentTestAttempts || []).filter((x: any) => x.preTestId == null);
                  const avgScore = gradedAttempts.length > 0
                    ? Math.round(gradedAttempts.reduce((s: number, a: any) => s + (a.marks || 0), 0) / gradedAttempts.length)
                    : 0;

                  return (
                    <div
                      key={tp.studentId}
                      onClick={() => navigate(`/students/${tp.studentId}`)}
                      className={`p-4 rounded-xl border ${rankCardStyles[idx] || "bg-gray-50 border-gray-100"} shadow-sm hover:shadow-md transition-shadow cursor-pointer flex items-center gap-3`}
                    >
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border shrink-0 ${rankBadgeStyles[idx]}`}>
                        {rankBadges[idx]}
                      </span>
                      <MemberAvatar name={tp.user?.fullNames} photo={tp.user?.photo} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{tp.user?.fullNames}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Award className="w-3 h-3 text-amber-600" />
                          {tp.certificates?.length || 0} Certificates
                        </p>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-bold text-[#3363AD] bg-[#EBF0F9] border border-[#3363AD]/20 rounded-lg shrink-0">
                        {avgScore}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Academic Filters Row (Course & Certificate Dropdowns Side-by-Side) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* 1. Course Dropdown */}
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 shadow-sm min-w-[200px]"
            >
              <option value="all">All Courses</option>
              {allCourses.map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>

            {/* 2. Certificate Dropdown (Matches Mobile Dropdown Structure) */}
            <select
              value={selectedCertFilter}
              onChange={(e) => setSelectedCertFilter(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 shadow-sm min-w-[200px]"
            >
              <option value="all">All Certificates ({certCounts.all})</option>
              <option value="has_cert">🏆 Has Certificate ({certCounts.hasCert})</option>
              <option value="no_cert">⏳ No Certificate ({certCounts.noCert})</option>
            </select>
          </div>

          {/* Member Progress Cards Grid (Matching Bose tab 3-column grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {monitoringMembers
              .filter((m: any) => {
                if (selectedCertFilter === "has_cert") {
                  if (selectedCourseFilter !== "all") {
                    return (m.certificates || []).some((c: any) => c.courseId === selectedCourseFilter);
                  }
                  return (m.certificates?.length || 0) > 0;
                }
                if (selectedCertFilter === "no_cert") {
                  if (selectedCourseFilter !== "all") {
                    return !(m.certificates || []).some((c: any) => c.courseId === selectedCourseFilter);
                  }
                  return (m.certificates?.length || 0) === 0;
                }
                if (selectedCourseFilter !== "all") {
                  return (m.courseProgress || []).some((c: any) => c.courseId === selectedCourseFilter);
                }
                return true;
              })
              .map((m: any) => {
                const totalC = m.courseProgress.length;
                const completedC = m.courseProgress.filter((cp: any) => cp.isCompleted).length;
                const avgP = totalC > 0 ? Math.round(m.courseProgress.reduce((sum: number, c: any) => sum + (c.progress || 0), 0) / totalC) : 0;
                const gradedAttempts = (m.recentTestAttempts || []).filter((a: any) => a.preTestId == null);
                const passing = gradedAttempts.filter((a: any) => a.marks >= 70).length;

                return (
                  <div
                    key={m.studentId}
                    onClick={() => navigate(`/students/${m.studentId}`)}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <MemberAvatar name={m.user.fullNames} photo={m.user.photo} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{m.user.fullNames}</p>
                          <p className="text-xs text-gray-500">{completedC}/{totalC} courses completed</p>
                        </div>
                        <span className="text-sm font-bold text-[#3363AD] shrink-0">{avgP}%</span>
                      </div>

                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#3363AD] h-full rounded-full transition-all duration-500" style={{ width: `${avgP}%` }} />
                      </div>
                    </div>

                    {gradedAttempts.length > 0 && (
                      <div className="border-t border-gray-50 pt-2 flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">Tests Passed</span>
                        <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          🏆 {passing}/{gradedAttempts.length} passed
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── TAB 3: MEETINGS ── */}
      {activeTab === "meetings" && (
        <div className="space-y-6">
          {/* Header & Quick Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Group Meetings & Schedule</h3>
              <p className="text-sm text-gray-500">Schedule virtual meetings and view team attendance</p>
            </div>
            <Button size="sm" onClick={() => navigate("/calender")}>
              <Plus className="w-4 h-4 mr-1.5" />
              Schedule New Meeting
            </Button>
          </div>

          {/* Meeting Attendance Stat Cards */}
          {meetingsData?.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 font-semibold uppercase">Total Meetings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{meetingsData.stats.total ?? 0}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-sky-600 font-semibold uppercase">Upcoming</p>
                <p className="text-2xl font-bold text-sky-700 mt-1">{meetingsData.stats.upcoming ?? 0}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-emerald-600 font-semibold uppercase">Completed</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">{meetingsData.stats.completed ?? 0}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-purple-600 font-semibold uppercase">Attendance Rate (%)</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">
                  {meetingsData.stats.overallAttendancePct !== null ? `${meetingsData.stats.overallAttendancePct}%` : "—"}
                </p>
              </div>
            </div>
          )}

          {/* Meetings List Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {meetingsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3363AD]" />
              </div>
            ) : !meetingsData?.meetings || meetingsData.meetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 gap-2">
                <Calendar className="w-10 h-10 text-gray-300" />
                <p className="font-semibold text-gray-600">No meetings scheduled</p>
                <p className="text-xs text-gray-400">Click 'Schedule New Meeting' to invite your group members.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
                    <tr>
                      <th className="px-5 py-3">Meeting Title</th>
                      <th className="px-5 py-3">Host</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Participants</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {meetingsData.meetings.map((m: any) => (
                      <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-5 py-4 font-semibold text-gray-900">{m.title}</td>
                        <td className="px-5 py-4 text-gray-600">{m.host?.fullNames || "—"}</td>
                        <td className="px-5 py-4 text-gray-600">{new Date(m.startAt).toLocaleDateString("en-RW")}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            m.status === "UPCOMING" ? "bg-blue-50 text-blue-700" :
                            m.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => navigate(`/attendance/${m.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#EBF0F9] text-[#3363AD] hover:bg-[#3363AD] hover:text-white rounded-lg font-bold text-xs transition-colors"
                          >
                            <Users className="w-3.5 h-3.5" />
                            {m.participantCount} Members
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: Post Group Announcement ── */}
      <Transition appear show={showAnnouncementModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowAnnouncementModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Megaphone className="w-5 h-5 text-[#3363AD]" />
                      Send Group Announcement
                    </Dialog.Title>
                    <button onClick={() => setShowAnnouncementModal(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600">Announcement Message</label>
                    <textarea
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      placeholder="Type announcement message for all members..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 min-h-[100px]"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowAnnouncementModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
                      Cancel
                    </button>
                    <Button size="sm" onClick={handlePostAnnouncement} isLoading={isPostingAnnouncement} disabled={!announcementText.trim() || isPostingAnnouncement}>
                      <Send className="w-4 h-4 mr-1.5" />
                      Post Announcement
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* ── MODAL: Schedule Group Meeting ── */}
      <Transition appear show={showScheduleMeetingModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowScheduleMeetingModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#3363AD]" />
                      Schedule New Group Meeting
                    </Dialog.Title>
                    <button onClick={() => setShowScheduleMeetingModal(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600">Meeting Title *</label>
                      <input
                        type="text"
                        value={meetingTitle}
                        onChange={(e) => setMeetingTitle(e.target.value)}
                        placeholder="e.g. MCH Weekly Review Meeting"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Date *</label>
                        <input
                          type="date"
                          value={meetingDate}
                          onChange={(e) => setMeetingDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600">Start Time *</label>
                        <input
                          type="time"
                          value={meetingTime}
                          onChange={(e) => setMeetingTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-600">Description</label>
                      <textarea
                        value={meetingDescription}
                        onChange={(e) => setMeetingDescription(e.target.value)}
                        placeholder="Meeting agenda and details..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30 mt-1 min-h-[70px]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowScheduleMeetingModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
                      Cancel
                    </button>
                    <Button size="sm" onClick={handleScheduleGroupMeeting} isLoading={isCreatingMeeting} disabled={!meetingTitle.trim() || !meetingDate || !meetingTime || isCreatingMeeting}>
                      <Plus className="w-4 h-4 mr-1.5" />
                      Schedule Meeting
                    </Button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Individual Learning Nudge Modal */}
      <Transition appear show={!!nudgeModalTarget} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setNudgeModalTarget(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-amber-500" />
                      Send Learning Nudge ({nudgeModalTarget?.fullName})
                    </Dialog.Title>
                    <button onClick={() => setNudgeModalTarget(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600">Nudge Message</label>
                    <textarea
                      value={nudgeMessage}
                      onChange={(e) => setNudgeMessage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[90px]"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button onClick={() => setNudgeModalTarget(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
                      Cancel
                    </button>
                    <button onClick={handleSendIndividualNudge} disabled={isSendingNudge} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors">
                      <Bell className="w-4 h-4" />
                      Send Nudge
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Remove Member Confirmation Modal */}
      <Transition appear show={!!pendingRemove} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setPendingRemove(null)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-lg font-bold text-gray-900 text-red-600 flex items-center gap-2">
                      <UserMinus className="w-5 h-5" />
                      Remove from Group
                    </Dialog.Title>
                    <button onClick={() => setPendingRemove(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-600">
                    Are you sure you want to remove <strong>{pendingRemove?.student.user.fullNames}</strong> from your group?
                  </p>

                  <div className="flex justify-end gap-2">
                    <button onClick={() => setPendingRemove(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
                      Cancel
                    </button>
                    <button onClick={() => pendingRemove && removeMember(pendingRemove.student.id)} disabled={isRemoving} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors">
                      Remove Member
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Add CHW Modal */}
      <Transition appear show={showAddModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setShowAddModal(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all space-y-4">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-[#3363AD]" />
                      Add Community Health Worker (CHW)
                    </Dialog.Title>
                    <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search CHW by name or phone number…"
                      value={addSearchTerm}
                      onChange={(e) => handleAddSearchChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3363AD]/30"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {candidatesLoading ? (
                      <p className="text-center py-6 text-sm text-gray-400">Searching…</p>
                    ) : chwCandidates.length === 0 ? (
                      <p className="text-center py-6 text-sm text-gray-400">No candidates found</p>
                    ) : (
                      chwCandidates.map((c: any) => {
                        const isAlreadyAdded = addedIds.has(c.id);
                        return (
                          <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <MemberAvatar name={c.user.fullNames} photo={c.user.photo} />
                              <div>
                                <p className="font-semibold text-sm text-gray-900">{c.user.fullNames}</p>
                                <p className="text-xs text-gray-500">{c.user.phoneNumber || "No phone"}</p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              disabled={isAlreadyAdded || isAdding}
                              onClick={() => addMember(c.id)}
                            >
                              {isAlreadyAdded ? "Added" : "Add CHW"}
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default CEHOGroupPage;
