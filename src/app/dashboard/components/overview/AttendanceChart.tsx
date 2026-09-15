"use client";

import { useId, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import type { AttendanceSeries } from "@/services/dashboard.service";

type Range = "today" | "week" | "month";

const RANGES: { id: Range; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
];

function BarsPlaceholder() {
  return (
    <div className="flex h-full items-end gap-2 px-2 pb-6">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 animate-pulse rounded-t bg-slate-100"
          style={{ height: `${30 + ((i * 17) % 55)}%` }}
        />
      ))}
    </div>
  );
}

const AttendanceBars = dynamic(
  () => import("./AttendanceBars").then((m) => m.AttendanceBars),
  { ssr: false, loading: () => <BarsPlaceholder /> }
);

export function AttendanceChart({ series }: { series: AttendanceSeries }) {
  const [range, setRange] = useState<Range>("week");
  const captionId = useId();

  const data = series[range];
  const total = series.totals[range];

  const caption =
    range === "today"
      ? total === 1
        ? "check-in today"
        : "check-ins today"
      : range === "week"
        ? "check-ins over 7 days"
        : "check-ins over 30 days";

  const average =
    range === "week"
      ? series.dailyAverage.week
      : range === "month"
        ? series.dailyAverage.month
        : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-slate-900">
              {total.toLocaleString()}
            </span>
            <span className="text-[12.5px] text-slate-500">{caption}</span>
          </div>
          {average !== null ? (
            <p className="mt-1.5 text-[12px] text-slate-500">
              Averaging{" "}
              <span className="font-medium tabular-nums text-slate-700">
                {average.toFixed(1)}
              </span>{" "}
              visits a day
            </p>
          ) : null}
        </div>

        <div
          role="group"
          aria-label="Attendance range"
          className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5"
        >
          {RANGES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setRange(option.id)}
              aria-pressed={range === option.id}
              className={cn(
                "cursor-pointer rounded-[6px] px-2.5 py-1 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-1",
                range === option.id
                  ? "bg-white text-slate-900 shadow-[0_1px_2px_0_rgb(16_24_40/0.06)]"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <figure className="mt-5" aria-labelledby={captionId}>
        {/* Screen readers get the numbers; the canvas itself is decorative. */}
        <figcaption id={captionId} className="sr-only">
          Check-ins, {RANGES.find((r) => r.id === range)?.label}.
          {data.map((point) => ` ${point.fullLabel}: ${point.count}.`).join("")}
        </figcaption>

        <div className="h-[240px] w-full" aria-hidden="true">
          <AttendanceBars
            data={data}
            tickInterval={range === "month" ? 4 : 0}
            maxBarSize={range === "month" ? 14 : 36}
          />
        </div>
      </figure>
    </div>
  );
}
