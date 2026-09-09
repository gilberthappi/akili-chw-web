import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  LayoutDashboard,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { KpiCard } from "@/components/dashboard/shared/KpiCard";
import {
  formatRoleLabel,
  resolveDepartmentStaffRole,
} from "@/utils/roles";
import {
  getRoleWorkspace,
  type RoleWorkspaceConfig,
} from "@/utils/roleWorkspaces";

const panelTone: Record<string, string> = {
  info: "border-blue-100 bg-blue-50/60 text-blue-900",
  warn: "border-amber-100 bg-amber-50/70 text-amber-950",
  ok: "border-emerald-100 bg-emerald-50/60 text-emerald-950",
};

type Props = {
  /** Force a specific role workspace (demo); otherwise resolves from auth. */
  roleOverride?: string;
};

export const RoleWorkspaceHome: React.FC<Props> = ({ roleOverride }) => {
  const { user } = useAuth();
  const role =
    roleOverride ||
    resolveDepartmentStaffRole(user?.roles as string[] | string | undefined);
  const config = getRoleWorkspace(role);

  if (!config) return null;

  return <RoleWorkspaceView config={config} userName={user?.fullNames} />;
};

export const RoleWorkspaceView: React.FC<{
  config: RoleWorkspaceConfig;
  userName?: string;
}> = ({ config, userName }) => {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 pb-8">
      <div className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${config.accent}`}
              >
                <Building2 size={12} />
                {config.department.replace("_", "-")}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                <LayoutDashboard size={12} />
                {formatRoleLabel(config.role)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                <Sparkles size={12} />
                Demo data
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              {greeting}
              {userName ? `, ${userName.split(" ")[0]}` : ""} — {config.title}
            </h1>
            <p className="text-sm text-gray-500 max-w-2xl">{config.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.actions.map((action) => (
              <Link
                key={action.href + action.label}
                to={action.href}
                className={
                  action.primary
                    ? "inline-flex items-center gap-1.5 rounded-xl bg-[#3363AD] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#284f8a] transition-colors"
                    : "inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                }
              >
                {action.label}
                <ArrowRight size={13} />
              </Link>
            ))}
          </div>
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
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">{config.table.title}</h2>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Placeholder
          </span>
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
                <tr
                  key={idx}
                  className="border-t border-gray-50 hover:bg-gray-50/80"
                >
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

      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-2">
          Proposed next (not built yet)
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {config.roadmap.map((item) => (
            <li
              key={item}
              className="rounded-lg bg-white border border-gray-100 px-3 py-2 text-xs text-gray-600"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RoleWorkspaceHome;
