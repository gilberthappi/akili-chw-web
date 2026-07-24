import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, UserMinus, BarChart2 } from "lucide-react";
import { MetricCard } from "@/components/common/MetricCard";
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
    return (
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='h-32 bg-gray-100 rounded-xl' />
        ))}
      </div>
    );
  }

  const { totalStudents, activeStudents, onLeaveStudents, completionRate } =
    analytics;

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      <MetricCard
        title={`Total ${roleLabelPlural}`}
        value={totalStudents.value.toLocaleString()}
        icon={<Users size={18} />}
        iconBg='bg-[#EBF0F9]'
        iconColor='text-[#3363AD]'
        trend={totalStudents.trend}
        description='vs last 30 days'
      />
      <MetricCard
        title={`Active ${roleLabelPlural}`}
        value={activeStudents.value.toLocaleString()}
        icon={<UserCheck size={18} />}
        iconBg='bg-emerald-50'
        iconColor='text-emerald-600'
        trend={activeStudents.trend}
        description={
          roleFilter === "CEHO"
            ? "Status active"
            : "Active in last 30 days"
        }
      />
      <MetricCard
        title={`On Leave ${roleLabelPlural}`}
        value={onLeaveStudents.value.toLocaleString()}
        icon={<UserMinus size={18} />}
        iconBg='bg-amber-50'
        iconColor='text-amber-500'
        trend={onLeaveStudents.trend}
        description='Inactive or suspended'
      />
      <MetricCard
        title={`Avg ${roleLabel} Progress`}
        value={`${completionRate.value}%`}
        icon={<BarChart2 size={18} />}
        iconBg='bg-purple-50'
        iconColor='text-purple-500'
        trend={completionRate.trend}
        description='Course completion rate'
      />
    </div>
  );
};

export default StudentStatsCards;
