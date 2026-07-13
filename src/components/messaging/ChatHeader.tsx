import React from "react";
import { Search, Info, ArrowLeft } from "lucide-react";
import { Button } from "@/components/common/Button";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { IConversation } from "@/types";
import { conversationAvatarColor, conversationBadgeColor, realPhoto } from "./avatarStyles";

interface ChatHeaderProps {
  conversation: IConversation;
  isOnline?: boolean;
  onBack?: () => void;
  onToggleSearch: () => void;
  onToggleInfo: () => void;
  infoOpen: boolean;
}

const typeLabel: Record<IConversation["type"], string> = {
  direct: "Direct message",
  group: "Group",
  community: "Community",
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  isOnline,
  onBack,
  onToggleSearch,
  onToggleInfo,
  infoOpen,
}) => {
  const isDirect = conversation.type === "direct";
  const displayName = isDirect
    ? conversation.participants[0]?.user?.fullNames || "User"
    : conversation.name || "Unnamed";
  const displayPhoto = isDirect ? conversation.participants[0]?.user?.photo : conversation.photo;

  return (
    <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 min-h-[80px]">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button onClick={onBack} className="lg:hidden p-1 -ml-1 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="relative flex-shrink-0">
          <ProfileAvatar
            name={displayName}
            photo={realPhoto(displayPhoto)}
            size="w-10 h-10"
            color={conversationAvatarColor[conversation.type]}
          />
          {isDirect && isOnline && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate">{displayName}</p>
            {!isDirect && (
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${conversationBadgeColor[conversation.type]}`}>
                {typeLabel[conversation.type]}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">
            {isDirect
              ? isOnline === undefined
                ? "Direct message"
                : isOnline
                ? "Online"
                : "Offline"
              : `${conversation.participants.length} members`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={onToggleSearch} title="Search in conversation">
          <Search size={20} />
        </Button>
        {/* Call/Video are intentionally omitted — no calling infrastructure exists yet */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleInfo}
          title="Conversation info"
          className={infoOpen ? "bg-gray-100" : ""}
        >
          <Info size={20} />
        </Button>
      </div>
    </div>
  );
};
