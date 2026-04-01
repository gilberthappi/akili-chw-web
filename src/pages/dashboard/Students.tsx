import {
  useState,
} from "react";
// import {
//   LuCirclePlus,
// } from "react-icons/lu";
// import { Link } from "react-router-dom";
import FilterTabs, { TabItem } from "@/components/ui/FilterTabs";
import StudentsList from "@/components/students/StudentList";

// Utility class for consistent transitions
// const transitionClass = "transition-all duration-500 ease-in-out";

const StudentsPage = () => {
  const [selectedTab, setSelectedTab] = useState("all");

  // Define tab items
  const tabItems: TabItem[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
  ];

  // Get filter string based on selected tab
  const getFilterString = (tabKey: string): string => {
    switch (tabKey) {
      case "active":
        return "active";
      case "inactive":
        return "inactive";
      default:
        return "all";
    }
  };

  const handleTabChange = (tabKey: string) => {
    setSelectedTab(tabKey);
  };

  return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-[#333333]">
                  Students
                </h2>
              </div>
              {/* <div className="flex flex-wrap items-center gap-3">
                <Link
                  to={"/trainer/students/new"}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4d81d2] text-white font-medium ${transitionClass} hover:bg-[#073e92]`}
                >
                  <span className="text-xl">
                    <LuCirclePlus />
                  </span>
                  <span>Add Student</span>
                </Link>
              </div> */}
            </div>

            <FilterTabs
              items={tabItems}
              activeTab={selectedTab}
              onTabChange={handleTabChange}
              variant="default"
            />

            <StudentsList 
              hideHeader={true}
              filter={getFilterString(selectedTab)}
            />
          </div>
  );
};

export default StudentsPage;