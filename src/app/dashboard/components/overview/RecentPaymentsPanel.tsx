import { format, isToday, isYesterday } from "date-fns";
import { Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getGym, getRecentPayments } from "@/services/dashboard.service";
import {
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  PanelLink,
  loadPanel,
} from "./primitives";

function paidLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "d MMM");
}

export async function RecentPaymentsPanel() {
  const [result, gym] = await Promise.all([
    loadPanel(getRecentPayments),
    getGym().catch(() => null),
  ]);

  const currency = gym?.currency || "USD";

  return (
    <Panel className="h-full">
      <PanelHeader
        title="Recent Payments"
        description="Latest collections"
        action={<PanelLink href="/dashboard/payments" />}
      />
      <PanelBody>
        {!result.ok ? (
          <ErrorState label="recent payments" />
        ) : result.data.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No payments recorded"
            description="Record a payment and it will show up in this list."
            actionLabel="Record payment"
            actionHref="/dashboard/payments"
          />
        ) : (
          <ul className="-mx-2 divide-y divide-slate-100">
            {result.data.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-slate-900">
                    {payment.memberName}
                  </p>
                  <p className="mt-0.5 truncate text-[11.5px] text-slate-500">
                    {payment.plan}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[13px] font-semibold tabular-nums text-slate-900">
                    {formatCurrency(payment.amount, currency)}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-slate-500">
                    <time dateTime={payment.paidAt.toISOString()}>
                      {paidLabel(payment.paidAt)}
                    </time>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PanelBody>
    </Panel>
  );
}
