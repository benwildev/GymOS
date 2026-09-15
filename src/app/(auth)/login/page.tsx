import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./components/LoginForm";
import { Dumbbell, Users, BarChart3, Calendar, Utensils, Sun } from "lucide-react";
import gymHero from "@/../public/gym_hero.jpg";

import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Sign In | FitManage",
  description: "Sign in to your dedicated gym management platform.",
};

export default async function LoginPage() {
  const gym = await prisma.gym.findFirst();
  const brandName = gym?.name || "FitManage";

  return (
    <div className="min-h-screen w-full flex text-slate-900 bg-[#f9fafb]">
      {/* Left Column: Image Background */}
      <div className="relative hidden lg:flex flex-col justify-between w-1/2 p-12 xl:p-16 overflow-hidden text-white">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={gymHero}
            alt="Gym Background"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-black/70 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
        </div>

        {/* Top Header / Brand Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-transparent flex items-center justify-center text-emerald-500 font-black">
              <Dumbbell className="w-8 h-8 text-emerald-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[28px] font-bold tracking-tight text-white leading-none">
                {brandName}
              </span>
              <span className="text-[11px] font-semibold text-slate-300 tracking-[0.2em] uppercase mt-1">
                GYM MANAGEMENT
              </span>
            </div>
          </div>
        </div>

        {/* Center Hero Copy & Features */}
        <div className="relative z-10 my-auto py-12 space-y-8 max-w-xl">
          <h1 className="text-[52px] xl:text-[64px] font-bold tracking-tight leading-[1.1] text-white">
            Stronger <br />
            People <br />
            <span className="text-[#1a9d5e]">Healthier</span> <br />
            Tomorrows
          </h1>

          <p className="text-xl text-slate-200 font-medium max-w-sm">
            Manage members, track progress, run your gym — all in one place.
          </p>

          <div className="w-10 h-1 bg-[#1a9d5e] rounded-full"></div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Manage Members</h3>
                <p className="text-[15px] text-slate-300">Memberships, attendance and more</p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center shrink-0">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Track Growth</h3>
                <p className="text-[15px] text-slate-300">Insights and financial reports</p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Organize Classes</h3>
                <p className="text-[15px] text-slate-300">Schedules, bookings and attendance</p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/5 flex items-center justify-center shrink-0">
                <Utensils className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg">Support Healthy Lifestyles</h3>
                <p className="text-[15px] text-slate-300">Workout plans and diet plans</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Crisp White Sign-in Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 xl:p-16 relative">
        <div className="absolute top-10 right-10 flex items-center gap-3">
          <Sun className="w-5 h-5 text-slate-600" />
          <div className="text-sm">
            <span className="text-slate-500">Need an account? </span>
            <span className="text-slate-700 font-medium">Contact your gym owner.</span>
          </div>
        </div>

        {/* Mobile Header (visible only on small screens) */}
        <div className="absolute top-6 left-6 flex lg:hidden items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">{brandName}</span>
        </div>

        {/* Sign In Form Box */}
        <div className="w-full max-w-[500px] bg-white rounded-3xl p-10 xl:p-12 shadow-sm border border-slate-100">
          {/* Interactive Form Component */}
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
