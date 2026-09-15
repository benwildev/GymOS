"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { logoutAction } from "@/actions/auth.actions";

/**
 * Avatar + name + role + dropdown. Sign-out lives here rather than as a
 * standalone button in the top bar.
 */
export function UserMenu({
  userName,
  role,
}: {
  userName: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);

  const initials = userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const itemClass =
    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e]";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Open account menu"
        className="flex cursor-pointer items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-2"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[12px] font-semibold text-white">
          {initials || "O"}
        </span>
        <span className="hidden flex-col text-left sm:flex">
          <span className="text-[13px] font-medium leading-tight text-slate-900">
            {userName}
          </span>
          <span className="text-[11.5px] leading-tight text-slate-500">{role}</span>
        </span>
        <ChevronDown
          className="hidden h-3.5 w-3.5 text-slate-400 sm:block"
          aria-hidden="true"
        />
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-60 gap-1 p-1.5">
        <div className="border-b border-slate-100 px-2.5 pb-2.5 pt-1.5">
          <p className="truncate text-[13px] font-medium text-slate-900">
            {userName}
          </p>
          <p className="text-[11.5px] text-slate-500">{role}</p>
        </div>

        <Link
          href="/dashboard/settings"
          onClick={() => setOpen(false)}
          className={itemClass}
        >
          <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Gym profile
        </Link>
        <Link
          href="/dashboard/settings"
          onClick={() => setOpen(false)}
          className={itemClass}
        >
          <Settings className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Settings
        </Link>

        <form action={logoutAction} className="border-t border-slate-100 pt-1">
          <button
            type="submit"
            className={`${itemClass} cursor-pointer text-rose-600 hover:bg-rose-50`}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
