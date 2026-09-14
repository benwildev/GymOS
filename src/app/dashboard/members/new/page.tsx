import { getActiveMembershipPlans } from "@/actions/membership.actions";
import NewMemberWizard from "./components/NewMemberWizard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "New Member | Gym Management",
  description: "Register a new gym member.",
};

export default async function NewMemberPage() {
  const { plans, error } = await getActiveMembershipPlans();

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">New Member</h1>
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          {error}
        </div>
        <Link href="/dashboard/members">
          <Button className="mt-4" variant="outline">Back to Members</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Register New Member</h1>
        <p className="text-muted-foreground mt-1">
          Follow the steps to add a new member and assign a membership plan.
        </p>
      </div>

      <NewMemberWizard plans={plans || []} />
    </div>
  );
}
