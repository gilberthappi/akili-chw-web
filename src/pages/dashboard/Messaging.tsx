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
  UserMinus,
  BellOff,
  Sparkles,
  Shield,
  MapPin,
  Users,
  Check,
  Loader2,
  ExternalLink,
  Edit3,
  Trash2,
  Settings,
  Crown,
  Lock,
  Globe,
  LogOut,
  Heart,
  Reply,
  Copy,
  Bookmark,
} from "lucide-react";
import { IConversation, IMessage, ConversationType, IAttachment, IQuotedMessage } from "@/types";
import { IUser } from "@/types/common";
import { useAuth } from "@/hooks/useAuth";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { MessageComposer } from "@/components/messaging/MessageComposer";
import { MessageMedia } from "@/components/messaging/media/MessageMedia";
import { CommunityPostCard } from "@/components/messaging/CommunityPostCard";
import { SavedPostsModal } from "@/components/messaging/SavedPostsModal";
import { InChatSearchBar } from "@/components/messaging/InChatSearchBar";
import CreateGroupModal from "@/components/messaging/CreateGroupModal";
import EditGroupModal from "@/components/messaging/EditGroupModal";
import AddMembersModal from "@/components/messaging/AddMembersModal";
import TerminateGroupModal from "@/components/messaging/TerminateGroupModal";
import EditCommunityModal from "@/components/messaging/EditCommunityModal";
import AddCommunityMembersModal from "@/components/messaging/AddCommunityMembersModal";
import TerminateCommunityModal from "@/components/messaging/TerminateCommunityModal";
import {
  sendDirectMessage,
  markDirectMessageRead,
  editDirectMessage,
  deleteDirectMessage,
  toggleDirectMessageLike,
} from "@/services/directChat.service";
import {
  sendGroupMessage,
  markGroupMessageRead,
  removeGroupParticipant,
  updateGroupParticipantRole,
  editGroupMessage,
  deleteGroupMessage,
  toggleGroupMessageLike,
  IGroupChatRaw,
} from "@/services/groupChat.service";
import {
  createCommunityPost,
  removeCommunityMember,
  ICommunityPostRaw,
} from "@/services/community.service";
import { IDirectMessageRaw } from "@/services/directChat.service";
import { normalizeMessage, normalizeGroupChat, normalizeCommunityPost, stringifyAttachments } from "@/services/messaging.adapter";
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
  leaveConversationRoom,
  onNewMessage,
  onMessageEdited,
  onMessageDeleted,
  onMessageLiked,
  onMessageRead,
  onUserTyping,
  emitTyping,
  IRawMessagePayload,
} from "@/hooks/useSocket";
import toast from "react-hot-toast";

export const Messaging: React.FC = () => {
  const { user } = useAuth();
  const { photoUrl: ownPhotoUrl } = useProfilePhoto();
  const { confirm: confirmAction, dialog: confirmDialog } = useConfirmDialog();

  // Navigation & Conversation selection
  const [activeTab, setActiveTab] = useState<ConversationType>("direct");
  const [selectedConversation, setSelectedConversation] = useState<IConversation | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; userName: string }>>([]);

  // In-chat interaction states: reply, search, bookmarks, editing
  const [replyingTo, setReplyingTo] = useState<IQuotedMessage | null>(null);
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [showSavedPostsModal, setShowSavedPostsModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<IMessage | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");

  // Modals & New Chat / Group state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [modalTab, setModalTab] = useState<"direct" | "group" | "community">("direct");
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Group creation & media filter state
  const [groupName, setGroupName] = useState("");
  const [selectedGroupParticipants, setSelectedGroupParticipants] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "file" | "audio">("all");

  // Community creation state
  const [communityName, setCommunityName] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [communityIsPublic, setCommunityIsPublic] = useState(true);
  const [creatingCommunity, setCreatingCommunity] = useState(false);

  // Group Management Modals state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showTerminateGroupModal, setShowTerminateGroupModal] = useState(false);
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState<string | null>(null);

  // Community Management Modals state
  const [showEditCommunityModal, setShowEditCommunityModal] = useState(false);
  const [showAddCommunityMembersModal, setShowAddCommunityMembersModal] = useState(false);
  const [showTerminateCommunityModal, setShowTerminateCommunityModal] = useState(false);
  const [removingCommunityMemberId, setRemovingCommunityMemberId] = useState<string | null>(null);

  const handleRemoveCommunityMember = (participantUserId: string, participantName: string) => {
    if (!selectedConversation || selectedConversation.type !== "community") return;

    confirmAction({
      title: "Remove Community Member",
      message: `Are you sure you want to remove ${participantName} from this community?`,
      confirmLabel: "Remove Member",
      variant: "danger",
      onConfirm: async () => {
        setRemovingCommunityMemberId(participantUserId);
        try {
          await removeCommunityMember(selectedConversation.id, participantUserId);
          toast.success(`Removed ${participantName} from community`);
          invalidateConversations();
          setSelectedConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              participants: prev.participants.filter((p) => p.userId !== participantUserId),
            };
          });
        } catch (err: any) {
          toast.error(err?.response?.data?.message || err?.message || "Failed to remove member");
        } finally {
          setRemovingCommunityMemberId(null);
        }
      },
    });
  };

  const handleLeaveCommunity = () => {
    if (!selectedConversation || selectedConversation.type !== "community" || !user?.id) return;
    confirmAction({
      title: "Leave Community",
      message: "Are you sure you want to leave this community?",
      confirmLabel: "Leave",
      variant: "danger",
      onConfirm: async () => {
        try {
          await removeCommunityMember(selectedConversation.id, user.id);
          toast.success("You have left the community");
          invalidateConversations();
          setSelectedConversation(null);
        } catch (err: any) {
          toast.error(err?.response?.data?.message || err?.message || "Failed to leave community");
        }
      },
    });
  };

  const handleRemoveParticipant = (participantUserId: string, participantName: string) => {
    if (!selectedConversation || selectedConversation.type !== "group") return;

    confirmAction({
      title: "Remove Participant",
      message: `Are you sure you want to remove ${participantName} from this group?`,
      confirmLabel: "Remove Member",
      variant: "danger",
      onConfirm: async () => {
        setRemovingParticipantId(participantUserId);
        try {
          await removeGroupParticipant(selectedConversation.id, participantUserId);
          toast.success(`Removed ${participantName} from group`);
          invalidateConversations();
          setSelectedConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              participants: prev.participants.filter((p) => p.userId !== participantUserId),
            };
          });
        } catch (err: any) {
          toast.error(err?.response?.data?.message || err?.message || "Failed to remove participant");
        } finally {
          setRemovingParticipantId(null);
        }
      },
    });
  };

  const handleToggleAdminRole = (
    participantUserId: string,
    currentRole: string | undefined,
    participantName: string
  ) => {
    if (!selectedConversation || selectedConversation.type !== "group") return;
    const isCurrentlyAdmin = currentRole === "admin" || currentRole === "creator";
    const newRole = isCurrentlyAdmin ? "member" : "admin";
    const actionTitle = isCurrentlyAdmin ? "Demote Admin" : "Promote to Admin";
    const actionMessage = isCurrentlyAdmin
      ? `Are you sure you want to remove Admin role from ${participantName}?`
      : `Are you sure you want to make ${participantName} a Group Admin?`;

    confirmAction({
      title: actionTitle,
      message: actionMessage,
      confirmLabel: isCurrentlyAdmin ? "Demote Member" : "Promote to Admin",
      variant: isCurrentlyAdmin ? "danger" : "default",
      onConfirm: async () => {
        setUpdatingRoleUserId(participantUserId);
        try {
          await updateGroupParticipantRole(selectedConversation.id, participantUserId, newRole);
          toast.success(isCurrentlyAdmin ? `Demoted ${participantName} to Member` : `Promoted ${participantName} to Group Admin`);
          invalidateConversations();
          setSelectedConversation((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              participants: prev.participants.map((p) => (p.userId === participantUserId ? { ...p, role: newRole } : p)),
            };
          });
        } catch (err: any) {
          toast.error(err?.response?.data?.message || err?.message || "Failed to update participant role");
        } finally {
          setUpdatingRoleUserId(null);
        }
      },
    });
  };

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

  const isGroupAdmin = React.useMemo(() => {
    if (!selectedConversation || selectedConversation.type !== "group") return false;
    if (isAdminOrCoordinator) return true;
    if (selectedConversation.createdById === user?.id) return true;
    return selectedConversation.participants?.some(
      (p) => p.userId === user?.id && (p.role === "admin" || p.role === "creator")
    );
  }, [selectedConversation, user?.id, isAdminOrCoordinator]);

  const isRestrictedFromPosting =
    selectedConversation?.type === "group" &&
    selectedConversation.onlyAdminsCanSend === true &&
    !isGroupAdmin;

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

  // Request online status for other user
  useEffect(() => {
    if (selectedConversation?.type !== "direct") return;
    const otherUserId =
      selectedConversation.participants?.find((p) => p.userId !== user?.id)?.userId ||
      selectedConversation.participants?.[0]?.userId;
    if (!otherUserId) return;

    requestUserStatus([otherUserId]);
    const interval = setInterval(() => requestUserStatus([otherUserId]), 20000);
    return () => clearInterval(interval);
  }, [selectedConversation?.id, selectedConversation?.type, user?.id]);

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
      // Guard against messages belonging to other conversations on this namespace
      const rawTargetId =
        (raw as any).chatId ||
        (raw as any).conversationId ||
        (raw as any).groupId ||
        (raw as any).communityId;
      if (rawTargetId && rawTargetId !== conversationId) return;

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
      const rawTargetId =
        (raw as any).chatId ||
        (raw as any).conversationId ||
        (raw as any).groupId ||
        (raw as any).communityId;
      if (rawTargetId && rawTargetId !== conversationId) return;

      const updatedMessage = toIMessage(raw);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg))
      );
    });

    const unsubscribeMessageDeleted = onMessageDeleted(type, (messageId: string) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });

    const unsubscribeMessageLiked = onMessageLiked(type, (data) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== data.messageId) return msg;
          const isMine = data.userId === user?.id;
          return {
            ...msg,
            likes: data.likeCount !== undefined ? data.likeCount : (msg.likes || 0) + (data.liked ? 1 : -1),
            isLikedByMe: isMine ? data.liked : msg.isLikedByMe,
          };
        })
      );
    });

    const unsubscribeMessageRead = onMessageRead(type, (data) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== data.messageId) return msg;
          const readBy = msg.readBy || [];
          if (readBy.some((r) => (typeof r === "string" ? r === data.userId : r.userId === data.userId))) {
            return msg;
          }
          return {
            ...msg,
            readBy: [...readBy, { userId: data.userId, readAt: data.readAt || new Date().toISOString() }],
          };
        })
      );
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
      leaveConversationRoom(type, conversationId);
      unsubscribeNewMessage();
      unsubscribeMessageEdited();
      unsubscribeMessageDeleted();
      unsubscribeMessageLiked();
      unsubscribeMessageRead();
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
    
    // Attach reply info if replying
    let finalAttachments = [...attachments];
    if (replyingTo) {
      finalAttachments.push({
        url: "",
        type: "reply" as any,
        replyToId: replyingTo.id,
        replyToSender: replyingTo.senderName,
        replyToContent: replyingTo.content,
        replyToType: replyingTo.type,
      } as any);
    }

    const attachmentsJson = finalAttachments.length > 0 ? stringifyAttachments(finalAttachments) : undefined;
    setMessageText("");
    setReplyingTo(null);

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
        const title = textToSend.length > 50 ? textToSend.slice(0, 50) + "..." : textToSend || "Community Post";
        const raw = await createCommunityPost(selectedConversation.id, {
          title,
          content: textToSend,
          photo: attachments.find((a) => a.type === "image")?.url,
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

  // Toggle Like on Direct or Group Message
  const handleToggleMessageLike = async (message: IMessage) => {
    if (!selectedConversation) return;
    try {
      if (selectedConversation.type === "direct") {
        const res = await toggleDirectMessageLike(selectedConversation.id, message.id);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id ? { ...m, likes: res.likeCount, isLikedByMe: res.liked } : m
          )
        );
      } else if (selectedConversation.type === "group") {
        const res = await toggleGroupMessageLike(selectedConversation.id, message.id);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === message.id ? { ...m, likes: res.likeCount, isLikedByMe: res.liked } : m
          )
        );
      }
    } catch {
      toast.error("Failed to update reaction");
    }
  };

  // Copy message text to clipboard
  const handleCopyMessage = async (content?: string) => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Message copied to clipboard!");
    } catch {
      toast.error("Failed to copy message");
    }
  };

  // Delete message with confirmation
  const handleDeleteMessage = (messageId: string) => {
    if (!selectedConversation) return;
    confirmAction({
      title: "Delete Message",
      message: "Are you sure you want to delete this message? This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          if (selectedConversation.type === "direct") {
            await deleteDirectMessage(selectedConversation.id, messageId);
          } else if (selectedConversation.type === "group") {
            await deleteGroupMessage(selectedConversation.id, messageId);
          }
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
          toast.success("Message deleted");
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to delete message");
        }
      },
    });
  };

  // Start editing a message
  const handleStartEditMessage = (message: IMessage) => {
    setEditingMessage(message);
    setEditingMessageText(message.content || "");
  };

  // Save edited message
  const handleSaveEditMessage = async () => {
    if (!editingMessage || !selectedConversation || !editingMessageText.trim()) return;
    try {
      if (selectedConversation.type === "direct") {
        const updated = await editDirectMessage(selectedConversation.id, editingMessage.id, editingMessageText.trim());
        setMessages((prev) =>
          prev.map((m) => (m.id === editingMessage.id ? { ...m, content: updated.content, isEdited: true } : m))
        );
      } else if (selectedConversation.type === "group") {
        const updated = await editGroupMessage(selectedConversation.id, editingMessage.id, editingMessageText.trim());
        setMessages((prev) =>
          prev.map((m) => (m.id === editingMessage.id ? { ...m, content: updated.content, isEdited: true } : m))
        );
      }
      setEditingMessage(null);
      setEditingMessageText("");
      toast.success("Message updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to edit message");
    }
  };

  // Jump to message search match
  const handleJumpToSearchMatch = (messageId: string) => {
    setHighlightedMessageId(messageId);
    const element = document.getElementById(`message-${messageId}`) || document.getElementById(`post-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Open New Chat / Group / Community Modal
  const openNewChatModal = async (defaultTab?: "direct" | "group" | "community") => {
    const targetTab =
      defaultTab === "community" && isAdminOrCoordinator
        ? "community"
        : defaultTab === "group" && isAdminOrCoordinator
        ? "group"
        : "direct";
    setModalTab(targetTab);
    setGroupName("");
    setCommunityName("");
    setCommunityDescription("");
    setCommunityIsPublic(true);
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

  // Handle Community Creation for Admins & RBC Coordinators
  const handleCreateCommunity = async () => {
    if (!communityName.trim()) {
      toast.error("Please enter a community name");
      return;
    }
    setCreatingCommunity(true);
    try {
      const conv = await createConversationMutation.mutateAsync({
        type: "community",
        name: communityName.trim(),
        description: communityDescription.trim() || undefined,
        isPublic: communityIsPublic,
        participantIds: selectedGroupParticipants,
      });
      setShowNewChatModal(false);
      setCommunityName("");
      setCommunityDescription("");
      setCommunityIsPublic(true);
      setSelectedGroupParticipants([]);
      setActiveTab("community");
      setSelectedConversation(conv);
      toast.success(`Community "${conv.name}" created successfully!`);
    } catch (err: any) {
      console.error("Failed to create community:", err);
      toast.error(err?.message || "Failed to create community");
    } finally {
      setCreatingCommunity(false);
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
              onClick={() => {
                if (activeTab === "community" && isAdminOrCoordinator) {
                  openNewChatModal("community");
                } else if (activeTab === "group" && isAdminOrCoordinator) {
                  setShowCreateGroupModal(true);
                } else {
                  openNewChatModal("direct");
                }
              }}
              className="h-9 px-3.5 bg-primary hover:bg-primary/90 text-white rounded-xl flex items-center gap-1.5 text-xs font-semibold shadow-sm shadow-primary/30 transition-all duration-200 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>
                {activeTab === "community" && isAdminOrCoordinator
                  ? "New Community"
                  : activeTab === "group" && isAdminOrCoordinator
                  ? "New Group"
                  : "New Chat"}
              </span>
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
            <div className="flex items-center gap-1.5 text-slate-500">
              {selectedConversation.type === "community" && (
                <button
                  onClick={() => setShowSavedPostsModal(true)}
                  title="View Saved Posts"
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/90 flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs mr-1"
                >
                  <Bookmark className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span className="hidden sm:inline">Saved Posts</span>
                </button>
              )}

              <button
                onClick={() => setShowInChatSearch(!showInChatSearch)}
                title="Search in chat"
                className={`p-2 rounded-xl transition-all ${
                  showInChatSearch
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                }`}
              >
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

          {/* In-Chat Search Bar */}
          <InChatSearchBar
            isOpen={showInChatSearch}
            onClose={() => {
              setShowInChatSearch(false);
              setHighlightedMessageId(null);
            }}
            messages={messages}
            onSelectMatch={handleJumpToSearchMatch}
          />

          {/* Messages Feed & Attachment Staging Area */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            {/* Messages Feed Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-slate-50/60">
              
              {/* Date divider */}
              <div className="flex items-center justify-center my-3">
                <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-semibold text-slate-500 shadow-2xs">
                  {selectedConversation.type === "community" ? "Community Feed" : "Today"}
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2">
                  <Sparkles className="h-8 w-8 text-primary/60 animate-pulse" />
                  <p className="text-xs font-medium text-slate-500">
                    {selectedConversation.type === "community"
                      ? "No posts in this community yet. Create the first post below!"
                      : "No messages yet. Send a greeting to start chatting!"}
                  </p>
                </div>
              ) : selectedConversation.type === "community" ? (
                /* Community Feed View with Social Post Cards */
                <div className="max-w-2xl mx-auto w-full space-y-4">
                  {messages.map((post) => (
                    <CommunityPostCard
                      key={post.id}
                      post={post}
                      communityId={selectedConversation.id}
                      currentUser={user}
                      isAdmin={isAdminOrCoordinator}
                      onPostUpdated={(updated) => {
                        setMessages((prev) =>
                          prev.map((m) => (m.id === updated.id ? updated : m))
                        );
                      }}
                      onPostDeleted={(postId) => {
                        setMessages((prev) => prev.filter((m) => m.id !== postId));
                      }}
                    />
                  ))}
                </div>
              ) : (
                /* Direct & Group Chat Messages Stream with Hover Action Bar */
                messages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  const senderName = msg.sender?.fullNames || "User";

                  const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  const isSingleAudio = !msg.content && msg.attachments?.length === 1 && msg.attachments[0].type === "audio";
                  const isSingleMedia = !msg.content && msg.attachments?.length === 1 && (msg.attachments[0].type === "image" || msg.attachments[0].type === "video");
                  const isHighlighted = highlightedMessageId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      id={`message-${msg.id}`}
                      className={`flex items-end gap-2.5 ${
                        isMine ? "justify-end" : "justify-start"
                      } group transition-all duration-300 ${isHighlighted ? "scale-[1.01]" : ""}`}
                    >
                      {!isMine && (
                        <ProfileAvatar photo={msg.sender?.photo || undefined} name={senderName} className="w-8 h-8 mb-1 flex-shrink-0 border border-slate-200 shadow-2xs" />
                      )}

                      {/* Message Hover Actions Toolbar */}
                      <div
                        className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-white border border-slate-200 shadow-xs rounded-xl px-1 py-0.5 mb-2 flex-shrink-0 z-10 ${
                          isMine ? "order-first mr-1" : "order-last ml-1"
                        }`}
                      >
                        {/* Like reaction */}
                        <button
                          onClick={() => handleToggleMessageLike(msg)}
                          className={`p-1 rounded-lg transition-colors ${
                            msg.isLikedByMe
                              ? "text-rose-500 hover:text-rose-600 bg-rose-50"
                              : "text-slate-400 hover:text-rose-500 hover:bg-slate-50"
                          }`}
                          title="Like message"
                        >
                          <Heart
                            className={`h-3.5 w-3.5 ${
                              msg.isLikedByMe ? "fill-rose-500 text-rose-500" : ""
                            }`}
                          />
                        </button>

                        {/* Reply */}
                        <button
                          onClick={() =>
                            setReplyingTo({
                              id: msg.id,
                              senderName,
                              content: msg.content || "",
                              type: msg.type,
                            })
                          }
                          className="p-1 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors"
                          title="Reply to message"
                        >
                          <Reply className="h-3.5 w-3.5" />
                        </button>

                        {/* Copy */}
                        {msg.content && (
                          <button
                            onClick={() => handleCopyMessage(msg.content)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                            title="Copy message"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Edit (own message only) */}
                        {isMine && (
                          <button
                            onClick={() => handleStartEditMessage(msg)}
                            className="p-1 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-50 transition-colors"
                            title="Edit message"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Delete (own message only) */}
                        {isMine && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50 transition-colors"
                            title="Delete message"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="max-w-md lg:max-w-lg space-y-1">
                        {!isMine && selectedConversation.type !== "direct" && (
                          <p className="text-[10px] font-bold text-primary ml-1">{senderName}</p>
                        )}

                        <div
                          className={`rounded-2xl text-xs leading-relaxed shadow-2xs transition-all duration-200 relative ${
                            isHighlighted ? "ring-4 ring-yellow-400/80 shadow-md" : ""
                          } ${
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
                          {/* Quoted Reply Banner */}
                          {msg.replyTo && (
                            <div
                              className={`mb-2 rounded-xl p-2.5 text-xs border-l-4 transition-all ${
                                isMine
                                  ? "bg-black/20 border-white/80 text-white/95"
                                  : "bg-slate-100/90 border-primary text-slate-800"
                              }`}
                            >
                              <p className="font-bold text-[11px] truncate mb-0.5">
                                {msg.replyTo.senderName}
                              </p>
                              <p className="text-[11px] line-clamp-2 opacity-85">
                                {msg.replyTo.type === "image"
                                  ? "📷 Photo"
                                  : msg.replyTo.type === "video"
                                  ? "🎥 Video"
                                  : msg.replyTo.type === "audio"
                                  ? "🎤 Voice Note"
                                  : msg.replyTo.type === "file"
                                  ? "📄 Document"
                                  : msg.replyTo.content || "Message"}
                              </p>
                            </div>
                          )}

                          {/* Inline Edit Form */}
                          {editingMessage?.id === msg.id ? (
                            <div className="space-y-2 py-1">
                              <textarea
                                value={editingMessageText}
                                onChange={(e) => setEditingMessageText(e.target.value)}
                                className="w-full text-xs text-slate-900 bg-white p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                rows={2}
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setEditingMessage(null)}
                                  className="px-2 py-1 text-[11px] rounded bg-white/20 hover:bg-white/30 text-white font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleSaveEditMessage}
                                  className="px-2.5 py-1 text-[11px] rounded bg-white text-primary font-bold shadow-xs hover:bg-white/90"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          )}

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

                          {/* Footer: Likes pill, edited tag, time, and read checks */}
                          <div className={`flex items-center justify-between gap-2 px-1 mt-1 text-[9px] ${isMine ? "text-white/80" : "text-slate-400"}`}>
                            <div>
                              {msg.likes && msg.likes > 0 ? (
                                <span
                                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold ${
                                    isMine
                                      ? "bg-white/20 text-white"
                                      : "bg-rose-50 text-rose-600 border border-rose-200/60"
                                  }`}
                                >
                                  <Heart className="h-2.5 w-2.5 fill-current text-rose-500" />
                                  <span>{msg.likes}</span>
                                </span>
                              ) : null}
                              {msg.isEdited && (
                                <span className="ml-1 opacity-70 italic">(edited)</span>
                              )}
                            </div>

                            {!isSingleAudio && !isSingleMedia && (
                              <div className="flex items-center gap-1">
                                <span>{formattedTime}</span>
                                {isMine && (
                                  (msg.readBy && msg.readBy.length > 0) ? (
                                    <CheckCheck className="h-3 w-3 text-sky-200" />
                                  ) : (
                                    <Check className="h-3 w-3 text-white/80" />
                                  )
                                )}
                              </div>
                            )}
                          </div>
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

            {/* Bottom Message Input Composer or Restricted Banner */}
            <div className="border-t border-slate-200 bg-white">
              {isRestrictedFromPosting ? (
                <div className="p-4 bg-slate-50 text-center flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <span>Only group admins can send messages to this group.</span>
                </div>
              ) : (
                <MessageComposer
                  value={messageText}
                  onChange={handleMessageInputChange}
                  onSend={handleSendMessage}
                  placeholder={
                    selectedConversation.type === "community"
                      ? "Share an update or question with the community..."
                      : "Write a message..."
                  }
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                />
              )}
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
            const isGroup = selectedConversation.type === "group";
            const isCommunity = selectedConversation.type === "community";
            const isCommunityCreator = isCommunity && (selectedConversation.createdById === user?.id || (selectedConversation as any).creator?.id === user?.id);
            const canManageCommunity = isCommunity && (isAdminOrCoordinator || isCommunityCreator);

            return (
              <div className="py-6 flex flex-col items-center text-center border-b border-slate-200">
                <ProfileAvatar photo={photo || undefined} name={title || "User"} className="w-16 h-16 rounded-2xl border-2 border-primary/20 shadow-md mb-3" />
                <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isGroup || isCommunity
                    ? `${selectedConversation.participants?.length || 0} Members`
                    : "Health Worker"}
                </p>

                {isCommunity && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 mt-1.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    <Globe className="h-3 w-3" />
                    {(selectedConversation as any).isPublic !== false ? "Public Community" : "Private Community"}
                  </span>
                )}
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-4 w-full justify-center">
                  <button className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" /> Call
                  </button>
                  <button className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl transition-all flex items-center justify-center gap-1.5">
                    <BellOff className="h-3.5 w-3.5 text-amber-600" /> Mute
                  </button>
                </div>

                {/* Group Admin Management Buttons */}
                {isGroup && isAdminOrCoordinator && (
                  <div className="mt-3 pt-3 border-t border-slate-100 w-full flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowEditGroupModal(true)}
                        className="flex-1 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit Group
                      </button>
                      <button
                        onClick={() => setShowAddMembersModal(true)}
                        className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Add Member
                      </button>
                    </div>
                    <button
                      onClick={() => setShowTerminateGroupModal(true)}
                      className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Terminate / Delete Group
                    </button>
                  </div>
                )}

                {/* Community Admin / Creator Actions */}
                {canManageCommunity && (
                  <div className="mt-3 pt-3 border-t border-slate-100 w-full flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowEditCommunityModal(true)}
                        className="flex-1 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="h-3.5 w-3.5" /> Edit Community
                      </button>
                      <button
                        onClick={() => setShowAddCommunityMembersModal(true)}
                        className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Add Member
                      </button>
                    </div>
                    <button
                      onClick={() => setShowTerminateCommunityModal(true)}
                      className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Community
                    </button>
                  </div>
                )}

                {/* Community Member Leave Button (for non-managers) */}
                {isCommunity && !canManageCommunity && (
                  <div className="mt-3 pt-3 border-t border-slate-100 w-full">
                    <button
                      onClick={handleLeaveCommunity}
                      className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Leave Community
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Community Description & Information */}
          {selectedConversation.type === "community" ? (
            <div className="py-4 space-y-3 border-b border-slate-200">
              <h5 className="text-xs font-bold text-slate-900">Community Description</h5>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                {(selectedConversation as any).description || "No description set for this community."}
              </p>
              
              {/* Community Members List */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold text-slate-900">
                    Members ({selectedConversation.participants?.length || 0})
                  </h5>
                  {(isAdminOrCoordinator || selectedConversation.createdById === user?.id) && (
                    <button
                      onClick={() => setShowAddCommunityMembersModal(true)}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                  {selectedConversation.participants?.map((p) => {
                    const participantUser = p.user;
                    const participantName = participantUser?.fullNames || "User";
                    const isSelf = p.userId === user?.id;
                    const isCreator = p.userId === selectedConversation.createdById;
                    const isAdmin = p.role === "admin" || isCreator;

                    return (
                      <div
                        key={p.id || p.userId}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <ProfileAvatar photo={participantUser?.photo || undefined} name={participantName} className="w-8 h-8 rounded-full border border-slate-200 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-semibold text-slate-800 truncate">
                                {participantName} {isSelf && <span className="text-[10px] text-slate-400 font-normal">(You)</span>}
                              </p>
                              {isCreator && (
                                <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" title="Community Creator" />
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">{isCreator ? "Creator" : isAdmin ? "Admin" : "Member"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!isSelf && participantUser && (
                            <button
                              onClick={() => startDirectChatWithUser(participantUser)}
                              className="p-1 text-slate-400 hover:text-primary hover:bg-white rounded-lg border border-transparent hover:border-slate-200"
                              title="Direct Message"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {!isSelf && (isAdminOrCoordinator || selectedConversation.createdById === user?.id) && (
                            <button
                              onClick={() => handleRemoveCommunityMember(p.userId, participantName)}
                              disabled={removingCommunityMemberId === p.userId}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-all"
                              title="Remove Member"
                            >
                              {removingCommunityMemberId === p.userId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                              ) : (
                                <UserMinus className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : selectedConversation.type === "group" ? (
            <div className="py-4 space-y-3 border-b border-slate-200">
              <h5 className="text-xs font-bold text-slate-900">Group Description</h5>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                {(selectedConversation as any).description || "No description set for this group."}
              </p>
              
              {/* Group Participants List */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold text-slate-900">
                    Participants ({selectedConversation.participants?.length || 0})
                  </h5>
                  {isAdminOrCoordinator && (
                    <button
                      onClick={() => setShowAddMembersModal(true)}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                  {selectedConversation.participants?.map((p) => {
                    const participantUser = p.user;
                    const participantName = participantUser?.fullNames || "User";
                    const isSelf = p.userId === user?.id;
                    const isAdmin = p.role === "admin" || p.role === "creator";

                    return (
                      <div
                        key={p.id || p.userId}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <ProfileAvatar photo={participantUser?.photo || undefined} name={participantName} className="w-8 h-8 rounded-full border border-slate-200 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-semibold text-slate-800 truncate">
                                {participantName} {isSelf && <span className="text-[10px] text-slate-400 font-normal">(You)</span>}
                              </p>
                              {isAdmin && (
                                <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" title="Group Admin" />
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">{isAdmin ? "Group Admin" : "Member"}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!isSelf && participantUser && (
                            <button
                              onClick={() => startDirectChatWithUser(participantUser)}
                              className="p-1 text-slate-400 hover:text-primary hover:bg-white rounded-lg border border-transparent hover:border-slate-200"
                              title="Direct Message"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {!isSelf && isAdminOrCoordinator && (
                            <button
                              onClick={() => handleToggleAdminRole(p.userId, p.role, participantName)}
                              disabled={updatingRoleUserId === p.userId}
                              className={`p-1 rounded-lg border border-transparent transition-all ${
                                isAdmin
                                  ? "text-amber-500 hover:text-slate-600 hover:bg-slate-100 hover:border-slate-200"
                                  : "text-slate-400 hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200"
                              }`}
                              title={isAdmin ? "Demote to Member" : "Make Group Admin"}
                            >
                              {updatingRoleUserId === p.userId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                              ) : (
                                <Crown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                          {!isSelf && isAdminOrCoordinator && (
                            <button
                              onClick={() => handleRemoveParticipant(p.userId, participantName)}
                              disabled={removingParticipantId === p.userId}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-all"
                              title="Remove Participant"
                            >
                              {removingParticipantId === p.userId ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                              ) : (
                                <UserMinus className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
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
          )}

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
                {modalTab === "community" ? (
                  <Globe className="h-4 w-4 text-primary" />
                ) : modalTab === "group" ? (
                  <Users className="h-4 w-4 text-primary" />
                ) : (
                  <UserPlus className="h-4 w-4 text-primary" />
                )}
                <span>
                  {modalTab === "community"
                    ? "Create New Community"
                    : modalTab === "group"
                    ? "Create New Group"
                    : "Start Direct Chat"}
                </span>
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

                <button
                  onClick={() => setModalTab("community")}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    modalTab === "community"
                      ? "bg-white text-primary shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>Community</span>
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

            {/* TAB 3: CREATE COMMUNITY */}
            {modalTab === "community" && (
              <div className="space-y-3.5">
                {!isAdminOrCoordinator ? (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                    Community creation is restricted to Admins and RBC Coordinators.
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Community Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Maternal Health Knowledge Hub"
                        value={communityName}
                        onChange={(e) => setCommunityName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="What is this community about? Share guidelines or topics..."
                        value={communityDescription}
                        onChange={(e) => setCommunityDescription(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-xl px-3.5 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                      />
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Public Community</p>
                          <p className="text-[10px] text-slate-500">Allow all health workers across districts to discover and join</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={communityIsPublic}
                            onChange={(e) => setCommunityIsPublic(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">Initial Members (Optional)</label>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {selectedGroupParticipants.length} selected
                        </span>
                      </div>

                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search members to invite..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="w-full bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar border border-slate-200/80 rounded-xl p-1 bg-slate-50/50">
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
                      onClick={handleCreateCommunity}
                      disabled={creatingCommunity || !communityName.trim()}
                      className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {creatingCommunity ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Creating Community...
                        </>
                      ) : (
                        `Create Community (${selectedGroupParticipants.length} Initial Members)`
                      )}
                    </button>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Group Modals */}
      {showCreateGroupModal && (
        <CreateGroupModal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          currentUserId={user?.id}
          onGroupCreated={(newGroup) => {
            invalidateConversations();
            setSelectedConversation(normalizeGroupChat(newGroup));
            setActiveTab("group");
            setShowCreateGroupModal(false);
          }}
        />
      )}

      {showEditGroupModal && selectedConversation && selectedConversation.type === "group" && (
        <EditGroupModal
          isOpen={showEditGroupModal}
          groupId={selectedConversation.id}
          initialName={selectedConversation.name || ""}
          initialDescription={selectedConversation.description || ""}
          initialPhoto={selectedConversation.photo || ""}
          initialOnlyAdminsCanSend={selectedConversation.onlyAdminsCanSend || false}
          onClose={() => setShowEditGroupModal(false)}
          onGroupUpdated={(updated) => {
            invalidateConversations();
            setSelectedConversation((prev) =>
              prev
                ? {
                    ...prev,
                    name: updated.name,
                    photo: updated.photo !== undefined ? updated.photo : prev.photo,
                    description: updated.description !== undefined ? updated.description : prev.description,
                    onlyAdminsCanSend: updated.onlyAdminsCanSend !== undefined ? updated.onlyAdminsCanSend : prev.onlyAdminsCanSend,
                  }
                : null
            );
            setShowEditGroupModal(false);
          }}
        />
      )}

      {showAddMembersModal && selectedConversation && selectedConversation.type === "group" && (
        <AddMembersModal
          isOpen={showAddMembersModal}
          groupId={selectedConversation.id}
          existingParticipantUserIds={selectedConversation.participants?.map((p) => p.userId) || []}
          onClose={() => setShowAddMembersModal(false)}
          onMembersAdded={() => {
            invalidateConversations();
            setShowAddMembersModal(false);
          }}
        />
      )}

      {showTerminateGroupModal && selectedConversation && selectedConversation.type === "group" && (
        <TerminateGroupModal
          isOpen={showTerminateGroupModal}
          groupId={selectedConversation.id}
          groupName={selectedConversation.name || "this group"}
          onClose={() => setShowTerminateGroupModal(false)}
          onGroupTerminated={() => {
            invalidateConversations();
            setSelectedConversation(null);
            setShowInfoPanel(false);
            setShowTerminateGroupModal(false);
          }}
        />
      )}

      {/* Community Management Modals */}
      {showEditCommunityModal && selectedConversation && selectedConversation.type === "community" && (
        <EditCommunityModal
          isOpen={showEditCommunityModal}
          communityId={selectedConversation.id}
          initialName={selectedConversation.name || ""}
          initialDescription={(selectedConversation as any).description || ""}
          initialPhoto={selectedConversation.photo || ""}
          initialIsPublic={(selectedConversation as any).isPublic !== false}
          onClose={() => setShowEditCommunityModal(false)}
          onCommunityUpdated={(updated) => {
            setSelectedConversation((prev) =>
              prev
                ? {
                    ...prev,
                    name: updated.name || prev.name,
                    photo: updated.photo !== undefined ? updated.photo : prev.photo,
                    description: updated.description !== undefined ? updated.description : (prev as any).description,
                    isPublic: updated.isPublic !== undefined ? updated.isPublic : (prev as any).isPublic,
                  }
                : null
            );
            invalidateConversations();
          }}
        />
      )}

      {showAddCommunityMembersModal && selectedConversation && selectedConversation.type === "community" && (
        <AddCommunityMembersModal
          isOpen={showAddCommunityMembersModal}
          communityId={selectedConversation.id}
          existingMemberUserIds={selectedConversation.participants?.map((p) => p.userId) || []}
          onClose={() => setShowAddCommunityMembersModal(false)}
          onMembersAdded={() => {
            invalidateConversations();
          }}
        />
      )}

      {showTerminateCommunityModal && selectedConversation && selectedConversation.type === "community" && (
        <TerminateCommunityModal
          isOpen={showTerminateCommunityModal}
          communityId={selectedConversation.id}
          communityName={selectedConversation.name || "this community"}
          onClose={() => setShowTerminateCommunityModal(false)}
          onCommunityTerminated={() => {
            invalidateConversations();
            setSelectedConversation(null);
            setShowInfoPanel(false);
            setShowTerminateCommunityModal(false);
          }}
        />
      )}

      {/* Saved Posts Modal */}
      <SavedPostsModal
        isOpen={showSavedPostsModal}
        onClose={() => setShowSavedPostsModal(false)}
        onSelectPost={(commId, postId) => {
          const found = typedConversations.find((c) => c.id === commId);
          if (found) {
            setActiveTab("community");
            setSelectedConversation(found);
            setTimeout(() => {
              const el = document.getElementById(`post-${postId}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 300);
          }
        }}
      />

      {confirmDialog}
    </div>
  </AudioPlayerProvider>
  );
};

export default Messaging;


