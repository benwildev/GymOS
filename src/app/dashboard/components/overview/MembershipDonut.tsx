"use client";

import dynamic from "next/dynamic";
import type { MembershipSegment } from "./MembershipDonutChart";

export type { MembershipSegment };

function DonutPlaceholder() {
  return (
    <div className="h-full w-full animate-pulse rounded-full border-[18px] border-slate-100" />
  );
}

const MembershipDonutChart = dynamic(
  () => import("./MembershipDonutChart").then((m) => m.MembershipDonutChart),
  { ssr: false, loading: () => <DonutPlaceholder /> }
);

export function MembershipDonut({
  segments,
  total,
}: {
  segments: MembershipSegment[];
  total: number;
}) {
  return (
    <div className="relative mx-auto h-[168px] w-[168px]">
      <div className="h-full w-full" aria-hidden="true">
        <MembershipDonutChart segments={segments} />
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-slate-900">
          {total.toLocaleString()}
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400">
          Members
        </span>
      </div>
    </div>
  );
}
