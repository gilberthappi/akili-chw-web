import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import CourseBuilder from "@/components/courseBuilder/CourseBuilder";
import {
  CourseBuilderData,
  CourseCreationForm,
} from "@/types/courseBuilder.d";

type BuilderLocationState = {
  courseForm?: CourseCreationForm;
};

const buildDraftCourse = (formData?: CourseCreationForm): CourseBuilderData => {
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
    buildDraftCourse(locationState?.courseForm)
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
