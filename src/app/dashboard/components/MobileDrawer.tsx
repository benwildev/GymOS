"use client";

import { useEffect, useRef, useState } from "react";
import { Dumbbell, Menu, X } from "lucide-react";
import { SidebarNav } from "./SidebarNav";

interface MobileDrawerProps {
  brandName: string;
  gymSlogan?: string;
  userName?: string;
}

export function MobileDrawer({
  brandName,
  gymSlogan = "Stronger Every Day",
}: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    // Move focus into the drawer so keyboard users are not left behind it.
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e] focus-visible:ring-offset-2 md:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div
        className={`fixed inset-0 z-50 bg-slate-950/50 transition-opacity duration-200 md:hidden ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-slate-950 text-slate-300 shadow-2xl transition-transform duration-250 ease-out focus:outline-none md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/5 px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a9d5e]/15 text-[#2fbe77]">
              <Dumbbell className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span className="truncate text-[15px] font-semibold text-white">
              {brandName}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigation menu"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a9d5e]"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        <div className="sidebar-scroll flex-1 overflow-y-auto overscroll-contain px-3 py-5">
          <SidebarNav onNavigate={() => setIsOpen(false)} />
        </div>

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
                {gymSlogan}
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
