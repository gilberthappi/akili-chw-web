import React from "react";
import {
  Users,
  MonitorCheck,
  CheckCircle,
  Award,
  ClipboardList,
  UserCheck,
  Calculator,
  Hourglass,
} from "lucide-react";
import { ICHWStats } from "@/types";

interface CHWStatsCardsProps {
  data: ICHWStats | null;
  isLoading: boolean;
  /** Dashboard role filter: "" | TRAINEE | TESTER | CEHO */
  roleFilter?: string;
}

interface SubItem {
  label: string;
  value: number;
}

interface CardConfig {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  primary: string | number;
  /** Optional rate shown next to the primary value (e.g. % of target). */
  primaryRate?: string;
  subItems: SubItem[];
}

const ROLE_TOTAL_LABELS: Record<string, string> = {
  TRAINEE: "Total CHW",
  TESTER: "Total Testers",
  CEHO: "Total CEHO",
};

const ROLE_SHORT_LABELS: Record<string, string> = {
  TRAINEE: "CHWs",
  TESTER: "testers",
  CEHO: "CEHOs",
};

const CHWStatCard: React.FC<CardConfig> = ({
  icon,
  iconBg,
  iconColor,
  title,
  primary,
  primaryRate,
  subItems,
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow duration-200">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
            <p className="text-2xl font-bold text-gray-900">{primary}</p>
            {primaryRate && (
              <span className="text-sm font-semibold text-[#3363AD]">
                {primaryRate}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>

    {subItems.length > 0 && (
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3 flex-wrap">
          {subItems.map((item) => (
            <span
              key={item.label}
              className="text-xs font-medium text-[#3363AD]"
            >
              {item.value.toLocaleString()}{" "}
              <span className="font-normal text-gray-500">{item.label}</span>
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

export const CHWStatsCards: React.FC<CHWStatsCardsProps> = ({
  data,
  isLoading,
  roleFilter = "TRAINEE",
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  const chwTarget = data?.chws.target ?? 6000;
  const chwPercent = data?.chws.percentOfTarget ?? 0;
  const ready = data?.platformReady;
  const eligible = data?.eligible;
  const completion = data?.completion;
  const inProgress = completion?.inProgress ?? 0;
  const inProgressRate =
    completion && completion.total > 0
      ? Math.round((inProgress / completion.total) * 100)
      : 0;

  const totalTitle =
    roleFilter === ""
      ? "Total Users"
      : ROLE_TOTAL_LABELS[roleFilter] ?? "Total Users";
  const eligiblePeopleLabel =
    roleFilter === ""
      ? "users"
      : ROLE_SHORT_LABELS[roleFilter] ?? "users";

  const cards: CardConfig[] = [
    // Row 1
    {
      icon: <Users size={22} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: totalTitle,
      primary: (data?.chws.total ?? 0).toLocaleString(),
      primaryRate:
        roleFilter === "TRAINEE" || roleFilter === ""
          ? `${chwPercent}% of ${chwTarget.toLocaleString()}`
          : undefined,
      subItems: [
        {
          label: "active",
          value: data?.chws.active ?? 0,
        },
        {
          label: "inactive",
          value: data?.chws.inactive ?? 0,
        },
      ],
    },
    {
      icon: <MonitorCheck size={22} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: "Able to Use Platform",
      primary: (ready?.total ?? 0).toLocaleString(),
      primaryRate: `${ready?.percentOfRegistered ?? 0}% of registered ·`,
      subItems: [
        {
          label: "completed a course",
          value: ready?.completedOneCourse ?? 0,
        },
        {
          label: "attended a meeting",
          value: ready?.attendedMeeting ?? 0,
        },
      ],
    },
    {
      icon: <Calculator size={22} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: "Eligible",
      primary: (eligible?.total ?? 0).toLocaleString(),
      primaryRate:
        eligible != null
          ? `${(eligible.chws ?? 0).toLocaleString()} × ${(eligible.courses ?? 0).toLocaleString()}`
          : undefined,
      subItems: [
        {
          label: eligiblePeopleLabel,
          value: eligible?.chws ?? 0,
        },
        {
          label: "courses",
          value: eligible?.courses ?? 0,
        },
      ],
    },
    {
      icon: <UserCheck size={22} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: "Total CEHO",
      primary: data?.supervisors.total ?? 0,
      subItems: [
        {
          label: "male",
          value: data?.supervisors.male ?? 0,
        },
        {
          label: "female",
          value: data?.supervisors.female ?? 0,
        },
      ],
    },
    // Row 2
    {
      icon: <Hourglass size={22} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: "In Progress",
      primary: inProgress.toLocaleString(),
      primaryRate: `${inProgressRate}% of eligible`,
      subItems: [
        {
          label: "eligible",
          value: completion?.total ?? eligible?.total ?? 0,
        },
      ],
    },
    {
      icon: <CheckCircle size={22} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: "Course Completion",
      primary: `${completion?.rate ?? 0}%`,
      subItems: [
        {
          label: "passed final test",
          value: completion?.completed ?? 0,
        },
        {
          label: "eligible",
          value: completion?.total ?? eligible?.total ?? 0,
        },
      ],
    },
    {
      icon: <Award size={22} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: "Certification",
      primary: `${data?.certification?.rate ?? 0}%`,
      subItems: [
        {
          label: "passed final exam",
          value: data?.certification?.certified ?? 0,
        },
        {
          label: "passed final test",
          value: data?.certification?.total ?? 0,
        },
      ],
    },
    {
      icon: <ClipboardList size={22} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: "Test Attempts",
      primary: data?.tests.total ?? 0,
      subItems: [
        {
          label: "pre-test",
          value: data?.tests.preTest ?? 0,
        },
        {
          label: "final-test",
          value: data?.tests.finalTest ?? 0,
        },
        {
          label: "final-exam",
          value: data?.tests.finalExam ?? 0,
        },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <CHWStatCard key={i} {...card} />
      ))}
    </div>
  );
};
