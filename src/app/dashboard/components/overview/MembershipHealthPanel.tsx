import { Layers } from "lucide-react";
import { getMembershipHealth } from "@/services/dashboard.service";
import { MembershipDonut, type MembershipSegment } from "./MembershipDonut";
import {
  EmptyState,
  ErrorState,
  Panel,
  PanelBody,
  PanelHeader,
  PanelLink,
  loadPanel,
} from "./primitives";

export async function MembershipHealthPanel() {
  const result = await loadPanel(getMembershipHealth);

  const health = result.ok ? result.data : null;

  const segments: MembershipSegment[] = health
    ? [
        { name: "Active", value: health.active, color: "#1a9d5e" },
        { name: "Expiring Soon", value: health.expiringSoon, color: "#f59e0b" },
        { name: "Expired", value: health.expired, color: "#e11d48" },
        { name: "Frozen", value: health.frozen, color: "#7c6ef6" },
      ]
    : [];

  const hasData = health !== null && health.total > 0;

  return (
    <Panel className="h-full">
      <PanelHeader
        title="Membership Health"
        description="Contract status across the gym"
        action={<PanelLink href="/dashboard/memberships">Manage</PanelLink>}
      />
      <PanelBody>
        {!result.ok || !health ? (
          <ErrorState label="membership health" />
        ) : !hasData ? (
          <EmptyState
            icon={Layers}
            title="No memberships yet"
            description="Assign a plan to a member and their contract status shows up here."
            actionLabel="Create a plan"
            actionHref="/dashboard/memberships"
          />
        ) : (
          <>
            <MembershipDonut
              segments={segments.filter((s) => s.value > 0)}
              total={health.total}
            />

            <dl className="mt-5 space-y-0.5">
              {segments.map((segment) => (
                <div
                  key={segment.name}
                  className="flex items-center justify-between rounded-lg px-2 py-2 text-[13px] transition-colors hover:bg-slate-50"
                >
                  <dt className="flex items-center gap-2.5 text-slate-600">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: segment.color }}
                      aria-hidden="true"
                    />
                    {segment.name}
                  </dt>
                  <dd className="font-semibold tabular-nums text-slate-900">
                    {segment.value}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </PanelBody>
    </Panel>
  );
}
