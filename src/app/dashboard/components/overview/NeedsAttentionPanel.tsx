import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleSlash,
  Users2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { getAttentionSummary, getGym } from "@/services/dashboard.service";
import {
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  StatusPill,
  loadPanel,
} from "./primitives";

type Tone = "critical" | "warning" | "info" | "secondary";

interface AttentionRow {
  icon: LucideIcon;
  headline: string;
  detail: string;
  count: number;
  tone: Tone;
  href: string;
  actionLabel: string;
}

const TONE_STYLES: Record<Tone, { icon: string; count: string }> = {
  critical: { icon: "bg-rose-50 text-rose-600", count: "text-rose-700" },
  warning: { icon: "bg-amber-50 text-amber-600", count: "text-amber-700" },
  info: { icon: "bg-blue-50 text-blue-600", count: "text-blue-700" },
  secondary: { icon: "bg-violet-50 text-violet-600", count: "text-violet-700" },
};

function Row({ row }: { row: AttentionRow }) {
  const Icon = row.icon;
  const settled = row.count === 0;
  const styles = TONE_STYLES[row.tone];

  return (
    <li>
      <Link
        href={row.href}
        className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-2 sm:gap-4"
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            settled ? "bg-slate-50 text-slate-400" : styles.icon
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-medium text-slate-900">
            <span
              className={cn(
                "font-semibold tabular-nums",
                settled ? "text-slate-500" : styles.count
              )}
            >
              {row.count}
            </span>{" "}
            {row.headline}
          </span>
          <span className="mt-0.5 block truncate text-[12px] text-slate-500">
            {settled ? "Nothing to action right now" : row.detail}
          </span>
        </span>

        <span className="hidden shrink-0 items-center gap-1 text-[12.5px] font-medium text-slate-500 transition-colors group-hover:text-slate-900 sm:inline-flex">
          {row.actionLabel}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-slate-300 sm:hidden"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

/**
 * The one section the owner should notice first. Emphasis comes from the
 * stronger border and the counts themselves — not from flooding it with red.
 */
export async function NeedsAttentionPanel() {
  const [result, gym] = await Promise.all([
    loadPanel(getAttentionSummary),
    getGym().catch(() => null),
  ]);

  if (!result.ok) {
    return (
      <Panel emphasis>
        <PanelHeader title="Needs Attention" />
        <PanelBody>
          <ErrorState label="attention items" />
        </PanelBody>
      </Panel>
    );
  }

  const summary = result.data;
  const currency = gym?.currency || "USD";

  const rows: AttentionRow[] = [
    {
      icon: CalendarClock,
      headline:
        summary.expiringMemberships === 1
          ? "membership expires within 7 days"
          : "memberships expire within 7 days",
      detail: "Renew before the member lapses",
      count: summary.expiringMemberships,
      tone: "warning",
      href: "/dashboard/members/attention",
      actionLabel: "Renew",
    },
    {
      icon: Wallet,
      headline:
        summary.overdueMembers === 1
          ? "member has an overdue payment"
          : "members have overdue payments",
      detail: `${formatCurrency(summary.overdueAmount, currency)} outstanding`,
      count: summary.overdueMembers,
      tone: "critical",
      href: "/dashboard/payments/due",
      actionLabel: "Collect",
    },
    {
      icon: Users2,
      headline:
        summary.inactiveMembers === 1
          ? "member has not visited in 14 days"
          : "members have not visited in 14 days",
      detail: "At risk of churning — worth a follow-up",
      count: summary.inactiveMembers,
      tone: "info",
      href: "/dashboard/members/attention",
      actionLabel: "Follow up",
    },
    {
      icon: CircleSlash,
      headline:
        summary.nearlyFullClasses === 1
          ? "class is nearly full this week"
          : "classes are nearly full this week",
      detail: "At 80% capacity or above — consider another session",
      count: summary.nearlyFullClasses,
      tone: "secondary",
      href: "/dashboard/classes",
      actionLabel: "Review",
    },
  ];

  const allClear = summary.totalAlerts === 0;

  return (
    <Panel emphasis>
      <PanelHeader
        title="Needs Attention"
        description="Items waiting on a decision from you"
        action={
          allClear ? (
            <StatusPill tone="positive">All clear</StatusPill>
          ) : (
            <StatusPill tone="warning">
              {summary.totalAlerts}{" "}
              {summary.totalAlerts === 1 ? "item" : "items"}
            </StatusPill>
          )
        }
      />
      <PanelBody className="pb-3">
        {allClear ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[13.5px] font-medium text-slate-900">
                Nothing needs your attention
              </p>
              <p className="mt-0.5 text-[12.5px] text-slate-500">
                No expiring memberships, overdue balances, lapsed members or full
                classes.
              </p>
            </div>
          </div>
        ) : (
          <ul className="-mx-3 divide-y divide-slate-100 lg:grid lg:grid-cols-2 lg:gap-x-4 lg:divide-y-0">
            {rows.map((row) => (
              <Row key={row.actionLabel} row={row} />
            ))}
          </ul>
        )}
      </PanelBody>
    </Panel>
  );
}
