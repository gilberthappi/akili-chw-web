import { FC, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Search } from "lucide-react";
import {
  V2_BONE,
  V2_CARD_SHELL_PADDED,
  V2_INPUT,
  V2_KPI_ICON_CHIP,
  V2_PAGE_SUBTITLE,
  V2_PAGE_TITLE,
  V2_TAB_ACTIVE,
  V2_TAB_BAR,
  V2_TAB_IDLE,
  V2_TAB_ITEM,
} from "@/components/dashboard/v2/widgets/admin/v2CardStyles";

export const V2PageHeader: FC<{
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div className="min-w-0">
      <h1 className={V2_PAGE_TITLE}>{title}</h1>
      {subtitle && <p className={V2_PAGE_SUBTITLE}>{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
  </div>
);

export type V2KpiTrend = { value: number; direction: "up" | "down" | "stable" };

export const V2KpiCard: FC<{
  label: string;
  value: ReactNode;
  Icon: LucideIcon;
  accent?: string;
  sub?: ReactNode;
  trend?: V2KpiTrend;
  onClick?: () => void;
}> = ({ label, value, Icon, accent = "text-[#3363AD] dark:text-blue-300", sub, trend, onClick }) => {
  const trendClass =
    trend?.direction === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend?.direction === "down"
        ? "text-red-500 dark:text-red-400"
        : "text-[#9AA3B2]";
  const trendArrow = trend?.direction === "up" ? "↑" : trend?.direction === "down" ? "↓" : "→";

  return (
    <div
      className={`${V2_CARD_SHELL_PADDED} flex items-center gap-3 min-h-[88px] ${
        onClick ? "cursor-pointer hover:border-[#3363AD]/40 transition-colors" : ""
      }`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <div
        className={`w-10 h-10 rounded-[12px] ${V2_KPI_ICON_CHIP} flex items-center justify-center shrink-0`}
      >
        <Icon size={20} className={accent} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#5B6575] dark:text-slate-400 truncate">
          {label}
        </p>
        <p className="text-[22px] font-bold tabular-nums text-[#5B6575] dark:text-slate-100 leading-tight mt-0.5">
          {value}
        </p>
        {(trend || sub) && (
          <p className="text-[11px] text-[#9AA3B2] dark:text-slate-500 mt-0.5 truncate">
            {trend && (
              <span className={`font-bold ${trendClass}`}>
                {trendArrow} {Math.abs(trend.value)}%
              </span>
            )}
            {trend && sub && " "}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
};

export const V2KpiSkeleton: FC<{ count?: number; className?: string }> = ({
  count = 4,
  className = "grid grid-cols-2 lg:grid-cols-4 gap-4",
}) => (
  <div className={`${className} animate-pulse`}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className={`${V2_CARD_SHELL_PADDED} flex items-center gap-3 min-h-[88px]`}>
        <div className={`${V2_BONE} w-10 h-10 rounded-[12px] shrink-0`} />
        <div className="flex-1 space-y-2">
          <div className={`${V2_BONE} h-2.5 w-16`} />
          <div className={`${V2_BONE} h-5 w-10`} />
        </div>
      </div>
    ))}
  </div>
);

export type V2TabItem<K extends string> = {
  key: K;
  label: ReactNode;
  Icon?: LucideIcon;
  count?: number;
};

export function V2Tabs<K extends string>({
  items,
  active,
  onChange,
}: {
  items: V2TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
}) {
  return (
    <div className={V2_TAB_BAR}>
      {items.map(({ key, label, Icon, count }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`${V2_TAB_ITEM} ${active === key ? V2_TAB_ACTIVE : V2_TAB_IDLE}`}
        >
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
          {count !== undefined && ` (${count})`}
        </button>
      ))}
    </div>
  );
}

export const V2SearchInput: FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = "Search…", className = "max-w-xs w-full" }) => (
  <div className={`relative ${className}`}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3B2] pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full pl-9 pr-4 py-2 text-sm ${V2_INPUT}`}
    />
  </div>
);
