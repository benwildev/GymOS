import { Suspense } from "react";
import Link from "next/link";
import { Dumbbell, Utensils } from "lucide-react";
import { auth } from "@/lib/auth";
import { getGym } from "@/services/dashboard.service";
import { DashboardHeader } from "./components/overview/DashboardHeader";
import { KpiRow } from "./components/overview/KpiRow";
import { AttendancePanel } from "./components/overview/AttendancePanel";
import { MembershipHealthPanel } from "./components/overview/MembershipHealthPanel";
import { NeedsAttentionPanel } from "./components/overview/NeedsAttentionPanel";
import { ActivityFeedPanel } from "./components/overview/ActivityFeedPanel";
import { TodaysClassesPanel } from "./components/overview/TodaysClassesPanel";
import { RecentMembersPanel } from "./components/overview/RecentMembersPanel";
import { RecentPaymentsPanel } from "./components/overview/RecentPaymentsPanel";
import { SectionLabel } from "./components/overview/primitives";
import {
  AttentionPanelSkeleton,
  ChartPanelSkeleton,
  DonutPanelSkeleton,
  KpiRowSkeleton,
  ListPanelSkeleton,
} from "./components/overview/skeletons";

export const metadata = {
  title: "Dashboard | GymOS",
  description: "Daily operating picture for your gym.",
};

/**
 * Owner dashboard.
 *
 * Every section is an independent async server component behind its own
 * Suspense boundary: they fetch in parallel, stream in as they resolve, and a
 * failure in one renders that panel's error state rather than the whole page.
 *
 * Mobile reorders the bands so the owner sees what needs action before the
 * analytics (see the `order-*` utilities below).
 */
export default async function DashboardPage() {
  const [session, gym] = await Promise.all([auth(), getGym().catch(() => null)]);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 pb-10">
      <DashboardHeader
        userName={session?.user?.name || "Owner"}
        gymName={gym?.name || "your gym"}
        now={new Date()}
      />

      {/* Today's overview ------------------------------------------------- */}
      <section className="order-1 space-y-3" aria-labelledby="overview-heading">
        <SectionLabel>
          <span id="overview-heading">Today&apos;s Overview</span>
        </SectionLabel>
        <Suspense fallback={<KpiRowSkeleton />}>
          <KpiRow />
        </Suspense>
      </section>

      {/* Action required — lifted above analytics on small screens -------- */}
      <section
        className="order-2 space-y-3 lg:order-3"
        aria-labelledby="attention-heading"
      >
        <SectionLabel>
          <span id="attention-heading">Action Required</span>
        </SectionLabel>
        <Suspense fallback={<AttentionPanelSkeleton />}>
          <NeedsAttentionPanel />
        </Suspense>
      </section>

      {/* Business health -------------------------------------------------- */}
      <section
        className="order-3 space-y-3 lg:order-2"
        aria-labelledby="health-heading"
      >
        <SectionLabel>
          <span id="health-heading">Business Health</span>
        </SectionLabel>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          <div className="lg:col-span-8">
            <Suspense fallback={<ChartPanelSkeleton />}>
              <AttendancePanel />
            </Suspense>
          </div>
          <div className="lg:col-span-4">
            <Suspense fallback={<DonutPanelSkeleton />}>
              <MembershipHealthPanel />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Activity --------------------------------------------------------- */}
      <section className="order-4 space-y-3" aria-labelledby="activity-heading">
        <SectionLabel>
          <span id="activity-heading">Activity</span>
        </SectionLabel>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          <div className="order-2 lg:order-1 lg:col-span-7">
            <Suspense fallback={<ListPanelSkeleton rows={6} />}>
              <ActivityFeedPanel />
            </Suspense>
          </div>
          <div className="order-1 lg:order-2 lg:col-span-5">
            <Suspense fallback={<ListPanelSkeleton rows={3} />}>
              <TodaysClassesPanel />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Members & payments ----------------------------------------------- */}
      <section className="order-5 space-y-3" aria-labelledby="ledger-heading">
        <SectionLabel>
          <span id="ledger-heading">Members &amp; Payments</span>
        </SectionLabel>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
          <div className="order-2 lg:order-1 lg:col-span-7">
            <Suspense fallback={<ListPanelSkeleton />}>
              <RecentMembersPanel />
            </Suspense>
          </div>
          <div className="order-1 lg:order-2 lg:col-span-5">
            <Suspense fallback={<ListPanelSkeleton />}>
              <RecentPaymentsPanel />
            </Suspense>
          </div>
        </div>
      </section>

      {/* Compact contextual shortcuts (replaces the old promo banner) ------ */}
      <div className="order-6 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-slate-600">
          Need to manage member plans?
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/workouts"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[12.5px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-2"
          >
            <Dumbbell className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            Manage Workouts
          </Link>
          <Link
            href="/dashboard/diets"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[12.5px] font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-2"
          >
            <Utensils className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            Manage Diet Plans
          </Link>
        </div>
      </div>
    </div>
  );
}
