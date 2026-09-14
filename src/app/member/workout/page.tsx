import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMemberCurrentWorkoutPlan } from "@/actions/workout.actions";
import { MemberWorkoutClientView } from "./components/MemberWorkoutClientView";

export const metadata = {
  title: "My Workout Routine | Member Portal",
};

export default async function MemberWorkoutPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const res = await getMemberCurrentWorkoutPlan();

  return (
    <div className="space-y-6">
      <MemberWorkoutClientView
        plan={res.plan || null}
        currentDay={res.currentDay || "MONDAY"}
        groupedExercises={res.groupedExercises || {}}
        todayExercises={res.todayExercises || []}
      />
    </div>
  );
}
