import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMemberClassesData } from "@/actions/class.actions";
import { MemberClassesClientView } from "./components/MemberClassesClientView";
import { MembershipStatus } from "@/types/enums";

export const metadata = {
  title: "Gym Classes | Member Portal",
};

export default async function MemberClassesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [classesData, activeMembership] = await Promise.all([
    getMemberClassesData(),
    prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        status: MembershipStatus.ACTIVE,
        endDate: { gte: new Date() },
      },
    }),
  ]);

  const availableClasses = classesData.availableClasses || [];
  const upcomingBookings = classesData.upcomingBookings || [];
  const bookingHistory = classesData.bookingHistory || [];

  return (
    <div className="space-y-6">
      <MemberClassesClientView
        availableClasses={availableClasses}
        upcomingBookings={upcomingBookings}
        bookingHistory={bookingHistory}
        hasActiveMembership={!!activeMembership}
      />
    </div>
  );
}
