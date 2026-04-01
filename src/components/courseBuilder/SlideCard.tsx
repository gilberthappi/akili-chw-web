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
import { useState } from "react";
import { CourseSlide } from "@/types/courseBuilder.d";

interface SlideCardProps {
  slide: CourseSlide;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDownload: (slide: CourseSlide) => void;
  onReplace?: (slideId: string) => void;
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
  onReplace,
  onTitleChange,
  isDragging = false,
  isAnySlideBeingDragged = false,
  order = 0,
}: SlideCardProps) {
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(slide.title);
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
      {/* Preview Area */}
      <div className="flex-1 bg-gray-100 flex items-center justify-center relative group overflow-hidden">
        {slide.fileType === "image" && (
          <img
            src={slide.fileUrl}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
        )}
        {slide.fileType === "pdf" && (
          <iframe
            src={`${slide.fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
            className="w-full h-full border-none"
            title={slide.title}
          />
        )}
        {slide.fileType === "video" && (
          <>
            <video
              src={slide.fileUrl}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
            <button
              onClick={() => setShowVideoPlayer(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 opacity-0 group-hover:opacity-100 transition"
              title="Play video"
            >
              <div className="bg-white rounded-full p-4 shadow-lg">
                <Play className="w-8 h-8 text-blue-600 fill-blue-600" />
              </div>
            </button>
          </>
        )}

        {/* Position Badge */}
        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow">
          {order}
        </div>

        {/* Drag Handle */}
        <div className="absolute top-2 left-2 bg-white rounded-lg p-1 shadow opacity-0 group-hover:opacity-100 transition">
          <GripVertical className="w-4 h-4 text-gray-600" />
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title - Inline Editable */}
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
          />
        ) : (
          <p 
            onClick={() => setIsEditingTitle(true)}
            className="font-medium text-gray-900  text-sm line-clamp-2 cursor-pointer hover:text-blue-600 transition"
          >
            {slide.title}
          </p>
        )}

        {/* File Info */}
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`px-2 py-1 rounded-full font-semibold flex items-center gap-1 ${getFileTypeColor(
              slide.fileType
            )}`}
          >
            {getFileIcon(slide.fileType)}
            {slide.fileType.toUpperCase()}
          </span>
          <span className="text-gray-600">{slide.fileName}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-2 border-t border-gray-200">
          <button
            onClick={() => onDuplicate(slide.id)}
            className="flex-1 p-2 text-blue-600 hover:bg-blue-50 rounded transition flex items-center justify-center gap-1"
            title="Duplicate slide"
          >
            <Copy className="w-4 h-4" />
            <span className="text-xs">Duplicate</span>
          </button>
          <button
            onClick={() => onReplace?.(slide.id)}
            className="flex-1 p-2 text-amber-600 hover:bg-amber-50 rounded transition flex items-center justify-center gap-1"
            title="Replace slide"
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-xs">Replace</span>
          </button>
          <button
            onClick={() => onDelete(slide.id)}
            className="flex-1 p-2 text-red-600 hover:bg-red-50 rounded transition flex items-center justify-center gap-1"
            title="Delete slide"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-xs">Delete</span>
          </button>
        </div>
      </div>

      {/* Preview Modal - Removed since we only support PDF, Image, and Video */}
      
      {/* Video Player Modal */}
      {showVideoPlayer && slide.fileType === "video" && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowVideoPlayer(false)}
        >
          <div 
            className="bg-black rounded-lg max-w-4xl w-full max-h-screen overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-bold text-white">{slide.title}</h2>
              <button
                onClick={() => setShowVideoPlayer(false)}
                className="text-white hover:text-gray-300 text-3xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Video Player */}
            <div className="bg-black flex items-center justify-center">
              <video
                src={slide.fileUrl}
                className="w-full h-auto max-h-[calc(100vh-150px)] object-contain"
                controls
                autoPlay
                crossOrigin="anonymous"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
