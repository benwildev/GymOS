"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dumbbell, 
  Flame, 
  Clock, 
  Calendar, 
  Check, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw 
} from "lucide-react";

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

interface MemberWorkoutClientViewProps {
  plan: any | null;
  currentDay: string;
  groupedExercises: Record<string, any[]>;
  todayExercises: any[];
}

export function MemberWorkoutClientView({
  plan,
  currentDay,
  groupedExercises,
  todayExercises,
}: MemberWorkoutClientViewProps) {
  const [selectedDay, setSelectedDay] = useState(currentDay);
  // Track completed sets in local state for live in-gym tracking: e.g. { "exerciseId-setIndex": true }
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});

  const toggleSet = (exId: string, setIndex: number) => {
    const key = `${exId}-${setIndex}`;
    setCompletedSets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const activeExercises = groupedExercises[selectedDay] || [];
  const isViewingToday = selectedDay === currentDay;

  if (!plan) {
    return (
      <div className="py-20 text-center rounded-2xl border border-dashed bg-white max-w-lg mx-auto p-6 space-y-4">
        <div className="h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
          <Dumbbell className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">No workout plan assigned yet</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Your gym trainer or owner will personalize and assign a customized exercise routine tailored to your fitness goals.
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
              Current Workout Program
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
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Day Selector Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="font-bold text-gray-700 uppercase tracking-wider">Select Training Day</span>
          {isViewingToday && (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Today's Session
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {DAYS_OF_WEEK.map((day) => {
            const count = (groupedExercises[day] || []).length;
            const isSelected = selectedDay === day;
            const isToday = currentDay === day;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`flex-1 min-w-[62px] py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center gap-1 border ${
                  isSelected
                    ? "bg-black text-white border-black shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                }`}
              >
                <span className="text-[11px] font-bold">
                  {day.slice(0, 3)}
                </span>
                <span
                  className={`text-[9px] px-1.5 rounded-full font-bold ${
                    isSelected
                      ? "bg-emerald-400 text-black"
                      : count > 0
                      ? "bg-gray-100 text-gray-700"
                      : "text-gray-400"
                  }`}
                >
                  {count > 0 ? `${count}` : "-"}
                </span>
                {isToday && (
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? "bg-emerald-400" : "bg-emerald-600"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercises Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">
              {selectedDay} {isViewingToday ? "(TODAY)" : ""}
            </h2>
            <Badge variant="outline" className="text-xs">
              {activeExercises.length} {activeExercises.length === 1 ? "Exercise" : "Exercises"}
            </Badge>
          </div>

          {activeExercises.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-7"
              onClick={() => setCompletedSets({})}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset Sets
            </Button>
          )}
        </div>

        {activeExercises.length === 0 ? (
          <div className="py-14 text-center rounded-xl border border-dashed bg-white p-6 space-y-2">
            <Flame className="w-8 h-8 mx-auto text-gray-400" />
            <div className="font-bold text-gray-900 text-sm">Rest & Recovery Day</div>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              No exercises scheduled for {selectedDay.toLowerCase()}. Take time to rest, hydrate, and stretch!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeExercises.map((ex, idx) => {
              const setsCount = ex.sets || 3;

              return (
                <Card
                  key={ex.id || idx}
                  className="shadow-2xs border-gray-200 bg-white overflow-hidden transition-all hover:border-gray-300"
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Exercise Title & Order */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center font-extrabold text-sm font-mono shrink-0 shadow-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight">
                            {ex.exerciseName}
                          </h3>
                          {ex.instructions && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {ex.instructions}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Exercise Target Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <div className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-900 font-bold text-xs flex items-center gap-1">
                        <span className="text-muted-foreground font-normal">Target:</span>
                        <span>{ex.sets} Sets × {ex.reps} Reps</span>
                      </div>

                      {ex.weight > 0 && (
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1">
                          <span className="text-emerald-600 font-normal">Weight:</span>
                          <span>{ex.weight} kg</span>
                        </div>
                      )}

                      {ex.restSeconds > 0 && (
                        <div className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>{ex.restSeconds}s rest</span>
                        </div>
                      )}
                    </div>

                    {/* Interactive Set Tracker Buttons */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Tap sets as you finish:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: setsCount }).map((_, sIdx) => {
                          const isDone = !!completedSets[`${ex.id || idx}-${sIdx}`];

                          return (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => toggleSet(ex.id || String(idx), sIdx)}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                                isDone
                                  ? "bg-emerald-600 text-white shadow-emerald-500/20"
                                  : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 active:scale-95"
                              }`}
                            >
                              {isDone ? (
                                <Check className="w-3.5 h-3.5 text-white" />
                              ) : (
                                <span className="text-gray-400 font-mono font-normal">#{sIdx + 1}</span>
                              )}
                              <span>Set {sIdx + 1}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
