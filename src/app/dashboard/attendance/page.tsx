import { Suspense } from "react";
import CheckInTerminal from "./components/CheckInTerminal";
import RecentActivity from "./components/RecentActivity";
import { getCurrentlyCheckedInMembers, getRecentCheckOuts } from "@/actions/attendance.actions";

export const metadata = {
  title: "Attendance | GymOS",
};

export default async function AttendancePage() {
  const [currentlyCheckedIn, recentCheckOuts] = await Promise.all([
    getCurrentlyCheckedInMembers(),
    getRecentCheckOuts(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Check In / Out</h2>
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6">
              <CheckInTerminal />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Activity</h2>
          <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden flex flex-col h-[500px]">
            <RecentActivity 
              currentlyCheckedIn={currentlyCheckedIn} 
              recentCheckOuts={recentCheckOuts} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
