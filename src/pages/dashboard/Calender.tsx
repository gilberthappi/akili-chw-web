/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Video,
  Plus,
  Bell,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  Copy,
  GraduationCap,
  ClipboardCheck,
  FileText,
  Repeat,
  CalendarDays,
  CalendarCheck,
} from "lucide-react";
import {
  V2PageHeader,
  V2KpiCard,
  V2SearchInput,
  V2Tabs,
  type V2TabItem,
} from "@/components/v2/V2Page";
import {
  V2_PAGE_CANVAS,
  V2_CARD_SHELL,
  V2_CARD_SHELL_PADDED,
  V2_INPUT,
  V2_BTN_PRIMARY,
  V2_BTN_SECONDARY,
  V2_TABLE_HEAD,
  V2_TABLE_BODY,
  V2_TABLE_ROW,
  V2_PILL,
  V2_PILL_BLUE,
  V2_STRONG,
  V2_MUTED,
  V2_SECTION_TITLE,
  V2_EMPTY,
  V2_KPI_ICON_CHIP,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import ComboboxField from "@/components/common/form/ComboboxField";
import OptionsField from "@/components/common/form/OptionsField";
import TextField from "@/components/common/form/TextField";
import TextArea from "@/components/common/form/TextArea";
import Button from "@/components/common/form/Button";
import { getAllUsersNopagination } from "@/services/users.api";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvents,
  cancelOccurrence,
  updateOccurrence,
} from "@/services/calender.service";
import { useAuth } from "@/hooks/useAuth";
import { expandRoles, formatRoleLabel } from "@/utils/roles";
import { uploadFileByType } from "@/services/uploader.api";
import { getPublicHospitals } from "@/services/healthCenters.service";

const EBUMENYI_SCHEDULE_URL =
  import.meta.env.VITE_EBUMENYI_MEET_API_URL ||
  "http://localhost:3000/api/meetings/schedule";

// Derive the meeting app base URL from the schedule URL (strip /api/meetings/schedule)
const EBUMENYI_MEET_BASE_URL = EBUMENYI_SCHEDULE_URL.replace(/\/api\/meetings\/schedule\/?$/, "");

function buildEventBackendPayload(eventData: any) {
  const [startTimeStr, endTimeStr] = eventData.time.split(" - ");
  const eventDate = new Date(eventData.date);

  const startDateTime = new Date(eventDate);
  const [startHours, startMinutes] = startTimeStr.split(":").map(Number);
  startDateTime.setHours(startHours, startMinutes, 0, 0);

  const endDateTime = new Date(eventDate);
  const [endHours, endMinutes] = endTimeStr.split(":").map(Number);
  endDateTime.setHours(endHours, endMinutes, 0, 0);

    const rawMeetingType = (eventData.meetingType || "OTHER").toString().toUpperCase().replace("-", "_");
    const meetingType = ["EBUMENYI_MEETING", "GOOGLE_MEET", "ZOOM", "OTHER"].includes(rawMeetingType)
      ? rawMeetingType
      : "OTHER";

    return {
      title: eventData.title,
      description: eventData.description,
      type: eventData.type,
      frequency: eventData.frequency || "NONE",
      daysOfWeek: eventData.daysOfWeek || [],
      timezone: "Africa/Kigali",
      reminderMinutesBefore: Array.isArray(eventData.reminders)
        ? eventData.reminders
        : [Number(eventData.reminders || 30)],
      startAt: startDateTime.toISOString(),
      endAt: endDateTime.toISOString(),
      recurrenceEndsAt: eventData.recurrenceEndsAt || undefined,
      meetingType,
      location: eventData.location || "",
      priority: (eventData.priority || "MEDIUM").toString().toUpperCase(),
      hostEmail: eventData.hostEmail || "",
    participants:
      eventData.attendees?.map((userId: string) => ({
        userId,
      })) || [],
    externalParticipants: (eventData.externalParticipants || []).map(
      (email: string) => ({
        email,
      }),
    ),
    attachments: (eventData.attachments || [])
      .filter((a: { url?: string }) => a?.url)
      .map((a: { url: string; name?: string }) => ({
        name: a.name?.trim() || a.url.split("/").filter(Boolean).pop() || "Attachment",
        url: a.url,
      })),
  };
}

function parseMeetingUrlFromScheduleResponse(
  result: Record<string, unknown>,
): string | null {
  const nested = result.data as Record<string, unknown> | undefined;
  return (
    (result.meetingLink as string) ||
    (result.meetingUrl as string) ||
    (result.url as string) ||
    (result.link as string) ||
    (result.joinUrl as string) ||
    (result.meeting_url as string) ||
    (result.meeting_link as string) ||
    (nested?.meetingLink as string) ||
    (nested?.meetingUrl as string) ||
    (nested?.url as string) ||
    (nested?.link as string) ||
    null
  );
}

function parseStreamRoomIdFromScheduleResponse(
  result: Record<string, unknown>,
  fallbackMeetingId: string,
): string {
  const nested = result.data as Record<string, unknown> | undefined;
  const id =
    (result.meetingId as string) ||
    (nested?.meetingId as string) ||
    fallbackMeetingId;
  return id;
}

async function scheduleEbumenyiMeeting(params: {
  startsAt: string;
  hostEmail: string;
  title: string;
  userId: string;
  meetingId: string;
}): Promise<{ meetingUrl: string; streamRoomId: string } | null> {
  const response = await fetch(EBUMENYI_SCHEDULE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      startsAt: params.startsAt,
      hostEmail: params.hostEmail,
      description: params.title,
      userId: params.userId,
      meetingId: params.meetingId,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as Record<string, unknown>;
  const meetingUrl = parseMeetingUrlFromScheduleResponse(result);
  if (!meetingUrl) {
    return null;
  }

  return {
    meetingUrl,
    streamRoomId: parseStreamRoomIdFromScheduleResponse(result, params.meetingId),
  };
}

const Calendar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const profileEmail = user?.email || "";
  const userRoles = Array.isArray(user?.roles)
    ? user.roles
    : user?.roles
      ? [user.roles]
      : [];
  const effectiveRoles = expandRoles(userRoles as string[]);
  const isAdmin = ["ADMIN", "ADMINISTRATOR"].some((r) => effectiveRoles.has(r));
  const isCEHO = effectiveRoles.has("CEHO");
  const isStaff = effectiveRoles.has("STAFF");
  const isTrainer = effectiveRoles.has("TRAINER");

  // Fetch all users
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsersNopagination(),
  });

  // Fetch all events
  const { data: eventsData } = useQuery({
    queryKey: ["events"],
    queryFn: () => getAllEvents(),
  });

  const queryClient = useQueryClient();

  // Mutations for event operations
  const createEventMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created successfully!");
      setShowEventModal(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create event");
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) =>
      updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event updated successfully!");
      setShowEventModal(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update event");
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted successfully!");
      setEventToDelete(null);
      setShowDetailsModal(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete event");
    },
  });

  const rawUsers = usersData?.data || [];
  const loggedInUserFullData = rawUsers.find((u: any) => u.id === user?.id);
  const cehoHospitalId = loggedInUserFullData?.healthCenter?.id || (loggedInUserFullData as any)?.healthCenterId;

  const users = rawUsers.filter((u: any) => {
    if (isCEHO) {
      const isCHW = ["TRAINEE", "TESTER"].includes(u.userRoles?.[0]?.name);
      if (!isCHW) return false;
      if (!cehoHospitalId) return false;
      
      const chwHospitalId = u.healthCenter?.id || u.healthCenterId;
      return chwHospitalId === cehoHospitalId;
    }
    return true;
  });

  // Use events exactly as provided by the backend (no client-side deduplication)
  const events = React.useMemo(() => {
    if (Array.isArray(eventsData?.data)) return eventsData.data;
    if (Array.isArray(eventsData)) return eventsData;
    return [];
  }, [eventsData]);

  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const [searchParams] = useSearchParams();
  const targetEventId = searchParams.get("eventId");

  React.useEffect(() => {
    if (targetEventId && events.length > 0) {
      const found = events.find(
        (e: any) => String(e.id) === String(targetEventId) || String(e.originalEventId) === String(targetEventId)
      );
      if (found) {
        setSelectedEvent(found);
        setShowDetailsModal(true);
      }
    }
  }, [targetEventId, events]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [statsFilterType, setStatsFilterType] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<"month" | "week" | "day">(
    "month",
  );
  const [quickActionDefaults, setQuickActionDefaults] = useState<any>(null);
  const [selectedDateForForm, setSelectedDateForForm] = useState<string | null>(
    null,
  );
  const [selectedEventType, setSelectedEventType] = useState<string>("TRAINING");
  const [formDate, setFormDate] = useState<string>("");
  const [_selectedMeetingType, setSelectedMeetingType] =
    useState<string>("EBUMENYI_MEETING");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<string>("NONE");
  const [isRepeating, setIsRepeating] = useState<boolean>(false);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [recurrenceEnd, setRecurrenceEnd] = useState<string>("");
  const [attendeeSearchTerm, setAttendeeSearchTerm] = useState("");
  const [attendeeFilterRole, setAttendeeFilterRole] = useState("all");
  const [attendeeFilterHospital, setAttendeeFilterHospital] = useState("all");
  const [attendeeFilterDistrict, setAttendeeFilterDistrict] = useState("all");
  const [hospitalFilterOptions, setHospitalFilterOptions] = useState<{ value: string; label: string }[]>([]);
  const [attendeeFilterSector, setAttendeeFilterSector] = useState("all");
  const [attendeeFilterCell, setAttendeeFilterCell] = useState("all");
  const [attendeeFilterVillage, setAttendeeFilterVillage] = useState("all");
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [externalParticipants, setExternalParticipants] = useState<string[]>([]);
  const [externalEmailInput, setExternalEmailInput] = useState("");
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const [expandedDate, setExpandedDate] = useState<Date | null>(null);
  const [reminders, setReminders] = useState<number[]>([30]);
  const [reminderInput, setReminderInput] = useState<string>("");
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>(
    [],
  );
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [occurrenceActionMode, setOccurrenceActionMode] = useState<
    "single" | "all" | "future" | null
  >(null);
  const [showOccurrenceActionDialog, setShowOccurrenceActionDialog] =
    useState(false);
  const [occurrenceActionType, setOccurrenceActionType] = useState<
    "edit" | "delete" | null
  >(null);
  const [isProcessingOccurrence, setIsProcessingOccurrence] = useState(false);

  // Initialize selectedEventType and formDate when modal opens
  React.useEffect(() => {
    if (showEventModal) {
      setSelectedEventType(
        editingEvent?.type || quickActionDefaults?.type || "TRAINING",
      );
      setFormDate(
        editingEvent?.startAt
          ? new Date(editingEvent.startAt).toISOString().split("T")[0]
          : selectedDateForForm || getDefaultDate(),
      );
      setSelectedMeetingType(
        editingEvent?.meetingType ||
          quickActionDefaults?.meetingType ||
          "EBUMENYI_MEETING",
      );
      const incomingFrequency = editingEvent?.frequency || "NONE";
      setFrequency(incomingFrequency);
      setIsRepeating(incomingFrequency !== "NONE");
      setDaysOfWeek(editingEvent?.daysOfWeek || []);
      setRecurrenceEnd(
        editingEvent?.recurrenceEndsAt
          ? new Date(editingEvent.recurrenceEndsAt).toISOString().split("T")[0]
          : "",
      );
      setSelectedAttendees(
        editingEvent?.participants?.map((p: any) => p.userId) || [],
      );
      setExternalParticipants(
        editingEvent?.externalParticipants?.map((p: any) => p.email) || [],
      );
      setExternalEmailInput("");
      setReminders(editingEvent?.reminderMinutesBefore || [30]);
      setReminderInput("");
      setAttachments(editingEvent?.attachments || []);
      setAttachmentUrl("");
    }
  }, [showEventModal, editingEvent, quickActionDefaults, selectedDateForForm]);

  const quickReminderOptions = [
    { label: "5m", minutes: 5 },
    { label: "15m", minutes: 15 },
    { label: "30m", minutes: 30 },
    { label: "45m", minutes: 45 },
    { label: "1h", minutes: 60 },
    { label: "2h", minutes: 120 },
    { label: "1d", minutes: 1440 },
    { label: "1w", minutes: 10080 },
  ];

  React.useEffect(() => {
    if (frequency === "WEEKLY" && daysOfWeek.length === 0 && formDate) {
      const startDay = new Date(formDate).getDay();
      setDaysOfWeek([startDay]);
    }
    if (frequency !== "WEEKLY" && daysOfWeek.length > 0) {
      setDaysOfWeek([]);
    }
  }, [frequency, formDate, daysOfWeek.length]);

  const fetchHospitalOptions = React.useCallback(async (district?: string) => {
    try {
      const params = district && district !== "all" ? { district } : undefined;
      const healthCenters = await getPublicHospitals(params);
      setHospitalFilterOptions(healthCenters.map((h) => ({ value: h.id, label: h.name })));
    } catch (err) {
      console.error("[Calendar] failed to load healthCenters:", err);
    }
  }, []);

  // Load all healthCenters on mount
  React.useEffect(() => {
    fetchHospitalOptions();
  }, [fetchHospitalOptions]);

  // Re-fetch healthCenters filtered by district, reset healthCenter selection
  const isFirstDistrictRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstDistrictRender.current) {
      isFirstDistrictRender.current = false;
      return;
    }
    fetchHospitalOptions(attendeeFilterDistrict);
    setAttendeeFilterHospital("all");
  }, [attendeeFilterDistrict, fetchHospitalOptions]);

  // Event management functions
  const sendEventToBackend = (eventData: any, _editingEvent?: any) => {
    const backendPayload = buildEventBackendPayload(eventData);

    // Use the mutation to create/update the event
    if (eventData.id) {
      // Update existing event
      updateEventMutation.mutate({ id: eventData.id, data: backendPayload });
    } else {
      // Create new event
      createEventMutation.mutate(backendPayload);
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    const finalEventData = { ...eventData };

    // Validate required title field
    if (!eventData.title || eventData.title.trim() === "") {
      toast.error("Title is required");
      return false;
    }

    // Validate required description field
    if (!eventData.description || eventData.description.trim() === "") {
      toast.error("Description is required");
      return false;
    }

    if (
      eventData.frequency === "WEEKLY" &&
      (!eventData.daysOfWeek || eventData.daysOfWeek.length === 0)
    ) {
      toast.error("Select at least one weekday for weekly repeats");
      return false;
    }

    // Validate "Ends On" is mandatory for repeating events
    if (
      eventData.frequency !== "NONE" &&
      (!eventData.recurrenceEndsAt ||
        (typeof eventData.recurrenceEndsAt === "string" &&
          eventData.recurrenceEndsAt.trim() === ""))
    ) {
      toast.error(
        `Please set an "Ends On" date for ${eventData.frequency} repeating events`,
      );
      return false;
    }

    if (isAdmin || isCEHO) {
      if (!finalEventData.hostEmail || finalEventData.hostEmail.trim() === "") {
        finalEventData.hostEmail = profileEmail || user?.email || "";
      }
      if (!finalEventData.hostEmail || finalEventData.hostEmail.trim() === "") {
        toast.error("Host email is required");
        return false;
      }
      const hasParticipants =
        (finalEventData.attendees && finalEventData.attendees.length > 0) ||
        (finalEventData.externalParticipants && finalEventData.externalParticipants.length > 0);
      if (!hasParticipants) {
        toast.error("At least one participant is required");
        return false;
      }
    } else {
      finalEventData.meetingType = "OTHER";
      finalEventData.attendees = [];
      finalEventData.externalParticipants = [];
      finalEventData.hostEmail = finalEventData.hostEmail || profileEmail || user?.email || "";
    }

    // EBUMENYI: calendar event id = Stream call id (same as chw-meeting) so recordings link correctly
    if (eventData.meetingType === "EBUMENYI_MEETING") {
      if (!user?.id) {
        toast.error("You must be signed in to schedule a meeting");
        return false;
      }

      setIsCreatingMeeting(true);
      try {
        const dateStr = eventData.date.toISOString().split("T")[0];
        const startTime = eventData.time.split(" - ")[0];
        const localDateTime = new Date(`${dateStr}T${startTime}:00`);
        const startsAt = localDateTime.toISOString();

        const payload = buildEventBackendPayload(finalEventData);
        const calendarEventId = editingEvent?.id as string | undefined;

        const finishSuccess = () => {
          queryClient.invalidateQueries({ queryKey: ["events"] });
          toast.success(
            calendarEventId ? "Event updated successfully!" : "Event created successfully!",
          );
          setShowEventModal(false);
          setIsCreatingMeeting(false);
        };

        if (calendarEventId) {
          const existingStreamRoomId = editingEvent?.streamRoomId as string | undefined;
          const existingLocation = editingEvent?.location as string | undefined;

          // Notify Stream of the updated start time but don't let it
          // overwrite the stored link — the room ID is fixed at creation.
          const scheduled = await scheduleEbumenyiMeeting({
            startsAt,
            hostEmail: eventData.hostEmail,
            title: eventData.title,
            userId: user.id,
            meetingId: existingStreamRoomId || calendarEventId,
          });

          if (!scheduled) {
            toast.error("Failed to update video meeting room");
            setIsCreatingMeeting(false);
            return false;
          }

          await updateEvent(calendarEventId, {
            ...payload,
            // Preserve whatever is already stored; only fill from Stream's
            // response when the event has no room yet (e.g. old data).
            location: existingLocation || scheduled.meetingUrl,
            streamRoomId: existingStreamRoomId || scheduled.streamRoomId,
          });
          finishSuccess();
        } else {
          const created = await createEvent({ ...payload, location: "" });
          const newCalendarId = created.data?.id;

          if (!newCalendarId) {
            toast.error("Failed to create calendar event");
            setIsCreatingMeeting(false);
            return false;
          }

          const scheduled = await scheduleEbumenyiMeeting({
            startsAt,
            hostEmail: eventData.hostEmail,
            title: eventData.title,
            userId: user.id,
            meetingId: newCalendarId,
          });

          if (!scheduled) {
            await deleteEvent(newCalendarId).catch(() => undefined);
            toast.error("Failed to create video meeting room");
            setIsCreatingMeeting(false);
            return false;
          }

          await updateEvent(newCalendarId, {
            location: scheduled.meetingUrl,
            streamRoomId: scheduled.streamRoomId,
          });
          finishSuccess();
        }

        return true;
      } catch {
        toast.error("Network error while creating meeting. Please try again.");
        setShowSignInModal(true);
        setIsCreatingMeeting(false);
        return false;
      }
    } else {
      // For non-ebumenyi meetings, send to backend immediately since we have all data
      sendEventToBackend(finalEventData, editingEvent);
    }

    // Events are managed by React Query, no need to manually update local state
    return true;
  };

  const handleViewEvent = (event: any) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const handleDeleteEvent = (event: any) => {
    // If recurring, show occurrence mode selection dialog
    if (event.isRepeating && event.commonId) {
      setEventToDelete(event);
      setOccurrenceActionType("delete");
      setShowOccurrenceActionDialog(true);
    } else {
      // For non-recurring events, show delete confirmation modal
      setEventToDelete(event);
    }
  };

  const confirmDeleteEvent = async () => {
    const event = eventToDelete;
    if (!event) return;

    try {
      // For recurring events with selected mode
      if (event.isRepeating && event.commonId && occurrenceActionMode) {
        // Pass the mode directly to cancelOccurrence
        await cancelOccurrence(
          event.id,
          occurrenceActionMode as "single" | "all" | "future",
        );
        toast.success("Occurrence deleted successfully!");
      } else {
        // Non-recurring event
        deleteEventMutation.mutate(event.id);
        return;
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setEventToDelete(null);
      setShowDetailsModal(false);
      setOccurrenceActionMode(null);
      setOccurrenceActionType(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to delete occurrence");
    }
  };

  // Helper function to get default date (today)
  const getDefaultDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  // Helper function to get default time (current time + 1 hour)
  const getDefaultTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toTimeString().slice(0, 5);
  };

  // Helper function to get end time (start time + 1 hour)
  const getEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const endTime = new Date();
    endTime.setHours(hours + 1, minutes);
    return endTime.toTimeString().slice(0, 5);
  };

  // Helper function to get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Helper function to calculate event status based on startAt and endAt
  const getEventStatus = (startAt: string, endAt: string) => {
    const now = new Date();
    const start = new Date(startAt);
    const end = new Date(endAt);

    if (now < start) {
      return "scheduled";
    } else if (now >= start && now <= end) {
      return "ongoing";
    } else {
      return "completed";
    }
  };

  // Helper function to get clean meeting URL without auth tokens and normalized with base URL
  const getCleanMeetingUrl = (location: string): string => {
    if (!location) return "";
    const meetingIdMatch = location.match(/\/meeting\/([a-z0-9-]+)/i);
    if (meetingIdMatch) {
      return `${EBUMENYI_MEET_BASE_URL}/meeting/${meetingIdMatch[1]}`;
    }
    try {
      const u = new URL(location);
      u.searchParams.delete("token");
      return u.toString();
    } catch (e) {
      return location;
    }
  };

  // Helper function to format location display
  const formatLocation = (location: string) => {
    if (!location) return "";

    // Check if it's a meeting URL — extract the meeting ID and rebuild with the local base URL
    const meetingIdMatch = location.match(/\/meeting\/([a-z0-9-]+)/i);
    if (meetingIdMatch) {
      const meetingHref = `${EBUMENYI_MEET_BASE_URL}/meeting/${meetingIdMatch[1]}`;
      return (
        <a
          href={meetingHref}
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-600 hover:text-blue-800 underline'
        >
          Virtual Meeting
        </a>
      );
    }

    // Non-meeting URLs (physical location etc.)
    const urlPattern = /^https?:\/\//i;
    if (urlPattern.test(location)) {
      return (
        <a
          href={location}
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-600 hover:text-blue-800 underline'
        >
          {location}
        </a>
      );
    }

    // For physical meetings or other locations, display as is
    return location;
  };

  // Helper functions for attendees
  const getFilteredUsers = () => {
    return users.filter((user) => {
      const matchesSearch =
        !attendeeSearchTerm ||
        user.fullNames.toLowerCase().includes(attendeeSearchTerm.toLowerCase()) ||
        user.phoneNumber.includes(attendeeSearchTerm);
      const matchesRole =
        attendeeFilterRole === "all" ||
        user.userRoles[0]?.name === attendeeFilterRole;
      const matchesHospital =
        attendeeFilterHospital === "all" ||
        user?.healthCenter?.id === attendeeFilterHospital;
      const matchesDistrict =
        attendeeFilterDistrict === "all" || user.district === attendeeFilterDistrict;
      const matchesSector =
        attendeeFilterSector === "all" || user.sector === attendeeFilterSector;
      const matchesCell =
        attendeeFilterCell === "all" || user.cell === attendeeFilterCell;
      const matchesVillage =
        attendeeFilterVillage === "all" || user.village === attendeeFilterVillage;
      return (
        matchesSearch &&
        matchesRole &&
        matchesHospital &&
        matchesDistrict &&
        matchesSector &&
        matchesCell &&
        matchesVillage
      );
    });
  };

  const handleSelectAllCHW = () => {
    const chwIds = users
      .filter((user) => ["TRAINEE", "TESTER"].includes(user.userRoles[0]?.name))
      .map((user) => user.id);
    if (isAllCHWSelected()) {
      setSelectedAttendees((prev) => prev.filter((id) => !chwIds.includes(id)));
    } else {
      setSelectedAttendees((prev) => [...new Set([...prev, ...chwIds])]);
    }
  };

  const handleSelectAllTrainer = () => {
    const trainerIds = users
      .filter((user) => user.userRoles[0]?.name === "TRAINER")
      .map((user) => user.id);
    if (isAllTrainersSelected()) {
      setSelectedAttendees((prev) => prev.filter((id) => !trainerIds.includes(id)));
    } else {
      setSelectedAttendees((prev) => [...new Set([...prev, ...trainerIds])]);
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort(),
    );
  };

  const parseDurationToMinutes = (input: string): number | null => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return null;
    const match = trimmed.match(/^([0-9]+)\s*(m|h|d|w)?$/);
    if (!match) return null;
    const value = Number(match[1]);
    if (Number.isNaN(value) || value <= 0) return null;
    const unit = match[2] || "m";
    switch (unit) {
      case "m":
        return value;
      case "h":
        return value * 60;
      case "d":
        return value * 60 * 24;
      case "w":
        return value * 60 * 24 * 7;
      default:
        return null;
    }
  };

  const formatMinutesLabel = (minutes: number) => {
    if (minutes % (60 * 24 * 7) === 0) return `${minutes / (60 * 24 * 7)}w before`;
    if (minutes % (60 * 24) === 0) return `${minutes / (60 * 24)}d before`;
    if (minutes % 60 === 0 && minutes >= 60) return `${minutes / 60}h before`;
    return `${minutes}m before`;
  };

  const handleAddReminder = (value?: number) => {
    const parsed =
      typeof value === "number" ? value : parseDurationToMinutes(reminderInput);
    if (!parsed) {
      toast.error("Use numbers with optional m/h/d/w (e.g., 45m, 2h, 1d)");
      return;
    }
    setReminders((prev) => [...new Set([...prev, parsed])].sort((a, b) => a - b));
    setReminderInput("");
  };

  const handleRemoveReminder = (value: number) => {
    setReminders((prev) => prev.filter((r) => r !== value));
  };

  const handleAddAttachment = () => {
    if (!attachmentUrl.trim()) {
      toast.error("Attachment link is required");
      return;
    }
    const cleanUrl = attachmentUrl.trim();
    const label = getAttachmentLabel(cleanUrl);
    setAttachments((prev) => [...prev, { name: label, url: cleanUrl }]);
    setAttachmentUrl("");
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploadingAttachment(true);
    try {
      const uploads = await Promise.all(
        Array.from(fileList).map(async (file) => {
          const res = await uploadFileByType(file);
          if (res?.data?.url) {
            return {
              name:
                (res as any)?.data?.displayName ||
                res.data.originalName ||
                getAttachmentLabel(res.data.url, file.name),
              url: res.data.url,
            };
          }
          return null;
        }),
      );
      setAttachments((prev) => [
        ...prev,
        ...(uploads.filter(Boolean) as { name: string; url: string }[]),
      ]);
      toast.success("Attachment uploaded");
    } catch (err) {
      toast.error("Upload failed, please try again.");
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleAttendeeToggle = (userId: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  // const handleClearAttendees = () => {
  //   setSelectedAttendees([]);
  // };

  // Helper functions to check if all are selected
  const isAllCHWSelected = () => {
    const chwIds = users
      .filter((user) => ["TRAINEE", "TESTER"].includes(user.userRoles[0]?.name))
      .map((user) => user.id);
    return chwIds.length > 0 && chwIds.every((id) => selectedAttendees.includes(id));
  };

  const isAllFilteredSelected = () => {
    const filteredUsers = getFilteredUsers();
    return (
      filteredUsers.length > 0 &&
      filteredUsers.every((user) => selectedAttendees.includes(user.id))
    );
  };

  const isAllTrainersSelected = () => {
    const trainerIds = users
      .filter((user) => user.userRoles[0]?.name === "TRAINER")
      .map((user) => user.id);
    return (
      trainerIds.length > 0 &&
      trainerIds.every((id) => selectedAttendees.includes(id))
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredUsers = getFilteredUsers();
    const filteredIds = filteredUsers.map((user) => user.id);

    if (isAllFilteredSelected()) {
      // Unselect all filtered users
      setSelectedAttendees((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      // Select all filtered users
      setSelectedAttendees((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  };

  // Helper functions for external participants
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddExternalParticipant = () => {
    const email = externalEmailInput.trim().toLowerCase();
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (externalParticipants.includes(email)) {
      toast.error("This email is already added");
      return;
    }
    setExternalParticipants((prev) => [...prev, email]);
    setExternalEmailInput("");
  };

  const handleRemoveExternalParticipant = (email: string) => {
    setExternalParticipants((prev) => prev.filter((p) => p !== email));
  };

  const handleExternalEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddExternalParticipant();
    }
  };

  const handleDayClick = (date: Date) => {
    // Check if the selected date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      toast.error("Cannot create events on past dates");
      return;
    }

    // Always create a new event when clicking on a day, regardless of existing events
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const localDateString = `${year}-${month}-${day}`;
    setSelectedDateForForm(localDateString);
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const getEventTypeIcon = (type: string) => {
    switch (
      type.toUpperCase() // Handle case insensitivity
    ) {
      case "TRAINING":
        return <GraduationCap className='w-4 h-4' />;
      case "WEBINAR":
        return <Video className='w-4 h-4' />;
      case "MEETING":
        return <Users className='w-4 h-4' />;
      case "SCREENING":
        return <ClipboardCheck className='w-4 h-4' />;
      case "DRILL":
        return <AlertCircle className='w-4 h-4' />;
      default:
        return <CalendarIcon className='w-4 h-4' />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (
      type.toUpperCase() // Handle case insensitivity
    ) {
      case "TRAINING":
        return "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800";
      case "WEBINAR":
        return "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800";
      case "MEETING":
        return "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600";
      case "SCREENING":
        return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800";
      case "DRILL":
        return "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800";
      default:
        return "bg-slate-50 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "HIGH":
        return "text-red-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "LOW":
        return "text-green-600";
      case "URGENT":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  const isImageUrl = (url: string) => {
    const clean = (url || "").split("?")[0];
    return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(clean);
  };

  const getAttachmentLabel = (url: string, fallback?: string) => {
    const preferred = fallback?.trim();
    if (preferred) return preferred;
    const cleanUrl = (url || "").split("?")[0];
    const lastSegment = cleanUrl.split("/").filter(Boolean).pop() || cleanUrl;
    const withoutExt = lastSegment.replace(/\.[^/.]+$/, "");
    const maybeDouble = withoutExt.replace(/\.[^/.]+$/, "");
    const label = (withoutExt || maybeDouble).trim();
    return label || "Attachment";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <span className='inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full'>
            <CheckCircle className='w-3 h-3' />
            Confirmed
          </span>
        );
      case "pending":
        return (
          <span className='inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full'>
            <Clock className='w-3 h-3' />
            Pending
          </span>
        );
      case "scheduled":
        return (
          <span className='inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'>
            <CalendarIcon className='w-3 h-3' />
            Scheduled
          </span>
        );
      case "ongoing":
        return (
          <span className='inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full'>
            <Clock className='w-3 h-3' />
            Ongoing
          </span>
        );
      case "completed":
        return (
          <span className='inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full'>
            <CheckCircle className='w-3 h-3' />
            Completed
          </span>
        );
      default:
        return (
          <span className='px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full'>
            {status}
          </span>
        );
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    // Filter events based on search and filters
    const filteredEvents = events?.filter((event) => {
      const matchesSearch =
        !searchTerm ||
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === "all" || event.type === filterType;
      const matchesStatus =
        filterStatus === "all" ||
        (event.startAt &&
          event.endAt &&
          getEventStatus(event.startAt, event.endAt) === filterStatus);
      const matchesStatsFilter =
        !statsFilterType || event.type?.toUpperCase() === statsFilterType;

      return matchesSearch && matchesType && matchesStatus && matchesStatsFilter;
    });

    for (let i = 0; i < 42; i++) {
      const dayEvents = filteredEvents.filter(
        (event) =>
          event.startAt &&
          new Date(event.startAt).toDateString() === current.toDateString(),
      );

      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString(),
        events: dayEvents,
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const navigateDate = (direction: "prev" | "next") => {
    setCurrentDate((prev: Date) => {
      const newDate = new Date(prev);

      switch (selectedView) {
        case "month":
          newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
          break;
        case "week":
          newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
          break;
        case "day":
          newDate.setDate(prev.getDate() + (direction === "next" ? 1 : -1));
          break;
        default:
          newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      }

      return newDate;
    });
    // Clear stats filter when navigating to different periods
    setStatsFilterType(null);
  };

  const formatDate = (date: Date) => {
    switch (selectedView) {
      case "month": {
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
      }
      case "week": {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      }
      case "day": {
        return date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
      default: {
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });
      }
    }
  };

  const renderCalendarView = () => {
    switch (selectedView) {
      case "month":
        return renderMonthView();
      case "week":
        return renderWeekView();
      case "day":
        return renderDayView();
      default:
        return renderMonthView();
    }
  };

  const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const TYPE_DOT: Record<string, string> = {
    TRAINING: "bg-blue-500",
    WEBINAR: "bg-purple-500",
    MEETING: "bg-slate-500",
    SCREENING: "bg-emerald-500",
    DRILL: "bg-red-500",
  };
  const isRecurring = (event: any) => !!event.frequency && event.frequency !== "NONE";
  const ordinal = (n: number) => {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
  };
  const describeRecurrence = (
    freq: string | undefined,
    days: number[] | undefined,
    dayOfMonth: number | null,
    endsAt?: string | null,
  ) => {
    if (!freq || freq === "NONE") return "Does not repeat";
    let text = "Every day";
    if (freq === "WEEKLY") {
      text = days?.length
        ? `Every week on ${[...days].sort().map((d) => WEEKDAY_LABELS[d]).join(", ")}`
        : "Every week";
    } else if (freq === "MONTHLY") {
      text = dayOfMonth ? `Every month on the ${ordinal(dayOfMonth)}` : "Every month";
    }
    if (endsAt) {
      const end = new Date(endsAt.length === 10 ? `${endsAt}T00:00:00` : endsAt);
      text += ` until ${end.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    return text;
  };
  const timeOf = (value?: string) =>
    value
      ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";
  const matchesFilters = (event: any) => {
    if (filterType !== "all" && event.type !== filterType) return false;
    if (
      filterStatus !== "all" &&
      !(event.startAt && event.endAt && getEventStatus(event.startAt, event.endAt) === filterStatus)
    ) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        event.title?.toLowerCase().includes(q) ||
        event.description?.toLowerCase().includes(q) ||
        event.location?.toLowerCase().includes(q)
      );
    }
    return true;
  };

  const renderEventChip = (event: any) => (
    <div
      key={event.id}
      onClick={(e) => {
        e.stopPropagation();
        handleViewEvent(event);
      }}
      className={`flex items-center gap-1 text-[11px] font-semibold px-1.5 py-1 rounded-lg border ${getEventTypeColor(event.type)} cursor-pointer hover:shadow-sm transition-shadow`}
      title={`${event.title} · ${timeOf(event.startAt)} – ${timeOf(event.endAt)}`}
    >
      <span className='shrink-0 tabular-nums opacity-70'>{timeOf(event.startAt)}</span>
      <span className='truncate'>{event.title}</span>
      {isRecurring(event) && <Repeat className='w-3 h-3 shrink-0 opacity-70' />}
    </div>
  );

  const renderMonthView = () => (
    <div className={`${V2_CARD_SHELL} overflow-hidden`}>
      <div className={`grid grid-cols-7 ${V2_TABLE_HEAD}`}>
        {WEEKDAY_LABELS.map((day) => (
          <div key={day} className='py-2.5 text-center'>
            {day}
          </div>
        ))}
      </div>

      <div className='grid grid-cols-7'>
        {generateCalendarDays().map((day, index) => (
          <div
            key={index}
            onClick={() => handleDayClick(day.date)}
            className={`group min-h-[118px] p-1.5 border-b border-r border-[rgba(51,99,173,0.10)] dark:border-slate-700 cursor-pointer transition-colors ${
              (index + 1) % 7 === 0 ? "border-r-0" : ""
            } ${
              day.isCurrentMonth
                ? "bg-white dark:bg-card-bg hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40"
                : "bg-[#F8FAFC] dark:bg-slate-900/40"
            }`}
          >
            <div className='flex items-center justify-between mb-1'>
              <span
                className={
                  day.isToday
                    ? "w-6 h-6 rounded-full bg-[#3363AD] text-white text-[11px] font-bold flex items-center justify-center"
                    : `text-xs font-bold px-1 ${day.isCurrentMonth ? V2_STRONG : "text-[#B8C2D0] dark:text-slate-600"}`
                }
              >
                {day.date.getDate()}
              </span>
              <Plus className='w-3.5 h-3.5 text-[#9AA3B2] opacity-0 group-hover:opacity-100 transition-opacity' />
            </div>

            <div className='space-y-1'>
              {day.events.slice(0, 2).map(renderEventChip)}
              {day.events.length > 2 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedDate(
                      expandedDate?.toDateString() === day.date.toDateString()
                        ? null
                        : day.date,
                    );
                  }}
                  className='text-[11px] text-[#3363AD] dark:text-blue-300 hover:underline pl-1 font-bold'
                >
                  +{day.events.length - 2} more
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const weekDays: { date: Date; events: any[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dayEvents = events.filter(
        (event: any) =>
          event.startAt &&
          new Date(event.startAt).toDateString() === day.toDateString() &&
          matchesFilters(event),
      );
      weekDays.push({ date: day, events: dayEvents });
    }

    return (
      <div className={`${V2_CARD_SHELL} overflow-hidden`}>
        <div className={`grid grid-cols-8 ${V2_TABLE_HEAD}`}>
          <div className='py-2.5 text-center'>Time</div>
          {weekDays.map((day, index) => {
            const isToday = day.date.toDateString() === new Date().toDateString();
            return (
              <div key={index} className='py-2 text-center'>
                <div>{WEEKDAY_LABELS[index]}</div>
                <div
                  className={`mx-auto mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-sm normal-case tracking-normal ${
                    isToday ? "bg-[#3363AD] text-white" : V2_STRONG
                  }`}
                >
                  {day.date.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className='max-h-[640px] overflow-y-auto'>
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              className='grid grid-cols-8 border-b border-[rgba(51,99,173,0.08)] dark:border-slate-700'
            >
              <div className={`p-2 text-[11px] text-center tabular-nums ${V2_MUTED}`}>
                {hour.toString().padStart(2, "0")}:00
              </div>
              {weekDays.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className='p-1 border-l border-[rgba(51,99,173,0.08)] dark:border-slate-700 min-h-[44px] cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-slate-800/40 space-y-1'
                  onClick={() => handleDayClick(day.date)}
                >
                  {day.events
                    .filter((event: any) =>
                      event.startAt ? new Date(event.startAt).getHours() === hour : false,
                    )
                    .map(renderEventChip)}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = events
      .filter(
        (event: any) =>
          event.startAt &&
          new Date(event.startAt).toDateString() === currentDate.toDateString() &&
          matchesFilters(event),
      )
      .sort((a: any, b: any) =>
        a.startAt && b.startAt
          ? new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
          : 0,
      );

    return (
      <div className={`${V2_CARD_SHELL} overflow-hidden`}>
        <div className='px-5 py-4 border-b border-[rgba(51,99,173,0.12)] dark:border-slate-700 flex items-center justify-between'>
          <h3 className={V2_SECTION_TITLE}>
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <span className={`${V2_PILL} ${V2_PILL_BLUE}`}>
            {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
          </span>
        </div>

        {dayEvents.length === 0 ? (
          <div className='p-5'>
            <div className={V2_EMPTY}>
              <CalendarIcon className='w-10 h-10 mx-auto mb-3 text-[#C5D3E0]' />
              <p className={`text-sm font-bold ${V2_STRONG}`}>No events scheduled for this day</p>
              <button
                type='button'
                onClick={() => handleDayClick(currentDate)}
                className={`${V2_BTN_SECONDARY} mt-3`}
              >
                <Plus className='w-4 h-4' />
                Add event
              </button>
            </div>
          </div>
        ) : (
          <div className={V2_TABLE_BODY}>
            {dayEvents.map((event: any) => (
              <div key={event.id} className={`px-5 py-4 ${V2_TABLE_ROW}`}>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-start gap-3 min-w-0'>
                    <div className={`p-2 rounded-xl border ${getEventTypeColor(event.type)}`}>
                      {getEventTypeIcon(event.type)}
                    </div>
                    <div className='min-w-0'>
                      <h4 className={`font-bold flex items-center gap-1.5 ${V2_STRONG}`}>
                        <span className='truncate'>{event.title}</span>
                        {isRecurring(event) && (
                          <Repeat className='w-3.5 h-3.5 text-[#3363AD] dark:text-blue-300 shrink-0' />
                        )}
                      </h4>
                      <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-1 ${V2_MUTED}`}>
                        <span className='flex items-center gap-1'>
                          <Clock className='w-3.5 h-3.5' />
                          {timeOf(event.startAt)}
                          {event.endAt ? ` – ${timeOf(event.endAt)}` : ""}
                        </span>
                        {event.location && (
                          <span className='flex items-center gap-1'>
                            <MapPin className='w-3.5 h-3.5' />
                            {formatLocation(event.location)}
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <p className={`text-sm mt-2 line-clamp-2 ${V2_MUTED}`}>{event.description}</p>
                      )}
                    </div>
                  </div>
                  <div className='flex items-center gap-2 shrink-0'>
                    {getStatusBadge(
                      event.startAt && event.endAt
                        ? getEventStatus(event.startAt, event.endAt)
                        : "scheduled",
                    )}
                    {(isAdmin || (isCEHO && (event.createdById === user?.id || event.amOwner))) &&
                      event.meetingType === "EBUMENYI_MEETING" && (
                        <button
                          onClick={() => navigate(`/attendance/${event.id}`)}
                          className={`${V2_BTN_SECONDARY} px-2.5 py-1.5`}
                          title='View attendance'
                        >
                          <Users className='w-3.5 h-3.5' />
                        </button>
                      )}
                    <button
                      onClick={() => handleViewEvent(event)}
                      className={`${V2_BTN_SECONDARY} px-2.5 py-1.5`}
                      title='View details'
                    >
                      <Eye className='w-3.5 h-3.5' />
                    </button>
                    <button
                      onClick={() => {
                        setEditingEvent(event);
                        setShowEventModal(true);
                      }}
                      className={`${V2_BTN_SECONDARY} px-2.5 py-1.5`}
                      title='Edit event'
                    >
                      <Edit className='w-3.5 h-3.5' />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event)}
                      className={`${V2_BTN_SECONDARY} px-2.5 py-1.5 text-red-500 hover:text-red-600`}
                      title='Delete event'
                    >
                      <Trash2 className='w-3.5 h-3.5' />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const upcomingEvents = events
    .filter((event: any) => {
      const matchesStatsFilter =
        !statsFilterType || event.type?.toUpperCase() === statsFilterType;
      return (
        event.startAt &&
        new Date(event.startAt) >= new Date() &&
        matchesFilters(event) &&
        matchesStatsFilter
      );
    })
    .sort((a: any, b: any) =>
      a.startAt && b.startAt
        ? new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        : 0,
    )
    .slice(0, 4);

  const now = new Date();
  const todayKey = now.toDateString();
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const kpis = {
    today: events.filter((e: any) => e.startAt && new Date(e.startAt).toDateString() === todayKey).length,
    month: events.filter((e: any) => {
      if (!e.startAt) return false;
      const d = new Date(e.startAt);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    }).length,
    nextWeek: events.filter((e: any) => {
      if (!e.startAt) return false;
      const d = new Date(e.startAt);
      return d >= now && d <= inSevenDays;
    }).length,
    recurring: new Set(
      events.filter(isRecurring).map((e: any) => e.commonId ?? e.id),
    ).size,
  };

  const monthStats = (() => {
    const monthEvents = events.filter((event: any) => {
      const d = event.startAt ? new Date(event.startAt) : null;
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return [
      { type: "TRAINING", label: "Training" },
      { type: "WEBINAR", label: "Webinars" },
      { type: "MEETING", label: "Meetings" },
      { type: "SCREENING", label: "Screenings" },
      { type: "DRILL", label: "Drills" },
    ]
      .map((item) => ({
        ...item,
        count: monthEvents.filter((e: any) => e.type?.toUpperCase() === item.type).length,
      }))
      .filter((item) => item.count > 0);
  })();

  const openQuickAction = (defaults: any) => {
    setQuickActionDefaults(defaults);
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const quickActions = [
    {
      label: "Schedule training",
      Icon: GraduationCap,
      defaults: {
        type: "TRAINING",
        title: "Training Session",
        location: "Kigali Health Center",
        meetingType: "OTHER",
        instructor: "",
        attendees: 15,
      },
    },
    {
      label: "Plan screening",
      Icon: ClipboardCheck,
      defaults: {
        type: "SCREENING",
        title: "Health Screening",
        location: "Community Health Center",
        meetingType: "OTHER",
        coordinator: "",
        attendees: 45,
      },
    },
    {
      label: "Create webinar",
      Icon: Video,
      defaults: {
        type: "WEBINAR",
        title: "Health Webinar",
        hostEmail: profileEmail,
        meetingType: "EBUMENYI_MEETING",
        speaker: "",
        attendees: 120,
      },
    },
    {
      label: "Organize workshop",
      Icon: Users,
      defaults: {
        type: "TRAINING",
        title: "Health Workshop",
        location: "District Health Office",
        meetingType: "OTHER",
        facilitator: "",
        attendees: 25,
      },
    },
  ];

  const renderMiniCalendar = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array.from({ length: firstDay.getDay() }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    return (
      <div className={V2_CARD_SHELL_PADDED}>
        <div className='flex items-center justify-between mb-3'>
          <button
            onClick={() =>
              setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
            }
            className='p-1 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-slate-700'
          >
            <ChevronLeft className='w-4 h-4' />
          </button>
          <h3 className={V2_SECTION_TITLE}>
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h3>
          <button
            onClick={() =>
              setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
            }
            className='p-1 rounded-lg hover:bg-[#F1F5F9] dark:hover:bg-slate-700'
          >
            <ChevronRight className='w-4 h-4' />
          </button>
        </div>
        <div className='grid grid-cols-7 gap-1 mb-1'>
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className={`text-[10px] font-bold text-center ${V2_MUTED}`}>
              {d.slice(0, 1)}
            </div>
          ))}
        </div>
        <div className='grid grid-cols-7 gap-1'>
          {cells.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} />;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = date.toDateString() === todayKey;
            const isSelected = expandedDate?.toDateString() === date.toDateString();
            const hasEvents = events.some(
              (e: any) => e.startAt && new Date(e.startAt).toDateString() === date.toDateString(),
            );
            return (
              <button
                key={day}
                onClick={() => setExpandedDate(date)}
                className={`relative h-8 text-xs rounded-lg font-semibold transition-colors ${
                  isSelected
                    ? "bg-[#3363AD] text-white"
                    : isToday
                      ? "bg-[#EBF0F9] text-[#3363AD] dark:bg-slate-700 dark:text-blue-300"
                      : `${V2_STRONG} hover:bg-[#F1F5F9] dark:hover:bg-slate-700`
                }`}
              >
                {day}
                {hasEvents && !isSelected && (
                  <span className='absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#3363AD] dark:bg-blue-300' />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderUpcomingCard = () => (
    <div className={V2_CARD_SHELL_PADDED}>
      <div className='flex items-center gap-2 mb-3'>
        <Bell className='w-4 h-4 text-[#3363AD] dark:text-blue-300' />
        <h3 className={V2_SECTION_TITLE}>Upcoming</h3>
      </div>
      {upcomingEvents.length === 0 ? (
        <p className={`text-xs ${V2_MUTED}`}>No upcoming events</p>
      ) : (
        <div className='space-y-2'>
          {upcomingEvents.map((event: any) => (
            <button
              key={event.id}
              type='button'
              onClick={() => handleViewEvent(event)}
              className='w-full text-left flex gap-3 p-2 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 transition-colors'
            >
              <div className='w-10 shrink-0 rounded-lg bg-[#EBF0F9] dark:bg-slate-700 text-center py-1'>
                <p className='text-[9px] font-bold uppercase text-[#3363AD] dark:text-blue-300'>
                  {new Date(event.startAt).toLocaleString("default", { month: "short" })}
                </p>
                <p className={`text-sm font-bold leading-tight ${V2_STRONG}`}>
                  {new Date(event.startAt).getDate()}
                </p>
              </div>
              <div className='min-w-0 flex-1'>
                <p className={`text-xs font-bold truncate flex items-center gap-1 ${V2_STRONG}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOT[event.type?.toUpperCase()] ?? "bg-slate-400"}`} />
                  <span className='truncate'>{event.title}</span>
                  {isRecurring(event) && <Repeat className='w-3 h-3 shrink-0 text-[#9AA3B2]' />}
                </p>
                <p className={`text-[11px] mt-0.5 ${V2_MUTED}`}>
                  {timeOf(event.startAt)}
                  {event.endAt ? ` – ${timeOf(event.endAt)}` : ""}
                </p>
                {event.priority && (
                  <p className={`text-[10px] font-bold uppercase mt-0.5 ${getPriorityColor(event.priority)}`}>
                    {event.priority.toLowerCase()}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderMonthStatsCard = () => (
    <div className={V2_CARD_SHELL_PADDED}>
      <div className='flex items-center justify-between mb-3'>
        <h3 className={V2_SECTION_TITLE}>This month</h3>
        {statsFilterType && (
          <button
            onClick={() => setStatsFilterType(null)}
            className='text-[11px] font-bold text-[#3363AD] dark:text-blue-300 hover:underline'
          >
            Show all
          </button>
        )}
      </div>
      {monthStats.length === 0 ? (
        <p className={`text-xs ${V2_MUTED}`}>No events this month</p>
      ) : (
        <div className='space-y-1'>
          {monthStats.map((item) => (
            <button
              key={item.type}
              type='button'
              onClick={() => setStatsFilterType(statsFilterType === item.type ? null : item.type)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors ${
                statsFilterType === item.type
                  ? "bg-[#EBF0F9] dark:bg-slate-700"
                  : "hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60"
              }`}
            >
              <span className={`flex items-center gap-2 ${V2_MUTED}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${TYPE_DOT[item.type]}`} />
                {item.label}
              </span>
              <span className={`font-bold tabular-nums ${V2_STRONG}`}>{item.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderQuickActionsCard = () => (
    <div className={V2_CARD_SHELL_PADDED}>
      <h3 className={`${V2_SECTION_TITLE} mb-3`}>Quick actions</h3>
      <div className='grid grid-cols-2 gap-2'>
        {quickActions.map(({ label, Icon, defaults }) => (
          <button
            key={label}
            type='button'
            onClick={() => openQuickAction(defaults)}
            className='flex flex-col items-start gap-1.5 p-2.5 rounded-xl border border-[rgba(51,99,173,0.15)] dark:border-slate-600 hover:border-[#3363AD]/50 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/60 text-left transition-colors'
          >
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${V2_KPI_ICON_CHIP}`}>
              <Icon className='w-3.5 h-3.5' />
            </span>
            <span className={`text-[11px] font-bold leading-tight ${V2_STRONG}`}>{label}</span>
          </button>
        ))}
      </div>
      {(isAdmin || isCEHO || isStaff || isTrainer) && (
        <button
          onClick={() => navigate("/meetings")}
          className='w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-[#3363AD] dark:text-blue-300 hover:bg-[#EBF0F9] dark:hover:bg-slate-700 rounded-xl transition-colors'
        >
          <Video className='w-3.5 h-3.5' />
          Meetings & attendance
        </button>
      )}
    </div>
  );

  const VIEW_TABS: V2TabItem<"month" | "week" | "day">[] = [
    { key: "month", label: "Month" },
    { key: "week", label: "Week" },
    { key: "day", label: "Day" },
  ];

  return (
    <div className={V2_PAGE_CANVAS}>
      <V2PageHeader
        title='Calendar'
        subtitle='Manage training sessions, screenings, meetings and other events'
        actions={
          <>
            {(isAdmin || isCEHO || isStaff || isTrainer) && (
              <button onClick={() => navigate("/meetings")} className={V2_BTN_SECONDARY}>
                <Users className='w-4 h-4' />
                Meetings
              </button>
            )}
            {(isAdmin || isCEHO || effectiveRoles.has("TRAINEE") || effectiveRoles.has("TESTER")) && (
              <button
                onClick={() => navigate(isAdmin ? "/recordings" : "/recordings/watch")}
                className={V2_BTN_SECONDARY}
              >
                <Video className='w-4 h-4' />
                Recordings
              </button>
            )}
            <button onClick={() => setShowEventModal(true)} className={V2_BTN_PRIMARY}>
              <Plus className='w-4 h-4' />
              New event
            </button>
          </>
        }
      />

      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <V2KpiCard
          label='Today'
          value={kpis.today}
          Icon={CalendarCheck}
          sub={now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" })}
          onClick={() => {
            setCurrentDate(new Date());
            setSelectedView("day");
            setStatsFilterType(null);
          }}
        />
        <V2KpiCard
          label='Next 7 days'
          value={kpis.nextWeek}
          Icon={Clock}
          accent='text-amber-500 dark:text-amber-400'
          sub='Upcoming events'
          onClick={() => {
            setCurrentDate(new Date());
            setSelectedView("week");
            setStatsFilterType(null);
          }}
        />
        <V2KpiCard
          label={currentDate.toLocaleString("default", { month: "long" })}
          value={kpis.month}
          Icon={CalendarDays}
          accent='text-emerald-600 dark:text-emerald-400'
          sub='Events this month'
          onClick={() => setSelectedView("month")}
        />
        <V2KpiCard
          label='Recurring series'
          value={kpis.recurring}
          Icon={Repeat}
          accent='text-purple-600 dark:text-purple-400'
          sub='Daily, weekly or monthly'
        />
      </div>

      <div className={`${V2_CARD_SHELL} p-3 flex flex-col xl:flex-row xl:items-center gap-3`}>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => navigateDate("prev")}
            className='p-2 rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-slate-700'
            title='Previous'
          >
            <ChevronLeft className='w-5 h-5' />
          </button>
          <button
            onClick={() => navigateDate("next")}
            className='p-2 rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-slate-700'
            title='Next'
          >
            <ChevronRight className='w-5 h-5' />
          </button>
          <h2 className={`text-lg font-bold min-w-[11rem] ${V2_STRONG}`}>{formatDate(currentDate)}</h2>
          <button
            onClick={() => {
              setCurrentDate(new Date());
              setExpandedDate(null);
            }}
            className={`${V2_BTN_SECONDARY} px-3 py-1.5`}
          >
            Today
          </button>
        </div>

        <div className='flex flex-1 flex-col md:flex-row md:items-center gap-2 xl:justify-end'>
          <V2SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder='Search events...'
            className='w-full md:w-60'
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-3 py-2 text-sm ${V2_INPUT}`}
          >
            <option value='all'>All types</option>
            <option value='TRAINING'>Training</option>
            <option value='WEBINAR'>Webinar</option>
            <option value='MEETING'>Meeting</option>
            <option value='SCREENING'>Screening</option>
            <option value='DRILL'>Drill</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={`px-3 py-2 text-sm ${V2_INPUT}`}
          >
            <option value='all'>All statuses</option>
            <option value='confirmed'>Confirmed</option>
            <option value='pending'>Pending</option>
            <option value='scheduled'>Scheduled</option>
          </select>
          <V2Tabs
            items={VIEW_TABS}
            active={selectedView}
            onChange={(view) => {
              setSelectedView(view);
              // Stats are month-specific
              if (view !== "month") setStatsFilterType(null);
            }}
          />
        </div>
      </div>

      {expandedDate ? (
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
          <div className='space-y-4'>
            {renderMiniCalendar()}
            {renderUpcomingCard()}
            {renderMonthStatsCard()}
          </div>

          <div className={`lg:col-span-3 ${V2_CARD_SHELL} overflow-hidden self-start`}>
            <div className='px-5 py-4 border-b border-[rgba(51,99,173,0.12)] dark:border-slate-700 flex items-center justify-between gap-3'>
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-wider ${V2_MUTED}`}>Events on</p>
                <h3 className={`text-lg font-bold ${V2_STRONG}`}>
                  {expandedDate.toLocaleDateString("default", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
              </div>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => handleDayClick(expandedDate)}
                  className={V2_BTN_PRIMARY}
                >
                  <Plus className='w-4 h-4' />
                  Add event
                </button>
                <button
                  onClick={() => setExpandedDate(null)}
                  className={`${V2_BTN_SECONDARY} px-3`}
                  title='Back to calendar'
                >
                  ✕
                </button>
              </div>
            </div>

            {(() => {
              const dateEvents = events.filter(
                (event: any) =>
                  event.startAt &&
                  new Date(event.startAt).toDateString() === expandedDate.toDateString() &&
                  matchesFilters(event),
              );

              if (dateEvents.length === 0) {
                return (
                  <div className='p-5'>
                    <div className={V2_EMPTY}>
                      <CalendarIcon className='w-10 h-10 mx-auto mb-3 text-[#C5D3E0]' />
                      <p className={`text-sm font-bold ${V2_STRONG}`}>No events on this date</p>
                    </div>
                  </div>
                );
              }

              return (
                <div className='p-4 grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {dateEvents.map((event: any) => (
                    <button
                      key={event.id}
                      type='button'
                      onClick={() => {
                        handleViewEvent(event);
                        setExpandedDate(null);
                      }}
                      className={`text-left p-3 rounded-2xl border border-l-4 hover:shadow-md transition-shadow ${getEventTypeColor(event.type)}`}
                    >
                      <div className='flex items-start justify-between gap-2'>
                        <div className='min-w-0'>
                          <div className='flex items-center gap-1.5'>
                            {getEventTypeIcon(event.type)}
                            <h4 className='font-bold text-sm truncate'>{event.title}</h4>
                            {isRecurring(event) && <Repeat className='w-3.5 h-3.5 shrink-0 opacity-70' />}
                          </div>
                          <p className='text-xs mt-1 opacity-80'>
                            {timeOf(event.startAt)}
                            {event.endAt ? ` – ${timeOf(event.endAt)}` : ""}
                          </p>
                          {event.location && (
                            <p className='flex items-center gap-1 text-xs mt-1 opacity-70'>
                              <MapPin className='w-3 h-3 shrink-0' />
                              <span className='truncate'>{formatLocation(event.location)}</span>
                            </p>
                          )}
                        </div>
                        {event.priority && (
                          <span className={`text-[10px] font-bold uppercase whitespace-nowrap ${getPriorityColor(event.priority)}`}>
                            {event.priority.toLowerCase()}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
          <div className='lg:col-span-3'>{renderCalendarView()}</div>
          <div className='space-y-4'>
            {renderUpcomingCard()}
            {renderMonthStatsCard()}
            {renderQuickActionsCard()}
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20'>
          <div className='bg-white rounded-lg shadow-xl p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto scrollbar-hide'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-2xl font-semibold text-gray-900'>
                {selectedEvent.title}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className='text-gray-400 hover:text-gray-600 text-2xl'
              >
                ×
              </button>
            </div>

            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h4 className='font-semibold text-gray-900 mb-3'>Event Details</h4>
                  <div className='space-y-3'>
                    <div className='flex items-center gap-3'>
                      <CalendarIcon className='w-5 h-5 text-gray-400' />
                      <span className='text-gray-700'>
                        {selectedEvent.startAt
                          ? new Date(selectedEvent.startAt).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              },
                            )
                          : ""}
                      </span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <Clock className='w-5 h-5 text-gray-400' />
                      <span className='text-gray-700'>
                        {selectedEvent.startAt
                          ? new Date(selectedEvent.startAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}{" "}
                        -{" "}
                        {selectedEvent.endAt
                          ? new Date(selectedEvent.endAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                    <div className='flex items-center gap-3'>
                      {selectedEvent.meetingType === "OTHER" ? (
                        <MapPin className='w-5 h-5 text-gray-400' />
                      ) : (
                        <Video className='w-5 h-5 text-gray-400' />
                      )}
                      {selectedEvent.meetingType === "OTHER" ? (
                        <span className='text-gray-700'>
                          {formatLocation(selectedEvent.location)}
                        </span>
                      ) : (
                          <div className='flex items-center gap-2 flex-wrap'>
                            <span className='text-gray-700'>
                              {formatLocation(selectedEvent.location)}
                            </span>
                            <button
                              onClick={async () => {
                                const urlToCopy = getCleanMeetingUrl(selectedEvent.location || "");
                                if (!urlToCopy) {
                                  toast.error("No link available to copy");
                                  return;
                                }
                                try {
                                  if (navigator.clipboard && navigator.clipboard.writeText) {
                                    await navigator.clipboard.writeText(urlToCopy);
                                  } else {
                                    const textArea = document.createElement("textarea");
                                    textArea.value = urlToCopy;
                                    document.body.appendChild(textArea);
                                    textArea.select();
                                    document.execCommand("copy");
                                    document.body.removeChild(textArea);
                                  }
                                  toast.success("Link copied to clipboard");
                                } catch (err) {
                                  toast.error("Failed to copy link");
                                }
                              }}
                              className='text-gray-500 hover:text-gray-700 p-1'
                              title='Copy link'
                            >
                              <Copy className='w-4 h-4' />
                            </button>
                            {selectedEvent.location && (selectedEvent.location.startsWith("http") || selectedEvent.location.includes("/meeting/")) && (
                              <a
                                href={getCleanMeetingUrl(selectedEvent.location)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-white rounded-lg text-xs font-medium hover:bg-[#4d81d2] transition-colors ml-2"
                              >
                                <Video className="w-3.5 h-3.5" />
                                Join Meeting
                              </a>
                            )}
                          </div>
                      )}
                    </div>
                    <div className='flex items-center gap-3'>
                      <Users className='w-5 h-5 text-gray-400' />
                      <span className='text-gray-700'>
                        {(selectedEvent.participants?.length || 0) +
                          (selectedEvent.externalParticipants?.length || 0)}{" "}
                        total participants
                        {selectedEvent.participants?.length > 0 &&
                          selectedEvent.externalParticipants?.length > 0 &&
                          ` (${selectedEvent.participants.length} internal + ${selectedEvent.externalParticipants.length} external)`}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className='font-semibold text-gray-900 mb-3'>Event Info</h4>
                  <div className='space-y-3'>
                    <div>
                      <span className='text-sm text-gray-500'>Type:</span>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ml-2 ${getEventTypeColor(selectedEvent.type)}`}
                      >
                        {getEventTypeIcon(selectedEvent.type)}
                        {selectedEvent.type}
                      </div>
                    </div>
                    <div>
                      <span className='text-sm text-gray-500'>Status:</span>
                      <span className='ml-2'>
                        {getStatusBadge(
                          selectedEvent.startAt && selectedEvent.endAt
                            ? getEventStatus(
                                selectedEvent.startAt,
                                selectedEvent.endAt,
                              )
                            : "scheduled",
                        )}
                      </span>
                    </div>
                    <div>
                      <span className='text-sm text-gray-500'>Priority:</span>
                      <span
                        className={`ml-2 font-medium ${getPriorityColor(selectedEvent.priority)}`}
                      >
                        {selectedEvent.priority.toLowerCase()}
                      </span>
                    </div>
                    {selectedEvent.instructor && (
                      <div>
                        <span className='text-sm text-gray-500'>Instructor:</span>
                        <span className='ml-2 text-gray-700'>
                          {selectedEvent.instructor}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendees List */}
              {((selectedEvent.participants &&
                selectedEvent.participants.length > 0) ||
                (selectedEvent.externalParticipants &&
                  selectedEvent.externalParticipants.length > 0)) && (
                <div>
                  <h4 className='font-semibold text-gray-900 mb-3'>
                    Participants (
                    {(selectedEvent.participants?.length || 0) +
                      (selectedEvent.externalParticipants?.length || 0)}
                    )
                  </h4>

                  {/* Internal Attendees */}
                  {selectedEvent.participants &&
                    selectedEvent.participants.length > 0 && (
                      <div className='mb-4'>
                        <h5 className='text-sm font-medium text-gray-700 mb-2'>
                          Internal Attendees ({selectedEvent.participants.length})
                        </h5>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
                          {selectedEvent.participants.map((participant: any) => (
                            <div
                              key={participant.id}
                              className='flex items-center gap-3 p-2 bg-gray-50 rounded-lg'
                            >
                              <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                                <span className='text-sm font-medium text-blue-800'>
                                  {participant.user?.fullNames
                                    ?.split(" ")
                                    .map((n: string) => n[0])
                                    .join("") || "?"}
                                </span>
                              </div>
                              <div>
                                <div className='font-medium text-sm'>
                                  {participant.user?.fullNames || "Unknown"}
                                </div>
                                <div className='text-xs text-gray-600'>
                                  {participant.role || "Attendee"} •{" "}
                                  {participant.user?.phoneNumber || ""}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* External Participants */}
                  {selectedEvent.externalParticipants &&
                    selectedEvent.externalParticipants.length > 0 && (
                      <div>
                        <h5 className='text-sm font-medium text-gray-700 mb-2'>
                          External Participants (
                          {selectedEvent.externalParticipants.length})
                        </h5>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
                          {selectedEvent.externalParticipants.map(
                            (participant: any, index: number) => (
                              <div
                                key={index}
                                className='flex items-center gap-3 p-2 bg-orange-50 rounded-lg'
                              >
                                <div className='w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center'>
                                  <span className='text-sm font-medium text-orange-800'>
                                    {participant.email &&
                                    typeof participant.email === "string" &&
                                    participant.email.length > 0
                                      ? participant.email.charAt(0).toUpperCase()
                                      : "?"}
                                  </span>
                                </div>
                                <div>
                                  <div className='font-medium text-sm'>
                                    {participant.email || "Unknown"}
                                  </div>
                                  <div className='text-xs text-gray-600'>
                                    External • Email invitation
                                  </div>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {(selectedEvent.reminderMinutesBefore?.length > 0 ||
                selectedEvent.attachments?.length > 0 ||
                selectedEvent.frequency !== "NONE") && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                  {selectedEvent.frequency !== "NONE" && (
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-3'>Repeats</h4>
                      <p className='text-sm text-gray-700 flex items-center gap-2'>
                        <Repeat className='w-4 h-4 text-primary shrink-0' />
                        {describeRecurrence(
                          selectedEvent.frequency,
                          selectedEvent.daysOfWeek,
                          selectedEvent.startAt ? new Date(selectedEvent.startAt).getDate() : null,
                          selectedEvent.recurrenceEndsAt,
                        )}
                      </p>
                    </div>
                  )}
                  {selectedEvent.reminderMinutesBefore?.length > 0 && (
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-3'>Reminders</h4>
                      <div className='flex flex-wrap gap-2'>
                        {selectedEvent.reminderMinutesBefore.map((r: number) => (
                          <span
                            key={r}
                            className='px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm'
                          >
                            {r} min before
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedEvent.attachments?.length > 0 && (
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-3'>
                        Attachments
                      </h4>
                      <div className='space-y-2'>
                        {selectedEvent.attachments.map((att: any, index: number) => {
                          const isImage = isImageUrl(att.url);
                          return (
                            <div
                              key={index}
                              className='flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 hover:border-primary/70 hover:shadow-sm transition'
                            >
                              {isImage ? (
                                <img
                                  src={att.url}
                                  alt={att.name || "Attachment preview"}
                                  className='w-14 h-14 rounded-lg object-cover border border-slate-200'
                                />
                              ) : (
                                <div className='w-14 h-14 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 flex items-center justify-center'>
                                  <FileText className='w-5 h-5' />
                                </div>
                              )}
                              <div className='flex-1 min-w-0'>
                                <div className='font-medium text-sm text-slate-900 truncate'>
                                  {att.name || "Attachment"}
                                </div>
                                <a
                                  href={att.url}
                                  target='_blank'
                                  rel='noreferrer'
                                  className='text-xs text-primary hover:underline break-all'
                                >
                                  {isImage ? "Open preview" : "Open file"}
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h4 className='font-semibold text-gray-900 mb-3'>Description</h4>
                <p className='text-gray-700 leading-relaxed'>
                  {selectedEvent.description}
                </p>
              </div>

              <div className='flex items-center justify-end gap-3 pt-6 border-t flex-wrap'>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  disabled={deleteEventMutation.isPending}
                  className='px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Close
                </button>
                {(isAdmin || (isCEHO && (selectedEvent.createdById === user?.id || selectedEvent.amOwner))) && selectedEvent.meetingType === 'EBUMENYI_MEETING' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      navigate(`/attendance/${selectedEvent.id}`);
                    }}
                    className='flex items-center gap-2 px-4 py-2 bg-blue-50 text-primary border border-primary/20 rounded-lg font-medium hover:bg-blue-100 transition-colors'
                  >
                    <Users className='w-4 h-4' />
                    Attendance
                  </button>
                )}
                {selectedEvent.amOwner && (
                  <>
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent)}
                      disabled={deleteEventMutation.isPending}
                      className='px-4 py-2 text-red-700 bg-red-100 rounded-lg hover:bg-red-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <Trash2 className='w-4 h-4 inline mr-2' />{" "}
                      {deleteEventMutation.isPending ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      onClick={() => {
                        setEditingEvent(selectedEvent);
                        setShowEventModal(true);
                        setShowDetailsModal(false);
                      }}
                      disabled={
                        deleteEventMutation.isPending ||
                        updateEventMutation.isPending
                      }
                      className='px-4 py-2  bg-primary text-white rounded-lg  font-medium hover:bg-[#4d81d2] disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <Edit className='w-4 h-4  inline mr-2' />{" "}
                      {updateEventMutation.isPending ? "Loading..." : "Edit"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Event Modal */}
      {showEventModal && (
        <div className='fixed inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-blue-900/50 backdrop-blur-sm flex items-center justify-center z-20'>
          <div className='bg-white/90 backdrop-blur-2xl border border-white/60 shadow-2xl rounded-3xl p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto scrollbar-hide'>
            <div className='flex items-center justify-between mb-6'>
              <h3 className='text-2xl font-semibold text-gray-900'>
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h3>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                  setQuickActionDefaults(null);
                  setSelectedDateForForm(null);
                  setFormDate("");
                  setSelectedMeetingType("EBUMENYI_MEETING");
                  setFrequency("NONE");
                  setIsRepeating(false);
                  setDaysOfWeek([]);
                  setRecurrenceEnd("");
                  setSelectedAttendees([]);
                  setExternalParticipants([]);
                  setExternalEmailInput("");
                  setAttendeeSearchTerm("");
                  setAttendeeFilterRole("all");
                  setAttendeeFilterHospital("all");
                  setAttendeeFilterDistrict("all");
                  setAttendeeFilterSector("all");
                  setAttendeeFilterCell("all");
                  setAttendeeFilterVillage("all");
                  setReminders([30]);
                  setReminderInput("");
                  setAttachments([]);
                  setAttachmentUrl("");
                  setIsUploadingAttachment(false);
                }}
                className='text-gray-400 hover:text-gray-600 text-2xl'
              >
                ×
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const startTime = formData.get("startTime") as string;
                const endTime = formData.get("endTime") as string;
                const timeRange =
                  startTime && endTime ? `${startTime} - ${endTime}` : startTime;

                const eventData = {
                  title: formData.get("title"),
                  type: formData.get("type"),
                  date: new Date(formData.get("date") as string),
                  time: timeRange,
                  location:
                    editingEvent &&
                    formData.get("meetingType") === "EBUMENYI_MEETING"
                      ? editingEvent.location
                      : formData.get("location"),
                  hostEmail: formData.get("hostEmail"),
                  meetingType: formData.get("meetingType"),
                  description: formData.get("description"),
                  priority: formData.get("priority"),
                  attendees: selectedAttendees,
                  externalParticipants: externalParticipants,
                  reminders,
                  attachments,
                  frequency,
                  daysOfWeek,
                  recurrenceEndsAt: recurrenceEnd ? new Date(recurrenceEnd) : null,
                };

                // If editing a recurring event, show occurrence mode dialog first
                if (
                  editingEvent &&
                  editingEvent.isRepeating &&
                  editingEvent.commonId
                ) {
                  setOccurrenceActionType("edit");
                  setShowOccurrenceActionDialog(true);
                  // Store the event data temporarily for use after mode selection
                  (window as any).__pendingEditData = {
                    ...eventData,
                    id: editingEvent.id,
                  };
                  return;
                }

                const success = await handleCreateEvent({
                  ...eventData,
                  ...(editingEvent ? { id: editingEvent.id } : {}),
                });

                // Only clear form if submission was successful
                if (success) {
                  setQuickActionDefaults(null);
                  setSelectedDateForForm(null);
                  setFormDate("");
                  setSelectedMeetingType("EBUMENYI_MEETING");
                  setFrequency("NONE");
                  setIsRepeating(false);
                  setDaysOfWeek([]);
                  setRecurrenceEnd("");
                  setSelectedAttendees([]);
                  setExternalParticipants([]);
                  setExternalEmailInput("");
                  setReminders([30]);
                  setReminderInput("");
                  setAttachments([]);
                  setAttachmentUrl("");
                  setIsUploadingAttachment(false);
                  setAttendeeSearchTerm("");
                  setAttendeeFilterRole("all");
                  setAttendeeFilterHospital("all");
                  setAttendeeFilterDistrict("all");
                  setAttendeeFilterSector("all");
                  setAttendeeFilterCell("all");
                  setAttendeeFilterVillage("all");
                }
              }}
            >
              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-2'>
                  <TextField
                    label='Event Title *'
                    type='text'
                    name='title'
                    defaultValue={
                      editingEvent?.title || quickActionDefaults?.title || ""
                    }
                    placeholder='Enter event title'
                  />

                  <div>
                    <OptionsField
                      label='Event Type *'
                      name='type'
                      options={[
                        { value: "TRAINING", label: "Training" },
                        { value: "WEBINAR", label: "Webinar" },
                        { value: "MEETING", label: "Meeting" },
                        { value: "SCREENING", label: "Screening" },
                        { value: "DRILL", label: "Drill" },
                      ]}
                      value={selectedEventType}
                      onChange={(value) => setSelectedEventType(value)}
                      defaultLabel='Select event type...'
                      required={true}
                    />
                  </div>
                </div>

                <input type='hidden' name='meetingType' value={isAdmin || isCEHO ? 'EBUMENYI_MEETING' : 'OTHER'} />
                <div>
                  <OptionsField
                    label='Priority'
                    name='priority'
                    options={[
                      { value: "LOW", label: "Low" },
                      { value: "MEDIUM", label: "Medium" },
                      { value: "HIGH", label: "High" },
                      { value: "URGENT", label: "Urgent" },
                    ]}
                    defaultValue={editingEvent?.priority || "MEDIUM"}
                    defaultLabel='Select priority...'
                    required={false}
                  />
                  {(isAdmin || isCEHO) && (
                    <input
                      type='hidden'
                      name='hostEmail'
                      value={
                        profileEmail ||
                        editingEvent?.hostEmail ||
                        quickActionDefaults?.hostEmail ||
                        user?.email ||
                        ""
                      }
                    />
                  )}
                </div>

                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Date{" "}
                      {editingEvent?.isRepeating && (
                        <span className='text-xs text-gray-500'>
                          (read-only for repeating events)
                        </span>
                      )}
                      *
                    </label>
                    <input
                      type='date'
                      name='date'
                      min={getTodayDate()}
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      disabled={editingEvent?.isRepeating}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        editingEvent?.isRepeating
                          ? "bg-gray-100 cursor-not-allowed opacity-60"
                          : ""
                      }`}
                      required
                    />
                  </div>
                  <TextField
                    label='Start Time *'
                    type='time'
                    name='startTime'
                    defaultValue={
                      editingEvent?.startAt
                        ? new Date(editingEvent.startAt).toTimeString().slice(0, 5)
                        : getDefaultTime()
                    }
                  />
                  <TextField
                    label='End Time *'
                    type='time'
                    name='endTime'
                    defaultValue={
                      editingEvent?.endAt
                        ? new Date(editingEvent.endAt).toTimeString().slice(0, 5)
                        : getEndTime(
                            editingEvent?.startAt
                              ? new Date(editingEvent.startAt)
                                  .toTimeString()
                                  .slice(0, 5)
                              : getDefaultTime(),
                          )
                    }
                  />
                </div>
              </div>

              {/* Recurrence */}
              <div className='mt-4 rounded-3xl border border-white/70 bg-gradient-to-br from-white via-slate-50 to-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.2)] p-4'>
                <div className='flex items-center justify-between mb-4'>
                  <div>
                    <p className='text-[11px] uppercase tracking-[0.08em] text-slate-500'>
                      Repeat
                    </p>
                    <h4 className='text-lg font-semibold text-slate-900'>
                      Plan cadence
                    </h4>
                  </div>
                  <div className='bg-slate-100 rounded-full p-1 flex gap-1'>
                    <button
                      type='button'
                      onClick={() => {
                        setIsRepeating(false);
                        setFrequency("NONE");
                        setDaysOfWeek([]);
                        setRecurrenceEnd("");
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full transition ${
                        !isRepeating
                          ? "bg-white shadow text-slate-900"
                          : "text-slate-600"
                      }`}
                    >
                      Do not repeat
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        setIsRepeating(true);
                        if (frequency === "NONE") setFrequency("DAILY");
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full transition ${
                        isRepeating
                          ? "bg-white shadow text-slate-900"
                          : "text-slate-600"
                      }`}
                    >
                      Repeat
                    </button>
                  </div>
                </div>

                {isRepeating && (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-3'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Frequency
                        </label>
                        <div className='grid grid-cols-3 gap-1 bg-slate-100 rounded-lg p-1'>
                          {[
                            { value: "DAILY", label: "Daily" },
                            { value: "WEEKLY", label: "Weekly" },
                            { value: "MONTHLY", label: "Monthly" },
                          ].map((opt) => {
                            const active = (frequency === "NONE" ? "DAILY" : frequency) === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type='button'
                                onClick={() => {
                                  setFrequency(opt.value);
                                  setIsRepeating(true);
                                }}
                                className={`py-1.5 text-sm rounded-md font-medium transition ${
                                  active
                                    ? "bg-white shadow text-primary"
                                    : "text-slate-600 hover:text-slate-900"
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Ends On{" "}
                          {isRepeating && <span className='text-red-500'>*</span>}
                          {editingEvent?.isRepeating &&
                            occurrenceActionMode === "single" && (
                              <span className='text-xs text-gray-500'>
                                (read-only)
                              </span>
                            )}
                          {editingEvent?.isRepeating &&
                            (occurrenceActionMode === "all" ||
                              occurrenceActionMode === "future") && (
                              <span className='text-xs text-blue-600'>
                                (editable - change to expand/reduce range)
                              </span>
                            )}
                        </label>
                        <input
                          type='date'
                          value={recurrenceEnd}
                          min={formDate || getTodayDate()}
                          onChange={(e) => setRecurrenceEnd(e.target.value)}
                          disabled={
                            editingEvent?.isRepeating &&
                            occurrenceActionMode === "single"
                          }
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            editingEvent?.isRepeating &&
                            occurrenceActionMode === "single"
                              ? "bg-gray-100 cursor-not-allowed opacity-60"
                              : ""
                          }`}
                          required={isRepeating}
                        />
                      </div>
                    </div>

                    {frequency === "WEEKLY" && (
                      <div>
                        <p className='text-sm text-slate-600 mb-2'>Repeat on</p>
                        <div className='grid grid-cols-7 gap-2'>
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                            (label, idx) => (
                              <button
                                key={label}
                                type='button'
                                onClick={() => toggleDayOfWeek(idx)}
                                className={`py-2 rounded-xl border text-sm ${
                                  daysOfWeek.includes(idx)
                                    ? "bg-primary text-white border-primary"
                                    : "border-slate-200 text-slate-700 hover-border-primary/60"
                                }`}
                              >
                                {label}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                    <div className='flex items-start gap-3 text-sm text-slate-700 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl'>
                      <Repeat className='w-4 h-4 text-primary mt-0.5 shrink-0' />
                      <div>
                        <p className='font-medium'>
                          {describeRecurrence(
                            frequency === "NONE" ? "DAILY" : frequency,
                            daysOfWeek,
                            formDate ? Number(formDate.split("-")[2]) : null,
                            recurrenceEnd || null,
                          )}
                        </p>
                        {frequency === "MONTHLY" && !formDate && (
                          <p className='text-xs text-slate-500 mt-0.5'>
                            Pick the event date to set the day of the month.
                          </p>
                        )}
                        {frequency === "MONTHLY" &&
                          formDate &&
                          Number(formDate.split("-")[2]) > 28 && (
                            <p className='text-xs text-slate-500 mt-0.5'>
                              In months without day {Number(formDate.split("-")[2])}, it
                              happens on the last day of the month.
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reminders & Attachments */}
              <div className='mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4'>
                <div className='rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white shadow-inner p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div>
                      <p className='text-[11px] uppercase tracking-[0.08em] text-slate-500'>
                        Reminders
                      </p>
                      <h4 className='text-lg font-semibold text-slate-900'>
                        Alert me before
                      </h4>
                    </div>
                  </div>
                  <div className='flex flex-wrap gap-2 mb-3'>
                    {quickReminderOptions.map((opt) => (
                      <button
                        key={opt.label}
                        type='button'
                        onClick={() => handleAddReminder(opt.minutes)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          reminders.includes(opt.minutes)
                            ? "bg-primary text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className='flex items-center gap-2 mb-3'>
                    <input
                      type='number'
                      min={1}
                      value={reminderInput}
                      onChange={(e) => setReminderInput(e.target.value)}
                      placeholder='Custom (e.g., 45m, 2h, 1d)'
                      className='flex-1 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm'
                    />
                    <button
                      type='button'
                      onClick={() => handleAddReminder()}
                      className='px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium shadow-sm hover:bg-[#4d81d2]'
                    >
                      Add
                    </button>
                  </div>
                  {reminders.length > 0 && (
                    <div className='flex flex-wrap gap-2'>
                      {reminders.map((r) => (
                        <div
                          key={r}
                          className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-sm shadow'
                        >
                          <span>{formatMinutesLabel(r)}</span>
                          <button
                            type='button'
                            onClick={() => handleRemoveReminder(r)}
                            className='text-white/80 hover:text-white'
                            aria-label='Remove reminder'
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className='rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-white shadow-inner p-4'>
                  <div className='flex items-center justify-between mb-3'>
                    <div>
                      <p className='text-[11px] uppercase tracking-[0.08em] text-slate-500'>
                        Attachments
                      </p>
                      <h4 className='text-lg font-semibold text-slate-900'>
                        Add docs & links
                      </h4>
                    </div>
                    <span className='px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-700'>
                      Optional
                    </span>
                  </div>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleUploadFiles(e.dataTransfer.files);
                    }}
                    className='mb-3 border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center text-sm text-slate-600 bg-slate-50 hover:border-primary/60 transition'
                  >
                    <p className='font-medium text-slate-800'>Drag & drop files</p>
                    <p className='text-xs text-slate-500 mb-2'>Images, PDFs, docs</p>
                    <label className='px-3 py-2 bg-primary text-white rounded-xl shadow cursor-pointer'>
                      <input
                        type='file'
                        multiple
                        className='hidden'
                        onChange={(e) => handleUploadFiles(e.target.files)}
                      />
                      {isUploadingAttachment ? "Uploading..." : "Choose files"}
                    </label>
                  </div>

                  <div className='mb-3'>
                    <input
                      type='url'
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      placeholder='Paste a link (image, PDF, doc...)'
                      className='w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm'
                    />
                  </div>
                  <button
                    type='button'
                    onClick={handleAddAttachment}
                    className='w-full mb-3 px-4 py-2 rounded-xl border border-dashed border-slate-300 text-sm text-slate-700 hover:border-primary hover:text-primary transition-colors'
                  >
                    + Add attachment
                  </button>
                  {attachments.length > 0 && (
                    <div className='space-y-2'>
                      {attachments.map((att, index) => (
                        <div
                          key={`${att.url}-${index}`}
                          className='flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-100 text-sm border border-slate-200'
                        >
                          {isImageUrl(att.url) ? (
                            <img
                              src={att.url}
                              alt={att.name || "Attachment preview"}
                              className='w-12 h-12 rounded-lg object-cover border border-slate-200'
                            />
                          ) : (
                            <div className='w-12 h-12 rounded-lg border border-slate-200 bg-white text-slate-500 flex items-center justify-center'>
                              <FileText className='w-4 h-4' />
                            </div>
                          )}
                          <div className='flex-1 min-w-0'>
                            <span className='font-medium text-slate-900 truncate block'>
                              {att.name || getAttachmentLabel(att.url)}
                            </span>
                            <a
                              href={att.url}
                              target='_blank'
                              rel='noreferrer'
                              className='text-primary hover:underline break-all'
                            >
                              {isImageUrl(att.url) ? "Open preview" : "Open file"}
                            </a>
                          </div>
                          <button
                            type='button'
                            onClick={() => handleRemoveAttachment(index)}
                            className='text-slate-500 hover:text-red-500 text-lg'
                            aria-label='Remove attachment'
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {(isAdmin || isCEHO) && (
                <>
                  {/* Attendees Selection */}
                  <div className='mt-6'>
                    <label className='block text-sm font-medium text-gray-700 mb-3'>
                      Select Attendees
                    </label>

                    {/* Quick Select Buttons */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-2 mb-4'>
                      <TextField
                        type='text'
                        placeholder='Search by name or phone'
                        value={attendeeSearchTerm}
                        onChange={(e) => setAttendeeSearchTerm(e.target.value)}
                        additionalClass='px-3 py-2 text-sm'
                      />
                      <button
                        type='button'
                        onClick={handleSelectAllFiltered}
                        className={`px-3 py-1 rounded-lg text-sm ${isAllFilteredSelected() ? "bg-primary text-white" : "bg-gray-100 text-gray-800"}`}
                      >
                        {isAllFilteredSelected()
                          ? "Unselect Filtered"
                          : "Select Filtered"}
                      </button>
                      <button
                        type='button'
                        onClick={handleSelectAllCHW}
                        className={`px-3 py-1 rounded-lg text-sm ${isAllCHWSelected() ? "bg-primary text-white" : "bg-gray-100 text-gray-800"}`}
                      >
                        {isAllCHWSelected() ? "All CHWs" : "Select All CHW"}
                      </button>
                      <button
                        type='button'
                        onClick={handleSelectAllTrainer}
                        className={`px-3 py-1 rounded-lg text-sm ${isAllTrainersSelected() ? "bg-primary text-white" : "bg-gray-100 text-gray-800"}`}
                      >
                        {isAllTrainersSelected()
                          ? "All Trainers"
                          : "Select All Trainers"}
                      </button>
                    </div>

                    {/* Filters */}
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-2 mb-4'>
                      <OptionsField
                        options={[
                          { value: "all", label: "All Roles" },
                          { value: "CHW", label: "CHW" },
                          { value: "TRAINER", label: "Trainer" },
                        ]}
                        value={attendeeFilterRole}
                        onChange={(value) => setAttendeeFilterRole(value)}
                        defaultLabel='Select role'
                        required={false}
                      />
                      <ComboboxField
                        options={[
                          { value: "all", label: "All HealthCenters" },
                          ...hospitalFilterOptions,
                        ]}
                        defaultValue={attendeeFilterHospital}
                        onChange={(value) => setAttendeeFilterHospital(value)}
                        hideQueryOnChange={false}
                        placeholder='Select healthCenter...'
                      />
                      <ComboboxField
                        options={[
                          { value: "all", label: "All Districts" },
                          ...[
                            ...new Set(users.map((u) => u.district).filter(Boolean)),
                          ].map((district) => ({
                            value: district,
                            label: district,
                          })),
                        ]}
                        defaultValue={attendeeFilterDistrict}
                        onChange={(value) => setAttendeeFilterDistrict(value)}
                        hideQueryOnChange={false}
                        placeholder='Select district...'
                      />
                      <ComboboxField
                        options={[
                          { value: "all", label: "All Sectors" },
                          ...[
                            ...new Set(users.map((u) => u.sector).filter(Boolean)),
                          ].map((sector) => ({
                            value: sector!,
                            label: sector!,
                          })),
                        ]}
                        defaultValue={attendeeFilterSector}
                        onChange={(value) => setAttendeeFilterSector(value)}
                        hideQueryOnChange={false}
                        placeholder='Select sector...'
                      />
                    </div>

                    {/* User List */}
                    <div className='max-h-48 overflow-y-auto border border-gray-300 rounded-lg'>
                      {getFilteredUsers().map((user) => (
                        <div
                          key={user.id}
                          className='flex items-center gap-3 p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0'
                        >
                          <input
                            type='checkbox'
                            checked={selectedAttendees.includes(user.id)}
                            onChange={() => handleAttendeeToggle(user.id)}
                            className='w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-blue-500'
                          />
                          <div className='flex-1'>
                            <div className='font-medium text-sm'>{user.fullNames}</div>
                            <div className='text-xs text-gray-600'>
                              {formatRoleLabel(user.userRoles[0]?.name)} •{" "}
                              {user.healthCenter?.name || "No healthCenter"} • {user.phoneNumber}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {user.district}, {user.sector}, {user.cell}, {user.village}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Selected Count */}
                    <div className='mt-2 text-sm text-gray-600'>
                      {selectedAttendees.length} internal attendees +{" "}
                      {externalParticipants.length} external participants selected
                    </div>
                  </div>

                  {/* External Participants Section */}
                  <div className='mt-6'>
                    <label className='block text-sm font-medium text-gray-700 mb-3'>
                      External Participants (by Email)
                    </label>

                    {/* Add External Participant */}
                    <div className='flex gap-2 mb-4'>
                      <div className='flex-1'>
                        <input
                          type='email'
                          value={externalEmailInput}
                          onChange={(e) => setExternalEmailInput(e.target.value)}
                          onKeyPress={handleExternalEmailKeyPress}
                          placeholder='Enter email address...'
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm'
                        />
                      </div>
                      <button
                        type='button'
                        onClick={handleAddExternalParticipant}
                        className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-[#4d81d2] text-sm font-medium whitespace-nowrap'
                      >
                        Add Email
                      </button>
                    </div>

                    {/* External Participants List */}
                    {externalParticipants.length > 0 && (
                      <div className='border border-gray-300 rounded-lg max-h-32 overflow-y-auto'>
                        {externalParticipants.map((email: string, index: number) => (
                          <div
                            key={index}
                            className='flex items-center justify-between p-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0'
                          >
                            <span className='text-sm text-gray-700'>{email}</span>
                            <button
                              type='button'
                              onClick={() => handleRemoveExternalParticipant(email)}
                              className='p-1 text-red-600 hover:text-red-800 rounded'
                              title='Remove participant'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className='mt-2 text-xs text-gray-500'>
                      External participants will receive meeting invitations via email
                    </div>
                  </div>
                </>
              )}

              <TextArea
                label='Description *'
                name='description'
                value={editingEvent?.description || ""}
                rows={4}
                placeholder='Detailed description of the event'
              />

              <div className='flex items-center justify-end gap-3 mt-8 pt-6 border-t'>
                <button
                  type='button'
                  onClick={() => {
                    setShowEventModal(false);
                    setEditingEvent(null);
                    setQuickActionDefaults(null);
                    setSelectedDateForForm(null);
                    setFormDate("");
                    setSelectedMeetingType("EBUMENYI_MEETING");
                    setFrequency("NONE");
                    setIsRepeating(false);
                    setDaysOfWeek([]);
                    setRecurrenceEnd("");
                    setExternalParticipants([]);
                    setExternalEmailInput("");
                    setReminders([30]);
                    setReminderInput("");
                    setAttachments([]);
                    setAttachmentUrl("");
                    setIsUploadingAttachment(false);
                  }}
                  className='px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200'
                >
                  Cancel
                </button>
                <Button
                  type='submit'
                  disabled={
                    createEventMutation.isPending ||
                    updateEventMutation.isPending ||
                    isCreatingMeeting
                  }
                  className='px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-[#4d81d2] disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {isCreatingMeeting
                    ? "Creating Meeting..."
                    : createEventMutation.isPending || updateEventMutation.isPending
                      ? "Saving..."
                      : editingEvent
                        ? "Update Event"
                        : "Create Event"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30'>
          <div className='bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-semibold text-gray-900'>
                Meeting System Issue
              </h3>
              <button
                onClick={() => setShowSignInModal(false)}
                className='text-gray-400 hover:text-gray-600 text-2xl'
              >
                ×
              </button>
            </div>

            <div className='space-y-4'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='w-6 h-6 text-yellow-500 mt-0.5' />
                <div>
                  <p className='text-gray-700 mb-2'>
                    There seems to be an issue with the meeting system. This could be
                    because:
                  </p>
                  <ul className='text-sm text-gray-600 space-y-1 ml-4'>
                    <li>• You don't have an eBumenyi meeting account</li>
                    <li>• You're not logged in to eBumenyi meeting</li>
                    <li>• There might be a temporary service issue</li>
                  </ul>
                </div>
              </div>

              <div className='bg-blue-50 p-4 rounded-lg'>
                <p className='text-sm text-blue-800'>
                  Please check your eBumenyi meeting sign-in status. If you don't
                  have an account, you'll need to create one to schedule virtual
                  meetings.
                </p>
              </div>
            </div>

            <div className='flex items-center justify-end gap-3 mt-6'>
              <button
                onClick={() => setShowSignInModal(false)}
                className='px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  window.open("http://localhost:3000/sign-in", "_blank");
                  setShowSignInModal(false);
                }}
                className='px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-900'
              >
                Go to Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Only for non-recurring events */}
      {eventToDelete && !(eventToDelete.isRepeating && eventToDelete.commonId) && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30'>
          <div className='bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-semibold text-gray-900'>Delete Event</h3>
              <button
                onClick={() => setEventToDelete(null)}
                className='text-gray-400 hover:text-gray-600 text-2xl'
              >
                ×
              </button>
            </div>

            <div className='space-y-4'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='w-6 h-6 text-red-500 mt-0.5' />
                <div>
                  <p className='text-gray-700 mb-2'>
                    Are you sure you want to delete this event?
                  </p>
                  <div className='bg-gray-50 p-3 rounded-lg'>
                    <p className='font-medium text-gray-900'>
                      {eventToDelete.title}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {eventToDelete.startAt
                        ? new Date(eventToDelete.startAt).toLocaleDateString()
                        : ""}{" "}
                      at{" "}
                      {eventToDelete.startAt
                        ? new Date(eventToDelete.startAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>
                  <p className='text-sm text-gray-600 mt-2'>
                    This action cannot be undone.{" "}
                    {eventToDelete.meetingType === "EBUMENYI_MEETING"
                      ? "The meeting link will also be deleted."
                      : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className='flex items-center justify-end gap-3 mt-6'>
              <button
                onClick={() => setEventToDelete(null)}
                className='px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200'
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEvent}
                disabled={deleteEventMutation.isPending}
                className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {deleteEventMutation.isPending ? "Deleting..." : "Delete Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Occurrence Action Dialog (Edit or Delete recurring event) */}
      {showOccurrenceActionDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30'>
          <div className='bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4'>
            <h3 className='text-lg font-bold text-gray-900 mb-2'>
              {occurrenceActionType === "delete"
                ? "Delete this event?"
                : "Update this event?"}
            </h3>
            <p className='text-gray-600 mb-6'>
              {occurrenceActionType === "delete"
                ? "This is a recurring event. What would you like to delete?"
                : "This is a recurring event. What would you like to update?"}
            </p>

            <div className='space-y-2 mb-6'>
              <button
                onClick={() => {
                  setOccurrenceActionMode("single");
                }}
                className={`w-full text-left p-3 border rounded-lg transition-colors ${
                  occurrenceActionMode === "single"
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                }`}
              >
                <p className='font-medium text-gray-900'>This occurrence only</p>
                <p className='text-sm text-gray-600'>
                  {occurrenceActionType === "delete"
                    ? "Delete only this instance"
                    : "Update only this instance"}
                </p>
              </button>

              <button
                onClick={() => {
                  setOccurrenceActionMode("future");
                }}
                className={`w-full text-left p-3 border rounded-lg transition-colors ${
                  occurrenceActionMode === "future"
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                }`}
              >
                <p className='font-medium text-gray-900'>
                  This and all future occurrences
                </p>
                <p className='text-sm text-gray-600'>
                  {occurrenceActionType === "delete"
                    ? "Delete this and all following instances"
                    : "Update this and all following instances"}
                </p>
              </button>

              <button
                onClick={() => {
                  setOccurrenceActionMode("all");
                }}
                className={`w-full text-left p-3 border rounded-lg transition-colors ${
                  occurrenceActionMode === "all"
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                }`}
              >
                <p className='font-medium text-gray-900'>All occurrences</p>
                <p className='text-sm text-gray-600'>
                  {occurrenceActionType === "delete"
                    ? "Delete the entire event series"
                    : "Update all instances in the series"}
                </p>
              </button>
            </div>

            <div className='flex gap-3'>
              <button
                onClick={() => {
                  setShowOccurrenceActionDialog(false);
                  setOccurrenceActionType(null);
                  setOccurrenceActionMode(null);
                }}
                className='flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium'
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setIsProcessingOccurrence(true);
                  try {
                    if (occurrenceActionType === "delete") {
                      confirmDeleteEvent();
                    } else if (occurrenceActionType === "edit") {
                      const pendingData = (window as any).__pendingEditData;
                      if (pendingData && editingEvent && occurrenceActionMode) {
                        try {
                          let startDateTime: Date;
                          let endDateTime: Date;

                          // For "all" and "future" modes: preserve original dates but allow time changes
                          // The backend will calculate the time offset and apply to all occurrences
                          if (occurrenceActionMode === "single") {
                            // For single: use the new date and time from the form
                            const [startTimeStr, endTimeStr] =
                              pendingData.time.split(" - ");
                            const eventDate = new Date(pendingData.date);

                            startDateTime = new Date(eventDate);
                            const [startHours, startMinutes] = startTimeStr
                              .split(":")
                              .map(Number);
                            startDateTime.setHours(startHours, startMinutes, 0, 0);

                            endDateTime = new Date(eventDate);
                            const [endHours, endMinutes] = endTimeStr
                              .split(":")
                              .map(Number);
                            endDateTime.setHours(endHours, endMinutes, 0, 0);
                          } else {
                            // For "all" and "future": use original event's date but with new time
                            const [startTimeStr, endTimeStr] =
                              pendingData.time.split(" - ");
                            const existingStartDate = new Date(editingEvent.startAt);
                            const existingEndDate = new Date(editingEvent.endAt);

                            // Apply new time to existing dates
                            startDateTime = new Date(existingStartDate);
                            const [startHours, startMinutes] = startTimeStr
                              .split(":")
                              .map(Number);
                            startDateTime.setHours(startHours, startMinutes, 0, 0);

                            endDateTime = new Date(existingEndDate);
                            const [endHours, endMinutes] = endTimeStr
                              .split(":")
                              .map(Number);
                            endDateTime.setHours(endHours, endMinutes, 0, 0);
                          }

                          const updatePayload: any = {
                            title: pendingData.title,
                            description: pendingData.description,
                            type: pendingData.type,
                            frequency:
                              pendingData.frequency ||
                              editingEvent.frequency ||
                              "NONE",
                            daysOfWeek:
                              pendingData.daysOfWeek &&
                              pendingData.daysOfWeek.length > 0
                                ? pendingData.daysOfWeek
                                : editingEvent.daysOfWeek &&
                                    editingEvent.daysOfWeek.length > 0
                                  ? editingEvent.daysOfWeek
                                  : [],
                            timezone: "Africa/Kigali",
                            reminderMinutesBefore: Array.isArray(
                              pendingData.reminders,
                            )
                              ? pendingData.reminders
                              : [Number(pendingData.reminders || 30)],
                            startAt: startDateTime.toISOString(),
                            endAt: endDateTime.toISOString(),
                            meetingType: pendingData.meetingType
                              ?.toUpperCase()
                              .replace("-", "_"),
                            location: pendingData.location,
                            priority: pendingData.priority?.toUpperCase(),
                            hostEmail: pendingData.hostEmail,
                            participants:
                              pendingData.attendees?.map((userId: any) => ({
                                userId,
                              })) || [],
                            externalParticipants: (
                              pendingData.externalParticipants || []
                            ).map((email: string) => ({ email })),
                            attachments: (pendingData.attachments || [])
                              .filter((a: any) => a?.url)
                              .map((a: any) => ({ name: a.name, url: a.url })),
                          };

                          // For "all" and "future" modes, allow user to change recurrence end date
                          if (
                            occurrenceActionMode === "all" ||
                            occurrenceActionMode === "future"
                          ) {
                            updatePayload.recurrenceEndsAt =
                              pendingData.recurrenceEndsAt ||
                              editingEvent.recurrenceEndsAt;
                          }

                          // Call the single updateOccurrence function with the selected mode
                          await updateOccurrence(
                            editingEvent.id,
                            updatePayload,
                            occurrenceActionMode as "single" | "all" | "future",
                          );

                          // Show appropriate success message based on mode
                          const modeMessages = {
                            single: "Occurrence updated successfully!",
                            future:
                              "This and all future occurrences updated successfully!",
                            all: "All occurrences updated successfully!",
                          };
                          toast.success(
                            modeMessages[
                              occurrenceActionMode as "single" | "all" | "future"
                            ],
                          );

                          // Refresh data
                          queryClient.invalidateQueries({ queryKey: ["events"] });
                          setShowEventModal(false);
                          setEditingEvent(null);
                        } catch (error: any) {
                          toast.error(
                            error?.response?.data?.message ||
                              "Failed to update occurrence",
                          );
                        }
                      }
                    }
                  } finally {
                    setShowOccurrenceActionDialog(isProcessingOccurrence);
                    setOccurrenceActionType(null);
                    setOccurrenceActionMode(null);
                    setIsProcessingOccurrence(false);
                  }
                }}
                disabled={!occurrenceActionMode || isProcessingOccurrence}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                  occurrenceActionType === "delete"
                    ? "bg-red-600 hover:bg-red-700 disabled:bg-red-300"
                    : "bg-primary hover:bg-blue-900 disabled:bg-blue-300"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessingOccurrence
                  ? occurrenceActionType === "delete"
                    ? "⏳ Deleting..."
                    : "⏳ Updating..."
                  : occurrenceActionType === "delete"
                    ? "Delete"
                    : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
