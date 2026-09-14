import React from "react";
import {
  MoreHorizontal,
  Users,
  Library,
  Lightbulb,
  Hospital,
  CalendarDays,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { V2_CARD_SHELL_PADDED, V2_KPI_ICON_CHIP } from "./v2CardStyles";

export type KpiBreakdownItem = {
  label: string;
  value: string | number;
  /** Optional denominator for fraction rows (e.g. 1574 / 2980) */
  valueMax?: string | number;
  percent?: string;
};

export type AdminKpiCardModel = {
  title: string;
  value: string | number;
  max: string | number;
  unit: string;
  growth: string;
  growthPositive: boolean;
  icon: "users" | "courses" | "engagement" | "health" | "activities";
  breakdown: KpiBreakdownItem[];
};

interface AdminKpiCardsV2Props {
  cards?: AdminKpiCardModel[];
  isLoading?: boolean;
  totalUsers?: unknown;
  totalCourses?: unknown;
  totalEnrollments?: unknown;
  totalHealthCenters?: unknown;
  summaryData?: Record<string, unknown> | null;
  adoptionData?: Record<string, unknown> | null;
  statsData?: Record<string, unknown> | null;
}

/** Card 1 — title depends on role filter (Total CHW / Testers / CEHO / Users). */
export const SECTION1_DESIGN_DUMMY: AdminKpiCardModel[] = [
  {
    title: "Total CHW",
    value: 390,
    max: 6000,
    unit: "Onboard",
    growth: "17.69%",
    growthPositive: true,
    icon: "users",
    breakdown: [
      { label: "Female", value: 1574 },
      { label: "Male", value: 1340 },
      { label: "CEHO", value: 1200 },
    ],
  },
  {
    title: "Total Courses",
    value: 10,
    max: 14,
    unit: "courses",
    growth: "17.69%",
    growthPositive: false,
    icon: "courses",
    breakdown: [
      { label: "Enrolled", value: 1574 },
      { label: "Completed", value: 1340 },
      { label: "Certificates", value: 1200 },
    ],
  },
  {
    title: "Engagement",
    value: 112,
    max: 390,
    unit: "Active",
    growth: "17.69%",
    growthPositive: true,
    icon: "engagement",
    breakdown: [
      { label: "Enrollments", value: 1574, valueMax: 2980, percent: "52.82%" },
      { label: "Completion", value: 1340, valueMax: 1574, percent: "85.13%" },
      { label: "Certificates", value: 1200, valueMax: 1340, percent: "89.55%" },
    ],
  },
  {
    title: "Health centers",
    value: 470,
    max: 1000,
    unit: "Health centers",
    growth: "47%",
    growthPositive: true,
    icon: "health",
    breakdown: [
      { label: "Districts covered", value: 13 },
      { label: "Sectors covered", value: 233 },
      { label: "Referral & Private entity", value: 147 },
    ],
  },
  {
    title: "Activities",
    value: 48,
    max: 52,
    unit: "Events",
    growth: "92.31%",
    growthPositive: true,
    icon: "activities",
    breakdown: [
      { label: "Upcoming", value: 12 },
      { label: "Completed", value: 36 },
      { label: "Participants", value: 214 },
    ],
  },
];

const ICON_MAP = {
  users: Users,
  courses: Library,
  engagement: Lightbulb,
  health: Hospital,
  activities: CalendarDays,
} as const;

/**
 * Design colors (from Total Users KPI crop):
 * - Primary value: medium slate gray
 * - Suffix: lighter grey
 * - Title / rows: dark charcoal
 * - Icon chip: soft blue #C5D3E0
 */
const C = {
  primary: "#5B6575",
  suffix: "#9AA3B2",
  label: "#3D4654",
  numerator: "#3D4654",
  denominator: "#9AA3B2",
  title: "#1A2332",
  growth: "#1A2332",
  icon: "#3D6BA8",
} as const;

const KpiCard: React.FC<{ card: AdminKpiCardModel }> = ({ card }) => {
  const Icon = ICON_MAP[card.icon];
  const TrendGlyph = card.growthPositive ? ArrowUp : ArrowDown;

  return (
    <div className={`${V2_CARD_SHELL_PADDED} flex flex-col gap-3.5 min-h-[148px]`}>
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-[12px] ${V2_KPI_ICON_CHIP} shrink-0`}
        >
          <Icon
            size={20}
            strokeWidth={2}
            className="text-[#3D6BA8]"
            fill="currentColor"
            fillOpacity={0.15}
          />
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              className="text-[13px] font-bold tracking-tight leading-none"
              style={{ color: C.title }}
            >
              {card.title}
            </h4>
            <button
              type="button"
              className="text-[#9AA3B2] hover:text-[#64748B] transition-colors p-0.5 shrink-0"
              aria-label={`${card.title} options`}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 mt-2">
            <p className="min-w-0 leading-none whitespace-nowrap overflow-hidden text-ellipsis">
              <span
                className="text-[22px] font-bold tracking-tight tabular-nums"
                style={{ color: C.primary }}
              >
                {card.value}
              </span>
              <span
                className="text-[12px] font-normal ml-0.5"
                style={{ color: C.suffix }}
              >
                /{card.max} {card.unit}
              </span>
            </p>

            <span className="shrink-0 inline-flex items-center gap-1">
              <span
                className={`inline-flex h-[18px] w-[18px] items-center justify-center rounded-full ${
                  card.growthPositive
                    ? "bg-[#5EEAD4]/50 text-[#0F766E]"
                    : "bg-[#FECACA]/70 text-[#DC2626]"
                }`}
              >
                <TrendGlyph size={10} strokeWidth={3} />
              </span>
              <span
                className="text-[12px] font-bold tabular-nums"
                style={{ color: C.growth }}
              >
                {card.growth}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {card.breakdown.map((item) => (
          <div
            key={item.label}
            className="flex items-baseline justify-between gap-3 text-[12px] leading-snug"
          >
            <span className="font-medium truncate" style={{ color: C.label }}>
              {item.label}
            </span>
            <span className="tabular-nums whitespace-nowrap">
              <span className="font-bold" style={{ color: C.numerator }}>
                {item.value}
              </span>
              {item.valueMax !== undefined && item.valueMax !== null ? (
                <span className="font-normal" style={{ color: C.denominator }}>
                  {" "}
                  /{item.valueMax}
                </span>
              ) : null}
              {item.percent ? (
                <span className="font-medium ml-1.5" style={{ color: C.denominator }}>
                  ({item.percent})
                </span>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const KpiCardSkeleton: React.FC = () => (
  <div
    className={`${V2_CARD_SHELL_PADDED} flex flex-col gap-3.5 min-h-[148px] animate-pulse`}
  >
    <div className="flex items-start gap-3">
      <span
        className={`inline-flex h-10 w-10 rounded-[12px] ${V2_KPI_ICON_CHIP} shrink-0`}
      />
      <div className="flex-1 min-w-0 space-y-2 pt-0.5">
        <div className="flex items-center justify-between gap-2">
          <div className="h-3 w-24 rounded bg-[#E8EEF4]" />
          <div className="h-3 w-3 rounded bg-[#E8EEF4]" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-28 rounded bg-[#E8EEF4]" />
          <div className="h-4 w-12 rounded bg-[#E8EEF4]" />
        </div>
      </div>
    </div>
    <div className="space-y-2">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center justify-between gap-3">
          <div className="h-2.5 w-20 rounded bg-[#E8EEF4]" />
          <div className="h-2.5 w-14 rounded bg-[#E8EEF4]" />
        </div>
      ))}
    </div>
  </div>
);

export const AdminKpiCardsV2: React.FC<AdminKpiCardsV2Props> = ({
  cards,
  isLoading = false,
}) => {
  if (isLoading && (!cards || cards.length === 0)) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-0">
        {[0, 1, 2, 3, 4].map((i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const resolved = cards && cards.length > 0 ? cards : SECTION1_DESIGN_DUMMY;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-0">
      {resolved.map((card) => (
        <KpiCard key={card.title} card={card} />
      ))}
    </div>
  );
};

export function buildAdminKpiCards(
  cards?: AdminKpiCardModel[] | null,
): AdminKpiCardModel[] {
  return cards && cards.length > 0 ? cards : SECTION1_DESIGN_DUMMY;
}

export default AdminKpiCardsV2;
