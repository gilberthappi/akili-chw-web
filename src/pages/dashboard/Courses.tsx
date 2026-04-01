import {
  useState,
} from "react";
import {
  LuCirclePlus,
} from "react-icons/lu";
import { Link } from "react-router-dom";
import FilterTabs, { TabItem } from "@/components/ui/FilterTabs";
import CourseList from "@/components/courses/CourseList";


// Utility class for consistent transitions
const transitionClass = "transition-all duration-500 ease-in-out";

const CoursesPage = () => {
  const [selectedTab, setSelectedTab] = useState("all");

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

  return (
          <div className="space-y-2">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-[#333333]">
                  Courses
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
               
                <Link
                  to={"/courses/new"}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white font-medium ${transitionClass} hover:bg-[#4d81d2]`}
                >
                  <span className="text-xl">
                    <LuCirclePlus />
                  </span>
                  <span>New Course</span>
                </Link>
                
                <Link
                  to={"/courses/builder"}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 text-white font-medium ${transitionClass} hover:bg-orange-700`}
                >
                  <span className="text-xl">
                    🏗️
                  </span>
                  <span>Course Builder</span>
                </Link>
              </div>
            </div>

            <FilterTabs
              items={tabItems}
              activeTab={selectedTab}
              onTabChange={handleTabChange}
              variant="default"
            />

            <CourseList 
              hideHeader={true}
              filter={getFilterString(selectedTab)}
            />
          </div>
  );
};

export default CoursesPage;