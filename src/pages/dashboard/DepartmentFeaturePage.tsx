import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ListChecks, Sparkles } from "lucide-react";
import { KpiCard } from "@/components/dashboard/shared/KpiCard";
import { getFeaturePage } from "@/utils/featurePages";
import NotFound from "@/pages/NotFound";

const panelTone: Record<string, string> = {
  info: "border-blue-100 bg-blue-50/60 text-blue-900",
  warn: "border-amber-100 bg-amber-50/70 text-amber-950",
  ok: "border-emerald-100 bg-emerald-50/60 text-emerald-950",
};

/** Renders a department feature page from FEATURE_PAGES config (dummy data OK). */
export const DepartmentFeaturePage: React.FC = () => {
  const { pathname } = useLocation();
  const config = getFeaturePage(pathname);

  if (!config) return <NotFound />;

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {config.demo && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                  <Sparkles size={12} />
                  Demo data
                </span>
              )}
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              {config.title}
            </h1>
            <p className="text-sm text-gray-500 max-w-2xl">{config.subtitle}</p>
          </div>
          {config.actions && config.actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {config.actions.map((action) => (
                <Link
                  key={action.href + action.label}
                  to={action.href}
                  className={
                    action.primary
                      ? "inline-flex items-center gap-1.5 rounded-xl bg-[#3363AD] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#284f8a]"
                      : "inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  }
                >
                  {action.label}
                  <ArrowRight size={13} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {config.kpis.map((kpi) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            description={kpi.description}
            trend={kpi.trend}
            icon={<ListChecks size={18} />}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {config.panels.map((panel) => (
          <div
            key={panel.title}
            className={`rounded-xl border p-4 ${panelTone[panel.tone || "info"]}`}
          >
            <p className="text-xs font-bold uppercase tracking-wide opacity-80">
              {panel.title}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">{panel.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">{config.table.title}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500">
              <tr>
                {config.table.columns.map((col) => (
                  <th key={col} className="px-4 py-2.5 font-semibold">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.table.rows.map((row, idx) => (
                <tr key={idx} className="border-t border-gray-50 hover:bg-gray-50/80">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className={`px-4 py-2.5 text-gray-700 ${
                        cIdx === 0 ? "font-medium text-gray-900" : ""
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentFeaturePage;
