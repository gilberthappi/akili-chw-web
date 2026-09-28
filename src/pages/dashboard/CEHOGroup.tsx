import { useState, useCallback, useMemo, Fragment, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  LayoutGrid,
  List,
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
import { Button } from "@/components/common/Button";
import { uniqueCourseCertificateCount } from "@/utils/certificates";
import {
  V2_BTN_PRIMARY,
  V2_BTN_SECONDARY,
  V2_CARD_SHELL,
  V2_CARD_SHELL_PADDED,
  V2_EMPTY,
  V2_INPUT,
  V2_KPI_ICON_CHIP,
  V2_MUTED,
  V2_PAGE_CANVAS,
  V2_PAGE_SUBTITLE,
  V2_PAGE_TITLE,
  V2_SECTION_TITLE,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

const bone = "rounded bg-[#D7E3F0] dark:bg-slate-700";

const CehoGroupSkeleton = () => (
  <div className={`${V2_PAGE_CANVAS} animate-pulse`}>
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="space-y-2">
        <div className={`${bone} h-6 w-48`} />
        <div className={`${bone} h-3 w-64`} />
      </div>
      <div className="flex gap-2">
        <div className={`${bone} h-9 w-24 rounded-xl`} />
        <div className={`${bone} h-9 w-28 rounded-xl`} />
        <div className={`${bone} h-9 w-28 rounded-xl`} />
      </div>
    </div>
    <div className="flex gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`${bone} h-10 w-36 rounded-xl`} />
      ))}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className={`${V2_CARD_SHELL} p-4 min-h-[110px] space-y-3`}>
          <div className="flex gap-3">
            <div className={`${bone} w-10 h-10 rounded-full shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className={`${bone} h-3.5 w-[75%]`} />
              <div className={`${bone} h-2.5 w-1/2`} />
            </div>
          </div>
          <div className={`${bone} h-8 w-full rounded-xl`} />
        </div>
      ))}
    </div>
  </div>
);

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
    <div className="w-10 h-10 rounded-full bg-[#EBF0F9] dark:bg-slate-700 text-[#3363AD] dark:text-blue-300 flex items-center justify-center text-sm font-bold shrink-0">
      {initials}
    </div>
  );
};

type TabType = "members" | "learning" | "meetings";
type StatusFilterType = "ALL" | "TODAY" | "THIS_WEEK" | "INACTIVE";
type ViewMode = "cards" | "table";

const activityBadge = (actStatus: string) => {
  if (actStatus === "TODAY") {
    return {
      actBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      actDot: "bg-emerald-500 animate-pulse",
      actLabel: "Active",
    };
  }
  if (actStatus === "THIS_WEEK") {
    return {
      actBg: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      actDot: "bg-amber-500",
      actLabel: "Moderately Active",
    };
  }
  return {
    actBg: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    actDot: "bg-red-500",
    actLabel: "Inactive (7d+)",
  };
};

const ViewModeToggle = ({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) => (
  <div className="bg-white dark:bg-card-bg rounded-[20px] border border-[rgba(51,99,173,0.20)] dark:border-slate-600/60 p-1 inline-flex items-center gap-0.5 shrink-0">
    <button
      type="button"
      onClick={() => onChange("cards")}
      title="Card view"
      aria-label="Card view"
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
        value === "cards"
          ? "bg-[#3363AD] text-white"
          : "text-[#5B6575] dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-slate-700"
      }`}
    >
      <LayoutGrid size={15} />
    </button>
    <button
      type="button"
      onClick={() => onChange("table")}
      title="Table view"
      aria-label="Table view"
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
        value === "table"
          ? "bg-[#3363AD] text-white"
          : "text-[#5B6575] dark:text-slate-400 hover:bg-[#F1F5F9] dark:hover:bg-slate-700"
      }`}
    >
      <List size={15} />
    </button>
  </div>
);

const CEHOGroupPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const tabFromUrl = searchParams.get("tab");
  const statusFromUrl = searchParams.get("status");
  const certFromUrl = searchParams.get("cert");

  const initialTab: TabType =
    tabFromUrl === "learning" || tabFromUrl === "meetings" || tabFromUrl === "members"
      ? tabFromUrl
      : "members";
  const initialStatus: StatusFilterType =
    statusFromUrl === "TODAY" ||
    statusFromUrl === "THIS_WEEK" ||
    statusFromUrl === "INACTIVE" ||
    statusFromUrl === "ALL"
      ? statusFromUrl
      : "ALL";
  const initialCert: "all" | "has_cert" | "no_cert" =
    certFromUrl === "has_cert" || certFromUrl === "no_cert" || certFromUrl === "all"
      ? certFromUrl
      : "all";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(initialStatus);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");
  const [selectedCertFilter, setSelectedCertFilter] = useState<"all" | "has_cert" | "no_cert">(initialCert);

  useEffect(() => {
    if (tabFromUrl === "learning" || tabFromUrl === "meetings" || tabFromUrl === "members") {
      setActiveTab(tabFromUrl);
    }
    if (
      statusFromUrl === "TODAY" ||
      statusFromUrl === "THIS_WEEK" ||
      statusFromUrl === "INACTIVE" ||
      statusFromUrl === "ALL"
    ) {
      setStatusFilter(statusFromUrl);
    }
    if (certFromUrl === "has_cert" || certFromUrl === "no_cert" || certFromUrl === "all") {
      setSelectedCertFilter(certFromUrl);
    }
  }, [tabFromUrl, statusFromUrl, certFromUrl]);

  const selectTab = (tab: TabType) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    if (tab !== "members") next.delete("status");
    if (tab !== "learning") next.delete("cert");
    setSearchParams(next, { replace: true });
  };

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
      const aCerts = uniqueCourseCertificateCount(a.certificates);
      const bCerts = uniqueCourseCertificateCount(b.certificates);
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
        hasCert = uniqueCourseCertificateCount(m.certificates) > 0;
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

  // Group academic performance metrics — must run before any early return
  const overallPreTestAvg = useMemo(() => {
    let totalScore = 0;
    let count = 0;
    monitoringMembers.forEach((m: any) => {
      const attempts = (m.recentTestAttempts || []).filter((a: any) => a.preTestId != null);
      if (attempts.length > 0) {
        totalScore += attempts.reduce((s: number, a: any) => s + (a.marks || 0), 0) / attempts.length;
        count++;
      }
    });
    return count > 0 ? Math.round(totalScore / count) : 0;
  }, [monitoringMembers]);

  const overallFinalTestAvg = useMemo(() => {
    let totalScore = 0;
    let count = 0;
    monitoringMembers.forEach((m: any) => {
      const attempts = (m.recentTestAttempts || []).filter((a: any) => a.finalTestId != null);
      if (attempts.length > 0) {
        totalScore += attempts.reduce((s: number, a: any) => s + (a.marks || 0), 0) / attempts.length;
        count++;
      }
    });
    return count > 0 ? Math.round(totalScore / count) : 0;
  }, [monitoringMembers]);

  const overallFinalExamAvg = useMemo(() => {
    let totalScore = 0;
    let count = 0;
    monitoringMembers.forEach((m: any) => {
      const attempts = (m.recentTestAttempts || []).filter((a: any) => a.finalExamId != null);
      if (attempts.length > 0) {
        totalScore += attempts.reduce((s: number, a: any) => s + (a.marks || 0), 0) / attempts.length;
        count++;
      }
    });
    return count > 0 ? Math.round(totalScore / count) : 0;
  }, [monitoringMembers]);

  const overallKnowledgeGained = useMemo(() => {
    if (overallPreTestAvg <= 0) return 0;
    return Math.round(((overallFinalTestAvg - overallPreTestAvg) / overallPreTestAvg) * 100);
  }, [overallPreTestAvg, overallFinalTestAvg]);

  if (isLoading) {
    return <CehoGroupSkeleton />;
  }

  if (isError || !group) {
    return (
      <div className={V2_PAGE_CANVAS}>
        <div className={`${V2_EMPTY} flex flex-col items-center justify-center py-16 gap-3`}>
          <Users className="w-12 h-12 text-[#C5D3E0]" />
          <p className="text-[#1A2332] dark:text-slate-100 font-semibold">
            No group assigned yet
          </p>
          <p className={`text-sm max-w-xs ${V2_MUTED}`}>
            You don't have a CEHO group yet. Contact an administrator to set one up.
          </p>
        </div>
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
    <div className={V2_PAGE_CANVAS}>
      {/* Header Bar — title left, tabs + actions right */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className={V2_PAGE_TITLE}>{group.name}</h2>
            <button
              onClick={openEdit}
              className="p-1.5 rounded-lg text-[#9AA3B2] hover:text-[#3363AD] hover:bg-[#EBF0F9] dark:hover:bg-slate-700 transition-colors"
              title="Edit group"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          {(group.district || (group.sectors && group.sectors.length > 0)) && (
            <div className={`flex items-center gap-1.5 text-sm ${V2_MUTED}`}>
              <MapPin className="w-3.5 h-3.5" />
              <span>
                {[group.district, ...(group.sectors ?? [])].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
          <p className={V2_PAGE_SUBTITLE}>Supervise CHWs, learning, and meetings</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="bg-white dark:bg-card-bg rounded-[20px] border border-[rgba(51,99,173,0.20)] dark:border-slate-600/60 p-1 inline-flex items-center gap-0.5 flex-wrap">
            <button
              type="button"
              onClick={() => selectTab("members")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "members"
                  ? "bg-[#3363AD] text-white"
                  : "text-[#5B6575] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-700"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              All Members ({memberCount})
            </button>

            <button
              type="button"
              onClick={() => selectTab("learning")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "learning"
                  ? "bg-[#3363AD] text-white"
                  : "text-[#5B6575] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-700"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Learning & Progress
            </button>

            <button
              type="button"
              onClick={() => selectTab("meetings")}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all ${
                activeTab === "meetings"
                  ? "bg-[#3363AD] text-white"
                  : "text-[#5B6575] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-slate-700"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Meetings
            </button>
          </div>

          {activeTab === "meetings" ? (
            <button
              type="button"
              onClick={() => setShowScheduleMeetingModal(true)}
              className={V2_BTN_PRIMARY}
            >
              <Plus className="w-4 h-4" />
              Add Schedule
            </button>
          ) : activeTab === "learning" ? (
            <>
              <button
                type="button"
                onClick={handleNudgeAll}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
              >
                <Bell className="w-4 h-4" />
                Nudge All Members
              </button>
              <button
                type="button"
                onClick={() => setShowAnnouncementModal(true)}
                className={V2_BTN_PRIMARY}
              >
                <Send className="w-4 h-4" />
                Post Announcement
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { refetch(); }}
                disabled={isRefetching}
                className={V2_BTN_SECONDARY}
              >
                {isRefetching ? "Refreshing…" : "Refresh"}
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {isExportingExcel ? "Exporting…" : "Export Excel"}
              </button>
              <button type="button" onClick={openAddModal} className={V2_BTN_PRIMARY}>
                <UserPlus className="w-4 h-4" />
                Add CHW
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline edit form */}
      {isEditing && (
        <div className={`${V2_CARD_SHELL_PADDED} space-y-4`}>
          <p className={V2_SECTION_TITLE}>Edit Group</p>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500">Group Name *</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className={`w-full px-3 py-2 text-sm ${V2_INPUT}`}
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
              className={`w-full px-3 py-2 text-sm ${V2_INPUT}`}
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
                    className={`w-full px-3 py-2 text-sm ${V2_INPUT} disabled:opacity-50 disabled:cursor-not-allowed`}
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
                    className={`w-full px-3 py-2 text-sm ${V2_INPUT} disabled:opacity-50 disabled:cursor-not-allowed`}
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
                    className={`w-full px-3 py-2 text-sm ${V2_INPUT} disabled:opacity-50 disabled:cursor-not-allowed`}
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

      {/* ── TAB 1: ALL MEMBERS ── */}
      {activeTab === "members" && (
        <div className="space-y-4">
          {/* Single Row: Search Input Box + Status Filter Button Pills Side-by-Side */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3B2]" />
              <input
                type="text"
                placeholder="Search members by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-sm ${V2_INPUT}`}
              />
            </div>

            {/* Horizontal Status Filter Button Pills Beside Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  statusFilter === "ALL"
                    ? "bg-[#3363AD] text-white border-[#3363AD]"
                    : "bg-white dark:bg-slate-800 text-[#5B6575] dark:text-slate-300 border-[#B8CDE0] dark:border-slate-600 hover:bg-[#F1F5F9] dark:hover:bg-slate-700"
                }`}
              >
                All ({statusCounts.all})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("TODAY")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  statusFilter === "TODAY"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active ({statusCounts.today})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("THIS_WEEK")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  statusFilter === "THIS_WEEK"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Moderately Active ({statusCounts.thisWeek})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("INACTIVE")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  statusFilter === "INACTIVE"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-red-400" />
                Inactive ({statusCounts.inactive})
              </button>

              <div className="sm:ml-auto">
                <ViewModeToggle value={viewMode} onChange={setViewMode} />
              </div>
            </div>
          </div>

          {/* Members Grid */}
          {membersLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`${V2_CARD_SHELL} h-28 p-4`}>
                  <div className={`${bone} h-full w-full rounded-xl`} />
                </div>
              ))}
            </div>
          ) : isCHWListEmpty ? (
            <div className={`${V2_EMPTY} flex flex-col items-center justify-center py-16 gap-3`}>
              <Users className="w-12 h-12 text-[#C5D3E0]" />
              <p className={`font-medium ${V2_MUTED}`}>
                {search ? "No members match your search" : "No members yet"}
              </p>
              {!search && (
                <button type="button" onClick={openAddModal} className={V2_BTN_PRIMARY}>
                  Add your first CHW
                </button>
              )}
            </div>
          ) : viewMode === "table" ? (
            <div className={`${V2_CARD_SHELL} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F8FAFC] dark:bg-slate-800/60 border-b border-[rgba(51,99,173,0.12)] dark:border-slate-700 text-[11px] font-bold text-[#5B6575] dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(51,99,173,0.08)] dark:divide-slate-700">
                    {cehoMatchesSearch && ceho && (() => {
                      const { actBg, actDot, actLabel } = activityBadge(cehoActStatus);
                      return (
                        <tr
                          key={`ceho-${ceho.id}`}
                          onClick={() => navigate(`/chw/${ceho.id}`)}
                          className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <MemberAvatar name={ceho.user.fullNames} photo={ceho.user.photo} />
                              <span className="font-semibold text-[#1A2332] dark:text-slate-100 truncate">
                                {ceho.user.fullNames}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 rounded-full px-2.5 py-0.5">
                              Leader (CEHO)
                            </span>
                          </td>
                          <td className={`px-4 py-3 ${V2_MUTED}`}>
                            {[ceho.user.district, ceho.user.sector].filter(Boolean).join(", ") || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${actBg}`}>
                              <span className={`w-2 h-2 rounded-full ${actDot}`} />
                              {actLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-semibold text-[#3363AD] dark:text-blue-300">
                            View
                          </td>
                        </tr>
                      );
                    })()}
                    {filteredCHWs.map((member: ICEHOGroupMember) => {
                      const u = member.student.user;
                      const mon = monitoringMembers.find(
                        (m: any) => m.studentId === member.student.id || m.user?.id === u.id,
                      );
                      const actStatus = mon?.activityStatus || "INACTIVE";
                      const { actBg, actDot, actLabel } = activityBadge(actStatus);
                      return (
                        <tr
                          key={member.id}
                          onClick={() => navigate(`/chw/${member.student.id}`)}
                          className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <MemberAvatar name={u.fullNames} photo={u.photo} />
                              <span className="font-semibold text-[#1A2332] dark:text-slate-100 truncate">
                                {u.fullNames}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 rounded-full px-2.5 py-0.5">
                              CHW
                            </span>
                          </td>
                          <td className={`px-4 py-3 ${V2_MUTED}`}>
                            {[u.district, u.sector].filter(Boolean).join(", ") || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${actBg}`}>
                              <span className={`w-2 h-2 rounded-full ${actDot}`} />
                              {actLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartChat(u.id);
                                }}
                                className="p-1.5 rounded-lg text-[#3363AD] bg-[#EBF0F9] dark:bg-slate-700 hover:bg-[#3363AD] hover:text-white transition-colors"
                                title="Direct Chat"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingRemove(member);
                                }}
                                className="p-1.5 rounded-lg text-red-600 bg-red-50 dark:bg-red-900/30 hover:bg-red-600 hover:text-white transition-colors"
                                title="Remove Member"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Dedicated CEHO leader card (Displayed ONLY once) */}
              {cehoMatchesSearch && ceho && (
                <div
                  onClick={() => navigate(`/chw/${ceho.id}`)}
                  className="bg-white dark:bg-card-bg rounded-[20px] border border-[rgba(51,99,173,0.20)] dark:border-slate-600/60 [box-shadow:3px_4px_0_0_rgba(51,99,173,0.16),6px_9px_18px_rgba(51,99,173,0.12)] p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-[#3363AD] flex flex-col justify-between min-h-[110px]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <MemberAvatar name={ceho.user.fullNames} photo={ceho.user.photo} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-bold text-[#1A2332] dark:text-slate-100 text-base truncate leading-tight">{ceho.user.fullNames}</p>
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
                        activityBadge(cehoActStatus).actBg
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${activityBadge(cehoActStatus).actDot}`}
                      />
                      {activityBadge(cehoActStatus).actLabel}
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
                const { actBg, actDot, actLabel } = activityBadge(actStatus);

                return (
                  <div
                    key={member.id}
                    onClick={() => navigate(`/chw/${member.student.id}`)}
                    className="bg-white dark:bg-card-bg rounded-[20px] border border-[rgba(51,99,173,0.20)] dark:border-slate-600/60 [box-shadow:3px_4px_0_0_rgba(51,99,173,0.16),6px_9px_18px_rgba(51,99,173,0.12)] p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between min-h-[110px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <MemberAvatar name={u.fullNames} photo={u.photo} />
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="font-bold text-[#1A2332] dark:text-slate-100 text-base truncate leading-tight">{u.fullNames}</p>
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

                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${actBg}`}>
                        <span className={`w-2 h-2 rounded-full ${actDot}`} />
                        {actLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 border-t border-gray-100 dark:border-slate-700 pt-2.5 mt-2">
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
        <div className="space-y-4">
          {/* Metric Cards Row (4 Academic Overview Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: "Avg Pre-Test",
                value: `${overallPreTestAvg}%`,
                Icon: Award,
                accent: "text-[#3363AD] dark:text-blue-300",
              },
              {
                title: "Avg Final Test",
                value: `${overallFinalTestAvg}%`,
                Icon: TrendingUp,
                accent: "text-emerald-600 dark:text-emerald-400",
              },
              {
                title: "Avg Final Exam",
                value: `${overallFinalExamAvg}%`,
                Icon: Crown,
                accent: "text-purple-600 dark:text-purple-400",
              },
              {
                title: "Knowledge Gained",
                value: `${overallKnowledgeGained >= 0 ? "+" : ""}${overallKnowledgeGained}%`,
                Icon: Activity,
                accent: "text-amber-600 dark:text-amber-400",
              },
            ].map(({ title, value, Icon, accent }) => (
              <div
                key={title}
                className={`${V2_CARD_SHELL_PADDED} flex items-center gap-3 min-h-[88px]`}
              >
                <div
                  className={`w-10 h-10 rounded-[12px] ${V2_KPI_ICON_CHIP} flex items-center justify-center shrink-0`}
                >
                  <Icon size={18} className={accent} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B6575] dark:text-slate-400">
                    {title}
                  </p>
                  <p className="text-[22px] font-bold tabular-nums text-[#5B6575] dark:text-slate-100 mt-0.5">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Top 3 Performers Leaderboard */}
          {topPerformers.length > 0 && (
            <div className={`${V2_CARD_SHELL_PADDED} space-y-4 border-amber-200/80 dark:border-amber-700/40`}>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className={V2_SECTION_TITLE}>Top 3 Performers</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {topPerformers.map((tp: any, idx: number) => {
                  const rankBadges = ["1st", "2nd", "3rd"];
                  const rankBadgeStyles = [
                    "text-amber-800 bg-amber-200/80 border-amber-300 dark:text-amber-100 dark:bg-amber-800/50 dark:border-amber-700",
                    "text-slate-700 bg-slate-200/80 border-slate-300 dark:text-slate-100 dark:bg-slate-700 dark:border-slate-600",
                    "text-orange-800 bg-orange-200/80 border-orange-300 dark:text-orange-100 dark:bg-orange-900/40 dark:border-orange-700",
                  ];

                  const gradedAttempts = (tp.recentTestAttempts || []).filter((x: any) => x.midTestId == null);
                  const avgScore = gradedAttempts.length > 0
                    ? Math.round(gradedAttempts.reduce((s: number, a: any) => s + (a.marks || 0), 0) / gradedAttempts.length)
                    : 0;

                  return (
                    <button
                      key={tp.studentId}
                      type="button"
                      onClick={() => navigate(`/chw/${tp.studentId}`)}
                      className="p-4 rounded-xl border border-[rgba(51,99,173,0.12)] dark:border-slate-600 bg-[#F8FAFC] dark:bg-slate-800/60 hover:bg-[#EBF0F9] dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-3 text-left w-full"
                    >
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border shrink-0 ${rankBadgeStyles[idx]}`}>
                        {rankBadges[idx]}
                      </span>
                      <MemberAvatar name={tp.user?.fullNames} photo={tp.user?.photo} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-[#1A2332] dark:text-slate-100 truncate">{tp.user?.fullNames}</p>
                        <p className={`text-xs flex items-center gap-1 mt-0.5 ${V2_MUTED}`}>
                          <Award className="w-3 h-3 text-amber-600" />
                          {uniqueCourseCertificateCount(tp.certificates)} Certificates
                        </p>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-bold text-[#3363AD] dark:text-blue-300 bg-[#EBF0F9] dark:bg-slate-700 border border-[rgba(51,99,173,0.20)] rounded-lg shrink-0 tabular-nums">
                        {avgScore}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Academic Filters Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className={`px-4 py-2.5 text-sm font-semibold min-w-[200px] ${V2_INPUT}`}
            >
              <option value="all">All Courses</option>
              {allCourses.map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>

            <select
              value={selectedCertFilter}
              onChange={(e) => setSelectedCertFilter(e.target.value as any)}
              className={`px-4 py-2.5 text-sm font-semibold min-w-[200px] ${V2_INPUT}`}
            >
              <option value="all">All Certificates ({certCounts.all})</option>
              <option value="has_cert">Has Certificate ({certCounts.hasCert})</option>
              <option value="no_cert">No Certificate ({certCounts.noCert})</option>
            </select>

            <div className="sm:ml-auto">
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>

          {/* Member Progress — table or cards */}
          {(() => {
            const learningRows = monitoringMembers.filter((m: any) => {
              if (selectedCertFilter === "has_cert") {
                if (selectedCourseFilter !== "all") {
                  return (m.certificates || []).some((c: any) => c.courseId === selectedCourseFilter);
                }
                return uniqueCourseCertificateCount(m.certificates) > 0;
              }
              if (selectedCertFilter === "no_cert") {
                if (selectedCourseFilter !== "all") {
                  return !(m.certificates || []).some((c: any) => c.courseId === selectedCourseFilter);
                }
                return uniqueCourseCertificateCount(m.certificates) === 0;
              }
              if (selectedCourseFilter !== "all") {
                return (m.courseProgress || []).some((c: any) => c.courseId === selectedCourseFilter);
              }
              return true;
            });

            if (viewMode === "table") {
              return (
                <div className={`${V2_CARD_SHELL} overflow-hidden`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#F8FAFC] dark:bg-slate-800/60 border-b border-[rgba(51,99,173,0.12)] dark:border-slate-700 text-[11px] font-bold text-[#5B6575] dark:text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Member</th>
                          <th className="px-4 py-3">Courses</th>
                          <th className="px-4 py-3">Progress</th>
                          <th className="px-4 py-3">Tests passed</th>
                          <th className="px-4 py-3">Certificates</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(51,99,173,0.08)] dark:divide-slate-700">
                        {learningRows.map((m: any) => {
                          const totalC = m.courseProgress.length;
                          const completedC = m.courseProgress.filter((cp: any) => cp.isCompleted).length;
                          const avgP = totalC > 0 ? Math.round(m.courseProgress.reduce((sum: number, c: any) => sum + (c.progress || 0), 0) / totalC) : 0;
                          const gradedAttempts = (m.recentTestAttempts || []).filter((a: any) => a.midTestId == null);
                          const passing = gradedAttempts.filter((a: any) => a.marks >= 70).length;
                          return (
                            <tr
                              key={m.studentId}
                              onClick={() => navigate(`/chw/${m.studentId}`)}
                              className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <MemberAvatar name={m.user.fullNames} photo={m.user.photo} />
                                  <span className="font-semibold text-[#1A2332] dark:text-slate-100 truncate">
                                    {m.user.fullNames}
                                  </span>
                                </div>
                              </td>
                              <td className={`px-4 py-3 tabular-nums ${V2_MUTED}`}>
                                {completedC}/{totalC}
                              </td>
                              <td className="px-4 py-3 min-w-[140px]">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-[#E8EEF4] dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className="bg-[#3363AD] h-full rounded-full"
                                      style={{ width: `${avgP}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-[#3363AD] dark:text-blue-300 tabular-nums w-8">
                                    {avgP}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                  {passing}/{gradedAttempts.length}
                                </span>
                              </td>
                              <td className={`px-4 py-3 tabular-nums font-semibold ${V2_MUTED}`}>
                                {uniqueCourseCertificateCount(m.certificates)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {learningRows.map((m: any) => {
                  const totalC = m.courseProgress.length;
                  const completedC = m.courseProgress.filter((cp: any) => cp.isCompleted).length;
                  const avgP = totalC > 0 ? Math.round(m.courseProgress.reduce((sum: number, c: any) => sum + (c.progress || 0), 0) / totalC) : 0;
                  const gradedAttempts = (m.recentTestAttempts || []).filter((a: any) => a.midTestId == null);
                  const passing = gradedAttempts.filter((a: any) => a.marks >= 70).length;

                  return (
                    <div
                      key={m.studentId}
                      onClick={() => navigate(`/chw/${m.studentId}`)}
                      className="bg-white dark:bg-card-bg rounded-[20px] border border-[rgba(51,99,173,0.20)] dark:border-slate-600/60 [box-shadow:3px_4px_0_0_rgba(51,99,173,0.16),6px_9px_18px_rgba(51,99,173,0.12)] p-4 hover:shadow-md transition-shadow cursor-pointer space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <MemberAvatar name={m.user.fullNames} photo={m.user.photo} />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#1A2332] dark:text-slate-100 truncate">{m.user.fullNames}</p>
                            <p className={`text-xs ${V2_MUTED}`}>{completedC}/{totalC} courses completed</p>
                          </div>
                          <span className="text-sm font-bold text-[#3363AD] shrink-0">{avgP}%</span>
                        </div>

                        <div className="w-full bg-[#E8EEF4] dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#3363AD] h-full rounded-full transition-all duration-500" style={{ width: `${avgP}%` }} />
                        </div>
                      </div>

                      {gradedAttempts.length > 0 && (
                        <div className="border-t border-gray-50 dark:border-slate-700 pt-2 flex items-center justify-between text-xs">
                          <span className={`font-medium ${V2_MUTED}`}>Tests Passed</span>
                          <span className="font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                            {passing}/{gradedAttempts.length} passed
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── TAB 3: MEETINGS ── */}
      {activeTab === "meetings" && (
        <div className="space-y-4">
          {/* Meeting Attendance Stat Cards */}
          {meetingsData?.stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Meetings", value: meetingsData.stats.total ?? 0, color: "text-[#5B6575] dark:text-slate-100" },
                { label: "Upcoming", value: meetingsData.stats.upcoming ?? 0, color: "text-sky-700 dark:text-sky-400" },
                { label: "Completed", value: meetingsData.stats.completed ?? 0, color: "text-emerald-700 dark:text-emerald-400" },
                {
                  label: "Attendance Rate",
                  value: meetingsData.stats.overallAttendancePct !== null ? `${meetingsData.stats.overallAttendancePct}%` : "—",
                  color: "text-purple-700 dark:text-purple-400",
                },
              ].map((s) => (
                <div key={s.label} className={V2_CARD_SHELL_PADDED}>
                  <p className="text-[11px] text-[#5B6575] dark:text-slate-400 font-bold uppercase tracking-wider">{s.label}</p>
                  <p className={`text-[22px] font-bold mt-1 tabular-nums ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Meetings List Table */}
          <div className={`${V2_CARD_SHELL} overflow-hidden`}>
            {meetingsLoading ? (
              <div className="p-6 space-y-3 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`${bone} h-10 w-full`} />
                ))}
              </div>
            ) : !meetingsData?.meetings || meetingsData.meetings.length === 0 ? (
              <div className={`${V2_EMPTY} m-4 flex flex-col items-center justify-center py-12 gap-2`}>
                <Calendar className="w-10 h-10 text-[#C5D3E0]" />
                <p className="font-semibold text-[#1A2332] dark:text-slate-100">No meetings scheduled</p>
                <p className={`text-xs ${V2_MUTED}`}>Use Add Schedule to invite your group members.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F8FAFC] dark:bg-slate-800/60 border-b border-[rgba(51,99,173,0.12)] dark:border-slate-700 text-[11px] font-bold text-[#5B6575] dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Meeting Title</th>
                      <th className="px-5 py-3">Host</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Participants</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(51,99,173,0.08)] dark:divide-slate-700">
                    {meetingsData.meetings.map((m: any) => (
                      <tr key={m.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4 font-semibold text-[#1A2332] dark:text-slate-100">{m.title}</td>
                        <td className={`px-5 py-4 ${V2_MUTED}`}>{m.host?.fullNames || "—"}</td>
                        <td className={`px-5 py-4 ${V2_MUTED}`}>{new Date(m.startAt).toLocaleDateString("en-RW")}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            m.status === "UPCOMING" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                            m.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300"
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => navigate(`/attendance/${m.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#EBF0F9] dark:bg-slate-700 text-[#3363AD] dark:text-blue-300 hover:bg-[#3363AD] hover:text-white rounded-lg font-bold text-xs transition-colors"
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
