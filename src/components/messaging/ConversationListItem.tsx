import React from "react";
import { Users } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { IConversation } from "@/types";
import { conversationAvatarColor, realPhoto } from "./avatarStyles";

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

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
        isActive ? "bg-blue-50" : ""
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
                ? conversation.lastMessage.content
                : `${conversation.lastMessage.sender?.fullNames || "User"}: ${conversation.lastMessage.content}`}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic mb-2">No messages yet</p>
          )}
          {!isDirect && (
            <div className="flex items-center gap-1 flex-wrap">
              {conversation.participants.slice(0, 3).map((p) => (
                <div
                  key={p.userId}
                  className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-white border border-white"
                  title={p.user?.fullNames}
                >
                  {p.user?.fullNames?.split(" ").map((n) => n[0]).join("") || "U"}
                </div>
              ))}
              {conversation.participants.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-xs font-bold text-white border border-white">
                  +{conversation.participants.length - 3}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {conversation.lastMessage && (
            <span className="text-xs text-gray-500">
              {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {unreadCount > 0 && (
            <div className="min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] leading-none font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
