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
  <div className="bg-white rounded-xl border border-gray-200 p-4 h-full min-h-[148px] flex flex-col hover:shadow-sm hover:border-[#3363AD]/25 transition-all duration-200">
    <div className="flex items-start gap-3">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium leading-snug">{title}</p>
        <div className="flex items-baseline gap-2 mt-1 flex-wrap">
          <p className="text-2xl font-bold text-gray-900 tracking-tight">
            {primary}
          </p>
          {primaryRate && (
            <span className="text-xs font-semibold text-[#3363AD] whitespace-nowrap">
              {primaryRate}
            </span>
          )}
        </div>
      </div>
    </div>

    {subItems.length > 0 && (
      <div className="mt-auto pt-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {subItems.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600"
            >
              <span className="font-semibold text-[#3363AD]">
                {item.value.toLocaleString()}
              </span>
              {item.label}
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
          <div key={i} className="h-[148px] bg-gray-100 rounded-xl" />
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
    {
      icon: <Users size={20} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: totalTitle,
      primary: (data?.chws.total ?? 0).toLocaleString(),
      primaryRate:
        roleFilter === "TRAINEE" || roleFilter === ""
          ? `${chwPercent}% / ${chwTarget.toLocaleString()}`
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
      icon: <MonitorCheck size={20} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: "Able to Use Platform",
      primary: (ready?.total ?? 0).toLocaleString(),
      primaryRate: `${ready?.percentOfRegistered ?? 0}% / registered`,
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
      icon: <Calculator size={20} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: "Eligible Certificates",
      primary: (eligible?.total ?? 0).toLocaleString(),
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
      icon: <UserCheck size={20} />,
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
    {
      icon: <Hourglass size={20} />,
      iconBg: "bg-[#3363AD]/10",
      iconColor: "text-[#3363AD]",
      title: "In Progress",
      primary: inProgress.toLocaleString(),
      primaryRate: `${inProgressRate}% / eligible certificates`,
      subItems: [
        {
          label: "eligible certificates",
          value: completion?.total ?? eligible?.total ?? 0,
        },
      ],
    },
    {
      icon: <CheckCircle size={20} />,
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
          label: "eligible certificates",
          value: completion?.total ?? eligible?.total ?? 0,
        },
      ],
    },
    {
      icon: <Award size={20} />,
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
      icon: <ClipboardList size={20} />,
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
          label: "mid-test",
          value: data?.tests.midTest ?? 0,
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
      {cards.map((card) => (
        <CHWStatCard key={card.title} {...card} />
      ))}
    </div>
  );
};
