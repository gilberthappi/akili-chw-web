import {
  Trash2,
  Copy,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  GripVertical,
  Play,
  RotateCw,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { CourseSlide } from "@/types/courseBuilder.d";

interface SlideCardProps {
  slide: CourseSlide;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDownload: (slide: CourseSlide) => void;
  onReplace?: (slideId: string, file: File) => void;
  onView?: (slide: CourseSlide) => void;
  onTitleChange?: (slideId: string, newTitle: string) => void;
  isDragging?: boolean;
  isAnySlideBeingDragged?: boolean;
  order?: number;
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case "pdf":
    case "document":
      return <FileText className="w-5 h-5" />;
    case "image":
      return <ImageIcon className="w-5 h-5" />;
    case "video":
      return <Video className="w-5 h-5" />;
    default:
      return <Music className="w-5 h-5" />;
  }
};

const getFileTypeColor = (fileType: string) => {
  switch (fileType) {
    case "pdf":
      return "bg-red-100 text-red-700";
    case "image":
      return "bg-purple-100 text-purple-700";
    case "video":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function SlideCard({
  slide,
  onDelete,
  onDuplicate,
  onView,
  onReplace,
  onTitleChange,
  isDragging = false,
  isAnySlideBeingDragged = false,
  order = 0,
}: SlideCardProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(slide.title);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Keep editingTitle in sync when the slide title changes externally (e.g. after replace)
  useEffect(() => {
    setEditingTitle(slide.title);
  }, [slide.title]);

  const handleReplaceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    replaceInputRef.current?.click();
  };

  const handleReplaceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReplace?.(slide.id, file);
    }
    // Reset so the same file can be re-selected later
    e.target.value = "";
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 border-gray-200 overflow-hidden transition transform flex flex-col ${
        isAnySlideBeingDragged
          ? "scale-75 opacity-60 aspect-square"
          : isDragging
          ? "opacity-75 scale-50 aspect-square"
          : "aspect-square hover:border-blue-400"
      }`}
    >
      {/* ── Preview Area — click to open viewer ── */}
      <div
        className="flex-1 bg-gray-100 flex items-center justify-center relative group overflow-hidden cursor-pointer"
        onClick={() => onView?.(slide)}
      >
        {/* Image thumbnail */}
        {slide.fileType === "image" && (
          <img
            src={slide.fileUrl}
            alt={slide.title}
            className="w-full h-full object-cover pointer-events-none select-none"
            draggable={false}
          />
        )}

        {/* PDF — icon only (no iframe/embed that swallows clicks) */}
        {slide.fileType === "pdf" && (
          <div className="flex flex-col items-center justify-center gap-2 pointer-events-none select-none">
            <FileText className="w-14 h-14 text-red-400" />
            <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">
              PDF
            </span>
          </div>
        )}

        {/* Video thumbnail */}
        {slide.fileType === "video" && (
          <>
            <video
              src={slide.fileUrl}
              className="w-full h-full object-cover pointer-events-none"
              crossOrigin="anonymous"
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition">
                <Play className="w-6 h-6 text-blue-600 fill-blue-600" />
              </div>
            </div>
          </>
        )}

        {/* Position badge */}
        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow pointer-events-none">
          {order}
        </div>

        {/* Drag handle */}
        <div className="absolute top-2 left-2 bg-white rounded-lg p-1 shadow opacity-0 group-hover:opacity-100 transition pointer-events-none">
          <GripVertical className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-3 space-y-2">
        {/* Title — inline editable */}
        {isEditingTitle ? (
          <input
            type="text"
            autoFocus
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={() => {
              if (editingTitle.trim() && onTitleChange) {
                onTitleChange(slide.id, editingTitle);
              }
              setIsEditingTitle(false);
              setEditingTitle(slide.title);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (editingTitle.trim() && onTitleChange) {
                  onTitleChange(slide.id, editingTitle);
                }
                setIsEditingTitle(false);
              }
              if (e.key === "Escape") {
                setIsEditingTitle(false);
                setEditingTitle(slide.title);
              }
            }}
            className="w-full px-2 py-1 text-xs font-medium bg-white border-2 border-blue-500 rounded focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p
            onClick={() => setIsEditingTitle(true)}
            className="font-medium text-gray-900 text-sm line-clamp-2 cursor-pointer hover:text-blue-600 transition"
          >
            {slide.title}
          </p>
        )}

        {/* File info */}
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${getFileTypeColor(
              slide.fileType
            )}`}
          >
            {getFileIcon(slide.fileType)}
            {slide.fileType.toUpperCase()}
          </span>
          <span className="text-gray-600 truncate">{slide.fileName}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-2 border-t border-gray-200">
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(slide.id); }}
            className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded transition flex items-center justify-center gap-1"
            title="Duplicate slide"
          >
            <Copy className="w-4 h-4" />
            <span className="text-xs">Duplicate</span>
          </button>

          {/* Replace button + hidden file input in the same component */}
          <button
            onClick={handleReplaceClick}
            className="flex-1 p-2 text-amber-600 hover:bg-amber-50 rounded transition flex items-center justify-center gap-1"
            title="Replace slide"
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-xs">Replace</span>
          </button>
          <input
            ref={replaceInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.ico,.tiff,.mp4,.avi,.mov,.mkv,.webm,.flv,.wmv,.m4v,.3gp"
            style={{ display: "none" }}
            onChange={handleReplaceFileChange}
          />

          <button
            onClick={(e) => { e.stopPropagation(); onDelete(slide.id); }}
            className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded transition flex items-center justify-center gap-1"
            title="Delete slide"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-xs">Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
