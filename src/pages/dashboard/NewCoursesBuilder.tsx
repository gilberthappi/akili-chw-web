import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import CourseBuilder from "@/components/courseBuilder/CourseBuilder";
import {
  CourseBuilderData,
  CourseCreationForm,
} from "@/types/courseBuilder.d";

type CreatedCourseDraft = {
  id: string;
  title: string;
  description?: string;
  coverIcon: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

type BuilderLocationState = {
  courseForm?: CourseCreationForm;
  createdCourse?: CreatedCourseDraft;
};

const buildDraftCourse = (
  formData?: CourseCreationForm,
  createdCourse?: CreatedCourseDraft
): CourseBuilderData => {
  if (createdCourse) {
    return {
      id: createdCourse.id,
      title: createdCourse.title,
      description: createdCourse.description || formData?.description || "",
      coverIcon: createdCourse.coverIcon || formData?.coverIcon || "📘",
      sections: [],
      isPublished: createdCourse.isPublished,
      createdAt: createdCourse.createdAt,
      updatedAt: createdCourse.updatedAt,
    };
  }

  const now = new Date().toISOString();

  return {
    id: `course-${Date.now()}`,
    title: formData?.title?.trim() || "Untitled Course",
    description:
      formData?.description?.trim() ||
      "Add a short description for this course.",
    coverIcon: formData?.coverIcon || "📘",
    sections: [],
    isPublished: false,
    createdAt: now,
    updatedAt: now,
  };
};

export default function NewCoursesBuilder() {
  const location = useLocation();
  const navigate = useNavigate();

  const locationState = (location.state as BuilderLocationState | null) ?? null;

  const [courseData, setCourseData] = useState<CourseBuilderData>(() =>
    buildDraftCourse(locationState?.courseForm, locationState?.createdCourse)
  );

  const handleSaveCourse = (updatedCourse: CourseBuilderData) => {
    setCourseData({
      ...updatedCourse,
      updatedAt: new Date().toISOString(),
    });
    toast.success("Course saved successfully!");
  };

  const handleBackFromBuilder = () => {
    navigate("/courses");
  };

  return (
    <CourseBuilder
      courseData={courseData}
      onSave={handleSaveCourse}
      onBack={handleBackFromBuilder}
    />
  );
}
