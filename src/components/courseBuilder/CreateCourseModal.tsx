import React, { useState } from "react";
import { X, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { CourseCreationForm } from "@/types/courseBuilder.d";

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CourseCreationForm) => void;
}

const EMOJI_ICONS = [
  "📚",
  "🎓",
  "📖",
  "🏫",
  "👨‍🎓",
  "👩‍🎓",
  "💡",
  "🧠",
  "📝",
  "🎯",
  "⭐",
  "🚀",
];

export default function CreateCourseModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateCourseModalProps) {
  const [formData, setFormData] = useState<CourseCreationForm>({
    title: "",
    description: "",
    coverIcon: "📚",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Course title is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Course description is required");
      return;
    }

    onSubmit(formData);
    setFormData({ title: "", description: "", coverIcon: "📚" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create New Course</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Course Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Course Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Enter course title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Course Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter course description"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Cover Icon */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Course Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJI_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, coverIcon: icon })}
                  className={`p-3 text-2xl rounded-lg transition ${
                    formData.coverIcon === icon
                      ? "bg-blue-100 ring-2 ring-blue-500"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 flex items-center gap-4">
            <div className="text-5xl">{formData.coverIcon}</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 line-clamp-1">
                {formData.title || "Your Course Title"}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">
                {formData.description || "Your course description"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Create Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
