import Image from "next/image";
import Link from "next/link";
import { RegisterForm } from "./components/RegisterForm";
import { Dumbbell, ShieldCheck, Zap, Activity } from "lucide-react";
import gymHero from "@/../public/gym_hero.jpg";

export const metadata = {
  title: "Register Gym Installation | GymOS",
  description: "Initialize your single-tenant gym management software installation.",
};

export default function RegisterPage() {
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
                GymOS <span className="text-emerald-400 font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">SETUP</span>
              </span>
              <p className="text-[11px] text-zinc-400 tracking-wider uppercase font-medium">Single-Tenant Fitness OS</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md text-xs font-medium text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Single Gym Setup</span>
          </div>
        </div>

        {/* Center Hero Copy */}
        <div className="relative z-10 max-w-xl my-auto py-12 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 uppercase tracking-widest">
            <Zap className="w-3 h-3 text-emerald-400" />
            Zero Multi-Tenant Bloat
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-white">
            Dedicated solely to
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300">
              your gym's members & profits.
            </span>
          </h1>

          <p className="text-base text-zinc-300 leading-relaxed max-w-lg font-normal">
            Take full ownership of your fitness facility. One gym installation, one dedicated database, total control over check-ins, memberships, and finances.
          </p>
        </div>

        {/* Bottom Bento Glass Highlights */}
        <div className="relative z-10 grid grid-cols-3 gap-3.5 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Owned
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Direct connection to your own Neon Postgres database.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-1">
            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold">
              <Zap className="w-3.5 h-3.5" /> High Performance
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Next.js 16 server actions and responsive terminal UI.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-200 text-xs font-bold">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Member Portal
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Built-in self-service attendance passes and digital receipts.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Setup Container (lg: 5 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-[#0c0c10] border-l border-white/5 relative min-h-screen">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile Header */}
        <div className="flex lg:hidden items-center justify-between pb-8">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-bold">
              <Dumbbell className="w-4 h-4 text-black" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">GymOS Setup</span>
          </div>
        </div>

        {/* Setup Form Box */}
        <div className="my-auto py-8 space-y-6 max-w-md w-full mx-auto relative z-10">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Initialize Your Gym
            </h2>
            <p className="text-sm text-zinc-400">
              Set up the primary facility name and owner administrator credentials.
            </p>
          </div>

          <RegisterForm />
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-8 text-center text-xs text-zinc-500 flex items-center justify-between border-t border-white/5">
          <span>&copy; {new Date().getFullYear()} GymOS Software</span>
          <span className="text-zinc-500">Single-Tenant Edition</span>
        </div>
      </div>
    </div>
  );
}
