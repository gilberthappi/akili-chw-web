import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface TrendLineChartProps<T> {
  data: T[];
  xKey: keyof T & string;
  yKey: keyof T & string;
  label: string;
  /** Appended to values on the axis and tooltip, e.g. "%". */
  unit?: string;
  yMax?: number;
}

export const TrendLineChart = <T extends object>({ data, xKey, yKey, label, unit, yMax }: TrendLineChartProps<T>) => (
  <div className='h-56 w-full'>
    <ResponsiveContainer width='100%' height='100%'>
      <LineChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray='3 3' stroke='#E8EEF6' vertical={false} />
        <XAxis
          dataKey={xKey}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 600 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          unit={unit}
          domain={yMax !== undefined ? [0, yMax] : undefined}
          tick={{ fill: "#9CA3AF", fontSize: 10 }}
        />
        <Tooltip
          cursor={{ stroke: "#C5D3E0", strokeDasharray: "3 3" }}
          contentStyle={{ borderRadius: 12, border: "1px solid #E8EEF6", fontSize: 12 }}
          formatter={(value) => [`${value as number}${unit ?? ""}`, label]}
        />
        <Line
          type='monotone'
          dataKey={yKey}
          name={label}
          stroke='#3363AD'
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: "#3363AD", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default TrendLineChart;
