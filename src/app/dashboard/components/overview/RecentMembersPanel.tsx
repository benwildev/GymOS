import Link from "next/link";
import { format, isToday, isYesterday } from "date-fns";
import { Users } from "lucide-react";
import { getRecentMembers } from "@/services/dashboard.service";
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

function lastVisitLabel(date: Date | null) {
  if (!date) return "Never";
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "d MMM");
}

function statusTone(status: string | null) {
  switch (status) {
    case "ACTIVE":
      return "positive" as const;
    case "FROZEN":
      return "info" as const;
    case "CANCELLED":
      return "critical" as const;
    case "INACTIVE":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export async function RecentMembersPanel() {
  const result = await loadPanel(getRecentMembers);

  return (
    <Panel className="h-full">
      <PanelHeader
        title="Recent Members"
        description="Newest sign-ups"
        action={<PanelLink href="/dashboard/members" />}
      />
      <PanelBody>
        {!result.ok ? (
          <ErrorState label="recent members" />
        ) : result.data.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members yet"
            description="Add your first member to start tracking plans and visits."
            actionLabel="Add member"
            actionHref="/dashboard/members/new"
          />
        ) : (
          <>
            {/* Desktop: compact table */}
            <table className="hidden w-full text-left sm:table">
              <thead>
                <tr className="border-b border-slate-100">
                  <th
                    scope="col"
                    className="pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400"
                  >
                    Member
                  </th>
                  <th
                    scope="col"
                    className="pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400"
                  >
                    Plan
                  </th>
                  <th
                    scope="col"
                    className="pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="pb-2 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400"
                  >
                    Last Visit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.data.map((member) => (
                  <tr key={member.id} className="transition-colors hover:bg-slate-50">
                    <td className="py-2.5">
                      <Link
                        href={`/dashboard/members/${member.id}`}
                        className="text-[13px] font-medium text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-2"
                      >
                        {member.name}
                      </Link>
                      {member.memberId ? (
                        <span className="block text-[11.5px] text-slate-400">
                          {member.memberId}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 text-[12.5px] text-slate-600">
                      {member.plan || "No plan"}
                    </td>
                    <td className="py-2.5">
                      <StatusPill tone={statusTone(member.membershipStatus)}>
                        {member.membershipStatus
                          ? titleCase(member.membershipStatus)
                          : "No membership"}
                      </StatusPill>
                    </td>
                    <td className="py-2.5 text-right text-[12.5px] tabular-nums text-slate-600">
                      {lastVisitLabel(member.lastVisit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile: the same rows as a readable list */}
            <ul className="divide-y divide-slate-100 sm:hidden">
              {result.data.map((member) => (
                <li key={member.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/dashboard/members/${member.id}`}
                      className="min-w-0 text-[13.5px] font-medium text-slate-900"
                    >
                      <span className="block truncate">{member.name}</span>
                      <span className="mt-0.5 block truncate text-[12px] font-normal text-slate-500">
                        {member.plan || "No plan"}
                        <span aria-hidden="true"> &middot; </span>
                        Last visit {lastVisitLabel(member.lastVisit)}
                      </span>
                    </Link>
                    <StatusPill tone={statusTone(member.membershipStatus)}>
                      {member.membershipStatus
                        ? titleCase(member.membershipStatus)
                        : "None"}
                    </StatusPill>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </PanelBody>
    </Panel>
  );
}
