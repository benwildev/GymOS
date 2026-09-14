import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./components/LoginForm";
import { Dumbbell, ShieldCheck, Zap, Activity, CheckCircle2 } from "lucide-react";
import gymHero from "@/../public/gym_hero.jpg";

import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Sign In | Gym Management Platform",
  description: "Sign in to your dedicated gym management platform.",
};

export default async function LoginPage() {
  const gym = await prisma.gym.findFirst();

  return (
    <div className="min-h-screen w-full grid lg:grid-cols-12 bg-[#09090b] text-white selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Left Column: Atmospheric Cinematic Gym Showcase (lg: 7 cols) */}
      <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-12 xl:p-16 overflow-hidden">
        {/* Background Image & Multi-layer Gradient Overlays */}
        <div className="absolute inset-0 z-0">
          <Image
            src={gymHero}
            alt="Luxury Gym Sanctuary"
            fill
            priority
            className="object-cover object-center filter brightness-60 contrast-125 scale-105"
          />
          {/* Radial & Linear gradient overlays for rich atmosphere */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#09090b]/30 to-[#09090b]" />
        </div>


        {/* Top Header / Brand Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-emerald-500/20">
              <Dumbbell className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                {gym?.name || "GymOS"} <span className="text-emerald-400 font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">PORTAL</span>
              </span>
              <p className="text-[11px] text-zinc-400 tracking-wider uppercase font-medium">Single-Tenant Fitness OS</p>
            </div>
          </div>
        </div>

        {/* Center Hero Copy */}
        <div className="relative z-10 max-w-xl my-auto py-12 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 uppercase tracking-widest">
            <Zap className="w-3 h-3 text-emerald-400" />
            Engineered For High-Performance Gyms
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
            Discipline on the floor.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
              Precision in the back office.
            </span>
          </h1>

          <p className="text-base text-zinc-300 leading-relaxed max-w-lg font-normal">
            Frictionless check-in terminal, automated member dues calculation, printable receipts, and live operational metrics built for single-gym excellence.
          </p>
        </div>
      </div>

      {/* Right Column: Dedicated Luxury Sign-in Container (lg: 5 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-[#0c0c10] border-l border-white/5 relative min-h-screen">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile Header (visible only on small screens) */}
        <div className="flex lg:hidden items-center justify-between pb-8">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-bold">
              <Dumbbell className="w-4 h-4 text-black" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">{gym?.name || "GymOS"}</span>
          </div>
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            v2.4
          </span>
        </div>

        {/* Sign In Form Box */}
        <div className="my-auto py-8 space-y-6 max-w-md w-full mx-auto relative z-10">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {gym?.name ? `Sign in to ${gym.name}` : "Sign in to your gym"}
            </h2>
            <p className="text-sm text-zinc-400">
              Access the Owner Control Center or your Gym Member Profile.
            </p>
          </div>

          {/* Interactive Form Component with quick-fill & states */}
          <LoginForm />
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-8 text-center text-xs text-zinc-500 flex items-center justify-between border-t border-white/5">
          <span>&copy; {new Date().getFullYear()} GymOS Software</span>
          <span className="text-zinc-500">v2.4 Production Edition</span>
        </div>
      </div>
    </div>
  );
}
