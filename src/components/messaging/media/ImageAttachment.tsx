import React, { useState } from "react";
import { CheckCheck } from "lucide-react";
import { IAttachment } from "@/types";
import { Lightbox } from "./Lightbox";

interface ImageAttachmentProps {
  attachment: IAttachment;
  variant: "bubble" | "card";
  formattedTimestamp?: string;
  isOwn?: boolean;
}

export const ImageAttachment: React.FC<ImageAttachmentProps> = ({
  attachment,
  variant,
  formattedTimestamp,
  isOwn,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative group overflow-hidden rounded-2xl cursor-pointer">
        <img
          src={attachment.url}
          alt={attachment.name || "Shared image"}
          onClick={() => setOpen(true)}
          className={
            variant === "bubble"
              ? "w-full max-w-xs sm:max-w-sm h-auto max-h-80 object-cover cursor-pointer block rounded-2xl transition-transform duration-200 group-hover:scale-[1.01]"
              : "w-full h-64 object-cover rounded-2xl cursor-pointer block"
          }
        />
        {formattedTimestamp && (
          <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1 z-10 shadow-2xs pointer-events-none">
            <span>{formattedTimestamp}</span>
            {isOwn && <CheckCheck className="h-3 w-3 text-white/90" />}
          </div>
        )}
      </div>
      {open && <Lightbox url={attachment.url} onClose={() => setOpen(false)} />}
    </>
  );
};
