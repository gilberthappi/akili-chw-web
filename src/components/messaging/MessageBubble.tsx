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
  const attachment = message.attachments?.[0];
  const isEdgeToEdgeMedia = !isEditing && !!attachment && (message.type === "image" || message.type === "video");

  return (
    <div
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
            className={`rounded-2xl shadow-sm max-w-xs lg:max-w-md overflow-hidden ${
              isOwn ? "bg-[#3363AD] text-white rounded-br-md" : "bg-white text-gray-900 rounded-bl-md border border-gray-200"
            } ${isEditing || !isEdgeToEdgeMedia ? "px-4 py-3" : ""}`}
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
            ) : (
              <>
                {message.type === "text" && <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>}
                {isEdgeToEdgeMedia && attachment && (
                  <MessageMedia attachment={attachment} variant="bubble" messageId={message.id} />
                )}
                {message.type !== "text" && !isEdgeToEdgeMedia && attachment && (
                  <MessageMedia attachment={attachment} variant="bubble" messageId={message.id} />
                )}
                {message.type !== "text" && message.content && (
                  <p className={`text-sm ${isEdgeToEdgeMedia ? "px-4 pt-2" : "mt-2"}`}>{message.content}</p>
                )}
                <div className={`flex items-center justify-end gap-1 mt-2 ${isEdgeToEdgeMedia ? "px-4 pb-1" : ""}`}>
                  {(message.likes || 0) > 0 && (
                    <span className={`text-xs flex items-center gap-0.5 ${isOwn ? "text-blue-200" : "text-gray-500"}`}>
                      <Heart size={11} className="fill-current text-red-400" />
                      {message.likes}
                    </span>
                  )}
                  <span className={`text-xs flex items-center gap-1 ${isOwn ? "text-blue-200" : "text-gray-500"}`}>
                    {message.isEdited && "Edited · "}
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {isOwn && <CheckCheck size={12} className="text-blue-200" />}
                  </span>
                </div>
              </>
            )}
          </div>
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
          color="bg-[#3363AD] text-white"
        />
      )}
    </div>
  );
};
