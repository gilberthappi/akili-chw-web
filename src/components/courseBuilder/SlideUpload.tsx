import React, { useState, useRef } from "react";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";
import { CourseSlide } from "@/types/courseBuilder.d";

interface SlideUploadProps {
  onSlideAdded: (slides: CourseSlide[]) => void;
  currentOrder: number;
}

type FileType = "pdf" | "image" | "video";

const ACCEPTED_FORMATS: Record<FileType, string[]> = {
  pdf: [".pdf"],
  image: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".ico", ".tiff"],
  video: [".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv", ".m4v", ".3gp"],
};

export default function SlideUpload({
  onSlideAdded,
  currentOrder,
}: SlideUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const getFileType = (fileName: string): FileType => {
    const ext = fileName.toLowerCase().split(".").pop() || "";

    if (ACCEPTED_FORMATS.pdf.includes(`.${ext}`)) return "pdf";
    if (ACCEPTED_FORMATS.image.includes(`.${ext}`)) return "image";
    if (ACCEPTED_FORMATS.video.includes(`.${ext}`)) return "video";

    return "image"; // Default fallback
  };

  const handleFiles = (files: FileList) => {
    setIsUploading(true);

    try {
      const newSlides: CourseSlide[] = Array.from(files).map(
        (file, index) => ({
          id: `slide-${Date.now()}-${index}`,
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          fileType: getFileType(file.name),
          fileUrl: URL.createObjectURL(file), // Mock: use object URL
          fileName: file.name,
          order: currentOrder + index,
          createdAt: new Date().toISOString(),
        })
      );

      onSlideAdded(newSlides);
      toast.success(`${files.length} slide(s) added successfully`);
    } catch (error) {
      toast.error("Error uploading files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="w-full">
      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Drop files here or click to upload
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Supported formats: PDF, Images (JPG, PNG, GIF, WebP, BMP), Videos (MP4, AVI, MOV, MKV, WebM)
        </p>
        <p className="text-xs text-gray-500">
          You can upload multiple files at once
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.ico,.tiff,.mp4,.avi,.mov,.mkv,.webm,.flv,.wmv,.m4v,.3gp"
        className="hidden"
        disabled={isUploading}
      />

      {isUploading && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">Uploading files...</p>
        </div>
      )}
    </div>
  );
}
