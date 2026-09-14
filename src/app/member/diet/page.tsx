import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMemberCurrentDietPlan } from "@/actions/diet.actions";
import { MemberDietClientView } from "./components/MemberDietClientView";

export const metadata = {
  title: "My Nutrition & Diet | Member Portal",
};

export default async function MemberDietPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const res = await getMemberCurrentDietPlan();

  return (
    <div className="space-y-6">
      <MemberDietClientView
        plan={res.plan || null}
        meals={res.meals || []}
      />
    </div>
  );
}
