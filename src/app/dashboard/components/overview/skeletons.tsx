import { Panel } from "./primitives";

/**
 * Skeletons mirror the real layout of each panel, so nothing shifts when the
 * data streams in.
 */

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-slate-100 ${className}`} />;
}

function PanelHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
      <div className="space-y-2">
        <Bar className="h-4 w-36" />
        <Bar className="h-3 w-48" />
      </div>
      <Bar className="h-4 w-16" />
    </div>
  );
}

export function KpiRowSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Panel key={i} className="gap-3 p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <Bar className="h-3 w-24" />
            <Bar className="h-7 w-7 rounded-lg" />
          </div>
          <div className="mt-3 space-y-2">
            <Bar className="h-8 w-20" />
            <Bar className="h-3 w-28" />
          </div>
        </Panel>
      ))}
    </div>
  );
}

export function ChartPanelSkeleton({ height = 240 }: { height?: number }) {
  return (
    <Panel className="h-full">
      <PanelHeaderSkeleton />
      <div className="px-5 pb-5">
        <Bar className="h-8 w-32" />
        <div
          className="mt-6 flex items-end gap-2"
          style={{ height: `${height}px` }}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t bg-slate-100"
              style={{ height: `${35 + ((i * 19) % 55)}%` }}
            />
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function DonutPanelSkeleton() {
  return (
    <Panel className="h-full">
      <PanelHeaderSkeleton />
      <div className="px-5 pb-5">
        <div className="mx-auto h-[168px] w-[168px] animate-pulse rounded-full border-[18px] border-slate-100" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Bar className="h-3 w-28" />
              <Bar className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function ListPanelSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Panel className="h-full">
      <PanelHeaderSkeleton />
      <div className="space-y-4 px-5 pb-5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Bar className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Bar className="h-3 w-2/3" />
              <Bar className="h-2.5 w-1/3" />
            </div>
            <Bar className="h-3 w-12 shrink-0" />
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function AttentionPanelSkeleton() {
  return (
    <Panel emphasis>
      <PanelHeaderSkeleton />
      <div className="grid gap-4 px-5 pb-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Bar className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Bar className="h-3 w-3/4" />
              <Bar className="h-2.5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
