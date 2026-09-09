import React from "react";
import {
  MoreHorizontal,
  Users,
  Library,
  Lightbulb,
  Hospital,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

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
  icon: "users" | "courses" | "engagement" | "health";
  breakdown: KpiBreakdownItem[];
};

interface AdminKpiCardsV2Props {
  cards?: AdminKpiCardModel[];
  totalUsers?: unknown;
  totalCourses?: unknown;
  totalEnrollments?: unknown;
  totalHealthCenters?: unknown;
  summaryData?: Record<string, unknown> | null;
  adoptionData?: Record<string, unknown> | null;
  statsData?: Record<string, unknown> | null;
}

/** Card 1 — Total Users (design-locked). Refine other cards one-by-one next. */
export const SECTION1_DESIGN_DUMMY: AdminKpiCardModel[] = [
  {
    title: "Total Users",
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
    value: 10,
    max: 120,
    unit: "Health centers",
    growth: "17.69%",
    growthPositive: false,
    icon: "health",
    breakdown: [
      { label: "Districts covered", value: 13 },
      { label: "Sectors covered", value: 134 },
      { label: "Referral & Private entity", value: 13 },
    ],
  },
];

const ICON_MAP = {
  users: Users,
  courses: Library,
  engagement: Lightbulb,
  health: Hospital,
} as const;

/**
 * Design colors:
 * - Primary value (390 / 112): bold chocolate charcoal
 * - Suffix (/6000 Onboard): lighter medium grey
 * - Row labels: near-black charcoal
 * - Row numerators (1574): bold chocolate charcoal (lighter than primary)
 * - Row denominators (/2980): light grey
 */
const C = {
  primary: "#3B2F2F", // chocolate charcoal
  suffix: "#1A2332",
  label: "#2A2222",
  numerator: "#4A3C3C", // softer chocolate charcoal
  denominator: "#1A2332", // near-black (same as prior label token)
  title: "#2A2222",
  growth: "#2A2222",
} as const;

const KpiCard: React.FC<{ card: AdminKpiCardModel }> = ({ card }) => {
  const Icon = ICON_MAP[card.icon];
  const TrendGlyph = card.growthPositive ? ArrowUp : ArrowDown;

  return (
    <div className="bg-[#E8F0F8] rounded-[20px] p-3.5 flex flex-col gap-3 min-h-[148px]">
      <div className="flex items-start gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-white shrink-0 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <Icon size={18} strokeWidth={2} className="text-[#334155]" />
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
              className="text-[#94A3B8] hover:text-[#64748B] transition-colors p-0.5 shrink-0"
              aria-label={`${card.title} options`}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 mt-1.5">
            <p className="min-w-0 leading-none whitespace-nowrap overflow-hidden text-ellipsis">
              <span
                className="text-[20px] font-bold tracking-tight tabular-nums"
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
                    ? "bg-[#5EEAD4]/40 text-[#0F766E]"
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

export const AdminKpiCardsV2: React.FC<AdminKpiCardsV2Props> = (props) => {
  const cards = props.cards ?? SECTION1_DESIGN_DUMMY;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-0">
      {cards.map((card) => (
        <KpiCard key={card.title} card={card} />
      ))}
    </div>
  );
};

export function buildAdminKpiCards(): AdminKpiCardModel[] {
  return SECTION1_DESIGN_DUMMY;
}

export default AdminKpiCardsV2;
