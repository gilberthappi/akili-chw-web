import React from "react";
import { BookOpen, Users, CheckCircle, Award } from "lucide-react";
import { IDashboardStats } from "@/types";
import { KpiCard } from "./shared/KpiCard";

interface LearnerStatsRowProps {
  stats: IDashboardStats | null;
  totalCertificates: number;
  isLoading: boolean;
}

export const LearnerStatsRow: React.FC<LearnerStatsRowProps> = ({
  stats,
  totalCertificates,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        title="Total Courses"
        value={stats?.totalCourses?.value ?? 0}
        icon={<BookOpen size={20} />}
        iconBg="bg-blue-50"
        iconColor="text-[#3363AD]"
      />
      <KpiCard
        title="Students"
        value={stats?.totalStudents?.value ?? 0}
        icon={<Users size={20} />}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
      />
      <KpiCard
        title="Completion (%)"
        value={`${stats?.completionRate?.value ?? 0}%`}
        icon={<CheckCircle size={20} />}
        iconBg="bg-green-50"
        iconColor="text-green-600"
      />
      <KpiCard
        title="Certificates"
        value={totalCertificates}
        icon={<Award size={20} />}
        iconBg="bg-amber-50"
        iconColor="text-amber-500"
      />
    </div>
  );
};
