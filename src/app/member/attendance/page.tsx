import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMemberAttendanceHistory } from "@/actions/attendance.actions";
import AttendanceHistory from "./components/AttendanceHistory";

export const metadata = {
  title: "My Attendance | GymOS",
};

export default async function MemberAttendancePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const attendanceHistory = await getMemberAttendanceHistory(session.user.id);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance History</h1>
        <p className="text-gray-500 mt-2">View your past gym visits and check-ins.</p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
        <AttendanceHistory records={attendanceHistory} />
      </div>
    </div>
  );
}
