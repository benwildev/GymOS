"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Layers,
  ClipboardCheck,
  CreditCard,
  ReceiptText,
  CalendarDays,
  Dumbbell,
  Utensils,
  BarChart3,
  Bell,
  Settings,
  Megaphone,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
      { name: "Members", href: "/dashboard/members", icon: Users },
      {
        name: "Retention Hub",
        href: "/dashboard/members/attention",
        icon: HeartPulse,
        exact: true,
      },
      { name: "Memberships", href: "/dashboard/memberships", icon: Layers },
      { name: "Attendance", href: "/dashboard/attendance", icon: ClipboardCheck },
    ],
  },
  {
    label: "Finance",
    items: [
      { name: "Payments", href: "/dashboard/payments", icon: CreditCard },
      { name: "Expenses", href: "/dashboard/expenses", icon: ReceiptText },
    ],
  },
  {
    label: "Fitness",
    items: [
      { name: "Classes", href: "/dashboard/classes", icon: CalendarDays },
      { name: "Workouts", href: "/dashboard/workouts", icon: Dumbbell },
      { name: "Diet Plans", href: "/dashboard/diets", icon: Utensils },
    ],
  },
  {
    label: "Insights",
    items: [
      { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
      { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
      { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
    ],
  },
  {
    label: "System",
    items: [{ name: "Settings", href: "/dashboard/settings", icon: Settings }],
  },
];

/**
 * `/dashboard/members/attention` is a child of `/dashboard/members`, so
 * "Members" must not claim the active state while the Retention Hub is open.
 */
const EXCLUSIVE_CHILD_ROUTES = ["/dashboard/members/attention"];

function useIsActive() {
  const pathname = usePathname();

  return (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    if (
      EXCLUSIVE_CHILD_ROUTES.some(
        (route) => route !== item.href && pathname === route
      )
    ) {
      return false;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const isActive = useIsActive();

  return (
    <nav aria-label="Dashboard sections" className="space-y-6">
      {navGroups.map((group) => (
        <div key={group.label}>
          <h2 className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {group.label}
          </h2>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                      active
                        ? "bg-[#1a9d5e]/15 font-medium text-white"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[17px] w-[17px] shrink-0",
                        active ? "text-[#2fbe77]" : "text-slate-500"
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
