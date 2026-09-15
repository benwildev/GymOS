import { format, formatDistanceToNowStrict } from "date-fns";
import { Activity } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import {
  getActivityFeed,
  getGym,
  type ActivityKind,
} from "@/services/dashboard.service";
import {
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  PanelLink,
  loadPanel,
} from "./primitives";

const KIND_LABEL: Record<ActivityKind, string> = {
  CHECK_IN: "Check-in",
  PAYMENT: "Payment",
  MEMBER: "Member",
  CLASS: "Class",
};

const KIND_STYLE: Record<ActivityKind, string> = {
  CHECK_IN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PAYMENT: "bg-blue-50 text-blue-700 border-blue-200",
  MEMBER: "bg-violet-50 text-violet-700 border-violet-200",
  CLASS: "bg-slate-100 text-slate-600 border-slate-200",
};

export async function ActivityFeedPanel() {
  const [result, gym] = await Promise.all([
    loadPanel(getActivityFeed),
    getGym().catch(() => null),
  ]);

  const currency = gym?.currency || "USD";

  return (
    <Panel className="h-full">
      <PanelHeader
        title="Recent Activity"
        description="Latest events across the gym"
        action={<PanelLink href="/dashboard/attendance" />}
      />
      <PanelBody>
        {!result.ok ? (
          <ErrorState label="recent activity" />
        ) : result.data.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity in the last 14 days"
            description="Check-ins, payments, sign-ups and completed classes appear here as they happen."
          />
        ) : (
          <ol className="-mx-2 divide-y divide-slate-100">
            {result.data.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-slate-50"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600"
                >
                  {item.initials}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-slate-900">
                    {item.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-slate-500">
                    <time
                      dateTime={item.at.toISOString()}
                      title={format(item.at, "EEEE, d MMM yyyy 'at' h:mm a")}
                    >
                      {formatDistanceToNowStrict(item.at, { addSuffix: true })}
                    </time>
                    <span aria-hidden="true">&middot;</span>
                    <span className="truncate">{item.detail}</span>
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                      KIND_STYLE[item.kind]
                    )}
                  >
                    {KIND_LABEL[item.kind]}
                  </span>
                  {item.amount !== undefined ? (
                    <span className="text-[11.5px] font-semibold tabular-nums text-slate-700">
                      {formatCurrency(item.amount, currency)}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </PanelBody>
    </Panel>
  );
}
