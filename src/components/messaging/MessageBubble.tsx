import React, { useState } from "react";
import { CheckCheck, Heart, Copy, Pencil, Trash2, X, Check } from "lucide-react";
import toast from "react-hot-toast";
import { IMessage } from "@/types";
import ProfileAvatar from "@/components/profile/ProfileAvatar";
import { realPhoto } from "./avatarStyles";
import { MessageMedia } from "./media/MessageMedia";

interface MessageBubbleProps {
  message: IMessage;
  isOwn: boolean;
  isGroup: boolean;
  isDirect: boolean;
  senderName: string;
  ownPhotoUrl?: string | null;
  isEditing: boolean;
  editingContent: string;
  onEditingContentChange: (text: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onToggleLike: () => void;
  /** Briefly rings the bubble — used to draw attention after jumping here from a search result. */
  highlighted?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  isGroup,
  isDirect,
  senderName,
  ownPhotoUrl,
  isEditing,
  editingContent,
  onEditingContentChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onToggleLike,
  highlighted,
}) => {
  const [hovered, setHovered] = useState(false);

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const showEditDelete = isOwn;
  const isRead = (message.readBy?.length || 0) > 0;
  const attachment = message.attachments?.[0];
  const isEdgeToEdgeMedia = !isEditing && !!attachment && (message.type === "image" || message.type === "video");
  const isCompactMedia = !isEditing && !!attachment && (message.type === "audio" || message.type === "file");

  const timeLabel = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const likesBadge = (message.likes || 0) > 0 && (
    <span className="flex items-center gap-0.5">
      <Heart size={11} className="fill-current text-red-400" />
      {message.likes}
    </span>
  );

  return (
    <div
      id={`message-${message.id}`}
      className={`flex items-end gap-2 group ${isOwn ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!isOwn && !isDirect && (
        <ProfileAvatar
          name={senderName}
          photo={realPhoto(message.sender?.photo)}
          size="w-8 h-8"
          className="text-xs flex-shrink-0"
          color="bg-gray-300 text-gray-700"
        />
      )}
      <div className={`flex items-center gap-1 max-w-xs lg:max-w-md ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
        <div className="flex flex-col max-w-xs lg:max-w-md">
          {!isOwn && isGroup && (
            <span className="text-xs text-gray-500 mb-1 ml-1">{message.sender?.fullNames || "User"}</span>
          )}
          <div
            className={`rounded-2xl shadow-sm overflow-hidden transition-shadow duration-500 ${
              isEdgeToEdgeMedia ? "w-64" : "max-w-xs lg:max-w-md"
            } ${
              isOwn ? "bg-primary text-white" : "bg-white text-gray-900 border border-gray-200"
            } ${isEditing || (!isEdgeToEdgeMedia && !isCompactMedia) ? "px-4 py-3" : ""} ${isCompactMedia ? "p-2" : ""} ${
              highlighted ? "ring-4 ring-yellow-300" : ""
            }`}
          >
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editingContent}
                  onChange={(e) => onEditingContentChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button onClick={onCancelEdit} className="p-1 rounded hover:bg-black/10" title="Cancel">
                    <X size={14} />
                  </button>
                  <button onClick={onSaveEdit} className="p-1 rounded hover:bg-black/10" title="Save">
                    <Check size={14} />
                  </button>
                </div>
              </div>
            ) : message.type === "text" ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            ) : isEdgeToEdgeMedia && attachment ? (
              <div className="relative">
                <MessageMedia attachment={attachment} variant="bubble" messageId={message.id} isOwn={isOwn} />
                <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5">
                  {likesBadge && <span className="text-[10px] text-white">{likesBadge}</span>}
                  <span className="text-[10px] text-white flex items-center gap-1">
                    {timeLabel}
                    {isOwn && (
                      <CheckCheck size={11} className={isRead ? "text-[#34B7F1]" : "text-white/70"} />
                    )}
                  </span>
                </div>
                {message.content && (
                  <p className="text-sm px-1 pt-2">{message.content}</p>
                )}
              </div>
            ) : (
              attachment && <MessageMedia attachment={attachment} variant="bubble" messageId={message.id} isOwn={isOwn} />
            )}
          </div>

          {/* Timestamp + read receipt: outside the bubble for text/compact-media, matching the reference */}
          {!isEditing && !isEdgeToEdgeMedia && (
            <div className={`flex items-center gap-1.5 mt-1 px-1 ${isOwn ? "justify-end" : "justify-start"}`}>
              {likesBadge && <span className="text-xs text-gray-400 flex items-center gap-0.5">{likesBadge}</span>}
              <span className="text-xs text-gray-400 flex items-center gap-1">
                {message.isEdited && "Edited · "}
                {timeLabel}
                {isOwn && (
                  <CheckCheck size={12} className={isRead ? "text-[#34B7F1]" : "text-gray-400"} />
                )}
              </span>
            </div>
          )}
        </div>

        {!isEditing && hovered && (
          <div
            className={`flex items-center gap-0.5 bg-white border border-gray-200 rounded-full shadow-sm px-1 py-0.5 flex-shrink-0`}
          >
            <button
              onClick={onToggleLike}
              className="p-1.5 rounded-full hover:bg-gray-100"
              title={message.isLikedByMe ? "Unlike" : "Like"}
            >
              <Heart size={14} className={message.isLikedByMe ? "fill-current text-red-500" : "text-gray-500"} />
            </button>
            {message.type === "text" && (
              <button onClick={handleCopy} className="p-1.5 rounded-full hover:bg-gray-100" title="Copy">
                <Copy size={14} className="text-gray-500" />
              </button>
            )}
            {showEditDelete && message.type === "text" && (
              <button onClick={onStartEdit} className="p-1.5 rounded-full hover:bg-gray-100" title="Edit">
                <Pencil size={14} className="text-gray-500" />
              </button>
            )}
            {showEditDelete && (
              <button onClick={onDelete} className="p-1.5 rounded-full hover:bg-gray-100" title="Delete">
                <Trash2 size={14} className="text-red-500" />
              </button>
            )}
          </div>
        )}
      </div>
      {isOwn && !isDirect && (
        <ProfileAvatar
          name={senderName}
          photo={realPhoto(ownPhotoUrl)}
          size="w-8 h-8"
          className="text-xs flex-shrink-0"
          color="bg-primary text-white"
        />
      )}
    </div>
  );
};
