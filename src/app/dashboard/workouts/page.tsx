import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getWorkoutPlans } from "@/actions/workout.actions";
import { WorkoutsClientView } from "./components/WorkoutsClientView";

export const metadata = {
  title: "Workout Plans | GymOS",
};

export default async function WorkoutsPage() {
  const session = await auth();

  if (!session || session.user?.role !== Role.OWNER) {
    redirect("/dashboard");
  }

  const [plansRes, members] = await Promise.all([
    getWorkoutPlans(),
    prisma.user.findMany({
      where: { role: Role.MEMBER },
      include: { profile: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const plans = plansRes.plans || [];

  return (
    <div className="space-y-6">
      <WorkoutsClientView
        initialPlans={plans}
        members={members}
      />
    </div>
  );
}
