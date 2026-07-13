import React from "react";
import { Users } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { IConversation } from "@/types";
import { conversationAvatarColor, realPhoto, formatRelativeTime } from "./avatarStyles";

interface ConversationListItemProps {
  conversation: IConversation;
  isActive: boolean;
  isTyping?: boolean;
  isOnline?: boolean;
  unreadCount?: number;
  onClick: () => void;
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  isActive,
  isTyping,
  isOnline,
  unreadCount = 0,
  onClick,
}) => {
  const isDirect = conversation.type === "direct";
  const isGroup = conversation.type === "group";
  const isCommunity = conversation.type === "community";

  const displayName = isDirect
    ? conversation.participants[0]?.user?.fullNames || "User"
    : conversation.name || "Unnamed";

  const displayPhoto = isDirect ? conversation.participants[0]?.user?.photo : conversation.photo;

  const mediaPreviewLabel: Record<string, string> = {
    image: "📷 Photo",
    video: "🎥 Video",
    audio: "🎵 Audio",
    file: "📄 Document",
  };
  const lastMessagePreview = conversation.lastMessage
    ? conversation.lastMessage.content?.trim()
      ? conversation.lastMessage.content
      : mediaPreviewLabel[conversation.lastMessage.type] || "Message"
    : "";

  return (
    <div
      onClick={onClick}
      className={`mx-2 my-0.5 p-3 rounded-xl cursor-pointer transition-colors ${
        isActive ? "bg-primary/10" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <ProfileAvatar
            name={displayName}
            photo={realPhoto(displayPhoto)}
            size="w-12 h-12"
            color={conversationAvatarColor[conversation.type]}
          />
          {isDirect && (isOnline || isTyping) && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          )}
          {isGroup && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
              <Users size={8} className="text-white" />
            </div>
          )}
          {isCommunity && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-purple-500 border-2 border-white rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faUsers} style={{ fontSize: "8px" }} className="text-white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-sm text-gray-900 truncate ${unreadCount > 0 ? "font-semibold" : "font-medium"}`}>{displayName}</p>
            {conversation.muted && (
              <span className="text-xs text-gray-400" title="Muted">🔕</span>
            )}
          </div>
          {conversation.lastMessage ? (
            <p className="text-xs text-gray-600 truncate mb-2">
              {isDirect
                ? lastMessagePreview
                : `${conversation.lastMessage.sender?.fullNames || "User"}: ${lastMessagePreview}`}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic mb-2">No messages yet</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {conversation.lastMessage && (
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatRelativeTime(conversation.lastMessage.timestamp)}
            </span>
          )}
          {unreadCount > 0 && (
            <div className="min-w-[18px] h-[18px] px-1 bg-primary rounded-full flex items-center justify-center">
              <span className="text-[10px] leading-none font-bold text-white">
                {unreadCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
