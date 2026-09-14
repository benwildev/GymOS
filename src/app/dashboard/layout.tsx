import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LogOut, LayoutDashboard, Settings, Users, ClipboardCheck, CreditCard, ReceiptText, Layers, Dumbbell, ShieldCheck, Activity, CalendarDays, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, gym] = await Promise.all([
    auth(),
    prisma.gym.findFirst(),
  ]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#fafafa]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 backdrop-blur-md px-6 shadow-2xs">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center text-white shadow-xs">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-gray-900 truncate max-w-[240px]">
                {gym?.name || "GymOS"}
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold border-emerald-300 text-emerald-700 bg-emerald-50 py-0 px-1.5 h-4 shrink-0">
                OWNER
              </Badge>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-gray-50/80 text-xs">
            <div className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-[11px]">
              {session?.user?.name?.charAt(0) || "O"}
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900 leading-none">{session?.user?.name || "Gym Owner"}</div>
              <div className="text-[10px] text-muted-foreground leading-none mt-0.5">{session?.user?.email}</div>
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button variant="outline" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-red-600 hover:border-red-200">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </form>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-64 flex-col justify-between border-r bg-white p-4 md:flex shrink-0">
          <div className="space-y-6">
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Operations
              </div>
              <nav className="flex flex-col gap-1">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-gray-500" />
                  Overview
                </Link>
                <Link
                  href="/dashboard/attendance"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
                >
                  <ClipboardCheck className="h-4 w-4 text-gray-500" />
                  Attendance Terminal
                </Link>
                <Link
                  href="/dashboard/members"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
                >
                  <Users className="h-4 w-4 text-gray-500" />
                  Members
                </Link>
                <Link
                  href="/dashboard/memberships"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
                >
                  <Layers className="h-4 w-4 text-gray-500" />
                  Membership Plans
                </Link>
              </nav>
            </div>

            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Fitness & Classes
              </div>
              <nav className="flex flex-col gap-1">
                <Link
                  href="/dashboard/classes"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
                >
                  <CalendarDays className="h-4 w-4 text-gray-500" />
                  Classes & Schedule
                </Link>
                <Link
                  href="/dashboard/workouts"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
                >
                  <Dumbbell className="h-4 w-4 text-gray-500" />
                  Workout Plans
                </Link>
                <Link
                  href="/dashboard/diets"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
                >
                  <Utensils className="h-4 w-4 text-gray-500" />
                  Diet Plans
                </Link>
              </nav>
            </div>

            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Finance & Settings
              </div>
              <nav className="flex flex-col gap-1">
                <Link
                  href="/dashboard/payments"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
                >
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  Payments & Dues
                </Link>
                <Link
                  href="/dashboard/expenses"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
                >
                  <ReceiptText className="h-4 w-4 text-gray-500" />
                  Gym Expenses
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-500" />
                  Settings
                </Link>
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}
