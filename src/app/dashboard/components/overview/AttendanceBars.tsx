"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AttendancePoint } from "@/services/dashboard.service";

/**
 * Recharts needs a measured DOM node, so this half of the chart is loaded
 * client-side only (see AttendanceChart). Keeping it in its own module also
 * keeps recharts out of the initial bundle.
 */
export function AttendanceBars({
  data,
  tickInterval,
  maxBarSize,
}: {
  data: AttendancePoint[];
  tickInterval: number;
  maxBarSize: number;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          interval={tickInterval}
          tick={{ fill: "#94a3b8", fontSize: 11 }}
          tickMargin={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={44}
          tick={{ fill: "#cbd5e1", fontSize: 11 }}
        />
        <Tooltip
          cursor={{ fill: "rgb(241 245 249 / 0.7)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload as AttendancePoint;
            return (
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-white shadow-lg">
                <div className="text-[11px] text-slate-300">{point.fullLabel}</div>
                <div className="mt-0.5 text-[13px] font-semibold tabular-nums">
                  {point.count} {point.count === 1 ? "check-in" : "check-ins"}
                </div>
              </div>
            );
          }}
        />
        <Bar
          dataKey="count"
          fill="#1a9d5e"
          radius={[4, 4, 0, 0]}
          maxBarSize={maxBarSize}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
