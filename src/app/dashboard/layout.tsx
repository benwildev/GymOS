import { format } from "date-fns";
import { Dumbbell, Search } from "lucide-react";
import { auth } from "@/lib/auth";
import { getGym } from "@/services/dashboard.service";
import { SidebarNav } from "./components/SidebarNav";
import { MobileDrawer } from "./components/MobileDrawer";
import { UserMenu } from "./components/UserMenu";
import { NotificationBell } from "@/components/notification-bell";

const GYM_TAGLINE = "Stronger Every Day";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, gym] = await Promise.all([auth(), getGym().catch(() => null)]);

  const brandName = gym?.name || "GymOS";
  const userName = session?.user?.name || "Owner";
  const now = new Date();

  return (
    <div className="flex min-h-screen w-full bg-[#f8f9fb]">
      {/* Sidebar (desktop) */}
      <aside className="hidden shrink-0 border-r border-white/5 bg-slate-950 text-slate-300 md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:h-screen md:w-[248px] md:flex-col">
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/5 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a9d5e]/15 text-[#2fbe77]">
            <Dumbbell className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-white">
            {brandName}
          </span>
        </div>

        {/* Navigation */}
        <div className="sidebar-scroll flex-1 overflow-y-auto overscroll-contain px-3 py-5">
          <SidebarNav />
        </div>

        {/* Gym identity card */}
        <div className="shrink-0 p-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a9d5e] text-[12px] font-semibold text-white">
              {brandName.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-white">
                {brandName}
              </span>
              <span className="block truncate text-[11.5px] text-slate-400">
                {GYM_TAGLINE}
              </span>
            </span>
          </div>
        </div>
      </aside>

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          <MobileDrawer
            brandName={brandName}
            gymSlogan={GYM_TAGLINE}
            userName={userName}
          />

          {/* Mobile brand */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1a9d5e] text-white">
              <Dumbbell className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="truncate text-[14px] font-semibold text-slate-900">
              {brandName}
            </span>
          </div>

          {/* Search — deliberately quiet */}
          <div className="hidden min-w-0 flex-1 md:block">
            <label htmlFor="dashboard-search" className="sr-only">
              Search members, payments and classes
            </label>
            <div className="relative max-w-sm">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="dashboard-search"
                type="search"
                placeholder="Search members, payments, classes..."
                className="h-9 w-full rounded-lg border border-transparent bg-slate-100/70 pl-9 pr-3 text-[13px] text-slate-900 placeholder:text-slate-400 transition-colors hover:bg-slate-100 focus:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a9d5e]/20"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <time
              dateTime={format(now, "yyyy-MM-dd")}
              className="hidden text-[12.5px] font-medium text-slate-500 lg:block"
            >
              {format(now, "d MMM yyyy")}
            </time>
            <NotificationBell />
            <span
              className="hidden h-6 w-px bg-slate-200 sm:block"
              aria-hidden="true"
            />
            <UserMenu
              userName={userName}
              role={session?.user?.role === "MEMBER" ? "Member" : "Owner"}
            />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
