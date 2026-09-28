import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, UserMinus, BarChart2 } from "lucide-react";
import { V2KpiCard, V2KpiSkeleton } from "@/components/v2/V2Page";
import { studentKeys } from "@/utils/constants/queryKeys";
import type { IStudentRoleStats } from "@/types";

interface StudentStatsCardsProps {
  roleFilter?: "TRAINEE" | "TESTER" | "CEHO";
}

const getRoleLabel = (roleFilter?: "TRAINEE" | "TESTER" | "CEHO") => {
  if (roleFilter === "TESTER") return "Tester";
  if (roleFilter === "CEHO") return "CEHO";
  return "CHW";
};

/**
 * KPI cards for CHW / Tester / CEHO tabs.
 * Data is hydrated by StudentsList from the same `/students` response (no separate fetch).
 */
const StudentStatsCards = ({ roleFilter }: StudentStatsCardsProps) => {
  const { data } = useQuery<{
    message: string;
    statusCode: number;
    data: IStudentRoleStats;
  }>({
    queryKey: studentKeys.stats(roleFilter),
    // Never fetch alone — list endpoint writes this cache entry.
    queryFn: () =>
      Promise.reject(
        new Error("Student stats are loaded with the students table"),
      ),
    enabled: false,
    staleTime: 1000 * 60 * 2,
  });

  const analytics = data?.data;
  const roleLabel = getRoleLabel(roleFilter);
  const roleLabelPlural = `${roleLabel}s`;

  if (!analytics) {
    return <V2KpiSkeleton count={4} />;
  }

  const { totalStudents, activeStudents, onLeaveStudents, completionRate } =
    analytics;

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      <V2KpiCard
        label={`Total ${roleLabelPlural}`}
        value={totalStudents.value.toLocaleString()}
        Icon={Users}
        trend={totalStudents.trend}
        sub='vs last 30 days'
      />
      <V2KpiCard
        label={`Active ${roleLabelPlural}`}
        value={activeStudents.value.toLocaleString()}
        Icon={UserCheck}
        accent='text-emerald-600 dark:text-emerald-400'
        trend={activeStudents.trend}
        sub={roleFilter === "CEHO" ? "Status active" : "Active in last 30 days"}
      />
      <V2KpiCard
        label={`On Leave ${roleLabelPlural}`}
        value={onLeaveStudents.value.toLocaleString()}
        Icon={UserMinus}
        accent='text-amber-600 dark:text-amber-400'
        trend={onLeaveStudents.trend}
        sub='Inactive or suspended'
      />
      <V2KpiCard
        label={`Avg ${roleLabel} Progress`}
        value={`${completionRate.value}%`}
        Icon={BarChart2}
        accent='text-indigo-600 dark:text-indigo-400'
        trend={completionRate.trend}
        sub='Course completion rate'
      />
    </div>
  );
};

export default StudentStatsCards;
