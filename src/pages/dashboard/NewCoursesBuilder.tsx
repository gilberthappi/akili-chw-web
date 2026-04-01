import { useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import CreateCourseModal from "@/components/courseBuilder/CreateCourseModal";
import CourseBuilder from "@/components/courseBuilder/CourseBuilder";
import {
  CourseCreationForm,
  CourseBuilderData,
} from "@/types/courseBuilder.d";

// Mock courses for listing
const MOCK_EXISTING_COURSES: CourseBuilderData[] = [
  {
    id: "course-001",
    title: "Introduction to Healthcare",
    description: "Learn the basics of healthcare management",
    coverIcon: "🏥",
    sections: [
      {
        id: "sec-001",
        title: "Section 1: Healthcare Basics",
        description: "Basic concepts",
        order: 1,
        chapters: [
          {
            id: "ch-001",
            title: "Chapter 1: Overview",
            description: "",
            order: 1,
            slides: [],
            hasTest: false,
          },
        ],
        hasTest: false,
      },
    ],
    isPublished: false,
    createdAt: "2024-08-01T10:00:00Z",
    updatedAt: "2024-08-01T10:00:00Z",
  },
  {
    id: "course-002",
    title: "Patient Communication",
    description: "Effective communication with patients",
    coverIcon: "💬",
    sections: [],
    isPublished: true,
    createdAt: "2024-07-15T14:30:00Z",
    updatedAt: "2024-08-05T09:15:00Z",
  },
];

export default function NewCoursesBuilder() {
  const [courses, setCourses] = useState<CourseBuilderData[]>(
    MOCK_EXISTING_COURSES
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCourse, setEditingCourse] =
    useState<CourseBuilderData | null>(null);

  // Handle create course
  const handleCreateCourse = (formData: CourseCreationForm) => {
    const newCourse: CourseBuilderData = {
      id: `course-${Date.now()}`,
      ...formData,
      sections: [],
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEditingCourse(newCourse);
    setShowCreateModal(false);
    toast.success("Course created! Start building your course.");
  };

  // Handle save course
  const handleSaveCourse = (updatedCourse: CourseBuilderData) => {
    const existingIndex = courses.findIndex((c) => c.id === updatedCourse.id);

    if (existingIndex !== -1) {
      const updated = [...courses];
      updated[existingIndex] = updatedCourse;
      setCourses(updated);
    } else {
      setCourses([...courses, updatedCourse]);
    }

    setEditingCourse(null);
    toast.success("Course saved successfully!");
  };

  // Handle edit course
  const handleEditCourse = (course: CourseBuilderData) => {
    setEditingCourse(course);
  };

  // Handle back from builder
  const handleBackFromBuilder = () => {
    setEditingCourse(null);
  };

  // If editing a course, show the builder
  if (editingCourse) {
    return (
      <CourseBuilder
        courseData={editingCourse}
        onSave={handleSaveCourse}
        onBack={handleBackFromBuilder}
      />
    );
  }

  // Show courses list
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
            <BookOpen className="w-10 h-10 text-blue-600" />
            Course Builder
          </h1>
          <p className="text-gray-600">
            Create and manage courses with interactive slides and chapters
          </p>
        </div>

        {/* Create Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create New Course
          </button>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition transform hover:scale-105"
            >
              {/* Cover */}
              <div className="h-32 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                <span className="text-6xl">{course.coverIcon}</span>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {course.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded p-3">
                    <p className="text-sm text-gray-600 mb-1">Sections</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {course.sections.length}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded p-3">
                    <p className="text-sm text-gray-600 mb-1">Slides</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {course.sections.reduce(
                        (sum, sec) =>
                          sum +
                          sec.chapters.reduce(
                            (chapterSum, ch) => chapterSum + ch.slides.length,
                            0
                          ),
                        0
                      )}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      course.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setCourses(courses.filter((c) => c.id !== course.id));
                      toast.success("Course deleted");
                    }}
                    className="flex-1 px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-20 h-20 mx-auto text-gray-300 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No courses yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first course to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Course
            </button>
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCourse}
      />
    </div>
  );
}
