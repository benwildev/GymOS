import { getMembers } from "@/actions/member.actions";
import { getMembershipPlans } from "@/actions/membership.actions";
import MembersClient from "./components/MembersClient";

export const metadata = {
  title: "Members | Gym Management",
  description: "Manage your gym's members.",
};

export default async function MembersPage(props: {
  searchParams: Promise<{ search?: string; status?: string; planId?: string }>;
}) {
  const searchParams = await props.searchParams;
  
  const search = searchParams.search || "";
  const status = searchParams.status || "";
  const planId = searchParams.planId || "";

  // Need to await this as it might be an async call, but searchParams are now a Promise in Next.js 15+ (App Router). 
  // Next 16 might have it too.
  
  const [{ members }, { plans }] = await Promise.all([
    getMembers(search, status as any, planId),
    getMembershipPlans(),
  ]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your gym members and their memberships.
          </p>
        </div>
      </div>

      <MembersClient 
        initialMembers={members || []} 
        plans={plans || []} 
        search={search}
        status={status}
        planId={planId}
      />
    </div>
  );
}
