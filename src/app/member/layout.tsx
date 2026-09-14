import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LogOut, Home, User, ClipboardCheck, CreditCard, CalendarDays, Dumbbell, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, gym] = await Promise.all([
    auth(),
    prisma.gym.findFirst(),
  ]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50/50 pb-20 md:pb-0">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6 shadow-2xs">
        <div className="flex items-center gap-8">
          <Link href="/member" className="flex items-center gap-2 font-semibold">
            <span className="h-7 w-7 rounded-md bg-black text-white flex items-center justify-center text-xs font-bold">
              {gym?.name?.charAt(0) || "G"}
            </span>
            <span className="text-base font-bold tracking-tight">{gym?.name || "GymOS"}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
            <Link href="/member" className="text-gray-600 hover:text-black transition-colors">Home</Link>
            <Link href="/member/classes" className="text-gray-600 hover:text-black transition-colors">Classes</Link>
            <Link href="/member/workout" className="text-gray-600 hover:text-black transition-colors">Workout</Link>
            <Link href="/member/diet" className="text-gray-600 hover:text-black transition-colors">Diet</Link>
            <Link href="/member/attendance" className="text-gray-600 hover:text-black transition-colors">Attendance</Link>
            <Link href="/member/payments" className="text-gray-600 hover:text-black transition-colors">Payments</Link>
            <Link href="/member/profile" className="text-gray-600 hover:text-black transition-colors">Profile</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700 hidden sm:block bg-gray-100 px-2.5 py-1 rounded-full">{session?.user?.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 z-40 flex h-16 w-full items-center justify-around border-t bg-white/95 backdrop-blur-md px-2 md:hidden shadow-lg">
        <Link href="/member" className="flex flex-col items-center gap-1 text-gray-500 hover:text-black py-1">
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link href="/member/classes" className="flex flex-col items-center gap-1 text-gray-500 hover:text-black py-1">
          <CalendarDays className="h-5 w-5" />
          <span className="text-[10px] font-medium">Classes</span>
        </Link>
        <Link href="/member/workout" className="flex flex-col items-center gap-1 text-gray-500 hover:text-black py-1">
          <Dumbbell className="h-5 w-5" />
          <span className="text-[10px] font-medium">Workout</span>
        </Link>
        <Link href="/member/diet" className="flex flex-col items-center gap-1 text-gray-500 hover:text-black py-1">
          <Utensils className="h-5 w-5" />
          <span className="text-[10px] font-medium">Diet</span>
        </Link>
        <Link href="/member/profile" className="flex flex-col items-center gap-1 text-gray-500 hover:text-black py-1">
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  );
}

