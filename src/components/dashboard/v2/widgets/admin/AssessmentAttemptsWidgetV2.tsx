import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { RotateCcw } from "lucide-react";

interface AssessmentAttemptsWidgetV2Props {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  testScoresData?: any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  summaryData?: any;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  courses?: any[];
}

export const AssessmentAttemptsWidgetV2: React.FC<AssessmentAttemptsWidgetV2Props> = ({
  testScoresData,
  summaryData,
  courses = [],
}) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const isTypeActive = (key: string) =>
    selectedKeys.length === 0 || selectedKeys.includes(key);

  const toggleType = (key: string) => {
    if (selectedKeys.length === 0) {
      setSelectedKeys([key]);
    } else if (selectedKeys.includes(key)) {
      const next = selectedKeys.filter((k) => k !== key);
      setSelectedKeys(next);
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const resetFilters = () => {
    setSelectedKeys([]);
  };

  // 1. Extract real backend test counts from tests object or testScoresData or summaryData
  const testsObj =
    testScoresData?.tests ||
    testScoresData?.attempts ||
    testScoresData?.testScores ||
    summaryData?.tests ||
    summaryData?.testScores ||
    testScoresData;

  let preVal = Number(
    testsObj?.preTest ?? testsObj?.preTestAttempts ?? testsObj?.preTestCount ?? 0
  );
  let midVal = Number(
    testsObj?.midTest ?? testsObj?.midTestAttempts ?? testsObj?.midTestCount ?? testsObj?.checkForUnderstanding ?? 0
  );
  let finalVal = Number(
    testsObj?.finalTest ?? testsObj?.postTest ?? testsObj?.finalTestAttempts ?? testsObj?.postTestCount ?? 0
  );
  let certVal = Number(
    testsObj?.finalExam ?? testsObj?.certificateExam ?? testsObj?.certificateExamAttempts ?? testsObj?.certified ?? 0
  );

  // 2. Check if testScoresData has byCourse array
  if (preVal + midVal + finalVal + certVal === 0 && testScoresData?.byCourse) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    testScoresData.byCourse.forEach((item: any) => {
      preVal += Number(item.preTest || item.preTestAttempts || 0);
      midVal += Number(item.midTest || item.midTestAttempts || 0);
      finalVal += Number(item.finalTest || item.postTest || item.finalTestAttempts || 0);
      certVal += Number(item.finalExam || item.certificateExam || item.certificateExamAttempts || 0);
    });
  }

  // 3. Aggregate across courses list if still 0
  if (preVal + midVal + finalVal + certVal === 0 && courses && courses.length > 0) {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    courses.forEach((c: any) => {
      preVal += Number(c.preTestAttempts ?? c.preTestCount ?? 0);
      midVal += Number(c.midTestAttempts ?? c.midTestCount ?? c.quizzesCount ?? 0);
      finalVal += Number(c.finalTestAttempts ?? c.completedTests ?? c.postTestCount ?? 0);
      certVal += Number(c.certificatesEarned ?? c.certificateExamAttempts ?? 0);
    });
  }

  // 4. Extract total tests taken from dashboardStats or summary
  const totalFromStats = Number(
    summaryData?.dashboardStats?.completedTests?.value ??
      summaryData?.dashboardStats?.totalTestsTaken?.value ??
      summaryData?.submissionsCount ??
      0
  );

  // 4. Pure database values (zero dummy scaling)
  if (preVal < 0) preVal = 0;
  if (midVal < 0) midVal = 0;
  if (finalVal < 0) finalVal = 0;
  if (certVal < 0) certVal = 0;

  const allAttemptTypes = [
    { key: "pre", name: "PreTest", value: preVal, color: "#38BDF8" },
    { key: "mid", name: "MidTest", value: midVal, color: "#373449" },
    { key: "final", name: "FinalTest", value: finalVal, color: "#3363AD" },
    { key: "cert", name: "FinalExam(Certificate)", value: certVal, color: "#10B981" },
  ];

  const activeAttemptTypes = allAttemptTypes.filter((item) => isTypeActive(item.key));
  const activeTotalTests = activeAttemptTypes.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between space-y-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-gray-900 tracking-tight">
          Assessment Test Attempts
        </h3>
        {selectedKeys.length > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-[10px] font-extrabold text-[#3363AD] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw size={10} />
            Reset
          </button>
        )}
      </div>

      {/* Donut Chart with Center Total */}
      <div className="relative h-44 flex items-center justify-center my-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={activeAttemptTypes.length > 0 ? activeAttemptTypes : [{ name: "None", value: 1, color: "#E2E8F0" }]}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={68}
              paddingAngle={4}
              dataKey="value"
            >
              {activeAttemptTypes.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                fontSize: "11px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute text-center pointer-events-none">
          <span className="text-2xl font-black text-gray-900 leading-none">
            {activeTotalTests}
          </span>
          <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-wide">
            Total Tests taken
          </p>
        </div>
      </div>

      {/* Bottom Legend Items Grid matching Figma layout with click-to-filter */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 text-[11px] font-semibold text-gray-700">
        {allAttemptTypes.map((item) => {
          const active = isTypeActive(item.key);
          return (
            <div
              key={item.key}
              onClick={() => toggleType(item.key)}
              className={`flex items-center gap-1.5 min-w-0 cursor-pointer select-none transition-opacity ${
                active ? "opacity-100" : "opacity-35 hover:opacity-60"
              }`}
              title={`Click to filter ${item.name}`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-xs shrink-0 transition-transform ${
                  active ? "scale-100 shadow-2xs" : "scale-75"
                }`}
                style={{ backgroundColor: item.color }}
              />
              <span
                className={`truncate ${
                  active ? "text-gray-800" : "line-through text-gray-400"
                }`}
              >
                {item.value} {item.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
