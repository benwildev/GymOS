"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Utensils, Clock, Calendar, CheckCircle, Apple, Info } from "lucide-react";

interface MemberDietClientViewProps {
  plan: any | null;
  meals: any[];
}

export function MemberDietClientView({ plan, meals }: MemberDietClientViewProps) {
  if (!plan) {
    return (
      <div className="py-20 text-center rounded-2xl border border-dashed bg-white max-w-lg mx-auto p-6 space-y-4">
        <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <Utensils className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">No diet plan assigned yet</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Your gym trainer or owner will prepare a personalized nutrition routine to fuel your workouts and recovery.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      {/* Plan Header Card */}
      <div className="rounded-2xl border bg-black text-white p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase">
              Current Nutrition Plan
            </span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] font-semibold">
              {plan.status}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{plan.name}</h1>

          {plan.description && (
            <p className="text-xs text-gray-300 font-normal leading-relaxed pt-1">
              {plan.description}
            </p>
          )}

          <div className="pt-3 flex items-center gap-4 text-xs text-gray-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Started {new Date(plan.startDate).toLocaleDateString()}
            </span>
            {plan.endDate && (
              <span>&middot; Ends {new Date(plan.endDate).toLocaleDateString()}</span>
            )}
            <span>&middot; {meals.length} Daily Meals</span>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Daily Routine Timeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            Daily Meal Schedule
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            {meals.length} Scheduled Meals
          </span>
        </div>

        {meals.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-dashed bg-white text-xs text-muted-foreground">
            No specific meals added to this plan yet.
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 border-l-2 border-emerald-300 space-y-5 py-2">
            {meals.map((meal, idx) => (
              <div key={meal.id || idx} className="relative space-y-2">
                {/* Timeline node */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-3 h-4 w-4 rounded-full bg-white border-4 border-emerald-500 shadow-2xs" />

                <Card className="shadow-2xs border-gray-200 bg-white hover:border-gray-300 transition-all">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold font-mono">
                          {idx + 1}
                        </span>
                        <h3 className="font-extrabold text-base text-gray-900 leading-tight">
                          {meal.mealName}
                        </h3>
                      </div>

                      <Badge
                        variant="outline"
                        className="w-fit bg-gray-50 text-gray-800 border-gray-200 font-mono text-xs font-bold px-2.5 py-0.5 flex items-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        {meal.mealTime}
                      </Badge>
                    </div>

                    {/* Food list */}
                    <div className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 text-sm font-medium text-gray-900 leading-relaxed">
                      {meal.food}
                    </div>

                    {/* Instructions */}
                    {meal.instructions && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground pt-0.5">
                        <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{meal.instructions}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
