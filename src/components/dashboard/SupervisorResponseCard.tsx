import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MessageCircleReply } from "lucide-react";
import { Card } from "@/components/common/Card";
import { DashboardSectionHeader } from "./shared/DashboardSectionHeader";
import { IDashboardFilters } from "@/types";
import { DEFAULT_DASHBOARD_FILTERS } from "@/utils/constants/dashboardFilters";
import { useInView } from "@/hooks/useInView";
import { useDashboardSupervisorResponse } from "@/hooks/useDashboardLazyStats";

interface SupervisorResponseCardProps {
  filters?: IDashboardFilters;
}

const PIE_COLORS = ["#3363AD", "#e2e8f0"];

export const SupervisorResponseCard: React.FC<SupervisorResponseCardProps> = ({
  filters = DEFAULT_DASHBOARD_FILTERS,
}) => {
  const { ref, inView } = useInView<HTMLDivElement>();
  const { supervisorResponseRate: data, isLoading } = useDashboardSupervisorResponse(
    filters,
    inView,
  );

  if (!inView || isLoading) {
    return (
      <div ref={ref} className="h-full min-h-[420px]">
        <Card className="h-full">
          <DashboardSectionHeader
            icon={<MessageCircleReply size={16} />}
            title="Supervisor Response Rate"
          />
          <div className="h-40 animate-pulse bg-gray-50 rounded-lg" />
        </Card>
      </div>
    );
  }

  if (!data || data.totalChwMessages === 0) {
    return (
      <div ref={ref} className="h-full min-h-[420px]">
        <Card className="h-full">
          <DashboardSectionHeader
            icon={<MessageCircleReply size={16} />}
            title="Supervisor Response Rate"
          />
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">
            No data available
          </div>
        </Card>
      </div>
    );
  }

  const pieData = [
    { name: "Responded", value: data.respondedCount },
    {
      name: "No reply yet",
      value: Math.max(data.totalChwMessages - data.respondedCount, 0),
    },
  ];

  return (
    <div ref={ref} className="h-full min-h-[420px]">
      <Card className="h-full flex flex-col">
        <DashboardSectionHeader
          icon={<MessageCircleReply size={16} />}
          title="Supervisor Response Rate"
        />

        <div className="flex-1 min-h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {pieData.map((entry, index) => (
                  <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3 shrink-0">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Within 24h</p>
            <p className="text-xl font-bold text-gray-700">{data.within24hRate}%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Avg Response</p>
            <p className="text-xl font-bold text-gray-700">
              {data.avgResponseHours !== null ? `${data.avgResponseHours}h` : "—"}
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 shrink-0">
          {data.respondedCount}/{data.totalChwMessages} CHW messages received a reply.{" "}
          {data.note}
        </p>
      </Card>
    </div>
  );
};
