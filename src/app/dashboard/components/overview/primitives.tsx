import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared dashboard shell primitives.
 *
 * Every panel on the dashboard is built from these, so padding, radius, border
 * weight and heading rhythm are identical across sections. Individual panels
 * are containers for information — they do not get their own visual identity.
 */

/** Eyebrow label that opens a band of related panels. */
export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function Panel({
  className,
  emphasis = false,
  ...props
}: React.ComponentProps<"section"> & { emphasis?: boolean }) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl bg-white",
        "shadow-[0_1px_2px_0_rgb(16_24_40/0.04)]",
        emphasis
          ? "border border-slate-300 ring-1 ring-slate-900/5"
          : "border border-slate-200/80",
        className
      )}
      {...props}
    />
  );
}

export function PanelHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-5 pt-5 pb-4",
        className
      )}
    >
      <div className="min-w-0">
        <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-slate-900">
          {Icon ? (
            <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          ) : null}
          <span className="truncate">{title}</span>
        </h3>
        {description ? (
          <p className="mt-0.5 text-[12.5px] text-slate-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/** Low-emphasis "View all" affordance used in panel headers. */
export function PanelLink({
  href,
  children = "View all",
}: {
  href: string;
  children?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12.5px] font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-2"
    >
      {children}
      <ArrowRight
        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

export function PanelBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("flex-1 px-5 pb-5", className)} {...props} />;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center">
      <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="text-[13.5px] font-medium text-slate-800">{title}</p>
      <p className="mt-1 max-w-[30ch] text-[12.5px] leading-relaxed text-slate-500">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-2"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

/**
 * Rendered in place of a panel body when that panel's query fails, so one
 * broken widget never takes the rest of the dashboard down with it.
 */
export function ErrorState({ label }: { label: string }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50/40 px-6 py-10 text-center"
    >
      <p className="text-[13.5px] font-medium text-slate-800">
        Unable to load {label}
      </p>
      <p className="mt-1 text-[12.5px] text-slate-500">
        The rest of the dashboard is unaffected.
      </p>
      <Link
        href="/dashboard"
        className="mt-4 inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-2"
      >
        Try again
      </Link>
    </div>
  );
}

/**
 * Status indicator that never communicates by colour alone — the label is
 * always rendered alongside the dot.
 */
export function StatusPill({
  tone,
  children,
}: {
  tone: "positive" | "warning" | "critical" | "neutral" | "info";
  children: React.ReactNode;
}) {
  const tones = {
    positive: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    critical: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    neutral: "bg-slate-50 text-slate-600 border-slate-200",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

/**
 * Runs a panel's data fetch and reports failure instead of throwing, so the
 * page can degrade one section at a time.
 */
export async function loadPanel<T>(
  fetcher: () => Promise<T>
): Promise<{ ok: true; data: T } | { ok: false }> {
  try {
    return { ok: true, data: await fetcher() };
  } catch (error) {
    console.error("[dashboard] panel data failed to load", error);
    return { ok: false };
  }
}
