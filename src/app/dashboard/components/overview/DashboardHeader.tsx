import Link from "next/link";
import { format } from "date-fns";
import { CalendarDays, CreditCard, UserCheck, UserPlus } from "lucide-react";

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const SECONDARY_ACTION =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12.5px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-2";

export function DashboardHeader({
  userName,
  gymName,
  now,
}: {
  userName: string;
  gymName: string;
  now: Date;
}) {
  const firstName = userName.trim().split(/\s+/)[0] || userName;

  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.025em] text-slate-900 sm:text-[30px]">
          {greetingFor(now.getHours())}, {firstName}{" "}
          <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-1.5 text-[13.5px] text-slate-500">
          Here&apos;s what&apos;s happening at {gymName} today.
        </p>
      </div>

      <div className="flex flex-col items-start gap-3 lg:items-end">
        <p className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          <time dateTime={format(now, "yyyy-MM-dd")}>
            {format(now, "EEEE, d MMMM")}
          </time>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard/attendance" className={SECONDARY_ACTION}>
            <UserCheck className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            Quick Check-in
          </Link>
          <Link href="/dashboard/members/new" className={SECONDARY_ACTION}>
            <UserPlus className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            Add Member
          </Link>
          <Link
            href="/dashboard/payments"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#1a9d5e] px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-[#15824e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-2"
          >
            <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
            Record Payment
          </Link>
        </div>
      </div>
    </header>
  );
}
