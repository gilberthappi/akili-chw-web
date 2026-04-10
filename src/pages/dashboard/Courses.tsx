import {
  useState,
} from "react";
import {
  LuCirclePlus,
} from "react-icons/lu";
import { Link, useNavigate } from "react-router-dom";
import FilterTabs, { TabItem } from "@/components/ui/FilterTabs";
import CourseList from "@/components/courses/CourseList";
import CreateCourseModal from "@/components/courseBuilder/CreateCourseModal";
import { CourseCreationForm } from "@/types/courseBuilder.d";


// Utility class for consistent transitions
const transitionClass = "transition-all duration-500 ease-in-out";

const CoursesPage = () => {
  const [selectedTab, setSelectedTab] = useState("all");
  const [showCourseBuilderModal, setShowCourseBuilderModal] = useState(false);
  const navigate = useNavigate();

  // Define tab items
  const tabItems: TabItem[] = [
    { key: "all", label: "All" },
    { key: "published", label: "Published" },
    { key: "draft", label: "Draft" },
  ];

  // Get filter string based on selected tab
  const getFilterString = (tabKey: string): string => {
    switch (tabKey) {
      case "published":
        return "published";
      case "draft":
        return "draft";
      default:
        return "all";
    }
  };

  const handleTabChange = (tabKey: string) => {
    setSelectedTab(tabKey);
  };

  const handleCourseBuilderSubmit = (formData: CourseCreationForm) => {
    setShowCourseBuilderModal(false);
    navigate("/courses/builder", {
      state: {
        courseForm: formData,
      },
    });
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-[#333333]">Courses</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={"/courses/new"}
              className={`flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-medium text-white ${transitionClass} hover:bg-[#4d81d2]`}
            >
              <span className="text-xl">
                <LuCirclePlus />
              </span>
              <span>New Course</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowCourseBuilderModal(true)}
              className={`flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-medium text-white ${transitionClass} hover:bg-[#4d81d2]`}
            >
              <span className="text-xl">🏗️</span>
              <span>Course Builder</span>
            </button>
          </div>
        </div>

        <FilterTabs
          items={tabItems}
          activeTab={selectedTab}
          onTabChange={handleTabChange}
          variant="default"
        />

        <CourseList hideHeader={true} filter={getFilterString(selectedTab)} />
      </div>

      <CreateCourseModal
        isOpen={showCourseBuilderModal}
        onClose={() => setShowCourseBuilderModal(false)}
        onSubmit={handleCourseBuilderSubmit}
      />
    </>
  );
};

export default CoursesPage;