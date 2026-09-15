"use client";

import { useActionState, useState } from "react";
import { authenticate } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, ShieldCheck, Dumbbell, Sparkles } from "lucide-react";
import Image from "next/image";

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
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Quick Demo Fill
          </span>
          <span className="text-[11px] text-slate-400">1-click credentials</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleFillDemo("OWNER")}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-600 transition-all cursor-pointer shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Owner Demo</span>
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo("MEMBER")}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-600 transition-all cursor-pointer shadow-sm"
          >
            <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
            <span>Member Demo</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-[32px] font-bold tracking-tight text-slate-900">
          Welcome Back
        </h2>
        <p className="text-slate-500 text-sm">
          Sign in to your Gym Management account
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-red-600 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form action={formAction} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold text-slate-900">
            Email
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 h-11 rounded-lg text-sm transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-semibold text-slate-900">
            Password
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="pl-9 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 h-11 rounded-lg text-sm transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="remember" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
            <Label htmlFor="remember" className="text-sm font-normal text-slate-600 cursor-pointer">Remember me</Label>
          </div>
          <span className="text-sm text-emerald-600 font-medium hover:text-emerald-700 cursor-pointer">
            Forgot password?
          </span>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-lg bg-[#1a9d5e] hover:bg-[#14834e] text-white font-medium text-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-100"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-white text-slate-400 font-medium tracking-wider">OR</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 rounded-lg bg-white border-slate-200 text-slate-800 hover:bg-slate-50 font-semibold text-sm flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      <div className="flex items-center justify-center gap-2 pt-4">
        <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <span className="text-[13px] text-slate-500">Your data is secure and protected</span>
      </div>
    </div>
  );
}
