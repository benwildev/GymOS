"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface MembershipSegment {
  name: string;
  value: number;
  color: string;
}

export function MembershipDonutChart({
  segments,
}: {
  segments: MembershipSegment[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={segments}
          dataKey="value"
          innerRadius={58}
          outerRadius={80}
          paddingAngle={segments.length > 1 ? 2 : 0}
          strokeWidth={0}
          startAngle={90}
          endAngle={-270}
        >
          {segments.map((segment) => (
            <Cell key={segment.name} fill={segment.color} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const segment = payload[0].payload as MembershipSegment;
            return (
              <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[12px] text-white shadow-lg">
                <span className="text-slate-300">{segment.name}: </span>
                <span className="font-semibold tabular-nums">{segment.value}</span>
              </div>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
