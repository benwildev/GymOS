import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDietPlans } from "@/actions/diet.actions";
import { DietsClientView } from "./components/DietsClientView";

export const metadata = {
  title: "Diet Plans | GymOS",
};

export default async function DietsPage() {
  const session = await auth();

  if (!session || session.user?.role !== Role.OWNER) {
    redirect("/dashboard");
  }

  const [plansRes, members] = await Promise.all([
    getDietPlans(),
    prisma.user.findMany({
      where: { role: Role.MEMBER },
      include: { profile: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const plans = plansRes.plans || [];

  return (
    <div className="space-y-6">
      <DietsClientView
        initialPlans={plans}
        members={members}
      />
    </div>
  );
}
