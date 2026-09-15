import Link from "next/link";
import {
  Users,
  UserCheck,
  Wallet,
  Activity,
  AlertCircle,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { getDashboardKpis, getGym } from "@/services/dashboard.service";
import { ErrorState, Panel, loadPanel } from "./primitives";

/**
 * Five KPIs on one consistent white surface. Importance is carried by type
 * size and icon treatment — not by five different card colours.
 */
function Kpi({
  label,
  value,
  support,
  icon: Icon,
  href,
  emphasis,
  tone = "neutral",
}: {
  label: string;
  value: string;
  support: React.ReactNode;
  icon: LucideIcon;
  href: string;
  emphasis: "primary" | "secondary";
  tone?: "neutral" | "positive" | "critical" | "info";
}) {
  const iconTones = {
    neutral: "bg-slate-100 text-slate-500",
    positive: "bg-emerald-50 text-emerald-600",
    critical: "bg-rose-50 text-rose-600",
    info: "bg-blue-50 text-blue-600",
  } as const;

  return (
    <Panel
      className={cn(
        "group transition-[border-color,box-shadow] duration-200",
        "hover:border-slate-300 hover:shadow-[0_2px_8px_0_rgb(16_24_40/0.06)]",
        "focus-within:border-slate-300"
      )}
    >
      <Link
        href={href}
        className="flex h-full flex-col justify-between gap-3 rounded-2xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-2 sm:p-5"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            {label}
          </span>
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
              emphasis === "primary" ? iconTones[tone] : "bg-slate-50 text-slate-400"
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>

        <div>
          <div
            className={cn(
              "font-semibold tabular-nums tracking-[-0.02em] text-slate-900",
              emphasis === "primary"
                ? "text-[28px] leading-none sm:text-[32px]"
                : "text-[22px] leading-none sm:text-[24px]"
            )}
          >
            {value}
          </div>
          <div className="mt-2 text-[12px] leading-tight text-slate-500">
            {support}
          </div>
        </div>
      </Link>
    </Panel>
  );
}

export async function KpiRow() {
  const [result, gym] = await Promise.all([
    loadPanel(getDashboardKpis),
    getGym().catch(() => null),
  ]);

  if (!result.ok) {
    return (
      <Panel className="p-5">
        <ErrorState label="today's overview" />
      </Panel>
    );
  }

  const kpis = result.data;
  const currency = gym?.currency || "USD";

  const growth =
    kpis.memberGrowthPct === null
      ? null
      : Math.round(kpis.memberGrowthPct * 10) / 10;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
      <Kpi
        label="Total Members"
        value={kpis.totalMembers.toLocaleString()}
        emphasis="secondary"
        icon={Users}
        href="/dashboard/members"
        support={
          growth !== null && growth > 0 ? (
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-600" aria-hidden="true" />
              <span className="font-medium text-emerald-700">+{growth}%</span>
              <span>this month</span>
            </span>
          ) : (
            <span>
              {kpis.newMembersThisMonth} joined this month
            </span>
          )
        }
      />

      <Kpi
        label="Active Members"
        value={kpis.activeMemberships.toLocaleString()}
        emphasis="primary"
        tone="positive"
        icon={UserCheck}
        href="/dashboard/memberships"
        support={`On an active plan of ${kpis.totalMembers.toLocaleString()} total`}
      />

      <Kpi
        label="Today's Collection"
        value={formatCurrency(kpis.todayCollection, currency)}
        emphasis="primary"
        tone="info"
        icon={Wallet}
        href="/dashboard/payments"
        support={`${kpis.paymentsToday} ${
          kpis.paymentsToday === 1 ? "payment" : "payments"
        } received today`}
      />

      <Kpi
        label="Checked In Now"
        value={kpis.checkedInNow.toLocaleString()}
        emphasis="primary"
        tone="positive"
        icon={Activity}
        href="/dashboard/attendance"
        support={`${kpis.checkInsToday} total ${
          kpis.checkInsToday === 1 ? "check-in" : "check-ins"
        } today`}
      />

      <Kpi
        label="Overdue"
        value={formatCurrency(kpis.overdueAmount, currency)}
        emphasis="secondary"
        tone="critical"
        icon={AlertCircle}
        href="/dashboard/payments/due"
        support={
          kpis.overdueMembers > 0 ? (
            <span className="font-medium text-rose-700">
              Overdue &middot; {kpis.overdueMembers}{" "}
              {kpis.overdueMembers === 1 ? "member" : "members"}
            </span>
          ) : (
            <span>No outstanding balances</span>
          )
        }
      />
    </div>
  );
}
