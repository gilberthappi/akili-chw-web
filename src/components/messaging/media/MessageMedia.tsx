import React from "react";
import { IAttachment } from "@/types";
import { ImageAttachment } from "./ImageAttachment";
import { VideoAttachment } from "./VideoAttachment";
import { AudioAttachment } from "./AudioAttachment";
import { FileAttachment } from "./FileAttachment";

interface MessageMediaProps {
  attachment: IAttachment;
  variant: "bubble" | "card";
  messageId: string;
}

export const MessageMedia: React.FC<MessageMediaProps> = ({ attachment, variant, messageId }) => {
  switch (attachment.type) {
    case "image":
      return <ImageAttachment attachment={attachment} variant={variant} />;
    case "video":
      return <VideoAttachment attachment={attachment} variant={variant} />;
    case "audio":
      return <AudioAttachment attachment={attachment} messageId={messageId} variant={variant} />;
    case "file":
    default:
      return <FileAttachment attachment={attachment} variant={variant} />;
  }
};
