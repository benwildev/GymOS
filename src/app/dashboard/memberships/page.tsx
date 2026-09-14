import { getMembershipPlans } from "@/actions/membership.actions";
import MembershipPlansClient from "./components/MembershipPlansClient";

export const metadata = {
  title: "Membership Plans | Gym Management",
  description: "Manage your gym's membership plans.",
};

export default async function MembershipsPage() {
  const { plans, error } = await getMembershipPlans();

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Membership Plans</h1>
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membership Plans</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage pricing plans for your gym members.
          </p>
        </div>
      </div>

      <MembershipPlansClient initialPlans={plans || []} />
    </div>
  );
}
