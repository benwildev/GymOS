"use client";

import { useActionState, useState } from "react";
import { authenticate } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, ShieldCheck, Sparkles, User, Dumbbell } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleFillDemo = (type: "OWNER" | "MEMBER") => {
    if (type === "OWNER") {
      setEmail("admin@ironpulse.com");
      setPassword("12345678");
    } else {
      setEmail("member@example.com");
      setPassword("12345678");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Quick Demo Credentials Bar */}
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-xs space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 font-medium text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Quick Demo Fill
          </span>
          <span className="text-[11px] text-zinc-500">1-click credentials</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleFillDemo("OWNER")}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-white/[0.05] hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 border border-white/5 text-zinc-300 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Owner Demo</span>
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo("MEMBER")}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-white/[0.05] hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30 border border-white/5 text-zinc-300 transition-all cursor-pointer"
          >
            <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
            <span>Member Demo</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-red-400 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-zinc-300">
            Email Address
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Mail className="w-4 h-4" />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@yourgym.com"
              required
              className="pl-9 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 h-11 rounded-lg text-sm transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium text-zinc-300">
              Password
            </Label>
            <span className="text-xs text-zinc-500 hover:text-zinc-400 cursor-pointer">
              Forgot?
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Lock className="w-4 h-4" />
            </div>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="pl-9 pr-10 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 h-11 rounded-lg text-sm transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              Sign In to GymOS
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      {/* Footer Registration Link */}
      <div className="pt-2 text-center text-xs text-zinc-500">
        First time setting up your gym?{" "}
        <Link href="/register" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1">
          Register Gym Installation &rarr;
        </Link>
      </div>

      {/* Single-Tenant Assurance Badge */}
      <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/70" />
        <span>Single-Tenant Isolated Architecture &bull; 256-bit Encrypted</span>
      </div>
    </div>
  );
}
