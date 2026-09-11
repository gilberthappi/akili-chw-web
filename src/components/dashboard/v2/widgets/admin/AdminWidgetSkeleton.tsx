import React from "react";

const bone = "rounded bg-[#D7E3F0]";

/** Chart-area pulse block (line/bar/donut widgets). */
export const ChartSkeleton: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`flex-1 min-h-0 w-full animate-pulse flex flex-col justify-end gap-2 p-3 ${className}`}
  >
    <div className="flex items-end gap-2 h-full min-h-[120px]">
      {[40, 65, 45, 80, 55, 70, 50, 75].map((h, i) => (
        <div
          key={i}
          className={`${bone} flex-1 min-w-0`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
    <div className="flex justify-between gap-2">
      <div className={`${bone} h-2 w-10`} />
      <div className={`${bone} h-2 w-10`} />
      <div className={`${bone} h-2 w-10`} />
      <div className={`${bone} h-2 w-10`} />
    </div>
  </div>
);

/** Donut + legend pulse. */
export const DonutSkeleton: React.FC = () => (
  <div className="flex-1 min-h-0 w-full animate-pulse flex items-center gap-4 p-2">
    <div className="w-[42%] shrink-0 flex items-center justify-center">
      <div className="w-28 h-28 rounded-full border-[14px] border-[#D7E3F0]" />
    </div>
    <div className="flex-1 space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`${bone} w-2.5 h-2.5 shrink-0`} />
          <div className={`${bone} h-2.5 flex-1`} />
          <div className={`${bone} h-2.5 w-8`} />
        </div>
      ))}
    </div>
  </div>
);

/** Stacked list rows (ratings, activities, AI, schedule). */
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="animate-pulse space-y-2.5 py-1">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex items-center gap-2.5">
        <div className={`${bone} w-9 h-9 shrink-0 rounded-md`} />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className={`${bone} h-2.5 w-[85%]`} />
          <div className={`${bone} h-2 w-[45%]`} />
        </div>
      </div>
    ))}
  </div>
);

/** Table body pulse rows. */
export const TableSkeleton: React.FC<{
  rows?: number;
  cols?: number;
}> = ({ rows = 6, cols = 5 }) => (
  <div className="animate-pulse space-y-2 p-2">
    {Array.from({ length: rows }, (_, r) => (
      <div key={r} className="flex items-center gap-2">
        {Array.from({ length: cols }, (_, c) => (
          <div
            key={c}
            className={`${bone} h-3 ${c === 0 ? "w-24" : "flex-1"}`}
          />
        ))}
      </div>
    ))}
  </div>
);

/** Course card grid pulse. */
export const CardsGridSkeleton: React.FC<{ count?: number }> = ({
  count = 4,
}) => (
  <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 gap-2 h-full content-start">
    {Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        className="rounded-[10px] bg-[#E8F0F8] p-2.5 space-y-2 min-h-[108px]"
      >
        <div className="flex items-start gap-2">
          <div className={`${bone} w-6 h-6 rounded-md shrink-0`} />
          <div className={`${bone} h-3 flex-1`} />
        </div>
        <div className={`${bone} h-2 w-3/4`} />
        <div className={`${bone} h-2 w-1/2`} />
      </div>
    ))}
  </div>
);
