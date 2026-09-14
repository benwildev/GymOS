"use client";

import { useState } from "react";
import { registerOwner } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell, User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await registerOwner(formData);
      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login?registered=true");
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4 animate-in zoom-in-95 duration-200">
        <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white">Gym Setup Complete!</h3>
          <p className="text-xs text-zinc-400">
            Your single-tenant gym instance is ready. Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-red-400 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="gymName" className="text-xs font-medium text-zinc-300">
          Gym Facility Name
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Dumbbell className="w-4 h-4" />
          </div>
          <Input
            id="gymName"
            name="gymName"
            placeholder="e.g. IronPulse Athletics"
            required
            className="pl-9 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 h-11 rounded-lg text-sm transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs font-medium text-zinc-300">
          Owner Full Name
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <User className="w-4 h-4" />
          </div>
          <Input
            id="name"
            name="name"
            placeholder="e.g. Alex Morgan"
            required
            className="pl-9 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 h-11 rounded-lg text-sm transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-medium text-zinc-300">
          Owner Email Address
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Mail className="w-4 h-4" />
          </div>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="owner@yourgym.com"
            required
            className="pl-9 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 h-11 rounded-lg text-sm transition-colors"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-medium text-zinc-300">
          Master Password
        </Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Lock className="w-4 h-4" />
          </div>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
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
        disabled={isLoading}
        className="w-full h-11 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Initializing GymOS...
          </>
        ) : (
          <>
            Register Gym Installation
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      <div className="pt-2 text-center text-xs text-zinc-500">
        Already configured this installation?{" "}
        <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1">
          Sign In &rarr;
        </Link>
      </div>
    </form>
  );
}
