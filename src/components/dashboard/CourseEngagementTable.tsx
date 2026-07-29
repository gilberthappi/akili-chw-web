import React, { useState } from "react";
import { ArrowUpDown, BookOpen } from "lucide-react";
import { Card } from "@/components/common/Card";
import { DashboardSectionHeader } from "./shared/DashboardSectionHeader";
import { ICourseAnalytics, ITestScoreAnalytics, IAvgStudyTimeByCourse } from "@/types";

interface CourseEngagementTableProps {
  courseAnalytics: ICourseAnalytics | null;
  testScores: ITestScoreAnalytics | null;
  avgStudyTimeByCourse: IAvgStudyTimeByCourse[];
}

type SortKey =
  | "name"
  | "students"
  | "completed"
  | "certified"
  | "avgScore"
  | "avgHours";
type SortDir = "asc" | "desc";

const formatCountWithRate = (count: number, rate: number) =>
  `${count.toLocaleString()}(${rate}%)`;

export const CourseEngagementTable: React.FC<CourseEngagementTableProps> = ({
  courseAnalytics,
  testScores,
  avgStudyTimeByCourse,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>("students");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // Build test score lookup by courseId
  const scoreMap = new Map<string, number>();
  if (testScores?.byCourse) {
    for (const c of testScores.byCourse) {
      const avg =
        c.meanPreTest !== null && c.meanFinalTest !== null
          ? Math.round((c.meanPreTest + c.meanFinalTest) / 2)
          : c.meanPreTest !== null
            ? Math.round(c.meanPreTest)
            : c.meanFinalTest !== null
              ? Math.round(c.meanFinalTest)
              : null;
      if (avg !== null) scoreMap.set(c.courseId, avg);
    }
  }

  const studyTimeMap = new Map(
    avgStudyTimeByCourse.map((c) => [c.courseId, c]),
  );

  const rows = (courseAnalytics?.coursePerformanceMetrics ?? []).map((c) => {
    const certified = c.certified ?? 0;
    const certificationRate =
      c.students > 0 ? Math.round((certified / c.students) * 100) : 0;

    return {
      id: c.id,
      name: c.name,
      students: c.students,
      completed: c.completed,
      rate: c.rate,
      certified,
      certificationRate,
      avgScore: scoreMap.get(c.id) ?? null,
      avgHours: studyTimeMap.get(c.id)?.avgHours ?? null,
      avgHoursSource: studyTimeMap.get(c.id)?.source ?? null,
    };
  });

  const sorted = [...rows].sort((a, b) => {
    let av: number | string = a[sortKey] ?? -1;
    let bv: number | string = b[sortKey] ?? -1;
    if (sortKey === "name") {
      av = a.name.toLowerCase();
      bv = b.name.toLowerCase();
    }
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortHeader: React.FC<{
    label: string;
    fullLabel?: string;
    k: SortKey;
    align?: "left" | "right";
  }> = ({ label, fullLabel, k, align = "left" }) => (
    <button
      onClick={() => handleSort(k)}
      title={fullLabel ?? label}
      className={`flex items-center gap-0.5 w-full min-w-0 text-[10px] font-medium uppercase
                 text-gray-500 hover:text-[rgba(51,99,173,0.9)] transition-colors ${
                   align === "right" ? "justify-end" : "justify-start"
                 }`}
    >
      <span className='break-words leading-tight min-w-0'>{label}</span>
      <ArrowUpDown
        size={10}
        className={`shrink-0 ${sortKey === k ? "text-[rgba(51,99,173,1)]" : "text-gray-300"}`}
      />
    </button>
  );

  return (
    <Card>
      <DashboardSectionHeader
        icon={<BookOpen size={16} />}
        title='Course Engagement'
      />

      {rows.length === 0 ? (
        <div className='flex items-center justify-center h-32 text-sm text-gray-400'>
          No course data available
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-xs table-fixed'>
            <colgroup>
              <col style={{ width: "28%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr className='border-b border-gray-100'>
                <th className='text-left py-1.5 pr-3 overflow-hidden'>
                  <SortHeader label='Course' k='name' />
                </th>
                <th className='text-right py-1.5 px-2 overflow-hidden'>
                  <SortHeader label='Enrollments' k='students' align='right' />
                </th>
                <th className='text-right py-1.5 px-2 overflow-hidden'>
                  <SortHeader
                    label='Completed'
                    fullLabel='Completed (Completion Rate)'
                    k='completed'
                    align='right'
                  />
                </th>
                <th className='text-right py-1.5 px-2 overflow-hidden'>
                  <SortHeader
                    label='Certification'
                    fullLabel='Certified (Certification Rate)'
                    k='certified'
                    align='right'
                  />
                </th>
                <th className='text-right py-1.5 px-2 overflow-hidden'>
                  <SortHeader label='Quiz Score' fullLabel='Avg Quiz Score' k='avgScore' align='right' />
                </th>
                <th className='text-right py-1.5 pl-2 overflow-hidden'>
                  <SortHeader label='Study Time' fullLabel='Avg Study Time' k='avgHours' align='right' />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr
                  key={row.id}
                  className='border-b border-gray-50 hover:bg-gray-50
                             transition-colors last:border-0'
                >
                  <td className='py-1.5 pr-3 font-medium text-gray-800 truncate text-xs'>
                    {row.name}
                  </td>
                  <td className='py-1.5 px-2 text-right text-gray-600 text-xs'>
                    {row.students.toLocaleString()}
                  </td>
                  <td className='py-1.5 px-2 text-right text-gray-600 text-xs'>
                    {formatCountWithRate(row.completed, row.rate)}
                  </td>
                  <td className='py-1.5 px-2 text-right text-gray-600 text-xs'>
                    {formatCountWithRate(row.certified, row.certificationRate)}
                  </td>
                  <td className='py-1.5 px-2 text-right'>
                    {row.avgScore !== null ? (
                      <span
                        className='text-xs font-semibold'
                        style={{
                          color:
                            row.avgScore >= 70
                              ? "rgba(51, 99, 173, 1)"
                              : row.avgScore >= 50
                                ? "rgba(51, 99, 173, 0.7)"
                                : "rgba(51, 99, 173, 0.4)",
                        }}
                      >
                        {row.avgScore}%
                      </span>
                    ) : (
                      <span className='text-gray-300 text-xs'>—</span>
                    )}
                  </td>
                  <td className='py-1.5 pl-2 text-right'>
                    {row.avgHours !== null ? (
                      <span className='inline-flex items-center gap-1 justify-end'>
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            row.avgHoursSource === "live"
                              ? "bg-green-500"
                              : "border border-gray-400"
                          }`}
                          title={
                            row.avgHoursSource === "live"
                              ? "From real session tracking"
                              : "Estimated from activity counts"
                          }
                        />
                        <span className='text-xs font-medium text-gray-700'>
                          {row.avgHours.toFixed(1)}h
                        </span>
                      </span>
                    ) : (
                      <span className='text-gray-300 text-xs'>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
