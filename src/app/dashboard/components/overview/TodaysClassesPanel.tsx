import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTodaysClasses } from "@/services/dashboard.service";
import {
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  PanelLink,
  StatusPill,
  loadPanel,
} from "./primitives";

export async function TodaysClassesPanel() {
  const result = await loadPanel(getTodaysClasses);

  return (
    <Panel className="h-full">
      <PanelHeader
        title="Today's Classes"
        description="Bookings against capacity"
        action={<PanelLink href="/dashboard/classes">Schedule</PanelLink>}
      />
      <PanelBody>
        {!result.ok ? (
          <ErrorState label="today's classes" />
        ) : result.data.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No classes scheduled today"
            description="Schedule a session and its roster and utilisation appear here."
            actionLabel="Schedule a class"
            actionHref="/dashboard/classes"
          />
        ) : (
          <ul className="space-y-4">
            {result.data.map((session) => {
              const pct =
                session.capacity > 0
                  ? Math.min(
                      100,
                      Math.round((session.booked / session.capacity) * 100)
                    )
                  : 0;
              const isFull =
                session.capacity > 0 && session.booked >= session.capacity;
              const isNearlyFull = !isFull && pct >= 80;

              return (
                <li key={session.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[13.5px] font-medium text-slate-900">
                      {session.name}
                    </p>
                    {session.cancelled ? (
                      <StatusPill tone="neutral">Cancelled</StatusPill>
                    ) : isFull ? (
                      <StatusPill tone="critical">Full</StatusPill>
                    ) : isNearlyFull ? (
                      <StatusPill tone="warning">Nearly full</StatusPill>
                    ) : null}
                  </div>

                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {session.startTime} &ndash; {session.endTime}
                    <span aria-hidden="true"> &middot; </span>
                    <span className="tabular-nums">
                      {session.booked} / {session.capacity} booked
                    </span>
                  </p>

                  <div
                    className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${session.name} utilisation: ${session.booked} of ${session.capacity} places booked`}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-500",
                        session.cancelled
                          ? "bg-slate-300"
                          : isFull
                            ? "bg-rose-500"
                            : isNearlyFull
                              ? "bg-amber-500"
                              : "bg-[#1a9d5e]"
                      )}
                      style={{ width: `${session.cancelled ? 0 : pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PanelBody>
    </Panel>
  );
}
