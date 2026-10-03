import React from "react";
import { useSearchParams } from "react-router-dom";
import { Activity, BookOpen, GraduationCap } from "lucide-react";
import { V2PageHeader, V2Tabs, type V2TabItem } from "@/components/v2/V2Page";
import { V2_PAGE_CANVAS } from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import { CourseAnalytics } from "./CourseAnalytics";
import { StudentAnalytics } from "./StudentAnalytics";
import { AttendanceAnalytics } from "./AttendanceAnalytics";

type DashboardTab = "courses" | "chws" | "attendance";

const TABS: V2TabItem<DashboardTab>[] = [
  { key: "courses", label: "Courses", Icon: BookOpen },
  { key: "chws", label: "CHWs", Icon: GraduationCap },
  { key: "attendance", label: "Attendance", Icon: Activity },
];

const SUBTITLES: Record<DashboardTab, string> = {
  courses: "Enrolment, completion and performance for every course",
  chws: "CHW engagement, scores and recent learning activity",
  attendance: "How regularly CHWs learn: daily, weekly and monthly activeness",
};

const isTab = (value: string | null): value is DashboardTab =>
  value === "courses" || value === "chws" || value === "attendance";

/** CIIC-HIN home: course, CHW and attendance analytics. */
export const CiicAnalyticsDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const tab: DashboardTab = isTab(requested) ? requested : "courses";

  const changeTab = (key: DashboardTab) => {
    const next = new URLSearchParams(searchParams);
    if (key === "courses") next.delete("tab");
    else next.set("tab", key);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className={V2_PAGE_CANVAS}>
      <V2PageHeader
        title='Dashboard'
        subtitle={SUBTITLES[tab]}
        actions={<V2Tabs items={TABS} active={tab} onChange={changeTab} />}
      />
      {tab === "courses" && <CourseAnalytics />}
      {tab === "chws" && <StudentAnalytics />}
      {tab === "attendance" && <AttendanceAnalytics />}
    </div>
  );
};

export default CiicAnalyticsDashboard;
