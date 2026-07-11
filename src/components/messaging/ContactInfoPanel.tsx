import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Search, BellOff, Bell, Ban, UserX, Trash2, Pencil, LogOut, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/common/Button";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { IConversation, IUser } from "@/types";
import { conversationAvatarColor, realPhoto } from "./avatarStyles";
import { useMuteConversation } from "@/hooks/useConversations";
import { useBlockedUsers, useBlockUser, useUnblockUser } from "@/hooks/useUserRelations";
import { getDirectChatWithMessages } from "@/services/directChat.service";
import { useNotificationsContext } from "@/contexts/NotificationsContext";
import { useAuth } from "@/hooks/useAuth";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";

const formatRelativeTime = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

interface ContactInfoPanelProps {
  conversation: IConversation;
  onClose: () => void;
  onSearchInConversation: () => void;
  onAddParticipant: (userId: string) => void;
  onRemoveParticipant: (userId: string) => void;
  onEditConversation?: () => void;
  onLeaveConversation?: () => void;
  onDeleteConversation?: () => void;
  availableUsers: IUser[];
}

export const ContactInfoPanel: React.FC<ContactInfoPanelProps> = ({
  conversation,
  onClose,
  onSearchInConversation,
  onAddParticipant,
  onRemoveParticipant,
  onEditConversation,
  onLeaveConversation,
  onDeleteConversation,
  availableUsers,
}) => {
  const { user: currentUser } = useAuth();
  const isDirect = conversation.type === "direct";
  const isCreator = !isDirect && conversation.createdById === currentUser?.id;
  const otherParticipant = conversation.participants[0];
  const displayName = isDirect ? otherParticipant?.user?.fullNames || "User" : conversation.name || "Unnamed";
  const displayPhoto = isDirect ? otherParticipant?.user?.photo : conversation.photo;

  const [selectedNewMember, setSelectedNewMember] = useState("");

  const { onlineUserIds, lastSeenByUserId } = useNotificationsContext();
  const isOnline = isDirect && otherParticipant ? onlineUserIds.has(otherParticipant.userId) : false;
  const lastSeen = isDirect && otherParticipant ? lastSeenByUserId[otherParticipant.userId] : undefined;

  // The conversation list only carries {id, fullNames, photo} per user — fetch the richer
  // profile (phone/email) for the contact-information section when viewing a direct chat.
  const { data: directChatDetails } = useQuery(
    ["direct-chat-details", conversation.id],
    () => getDirectChatWithMessages(conversation.id),
    { enabled: isDirect, staleTime: 1000 * 60 }
  );
  const chatDetail = directChatDetails?.chat;
  const contactDetails =
    isDirect && chatDetail
      ? chatDetail.user1.id === chatDetail.otherUserId
        ? chatDetail.user1
        : chatDetail.user2
      : undefined;

  const muteMutation = useMuteConversation();
  const { data: blockedUsers = [] } = useBlockedUsers();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();

  const isBlocked = isDirect && blockedUsers.some((b) => b.user.id === otherParticipant?.userId);
  const { confirm, dialog } = useConfirmDialog();

  const handleToggleMute = () => {
    muteMutation.mutate(
      { conversationId: conversation.id, type: conversation.type, muted: !conversation.muted },
      {
        onSuccess: () => toast.success(conversation.muted ? "Notifications unmuted" : "Notifications muted"),
        onError: () => toast.error("Failed to update mute setting"),
      }
    );
  };

  const handleToggleBlock = () => {
    if (!otherParticipant) return;
    if (isBlocked) {
      unblockMutation.mutate(otherParticipant.userId, {
        onSuccess: () => toast.success(`Unblocked ${displayName}`),
        onError: () => toast.error("Failed to unblock user"),
      });
    } else {
      confirm({
        title: "Block user?",
        message: `Block ${displayName}? They won't be able to message you anymore.`,
        variant: "danger",
        confirmLabel: "Block",
        onConfirm: () =>
          new Promise<void>((resolve) => {
            blockMutation.mutate(otherParticipant.userId, {
              onSuccess: () => {
                toast.success(`Blocked ${displayName}`);
                resolve();
              },
              onError: () => {
                toast.error("Failed to block user");
                resolve();
              },
            });
          }),
      });
    }
  };

  return (
    <div className="w-full lg:w-80 border-l border-gray-200 flex flex-col h-full bg-white overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Details</h3>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>

      <div className="p-6 flex flex-col items-center border-b border-gray-200">
        <ProfileAvatar
          name={displayName}
          photo={realPhoto(displayPhoto)}
          size="w-24 h-24"
          className="text-2xl mb-3"
          color={conversationAvatarColor[conversation.type]}
        />
        <div className="flex items-center gap-2">
          <p className="font-semibold text-lg text-gray-900 text-center">{displayName}</p>
          {!isDirect && onEditConversation && isCreator && (
            <button onClick={onEditConversation} className="text-gray-400 hover:text-gray-600" title="Edit conversation">
              <Pencil size={14} />
            </button>
          )}
        </div>
        {!isDirect && (
          <p className="text-sm text-gray-500 mt-1">{conversation.participants.length} members</p>
        )}
        {isDirect && isOnline && (
          <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Online
          </span>
        )}
      </div>

      {isDirect && (isOnline || lastSeen) && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Activity
          </h4>
          <div className="text-sm text-gray-700">
            {isOnline ? "Online now" : lastSeen ? `Last seen ${formatRelativeTime(lastSeen)}` : null}
          </div>
        </div>
      )}

      {isDirect && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Contact Information
          </h4>
          <div className="space-y-2 text-sm">
            {contactDetails?.phoneNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-900">{contactDetails.phoneNumber}</span>
              </div>
            )}
            {contactDetails?.email && (
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-900 truncate ml-2">{contactDetails.email}</span>
              </div>
            )}
            {!contactDetails && <p className="text-gray-400">Loading...</p>}
          </div>
        </div>
      )}

      {!isDirect && (
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Members ({conversation.participants.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {conversation.participants.map((p) => (
              <div key={p.userId} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ProfileAvatar name={p.user?.fullNames || "User"} photo={realPhoto(p.user?.photo)} size="w-8 h-8" />
                  <span className="text-sm text-gray-800 truncate">{p.user?.fullNames || "Unknown"}</span>
                </div>
                <button
                  onClick={() => onRemoveParticipant(p.userId)}
                  className="text-gray-400 hover:text-red-500"
                  title="Remove"
                >
                  <UserX size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <select
              value={selectedNewMember}
              onChange={(e) => setSelectedNewMember(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              <option value="">Add a member...</option>
              {availableUsers
                .filter((u) => !conversation.participants.some((p) => p.userId === u.id))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullNames}
                  </option>
                ))}
            </select>
            <Button
              size="sm"
              disabled={!selectedNewMember}
              onClick={() => {
                onAddParticipant(selectedNewMember);
                setSelectedNewMember("");
              }}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      <div className="p-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actions</h4>
        <div className="space-y-1">
          <button
            onClick={onSearchInConversation}
            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-100 text-sm text-gray-700"
          >
            <Search size={16} />
            Search in conversation
          </button>
          <button
            onClick={handleToggleMute}
            disabled={muteMutation.isLoading}
            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-100 text-sm text-gray-700"
          >
            {conversation.muted ? <Bell size={16} /> : <BellOff size={16} />}
            {conversation.muted ? "Unmute notifications" : "Mute notifications"}
          </button>
          {isDirect && (
            <button
              onClick={handleToggleBlock}
              disabled={blockMutation.isLoading || unblockMutation.isLoading}
              className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-red-50 text-sm text-red-600"
            >
              {isBlocked ? <Trash2 size={16} /> : <Ban size={16} />}
              {isBlocked ? "Unblock user" : "Block user"}
            </button>
          )}
          {!isDirect && !isCreator && onLeaveConversation && (
            <button
              onClick={() =>
                confirm({
                  title: `Leave this ${conversation.type}?`,
                  message: "You can rejoin later if you're invited back.",
                  variant: "danger",
                  confirmLabel: "Leave",
                  onConfirm: onLeaveConversation,
                })
              }
              className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-red-50 text-sm text-red-600"
            >
              <LogOut size={16} />
              {conversation.type === "group" ? "Leave group" : "Leave community"}
            </button>
          )}
        </div>
      </div>

      {!isDirect && isCreator && onDeleteConversation && (
        <div className="p-4 border-t border-red-200">
          <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <AlertTriangle size={14} />
            Danger Zone
          </h4>
          <div className="border border-red-200 rounded-lg p-3 bg-red-50">
            <p className="text-xs text-red-700 mb-3">
              {conversation.type === "group"
                ? "Deleting this group is permanent and cannot be undone."
                : "Deleting this community permanently removes all posts, comments, and members. This cannot be undone."}
            </p>
            <button
              onClick={() => {
                const label = conversation.type === "group" ? "group" : "community";
                confirm({
                  title: `Delete this ${label}?`,
                  message: "This action cannot be undone.",
                  variant: "danger",
                  confirmLabel: "Delete",
                  onConfirm: onDeleteConversation,
                });
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm text-white font-medium"
            >
              <Trash2 size={16} />
              {conversation.type === "group" ? "Delete group" : "Delete community"}
            </button>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
};
