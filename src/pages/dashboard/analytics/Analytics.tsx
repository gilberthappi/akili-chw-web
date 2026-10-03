import React from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { V2PageHeader, V2Tabs, type V2TabItem } from "@/components/v2/V2Page";
import { V2_PAGE_CANVAS } from "@/components/dashboard/v2/widgets/admin/v2CardStyles";
import { COURSE_MGMT_ROLES, expandRoles, resolveDepartmentStaffRole } from "@/utils/roles";

export type AnalyticsTab = "courses" | "student";

const TAB_META: Record<AnalyticsTab, { label: string; subtitle: string; Icon: typeof BookOpen }> = {
  courses: {
    label: "Courses",
    subtitle: "Enrolment, completion and performance for every course",
    Icon: BookOpen,
  },
  student: {
    label: "CHWs",
    subtitle: "CHW engagement, scores and recent learning activity",
    Icon: GraduationCap,
  },
};

export const useAnalyticsTabs = (): AnalyticsTab[] => {
  const { user } = useAuth();
  const roles = (Array.isArray(user?.roles) ? user.roles : user?.roles ? [user.roles] : []) as string[];
  const effective = expandRoles(roles);
  const tabs: AnalyticsTab[] = [];
  if (COURSE_MGMT_ROLES.some((r) => effective.has(r))) tabs.push("courses", "student");
  return tabs;
};

export const Analytics: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tabs = useAnalyticsTabs();
  const segment = location.pathname.replace(/^\/analytics\/?/, "").split("/")[0] as AnalyticsTab | "";

  if (resolveDepartmentStaffRole(user?.roles as string[] | string | undefined)?.startsWith("CIIC_")) {
    return <Navigate to={segment === "student" ? "/?tab=chws" : "/"} replace />;
  }

  if (!segment || !tabs.includes(segment)) {
    if (tabs.length === 0) return <Navigate to='/' replace />;
    return <Navigate to={`/analytics/${tabs[0]}${location.search}`} replace />;
  }

  const items: V2TabItem<AnalyticsTab>[] = tabs.map((key) => ({
    key,
    label: TAB_META[key].label,
    Icon: TAB_META[key].Icon,
  }));

  return (
    <div className={V2_PAGE_CANVAS}>
      <V2PageHeader
        title='Analytics'
        subtitle={TAB_META[segment].subtitle}
        actions={
          tabs.length > 1 ? (
            <V2Tabs items={items} active={segment} onChange={(key) => navigate(`/analytics/${key}`)} />
          ) : undefined
        }
      />
      <Outlet />
    </div>
  );
};
