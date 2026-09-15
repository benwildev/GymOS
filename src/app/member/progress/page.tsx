import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getMemberGoals, getMemberProgress } from "@/services/member-progress.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Target,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Dumbbell,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { GoalStatus } from "@prisma/client";

export const metadata = {
  title: "My Fitness Goals | GymOS",
  description: "View and track your fitness goals, milestones, and target timelines.",
};

export default async function MemberGoalsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [goals, progress] = await Promise.all([
    getMemberGoals(userId),
    getMemberProgress(userId),
  ]);

  const activeGoal = progress.activeGoal;
  const completedGoalsCount = goals.filter((g) => g.status === GoalStatus.COMPLETED).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Fitness Goals
          </h1>
          <p className="text-gray-500 text-sm">
            Milestones and targets configured for your fitness journey.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/member/workout">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
              Workout Routine
            </Button>
          </Link>
          <Link href="/member">
            <Button variant="ghost" size="sm" className="gap-1 text-xs text-slate-500">
              Dashboard <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. Active Goal Spotlight */}
      <Card className="rounded-2xl border-slate-200 shadow-2xs overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Current Primary Target</CardTitle>
                <CardDescription className="text-xs text-slate-500">Your current focus in the gym</CardDescription>
              </div>
            </div>
            {activeGoal ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
                Active Goal
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">No Active Goal</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {activeGoal ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 uppercase tracking-wider mb-1">
                    {activeGoal.goalType.replace(/_/g, " ")}
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">{activeGoal.title}</h3>
                  {activeGoal.description && (
                    <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                      {activeGoal.description}
                    </p>
                  )}
                </div>
                {activeGoal.targetValue && (
                  <div className="sm:text-right bg-emerald-50/60 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-emerald-100">
                    <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block">
                      Milestone Target
                    </span>
                    <span className="text-2xl font-black text-emerald-700">
                      {activeGoal.targetValue} {activeGoal.targetUnit || ""}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Started: {format(new Date(activeGoal.startDate), "MMM d, yyyy")}
                </span>
                {activeGoal.targetDate && (
                  <>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 text-slate-700 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Target Date: {format(new Date(activeGoal.targetDate), "MMM d, yyyy")}
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No active goal set</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Ask your gym trainer or coach to configure your milestone target on your next visit to GymOS.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Goal Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Focus
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {activeGoal ? 1 : 0}
          </div>
          <div className="text-[10px] text-slate-500">Currently in progress</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Completed Goals
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {completedGoalsCount}
          </div>
          <div className="text-[10px] text-slate-500">Achieved milestones</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Milestones
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {goals.length}
          </div>
          <div className="text-[10px] text-slate-500">Recorded history</div>
        </div>
      </div>

      {/* 3. Goals History & Milestones List */}
      <Card className="rounded-2xl border-slate-200 shadow-2xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">
            Goals & Milestones History
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            All fitness milestones recorded by you and your gym coach
          </CardDescription>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-800">Your goal tracker is empty</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Discuss with your gym coach on your next session to log your starting target.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Goal & Category</TableHead>
                    <TableHead className="text-xs">Milestone Target</TableHead>
                    <TableHead className="text-xs">Start Date</TableHead>
                    <TableHead className="text-xs">Target Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goals.map((g) => (
                    <TableRow key={g.id} className="text-xs">
                      <TableCell>
                        {g.status === GoalStatus.ACTIVE && (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-[10px]">
                            ACTIVE
                          </Badge>
                        )}
                        {g.status === GoalStatus.COMPLETED && (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold text-[10px]">
                            COMPLETED
                          </Badge>
                        )}
                        {g.status === GoalStatus.CANCELLED && (
                          <Badge variant="outline" className="text-slate-400 text-[10px]">
                            CANCELLED
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900">{g.title}</div>
                        <div className="text-[11px] text-slate-400 uppercase tracking-wider">
                          {g.goalType.replace(/_/g, " ")}
                        </div>
                        {g.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {g.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-slate-800">
                        {g.targetValue ? `${g.targetValue} ${g.targetUnit || ""}` : "—"}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {format(new Date(g.startDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {g.targetDate ? format(new Date(g.targetDate), "MMM d, yyyy") : "Open-ended"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
