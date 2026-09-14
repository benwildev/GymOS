import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getClasses, getClassSchedules } from "@/actions/class.actions";
import { ClassesClientView } from "./components/ClassesClientView";

export const metadata = {
  title: "Classes & Schedules | GymOS",
};

export default async function ClassesPage() {
  const session = await auth();

  if (!session || session.user?.role !== Role.OWNER) {
    redirect("/dashboard");
  }

  const [classesRes, schedulesRes] = await Promise.all([
    getClasses(),
    getClassSchedules(),
  ]);

  const classes = classesRes.classes || [];
  const schedules = schedulesRes.schedules || [];

  return (
    <div className="space-y-6">
      <ClassesClientView
        initialClasses={classes}
        initialSchedules={schedules}
      />
    </div>
  );
}
