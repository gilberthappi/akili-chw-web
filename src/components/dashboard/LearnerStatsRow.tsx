import React from "react";
import { BookOpen, Clock, CheckCircle, Award } from "lucide-react";
import { IStudentStatistics } from "@/services/progress.service";
import { KpiCard } from "./shared/KpiCard";

interface LearnerStatsRowProps {
  summary: IStudentStatistics["summary"] | null;
  totalCertificates: number;
  isLoading: boolean;
}

export const LearnerStatsRow: React.FC<LearnerStatsRowProps> = ({
  summary,
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
        title="Enrolled"
        value={summary?.enrolledCourses ?? 0}
        icon={<BookOpen size={20} />}
        iconBg="bg-blue-50"
        iconColor="text-[#3363AD]"
      />
      <KpiCard
        title="In Progress"
        value={summary?.startedCourses ?? 0}
        icon={<Clock size={20} />}
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
      />
      <KpiCard
        title="Completed"
        value={summary?.completedCourses ?? 0}
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
