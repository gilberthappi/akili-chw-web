import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  Search,
  CheckCheck,
  Plus,
  X,
  Phone,
  Video,
  Info,
  Mic,
  FileText,
  ChevronRight,
  UserPlus,
  BellOff,
  Sparkles,
  Shield,
  MapPin,
  Users,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { IConversation, IMessage, ConversationType, IAttachment } from "@/types";
import { IUser } from "@/types/common";
import { useAuth } from "@/hooks/useAuth";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { MessageComposer } from "@/components/messaging/MessageComposer";
import { MessageMedia } from "@/components/messaging/media/MessageMedia";
import {
  sendDirectMessage,
  markDirectMessageRead,
} from "@/services/directChat.service";
import {
  sendGroupMessage,
  markGroupMessageRead,
} from "@/services/groupChat.service";
import {
  createCommunityPost,
  ICommunityPostRaw,
} from "@/services/community.service";
import { IDirectMessageRaw } from "@/services/directChat.service";
import { normalizeMessage, normalizeCommunityPost, stringifyAttachments } from "@/services/messaging.adapter";
import { getAllUsersNopagination } from "@/services/users.api";
import {
  useGetConversations,
  useCreateConversation,
  useGetMessages,
  useInvalidateConversations,
} from "@/hooks/useConversations";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useProfilePhoto } from "@/hooks/useProfilePhoto";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useNotificationsContext } from "@/contexts/NotificationsContext";
import {
  initializeNamespaceSockets,
  joinConversationRoom,
  onNewMessage,
  onMessageEdited,
  onMessageDeleted,
  onUserTyping,
  emitTyping,
  IRawMessagePayload,
} from "@/hooks/useSocket";
import toast from "react-hot-toast";

export const MessagingRedesign: React.FC = () => {
  const { user } = useAuth();
  const { photoUrl: ownPhotoUrl } = useProfilePhoto();
  const { dialog: confirmDialog } = useConfirmDialog();

  // Navigation & Conversation selection
  const [activeTab, setActiveTab] = useState<ConversationType>("direct");
  const [selectedConversation, setSelectedConversation] = useState<IConversation | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userName: string }>>([]);

  // Modals & New Chat / Group state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [modalTab, setModalTab] = useState<"direct" | "group">("direct");
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Group creation & media filter state
  const [groupName, setGroupName] = useState("");
  const [selectedGroupParticipants, setSelectedGroupParticipants] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "file" | "audio">("all");

  // Extract ONLY RECEIVED attachments (sent by other users, excluding own sent messages)
  const sharedAttachments = React.useMemo(() => {
    const list: IAttachment[] = [];
    messages.forEach((msg) => {
      if (msg.senderId !== user?.id && msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach((att) => {
          if (att && (att.url || (att as any).fileUrl)) {
            list.push(att);
          }
        });
      }
    });
    return list;
  }, [messages, user?.id]);

  const filteredSharedMedia = React.useMemo(() => {
    if (mediaFilter === "all") return sharedAttachments;
    return sharedAttachments.filter((att) => {
      if (mediaFilter === "image") return att.type === "image";
      if (mediaFilter === "file") return att.type === "file" || att.type === "video";
      if (mediaFilter === "audio") return att.type === "audio";
      return true;
    });
  }, [sharedAttachments, mediaFilter]);

  const imageCount = sharedAttachments.filter((a) => a.type === "image").length;
  const docCount = sharedAttachments.filter((a) => a.type === "file" || a.type === "video").length;
  const audioCount = sharedAttachments.filter((a) => a.type === "audio").length;

  // Admin & RBC Coordinator Permission Check
  const userRolesList: string[] = Array.isArray(user?.roles)
    ? user.roles.map((r: any) => String(typeof r === "string" ? r : r.name || r.role || r).toUpperCase())
    : typeof user?.roles === "string"
    ? [(user.roles as string).toUpperCase()]
    : Array.isArray(user?.userRoles)
    ? user.userRoles.map((r: any) => String(typeof r === "string" ? r : r.name || r.role || r).toUpperCase())
    : [];

  const isAdminOrCoordinator = userRolesList.some((role) => {
    return (
      role.includes("ADMIN") ||
      role.includes("COORDINATOR") ||
      role.includes("CEHO") ||
      role.includes("MANAGER")
    );
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markedAsReadRef = useRef<Set<string>>(new Set());

  // React Query hooks
  const { data: conversations = [] } = useGetConversations();
  const typedConversations: IConversation[] = Array.isArray(conversations) ? conversations : [];

  const { data: messagesData } = useGetMessages(
    selectedConversation?.id || null,
    selectedConversation?.type
  );
  const createConversationMutation = useCreateConversation();
  const { invalidateConversations } = useInvalidateConversations();
  const { data: unreadCounts } = useUnreadCounts();
  const unreadByConversationId = unreadCounts?.unreadByConversationId || {};
  const { onlineUserIds, requestUserStatus } = useNotificationsContext();

  const [searchParams] = useSearchParams();
  const targetChatId = searchParams.get("chatId") || searchParams.get("id") || searchParams.get("conversationId");
  const targetType = searchParams.get("type") as ConversationType | null;

  // Direct param navigation
  useEffect(() => {
    if (targetChatId && typedConversations.length > 0) {
      const found = typedConversations.find(
        (c) => c.id === targetChatId || c.participants?.some((p) => p.userId === targetChatId)
      );
      if (found) {
        setActiveTab(found.type);
        setSelectedConversation(found);
      }
    } else if (targetType) {
      setActiveTab(targetType);
    }
  }, [targetChatId, targetType, typedConversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Sync messages
  useEffect(() => {
    if (!selectedConversation?.id) {
      setMessages([]);
      return;
    }
    const typedMessagesData = Array.isArray(messagesData) ? messagesData : [];
    setMessages(typedMessagesData);
    setTimeout(() => scrollToBottom(), 0);
  }, [selectedConversation?.id, messagesData]);

  // Request online status
  useEffect(() => {
    if (selectedConversation?.type !== "direct") return;
    const otherUserId = selectedConversation.participants[0]?.userId;
    if (!otherUserId) return;

    requestUserStatus([otherUserId]);
    const interval = setInterval(() => requestUserStatus([otherUserId]), 20000);
    return () => clearInterval(interval);
  }, [selectedConversation?.id, selectedConversation?.type]);

  const selfTypingTimeoutRef = useRef<NodeJS.Timeout>();
  const remoteTypingTimeoutsRef = useRef<{ [userId: string]: NodeJS.Timeout }>({});

  const handleMessageInputChange = (text: string) => {
    setMessageText(text);
    if (!selectedConversation) return;

    emitTyping(selectedConversation.type, selectedConversation.id, true, user?.fullNames);

    if (selfTypingTimeoutRef.current) {
      clearTimeout(selfTypingTimeoutRef.current);
    }

    selfTypingTimeoutRef.current = setTimeout(() => {
      if (selectedConversation) {
        emitTyping(selectedConversation.type, selectedConversation.id, false, user?.fullNames);
      }
    }, 1500);
  };

  // Socket listeners
  useEffect(() => {
    if (!selectedConversation?.id || !selectedConversation.type) return;
    const { id: conversationId, type } = selectedConversation;

    initializeNamespaceSockets();
    joinConversationRoom(type, conversationId);

    const toIMessage = (raw: IRawMessagePayload): IMessage =>
      type === "community"
        ? normalizeCommunityPost(raw as ICommunityPostRaw, conversationId)
        : normalizeMessage(raw as IDirectMessageRaw, conversationId);

    const unsubscribeNewMessage = onNewMessage(type, (raw) => {
      const message = toIMessage(raw);
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      
      // Clear typing indicator for message sender
      if (message.senderId) {
        if (remoteTypingTimeoutsRef.current[message.senderId]) {
          clearTimeout(remoteTypingTimeoutsRef.current[message.senderId]);
        }
        setTypingUsers((prev) => prev.filter((u) => u.userId !== message.senderId));
      }

      scrollToBottom();
      invalidateConversations();
    });

    const unsubscribeMessageEdited = onMessageEdited(type, (raw) => {
      const updatedMessage = toIMessage(raw);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg))
      );
    });

    const unsubscribeMessageDeleted = onMessageDeleted(type, (messageId: string) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });

    const unsubscribeUserTyping = onUserTyping(type, (data) => {
      if (data.userId === user?.id) return;
      if (data.isTyping) {
        if (remoteTypingTimeoutsRef.current[data.userId]) {
          clearTimeout(remoteTypingTimeoutsRef.current[data.userId]);
        }
        setTypingUsers((prev) =>
          prev.some((u) => u.userId === data.userId)
            ? prev
            : [...prev, { userId: data.userId, userName: data.userName || "User" }]
        );
        remoteTypingTimeoutsRef.current[data.userId] = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
        }, 3000);
      } else {
        if (remoteTypingTimeoutsRef.current[data.userId]) {
          clearTimeout(remoteTypingTimeoutsRef.current[data.userId]);
        }
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      }
    });

    return () => {
      unsubscribeNewMessage();
      unsubscribeMessageEdited();
      unsubscribeMessageDeleted();
      unsubscribeUserTyping();
    };
  }, [selectedConversation?.id, selectedConversation?.type, user?.id]);

  // Mark unread messages as read
  useEffect(() => {
    if (!selectedConversation || !user?.id) return;

    const unreadMessages = messages.filter(
      (m) =>
        m.senderId !== user.id &&
        (!m.readBy || !m.readBy.some((r) => (typeof r === "string" ? r === user.id : r.userId === user.id)))
    );

    unreadMessages.forEach((m) => {
      if (markedAsReadRef.current.has(m.id)) return;
      markedAsReadRef.current.add(m.id);

      if (selectedConversation.type === "direct") {
        markDirectMessageRead(selectedConversation.id, m.id).catch(() => {});
      } else if (selectedConversation.type === "group") {
        markGroupMessageRead(selectedConversation.id, m.id).catch(() => {});
      }
    });
  }, [messages, selectedConversation, user?.id]);

  // Handle send message
  const handleSendMessage = async (attachments: IAttachment[] = []) => {
    if ((!messageText.trim() && attachments.length === 0) || !selectedConversation) return;

    const textToSend = messageText.trim();
    const attachmentsJson = attachments.length > 0 ? stringifyAttachments(attachments) : undefined;
    setMessageText("");

    if (selfTypingTimeoutRef.current) {
      clearTimeout(selfTypingTimeoutRef.current);
    }
    emitTyping(selectedConversation.type, selectedConversation.id, false, user?.fullNames);

    try {
      if (selectedConversation.type === "direct") {
        const raw = await sendDirectMessage(selectedConversation.id, {
          content: textToSend,
          attachments: attachmentsJson,
        });
        const norm = normalizeMessage(raw, selectedConversation.id);
        setMessages((prev) => (prev.some((m) => m.id === norm.id) ? prev : [...prev, norm]));
      } else if (selectedConversation.type === "group") {
        const raw = await sendGroupMessage(selectedConversation.id, {
          content: textToSend,
          attachments: attachmentsJson,
        });
        const norm = normalizeMessage(raw, selectedConversation.id);
        setMessages((prev) => (prev.some((m) => m.id === norm.id) ? prev : [...prev, norm]));
      } else if (selectedConversation.type === "community") {
        const raw = await createCommunityPost(selectedConversation.id, {
          title: textToSend.slice(0, 50) || "Community Post",
          content: textToSend,
          attachments: attachmentsJson,
        });
        const norm = normalizeCommunityPost(raw, selectedConversation.id);
        setMessages((prev) => (prev.some((m) => m.id === norm.id) ? prev : [...prev, norm]));
      }
      scrollToBottom();
      invalidateConversations();
    } catch (err: any) {
      console.error("Failed to send message:", err);
      toast.error(err?.response?.data?.message || err.message || "Failed to send message");
    }
  };

  // Open New Chat / Group Modal
  const openNewChatModal = async (defaultTab?: "direct" | "group") => {
    const targetTab = defaultTab === "group" && isAdminOrCoordinator ? "group" : "direct";
    setModalTab(targetTab);
    setGroupName("");
    setSelectedGroupParticipants([]);
    setShowNewChatModal(true);
    setLoadingUsers(true);
    try {
      const res = await getAllUsersNopagination();
      setAllUsers((res.data || []) as IUser[]);
    } catch {
      toast.error("Failed to load contacts list");
    } finally {
      setLoadingUsers(false);
    }
  };

  const startDirectChatWithUser = async (targetUser: IUser) => {
    try {
      const conv = await createConversationMutation.mutateAsync({
        type: "direct",
        participantIds: [targetUser.id],
      });
      setShowNewChatModal(false);
      setActiveTab("direct");
      setSelectedConversation(conv);
      toast.success(`Chat started with ${targetUser.fullNames}`);
    } catch (err: any) {
      toast.error(err.message || "Could not start chat");
    }
  };

  // Handle Group Creation for Admins & RBC Coordinators
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedGroupParticipants.length === 0) {
      toast.error("Please select at least one member for the group");
      return;
    }
    setCreatingGroup(true);
    try {
      const conv = await createConversationMutation.mutateAsync({
        type: "group",
        name: groupName.trim(),
        participantIds: selectedGroupParticipants,
      });
      setShowNewChatModal(false);
      setGroupName("");
      setSelectedGroupParticipants([]);
      setActiveTab("group");
      setSelectedConversation(conv);
      toast.success(`Group "${conv.name}" created successfully!`);
    } catch (err: any) {
      console.error("Failed to create group:", err);
      toast.error(err?.message || "Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  const toggleGroupParticipant = (userId: string) => {
    setSelectedGroupParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Filter conversations for sidebar
  const filteredConversations = typedConversations
    .filter((c) => (activeTab === "direct" ? c.type === "direct" : activeTab === "group" ? c.type === "group" : c.type === "community"))
    .filter((c) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.participants?.some((p) => p.user?.fullNames?.toLowerCase().includes(q))
      );
    });

  const getOtherParticipant = (conv: IConversation) => {
    if (conv.type !== "direct") return null;
    return conv.participants?.find((p) => p.userId !== user?.id)?.user || conv.participants[0]?.user;
  };

  // Safe user online check (handles Set vs Array)
  const isUserOnline = (userId?: string) => {
    if (!userId || !onlineUserIds) return false;
    if (onlineUserIds instanceof Set) {
      return onlineUserIds.has(userId);
    }
    if (Array.isArray(onlineUserIds)) {
      return (onlineUserIds as string[]).includes(userId);
    }
    return false;
  };

  const getUnreadCount = (convId: string) => unreadByConversationId[convId] || 0;

  return (
    <AudioPlayerProvider>
      <div className="flex h-[calc(100vh-4.5rem)] w-full bg-white text-slate-800 overflow-hidden font-sans rounded-2xl shadow-xl border border-slate-200/90">
      
      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR - CONVERSATIONS LIST */}
      {/* ========================================================================= */}
      <div className="w-80 md:w-96 flex-shrink-0 flex flex-col bg-slate-50/80 border-r border-slate-200">
        
        {/* Sidebar Header */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Messages</h1>
              <p className="text-xs text-slate-500 font-medium">Rwanda Biomedical Centre</p>
            </div>
            
            <button
              onClick={() => openNewChatModal(activeTab === "group" && isAdminOrCoordinator ? "group" : "direct")}
              className="h-9 px-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl flex items-center gap-1.5 text-xs font-semibold shadow-sm shadow-primary/30 transition-all duration-200 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>{activeTab === "group" && isAdminOrCoordinator ? "New Group" : "New Chat"}</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100/90 border border-slate-200/90 text-slate-800 placeholder-slate-400 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Navigation Category Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            {(["direct", "group", "community"] as ConversationType[]).map((tab) => {
              const label = tab === "direct" ? "All" : tab === "group" ? "Groups" : "Community";
              const count = typedConversations
                .filter((c) => c.type === tab)
                .reduce((sum, c) => sum + getUnreadCount(c.id), 0);

              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 ${
                    isActive
                      ? "bg-white text-primary shadow-sm font-bold border border-slate-200/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  <span>{label}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${isActive ? "bg-primary text-white" : "bg-slate-300 text-slate-800"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversations List Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-slate-50/50">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-6 text-slate-400">
              <MessageSquare className="h-8 w-8 mb-2 stroke-1 text-slate-400" />
              <p className="text-xs font-medium">No conversations found</p>
              <button onClick={() => openNewChatModal(activeTab === "group" && isAdminOrCoordinator ? "group" : "direct")} className="mt-3 text-xs text-primary hover:underline font-semibold">
                {activeTab === "group" && isAdminOrCoordinator ? "Create a new group" : "Start a new chat"}
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              const otherUser = getOtherParticipant(conv);
              const name = conv.type === "direct" ? otherUser?.fullNames || "Direct Chat" : conv.name || "Group Chat";
              const photo = conv.type === "direct" ? otherUser?.photo : conv.photo;
              const online = conv.type === "direct" && isUserOnline(otherUser?.id);
              const unread = getUnreadCount(conv.id);
              const lastMsgText = conv.lastMessage?.content || "No messages yet";

              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "bg-primary/10 border-l-4 border-primary shadow-sm text-slate-900"
                      : "hover:bg-white border border-transparent hover:border-slate-200/60"
                  }`}
                >
                  {/* Avatar & Online status dot */}
                  <div className="relative flex-shrink-0">
                    <ProfileAvatar photo={photo || undefined} name={name} className="w-10 h-10 border border-slate-200 shadow-2xs" />
                    {online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                    )}
                  </div>

                  {/* Info details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className={`text-xs font-bold truncate ${isSelected ? "text-primary" : "text-slate-800 group-hover:text-slate-900"}`}>
                        {name}
                      </h3>
                      {conv.lastMessage?.timestamp && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(conv.lastMessage.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate ${unread > 0 ? "text-slate-900 font-semibold" : "text-slate-500 font-normal"}`}>
                        {lastMsgText}
                      </p>

                      {unread > 0 && (
                        <span className="ml-2 flex-shrink-0 bg-primary text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Current User Bottom Bar */}
        <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ProfileAvatar photo={ownPhotoUrl || user?.photo || undefined} name={user?.fullNames || "User"} className="w-9 h-9 border border-slate-200" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.fullNames || "My Account"}</p>
              <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active now
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CENTER - ACTIVE CHAT WORKSPACE */}
      {/* ========================================================================= */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col bg-slate-50/40 relative min-w-0">
          
          {/* Active Chat Header */}
          <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between z-10 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              {(() => {
                const other = getOtherParticipant(selectedConversation);
                const title = selectedConversation.type === "direct" ? other?.fullNames || "Direct Chat" : selectedConversation.name;
                const photo = selectedConversation.type === "direct" ? other?.photo : selectedConversation.photo;
                const isOnline = selectedConversation.type === "direct" && isUserOnline(other?.id);

                return (
                  <>
                    <div className="relative flex-shrink-0">
                      <ProfileAvatar photo={photo || undefined} name={title || "Chat"} className="w-10 h-10 border border-slate-200 shadow-xs" />
                      {isOnline && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-slate-900 truncate">{title}</h2>
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1.5 font-medium">
                        {selectedConversation.type === "direct" ? (
                          isOnline ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
                            </span>
                          ) : (
                            "Offline"
                          )
                        ) : (
                          `${selectedConversation.participants?.length || 0} Members`
                        )}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Header Right Quick Action Buttons */}
            <div className="flex items-center gap-1 text-slate-500">
              <button title="Search in chat" className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-all">
                <Search className="h-4 w-4" />
              </button>
              <button title="Audio Call" className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-all">
                <Phone className="h-4 w-4" />
              </button>
              <button title="Video Meeting" className="p-2 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-xl transition-all">
                <Video className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <button
                title="Toggle details panel"
                onClick={() => setShowInfoPanel(!showInfoPanel)}
                className={`p-2 rounded-xl transition-all ${showInfoPanel ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-slate-100 text-slate-600"}`}
              >
                <Info className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed & Attachment Staging Area */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* Messages Feed Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-50/60">
              
              {/* Date divider */}
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-semibold text-slate-500 shadow-2xs">
                  Today
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2">
                  <Sparkles className="h-8 w-8 text-primary/60 animate-pulse" />
                  <p className="text-xs font-medium text-slate-500">No messages yet. Send a greeting to start chatting!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  const senderName = msg.sender?.fullNames || "User";

                  const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  const isSingleAudio = !msg.content && msg.attachments?.length === 1 && msg.attachments[0].type === "audio";
                  const isSingleMedia = !msg.content && msg.attachments?.length === 1 && (msg.attachments[0].type === "image" || msg.attachments[0].type === "video");

                  return (
                    <div key={msg.id} className={`flex items-end gap-2.5 ${isMine ? "justify-end" : "justify-start"} group`}>
                      {!isMine && (
                        <ProfileAvatar photo={msg.sender?.photo || undefined} name={senderName} className="w-8 h-8 mb-1 flex-shrink-0 border border-slate-200 shadow-2xs" />
                      )}

                      <div className="max-w-md lg:max-w-lg space-y-1">
                        {!isMine && selectedConversation.type !== "direct" && (
                          <p className="text-[10px] font-bold text-primary ml-1">{senderName}</p>
                        )}

                        <div
                          className={`rounded-2xl text-xs leading-relaxed shadow-2xs transition-all duration-200 relative ${
                            isSingleMedia
                              ? "p-0 bg-transparent border-none shadow-none overflow-hidden rounded-2xl"
                              : isSingleAudio
                              ? "px-2.5 py-1.5"
                              : msg.content
                              ? "p-3.5"
                              : "p-1.5"
                          } ${
                            isSingleMedia
                              ? ""
                              : isMine
                              ? "bg-primary text-white rounded-br-xs shadow-primary/10 font-normal"
                              : "bg-white text-slate-800 rounded-bl-xs border border-slate-200/90"
                          }`}
                        >
                          {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}

                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className={msg.content ? "mt-2 space-y-1.5" : "space-y-1.5"}>
                              {msg.attachments.map((att, idx) => (
                                <MessageMedia
                                  key={idx}
                                  attachment={att}
                                  variant="bubble"
                                  messageId={msg.id}
                                  isOwn={isMine}
                                  senderPhoto={msg.sender?.photo}
                                  senderName={senderName}
                                  formattedTimestamp={isSingleAudio || isSingleMedia ? formattedTime : undefined}
                                />
                              ))}
                            </div>
                          )}

                          {!isSingleAudio && !isSingleMedia && (
                            <div className={`flex items-center justify-end gap-1 px-1 mt-1 text-[9px] ${isMine ? "text-white/80" : "text-slate-400"}`}>
                              <span>{formattedTime}</span>
                              {isMine && <CheckCheck className="h-3 w-3 text-white/80" />}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing Indicators */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-primary font-medium italic animate-pulse">
                  <div className="flex space-x-1">
                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce delay-100" />
                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce delay-200" />
                  </div>
                  <span>{typingUsers.map((u) => u.userName).join(", ")} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Input Composer */}
            <div className="border-t border-slate-200 bg-white">
              <MessageComposer
                value={messageText}
                onChange={handleMessageInputChange}
                onSend={handleSendMessage}
                placeholder="Write a message..."
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-xs mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-base font-bold text-slate-900">Select a Conversation</h2>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Choose a conversation from the left sidebar to view messages or start a new chat.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RIGHT PANEL - CONTACT & CONVERSATION DETAILS */}
      {/* ========================================================================= */}
      {selectedConversation && showInfoPanel && (
        <div className="w-80 flex-shrink-0 bg-white border-l border-slate-200 p-5 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Details</h3>
            <button onClick={() => setShowInfoPanel(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Contact Header Card */}
          {(() => {
            const other = getOtherParticipant(selectedConversation);
            const title = selectedConversation.type === "direct" ? other?.fullNames || "Direct Chat" : selectedConversation.name;
            const photo = selectedConversation.type === "direct" ? other?.photo : selectedConversation.photo;

            return (
              <div className="py-6 flex flex-col items-center text-center border-b border-slate-200">
                <ProfileAvatar photo={photo || undefined} name={title || "User"} className="w-16 h-16 rounded-2xl border-2 border-primary/20 shadow-md mb-3" />
                <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{selectedConversation.type === "direct" ? "Health Worker" : "Healthcare Group"}</p>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-4 w-full justify-center">
                  <button className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" /> Call
                  </button>
                  <button className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5">
                    <BellOff className="h-3.5 w-3.5 text-amber-600" /> Mute
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Quick Info Sections */}
          <div className="py-4 space-y-4 border-b border-slate-200">
            <h5 className="text-xs font-bold text-slate-900">Information</h5>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-600">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="truncate">Gasabo, Remera Sector</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-600">
                <Shield className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span className="truncate">King Faisal Hospital Partner</span>
              </div>
            </div>
          </div>

          {/* Shared Media Gallery Preview */}
          <div className="py-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-900">Received Files ({sharedAttachments.length})</h5>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-semibold">
              <button
                onClick={() => setMediaFilter("all")}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  mediaFilter === "all" ? "bg-white text-primary shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All ({sharedAttachments.length})
              </button>
              <button
                onClick={() => setMediaFilter("image")}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  mediaFilter === "image" ? "bg-white text-primary shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Photos ({imageCount})
              </button>
              <button
                onClick={() => setMediaFilter("file")}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  mediaFilter === "file" ? "bg-white text-primary shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Docs ({docCount})
              </button>
              <button
                onClick={() => setMediaFilter("audio")}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  mediaFilter === "audio" ? "bg-white text-primary shadow-2xs font-bold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Voice ({audioCount})
              </button>
            </div>

            {/* Media Items List */}
            {filteredSharedMedia.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200/80">
                <FileText className="h-6 w-6 mx-auto mb-1.5 stroke-1 text-slate-400" />
                <p className="text-[11px] font-medium text-slate-500">No received files in this chat</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                {filteredSharedMedia.map((att, idx) => {
                  const url = att.url || (att as any).fileUrl || "";
                  const name = att.fileName || (att as any).name || `File ${idx + 1}`;

                  if (att.type === "image") {
                    return (
                      <div
                        key={idx}
                        onClick={() => window.open(url, "_blank")}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-all group"
                      >
                        <img
                          src={url}
                          alt={name}
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-primary">{name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Photo</p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary flex-shrink-0" />
                      </div>
                    );
                  }

                  if (att.type === "audio") {
                    return (
                      <div
                        key={idx}
                        onClick={() => window.open(url, "_blank")}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center flex-shrink-0 text-amber-600">
                          <Mic className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-primary">{name || "Voice Note"}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Voice Note</p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary flex-shrink-0" />
                      </div>
                    );
                  }

                  return (
                    <div
                      key={idx}
                      onClick={() => window.open(url, "_blank")}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center flex-shrink-0 text-emerald-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-primary">{name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Document</p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. NEW CHAT & GROUP CREATION MODAL */}
      {/* ========================================================================= */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {modalTab === "group" ? (
                  <Users className="h-4 w-4 text-primary" />
                ) : (
                  <UserPlus className="h-4 w-4 text-primary" />
                )}
                <span>{modalTab === "group" ? "Create New Group" : "Start Direct Chat"}</span>
              </h3>
              <button onClick={() => setShowNewChatModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Role Switcher Tabs (Admins & RBC Coordinators) */}
            {isAdminOrCoordinator && (
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setModalTab("direct")}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    modalTab === "direct"
                      ? "bg-white text-primary shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Direct Chat</span>
                </button>

                <button
                  onClick={() => setModalTab("group")}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    modalTab === "group"
                      ? "bg-white text-primary shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Create Group</span>
                </button>
              </div>
            )}

            {/* TAB 1: DIRECT CHAT */}
            {modalTab === "direct" && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search healthcare contacts..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
                  {loadingUsers ? (
                    <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading contacts...
                    </div>
                  ) : (
                    allUsers
                      .filter((u) => u.id !== user?.id && u.fullNames?.toLowerCase().includes(userSearchTerm.toLowerCase()))
                      .map((u) => (
                        <div
                          key={u.id}
                          onClick={() => startDirectChatWithUser(u)}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-all border border-transparent hover:border-slate-200"
                        >
                          <ProfileAvatar photo={u.photo || undefined} name={u.fullNames} className="w-9 h-9 border border-slate-200" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 truncate">{u.fullNames}</p>
                            <p className="text-[10px] text-slate-500 truncate">{u.district || "Health Worker"}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      ))
                  )}
                </div>
              </>
            )}

            {/* TAB 2: CREATE GROUP */}
            {modalTab === "group" && (
              <div className="space-y-3.5">
                {!isAdminOrCoordinator ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                    Group creation is restricted to Admins and RBC Coordinators.
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Group Name</label>
                      <input
                        type="text"
                        placeholder="e.g. RBC Supervision Team"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">Select Members</label>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {selectedGroupParticipants.length} selected
                        </span>
                      </div>

                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search members to add..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="w-full bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar border border-slate-200/80 rounded-xl p-1 bg-slate-50/50">
                        {loadingUsers ? (
                          <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading members...
                          </div>
                        ) : (
                          allUsers
                            .filter((u) => u.id !== user?.id && u.fullNames?.toLowerCase().includes(userSearchTerm.toLowerCase()))
                            .map((u) => {
                              const isSelected = selectedGroupParticipants.includes(u.id);
                              return (
                                <div
                                  key={u.id}
                                  onClick={() => toggleGroupParticipant(u.id)}
                                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                                    isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-white border border-transparent"
                                  }`}
                                >
                                  <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                    isSelected ? "bg-primary border-primary text-white" : "border-slate-300 bg-white"
                                  }`}>
                                    {isSelected && <Check className="h-3 w-3" />}
                                  </div>
                                  <ProfileAvatar photo={u.photo || undefined} name={u.fullNames} className="w-8 h-8 border border-slate-200" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-slate-800 truncate">{u.fullNames}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{u.district || "Health Worker"}</p>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleCreateGroup}
                      disabled={creatingGroup || !groupName.trim() || selectedGroupParticipants.length === 0}
                      className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {creatingGroup ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Creating Group...
                        </>
                      ) : (
                        `Create Group (${selectedGroupParticipants.length} Members)`
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  </AudioPlayerProvider>
  );
};

export default MessagingRedesign;

